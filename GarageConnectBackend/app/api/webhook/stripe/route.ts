import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { prisma } from '@/lib/prisma';
import { confirmOrder } from '@/lib/order-service';
import { generateQRCodeBuffer } from '@/lib/qrcode-service';
import { sendWhatsAppImage, sendWhatsAppMessage } from '@/lib/whatsapp-helpers';
import { sendOrderConfirmationEmail, sendPaymentFailedEmail } from '@/lib/email-service';
import Stripe from 'stripe';

/**
 * Stripe webhook handler
 * Handles payment events
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const signature = request.headers.get('stripe-signature');

    if (!signature) {
      return NextResponse.json(
        { error: 'Missing stripe signature' },
        { status: 400 }
      );
    }

    // Verify webhook signature
    let event: Stripe.Event;
    try {
      event = stripe.webhooks.constructEvent(
        body,
        signature,
        process.env.STRIPE_WEBHOOK_SECRET || ''
      );
    } catch (err) {
      console.error('Webhook signature verification failed:', err);
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 400 }
      );
    }

    // Handle the event
    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutSessionCompleted(event.data.object as Stripe.Checkout.Session);
        break;

      case 'checkout.session.expired':
        await handleCheckoutSessionExpired(event.data.object as Stripe.Checkout.Session);
        break;

      case 'payment_intent.succeeded':
        await handlePaymentSuccess(event.data.object as Stripe.PaymentIntent);
        break;

      case 'payment_intent.payment_failed':
        await handlePaymentFailed(event.data.object as Stripe.PaymentIntent);
        break;

      case 'payment_intent.canceled':
        await handlePaymentCanceled(event.data.object as Stripe.PaymentIntent);
        break;

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json(
      { error: 'Webhook handler failed' },
      { status: 500 }
    );
  }
}

/**
 * ✅ NEW: Handle Checkout Session Completed (Payment Success)
 * This is the main webhook for Stripe Checkout
 */
