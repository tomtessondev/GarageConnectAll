import QRCode from 'qrcode';
import { prisma } from './prisma';

/**
 * Generate QR code for order pickup
 */
export async function generatePickupQRCode(orderId: string): Promise<string> {
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
    throw new Error('Order not found');
  }

  // QR code data
  const qrData = {
    orderNumber: order.orderNumber,
    orderId: order.id,
    customerName: `${order.customer.firstName || ''} ${order.customer.lastName || ''}`.trim(),
    totalAmount: Number(order.totalAmount),
    itemCount: order.items.reduce((sum, item) => sum + item.quantity, 0),
    pickupCode: generatePickupCode(order.orderNumber),
    timestamp: new Date().toISOString(),
  };

  // Generate QR code as data URL
  const qrCodeDataURL = await QRCode.toDataURL(JSON.stringify(qrData), {
    errorCorrectionLevel: 'H',
    width: 300,
    margin: 2,
    color: {
      dark: '#000000',
      light: '#FFFFFF',
    },
  });

  return qrCodeDataURL;
}

/**
 * Generate unique pickup code
 * Format: First 2 letters of order number + last 4 digits
 */
function generatePickupCode(orderNumber: string): string {
  const parts = orderNumber.split('-');
  if (parts.length >= 3) {
    return `${parts[0]}-${parts[2]}`;
  }
  return orderNumber.substring(0, 6);
}

/**
 * Verify QR code at pickup
 */
export async function verifyPickupQRCode(qrCodeData: string): Promise<{
  valid: boolean;
  order?: any;
  message: string;
}> {
  try {
    const data = JSON.parse(qrCodeData);

    const order = await prisma.order.findUnique({
      where: { id: data.orderId },
      include: {
        customer: true,
        items: {
          include: {
            product: true,
          },
        },
        pickupTracking: true,
      },
    });

    if (!order) {
      return {
        valid: false,
        message: 'Commande introuvable',
      };
    }

    if (order.orderNumber !== data.orderNumber) {
      return {
        valid: false,
        message: 'Numéro de commande invalide',
      };
    }

    if (order.status !== 'ready_pickup' && order.status !== 'confirmed') {
      return {
        valid: false,
        message: `Statut: ${order.status}. Commande pas encore prête.`,
      };
    }

    if (order.pickupTracking?.pickedUpDate) {
      return {
        valid: false,
        message: 'Commande déjà retirée',
      };
    }

    return {
      valid: true,
      order,
      message: 'QR code valide',
    };
  } catch (error) {
    return {
      valid: false,
      message: 'QR code invalide',
    };
  }
}

/**
 * Mark order as picked up
 */
export async function markOrderPickedUp(orderId: string): Promise<void> {
  // Update order status
  await prisma.order.update({
    where: { id: orderId },
    data: {
      status: 'completed',
    },
  });

  // Update pickup tracking
  await prisma.pickupTracking.updateMany({
    where: { orderId },
    data: {
      status: 'picked_up',
      pickedUpDate: new Date(),
    },
  });

  // Reduce stock
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: {
      items: true,
    },
  });

  if (order) {
    for (const item of order.items) {
      await prisma.product.update({
        where: { id: item.productId },
        data: {
          stockQuantity: {
            decrement: item.quantity,
          },
        },
      });
    }
  }
}

/**
 * Get QR code as buffer for WhatsApp
 */
export async function generateQRCodeBuffer(orderId: string): Promise<Buffer> {
  const dataURL = await generatePickupQRCode(orderId);
  
  // Convert data URL to buffer
  const base64Data = dataURL.replace(/^data:image\/png;base64,/, '');
  return Buffer.from(base64Data, 'base64');
}
