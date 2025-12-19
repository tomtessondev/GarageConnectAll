import { prisma } from '@/lib/prisma';
import { getChatCompletion, extractDimensions, detectIntent } from './openai-client';
import { getSystemPrompt, getWelcomeMessage, getEnhancedSystemPrompt } from './system-prompt';
import { searchByDimensions, groupByCategory, formatSearchResults } from '@/lib/inventory/search-service';
import { addToCart, formatCartMessage, getCart, removeFromCart } from '@/lib/cart-service';
import { sendWhatsAppMessage } from '@/lib/whatsapp-helpers';

// NEW IMPORTS - AI-FIRST ARCHITECTURE
import type { ChatCompletionMessageParam, ChatCompletionMessageToolCall } from 'openai/resources/chat';
import { 
  getChatCompletionWithTools, 
  hasToolCalls, 
  extractToolCalls,
  formatToolResults,
  type ToolCallResult 
} from './openai-client';
import { 
  formatMessageWithProgress, 
  SalesStep,
  type ConversationContext 
} from '@/lib/progress-tracker';
import PerformanceMonitor, { globalPerformanceTracker } from '@/lib/performance-monitor';
import { 
  searchTyresWithCache, 
  getProductById, 
  getAvailableBrands,
  formatProductComparison 
} from '@/lib/inventory/search-service';

// ============================================
// PERFORMANCE: IN-MEMORY CACHE
// ============================================

interface CachedCustomer {
  customer: any;
  expires: number;
}

interface CachedCart {
  cart: any;
  expires: number;
}

const customerCache = new Map<string, CachedCustomer>();
const cartCache = new Map<string, CachedCart>(); // ⚡ NEW: Cart cache

// Clean expired cache entries every 5 minutes
setInterval(() => {
  const now = Date.now();
  
  // Clean customer cache
  for (const [key, value] of customerCache.entries()) {
    if (value.expires < now) {
      customerCache.delete(key);
    }
  }
  
  // Clean cart cache
  for (const [key, value] of cartCache.entries()) {
    if (value.expires < now) {
      cartCache.delete(key);
    }
  }
}, 5 * 60 * 1000);

/**
 * Get cart with cache (TTL: 30s)
 * ⚡ PHASE 2 OPTIMIZATION
 */
async function getCachedCart(customerId: string) {
  const cached = cartCache.get(customerId);
  if (cached && cached.expires > Date.now()) {
    console.log(`⚡ Cart cache HIT: ${customerId}`);
    return cached.cart;
  }
  
  const cart = await getCart(customerId);
  
  // Cache for 30 seconds
  cartCache.set(customerId, {
    cart,
    expires: Date.now() + 30 * 1000,
  });
  
  return cart;
}

/**
 * Invalidate cart cache
 */
function invalidateCartCache(customerId: string) {
  cartCache.delete(customerId);
  console.log(`🗑️ Cart cache invalidated: ${customerId}`);
}

/**
 * Get or create customer from phone number
 * ⚡ OPTIMIZED: In-memory cache (TTL: 5 min)
 */
async function getOrCreateCustomer(phoneNumber: string) {
  // Check cache first
  const cached = customerCache.get(phoneNumber);
  if (cached && cached.expires > Date.now()) {
    console.log(`⚡ Customer cache HIT: ${phoneNumber}`);
    return cached.customer;
  }

  // Cache miss - fetch from DB with minimal fields
  let customer = await prisma.customer.findUnique({
    where: { phoneNumber },
    select: {
      id: true,
      phoneNumber: true,
      firstName: true,
      lastName: true,
      email: true,
      // Don't load relations to save time
    },
  });

  if (!customer) {
    customer = await prisma.customer.create({
      data: {
        phoneNumber,
        country: 'Guadeloupe',
      },
      select: {
        id: true,
        phoneNumber: true,
        firstName: true,
        lastName: true,
        email: true,
      },
    });
    console.log('✅ New customer created:', phoneNumber);
  }

  // Cache for 5 minutes
  customerCache.set(phoneNumber, {
    customer,
    expires: Date.now() + 5 * 60 * 1000,
  });

  return customer;
}

/**
 * Get or create conversation
 */
async function getOrCreateConversation(customerId: string, phoneNumber: string) {
  // Get active conversation
  let conversation = await prisma.conversation.findFirst({
    where: {
      customerId,
      status: 'active',
    },
    include: {
      messages: {
        orderBy: { timestamp: 'desc' },
        take: 3, // Last 3 messages for context (ultra-optimized)
      },
    },
  });

  if (!conversation) {
    conversation = await prisma.conversation.create({
      data: {
        customerId,
        phoneNumber,
        state: 'greeting',
        status: 'active',
      },
      include: {
        messages: true,
      },
    });
  }

  return conversation;
}

/**
 * Save message to database
 */
async function saveMessage(
  conversationId: string,
  sender: 'user' | 'assistant',
  content: string,
  metadata?: Record<string, unknown>
) {
  return await prisma.message.create({
    data: {
      conversationId,
      sender,
      content,
      metadata,
    },
  });
}

/**
 * Get conversation history for AI context
 */
function getConversationHistory(messages: any[]) {
  return messages
    .reverse()
    .map(msg => ({
      role: msg.sender as 'user' | 'assistant',
      content: msg.content,
    }));
}

/**
 * Handle search tyres action
 */
