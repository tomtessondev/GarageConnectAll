import { NextRequest } from 'next/server';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const authHeader = request.headers.get('authorization');
    console.log('📦 Order Status Update - Auth:', authHeader ? 'Present' : 'Missing');
    console.log('📦 Order Status Update - Order ID:', id);

    const body = await request.json();
    const { status } = body;
    
    console.log('📦 Order Status Update - New Status:', status);

    // TODO: Mettre à jour la commande dans votre base de données
    // const updatedOrder = await db.orders.update({
    //   where: { id },
    //   data: { status: status }
    // });

    return Response.json({
      success: true,
      message: 'Statut de la commande mis à jour avec succès',
      order: {
        id,
        status: status
      }
    });
  } catch (error) {
    console.error('❌ Order Status Update Error:', error);
    return Response.json(
      { error: 'Internal Server Error', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
