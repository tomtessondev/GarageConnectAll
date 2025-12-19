import { prisma } from '@/lib/prisma';
import { addHours } from 'date-fns';

/**
 * Get or create cart for customer
 */
export async function getOrCreateCart(customerId: string) {
  // Check for existing active cart
  let cart = await prisma.cart.findFirst({
    where: {
      customerId,
      expiresAt: {
        gt: new Date(), // Not expired
      },
    },
    include: {
      items: {
        include: {
          product: true,
        },
      },
    },
  });

  // Create new cart if none exists or expired
  if (!cart) {
    cart = await prisma.cart.create({
      data: {
        customerId,
        expiresAt: addHours(new Date(), 24), // Expire in 24h
      },
      include: {
        items: {
          include: {
            product: true,
          },
        },
      },
    });
  }

  return cart;
}

/**
 * Add item to cart
 */
export async function addToCart(
  customerId: string,
  productId: string,
  quantity: number
) {
  const cart = await getOrCreateCart(customerId);

  // Check if item already exists in cart
  const existingItem = await prisma.cartItem.findFirst({
    where: {
      cartId: cart.id,
      productId,
    },
  });

  if (existingItem) {
    // Update quantity
    return await prisma.cartItem.update({
      where: { id: existingItem.id },
      data: {
        quantity: existingItem.quantity + quantity,
      },
      include: {
        product: true,
      },
    });
  }

  // Create new item
  return await prisma.cartItem.create({
    data: {
      cartId: cart.id,
      productId,
      quantity,
    },
    include: {
      product: true,
    },
  });
}

/**
 * Get cart with items
 */
export async function getCart(customerId: string) {
  return await getOrCreateCart(customerId);
}

/**
 * Update cart item quantity
 */
export async function updateCartItem(cartItemId: string, quantity: number) {
  if (quantity <= 0) {
    return await removeFromCart(cartItemId);
  }

  return await prisma.cartItem.update({
    where: { id: cartItemId },
    data: { quantity },
    include: {
      product: true,
    },
  });
}

/**
 * Remove item from cart
 */
export async function removeFromCart(cartItemId: string) {
  return await prisma.cartItem.delete({
    where: { id: cartItemId },
  });
}

/**
 * Clear entire cart
 */
export async function clearCart(customerId: string) {
  const cart = await prisma.cart.findFirst({
    where: { customerId },
  });

  if (!cart) {
    return null;
  }

  await prisma.cartItem.deleteMany({
    where: { cartId: cart.id },
  });

  return cart;
}

/**
 * Get cart total
 */
export async function getCartTotal(customerId: string): Promise<number> {
  const cart = await getCart(customerId);

  if (!cart || cart.items.length === 0) {
    return 0;
  }

  let total = 0;
  for (const item of cart.items) {
    total += Number(item.product.priceRetail) * item.quantity;
  }

  return total;
}

/**
 * Format cart for WhatsApp message
 */
export async function formatCartMessage(customerId: string): Promise<string> {
  const cart = await getCart(customerId);

  if (!cart || cart.items.length === 0) {
    return '🛒 Votre panier est vide.\n\nCommencez par rechercher des pneus ! 🔍';
  }

  let message = '🛒 VOTRE PANIER\n\n';
  let total = 0;

  cart.items.forEach((item, index) => {
    const itemTotal = Number(item.product.priceRetail) * item.quantity;
    total += itemTotal;

    message += `${index + 1}. ${item.product.brand} ${item.product.model}\n`;
    message += `   ${item.product.dimensions}\n`;
    message += `   ${item.quantity}x ${item.product.priceRetail}€ = ${itemTotal}€\n\n`;
  });

  message += `━━━━━━━━━━━━━━━━\n`;
  message += `💰 TOTAL: ${total}€\n`;
  message += `━━━━━━━━━━━━━━━━\n\n`;
  message += `Que souhaitez-vous faire ?\n`;
  message += `• Continuer mes achats\n`;
  message += `• Passer commande\n`;
  message += `• Vider mon panier`;

  return message;
}

/**
 * Clean expired carts (cron job)
 */
export async function cleanExpiredCarts() {
  const now = new Date();

  // Delete expired carts
  const result = await prisma.cart.deleteMany({
    where: {
      expiresAt: {
        lt: now,
      },
    },
  });

  console.log(`🧹 Cleaned ${result.count} expired carts`);
  return result.count;
}

/**
 * Extend cart expiration
 */
export async function extendCartExpiration(customerId: string) {
  const cart = await prisma.cart.findFirst({
    where: { customerId },
  });

  if (!cart) {
    return null;
  }

  return await prisma.cart.update({
    where: { id: cart.id },
    data: {
      expiresAt: addHours(new Date(), 24),
    },
  });
}

/**
 * Get cart item count
 */
export async function getCartItemCount(customerId: string): Promise<number> {
  const cart = await getCart(customerId);
  return cart.items.reduce((sum, item) => sum + item.quantity, 0);
}

/**
 * Check if product is in cart
 */
export async function isProductInCart(
  customerId: string,
  productId: string
): Promise<boolean> {
  const cart = await prisma.cart.findFirst({
    where: { customerId },
    include: {
      items: {
        where: { productId },
      },
    },
  });

  return (cart?.items.length ?? 0) > 0;
}
