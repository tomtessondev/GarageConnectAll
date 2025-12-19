import { NextRequest } from 'next/server';

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authHeader = request.headers.get('authorization');
    console.log('📦 Order Status Update - Auth:', authHeader ? 'Present' : 'Missing');
    console.log('📦 Order Status Update - Order ID:', params.id);

    const body = await request.json();
    const { status } = body;
    
    console.log('📦 Order Status Update - New Status:', status);

    // TODO: Mettre à jour la commande dans votre base de données
    // const updatedOrder = await db.orders.update({
    //   where: { id: params.id },
    //   data: { status: status }
    // });

    return Response.json({
      success: true,
      message: 'Statut de la commande mis à jour avec succès',
      order: {
        id: params.id,
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