async function handleSearchTyres(message: string, customer: any) {
  // Try to extract dimensions
  const dims = await extractDimensions(message);

  if (!dims) {
    return {
      response: `🔍 Pour rechercher des pneus, j'ai besoin de 3 mesures :\n\n` +
        `📏 Largeur (ex: 205)\n` +
        `📏 Hauteur (ex: 55)\n` +
        `📏 Diamètre (ex: 16)\n\n` +
        `Format complet: 205/55R16\n\n` +
        `Quelles sont les dimensions de vos pneus ?`,
      metadata: { action: 'awaiting_dimensions' },
    };
  }

  // Search products
  const searchResult = await searchByDimensions(dims.width, dims.height, dims.diameter);

  if (searchResult.count === 0) {
    return {
      response: `❌ Désolé, aucun pneu trouvé pour ${searchResult.dimensions}.\n\n` +
        `Voulez-vous essayer d'autres dimensions ?`,
      metadata: { action: 'search_failed', dimensions: searchResult.dimensions },
    };
  }

  // Group by category
  const grouped = groupByCategory(searchResult.products);

  // Format results
  const response = formatSearchResults(searchResult.dimensions, grouped);

  return {
    response,
    metadata: {
      action: 'search_results',
      dimensions: searchResult.dimensions,
      results: {
        budget: grouped.budget?.id,
        standard: grouped.standard?.id,
        premium: grouped.premium?.id,
      },
    },
  };
}

/**
 * Handle add to cart action
 */
async function handleAddToCart(
  productId: string,
  quantity: number,
  customer: any
) {
  try {
    const cartItem = await addToCart(customer.id, productId, quantity);

    return {
      response: `✅ Ajouté au panier !\n\n` +
        `${cartItem.product.brand} ${cartItem.product.model}\n` +
        `${cartItem.quantity}x ${cartItem.product.priceRetail}€\n\n` +
        `Que souhaitez-vous faire ?\n` +
        `• Continuer mes achats\n` +
        `• Voir mon panier\n` +
        `• Passer commande`,
      metadata: { action: 'added_to_cart', productId, quantity },
    };
  } catch (error) {
    console.error('Error adding to cart:', error);
    return {
      response: `❌ Erreur lors de l'ajout au panier. Veuillez réessayer.`,
      metadata: { action: 'add_to_cart_failed', error: String(error) },
    };
  }
}

/**
 * Handle view cart action
 */
async function handleViewCart(customer: any) {
  const cartMessage = await formatCartMessage(customer.id);

  return {
    response: cartMessage,
    metadata: { action: 'view_cart' },
  };
}

/**
 * Handle view orders action
 */
async function handleViewOrders(customer: any) {
  const orders = await prisma.order.findMany({
    where: { customerId: customer.id },
    orderBy: { createdAt: 'desc' },
    take: 5,
    include: {
      items: {
        include: {
          product: true,
        },
      },
    },
  });

  if (orders.length === 0) {
    return {
      response: `📦 Vous n'avez pas encore de commandes.\n\n` +
        `Commencez par rechercher des pneus ! 🔍`,
      metadata: { action: 'no_orders' },
    };
  }

  let message = `📦 VOS COMMANDES\n\n`;

  orders.forEach((order, index) => {
    message += `${index + 1}. Commande ${order.orderNumber}\n`;
    message += `   Date: ${new Date(order.createdAt).toLocaleDateString('fr-FR')}\n`;
    message += `   Statut: ${getStatusEmoji(order.status)} ${order.status}\n`;
    message += `   Total: ${order.totalAmount}€\n\n`;
  });

  message += `Pour plus de détails, indiquez le numéro de commande.`;

  return {
    response: message,
    metadata: { action: 'orders_list', count: orders.length },
  };
}

/**
 * Get status emoji
 */
function getStatusEmoji(status: string): string {
  const emojis: Record<string, string> = {
    pending: '⏳',
    confirmed: '✅',
    paid: '💳',
    ready_pickup: '📦',
    completed: '✨',
    cancelled: '❌',
  };
  return emojis[status] || '📋';
}

/**
 * Handle show rules action
 */
async function handleShowRules() {
  return {
    response: `📋 RÈGLES ET CONDITIONS - GarageConnect\n\n` +
      `━━━━━━━━━━━━━━━━\n` +
      `✅ COMMANDE\n` +
      `• Paiement sécurisé par Stripe\n` +
      `• Paiement en 4x sans frais disponible\n` +
      `• Confirmation instantanée par WhatsApp\n\n` +
      `📦 RETRAIT\n` +
      `• Retrait sous 24-48h après paiement\n` +
      `• QR code envoyé par WhatsApp\n` +
      `• Présentez votre QR code à l'entrepôt\n\n` +
      `⏰ HORAIRES\n` +
      `• Lundi - Samedi : 8h - 18h\n` +
      `• Dimanche : Fermé\n\n` +
      `🔄 RETOURS ET ÉCHANGES\n` +
      `• Pneus non montés : 14 jours\n` +
      `• Défauts de fabrication : Garantie constructeur\n\n` +
      `💳 PAIEMENT\n` +
      `• Carte bancaire (Visa, Mastercard)\n` +
      `• Paiement en 4x sans frais\n` +
      `• 100% sécurisé par Stripe\n\n` +
      `📞 CONTACT\n` +
      `• WhatsApp : Répondez à ce message\n` +
      `• Email : contact@garageconnect.gp\n` +
      `━━━━━━━━━━━━━━━━\n\n` +
      `D'autres questions ?`,
    metadata: { action: 'show_rules' },
  };
}

