import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withAuth } from '@/lib/auth/middleware';

/**
 * GET /api/admin/reviews
 * List all reviews with filtering
 */
export async function GET(request: NextRequest) {
  return withAuth(request, async () => {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const rating = searchParams.get('rating');
    const isPublic = searchParams.get('isPublic');
    const skip = (page - 1) * limit;

    // Build where clause
    const where: Record<string, any> = {};
    if (rating) {
      where.rating = parseInt(rating);
    }
    if (isPublic !== null && isPublic !== undefined) {
      where.isPublic = isPublic === 'true';
    }

    const [reviews, total] = await Promise.all([
      prisma.review.findMany({
        where,
        include: {
          customer: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              phoneNumber: true,
            },
          },
          order: {
            select: {
              id: true,
              orderNumber: true,
              totalAmount: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.review.count({ where }),
    ]);

    // Get stats
    const stats = await prisma.review.aggregate({
      _avg: { rating: true },
      _count: { rating: true },
    });

    return NextResponse.json({
      reviews,
      stats: {
        averageRating: stats._avg.rating,
        totalReviews: stats._count.rating,
      },
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  });
}

/**
 * PUT /api/admin/reviews/toggle-visibility
 * Toggle review visibility
 */
export async function PUT(request: NextRequest) {
  return withAuth(request, async () => {
    const { reviewId, isPublic } = await request.json();

    if (!reviewId) {
      return NextResponse.json(
        { error: 'Review ID required' },
        { status: 400 }
      );
    }

    const updated = await prisma.review.update({
      where: { id: reviewId },
      data: { isPublic },
    });

    return NextResponse.json(updated);
  });
}
