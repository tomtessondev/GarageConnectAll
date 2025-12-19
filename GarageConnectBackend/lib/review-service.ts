import { prisma } from '@/lib/prisma';
import { sendWhatsAppMessage } from './whatsapp-helpers';
import { addHours } from 'date-fns';

/**
 * Request review from customer
 * Typically called 7 days (168 hours) after order completion
 */
export async function requestReview(orderId: string, delayHours: number = 168) {
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

  // Check if review already exists
  const existingReview = await prisma.review.findUnique({
    where: { orderId },
  });

  if (existingReview) {
    console.log(`Review already exists for order ${order.orderNumber}`);
    return null;
  }

  // Format review request message
  const message = formatReviewRequest(order);

  // Send via WhatsApp
  await sendWhatsAppMessage(order.customer.phoneNumber, message);

  console.log(`✅ Review requested for order ${order.orderNumber}`);

  return { orderId, sent: true };
}

/**
 * Format review request message
 */
function formatReviewRequest(order: any): string {
  let message = `🌟 VOTRE AVIS COMPTE !\n\n`;
  message += `Bonjour ${order.customer.firstName || 'cher client'},\n\n`;
  message += `Comment s'est passée votre commande ${order.orderNumber} ?\n\n`;
  message += `Nous aimerions connaître votre expérience.\n\n`;
  message += `━━━━━━━━━━━━━━━━━━━━\n`;
  message += `Notez votre expérience:\n\n`;
  message += `⭐ 1 - Très insatisfait\n`;
  message += `⭐⭐ 2 - Insatisfait\n`;
  message += `⭐⭐⭐ 3 - Satisfait\n`;
  message += `⭐⭐⭐⭐ 4 - Très satisfait\n`;
  message += `⭐⭐⭐⭐⭐ 5 - Excellent !\n`;
  message += `━━━━━━━━━━━━━━━━━━━━\n\n`;
  message += `Répondez avec un nombre de 1 à 5, suivi éventuellement d'un commentaire.\n\n`;
  message += `Exemple: "5 - Service rapide et efficace !"\n\n`;
  message += `Merci de votre confiance ! 🙏`;

  return message;
}

/**
 * Save customer review
 */
export async function saveReview(
  orderId: string,
  rating: number,
  comment?: string
) {
  // Validate rating
  if (rating < 1 || rating > 5) {
    throw new Error('La note doit être entre 1 et 5');
  }

  // Check if order exists
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: {
      customer: true,
    },
  });

  if (!order) {
    throw new Error('Commande introuvable');
  }

  // Check if review already exists
  const existingReview = await prisma.review.findUnique({
    where: { orderId },
  });

  if (existingReview) {
    throw new Error('Vous avez déjà laissé un avis pour cette commande');
  }

  // Create review
  const review = await prisma.review.create({
    data: {
      orderId,
      customerId: order.customerId,
      rating,
      comment: comment || undefined,
      isPublic: true,
    },
  });

  // Send thank you message
  let thankYouMessage = `✨ MERCI POUR VOTRE AVIS !\n\n`;
  
  if (rating >= 4) {
    thankYouMessage += `Nous sommes ravis que vous soyez satisfait ! 😊\n\n`;
  } else if (rating === 3) {
    thankYouMessage += `Merci pour votre retour. Nous allons nous améliorer ! 💪\n\n`;
  } else {
    thankYouMessage += `Nous sommes désolés de votre expérience. 😔\n\n`;
    thankYouMessage += `Un responsable va vous contacter prochainement.\n\n`;
  }

  thankYouMessage += `Votre avis nous aide à nous améliorer.\n`;
  thankYouMessage += `À bientôt chez GarageConnect ! 🚗`;

  await sendWhatsAppMessage(order.customer.phoneNumber, thankYouMessage);

  // If rating is low (1 or 2), notify admin
  if (rating <= 2) {
    console.log(`⚠️ Low rating (${rating}★) for order ${order.orderNumber}`);
    // TODO: Send alert to admin
  }

  return review;
}

