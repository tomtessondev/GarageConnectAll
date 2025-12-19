import { prisma } from '@/lib/prisma';
import { ProductCategory, Product } from '@prisma/client';

interface SearchResult {
  budget: typeof prisma.product.findFirst extends (...args: any[]) => Promise<infer R> ? R : never;
  standard: typeof prisma.product.findFirst extends (...args: any[]) => Promise<infer R> ? R : never;
  premium: typeof prisma.product.findFirst extends (...args: any[]) => Promise<infer R> ? R : never;
}

// ============================================
// NOUVELLES FONCTIONS - RECHERCHE AVANCÉE
// ============================================

export interface SearchFilters {
  category?: ProductCategory;
  brand?: string;
  minPrice?: number;
  maxPrice?: number;
  sortBy?: 'price' | 'brand' | 'stock';
  sortOrder?: 'asc' | 'desc';
}

export interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasMore: boolean;
}

export interface AdvancedSearchResult {
  products: Product[];
  pagination: PaginationInfo;
  dimensions: string;
  filters: SearchFilters;
}

/**
 * Recherche avancée avec pagination et filtres
 */
export async function searchTyresAdvanced(
  width: number,
  height: number,
  diameter: number,
  options: SearchFilters & { page?: number; limit?: number } = {}
): Promise<AdvancedSearchResult> {
  const {
    category,
    brand,
    minPrice,
    maxPrice,
    sortBy = 'price',
    sortOrder = 'asc',
    page = 1,
    limit = 6, // 6 produits par page
  } = options;

  const dimensions = `${width}/${height}R${diameter}`;

  // Construction de la clause WHERE
  const where: any = {
    width,
    height,
    diameter,
    stockQuantity: { gt: 0 },
  };

  // OPTIMIZATION: Only filter by category if explicitly provided (not undefined/null)
  if (category) {
    where.category = category;
    console.log(`🔍 Filtering by category: ${category}`);
  } else {
    console.log(`🔍 No category filter - showing ALL categories`);
  }

  if (brand) {
    where.brand = {
      contains: brand,
      mode: 'insensitive',
    };
  }

  if (minPrice !== undefined || maxPrice !== undefined) {
    where.priceRetail = {};
    if (minPrice !== undefined) where.priceRetail.gte = minPrice;
    if (maxPrice !== undefined) where.priceRetail.lte = maxPrice;
  }

  // Construction orderBy
  const orderByField = sortBy === 'price' ? 'priceRetail' : sortBy === 'brand' ? 'brand' : 'stockQuantity';
  const orderBy: any = { [orderByField]: sortOrder };

  console.log(`🔎 DB QUERY for ${dimensions}:`, {
    width,
    height,
    diameter,
    category,
    brand,
    hasStock: 'stockQuantity > 0'
  });

  // Queries parallèles pour performance
  const [products, total] = await Promise.all([
    prisma.product.findMany({
      where,
      orderBy,
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.product.count({ where }),
  ]);

  console.log(`📊 DB RESULT: ${products.length} products found, total=${total}`);
  
  if (products.length === 0) {
    // Vérifier si des produits existent SANS le filtre stock
    const totalWithoutStock = await prisma.product.count({
      where: { width, height, diameter }
    });
    console.log(`🔍 DEBUG: ${totalWithoutStock} products exist for ${dimensions} (including out of stock)`);
    
    // Vérifier si des produits existent toutes dimensions confondues
    const totalAllProducts = await prisma.product.count();
    console.log(`🔍 DEBUG: Total products in DB = ${totalAllProducts}`);
  }

  const totalPages = Math.ceil(total / limit);

  return {
    products,
    pagination: {
      page,
      limit,
      total,
      totalPages,
      hasMore: page < totalPages,
    },
    dimensions,
    filters: { category, brand, minPrice, maxPrice, sortBy, sortOrder },
  };
}

/**
 * Formater résultats avec pagination
 */
export function formatSearchResultsWithPagination(
  result: AdvancedSearchResult
): string {
  const { products, pagination, dimensions, filters } = result;

  if (products.length === 0) {
    return `❌ Aucun pneu trouvé pour ${dimensions}\n${filters.category ? `Catégorie: ${filters.category}\n` : ''}${filters.brand ? `Marque: ${filters.brand}\n` : ''}\nEssayez d'autres critères ?`;
  }

  let message = `🔍 **${dimensions}**\n`;
  
  // Filtres actifs
  if (filters.category || filters.brand || filters.minPrice || filters.maxPrice) {
    message += `\n📋 Filtres actifs:\n`;
    if (filters.category) message += `• Catégorie: ${filters.category}\n`;
    if (filters.brand) message += `• Marque: ${filters.brand}\n`;
    if (filters.minPrice || filters.maxPrice) {
      message += `• Prix: ${filters.minPrice || 0}€ - ${filters.maxPrice || '∞'}€\n`;
    }
  }

  message += `\n✅ **${pagination.total} pneu(s) trouvé(s)**\n`;
  message += `Page ${pagination.page}/${pagination.totalPages}\n\n`;

  // Liste des produits
  products.forEach((product, index) => {
    const finalPrice = product.isOverstock && product.discountPercent
      ? Number(product.priceRetail) * (1 - product.discountPercent / 100)
      : Number(product.priceRetail);

    const categoryEmoji = {
      budget: '💰',
      standard: '⭐',
      premium: '💎',
    }[product.category] || '🔧';

    message += `${index + 1}. ${categoryEmoji} **${product.brand} ${product.model}**\n`;
    message += `   ${finalPrice.toFixed(0)}€/pneu`;
    
    if (product.isOverstock) {
      message += ` 🎉 -${product.discountPercent}%`;
    }
    
    message += `\n   Stock: ${product.stockQuantity}\n`;
    
    if (product.description) {
      message += `   ${product.description}\n`;
    }
    message += `\n`;
  });

  // Navigation
  if (pagination.totalPages > 1) {
    message += `━━━━━━━━━━━━━━━━\n`;
    if (pagination.page > 1) {
      message += `⬅️ Page précédente | `;
    }
    if (pagination.hasMore) {
      message += `➡️ Page suivante`;
    }
    message += `\n`;
  }

  message += `\n💡 Tapez le numéro pour sélectionner\n`;
  message += `ou demandez "filtrer" pour affiner`;

  return message;
}

/**
 * Obtenir les marques disponibles pour une dimension
 */
export async function getAvailableBrands(
  width: number,
  height: number,
  diameter: number
): Promise<string[]> {
  const products = await prisma.product.findMany({
    where: {
      width,
      height,
      diameter,
      stockQuantity: { gt: 0 },
    },
    select: {
      brand: true,
    },
    distinct: ['brand'],
  });

  return products.map(p => p.brand).sort();
}

/**
 * Obtenir les fourchettes de prix disponibles
 */
export async function getPriceRanges(
  width: number,
  height: number,
  diameter: number
): Promise<{ min: number; max: number }> {
  const result = await prisma.product.aggregate({
    where: {
      width,
      height,
      diameter,
      stockQuantity: { gt: 0 },
    },
    _min: {
      priceRetail: true,
    },
    _max: {
      priceRetail: true,
    },
  });

  return {
    min: Number(result._min.priceRetail || 0),
    max: Number(result._max.priceRetail || 999),
  };
}

/**
 * Formater comparaison détaillée de produits
 */
export function formatProductComparison(products: Product[]): string {
  if (products.length === 0) return 'Aucun produit à comparer';

  let message = `📊 **COMPARAISON DÉTAILLÉE**\n\n`;

  products.forEach((product, index) => {
    const finalPrice = product.isOverstock && product.discountPercent
      ? Number(product.priceRetail) * (1 - product.discountPercent / 100)
      : Number(product.priceRetail);

    message += `${index + 1}. **${product.brand} ${product.model}**\n`;
    message += `━━━━━━━━━━━━━━━━\n`;
    message += `💰 Prix: ${finalPrice.toFixed(0)}€/pneu\n`;
    message += `📦 Stock: ${product.stockQuantity} unités\n`;
    message += `🏷️ Catégorie: ${product.category}\n`;
    message += `📏 Dimensions: ${product.dimensions}\n`;
    
    if (product.description) {
      message += `📝 ${product.description}\n`;
    }
    
    if (product.isOverstock) {
      message += `🎉 PROMO -${product.discountPercent}%\n`;
    }
    
    message += `\n`;
  });

  return message;
}

// ============================================
// CACHE IN-MEMORY (Simple)
// ============================================

interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

const searchCache = new Map<string, CacheEntry<AdvancedSearchResult>>();
const CACHE_TTL = 60 * 60 * 1000; // 1 heure

/**
 * Recherche avec cache
 */
export async function searchTyresWithCache(
  width: number,
  height: number,
  diameter: number,
  options: SearchFilters & { page?: number; limit?: number } = {}
): Promise<AdvancedSearchResult> {
  // Clé de cache unique
  const cacheKey = `${width}-${height}-${diameter}-${JSON.stringify(options)}`;

  // Vérifier le cache
  const cached = searchCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    console.log('✅ Cache HIT:', cacheKey);
    return cached.data;
  }

  console.log('❌ Cache MISS:', cacheKey);

  // Recherche en DB
  const result = await searchTyresAdvanced(width, height, diameter, options);

  // Stocker dans le cache
  searchCache.set(cacheKey, {
    data: result,
    timestamp: Date.now(),
  });

  return result;
}

/**
 * Nettoyer le cache expiré
 */
export function cleanExpiredCache(): void {
  const now = Date.now();
  let cleaned = 0;

  for (const [key, entry] of searchCache.entries()) {
    if (now - entry.timestamp > CACHE_TTL) {
      searchCache.delete(key);
      cleaned++;
    }
  }

  if (cleaned > 0) {
    console.log(`🧹 Cache cleaned: ${cleaned} entries removed`);
  }
}

// Nettoyer le cache toutes les heures
setInterval(cleanExpiredCache, 60 * 60 * 1000);

/**
 * Search tyres by dimensions
 */
export async function searchByDimensions(
  width: number,
  height: number,
  diameter: number
) {
  const dimensions = `${width}/${height}R${diameter}`;

  const products = await prisma.product.findMany({
    where: {
      width,
      height,
      diameter,
      stockQuantity: {
        gt: 0, // Only in-stock items
      },
    },
    orderBy: {
      priceRetail: 'asc',
    },
  });

  return {
    dimensions,
    products,
    count: products.length,
  };
}

/**
 * Group products by category
 */
export function groupByCategory(products: any[]): SearchResult {
  return {
    budget: products.find(p => p.category === ProductCategory.budget) || null,
    standard: products.find(p => p.category === ProductCategory.standard) || null,
    premium: products.find(p => p.category === ProductCategory.premium) || null,
  };
}

/**
 * Format search results for WhatsApp
 */
export function formatSearchResults(
  dimensions: string,
  grouped: SearchResult
): string {
  const { budget, standard, premium } = grouped;

  if (!budget && !standard && !premium) {
    return `❌ Désolé, aucun pneu trouvé pour ${dimensions}.\n\nVoulez-vous essayer d'autres dimensions ?`;
  }

  let message = `🔍 Résultats pour ${dimensions}\n\n`;
  message += `J'ai trouvé ${[budget, standard, premium].filter(Boolean).length} option(s) :\n\n`;

  if (budget) {
    const finalPrice = budget.isOverstock && budget.discountPercent
      ? Number(budget.priceRetail) * (1 - budget.discountPercent / 100)
      : Number(budget.priceRetail);

    message += `━━━━━━━━━━━━━━━━\n`;
    message += `💰 BUDGET - ${finalPrice.toFixed(0)}€/pneu\n`;
    message += `${budget.brand} ${budget.model}\n`;
    if (budget.description) {
      message += `• ${budget.description}\n`;
    }
    message += `• Stock: ${budget.stockQuantity} unités\n`;
    if (budget.isOverstock) {
      message += `🎉 PROMO -${budget.discountPercent}%\n`;
    }
    message += `\n`;
  }

  if (standard) {
    const finalPrice = standard.isOverstock && standard.discountPercent
      ? Number(standard.priceRetail) * (1 - standard.discountPercent / 100)
      : Number(standard.priceRetail);

    message += `━━━━━━━━━━━━━━━━\n`;
    message += `⭐ STANDARD - ${finalPrice.toFixed(0)}€/pneu ✨\n`;
    message += `${standard.brand} ${standard.model}\n`;
    message += `• Recommandé\n`;
    if (standard.description) {
      message += `• ${standard.description}\n`;
    }
    message += `• Stock: ${standard.stockQuantity} unités\n`;
    if (standard.isOverstock) {
      message += `🎉 PROMO -${standard.discountPercent}%\n`;
    }
    message += `\n`;
  }

  if (premium) {
    const finalPrice = premium.isOverstock && premium.discountPercent
      ? Number(premium.priceRetail) * (1 - premium.discountPercent / 100)
      : Number(premium.priceRetail);

    message += `━━━━━━━━━━━━━━━━\n`;
    message += `💎 PREMIUM - ${finalPrice.toFixed(0)}€/pneu\n`;
    message += `${premium.brand} ${premium.model}\n`;
    if (premium.description) {
      message += `• ${premium.description}\n`;
    }
    message += `• Stock: ${premium.stockQuantity} unités\n`;
    if (premium.isOverstock) {
      message += `🎉 PROMO -${premium.discountPercent}%\n`;
    }
    message += `\n`;
  }

  message += `━━━━━━━━━━━━━━━━\n\n`;
  message += `Quelle option vous intéresse ?\n`;
  message += `(Répondez: Budget, Standard ou Premium)`;

  return message;
}

/**
 * Get product by ID
 */
export async function getProductById(productId: string) {
  return await prisma.product.findUnique({
    where: { id: productId },
  });
}

/**
 * Check product availability
 */
export async function checkAvailability(productId: string, quantity: number) {
  const product = await getProductById(productId);

  if (!product) {
    return { available: false, reason: 'Product not found' };
  }

  if (product.stockQuantity < quantity) {
    return {
      available: false,
      reason: `Stock insuffisant. Disponible: ${product.stockQuantity}`,
    };
  }

  return { available: true, product };
}

/**
 * Search products by brand
 */
export async function searchByBrand(brand: string) {
  return await prisma.product.findMany({
    where: {
      brand: {
        contains: brand,
        mode: 'insensitive',
      },
      stockQuantity: {
        gt: 0,
      },
    },
    orderBy: {
      priceRetail: 'asc',
    },
    take: 10,
  });
}

/**
 * Get featured products (overstock with discounts)
 */
export async function getFeaturedProducts() {
  return await prisma.product.findMany({
    where: {
      isOverstock: true,
      discountPercent: {
        gt: 0,
      },
      stockQuantity: {
        gt: 0,
      },
    },
    orderBy: {
      discountPercent: 'desc',
    },
    take: 5,
  });
}

/**
 * Calculate final price with discount
 */
export function calculateFinalPrice(
  priceRetail: number,
  isOverstock: boolean,
  discountPercent?: number
): number {
  if (isOverstock && discountPercent) {
    return priceRetail * (1 - discountPercent / 100);
  }
  return priceRetail;
}
