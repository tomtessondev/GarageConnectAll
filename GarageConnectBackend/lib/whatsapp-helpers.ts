import twilio from 'twilio';

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const whatsappFrom = process.env.TWILIO_WHATSAPP_FROM || 'whatsapp:+14155238886';

const client = twilio(accountSid, authToken);

/**
 * Send WhatsApp text message
 */
export async function sendWhatsAppMessage(to: string, message: string) {
  try {
    // Ensure phone number has whatsapp: prefix
    const formattedTo = to.startsWith('whatsapp:') ? to : `whatsapp:${to}`;

    // Limite WhatsApp : 1600 caractères
    const MAX_LENGTH = 1600;
    let finalMessage = message;
    
    if (message.length > MAX_LENGTH) {
      console.warn(`⚠️ Message trop long (${message.length} chars), troncature à ${MAX_LENGTH}`);
      finalMessage = message.substring(0, MAX_LENGTH - 50) + '\n\n... (message tronqué)';
    }

    const result = await client.messages.create({
      from: whatsappFrom,
      to: formattedTo,
      body: finalMessage,
    });

    console.log(`✅ WhatsApp message sent: ${result.sid}`);
    return result;
  } catch (error) {
    console.error('❌ Error sending WhatsApp message:', error);
    throw error;
  }
}

/**
 * Send WhatsApp message with image
 */
export async function sendWhatsAppImage(
  to: string,
  imageUrl: string,
  caption?: string
) {
  try {
    const formattedTo = to.startsWith('whatsapp:') ? to : `whatsapp:${to}`;

    const result = await client.messages.create({
      from: whatsappFrom,
      to: formattedTo,
      body: caption || '',
      mediaUrl: [imageUrl],
    });

    console.log(`✅ WhatsApp image sent: ${result.sid}`);
    return result;
  } catch (error) {
    console.error('❌ Error sending WhatsApp image:', error);
    throw error;
  }
}

/**
 * Send WhatsApp message with document (PDF)
 */
export async function sendWhatsAppDocument(
  to: string,
  documentUrl: string,
  filename: string
) {
  try {
    const formattedTo = to.startsWith('whatsapp:') ? to : `whatsapp:${to}`;

    const result = await client.messages.create({
      from: whatsappFrom,
      to: formattedTo,
      body: `📄 ${filename}`,
      mediaUrl: [documentUrl],
    });

    console.log(`✅ WhatsApp document sent: ${result.sid}`);
    return result;
  } catch (error) {
    console.error('❌ Error sending WhatsApp document:', error);
    throw error;
  }
}

/**
 * Format phone number for WhatsApp
 * Ensures it starts with +
 */
export function formatPhoneNumber(phoneNumber: string): string {
  // Remove any existing whatsapp: prefix
  let cleaned = phoneNumber.replace('whatsapp:', '');

  // Remove spaces and dashes
  cleaned = cleaned.replace(/[\s-]/g, '');

  // Add + if not present
  if (!cleaned.startsWith('+')) {
    cleaned = `+${cleaned}`;
  }

  return cleaned;
}

/**
 * Extract phone number from WhatsApp format
 * whatsapp:+1234567890 -> +1234567890
 */
export function extractPhoneNumber(whatsappNumber: string): string {
  return whatsappNumber.replace('whatsapp:', '');
}
