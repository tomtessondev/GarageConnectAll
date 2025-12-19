# 🚀 Phase 2A - Bot IA WhatsApp - Progression

**Date:** 30 novembre 2024  
**Statut:** EN COURS (Partie 1/2 TERMINÉE)

---

## ✅ CE QUI A ÉTÉ FAIT (Partie 1)

### 1. Installation Dépendances
- ✅ Package `openai` déjà installé (v6.9.1)
- ✅ Client Prisma régénéré avec nouvelles tables

### 2. Services IA Créés

#### **✅ `lib/ai/openai-client.ts`**
Service client OpenAI GPT-4

**Fonctions implémentées:**
- `getChatCompletion()` - Générer réponses GPT-4
- `extractDimensions()` - Extraire dimensions pneus (Largeur/Hauteur/Diamètre)
- `detectIntent()` - Détecter intention utilisateur

#### **✅ `lib/ai/system-prompt.ts`**
Prompts système configurables

**Fonctions implémentées:**
- `DEFAULT_SYSTEM_PROMPT` - Prompt complet pour GPT-4
- `DEFAULT_WELCOME_MESSAGE` - Message d'accueil
- `getSystemPrompt()` - Récupérer depuis DB
- `getWelcomeMessage()` - Récupérer depuis DB
- `isMaintenanceMode()` - Vérifier mode maintenance
- `shouldBotRespond()` - Vérifier horaires d'ouverture
- `getPriceLimits()` - Récupérer limites prix

### 3. Services Métier Créés

#### **✅ `lib/cart-service.ts`**
Gestion complète du panier

**Fonctions implémentées:**
- `getOrCreateCart()` - Créer/récupérer panier
- `addToCart()` - Ajouter article
- `getCart()` - Voir panier
- `updateCartItem()` - Modifier quantité
- `removeFromCart()` - Supprimer article
- `clearCart()` - Vider panier
- `getCartTotal()` - Calculer total
- `formatCartMessage()` - Message WhatsApp
- `cleanExpiredCarts()` - Cron job nettoyage
- `extendCartExpiration()` - Prolonger validité
- `getCartItemCount()` - Compter articles
- `isProductInCart()` - Vérifier présence

#### **✅ `lib/inventory/search-service.ts`**
Recherche de pneus par dimensions

**Fonctions implémentées:**
- `searchByDimensions()` - Recherche L/H/D
- `groupByCategory()` - Grouper par catégorie
- `formatSearchResults()` - Message WhatsApp formaté
- `getProductById()` - Récupérer produit
- `checkAvailability()` - Vérifier stock
- `searchByBrand()` - Recherche par marque
- `getFeaturedProducts()` - Produits en promo
- `calculateFinalPrice()` - Prix avec réduction

---

## ⏳ CE QUI RESTE À FAIRE (Partie 2)

### 1. Gestionnaire de Conversations

#### **À créer: `lib/ai/conversation-handler.ts`**
Orchestrateur principal du bot

**Fonctions à implémenter:**
```typescript
- handleWhatsAppMessage(phoneNumber, message)
  // Point d'entrée principal
  
- getOrCreateCustomer(phoneNumber)
  // Créer/récupérer client
  
- getOrCreateConversation(customerId, phoneNumber)
  // Créer/récupérer conversation
  
- saveMessage(conversationId, sender, content)
  // Sauvegarder message en DB
  
- processWithAI(message, conversation, customer)
  // Traiter avec GPT-4
  
- executeAction(action, parameters, customer)
  // Exécuter action détectée
  
- formatResponse(action, result)
  // Formater réponse WhatsApp
```

**Actions à gérer:**
- `search_tyres` → Appeler search-service
- `add_to_cart` → Appeler cart-service
- `view_cart` → Formater panier
- `checkout` → Créer commande
- `view_orders` → Liste commandes client
- `request_help` → Réponse GPT-4 naturelle
- `leave_review` → Enregistrer avis

### 2. Service de Commandes

#### **À créer: `lib/order-service.ts`**

**Fonctions à implémenter:**
```typescript
- createOrderFromCart(customerId, deliveryAddress)
  // Créer commande depuis panier
  
- generateOrderNumber()
  // Format: GC-YYYYMMDD-XXX
  
- calculateOrderTotals(items)
  // Calculer subtotal, tax, total
  
- createStripePaymentIntent(orderId)
  // Créer Payment Intent
  
- sendPaymentLink(customerId, paymentUrl)
  // Envoyer lien via WhatsApp
  
- confirmOrder(orderId)
  // Après paiement réussi
```