/**
 * Handle product selection
 */
async function handleSelectProduct(message: string, conversation: any, customer: any) {
  // Get last search results from conversation context
  const lastContext = conversation.context;
  
  if (!lastContext || !lastContext.results) {
    return {
      response: `❌ Je n'ai pas trouvé de résultats de recherche récents.\n\n` +
        `Veuillez d'abord rechercher des pneus en m'indiquant les dimensions.`,
      metadata: { action: 'no_search_results' },
    };
  }

  // Detect which category was selected
  const messageLower = message.toLowerCase().trim();
  let selectedProductId: string | null = null;
  let categoryName = '';

  if (messageLower.includes('budget') || messageLower === '1') {
    selectedProductId = lastContext.results.budget;
    categoryName = 'Budget';
  } else if (messageLower.includes('standard') || messageLower === '2') {
    selectedProductId = lastContext.results.standard;
    categoryName = 'Standard';
  } else if (messageLower.includes('premium') || messageLower === '3') {
    selectedProductId = lastContext.results.premium;
    categoryName = 'Premium';
  }

  if (!selectedProductId) {
    return {
      response: `❌ Je n'ai pas compris votre sélection.\n\n` +
        `Veuillez choisir parmi:\n` +
        `• Budget (ou 1)\n` +
        `• Standard (ou 2)\n` +
        `• Premium (ou 3)`,
      metadata: { action: 'invalid_selection' },
    };
  }

  // Get product details
  const product = await prisma.product.findUnique({
    where: { id: selectedProductId },
  });

  if (!product) {
    return {
      response: `❌ Produit non disponible. Veuillez refaire une recherche.`,
      metadata: { action: 'product_not_found' },
    };
  }

  return {
    response: `✅ Excellent choix ! ${categoryName}\n\n` +
      `${product.brand} ${product.model}\n` +
      `${product.dimensions}\n` +
      `Prix: ${product.priceRetail}€/pneu\n\n` +
      `Combien de pneus souhaitez-vous ?\n` +
      `• Généralement 2 ou 4 pneus\n\n` +
      `Répondez avec le nombre (ex: 4)`,
    metadata: {
      action: 'awaiting_quantity',
      selectedProductId: product.id,
      productInfo: {
        brand: product.brand,
        model: product.model,
        price: Number(product.priceRetail),
      },
    },
  };
}

/**
 * Handle show tutorial action
 */
async function handleShowTutorial() {
  return {
    response: `📚 COMMENT ÇA FONCTIONNE ?\n\n` +
      `━━━━━━━━━━━━━━━━\n` +
      `ÉTAPE 1 : RECHERCHE 🔍\n` +
      `Donnez-moi les dimensions de vos pneus:\n` +
      `• Largeur (ex: 205)\n` +
      `• Hauteur (ex: 55)\n` +
      `• Diamètre (ex: 16)\n` +
      `Format: 205/55R16\n\n` +
      `ÉTAPE 2 : CHOIX 💰\n` +
      `Je vous propose 3 catégories:\n` +
      `• 💰 Budget - Économique\n` +
      `• ⭐ Standard - Recommandé\n` +
      `• 💎 Premium - Haute performance\n\n` +
      `ÉTAPE 3 : OPTIONS 🔧\n` +
      `Ajoutez des services:\n` +
      `• Montage des pneus (+20€/pneu)\n` +
      `• Livraison à domicile (+15€)\n\n` +
      `ÉTAPE 4 : PANIER 🛒\n` +
      `Vérifiez votre panier:\n` +
      `• Modifiez les quantités\n` +
      `• Ajoutez d'autres articles\n` +
      `• Validez quand vous êtes prêt\n\n` +
      `ÉTAPE 5 : COORDONNÉES 📋\n` +
      `Je collecte:\n` +
      `• Prénom et Nom\n` +
      `• Email\n` +
      `• Numéro de téléphone\n\n` +
      `ÉTAPE 6 : PAIEMENT 💳\n` +
      `Paiement sécurisé:\n` +
      `• Lien de paiement Stripe\n` +
      `• Paiement en 4x sans frais\n` +
      `• Confirmation instantanée\n\n` +
      `ÉTAPE 7 : RETRAIT 📦\n` +
      `Récupérez vos pneus:\n` +
      `• QR code envoyé par WhatsApp\n` +
      `• Présentez-le à l'entrepôt\n` +
      `• Commande prête sous 24-48h\n` +
      `━━━━━━━━━━━━━━━━\n\n` +
      `C'est simple et rapide ! 🚀\n` +
      `Que voulez-vous faire ?`,
    metadata: { action: 'show_tutorial' },
  };
}

// ============================================
// NEW FUNCTIONS - AI-FIRST ARCHITECTURE
// ============================================

/**
 * Build rich context from conversation and customer data
 * ⚡ PHASE 2 OPTIMIZED: Cart cache + Lazy loading
 */
