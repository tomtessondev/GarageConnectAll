import { NextRequest, NextResponse } from 'next/server';
import { cleanExpiredCarts } from '@/lib/cart-service';

/**
 * Cron job to clean expired carts
 * Runs every hour
 */
export async function GET(request: NextRequest) {
  try {
    // Verify cron secret (optional but recommended)
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('🧹 Starting cart cleanup cron job...');

    const deletedCount = await cleanExpiredCarts();

    console.log(`✅ Cleaned ${deletedCount} expired carts`);

    return NextResponse.json({
      success: true,
      deletedCount,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('❌ Error in cart cleanup cron:', error);
    return NextResponse.json(
      { error: 'Failed to clean carts', details: String(error) },
      { status: 500 }
    );
  }
}
