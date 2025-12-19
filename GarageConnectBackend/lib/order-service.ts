import { prisma } from '@/lib/prisma';
import { stripe } from '@/lib/stripe';
import { format } from 'date-fns';
import { clearCart } from './cart-service';
import { sendWhatsAppMessage } from './whatsapp-helpers';
import { hasCompleteInfo } from './customer-info-service';

/**
 * Generate unique order number
 * Format: GC-YYYYMMDD-XXX
 */
export async function generateOrderNumber(): Promise<string> {
  const today = format(new Date(), 'yyyyMMdd');
  const prefix = `GC-${today}`;

  // Count orders today
  const count = await prisma.order.count({
    where: {
      orderNumber: {
        startsWith: prefix,
      },
    },
  });

  const sequence = String(count + 1).padStart(3, '0');
  return `${prefix}-${sequence}`;
}

/**
 * Calculate order totals
 */
function calculateTotals(items: Array<{ quantity: number; priceRetail: number }>) {
  const subtotal = items.reduce((sum, item) => {
    return sum + item.quantity * Number(item.priceRetail);
  }, 0);

  // No tax for now, but can be configured
  const tax = 0;
  
  // Free shipping
  const shipping = 0;

  const total = subtotal + tax + shipping;

  return {
    subtotal: Number(subtotal.toFixed(2)),
    tax: Number(tax.toFixed(2)),
    shipping: Number(shipping.toFixed(2)),
    total: Number(total.toFixed(2)),
  };
}

/**
 * Parse delivery address
 */
function parseDeliveryAddress(addressString: string) {
  // Try to parse: "15 Rue des Palmiers, Pointe-à-Pitre, 97110"
  const parts = addressString.split(',').map(p => p.trim());

  if (parts.length < 2) {
    throw new Error('Format d\'adresse invalide. Utilisez: Rue, Ville, Code postal');
  }

  let address = parts[0];
  let city = '';
  let postalCode = '';

  if (parts.length === 2) {
    // "Rue, Ville"
    city = parts[1];
  } else if (parts.length === 3) {
    // "Rue, Ville, Code postal"
    city = parts[1];
    postalCode = parts[2];
  } else {
    // More parts, combine first ones as address
    address = parts.slice(0, -2).join(', ');
    city = parts[parts.length - 2];
    postalCode = parts[parts.length - 1];
  }

  return {
    address,
    city,
    postalCode: postalCode || '97110',
    country: 'Guadeloupe',
  };
}

/**
 * Create order from cart
 * ⚡ PHASE 3 OPTIMIZED: Parallel operations
 */
export async function createOrderFromCart(
  customerId: string,
  deliveryAddressString: string,
  conversationId?: string
) {
  // 1. Get cart & generate order number IN PARALLEL ⚡
  const [cart, orderNumber] = await Promise.all([
    prisma.cart.findFirst({
      where: {
        customerId,
        expiresAt: { gt: new Date() },
      },
      include: {
        items: {
          include: {
            product: true,
          },
        },
      },
    }),
    generateOrderNumber(), // ⚡ Parallel!
  ]);

  if (!cart || cart.items.length === 0) {
    throw new Error('Panier vide');
  }

  // 2. Parse address (fast, sync)
  const delivery = parseDeliveryAddress(deliveryAddressString);

  // 3. Calculate totals (fast, sync)
  const totals = calculateTotals(
    cart.items.map(item => ({
      quantity: item.quantity,
      priceRetail: Number(item.product.priceRetail),
    }))
  );

  // 4. Create order (already has orderNumber from parallel query)
  const order = await prisma.order.create({
    data: {
      customerId,
      conversationId,
      orderNumber,
      subtotal: totals.subtotal,
      tax: totals.tax,
      shipping: totals.shipping,
      totalAmount: totals.total,
      status: 'pending',
      paymentStatus: 'pending',
      deliveryAddress: delivery.address,
      deliveryCity: delivery.city,
      deliveryPostalCode: delivery.postalCode,
      deliveryCountry: delivery.country,
      items: {
        create: cart.items.map(item => ({
          productId: item.productId,
          quantity: item.quantity,
          unitPrice: item.product.priceRetail,
          subtotal: Number(item.product.priceRetail) * item.quantity,
        })),
      },
    },
    include: {
      items: {
        include: {
          product: true,
        },
      },
      customer: true, // ⚡ Include customer to avoid extra query later
    },
  });

  // 5. Clear cart (fire and forget - no need to await)
  clearCart(customerId).catch(err => 
    console.error('Error clearing cart:', err)
  );

  return order;
}