/**
 * Parse review from message
 * Format: "5" or "5 - Excellent service!"
 */
export function parseReviewFromMessage(message: string): {
  rating: number | null;
  comment: string | null;
} {
  // Try to extract rating (1-5)
  const ratingMatch = message.match(/([1-5])/);
  
  if (!ratingMatch) {
    return { rating: null, comment: null };
  }

  const rating = parseInt(ratingMatch[1]);

  // Extract comment (everything after the rating)
  let comment: string | null = message.replace(/[1-5]\s*-?\s*/, '').trim();
  
  if (!comment || comment.length < 3) {
    comment = null;
  }

  return { rating, comment };
}

/**
 * Get review statistics
 */
export async function getReviewStats() {
  const reviews = await prisma.review.findMany({
    where: { isPublic: true },
  });

  if (reviews.length === 0) {
    return {
      total: 0,
      average: 0,
      distribution: {
        '5': 0,
        '4': 0,
        '3': 0,
        '2': 0,
        '1': 0,
      },
    };
  }

  const total = reviews.length;
  const sum = reviews.reduce((acc, review) => acc + review.rating, 0);
  const average = sum / total;

  // Calculate distribution
  const distribution = {
    '5': reviews.filter(r => r.rating === 5).length,
    '4': reviews.filter(r => r.rating === 4).length,
    '3': reviews.filter(r => r.rating === 3).length,
    '2': reviews.filter(r => r.rating === 2).length,
    '1': reviews.filter(r => r.rating === 1).length,
  };

  return {
    total,
    average: Number(average.toFixed(2)),
    distribution,
  };
}

/**
 * Get recent reviews
 */
export async function getRecentReviews(limit: number = 10) {
  return await prisma.review.findMany({
    where: { isPublic: true },
    orderBy: { createdAt: 'desc' },
    take: limit,
    include: {
      order: {
        select: {
          orderNumber: true,
        },
      },
      customer: {
        select: {
          firstName: true,
          lastName: true,
        },
      },
    },
  });
}

/**
 * Toggle review visibility
 */
export async function toggleReviewVisibility(reviewId: string) {
  const review = await prisma.review.findUnique({
    where: { id: reviewId },
  });

  if (!review) {
    throw new Error('Avis introuvable');
  }

  return await prisma.review.update({
    where: { id: reviewId },
    data: {
      isPublic: !review.isPublic,
    },
  });
}

/**
 * Get reviews for order
 */
export async function getOrderReview(orderId: string) {
  return await prisma.review.findUnique({
    where: { orderId },
    include: {
      customer: {
        select: {
          firstName: true,
          lastName: true,
        },
      },
    },
  });
}

/**
 * Get customer reviews
 */
export async function getCustomerReviews(customerId: string) {
  return await prisma.review.findMany({
    where: { customerId },
    orderBy: { createdAt: 'desc' },
    include: {
      order: {
        select: {
          orderNumber: true,
          createdAt: true,
        },
      },
    },
  });
}

/**
 * Schedule review request (for cron job)
 * To be called 7 days after order completion
 */
export async function scheduleReviewRequests() {
  const sevenDaysAgo = addHours(new Date(), -168);

  // Find completed orders from 7 days ago without reviews
  const orders = await prisma.order.findMany({
    where: {
      status: 'completed',
      createdAt: {
        gte: addHours(sevenDaysAgo, -1), // 7 days ± 1 hour
        lte: addHours(sevenDaysAgo, 1),
      },
      review: null, // No review yet
    },
    include: {
      customer: true,
    },
  });

  console.log(`📋 Found ${orders.length} orders eligible for review request`);

  const results = [];

  for (const order of orders) {
    try {
      await requestReview(order.id, 0); // Send immediately
      results.push({ orderId: order.id, status: 'sent' });
    } catch (error) {
      console.error(`Error requesting review for order ${order.id}:`, error);
      results.push({ orderId: order.id, status: 'failed', error });
    }
  }

  return results;
}
