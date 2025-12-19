import { PrismaClient, ProductCategory, ProductSeason, ProductCondition } from '@prisma/client';
import { createHash } from 'crypto';

const prisma = new PrismaClient();

// Fonction pour hasher le mot de passe (simple pour le dev)
function hashPassword(password: string): string {
  return createHash('sha256').update(password).digest('hex');
}

async function main() {
  console.log('🌱 Début du seeding...\n');

  // 1. Créer un utilisateur admin
  console.log('👤 Création utilisateur admin...');
  const admin = await prisma.user.create({
    data: {
      email: 'admin@garageconnect.gp',
      passwordHash: hashPassword('admin123'), // À changer en production !
      role: 'admin',
      firstName: 'Admin',
      lastName: 'GarageConnect',
    },
  });
  console.log('✅ Admin créé:', admin.email);

  // 2. Créer des clients de test
  console.log('\n👥 Création clients de test...');
  const customers = await Promise.all([
    prisma.customer.create({
      data: {
        phoneNumber: '+590691260199',
        firstName: 'Jean',
        lastName: 'Dupont',
        email: 'jean.dupont@example.gp',
        address: '15 Rue des Palmiers',
        city: 'Pointe-à-Pitre',
        postalCode: '97110',
        vehicleBrand: 'Renault',
        vehicleModel: 'Clio',
        vehicleYear: 2018,
      },
    }),
    prisma.customer.create({
      data: {
        phoneNumber: '+590690123456',
        firstName: 'Marie',
        lastName: 'Martin',
        email: 'marie.martin@example.gp',
        address: '28 Boulevard Maritime',
        city: 'Basse-Terre',
        postalCode: '97100',
        vehicleBrand: 'Peugeot',
        vehicleModel: '208',
        vehicleYear: 2020,
      },
    }),
    prisma.customer.create({
      data: {
        phoneNumber: '+590690987654',
        firstName: 'Pierre',
        lastName: 'Leroy',
        address: '42 Avenue de la Plage',
        city: 'Le Gosier',
        postalCode: '97190',
        vehicleBrand: 'Citroën',
        vehicleModel: 'C3',
        vehicleYear: 2019,
      },
    }),
  ]);
  console.log(`✅ ${customers.length} clients créés`);

  // 3. Créer des produits (pneus)
  console.log('\n🚗 Création produits (pneus)...');
  
  const products = [
    // Dimension 195/65R15 - Petits véhicules
    {
      name: 'EcoContact 6',
      brand: 'Continental',
      model: 'EcoContact 6',
      width: 195,
      height: 65,
      diameter: 15,
      dimensions: '195/65R15',
      priceRetail: 89.00,
      stockQuantity: 50,
      category: ProductCategory.budget,
      season: ProductSeason.all_season,
      description: 'Pneu économique et fiable pour usage quotidien',
    },
    {
      name: 'Primacy 4',
      brand: 'Michelin',
      model: 'Primacy 4',
      width: 195,
      height: 65,
      diameter: 15,
      dimensions: '195/65R15',
      priceRetail: 125.00,
      stockQuantity: 40,
      category: ProductCategory.standard,
      season: ProductSeason.all_season,
      description: 'Excellent rapport qualité/prix, longévité exceptionnelle',
    },
    {
      name: 'Turanza T005',
      brand: 'Bridgestone',
      model: 'Turanza T005',
      width: 195,
      height: 65,
      diameter: 15,
      dimensions: '195/65R15',
      priceRetail: 145.00,
      stockQuantity: 20,
      category: ProductCategory.premium,
      season: ProductSeason.summer,
      description: 'Performance maximale, confort de conduite supérieur',
    },

    // Dimension 205/55R16 - Berlines compactes
    {
      name: 'Energy XM2+',
      brand: 'Michelin',
      model: 'Energy XM2+',
      width: 205,
      height: 55,
      diameter: 16,
      dimensions: '205/55R16',
      priceRetail: 95.00,
      stockQuantity: 45,
      category: ProductCategory.budget,
      season: ProductSeason.all_season,
      description: 'Économique et durable',
    },
    {
      name: 'ContiPremiumContact 5',
      brand: 'Continental',
      model: 'ContiPremiumContact 5',
      width: 205,
      height: 55,
      diameter: 16,
      dimensions: '205/55R16',
      priceRetail: 135.00,
      stockQuantity: 35,
      category: ProductCategory.standard,
      season: ProductSeason.summer,
      description: 'Adhérence optimale sur route sèche et mouillée',
    },
    {
      name: 'Pilot Sport 4',
      brand: 'Michelin',
      model: 'Pilot Sport 4',
      width: 205,
      height: 55,
      diameter: 16,
      dimensions: '205/55R16',
      priceRetail: 165.00,
      stockQuantity: 15,
      category: ProductCategory.premium,
      season: ProductSeason.summer,
      description: 'Performances sportives, freinage court',
    },

    // Dimension 215/60R17 - SUV compacts
    {
      name: 'Dueler H/P Sport',
      brand: 'Bridgestone',
      model: 'Dueler H/P Sport',
      width: 215,
      height: 60,
      diameter: 17,
      dimensions: '215/60R17',
      priceRetail: 110.00,
      stockQuantity: 30,
      category: ProductCategory.budget,
      season: ProductSeason.all_season,
      description: 'Idéal pour SUV urbains',
    },
    {
      name: 'Latitude Tour HP',
      brand: 'Michelin',
      model: 'Latitude Tour HP',
      width: 215,
      height: 60,
      diameter: 17,
      dimensions: '215/60R17',
      priceRetail: 145.00,
      stockQuantity: 25,
      category: ProductCategory.standard,
      season: ProductSeason.all_season,
      description: 'Confort et tenue de route pour SUV',
    },
    {
      name: 'Alenza 001',
      brand: 'Bridgestone',
      model: 'Alenza 001',
      width: 215,
      height: 60,
      diameter: 17,
      dimensions: '215/60R17',
      priceRetail: 175.00,
      stockQuantity: 18,
      category: ProductCategory.premium,
      season: ProductSeason.all_season,
      description: 'Premium pour SUV, silence de roulage',
    },

    // Dimension 225/45R17 - Berlines sportives
    {
      name: 'Potenza RE050A',
      brand: 'Bridgestone',
      model: 'Potenza RE050A',
      width: 225,
      height: 45,
      diameter: 17,
      dimensions: '225/45R17',
      priceRetail: 105.00,
      stockQuantity: 28,
      category: ProductCategory.budget,
      season: ProductSeason.summer,
      description: 'Sportif à prix abordable',
    },
    {
      name: 'Eagle F1 Asymmetric 3',
      brand: 'Goodyear',
      model: 'Eagle F1 Asymmetric 3',
      width: 225,
      height: 45,
      diameter: 17,
      dimensions: '225/45R17',
      priceRetail: 155.00,
      stockQuantity: 22,
      category: ProductCategory.standard,
      season: ProductSeason.summer,
      description: 'Performances élevées, freinage exceptionnel',
    },
    {
      name: 'Pilot Sport 4S',
      brand: 'Michelin',
      model: 'Pilot Sport 4S',
      width: 225,
      height: 45,
      diameter: 17,
      dimensions: '225/45R17',
      priceRetail: 195.00,
      stockQuantity: 12,
      category: ProductCategory.premium,
      season: ProductSeason.summer,
      description: 'Haute performance, adhérence maximale',
    },

    // Dimension 235/55R18 - SUV moyens
    {
      name: 'Scorpion Verde All Season',
      brand: 'Pirelli',
      model: 'Scorpion Verde All Season',
      width: 235,
      height: 55,
      diameter: 18,
      dimensions: '235/55R18',
      priceRetail: 125.00,
      stockQuantity: 32,
      category: ProductCategory.budget,
      season: ProductSeason.all_season,
      description: 'Polyvalent pour SUV, toutes saisons',
    },
    {
      name: 'Latitude Sport 3',
      brand: 'Michelin',
      model: 'Latitude Sport 3',
      width: 235,
      height: 55,
      diameter: 18,
      dimensions: '235/55R18',
      priceRetail: 165.00,
      stockQuantity: 20,
      category: ProductCategory.standard,
      season: ProductSeason.summer,
      description: 'Sportivité et confort pour SUV',
    },
    {
      name: 'P Zero',
      brand: 'Pirelli',
      model: 'P Zero',
      width: 235,
      height: 55,
      diameter: 18,
      dimensions: '235/55R18',
      priceRetail: 205.00,
      stockQuantity: 10,
      category: ProductCategory.premium,
      season: ProductSeason.summer,
      description: 'Haute performance pour SUV premium',
    },

    // Dimension 185/65R14 - Petites citadines
    {
      name: 'Ecopia EP150',
      brand: 'Bridgestone',
      model: 'Ecopia EP150',
      width: 185,
      height: 65,
      diameter: 14,
      dimensions: '185/65R14',
      priceRetail: 75.00,
      stockQuantity: 55,
      category: ProductCategory.budget,
      season: ProductSeason.all_season,
      description: 'Économie de carburant, idéal citadines',
    },
    {
      name: 'Energy Saver+',
      brand: 'Michelin',
      model: 'Energy Saver+',
      width: 185,
      height: 65,
      diameter: 14,
      dimensions: '185/65R14',
      priceRetail: 98.00,
      stockQuantity: 42,
      category: ProductCategory.standard,
      season: ProductSeason.all_season,
      description: 'Faible résistance au roulement',
    },
    {
      name: 'ContiEcoContact 5',
      brand: 'Continental',
      model: 'ContiEcoContact 5',
      width: 185,
      height: 65,
      diameter: 14,
      dimensions: '185/65R14',
      priceRetail: 115.00,
      stockQuantity: 25,
      category: ProductCategory.premium,
      season: ProductSeason.all_season,
      description: 'Premium écologique',
    },

    // Pneus en overstock (réductions)
    {
      name: 'CrossContact UHP',
      brand: 'Continental',
      model: 'CrossContact UHP',
      width: 255,
      height: 50,
      diameter: 19,
      dimensions: '255/50R19',
      priceRetail: 180.00,
      stockQuantity: 80,
      isOverstock: true,
      discountPercent: 20,
      category: ProductCategory.premium,
      season: ProductSeason.summer,
      description: 'SUV premium - PROMOTION -20%',
    },
    {
      name: 'Cinturato P7',
      brand: 'Pirelli',
      model: 'Cinturato P7',
      width: 225,
      height: 50,
      diameter: 17,
      dimensions: '225/50R17',
      priceRetail: 140.00,
      stockQuantity: 65,
      isOverstock: true,
      discountPercent: 15,
      category: ProductCategory.standard,
      season: ProductSeason.summer,
      description: 'Berline - DÉSTOCKAGE -15%',
    },
  ];

  let createdCount = 0;
  for (const product of products) {
    // Générer un SKU unique
    const sku = `${product.brand.substring(0, 3).toUpperCase()}-${product.dimensions.replace('/', '-')}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
    
    await prisma.product.create({
      data: {
        ...product,
        sku,
        condition: ProductCondition.new,
        source: 'local',
      },
    });
    createdCount++;
  }
  
  console.log(`✅ ${createdCount} produits créés`);

  // 4. Créer une configuration de source d'inventaire
  console.log('\n📦 Création source inventaire locale...');
  await prisma.inventorySource.create({
    data: {
      name: 'Inventaire Local',
      type: 'local',
      config: {
        database: 'postgres',
        table: 'products',
      },
      enabled: true,
      priority: 1,
    },
  });
  console.log('✅ Source inventaire créée');

  console.log('\n✨ Seeding terminé avec succès!\n');
  console.log('📊 Résumé:');
  console.log(`   - 1 utilisateur admin (admin@garageconnect.gp / admin123)`);
  console.log(`   - ${customers.length} clients de test`);
  console.log(`   - ${createdCount} produits (pneus)`);
  console.log(`   - 1 source d'inventaire`);
  console.log('\n🚀 La base de données est prête!');
}

main()
  .catch((e) => {
    console.error('❌ Erreur lors du seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