async function handleCheckoutSessionCompleted(session: Stripe.Checkout.Session) {
  const orderId = session.metadata?.orderId;

  if (!orderId) {
    console.error('No orderId in checkout session metadata');
    return;
  }

  console.log(`💳 Checkout session completed for order ${orderId}`);

  // Confirm order
  const order = await confirmOrder(orderId);

  // Update payment record
  await prisma.payment.updateMany({
    where: {
      orderId,
    },
    data: {
      status: 'paid',
      metadata: {
        stripeSessionId: session.id,
        stripePaymentIntentId: session.payment_intent as string,
      } as any,
    },
  });

  // Get full order details with customer info
  const fullOrder = await prisma.order.findUnique({
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

  if (!fullOrder) {
    console.error('Order not found:', orderId);
    return;
  }

  const customerName = fullOrder.customer.firstName 
    ? `${fullOrder.customer.firstName} ${fullOrder.customer.lastName}`
    : 'Client';

  // Send email confirmation (non-blocking)
  try {
    await sendOrderConfirmationEmail(fullOrder);
    console.log(`✅ Confirmation email sent to ${fullOrder.customer.email}`);
  } catch (error) {
    console.error('Error sending confirmation email:', error);
    // Continue even if email fails
  }

  // ✅ NEW: Send automatic thank you message + QR code
  try {
    const qrCodeBuffer = await generateQRCodeBuffer(orderId);
    
    const whatsappMessage = `🎉 MERCI POUR VOTRE COMMANDE !\n\n` +
      `✅ Paiement confirmé : ${fullOrder.totalAmount}€\n` +
      `📋 Commande : ${fullOrder.orderNumber}\n\n` +
      `━━━━━━━━━━━━━━━━\n` +
      `📦 PROCHAINES ÉTAPES\n\n` +
      `1️⃣ Préparation : 24-48h\n` +
      `2️⃣ Vous recevrez un QR code de retrait ⬇️\n` +
      `3️⃣ Présentez-le à notre entrepôt\n\n` +
      `━━━━━━━━━━━━━━━━\n` +
      `📍 RETRAIT EN MAGASIN\n` +
      `Adresse : [Votre adresse]\n` +
      `Guadeloupe\n\n` +
      `⏰ HORAIRES\n` +
      `Lundi - Samedi : 8h - 18h\n` +
      `Dimanche : Fermé\n\n` +
      `━━━━━━━━━━━━━━━━\n` +
      `📧 Email de confirmation envoyé à :\n` +
      `${fullOrder.customer.email}\n\n` +
      `❓ Des questions ? Répondez à ce message !\n\n` +
      `Merci de votre confiance ! 🙏`;

    await sendWhatsAppMessage(fullOrder.customer.phoneNumber, whatsappMessage);
    
    // TODO: Send QR code image via WhatsApp
    // await sendWhatsAppImage(fullOrder.customer.phoneNumber, qrCodeBuffer);
    
    console.log(`✅ Thank you message sent to ${fullOrder.customer.phoneNumber}`);
  } catch (error) {
    console.error('Error in post-payment flow:', error);
    
    // Send fallback message
    await sendWhatsAppMessage(
      fullOrder.customer.phoneNumber,
      `✅ Paiement confirmé !\n\n` +
      `Votre commande ${fullOrder.orderNumber} est validée.\n` +
      `Un email de confirmation vous a été envoyé.\n\n` +
      `Vous recevrez votre QR code de retrait prochainement.`
    );
  }
}

/**
 * ✅ NEW: Handle Checkout Session Expired (No payment after 24h)
 */
async function handleCheckoutSessionExpired(session: Stripe.Checkout.Session) {
  const orderId = session.metadata?.orderId;

  if (!orderId) {
    console.error('No orderId in expired checkout session metadata');
    return;
  }

  console.log(`⏰ Checkout session expired for order ${orderId}`);

  // Update order status
  await prisma.order.update({
    where: { id: orderId },
    data: {
      status: 'cancelled',
      paymentStatus: 'failed',
    },
  });

  // Get order details
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: {
      customer: true,
    },
  });

  if (order) {
    // Send notification
    const message = `⏰ LIEN DE PAIEMENT EXPIRÉ\n\n` +
      `Le lien de paiement pour la commande ${order.orderNumber} a expiré.\n\n` +
      `💡 Pas d'inquiétude !\n` +
      `Vous pouvez créer une nouvelle commande en me parlant.\n\n` +
      `Besoin d'aide ? Je suis là ! 💬`;

    await sendWhatsAppMessage(order.customer.phoneNumber, message);
  }
}

/**
 * Handle successful payment
 */
