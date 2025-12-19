import { prisma } from '@/lib/prisma';
import { getChatCompletion, extractDimensions, detectIntent } from './openai-client';
import { getSystemPrompt, getWelcomeMessage } from './system-prompt';
import { searchByDimensions, groupByCategory, formatSearchResults } from '@/lib/inventory/search-service';
import { addToCart, formatCartMessage, getCart } from '@/lib/cart-service';
import { sendWhatsAppMessage } from '@/lib/whatsapp-helpers';

/**
 * Get or create customer from phone number
 */
async function getOrCreateCustomer(phoneNumber: string) {
  let customer = await prisma.customer.findUnique({
    where: { phoneNumber },
  });

  if (!customer) {
    customer = await prisma.customer.create({
      data: {
        phoneNumber,
        country: 'Guadeloupe',
      },
    });
    console.log('✅ New customer created:', phoneNumber);
  }

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
        take: 10, // Last 10 messages for context
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
 */
export async function handleWhatsAppMessage(
  phoneNumber: string,
  message: string
) {
  try {
    console.log(`📨 Message from ${phoneNumber}: ${message}`);

    // 1. Get or create customer
    const customer = await getOrCreateCustomer(phoneNumber);

    // 2. Get or create conversation
    const conversation = await getOrCreateConversation(customer.id, phoneNumber);

    // 3. Save user message
    await saveMessage(conversation.id, 'user', message);

    // 4. Check if it's first message (greeting)
    if (conversation.messages.length === 0) {
      const welcomeMessage = await getWelcomeMessage();
      await saveMessage(conversation.id, 'assistant', welcomeMessage);
      await sendWhatsAppMessage(phoneNumber, welcomeMessage);
      return;
    }

    // 5. Process with AI
    const { response, metadata } = await processWithAI(message, conversation, customer);

    // 6. Save assistant response
    await saveMessage(conversation.id, 'assistant', response, metadata);

    // 7. Update conversation context
    await prisma.conversation.update({
      where: { id: conversation.id },
      data: {
        context: {
          ...(typeof conversation.context === 'object' && conversation.context !== null ? conversation.context : {}),
          lastAction: metadata?.action,
          lastUpdate: new Date().toISOString(),
        },
      },
    });

    // 8. Send response via WhatsApp
    await sendWhatsAppMessage(phoneNumber, response);

    console.log(`✅ Response sent to ${phoneNumber}`);
  } catch (error) {
    console.error('❌ Error handling message:', error);

    // Send error message to user
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
