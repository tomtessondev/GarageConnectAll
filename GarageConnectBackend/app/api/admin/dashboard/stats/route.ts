import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    console.log('📊 Dashboard Stats - Auth:', authHeader ? 'Present' : 'Missing');

    // Récupérer les statistiques depuis la base de données
    const [
      pendingOrders,
      completedOrders,
      totalRevenueData,
      activeServicesCount
    ] = await Promise.all([
      prisma.order.count({
        where: { status: 'pending' }
      }).catch(() => 0),
      prisma.order.count({
        where: { status: 'completed' }
      }).catch(() => 0),
      prisma.order.aggregate({
        where: { status: 'completed' },
        _sum: { totalAmount: true }
      }).catch(() => ({ _sum: { totalAmount: null } })),
      // Utiliser any pour éviter l'erreur TypeScript si la table n'existe pas encore
      (prisma as any).service?.count({
        where: { isActive: true }
      }).catch(() => 0) || Promise.resolve(0)
    ]);

    const stats = {
      pendingOrders,
      completedOrders,
      totalRevenue: totalRevenueData._sum.totalAmount ? 
        parseFloat(totalRevenueData._sum.totalAmount.toString()) : 0,
      activeServices: activeServicesCount
    };

    console.log('📊 Dashboard Stats - Returning:', stats);

    return Response.json(stats);
  } catch (error) {
    console.error('❌ Dashboard Stats Error:', error);
    
    // Fallback sur mock data si erreur DB
    const mockStats = {
      pendingOrders: 0,
      completedOrders: 0,
      totalRevenue: 0,
      activeServices: 0
    };
    
    return Response.json(mockStats);
  }
}