async function buildRichContext(
  customer: any,
  conversation: any
): Promise<ConversationContext & { currentStep: SalesStep }> {
  // Extract metadata first to determine what to load
  const conversationMeta = (conversation.metadata || conversation.context || {}) as Record<string, any>;
  const currentStep = (conversationMeta.currentStep as SalesStep) || SalesStep.GREETING;
  
  // ⚡ LAZY LOADING: Only load cart if needed for current step
  let cart;
  if ([SalesStep.CART, SalesStep.CHECKOUT, SalesStep.PAYMENT].includes(currentStep)) {
    cart = await getCachedCart(customer.id); // Use cached version
  } else {
    // Fast path: empty cart structure
    cart = { items: [] };
  }
  
  // ⚡ LAZY LOADING: Only load orders if on order-related step
  let orders = [];
  if (currentStep === SalesStep.CONFIRMATION || conversationMeta.viewingOrders) {
    orders = await prisma.order.findMany({
      where: { customerId: customer.id },
      orderBy: { createdAt: 'desc' },
      take: 5,
    });
  }
  
  // Calculate cart total
  const cartTotal = cart.items.reduce((sum: number, item: any) => {
    return sum + (Number(item.product.priceRetail) * item.quantity);
  }, 0);

  return {
    // Search
    searchDimensions: conversationMeta.searchDimensions,
    searchResults: conversationMeta.searchResults,
    
    // Selection
    selectedProductId: conversationMeta.selectedProductId,
    selectedCategory: conversationMeta.selectedCategory,
    
    // Cart
    cartItems: cart.items.map((item: any) => ({
      id: item.id,
      quantity: item.quantity,
      product: {
        priceRetail: item.product.priceRetail,
        ...item.product,
      },
    })),
    cartTotal,
    
    // Other
    hasViewedDetails: conversationMeta.hasViewedDetails || false,
    lastActivity: conversation.startedAt?.toISOString() || new Date().toISOString(),
    
    // Current step
    currentStep,
  };
}

/**
 * Update conversation metadata
 */
async function updateConversationMetadata(
  conversationId: string,
  updates: Partial<ConversationContext & { currentStep: SalesStep }>
): Promise<void> {
  const conversation = await prisma.conversation.findUnique({
    where: { id: conversationId },
  });
  
  if (!conversation) return;
  
  const currentMetadata = (conversation.metadata || conversation.context || {}) as Record<string, any>;
  
  await prisma.conversation.update({
    where: { id: conversationId },
    data: {
      context: {
        ...currentMetadata,
        ...updates,
      } as any,
    },
  });
}

/**
 * Execute tool calls from GPT-4
 */
