import { NextRequest } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    // Vérifier l'authentification (optionnel pour le moment)
    const authHeader = request.headers.get('authorization');
    console.log('📊 Dashboard Stats - Auth:', authHeader ? 'Present' : 'Missing');

    // TODO: Récupérer les vraies statistiques depuis votre base de données
    // Pour l'instant, retournons des données mock
    const stats = {
      pendingOrders: 5,
      completedOrders: 23,
      totalRevenue: 4567.89,
      activeServices: 8
    };

    console.log('📊 Dashboard Stats - Returning:', stats);

    return Response.json(stats);
  } catch (error) {
    console.error('❌ Dashboard Stats Error:', error);
    return Response.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
