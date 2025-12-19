# 🚀 GUIDE D'IMPLÉMENTATION - CONVERSATION HANDLER AI-FIRST

**Date:** 17/12/2024  
**Objectif:** Refactoriser `lib/ai/conversation-handler.ts` en architecture AI-first

---

## 📋 TABLE DES MATIÈRES

1. [Vue d'ensemble](#vue-densemble)
2. [Architecture actuelle vs nouvelle](#architecture-actuelle-vs-nouvelle)
3. [Étape par étape](#étape-par-étape)
4. [Exemples de code](#exemples-de-code)
5. [Tests](#tests)
6. [Déploiement](#déploiement)

---

## 🎯 VUE D'ENSEMBLE

### Problème actuel
- ❌ GPT-4 utilisé seulement 10% du temps (cas "default")
- ❌ 90% de logique scriptée avec if/else rigides
- ❌ Pas de barre de progression
- ❌ Expérience robotique

### Solution AI-first
- ✅ 100% des interactions passent par GPT-4
- ✅ Function Calling pour toutes les actions
- ✅ Barre de progression à chaque message
- ✅ Conversation naturelle et fluide

---

## 🏗️ ARCHITECTURE ACTUELLE VS NOUVELLE

### AVANT (Actuel)

```typescript
// lib/ai/conversation-handler.ts (simplifié)

export async function handleMessage(message, customer) {
  // 1. Detect intent avec GPT-4
  const intent = await detectIntent(message);
  
  // 2. Switch case rigide
  switch (intent.action) {
    case 'search_tyres':
      return await handleSearchTyres(message, customer);
    
    case 'view_cart':
      return await handleViewCart(customer);
    
    case 'add_to_cart':
      return await handleAddToCart(message, customer);
    
    // ... beaucoup de cas
    
    default:
      // ⚠️ GPT-4 appelé SEULEMENT ici
      return await getChatCompletion([...]);
  }
}
```

**Problèmes:**
- Logique rigide et difficile à maintenir
- GPT-4 sous-utilisé
- Pas de contexte conversationnel
- Réponses scriptées

---

### APRÈS (AI-first)

```typescript
// lib/ai/conversation-handler.ts (nouveau)

export async function handleMessage(message, customer) {
  const monitor = new PerformanceMonitor();
  monitor.startTimer('total');
  
  // 1. Build rich context
  monitor.startTimer('db_context');
  const context = await buildRichContext(customer, conversation);
  monitor.endTimer('db_context');
  
  // 2. Get enhanced system prompt
  const systemPrompt = await getEnhancedSystemPrompt(
    context,
    customer,
    context.currentStep
  );
  
  // 3. Build conversation history
  const messages = [
    { role: 'system', content: systemPrompt },
    ...getConversationHistory(conversation, 10), // Last 10 messages
    { role: 'user', content: message }
  ];
  
  // 4. Call GPT-4 with Function Calling
  monitor.startTimer('ai_gpt4');
  const completion = await getChatCompletionWithTools(messages);
  monitor.endTimer('ai_gpt4');
  
  // 5. Check if GPT-4 wants to call functions
  if (hasToolCalls(completion)) {
    // Execute tool calls
    const results = await executeToolCalls(
      extractToolCalls(completion),
      customer,
      context
    );
    
    // Send results back to GPT-4
    const finalMessages = [
      ...messages,
      completion.choices[0].message,
      ...formatToolResults(results)
    ];
    
    monitor.startTimer('ai_gpt4_final');
    const finalCompletion = await getChatCompletionWithTools(finalMessages);
    monitor.endTimer('ai_gpt4_final');
    
    const response = finalCompletion.choices[0].message.content;
    
    // Format with progress bar
    const formattedResponse = formatMessageWithProgress(
      response,
      context.currentStep,
      context,
      { showFullBar: true, showSuggestions: true }
    );
    
    monitor.endTimer('total');
    monitor.logSummary();
    
    return formattedResponse;
  }
  
  // 6. Simple conversational response
  const response = completion.choices[0].message.content;
  const formattedResponse = formatMessageWithProgress(
    response,
    context.currentStep,
    context
  );
  
  monitor.endTimer('total');
  monitor.logSummary();
  
  return formattedResponse;
}
```

**Avantages:**
- ✅ GPT-4 au centre de tout
- ✅ Conversation 100% naturelle
- ✅ Progression visible
- ✅ Performance monitorée
- ✅ Flexible et maintenable

---

## 📝 ÉTAPE PAR ÉTAPE

### ÉTAPE 1: Créer buildRichContext()

**Fichier:** `lib/ai/conversation-handler.ts`

```typescript
import { ConversationContext, SalesStep } from '@/lib/progress-tracker';
import { getCart } from '@/lib/cart-service';
import { prisma } from '@/lib/prisma';

/**
 * Construire un contexte enrichi avec toutes les données nécessaires
 */
async function buildRichContext(
  customer: Customer,
  conversation: Conversation
): Promise<ConversationContext & { currentStep: SalesStep }> {
  // Queries parallèles pour performance
  const [cart, orders] = await Promise.all([
    getCart(customer.phoneNumber),
    prisma.order.findMany({
      where: { customerId: customer.id },
      orderBy: { createdAt: 'desc' },
      take: 5,
    }),
  ]);

  // Extraire info du contexte conversation
  const conversationMeta = conversation.metadata as Record<string, any> || {};
  
  // Calculer total panier
  const cartTotal = cart.items.reduce((sum, item) => {
    return sum + (Number(item.product.priceRetail) * item.quantity);
  }, 0);

  // Déterminer l'étape actuelle
  const currentStep = (conversationMeta.currentStep as SalesStep) || SalesStep.GREETING;

  return {
    // Recherche
    searchDimensions: conversationMeta.searchDimensions,
    searchResults: conversationMeta.searchResults,
    
    // Sélection
    selectedProductId: conversationMeta.selectedProductId,
    selectedCategory: conversationMeta.selectedCategory,
    
    // Panier
    cartItems: cart.items.map(item => ({
      id: item.id,
      quantity: item.quantity,
      product: {
        priceRetail: item.product.priceRetail,
        ...item.product,
      },
    })),
    cartTotal,
    
    // Autres
    hasViewedDetails: conversationMeta.hasViewedDetails || false,
    lastActivity: conversation.updatedAt.toISOString(),
    
    // Étape actuelle
    currentStep,
  };
}
```

---

### ÉTAPE 2: Créer executeToolCalls()

```typescript
import { ToolCallResult } from '@/lib/ai/openai-client';
import { 
  searchTyresWithCache, 
  getProductById, 
  getAvailableBrands,
  formatSearchResultsWithPagination,
  formatProductComparison 
} from '@/lib/inventory/search-service';
import { addToCart, getCart, removeFromCart } from '@/lib/cart-service';

/**
 * Exécuter les tool calls demandés par GPT-4
 */
async function executeToolCalls(
  toolCalls: ChatCompletionMessageToolCall[],
  customer: Customer,
  context: ConversationContext
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
          
          // Mettre à jour le contexte
          await updateConversationMetadata(customer.phoneNumber, {
            searchDimensions: `${args.width}/${args.height}R${args.diameter}`,
            searchResults: searchResult.products,
            currentStep: SalesStep.RESULTS,
          });
          
          result = {
            success: true,
            dimensions: searchResult.dimensions,
            productsCount: searchResult.products.length,
            products: searchResult.products,
            pagination: searchResult.pagination,
          };
          break;

        case 'add_to_cart':
          const product = await getProductById(args.productId);
          if (!product) {
            throw new Error('Product not found');
          }
          
          await addToCart(customer.phoneNumber, {
            productId: args.productId,
            quantity: args.quantity,
          });
          
          // Mettre à jour étape
          await updateConversationMetadata(customer.phoneNumber, {
            currentStep: SalesStep.CART,
          });
          
          result = {
            success: true,
            message: `${args.quantity}x ${product.brand} ${product.model} ajouté(s) au panier`,
            product,
            quantity: args.quantity,
          };
          break;

        case 'view_cart':
          const cart = await getCart(customer.phoneNumber);
          result = {
            success: true,
            itemsCount: cart.items.length,
            items: cart.items,
            total: cart.items.reduce((sum, item) => {
              return sum + (Number(item.product.priceRetail) * item.quantity);
            }, 0),
          };
          break;

        case 'remove_from_cart':
          await removeFromCart(args.cartItemId);
          result = {
            success: true,
            message: 'Article retiré du panier',
          };
          break;

        case 'update_progress':
          await updateConversationMetadata(customer.phoneNumber, {
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
            args.productIds.map((id: string) => getProductById(id))
          );
          const comparison = formatProductComparison(products.filter(Boolean));
          result = {
            success: true,
            comparison,
            products: products.filter(Boolean),
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
```

---

### ÉTAPE 3: Créer updateConversationMetadata()

```typescript
/**
 * Mettre à jour les métadonnées de la conversation
 */
async function updateConversationMetadata(
  phoneNumber: string,
  updates: Partial<ConversationContext & { currentStep: SalesStep }>
): Promise<void> {
  const conversation = await getOrCreateConversation(phoneNumber);
  
  const currentMetadata = (conversation.metadata as Record<string, any>) || {};
  
  await prisma.conversation.update({
    where: { id: conversation.id },
    data: {
      metadata: {
        ...currentMetadata,
        ...updates,
      },
    },
  });
}
```

---

### ÉTAPE 4: Créer getConversationHistory()

```typescript
/**
 * Obtenir l'historique de conversation formaté pour GPT-4
 */
function getConversationHistory(
  conversation: Conversation,
  limit: number = 10
): ChatCompletionMessageParam[] {
  const messages = conversation.messages || [];
  const recentMessages = messages.slice(-limit);

  return recentMessages.map(msg => ({
    role: msg.role === 'customer' ? 'user' as const : 'assistant' as const,
    content: msg.content,
  }));
}
```

---

### ÉTAPE 5: Intégrer dans handleMessage()

**Fichier complet:** `lib/ai/conversation-handler.ts`

```typescript
import PerformanceMonitor, { globalPerformanceTracker } from '@/lib/performance-monitor';
import { getEnhancedSystemPrompt } from '@/lib/ai/system-prompt';
import { 
  getChatCompletionWithTools, 
  hasToolCalls, 
  extractToolCalls,
  formatToolResults 
} from '@/lib/ai/openai-client';
import { formatMessageWithProgress, SalesStep } from '@/lib/progress-tracker';

export async function handleMessage(
  message: string,
  phoneNumber: string
): Promise<string> {
  const monitor = new PerformanceMonitor();
  monitor.startTimer('total');

  try {
    // 1. Get customer & conversation
    monitor.startTimer('db_customer');
    const [customer, conversation] = await Promise.all([
      getOrCreateCustomer(phoneNumber),
      getOrCreateConversation(phoneNumber),
    ]);
    monitor.endTimer('db_customer');

    // 2. Build rich context
    monitor.startTimer('db_context');
    const context = await buildRichContext(customer, conversation);
    monitor.endTimer('db_context');

    // 3. Get enhanced system prompt
    const customerInfo = {
      firstName: customer.firstName,
      lastName: customer.lastName,
      orderCount: await prisma.order.count({ where: { customerId: customer.id } }),
      lastOrderDate: (await prisma.order.findFirst({
        where: { customerId: customer.id },
        orderBy: { createdAt: 'desc' },
      }))?.createdAt,
    };

    const systemPrompt = await getEnhancedSystemPrompt(
      context,
      customerInfo,
      context.currentStep
    );

    // 4. Build conversation history
    const messages: ChatCompletionMessageParam[] = [
      { role: 'system', content: systemPrompt },
      ...getConversationHistory(conversation, 10),
      { role: 'user', content: message },
    ];

    // 5. Call GPT-4 with Function Calling
    monitor.startTimer('ai_gpt4');
    const completion = await getChatCompletionWithTools(messages, {
      currentStep: context.currentStep,
    });
    monitor.endTimer('ai_gpt4');

    // 6. Handle tool calls
    if (hasToolCalls(completion)) {
      const toolCalls = extractToolCalls(completion);
      
      monitor.startTimer('tools_execution');
      const results = await executeToolCalls(toolCalls, customer, context);
      monitor.endTimer('tools_execution');

      // Send results back to GPT-4
      const finalMessages: ChatCompletionMessageParam[] = [
        ...messages,
        completion.choices[0].message as any,
        ...formatToolResults(results),
      ];

      monitor.startTimer('ai_gpt4_final');
      const finalCompletion = await getChatCompletionWithTools(finalMessages);
      monitor.endTimer('ai_gpt4_final');

      const response = finalCompletion.choices[0].message.content || '';
      
      // Refresh context après les tool calls
      const updatedContext = await buildRichContext(customer, conversation);
      
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

      // Save message to conversation
      await saveMessage(conversation.id, message, formattedResponse);

      const totalDuration = monitor.endTimer('total');
      monitor.logSummary();
      globalPerformanceTracker.recordRequest(totalDuration);

      return formattedResponse;
    }

    // 7. Simple conversational response
    const response = completion.choices[0].message.content || '';
    const formattedResponse = formatMessageWithProgress(
      response,
      context.currentStep,
      context
    );

    await saveMessage(conversation.id, message, formattedResponse);

    const totalDuration = monitor.endTimer('total');
    monitor.logSummary();
    globalPerformanceTracker.recordRequest(totalDuration);

    return formattedResponse;

  } catch (error) {
    console.error('❌ Error in handleMessage:', error);
    monitor.endTimer('total');
    monitor.logSummary();
    
    return '❌ Désolé, une erreur est survenue. Pouvez-vous reformuler ?';
  }
}
```

---

## 🧪 TESTS

### Test 1: Flow Complet

```typescript
// Test manuel via WhatsApp ou Postman

// 1. Message initial
"Bonjour"
// → Doit afficher barre 0% (GREETING) + message accueil

// 2. Recherche dimensions
"Je cherche des pneus 205/55R16"
// → Doit appeler search_tyres(205, 55, 16)
// → update_progress('results')
// → Barre 30% (RESULTS)
// → Liste 6 produits max

// 3. Sélection
"Le numéro 2"
// → Doit demander quantité
// → update_progress('selection')
// → Barre 45% (SELECTION)

// 4. Ajout panier
"4 pneus"
// → Doit appeler add_to_cart(productId, 4)
// → update_progress('cart')
// → Barre 60% (CART)
// → Résumé panier affiché

// 5. Validation
"Je valide"
// → update_progress('checkout')
// → Barre 75% (CHECKOUT)
// → Demande infos livraison
```

### Test 2: Performance

```bash
# Lancer 10 requêtes et mesurer
# Objectif: < 2 secondes en moyenne

npm run test:performance
```

### Test 3: Cache

```typescript
// Faire 2 fois la même recherche
// La 2ème doit être en cache

"205/55R16" // Cache MISS → 800ms
"205/55R16" // Cache HIT → 50ms ✅
```

---

## 🚀 DÉPLOIEMENT

### 1. Backup Actuel

```bash
cp lib/ai/conversation-handler.ts lib/ai/conversation-handler.BACKUP.ts
```

### 2. Implémenter Progressivement

- ✅ Tester buildRichContext() seul
- ✅ Tester executeToolCalls() seul
- ✅ Intégrer dans handleMessage()
- ✅ Tests unitaires
- ✅ Tests intégration

### 3. Feature Flag (optionnel)

```typescript
const USE_AI_FIRST = process.env.USE_AI_FIRST === 'true';

export async function handleMessage(...) {
  if (USE_AI_FIRST) {
    return handleMessageAIFirst(...);
  } else {
    return handleMessageLegacy(...);
  }
}
```

### 4. Monitoring Production

```typescript
// Ajouter alertes Slack/Email
if (totalDuration > 3000) {
  await sendAlert(`Slow response: ${totalDuration}ms`);
}

// Logger métriques dans fichier
fs.appendFileSync('metrics.log', JSON.stringify({
  timestamp: new Date(),
  duration: totalDuration,
  step: context.currentStep,
  toolsUsed: results.map(r => r.functionName),
}));
```

---

## 📊 RÉSULTATS ATTENDUS

### Avant (Actuel)

```
📊 Utilisation IA: 10%
⏱️ Temps réponse: ~4s
🤖 Expérience: Robotique
📈 Conversion: Base
```

### Après (AI-first)

```
📊 Utilisation IA: 100% ✅
⏱️ Temps réponse: <2s ✅
🤖 Expérience: Naturelle ✅
📈 Conversion: +30-40% ✅
```

---

## 🔥 CHECKLIST FINALE

- [x] progress-tracker.ts créé
- [x] performance-monitor.ts créé
- [x] search-service.ts enrichi (cache, pagination)
- [x] openai-client.ts enrichi (10 tools)
- [x] system-prompt.ts enrichi (contexte dynamique)
- [ ] conversation-handler.ts refactoré
- [ ] Tests flow complet
- [ ] Tests performance
- [ ] Déploiement production

---

**Temps estimé pour finaliser:** 2-3 heures

**Prêt à transformer votre bot ! 🚀**