async function executeToolCalls(
  toolCalls: ChatCompletionMessageToolCall[],
  customer: any,
  conversationId: string,
  conversation: any
): Promise<ToolCallResult[]> {
  const results: ToolCallResult[] = [];

  for (const toolCall of toolCalls) {
    const functionName = toolCall.function.name;
    const args = JSON.parse(toolCall.function.arguments);

    console.log(`🤖 GPT-4 calls: ${functionName}`, args);

    try {
      let result: any;

      switch (functionName) {
        case 'search_tyres':
          console.log(`🔍 SEARCH ARGS: width=${args.width}, height=${args.height}, diameter=${args.diameter}, category=${args.category}`);
          
          const searchResult = await searchTyresWithCache(
            args.width,
            args.height,
            args.diameter,
            {
              category: args.category,
              brand: args.brand,
              page: args.page || 1,
            }
          );
          
          console.log(`📦 SEARCH RESULT: ${searchResult.products.length} products found for ${searchResult.dimensions}`);
          if (searchResult.products.length > 0) {
            console.log(`✅ First product: ${searchResult.products[0].brand} ${searchResult.products[0].model} - ${searchResult.products[0].priceRetail}€`);
            console.log(`   📋 PRODUCT ID (USE THIS): "${searchResult.products[0].id}"`);
          } else {
            console.log(`❌ NO PRODUCTS FOUND! Dimensions: ${args.width}/${args.height}R${args.diameter}`);
          }
          
          // Update metadata
          await updateConversationMetadata(conversationId, {
            searchDimensions: `${args.width}/${args.height}R${args.diameter}`,
            searchResults: searchResult.products,
            currentStep: SalesStep.RESULTS,
          });
          
          result = {
            success: true,
            dimensions: searchResult.dimensions,
            productsCount: searchResult.products.length,
            products: searchResult.products.slice(0, 6).map(p => ({
              id: p.id, // ✅ IMPORTANT : Inclure l'ID
              brand: p.brand,
              model: p.model,
              priceRetail: Number(p.priceRetail),
              stockQuantity: p.stockQuantity,
              category: p.category,
              dimensions: p.dimensions,
            })),
            pagination: searchResult.pagination,
          };
          break;

        case 'add_to_cart':
          console.log(`🛒 ADD TO CART: productId="${args.productId}", quantity=${args.quantity}`);
          
          // SMART FIX: If productId is a number (1, 2, 3) or looks fake, try to get from search results
          let actualProductId = args.productId;
          
          // Check if it's a number or index reference
          const indexMatch = args.productId.match(/^(\d+)$/);
          if (indexMatch) {
            const index = parseInt(indexMatch[1]) - 1; // Convert to 0-based index
            const conversationMeta = (conversation.metadata || conversation.context || {}) as Record<string, any>;
            const searchResults = conversationMeta.searchResults || [];
            
            if (searchResults[index]) {
              actualProductId = searchResults[index].id;
              console.log(`🔄 Converted index ${args.productId} to UUID: ${actualProductId}`);
            } else {
              console.log(`⚠️ Index ${args.productId} not found in search results (${searchResults.length} products)`);
            }
          }
          // Check if it looks like a fake ID (contains dashes and letters but not UUID format)
          else if (!args.productId.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
            console.log(`⚠️ Detected potentially fake ID: ${args.productId}`);
            // Try to find in search results by matching name
            const conversationMeta = (conversation.metadata || conversation.context || {}) as Record<string, any>;
            const searchResults = conversationMeta.searchResults || [];
            
            if (searchResults.length > 0) {
              actualProductId = searchResults[0].id; // Use first result as fallback
              console.log(`🔄 Using first search result as fallback: ${actualProductId}`);
            }
          }
          
          const product = await getProductById(actualProductId);
          if (!product) {
            console.log(`❌ Product NOT FOUND with ID: ${actualProductId}`);
            throw new Error('Product not found');
          }
          console.log(`✅ Product FOUND: ${product.brand} ${product.model}`);
          
          // ✅ CRITICAL: Use actualProductId (the corrected UUID), not args.productId!
          await addToCart(customer.id, actualProductId, args.quantity);
          
          await updateConversationMetadata(conversationId, {
            currentStep: SalesStep.CART,
          });
          
          result = {
            success: true,
            message: `${args.quantity}x ${product.brand} ${product.model} ajouté(s)`,
            product,
            quantity: args.quantity,
          };
          break;

        case 'view_cart':
          const cart = await getCart(customer.id);
          result = {
            success: true,
            itemsCount: cart.items.length,
            items: cart.items.map((item: any) => ({
              cartItemId: item.id, // ✅ IMPORTANT: Inclure l'ID du cartItem
              quantity: item.quantity,
              product: {
                id: item.product.id,
                brand: item.product.brand,
                model: item.product.model,
                dimensions: item.product.dimensions,
                priceRetail: Number(item.product.priceRetail),
                category: item.product.category,
              },
              subtotal: Number(item.product.priceRetail) * item.quantity,
            })),
            total: cart.items.reduce((sum: number, item: any) => {
              return sum + (Number(item.product.priceRetail) * item.quantity);
            }, 0),
          };
          break;

        case 'remove_from_cart':
          console.log(`🗑️ REMOVE FROM CART: cartItemId="${args.cartItemId}"`);
          await removeFromCart(args.cartItemId);
          result = {
            success: true,
            message: 'Article retiré du panier',
          };
          break;

        case 'update_cart_quantity':
          console.log(`🔄 UPDATE QUANTITY: cartItemId="${args.cartItemId}", quantity=${args.quantity}`);
          const { updateCartItem } = await import('@/lib/cart-service');
          const updatedItem = await updateCartItem(args.cartItemId, args.quantity);
          result = {
            success: true,
            message: `Quantité mise à jour: ${args.quantity} pneus`,
            item: updatedItem,
          };
          break;

        case 'clear_cart':
          console.log(`🧹 CLEAR CART for customer ${customer.id}`);
          const { clearCart } = await import('@/lib/cart-service');
          await clearCart(customer.id);
          result = {
            success: true,
            message: 'Panier vidé complètement',
          };
          break;

        case 'replace_product_in_cart':
          console.log(`🔄 REPLACE PRODUCT: old="${args.oldCartItemId}", new="${args.newProductId}", quantity=${args.quantity || 'keep same'}`);
          
          // Get current cart item to know the quantity
          const cartToReplace = await getCart(customer.id);
          const itemToReplace = cartToReplace.items.find((item: any) => item.id === args.oldCartItemId);
          
          if (!itemToReplace) {
            throw new Error('Article non trouvé dans le panier');
          }
          
          const quantityToUse = args.quantity || itemToReplace.quantity;
          
          // Remove old item
          await removeFromCart(args.oldCartItemId);
          
          // Add new item
          const newProduct = await getProductById(args.newProductId);
          if (!newProduct) {
            throw new Error('Nouveau produit non trouvé');
          }
          
          await addToCart(customer.id, args.newProductId, quantityToUse);
          
          result = {
            success: true,
            message: `Produit remplacé: ${itemToReplace.product.brand} ${itemToReplace.product.model} → ${newProduct.brand} ${newProduct.model}`,
            oldProduct: itemToReplace.product,
            newProduct: newProduct,
            quantity: quantityToUse,
          };
          break;

        case 'update_progress':
          await updateConversationMetadata(conversationId, {
            currentStep: args.step as SalesStep,
          });
          result = {
            success: true,
            newStep: args.step,
          };
          break;

        case 'get_product_details':
          const productDetails = await getProductById(args.productId);
          result = {
            success: true,
            product: productDetails,
          };
          break;

        case 'get_available_brands':
          const brands = await getAvailableBrands(
            args.width,
            args.height,
            args.diameter
          );
          result = {
            success: true,
            brands,
          };
          break;

        case 'get_order_status':
          const order = await prisma.order.findFirst({
            where: {
              orderNumber: args.orderNumber,
              customerId: customer.id,
            },
            include: {
              items: {
                include: {
                  product: true,
                },
              },
            },
          });
          result = {
            success: true,
            order,
          };
          break;

        case 'list_orders':
          const orders = await prisma.order.findMany({
            where: { customerId: customer.id },
            orderBy: { createdAt: 'desc' },
            take: args.limit || 5,
            include: {
              items: {
                include: {
                  product: true,
                },
              },
            },
          });
          result = {
            success: true,
            orders,
            count: orders.length,
          };
          break;

        case 'compare_products':
          const products = await Promise.all(
            (args.productIds as string[]).map((id: string) => getProductById(id))
          );
          const comparison = formatProductComparison(products.filter(Boolean) as any[]);
          result = {
            success: true,
            comparison,
            products: products.filter(Boolean),
          };
          break;

        case 'create_order':
          console.log(`💳 CREATE ORDER: address="${args.deliveryAddress}", email=${args.email}, name=${args.firstName} ${args.lastName}`);
          
          // VALIDATION STRICTE : Détecter données fake/inventées
          const fakeEmails = ['example.com', '@test', '@fake', 'sample@', 'demo@'];
          const fakeNames = ['tom dupont', 'jean dupont', 'john doe', 'jane doe', 'test user'];
          const fullName = `${args.firstName} ${args.lastName}`.toLowerCase();
          
          // Vérifier email fake
          if (fakeEmails.some(fake => args.email.toLowerCase().includes(fake))) {
            console.error(`❌ FAKE EMAIL DETECTED: ${args.email}`);
            throw new Error('Email invalide détecté. Veuillez utiliser l\'email réel du client.');
          }
          
          // Vérifier nom fake
          if (fakeNames.includes(fullName)) {
            console.error(`❌ FAKE NAME DETECTED: ${fullName}`);
            throw new Error('Nom invalide détecté. Veuillez utiliser le nom réel du client.');
          }
          
          // Vérifier que toutes les données sont présentes
          if (!args.deliveryAddress || !args.email || !args.firstName || !args.lastName) {
            console.error(`❌ MISSING DATA: address=${!!args.deliveryAddress}, email=${!!args.email}, firstName=${!!args.firstName}, lastName=${!!args.lastName}`);
            throw new Error('Toutes les informations client sont requises.');
          }
          
          console.log(`✅ Validation passed - Creating order with real data`);
          
          // Import order service functions
          const { createOrderFromCart, createCheckoutSession, formatOrderConfirmation } = await import('@/lib/order-service');
          
          // ⚡ PHASE 3: Parallelize customer update + order creation
          const [_, newOrder] = await Promise.all([
            prisma.customer.update({
              where: { id: customer.id },
              data: {
                email: args.email,
                firstName: args.firstName,
                lastName: args.lastName,
              },
            }),
            createOrderFromCart(
              customer.id,
              args.deliveryAddress,
              conversationId
            ),
          ]);
          console.log(`✅ Order created: ${newOrder.orderNumber}`);
          
          // ✅ NEW: Create Stripe Checkout Session (instead of Payment Intent)
          const { session, paymentUrl } = await createCheckoutSession(newOrder.id);
          console.log(`✅ Payment checkout URL generated: ${paymentUrl}`);
          
          // ⚡ PHASE 3: Invalidate cart cache (important!)
          invalidateCartCache(customer.id);
          
          // Update conversation metadata (fire and forget)
          updateConversationMetadata(conversationId, {
            currentStep: SalesStep.PAYMENT,
            stripeSessionId: session.id,
          }).catch(err => console.error('Error updating metadata:', err));
          
          // ⚡ PHASE 3 CRITICAL: Return formatted message directly
          // This will be used by the tool result and bypass the 2nd GPT call!
          const confirmationMessage = formatOrderConfirmation(newOrder, paymentUrl);
          
          result = {
            success: true,
            order: {
              id: newOrder.id,
              orderNumber: newOrder.orderNumber,
              total: newOrder.totalAmount,
            },
            paymentUrl,
            confirmationMessage,
          };
          break;

        default:
          throw new Error(`Unknown function: ${functionName}`);
      }

      results.push({
        toolCallId: toolCall.id,
        functionName,
        result,
        success: true,
      });

    } catch (error: any) {
      console.error(`❌ Error executing ${functionName}:`, error);
      results.push({
        toolCallId: toolCall.id,
        functionName,
        result: null,
        success: false,
        error: error.message || 'Unknown error',
      });
    }
  }

  return results;
}

