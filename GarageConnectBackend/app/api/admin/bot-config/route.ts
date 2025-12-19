import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withAuth } from '@/lib/auth/middleware';

/**
 * GET /api/admin/bot-config
 * Get active bot configuration
 */
export async function GET(request: NextRequest) {
  return withAuth(request, async () => {
    const config = await prisma.botConfig.findFirst({
      where: { isActive: true },
      orderBy: { createdAt: 'desc' },
    });

    if (!config) {
      return NextResponse.json(
        { error: 'No active configuration found' },
        { status: 404 }
      );
    }

    return NextResponse.json(config);
  });
}

/**
 * PUT /api/admin/bot-config
 * Update bot configuration
 */
export async function PUT(request: NextRequest) {
  return withAuth(request, async (req, user) => {
    const data = await req.json();

    // Validate required fields
    if (!data.id) {
      return NextResponse.json(
        { error: 'Config ID required' },
        { status: 400 }
      );
    }

    const updated = await prisma.botConfig.update({
      where: { id: data.id },
      data: {
        name: data.name,
        systemPrompt: data.systemPrompt,
        welcomeMessage: data.welcomeMessage,
        availableActions: data.availableActions,
        minPrice: data.minPrice,
        maxPrice: data.maxPrice,
        businessHours: data.businessHours,
        autoReplyEnabled: data.autoReplyEnabled,
        maintenanceMode: data.maintenanceMode,
        maintenanceMessage: data.maintenanceMessage,
      },
    });

    return NextResponse.json(updated);
  });
}

/**
 * POST /api/admin/bot-config
 * Create new bot configuration
 */
export async function POST(request: NextRequest) {
  return withAuth(request, async (req, user) => {
    const data = await req.json();

    // Deactivate all existing configs
    await prisma.botConfig.updateMany({
      data: { isActive: false },
    });

    // Create new config
    const config = await prisma.botConfig.create({
      data: {
        name: data.name,
        systemPrompt: data.systemPrompt,
        welcomeMessage: data.welcomeMessage,
        availableActions: data.availableActions || [],
        minPrice: data.minPrice,
        maxPrice: data.maxPrice,
        businessHours: data.businessHours,
        autoReplyEnabled: data.autoReplyEnabled ?? true,
        maintenanceMode: data.maintenanceMode ?? false,
        maintenanceMessage: data.maintenanceMessage,
        isActive: true,
        version: data.version || '1.0',
        createdBy: user.userId,
      },
    });

    return NextResponse.json(config);
  });
}
