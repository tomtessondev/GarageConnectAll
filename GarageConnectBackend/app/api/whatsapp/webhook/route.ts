import { NextRequest, NextResponse } from 'next/server';
import { handleWhatsAppMessage } from '@/lib/ai/conversation-handler';
import { isMaintenanceMode, getMaintenanceMessage, shouldBotRespond } from '@/lib/ai/system-prompt';
import { sendWhatsAppMessage } from '@/lib/whatsapp-helpers';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const from = formData.get('From') as string;
    const body = formData.get('Body') as string;
    const messageSid = formData.get('MessageSid') as string;

    const phoneNumber = from ? from.replace('whatsapp:', '') : 'UNKNOWN';

    console.log(`📨 Webhook received from ${phoneNumber}: ${body}`);

    if (!from || !body) {
      console.error('❌ Missing data in webhook');
      return NextResponse.json({ error: 'Missing data' }, { status: 400 });
    }

    // 1. Check maintenance mode
    if (await isMaintenanceMode()) {
      const maintenanceMsg = await getMaintenanceMessage();
      await sendWhatsAppMessage(phoneNumber, maintenanceMsg);
      return NextResponse.json({ success: true, mode: 'maintenance' });
    }

    // 2. Check business hours
    if (!(await shouldBotRespond())) {
      const closedMessage = `🕐 Nous sommes actuellement fermés.\n\n` +
        `Nos horaires:\n` +
        `Lun-Ven: 8h-17h\n` +
        `Sam: 9h-13h\n` +
        `Dim: Fermé\n\n` +
        `Votre message sera traité dès notre ouverture.`;
      
      await sendWhatsAppMessage(phoneNumber, closedMessage);
      return NextResponse.json({ success: true, mode: 'closed' });
    }

    // 3. Process with AI bot
    await handleWhatsAppMessage(phoneNumber, body);
    
    return NextResponse.json({ success: true, mode: 'ai_processed' });
  } catch (error) {
    console.error('❌ Webhook error:', error);
    
    // Try to notify user of error
    try {
      const phoneNumber = (await request.formData()).get('From') as string;
      if (phoneNumber) {
        await sendWhatsAppMessage(
          phoneNumber.replace('whatsapp:', ''),
          '❌ Une erreur est survenue. Veuillez réessayer.'
        );
      }
    } catch (notifyError) {
      console.error('Failed to send error notification:', notifyError);
    }
    
    return NextResponse.json(
      { error: 'Failed to process message' },
      { status: 500 }
    );
  }
}

// GET endpoint for Twilio webhook verification
export async function GET(request: NextRequest) {
  return NextResponse.json({ 
    status: 'ok',
    message: 'GarageConnect WhatsApp webhook is active'
  });
}