/**
 * Handle message with AI-first architecture
 */
async function handleMessageAIFirst(
  message: string,
  phoneNumber: string
): Promise<string> {
  const monitor = new PerformanceMonitor();
  monitor.startTimer('total');

  try {
    // 1. Get customer & conversation
    monitor.startTimer('db_customer');
    const customer = await getOrCreateCustomer(phoneNumber);
    const conversation = await getOrCreateConversation(customer.id, phoneNumber);
    monitor.endTimer('db_customer');

    // 2. Build rich context
    monitor.startTimer('db_context');
    const context = await buildRichContext(customer, conversation);
    monitor.endTimer('db_context');

    // 3. Get customer info
    const customerInfo = {
      firstName: customer.firstName,
      lastName: customer.lastName,
      orderCount: await prisma.order.count({ where: { customerId: customer.id } }),
      lastOrderDate: (await prisma.order.findFirst({
        where: { customerId: customer.id },
        orderBy: { createdAt: 'desc' },
      }))?.createdAt,
    };

    // 4. Get enhanced system prompt
    const systemPrompt = await getEnhancedSystemPrompt(
      context,
      customerInfo,
      context.currentStep
    );

    // 5. Build conversation history (ultra-optimized: 3 messages only)
    const history = conversation.messages
      .slice(-3)
      .reverse()
      .map((msg: any) => ({
        role: msg.sender === 'user' ? 'user' as const : 'assistant' as const,
        content: msg.content,
      }));

    const messages: ChatCompletionMessageParam[] = [
      { role: 'system', content: systemPrompt },
      ...history,
      { role: 'user', content: message },
    ];

    // 6. Call GPT-4 (or GPT-4o-mini for simple messages) with Function Calling
    // ⚡ OPTIMIZATION: Use GPT-4o-mini MORE AGGRESSIVELY
    const wordCount = message.trim().split(/\s+/).length;
    
    // Detect simple patterns (email, address, numbers, etc.)
    const isEmail = /^[a-z0-9@._-]+$/i.test(message.trim());
    const isNumber = /^\d+$/.test(message.trim());
    const isSimpleText = /^[a-z0-9\s,.-]+$/i.test(message.trim()) && wordCount <= 10;
    const isDimensions = message.match(/\d{3}.*\d{2}.*\d{2}/);
    
    // Use GPT-4o-mini for:
    // - Messages ≤10 words
    // - Email patterns
    // - Simple numbers
    // - Simple text (addresses, names)
    // BUT NOT for dimensions (need GPT-4 for tool calling)
    const isSimpleMessage = 
      (wordCount <= 10 || isEmail || isNumber || isSimpleText) && 
      !isDimensions;
    
    const modelToUse = isSimpleMessage ? 'gpt-4o-mini' : 'gpt-4';
    
    if (isSimpleMessage) {
      console.log(`⚡ GPT-4o-mini (${wordCount} words, pattern: ${isEmail ? 'email' : isNumber ? 'number' : 'text'})`);
    }
    
    monitor.startTimer('ai_gpt4');
    const completion = await getChatCompletionWithTools(messages, {
      currentStep: context.currentStep,
      model: modelToUse,
    });
    monitor.endTimer('ai_gpt4');

    // 7. Handle tool calls
    if (hasToolCalls(completion)) {
      const toolCalls = extractToolCalls(completion);
      
      monitor.startTimer('tools_execution');
      const results = await executeToolCalls(toolCalls, customer, conversation.id, conversation);
      monitor.endTimer('tools_execution');

      // ⚡ PHASE 3 CRITICAL: Check if tool returned a pre-formatted confirmation message
      // If so, use it directly and BYPASS the 2nd GPT call (saves 6-7s!)
      const createOrderResult = results.find(r => r.functionName === 'create_order' && r.success);
      if (createOrderResult && createOrderResult.result?.confirmationMessage) {
        console.log('⚡ PHASE 3: Using pre-formatted confirmation message - BYPASSING 2nd GPT call!');
        const response = createOrderResult.result.confirmationMessage;
        
        // Refresh context
        const updatedContext = await buildRichContext(customer, conversation);
        
        // Format with progress bar
        const formattedResponse = formatMessageWithProgress(
          response,
          updatedContext.currentStep,
          updatedContext,
          { 
            showFullBar: true, 
            showSuggestions: false, // No suggestions for order confirmation
            showCartSummary: false,  // No cart summary (already in message)
          }
        );

        // Save messages
        await saveMessage(conversation.id, 'user', message);
        await saveMessage(conversation.id, 'assistant', formattedResponse);

        const totalDuration = monitor.endTimer('total');
        monitor.logSummary();
        console.log(`🚀 PHASE 3 OPTIMIZATION: Saved ~6-7s by bypassing 2nd GPT call!`);
        globalPerformanceTracker.recordRequest(totalDuration);

        return formattedResponse;
      }

      // Standard flow: Send results back to GPT-4 for normal tool calls
      const finalMessages: ChatCompletionMessageParam[] = [
        ...messages,
        completion.choices[0].message as any,
        ...formatToolResults(results),
      ];

      monitor.startTimer('ai_gpt4_final');
      const finalCompletion = await getChatCompletionWithTools(finalMessages);
      monitor.endTimer('ai_gpt4_final');

      const response = finalCompletion.choices[0].message.content || '';
      
      // Refresh context
      const updatedContext = await buildRichContext(customer, conversation);
      
      // Format with progress bar
      const formattedResponse = formatMessageWithProgress(
        response,
        updatedContext.currentStep,
        updatedContext,
        { 
          showFullBar: true, 
          showSuggestions: true,
          showCartSummary: true,
        }
      );

      // Save messages
      await saveMessage(conversation.id, 'user', message);
      await saveMessage(conversation.id, 'assistant', formattedResponse);

      const totalDuration = monitor.endTimer('total');
      monitor.logSummary();
      globalPerformanceTracker.recordRequest(totalDuration);

      return formattedResponse;
    }

    // 8. Simple conversational response
    const response = completion.choices[0].message.content || '';
    const formattedResponse = formatMessageWithProgress(
      response,
      context.currentStep,
      context
    );

    await saveMessage(conversation.id, 'user', message);
    await saveMessage(conversation.id, 'assistant', formattedResponse);

    const totalDuration = monitor.endTimer('total');
    monitor.logSummary();
    globalPerformanceTracker.recordRequest(totalDuration);

    return formattedResponse;

  } catch (error) {
    console.error('❌ Error in handleMessageAIFirst:', error);
    monitor.endTimer('total');
    monitor.logSummary();
    
    return '❌ Désolé, une erreur est survenue. Pouvez-vous reformuler ?';
  }
}

