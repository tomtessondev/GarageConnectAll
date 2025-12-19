import { prisma } from '../lib/prisma';
import { Prisma } from '@prisma/client';

async function enable24_7() {
  try {
    console.log('🔧 Configuration du bot en mode 24/7...');

    // Trouver la configuration active
    const activeConfig = await prisma.botConfig.findFirst({
      where: { isActive: true },
    });

    if (!activeConfig) {
      console.log('⚠️  Aucune configuration active trouvée. Création d\'une nouvelle config...');
      
      const newConfig = await prisma.botConfig.create({
        data: {
          name: 'Configuration 24/7',
          systemPrompt: `Tu es l'assistant virtuel de GarageConnect, disponible 24/7.`,
          welcomeMessage: '👋 Bonjour ! Bienvenue chez GarageConnect ! 🚗\n\nJe suis disponible 24/7 pour vous aider.',
          availableActions: ['search_tyres', 'add_to_cart', 'view_cart', 'checkout', 'view_orders'],
          businessHours: Prisma.JsonNull, // Pas d'horaires
          autoReplyEnabled: true,
          maintenanceMode: false,
          isActive: true,
          version: '1.0',
        },
      });

      console.log('✅ Nouvelle configuration créée:', newConfig.id);
    } else {
      console.log('📝 Configuration active trouvée:', activeConfig.id);
      
      // Mettre à jour pour forcer 24/7
      await prisma.botConfig.update({
        where: { id: activeConfig.id },
        data: {
          autoReplyEnabled: true,
          maintenanceMode: false,
          businessHours: Prisma.JsonNull, // Enlever les horaires
        },
      });

      console.log('✅ Configuration mise à jour pour mode 24/7');
    }

    // Vérifier le résultat
    const updatedConfig = await prisma.botConfig.findFirst({
      where: { isActive: true },
    });

    console.log('\n📊 Configuration actuelle:');
    console.log('- Auto Reply:', updatedConfig?.autoReplyEnabled);
    console.log('- Maintenance:', updatedConfig?.maintenanceMode);
    console.log('- Business Hours:', updatedConfig?.businessHours || 'Aucun (24/7)');

    console.log('\n🎉 Bot configuré en mode 24/7 !');
  } catch (error) {
    console.error('❌ Erreur:', error);
  } finally {
    await prisma.$disconnect();
  }
}

enable24_7();
