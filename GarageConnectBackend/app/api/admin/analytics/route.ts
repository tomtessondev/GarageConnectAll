import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withAuth } from '@/lib/auth/middleware';

/**
 * GET /api/admin/analytics
 * Get dashboard statistics
 */
export async function GET(request: NextRequest) {
  return withAuth(request, async () => {
    const { searchParams } = new URL(request.url);
    const period = searchParams.get('period') || 'today'; // today, week, month

    // Calculate date range
    const now = new Date();
    let startDate = new Date();
    
    switch (period) {
      case 'today':
        startDate.setHours(0, 0, 0, 0);
        break;
      case 'week':
        startDate.setDate(now.getDate() - 7);
        break;
      case 'month':
        startDate.setDate(now.getDate() - 30);
        break;
    }

    // Get statistics
    const [
      totalConversations,
      totalOrders,
      totalRevenue,
      avgRating,
      newCustomers,
    ] = await Promise.all([
      // Total conversations
      prisma.conversation.count({
        where: {
          startedAt: { gte: startDate },
        },
      }),

      // Total orders
      prisma.order.count({
        where: {
          createdAt: { gte: startDate },
          status: { not: 'cancelled' },
        },
      }),

      // Total revenue
      prisma.order.aggregate({
        where: {
          createdAt: { gte: startDate },
          paymentStatus: 'paid',
        },
        _sum: { totalAmount: true },
      }),

      // Average rating
      prisma.review.aggregate({
        where: {
          createdAt: { gte: startDate },
        },
        _avg: { rating: true },
      }),

      // New customers
      prisma.customer.count({
        where: {
          createdAt: { gte: startDate },
        },
      }),
    ]);

    // Get orders by status
    const ordersByStatus = await prisma.order.groupBy({
      by: ['status'],
      where: {
        createdAt: { gte: startDate },
      },
      _count: true,
    });

    // Get top products
    const topProducts = await prisma.orderItem.groupBy({
      by: ['productId'],
      where: {
        order: {
          createdAt: { gte: startDate },
          status: { not: 'cancelled' },
        },
      },
      _sum: { quantity: true },
      orderBy: { _sum: { quantity: 'desc' } },
      take: 5,
    });

    // Get product details for top products
    const productDetails = await Promise.all(
      topProducts.map(item =>
        prisma.product.findUnique({
          where: { id: item.productId },
          select: {
            id: true,
            name: true,
            brand: true,
            dimensions: true,
          },
        })
      )
    );

    return NextResponse.json({
      period,
      stats: {
        totalConversations,
        totalOrders,
        totalRevenue: Number(totalRevenue._sum.totalAmount || 0),
        averageRating: Number(avgRating._avg.rating || 0),
        newCustomers,
      },
      ordersByStatus: ordersByStatus.map(item => ({
        status: item.status,
        count: item._count,
      })),
      topProducts: topProducts.map((item, index) => ({
        product: productDetails[index],
        quantity: item._sum.quantity,
      })),
    });
  });
}
