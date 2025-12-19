import { NextRequest } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    console.log('🔧 Services - Auth:', authHeader ? 'Present' : 'Missing');

    // TODO: Récupérer les services depuis votre base de données
    // Pour l'instant, retournons des données mock
    const services = [
      {
        id: 'srv-001',
        name: 'Changement de Pneus',
        description: 'Remplacement des 4 pneus avec équilibrage',
        price: 120.00,
        is_active: true
      },
      {
        id: 'srv-002',
        name: 'Vidange Moteur',
        description: 'Vidange moteur complète avec filtre',
        price: 45.00,
        is_active: true
      },
      {
        id: 'srv-003',
        name: 'Révision Complète',
        description: 'Révision complète du véhicule',
        price: 250.00,
        is_active: true
      },
      {
        id: 'srv-004',
        name: 'Diagnostic Électronique',
        description: 'Diagnostic complet avec valise',
        price: 60.00,
        is_active: false
      }
    ];

    console.log(`🔧 Services - Returning ${services.length} services`);

    return Response.json({ services });
  } catch (error) {
    console.error('❌ Services Error:', error);
    return Response.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