async function handlePaymentSuccess(paymentIntent: Stripe.PaymentIntent) {
  const orderId = paymentIntent.metadata.orderId;

  if (!orderId) {
    console.error('No orderId in payment intent metadata');
    return;
  }

  console.log(`💳 Payment succeeded for order ${orderId}`);

  // Confirm order
  const order = await confirmOrder(orderId);

  // Update payment record
  await prisma.payment.updateMany({
    where: {
      orderId,
      stripePaymentIntentId: paymentIntent.id,
    },
    data: {
      status: 'paid',
    },
  });

  // Get full order details with customer info
  const fullOrder = await prisma.order.findUnique({
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

  if (!fullOrder) {
    console.error('Order not found:', orderId);
    return;
  }

  const customerName = fullOrder.customer.firstName 
    ? `${fullOrder.customer.firstName} ${fullOrder.customer.lastName}`
    : 'Client';

  // Send email confirmation (non-blocking)
  try {
    await sendOrderConfirmationEmail(fullOrder);
    console.log(`✅ Confirmation email sent to ${fullOrder.customer.email}`);
  } catch (error) {
    console.error('Error sending confirmation email:', error);
    // Continue even if email fails
  }

  // Generate and send QR code
  try {
    const qrCodeBuffer = await generateQRCodeBuffer(orderId);
    
    // Improved WhatsApp message (Phase 7)
    const whatsappMessage = `🎉 PAIEMENT CONFIRMÉ !\n\n` +
      `Merci ${customerName} pour votre confiance ! ✨\n\n` +
      `━━━━━━━━━━━━━━━━\n` +
      `📦 VOTRE COMMANDE\n` +
      `Numéro : ${fullOrder.orderNumber}\n` +
      `Montant : ${fullOrder.totalAmount}€\n` +
      `Statut : ✅ Payée\n\n` +
      `━━━━━━━━━━━━━━━━\n` +
      `📋 PROCHAINES ÉTAPES\n\n` +
      `1️⃣ Vous recevez ce QR CODE ⬇️\n` +
      `2️⃣ Votre commande sera préparée sous 24-48h\n` +
      `3️⃣ Nous vous préviendrons par WhatsApp\n` +
      `4️⃣ Présentez votre QR code à l'entrepôt\n\n` +
      `📍 ADRESSE RETRAIT\n` +
      `[Votre adresse à compléter]\n` +
      `Guadeloupe\n\n` +
      `⏰ HORAIRES\n` +
      `Lundi - Samedi : 8h - 18h\n` +
      `Dimanche : Fermé\n\n` +
      `━━━━━━━━━━━━━━━━\n` +
      `📧 Un email de confirmation vous a été envoyé à :\n` +
      `${fullOrder.customer.email}\n\n` +
      `❓ Des questions ? Répondez à ce message !\n\n` +
      `Merci et à bientôt ! 🚗💨`;

    await sendWhatsAppMessage(fullOrder.customer.phoneNumber, whatsappMessage);
    
    // TODO: Send QR code image via WhatsApp
    // await sendWhatsAppImage(fullOrder.customer.phoneNumber, qrCodeBuffer);
    
    console.log(`✅ Confirmation message sent to ${fullOrder.customer.phoneNumber}`);
  } catch (error) {
    console.error('Error in post-payment flow:', error);
    
    // Send fallback message
    await sendWhatsAppMessage(
      fullOrder.customer.phoneNumber,
      `✅ Paiement confirmé !\n\n` +
      `Votre commande ${fullOrder.orderNumber} est validée.\n` +
      `Un email de confirmation vous a été envoyé.\n\n` +
      `Vous recevrez votre QR code de retrait prochainement.`
    );
  }
}

/**
 * Handle failed payment
 */
async function handlePaymentFailed(paymentIntent: Stripe.PaymentIntent) {
  const orderId = paymentIntent.metadata.orderId;

  if (!orderId) {
    return;
  }

  console.log(`❌ Payment failed for order ${orderId}`);

  // Update order status
  await prisma.order.update({
    where: { id: orderId },
    data: {
      paymentStatus: 'failed',
    },
  });

  // Update payment record
  await prisma.payment.updateMany({
    where: {
      orderId,
      stripePaymentIntentId: paymentIntent.id,
    },
    data: {
      status: 'failed',
    },
  });

  // Get order details
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

  if (order) {
    // Send email notification
    try {
      await sendPaymentFailedEmail(order, paymentIntent.last_payment_error?.message);
      console.log(`✅ Payment failed email sent to ${order.customer.email}`);
    } catch (error) {
      console.error('Error sending payment failed email:', error);
    }

    // Send WhatsApp notification
    const message = `❌ PAIEMENT ÉCHOUÉ\n\n` +
      `Votre paiement pour la commande ${order.orderNumber} n'a pas pu être traité.\n\n` +
      `Raison: ${paymentIntent.last_payment_error?.message || 'Erreur inconnue'}\n\n` +
      `Vous pouvez:\n` +
      `• Réessayer le paiement\n` +
      `• Contacter notre support\n\n` +
      `Votre panier reste disponible 24h.`;

    await sendWhatsAppMessage(order.customer.phoneNumber, message);
  }
}

/**
 * Handle canceled payment
 */
async function handlePaymentCanceled(paymentIntent: Stripe.PaymentIntent) {
  const orderId = paymentIntent.metadata.orderId;

  if (!orderId) {
    return;
  }

  console.log(`🚫 Payment canceled for order ${orderId}`);

  // Update order status
  await prisma.order.update({
    where: { id: orderId },
    data: {
      status: 'cancelled',
      paymentStatus: 'failed',
    },
  });

  // Update payment record
  await prisma.payment.updateMany({
    where: {
      orderId,
      stripePaymentIntentId: paymentIntent.id,
    },
    data: {
      status: 'failed',
    },
  });
}
