import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { sendWhatsAppMessage } from '@/lib/whatsapp-helpers';

/**
 * Cron job: Payment Reminders
 * Runs every hour to send reminders for pending orders
 * 
 * Configuration in vercel.json:
 * "crons": [{ "path": "/api/cron/payment-reminders", "schedule": "0 * * * *" }]
 */
export async function GET(request: NextRequest) {
  try {
    // Verify cron secret (security)
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('🕐 Running payment reminders cron job...');

    // Find orders pending for more than 1 hour but less than 24 hours
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000); // 1 hour ago
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000); // 24 hours ago

    const pendingOrders = await prisma.order.findMany({
      where: {
        paymentStatus: 'pending',
        createdAt: {
          lte: oneHourAgo, // Created at least 1 hour ago
          gte: twentyFourHoursAgo, // But not more than 24 hours ago
        },
        reminderSent: false, // Reminder not sent yet
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

    console.log(`📨 Found ${pendingOrders.length} orders needing reminders`);

    let successCount = 0;
    let errorCount = 0;

    // Send reminders
    for (const order of pendingOrders) {
      try {
        // Calculate time remaining (session expires after 24h)
        const createdTime = new Date(order.createdAt).getTime();
        const now = Date.now();
        const hoursElapsed = Math.floor((now - createdTime) / (1000 * 60 * 60));
        const hoursRemaining = 24 - hoursElapsed;

        // Get payment URL from session
        let paymentUrl = '';
        if (order.stripeSessionId) {
          try {
            const { stripe } = await import('@/lib/stripe');
            const session = await stripe.checkout.sessions.retrieve(order.stripeSessionId);
            paymentUrl = session.url || '';
          } catch (err) {
            console.error(`Error retrieving session for order ${order.id}:`, err);
          }
        }

        // Build reminder message
        const reminderMessage = `⏰ FINALISEZ VOTRE COMMANDE\n\n` +
          `Bonjour ${order.customer.firstName || 'Client'},\n\n` +
          `Votre commande ${order.orderNumber} est en attente de paiement.\n\n` +
          `━━━━━━━━━━━━━━━━\n` +
          `📦 VOTRE PANIER\n` +
          order.items.map((item, index) => 
            `${index + 1}. ${item.product.brand} ${item.product.model}\n` +
            `   ${item.quantity}x ${item.unitPrice}€`
          ).join('\n') + '\n\n' +
          `━━━━━━━━━━━━━━━━\n` +
          `💰 Total : ${order.totalAmount}€\n\n` +
          `${paymentUrl ? `👉 Finalisez votre paiement maintenant :\n${paymentUrl}\n\n` : ''}` +
          `⚠️ Ce lien expire dans ${hoursRemaining}h\n\n` +
          `━━━━━━━━━━━━━━━━\n` +
          `💡 Pourquoi payer maintenant ?\n` +
          `✅ Stock réservé pour vous\n` +
          `✅ Retrait sous 24-48h\n` +
          `✅ Paiement sécurisé par Stripe\n` +
          `✅ Paiement en 4x sans frais disponible\n\n` +
          `Besoin d'aide ? Répondez à ce message ! 💬`;

        // Send WhatsApp message
        await sendWhatsAppMessage(order.customer.phoneNumber, reminderMessage);

        // Mark reminder as sent
        await prisma.order.update({
          where: { id: order.id },
          data: { reminderSent: true },
        });

        console.log(`✅ Reminder sent for order ${order.orderNumber}`);
        successCount++;

      } catch (error) {
        console.error(`❌ Error sending reminder for order ${order.id}:`, error);
        errorCount++;
      }
    }

    console.log(`✅ Cron job completed: ${successCount} success, ${errorCount} errors`);

    return NextResponse.json({
      success: true,
      processed: pendingOrders.length,
      sent: successCount,
      errors: errorCount,
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    console.error('❌ Cron job error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    );
  }
}