### 3. Mise à Jour Webhook WhatsApp

#### **À modifier: `app/api/whatsapp/webhook/route.ts`**

**Structure à implémenter:**
```typescript
export async function POST(request: NextRequest) {
  // 1. Recevoir message Twilio
  const { From, Body, MessageSid } = await parseFormData(request);
  
  // 2. Vérifier mode maintenance
  if (await isMaintenanceMode()) {
    await sendWhatsAppMessage(From, await getMaintenanceMessage());
    return;
  }
  
  // 3. Vérifier horaires d'ouverture
  if (!(await shouldBotRespond())) {
    await sendWhatsAppMessage(From, "Nous sommes fermés...");
    return;
  }
  
  // 4. Traiter avec bot IA
  await handleWhatsAppMessage(From.replace('whatsapp:', ''), Body);
  
  // 5. Retourner 200 OK
  return NextResponse.json({ success: true });
}
```

### 4. Service d'Avis Clients

#### **À créer: `lib/review-service.ts`**

**Fonctions à implémenter:**
```typescript
- requestReview(orderId, delayHours = 168)
  // Demander avis 7 jours après
  
- saveReview(orderId, rating, comment)
  // Enregistrer avis
  
- getReviewStats()
  // Statistiques (moyenne, total)
  
- formatReviewRequest(order)
  // Message demande d'avis
```

### 5. Helper: Envoi WhatsApp

#### **À créer: `lib/whatsapp-helpers.ts`**

```typescript
- sendWhatsAppMessage(to, message)
  // Envoyer message simple
  
- sendWhatsAppImage(to, imageUrl, caption)
  // Envoyer image (QR code)
  
- sendWhatsAppDocument(to, documentUrl, filename)
  // Envoyer PDF (facture)
```

---

## 🧪 TESTS À EFFECTUER

### Scénario 1: Recherche de Pneus
1. Client: "Bonjour"
2. Bot: Message d'accueil
3. Client: "Je cherche des pneus 205/55R16"
4. Bot: Affiche 3 options (Budget/Standard/Premium)
5. Client: "Standard"
6. Bot: "Combien de pneus ?"
7. Client: "4"
8. Bot: "Ajouté au panier !"

### Scénario 2: Voir Panier
1. Client: "Mon panier"
2. Bot: Affiche contenu panier avec total
3. Client: "Passer commande"
4. Bot: Demande adresse livraison

### Scénario 3: Commande Complète
1. Client: Donne adresse
2. Bot: Confirmation + lien paiement Stripe
3. Client: Paie
4. Webhook Stripe: Confirmation
5. Bot: Envoie QR code retrait

---

## 📝 VARIABLES D'ENVIRONNEMENT REQUISES

**À ajouter dans `.env`:**
```bash
# OpenAI (REQUIS)
OPENAI_API_KEY="sk-proj-..."

# JWT pour Admin Flutter (À ajouter plus tard)
JWT_SECRET="votre-secret-256bits"
```

---

## 🎯 PROCHAINE SESSION

**Tâches prioritaires:**

1. ✅ Créer `lib/ai/conversation-handler.ts`
2. ✅ Créer `lib/order-service.ts`
3. ✅ Créer `lib/review-service.ts`
4. ✅ Créer `lib/whatsapp-helpers.ts`
5. ✅ Mettre à jour `app/api/whatsapp/webhook/route.ts`
6. ✅ Tester parcours complet

**Durée estimée:** 2-3 heures

---

## 💾 FICHIERS CRÉÉS DANS CETTE SESSION

```
lib/
├── ai/
│   ├── openai-client.ts ✅
│   └── system-prompt.ts ✅
├── cart-service.ts ✅
└── inventory/
    └── search-service.ts ✅
```

**Total:** 4 fichiers créés, ~800 lignes de code

---

## 🔧 COMMANDES UTILES

```bash
# Regénérer Prisma après modification schema
npx prisma generate

# Lancer dev server
npm run dev

# Tester webhook localement (avec ngrok)
ngrok http 3000
# Puis configurer URL dans Twilio console
```

---

**✅ Partie 1 de Phase 2A terminée avec succès !**

**📋 Voir `IMPLEMENTATION_PLAN.md` pour le plan complet**
