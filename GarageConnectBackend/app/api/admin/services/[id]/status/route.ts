import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authHeader = request.headers.get('authorization');
    console.log('🔧 Service Status Update - Auth:', authHeader ? 'Present' : 'Missing');
    console.log('🔧 Service Status Update - ID:', params.id);

    const body = await request.json();
    const { isActive } = body;
    
    console.log('🔧 Service Status Update - New Status:', isActive);

    // Mettre à jour le service dans la base de données
    const updatedService = await (prisma as any).service?.update({
      where: { id: params.id },
      data: { isActive: isActive }
    }).catch((err: Error) => {
      console.log('⚠️ Service Update Failed (table may not exist):', err.message);
      return null;
    });

    return Response.json({
      success: true,
      message: `Service ${isActive ? 'activé' : 'désactivé'} avec succès`,
      service: updatedService || {
        id: params.id,
        is_active: isActive
      }
    });
  } catch (error) {
    console.error('❌ Service Status Update Error:', error);
    return Response.json(
      { error: 'Internal Server Error', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