// ============================================
// LEGACY FUNCTIONS (kept for compatibility)
// ============================================

/**
 * Process message with AI and context
 */
async function processWithAI(
  message: string,
  conversation: any,
  customer: any
) {
  const systemPrompt = await getSystemPrompt();
  const history = getConversationHistory(conversation.messages);

  // Build context
  const context = {
    customerInfo: {
      hasOrders: (await prisma.order.count({ where: { customerId: customer.id } })) > 0,
      cartItemCount: (await getCart(customer.id)).items.length,
    },
    conversationState: conversation.state,
    lastAction: conversation.context?.lastAction,
  };

  // Special case: if waiting for quantity and message is a number
  if (context.lastAction === 'awaiting_quantity') {
    const quantity = parseInt(message.trim());
    if (!isNaN(quantity) && quantity > 0 && quantity <= 10) {
      const selectedProductId = conversation.context?.selectedProductId;
      if (selectedProductId) {
        return await handleAddToCart(selectedProductId, quantity, customer);
      }
    } else if (!isNaN(quantity)) {
      return {
        response: `❌ Quantité invalide. Veuillez choisir entre 1 et 10 pneus.`,
        metadata: { action: 'invalid_quantity' },
      };
    }
  }

  // Detect intent
  const intent = await detectIntent(message, context);

  // Execute action based on intent
  switch (intent.action) {
    case 'search_tyres':
      return await handleSearchTyres(message, customer);

    case 'view_cart':
      return await handleViewCart(customer);

    case 'view_orders':
      return await handleViewOrders(customer);

    case 'show_rules':
      return await handleShowRules();

    case 'show_tutorial':
      return await handleShowTutorial();

    case 'select_product':
      return await handleSelectProduct(message, conversation, customer);

    case 'add_to_cart':
      if (intent.parameters?.productId && intent.parameters?.quantity) {
        return await handleAddToCart(
          intent.parameters.productId as string,
          intent.parameters.quantity as number,
          customer
        );
      }
      return {
        response: `Pour ajouter un article au panier, choisissez d'abord un pneu depuis les résultats de recherche.`,
        metadata: { action: 'add_to_cart_incomplete' },
      };

    case 'checkout':
      // Will be handled in order-service
      return {
        response: `📋 Pour passer commande, j'ai besoin de votre adresse de livraison.\n\n` +
          `Format: Numéro, Rue, Ville, Code postal\n` +
          `Exemple: 15 Rue des Palmiers, Pointe-à-Pitre, 97110`,
        metadata: { action: 'awaiting_address' },
      };

    case 'leave_review':
      return {
        response: `⭐ Pour laisser un avis, indiquez votre commande et votre note de 1 à 5 étoiles.`,
        metadata: { action: 'awaiting_review' },
      };

    default:
      // General chat - use GPT-4
      const aiResponse = await getChatCompletion([
        { role: 'system', content: systemPrompt },
        ...history,
        { role: 'user', content: message },
      ]);

      return {
        response: aiResponse,
        metadata: { action: 'general_chat' },
      };
  }
}