/**
 * Create Stripe Checkout Session for order
 * ✅ NEW: Uses Checkout Session instead of Payment Intent for real payment URL
 * ⚡ PHASE 3 OPTIMIZED: Parallel DB updates
 */
export async function createCheckoutSession(orderId: string) {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: {
      customer: true,
      items: {
        include: {
          product: true,
        },
      },
    },
  });

  if (!order) {
    throw new Error('Commande introuvable');
  }

  // Get base URL from environment
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://your-domain.vercel.app';

  // Create Checkout Session
  const session = await stripe.checkout.sessions.create({
    mode: 'payment',
    payment_method_types: ['card'],
    line_items: order.items.map(item => ({
      price_data: {
        currency: 'eur',
        product_data: {
          name: `${item.product.brand} ${item.product.model}`,
          description: `${item.product.dimensions} - ${item.product.category}`,
        },
        unit_amount: Math.round(Number(item.unitPrice) * 100), // Convert to cents
      },
      quantity: item.quantity,
    })),
    metadata: {
      orderId: order.id,
      orderNumber: order.orderNumber,
      customerId: order.customerId,
    },
    customer_email: order.customer.email || undefined,
    success_url: `${baseUrl}/payment/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${baseUrl}/payment/cancel?order_id=${order.id}`,
    expires_at: Math.floor(Date.now() / 1000) + (24 * 3600), // Expire dans 24h
  });

  // ⚡ PARALLEL: Update order + Create payment record at the same time
  await Promise.all([
    prisma.order.update({
      where: { id: orderId },
      data: {
        stripeSessionId: session.id,
        paymentMethod: 'stripe',
      },
    }),
    prisma.payment.create({
      data: {
        orderId: order.id,
        amount: order.totalAmount,
        method: 'stripe',
        status: 'pending',
        metadata: {
          stripeSessionId: session.id,
        } as any,
      },
    }),
  ]);

  return {
    session,
    paymentUrl: session.url!, // ✅ REAL Stripe Checkout URL!
  };
}

/**
 * Create Stripe Payment Intent for order
 * ⚠️ DEPRECATED: Use createCheckoutSession instead
 * ⚡ PHASE 3 OPTIMIZED: Parallel DB updates
 */
export async function createPaymentIntent(orderId: string) {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: {
      customer: true,
      items: {
        include: {
          product: true,
        },
      },
    },
  });

  if (!order) {
    throw new Error('Commande introuvable');
  }

  // Create payment intent
  const paymentIntent = await stripe.paymentIntents.create({
    amount: Math.round(Number(order.totalAmount) * 100), // Convert to cents
    currency: 'eur',
    metadata: {
      orderId: order.id,
      orderNumber: order.orderNumber,
      customerId: order.customerId,
    },
    description: `Commande ${order.orderNumber} - ${order.items.length} article(s)`,
  });

  // ⚡ PARALLEL: Update order + Create payment record at the same time
  await Promise.all([
    prisma.order.update({
      where: { id: orderId },
      data: {
        stripePaymentIntentId: paymentIntent.id,
        paymentMethod: 'stripe',
      },
    }),
    prisma.payment.create({
      data: {
        orderId: order.id,
        amount: order.totalAmount,
        method: 'stripe',
        status: 'pending',
        stripePaymentIntentId: paymentIntent.id,
      },
    }),
  ]);

  return {
    paymentIntent,
    paymentUrl: `https://checkout.stripe.com/c/pay/${paymentIntent.client_secret}`,
  };
}

/**
 * Format order confirmation message
 */
