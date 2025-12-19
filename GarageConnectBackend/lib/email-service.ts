import { Resend } from 'resend';

// Initialize Resend client
const resend = new Resend(process.env.RESEND_API_KEY);

/**
 * Send order confirmation email
 */
export async function sendOrderConfirmationEmail(order: any) {
  try {
    // Check if customer has email
    if (!order.customer || !order.customer.email) {
      console.warn('No customer email found for order:', order.orderNumber);
      return;
    }

    const { data, error } = await resend.emails.send({
      from: 'GarageConnect <noreply@garageconnect.gp>',
      to: order.customer.email,
      subject: `✅ Confirmation commande ${order.orderNumber}`,
      html: generateOrderConfirmationHTML(order),
    });

    if (error) {
      console.error('Error sending email:', error);
      throw new Error('Failed to send email');
    }

    console.log('✅ Email sent successfully:', data);
    return data;
  } catch (error) {
    console.error('Error in sendOrderConfirmationEmail:', error);
    throw error;
  }
}

/**
 * Generate HTML template for order confirmation email
 */
function generateOrderConfirmationHTML(order: any): string {
  const customerName = order.customer.firstName 
    ? `${order.customer.firstName} ${order.customer.lastName}`
    : 'Client';

  let html = `
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Confirmation de commande</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
      background-color: #f5f5f5;
    }
    .container {
      background-color: #ffffff;
      border-radius: 8px;
      padding: 30px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }
    .header {
      text-align: center;
      border-bottom: 3px solid #2196F3;
      padding-bottom: 20px;
      margin-bottom: 30px;
    }
    .header h1 {
      color: #2196F3;
      margin: 0;
      font-size: 28px;
    }
    .order-number {
      background-color: #f0f8ff;
      padding: 15px;
      border-radius: 5px;
      margin: 20px 0;
      text-align: center;
    }
    .order-number strong {
      font-size: 20px;
      color: #2196F3;
    }
    .section {
      margin: 25px 0;
    }
    .section-title {
      font-size: 18px;
      font-weight: bold;
      color: #2196F3;
      margin-bottom: 15px;
      border-bottom: 2px solid #e0e0e0;
      padding-bottom: 5px;
    }
    .items-table {
      width: 100%;
      border-collapse: collapse;
      margin: 15px 0;
    }
    .items-table th {
      background-color: #f5f5f5;
      padding: 12px;
      text-align: left;
      font-weight: bold;
      border-bottom: 2px solid #ddd;
    }
    .items-table td {
      padding: 12px;
      border-bottom: 1px solid #eee;
    }
    .total-row {
      font-weight: bold;
      font-size: 18px;
      background-color: #f0f8ff;
    }
    .info-box {
      background-color: #f9f9f9;
      border-left: 4px solid #2196F3;
      padding: 15px;
      margin: 15px 0;
    }
    .success-icon {
      color: #4CAF50;
      font-size: 48px;
      text-align: center;
      margin: 20px 0;
    }
    .footer {
      margin-top: 40px;
      padding-top: 20px;
      border-top: 2px solid #e0e0e0;
      text-align: center;
      color: #666;
      font-size: 14px;
    }
    .button {
      display: inline-block;
      background-color: #2196F3;
      color: white !important;
      padding: 12px 30px;
      text-decoration: none;
      border-radius: 5px;
      margin: 10px 0;
      font-weight: bold;
    }
    .steps {
      background-color: #f0f8ff;
      padding: 20px;
      border-radius: 5px;
      margin: 20px 0;
    }
    .step {
      margin: 10px 0;
      padding-left: 30px;
      position: relative;
    }
    .step::before {
      content: "✓";
      position: absolute;
      left: 0;
      color: #4CAF50;
      font-weight: bold;
      font-size: 20px;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🚗 GarageConnect</h1>
      <p style="color: #666; margin: 10px 0 0 0;">Votre spécialiste pneus en Guadeloupe</p>
    </div>

    <div class="success-icon">✅</div>
    
    <h2 style="text-align: center; color: #333;">Merci pour votre commande !</h2>
    <p style="text-align: center; color: #666;">Bonjour ${customerName},</p>
    <p style="text-align: center;">Votre paiement a été confirmé avec succès.</p>

    <div class="order-number">
      <p style="margin: 0; color: #666;">Numéro de commande</p>
      <strong>${order.orderNumber}</strong>
    </div>

    <div class="section">
      <div class="section-title">📦 Détails de votre commande</div>
      <table class="items-table">
        <thead>
          <tr>
            <th>Article</th>
            <th style="text-align: center;">Qté</th>
            <th style="text-align: right;">Prix</th>
          </tr>
        </thead>
        <tbody>`;

  // Add order items
  order.items.forEach((item: any) => {
    html += `
          <tr>
            <td>
              <strong>${item.product.brand} ${item.product.model}</strong><br>
              <small style="color: #666;">${item.product.dimensions}</small>
            </td>
            <td style="text-align: center;">${item.quantity}</td>
            <td style="text-align: right;">${Number(item.subtotal).toFixed(2)}€</td>
          </tr>`;
  });

  html += `
        </tbody>
        <tfoot>
          <tr class="total-row">
            <td colspan="2">Total</td>
            <td style="text-align: right;">${Number(order.totalAmount).toFixed(2)}€</td>
          </tr>
        </tfoot>
      </table>
    </div>

    <div class="section">
      <div class="section-title">📍 Adresse de livraison</div>
      <div class="info-box">
        ${order.deliveryAddress}<br>
        ${order.deliveryCity}, ${order.deliveryPostalCode}<br>
        ${order.deliveryCountry}
      </div>
    </div>

    <div class="section">
      <div class="section-title">📋 Prochaines étapes</div>
      <div class="steps">
        <div class="step">Vous allez recevoir un <strong>QR code</strong> par WhatsApp</div>
        <div class="step">Votre commande sera <strong>préparée sous 24-48h</strong></div>
        <div class="step">Nous vous préviendrons quand elle sera <strong>prête pour le retrait</strong></div>
        <div class="step">Présentez votre <strong>QR code à l'entrepôt</strong> pour récupérer vos pneus</div>
      </div>
    </div>

    <div class="section">
      <div class="section-title">🕒 Horaires de retrait</div>
      <div class="info-box">
        <strong>Lundi - Samedi :</strong> 8h00 - 18h00<br>
        <strong>Dimanche :</strong> Fermé
      </div>
    </div>

    <div class="section">
      <div class="section-title">📞 Besoin d'aide ?</div>
      <p>Notre équipe est disponible pour répondre à vos questions :</p>
      <div class="info-box">
        <strong>WhatsApp :</strong> ${order.customer.phoneNumber}<br>
        <strong>Email :</strong> contact@garageconnect.gp
      </div>
    </div>

    <div class="footer">
      <p><strong>GarageConnect</strong></p>
      <p>Votre spécialiste pneus en Guadeloupe</p>
      <p style="font-size: 12px; color: #999; margin-top: 20px;">
        Cet email a été envoyé automatiquement suite à votre commande.<br>
        Merci de ne pas répondre directement à cet email.
      </p>
    </div>
  </div>
</body>
</html>
  `;

  return html;
}