/**
 * Main handler for WhatsApp messages
 * Now uses AI-FIRST architecture by default
 */
export async function handleWhatsAppMessage(
  phoneNumber: string,
  message: string
) {
  // Toggle between AI-FIRST (new) and LEGACY (old) architecture
  const USE_AI_FIRST = process.env.USE_AI_FIRST !== 'false'; // Default: true

  try {
    console.log(`📨 Message from ${phoneNumber}: ${message}`);
    
    // Get or create customer first (needed for both paths)
    const customer = await getOrCreateCustomer(phoneNumber);
    const conversation = await getOrCreateConversation(customer.id, phoneNumber);

    // Check if it's first message (greeting)
    if (conversation.messages.length === 0) {
      const welcomeMessage = await getWelcomeMessage();
      await saveMessage(conversation.id, 'assistant', welcomeMessage);
      await sendWhatsAppMessage(phoneNumber, welcomeMessage);
      return;
    }

    if (USE_AI_FIRST) {
      // ============================================
      // NEW: AI-FIRST ARCHITECTURE 🚀
      // ============================================
      console.log('🤖 Using AI-FIRST architecture');
      const response = await handleMessageAIFirst(message, phoneNumber);
      await sendWhatsAppMessage(phoneNumber, response);
      console.log(`✅ Response sent to ${phoneNumber} (AI-FIRST)`);
    } else {
      // ============================================
      // LEGACY: OLD ARCHITECTURE (fallback)
      // ============================================
      console.log('📝 Using LEGACY architecture');
      
      await saveMessage(conversation.id, 'user', message);
      
      const { response, metadata } = await processWithAI(message, conversation, customer);
      
      await saveMessage(conversation.id, 'assistant', response, metadata);
      
      await prisma.conversation.update({
        where: { id: conversation.id },
        data: {
          context: {
            ...(typeof conversation.context === 'object' && conversation.context !== null ? conversation.context : {}),
            lastAction: metadata?.action,
            lastUpdate: new Date().toISOString(),
          } as any,
        },
      });
      
      await sendWhatsAppMessage(phoneNumber, response);
      console.log(`✅ Response sent to ${phoneNumber} (LEGACY)`);
    }
  } catch (error) {
    console.error('❌ Error handling message:', error);
    await sendWhatsAppMessage(
      phoneNumber,
      `❌ Désolé, une erreur s'est produite. Veuillez réessayer dans quelques instants.`
    );
  }
}

/**
 * Close conversation
 */
export async function closeConversation(conversationId: string, summary?: string) {
  return await prisma.conversation.update({
    where: { id: conversationId },
    data: {
      status: 'completed',
      endedAt: new Date(),
      summary,
    },
  });
}
