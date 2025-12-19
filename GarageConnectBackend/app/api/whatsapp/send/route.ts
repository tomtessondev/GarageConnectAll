import { NextRequest, NextResponse } from 'next/server';
import { sendWhatsAppMessage } from '@/lib/twilio';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const sendMessageSchema = z.object({
  phoneNumber: z.string(),
  message: z.string(),
  orderId: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { phoneNumber, message, orderId } = sendMessageSchema.parse(body);

    // Envoyer le message
    const twilioMessage = await sendWhatsAppMessage(phoneNumber, message);

    // Trouver le client
    const customer = await prisma.customer.findUnique({
      where: { phoneNumber },
    });

    if (customer) {
      // Trouver ou créer une conversation active
      let conversation = await prisma.conversation.findFirst({
        where: {
          customerId: customer.id,
          status: 'active',
        },
      });

      if (!conversation) {
        conversation = await prisma.conversation.create({
          data: {
            customerId: customer.id,
            phoneNumber,
            state: 'idle',
          },
        });
      }

      // Enregistrer le message
      await prisma.message.create({
        data: {
          conversationId: conversation.id,
          sender: 'assistant',
          content: message,
        },
      });
    }

    return NextResponse.json({ success: true, messageSid: twilioMessage.sid });
  } catch (error) {
    console.error('Send WhatsApp message error:', error);
    return NextResponse.json(
      { error: 'Failed to send message' },
      { status: 500 }
    );
  }
}
