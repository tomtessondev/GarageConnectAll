import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    console.log('🔧 Services - Auth:', authHeader ? 'Present' : 'Missing');

    // Récupérer les services depuis la base de données
    const servicesFromDB = await (prisma as any).service?.findMany({
      orderBy: [
        { order: 'asc' },
        { name: 'asc' }
      ]
    }).catch(() => null);

    // Si la table n'existe pas encore ou erreur, retourner mock data
    const services = servicesFromDB || [
      {
        id: 'srv-001',
        name: 'Changement de Pneus',
        description: 'Remplacement des 4 pneus avec équilibrage',
        price: 120.00,
        isActive: true,
        category: 'pneus'
      },
      {
        id: 'srv-002',
        name: 'Vidange Moteur',
        description: 'Vidange moteur complète avec filtre',
        price: 45.00,
        isActive: true,
        category: 'entretien'
      },
      {
        id: 'srv-003',
        name: 'Révision Complète',
        description: 'Révision complète du véhicule',
        price: 250.00,
        isActive: true,
        category: 'entretien'
      },
      {
        id: 'srv-004',
        name: 'Diagnostic Électronique',
        description: 'Diagnostic complet avec valise',
        price: 60.00,
        isActive: false,
        category: 'diagnostic'
      }
    ];

    // Formater les services pour Flutter (is_active au lieu de isActive)
    const formattedServices = services.map((s: any) => ({
      id: s.id,
      name: s.name,
      description: s.description,
      price: parseFloat(s.price?.toString() || '0'),
      is_active: s.isActive ?? s.is_active ?? true,
      category: s.category,
      duration: s.duration
    }));

    console.log(`🔧 Services - Returning ${formattedServices.length} services`);

    return Response.json({ services: formattedServices });
  } catch (error) {
    console.error('❌ Services Error:', error);
    return Response.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