export function formatOrderConfirmation(order: any, paymentUrl: string): string {
  let message = `✅ COMMANDE CONFIRMÉE\n\n`;
  message += `n━━━━━\n`;
  message += `📋 Numéro: ${order.orderNumber}\n`;
  
  if (order.customer) {
    message += `👤 Client: ${order.customer.firstName} ${order.customer.lastName}\n`;
  }
  message += `\n`;

  message += `📦 Articles:\n`;
  order.items.forEach((item: any, index: number) => {
    message += `${index + 1}. ${item.product.brand} ${item.product.model}\n`;
    message += `   ${item.quantity}x ${item.unitPrice}€ = ${item.subtotal}€\n`;
  });

  message += `\n━━━━━\n`;
  message += `💰 Total: ${order.totalAmount}€\n`;
  message += `n━━━━━\n\n`;

  message += `📍 Livraison:\n`;
  message += `${order.deliveryAddress}\n`;
  message += `${order.deliveryCity}, ${order.deliveryPostalCode}\n\n`;

  message += `💳 PAIEMENT SÉCURISÉ\n`;
  message += `Cliquez sur ce lien pour payer:\n`;
  message += `${paymentUrl}\n\n`;
  
  message += `🎁 Paiement en 4x sans frais disponible !\n\n`;

  message += `Après paiement, vous recevrez:\n`;
  message += `✅ Confirmation instantanée\n`;
  message += `📄 Facture PDF par WhatsApp et email\n`;
  message += `📱 QR code pour le retrait\n`;
  message += `📧 Email de confirmation\n\n`;

  message += `Merci de votre confiance ! 🙏`;

  return message;
}

/**
 * Confirm order after payment success
 */
export async function confirmOrder(orderId: string) {
  const order = await prisma.order.update({
    where: { id: orderId },
    data: {
      status: 'confirmed',
      paymentStatus: 'paid',
    },
    include: {
      customer: true,
      items: {
        include: {
          product: true,
        },
      },
    },
  });

  // Create pickup tracking
  await prisma.pickupTracking.create({
    data: {
      orderId: order.id,
      status: 'pending',
    },
  });

  // Send confirmation message
  const message = `🎉 PAIEMENT CONFIRMÉ !\n\n` +
    `Votre commande ${order.orderNumber} est validée.\n\n` +
    `📦 Retrait disponible sous 24-48h\n` +
    `📍 À notre entrepôt en Guadeloupe\n\n` +
    `Vous allez recevoir votre QR code de retrait dans quelques instants...`;

  await sendWhatsAppMessage(order.customer.phoneNumber, message);

  return order;
}

/**
 * Get order by number
 */
export async function getOrderByNumber(orderNumber: string) {
  return await prisma.order.findUnique({
    where: { orderNumber },
    include: {
      customer: true,
      items: {
        include: {
          product: true,
        },
      },
      payments: true,
      invoice: true,
      pickupTracking: true,
    },
  });
}

/**
 * Get customer orders
 */
export async function getCustomerOrders(customerId: string) {
  return await prisma.order.findMany({
    where: { customerId },
    orderBy: { createdAt: 'desc' },
    include: {
      items: {
        include: {
          product: true,
        },
      },
    },
  });
}

/**
 * Update order status
 */
export async function updateOrderStatus(
  orderId: string,
  status: string,
  notes?: string
) {
  return await prisma.order.update({
    where: { id: orderId },
    data: {
      status: status as any,
      notes,
    },
  });
}

/**
 * Mark order as ready for pickup
 */
export async function markOrderReadyForPickup(orderId: string) {
  const order = await prisma.order.update({
    where: { id: orderId },
    data: {
      status: 'ready_pickup',
    },
    include: {
      customer: true,
    },
  });

  // Update pickup tracking
  await prisma.pickupTracking.updateMany({
    where: { orderId },
    data: {
      status: 'pending',
    },
  });

  // Notify customer
  const message = `📦 PRÊT POUR RETRAIT !\n\n` +
    `Votre commande ${order.orderNumber} est disponible.\n\n` +
    `Présentez votre QR code lors du retrait.\n\n` +
    `Horaires: Lun-Ven 8h-17h, Sam 9h-13h`;

  await sendWhatsAppMessage(order.customer.phoneNumber, message);

  return order;
}