/**
 * Send payment failed notification email
 */
export async function sendPaymentFailedEmail(order: any, reason?: string) {
  try {
    if (!order.customer || !order.customer.email) {
      console.warn('No customer email found for order:', order.orderNumber);
      return;
    }

    const customerName = order.customer.firstName 
      ? `${order.customer.firstName} ${order.customer.lastName}`
      : 'Client';

    const { data, error } = await resend.emails.send({
      from: 'GarageConnect <noreply@garageconnect.gp>',
      to: order.customer.email,
      subject: `❌ Échec du paiement - Commande ${order.orderNumber}`,
      html: `
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <style>
    body {
      font-family: Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
    }
    .container {
      background-color: #fff;
      border-radius: 8px;
      padding: 30px;
      border: 2px solid #f44336;
    }
    h1 { color: #f44336; }
  </style>
</head>
<body>
  <div class="container">
    <h1>❌ Échec du paiement</h1>
    <p>Bonjour ${customerName},</p>
    <p>Malheureusement, le paiement de votre commande <strong>${order.orderNumber}</strong> n'a pas pu être traité.</p>
    ${reason ? `<p><strong>Raison :</strong> ${reason}</p>` : ''}
    <p>Vous pouvez :</p>
    <ul>
      <li>Réessayer le paiement en nous contactant par WhatsApp</li>
      <li>Utiliser un autre moyen de paiement</li>
      <li>Nous contacter pour plus d'informations</li>
    </ul>
    <p>Notre équipe reste à votre disposition.</p>
    <p style="margin-top: 30px;">
      <strong>GarageConnect</strong><br>
      WhatsApp : ${order.customer.phoneNumber}<br>
      Email : contact@garageconnect.gp
    </p>
  </div>
</body>
</html>
      `,
    });

    if (error) {
      console.error('Error sending payment failed email:', error);
      throw new Error('Failed to send email');
    }

    console.log('✅ Payment failed email sent:', data);
    return data;
  } catch (error) {
    console.error('Error in sendPaymentFailedEmail:', error);
    throw error;
  }
}
