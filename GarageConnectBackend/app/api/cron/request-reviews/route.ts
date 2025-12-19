import { NextRequest, NextResponse } from 'next/server';
import { scheduleReviewRequests } from '@/lib/review-service';

/**
 * Cron job to request reviews from customers
 * Runs daily at 10:00 AM
 * Targets orders completed 7 days ago
 */
export async function GET(request: NextRequest) {
  try {
    // Verify cron secret
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('⭐ Starting review request cron job...');

    const results = await scheduleReviewRequests();

    const successCount = results.filter(r => r.status === 'sent').length;
    const failedCount = results.filter(r => r.status === 'failed').length;

    console.log(`✅ Review requests sent: ${successCount}, failed: ${failedCount}`);

    return NextResponse.json({
      success: true,
      sent: successCount,
      failed: failedCount,
      total: results.length,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('❌ Error in review request cron:', error);
    return NextResponse.json(
      { error: 'Failed to request reviews', details: String(error) },
      { status: 500 }
    );
  }
}
