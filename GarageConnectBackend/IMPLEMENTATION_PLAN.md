# 📋 Plan d'Implémentation GarageConnect - Bot IA + Admin Flutter

**Date:** 30 novembre 2024  
**Version:** 2.0 - Architecture IA Conversationnelle

---

## ✅ PHASE 1 - BASE DE DONNÉES (TERMINÉE)

### Tables créées :

#### Tables principales
- ✅ `users` - Utilisateurs admin
- ✅ `customers` - Clients WhatsApp (supprimé: vehicleBrand, vehicleModel, vehicleYear)
- ✅ `products` - Inventaire pneus (20 produits de test)
- ✅ `orders` - Commandes
- ✅ `order_items` - Lignes de commande
- ✅ `payments` - Paiements Stripe
- ✅ `invoices` - Factures

#### Nouvelles tables ajoutées
- ✅ `carts` - Paniers clients (expire 24h)
- ✅ `cart_items` - Articles dans panier
- ✅ `reviews` - Avis clients (1-5 étoiles)
- ✅ `bot_config` - Configuration bot modifiable
- ✅ `auto_messages` - Messages automatiques
- ✅ `analytics` - Statistiques quotidiennes

#### Tables existantes
- ✅ `conversations` - Historique conversations
- ✅ `messages` - Messages WhatsApp
- ✅ `inventory_sources` - Sources multi-inventaire
- ✅ `stock_reservations` - Réservations temporaires
- ✅ `pickup_tracking` - Suivi retraits

---

## 🚀 PHASE 2A - BOT IA WHATSAPP (EN COURS)

### 2.1 Installation Dépendances

**À faire:**
```bash
npm install openai
```

### 2.2 Services Backend IA

#### **Fichier: `lib/ai/openai-client.ts`**
Service client OpenAI GPT-4

```typescript
Fonctions:
- getChatCompletion(systemPrompt, history, userMessage)
- detectIntent(message, config)
- extractDimensions(message) -> {width, height, diameter}
```

#### **Fichier: `lib/ai/system-prompt.ts`**
Prompts système configurables

```typescript
Export:
- DEFAULT_SYSTEM_PROMPT (prompt par défaut)
- AVAILABLE_ACTIONS (actions possibles)
- getActivePrompt() (récupère depuis BotConfig DB)
```

#### **Fichier: `lib/ai/intent-detector.ts`**
Détection d'intentions avec GPT-4

```typescript
Intentions détectées:
- search_tyres -> Rechercher pneus
- add_to_cart -> Ajouter au panier
- view_cart -> Voir panier
- checkout -> Commander
- view_orders -> Voir commandes
- request_help -> Aide générale
- leave_review -> Laisser avis
```

#### **Fichier: `lib/ai/conversation-handler.ts`**
Gestionnaire principal conversations

```typescript
Fonctions principales:
- handleWhatsAppMessage(phoneNumber, message)
- processAction(action, parameters, customerId)
- saveConversation(conversationId, message, sender)
```

### 2.3 Services Métier

#### **Fichier: `lib/cart-service.ts`**
Gestion panier

```typescript
- addToCart(customerId, productId, quantity)
- getCart(customerId)
- updateCartItem(cartItemId, quantity)
- removeFromCart(cartItemId)
- clearCart(customerId)
- clearExpiredCarts() // Cron job
```

#### **Fichier: `lib/inventory/search-service.ts`**
Recherche pneus par dimensions

```typescript
- searchByDimensions(width, height, diameter)
- groupByCategory() -> {budget, standard, premium}
- formatResults(products) -> Message WhatsApp formaté
```

#### **Fichier: `lib/order-service.ts`**
Création commandes

```typescript
- createOrderFromCart(customerId, address)
- generateOrderNumber()
- calculateTotals(items)
- createStripePaymentIntent(orderId)
```

#### **Fichier: `lib/review-service.ts`**
Gestion avis

```typescript
- requestReview(orderId, delayHours = 168) // 7 jours
- saveReview(orderId, rating, comment)
- getReviewStats() -> Moyenne, total, distribution
```

### 2.4 Mise à jour Webhook WhatsApp

#### **Fichier: `app/api/whatsapp/webhook/route.ts`**
Intégration bot IA

```typescript
POST /api/whatsapp/webhook
1. Recevoir message Twilio
2. Vérifier maintenance mode (BotConfig)
3. Vérifier business hours
4. Traiter avec bot IA
5. Sauvegarder conversation
6. Envoyer réponse
```

---

## 🔧 PHASE 2B - SYSTÈME AVIS CLIENTS

### 2B.1 Messages Automatiques

#### **Fichier: `lib/cron/auto-messages.ts`**
Job automatique envoi messages

```typescript
Triggers:
- order_confirmed (0h) -> Confirmation commande
- payment_received (0h) -> Paiement confirmé + QR code
- ready_pickup (24h) -> Prêt pour retrait
- review_request (168h = 7 jours) -> Demande d'avis
```

#### Configuration Vercel Cron
**Fichier: `vercel.json`**
```json
{
  "crons": [
    {
      "path": "/api/cron/send-auto-messages",
      "schedule": "0 * * * *"
    }
  ]
}
```

---

## 📱 PHASE 3 - API ADMIN FLUTTER

### 3.1 Authentification

#### **Fichier: `lib/auth/jwt.ts`**
Gestion tokens JWT

```typescript
- generateToken(userId)
- verifyToken(token)
- refreshToken(refreshToken)
```

#### **Fichier: `middleware.ts`**
Protection routes admin

```typescript
Protéger:
- /api/admin/*
Vérifier JWT dans headers
```

### 3.2 Routes API Admin

#### **GET/PUT `/api/admin/bot-config`**
Gérer configuration bot

```typescript
GET -> Récupérer config active
PUT -> Mettre à jour config
POST -> Créer nouvelle version
```

#### **GET/PUT `/api/admin/prompts`**
Gérer prompts système

```typescript
GET -> Liste prompts
PUT -> Modifier prompt actif
POST -> Créer nouveau prompt
```

#### **GET `/api/admin/reviews`**
Voir avis clients

```typescript
GET -> Liste avis (filtres: rating, date)
GET /stats -> Statistiques (moyenne, total)
```

#### **GET `/api/admin/conversations`**
Historique conversations

```typescript
GET -> Liste conversations
GET /:id -> Détails conversation avec messages
```

#### **GET `/api/admin/analytics`**
Statistiques

```typescript
GET /dashboard -> Stats du jour
GET /period?from=&to= -> Stats période
```

#### **POST `/api/admin/auto-messages`**
Gérer messages auto

```typescript
GET -> Liste messages auto
POST -> Créer message
PUT /:id -> Modifier message
DELETE /:id -> Supprimer message
```

---

## 📲 PHASE 4 - APPLICATION FLUTTER ADMIN

### 4.1 Architecture Flutter

```
garage_connect_admin/
├── lib/
│   ├── main.dart
│   ├── models/
│   │   ├── bot_config.dart
│   │   ├── review.dart
│   │   ├── analytics.dart
│   │   └── conversation.dart
│   ├── services/
│   │   ├── api_service.dart
│   │   ├── auth_service.dart
│   │   └── storage_service.dart
│   ├── screens/
│   │   ├── login_screen.dart
│   │   ├── dashboard_screen.dart
│   │   ├── bot_config_screen.dart
│   │   ├── prompts_screen.dart
│   │   ├── conversations_screen.dart
│   │   ├── reviews_screen.dart
│   │   └── analytics_screen.dart
│   └── widgets/
│       ├── stat_card.dart
│       ├── conversation_list_item.dart
│       └── review_card.dart
└── pubspec.yaml
```

### 4.2 Écrans Flutter

#### **Login Screen**
- Email + Password
- JWT token storage
- Auto-login si token valide

#### **Dashboard**
- Stats du jour (messages, commandes, revenu)
- Graphique tendances 7 jours
- Alertes (stock bas, avis négatifs)

#### **Configuration Bot**
- Modifier prompt système
- Message d'accueil
- Horaires d'ouverture
- Mode maintenance
- Prix min/max

#### **Prompts Management**
- Liste versions prompts
- Éditeur de texte
- Preview avant sauvegarde
- Historique versions

#### **Conversations**
- Liste conversations en temps réel
- Recherche par client/date
- Voir historique messages
- Statistiques conversation

#### **Avis Clients**
- Liste avis avec filtres
- Moyenne étoiles
- Graphique distribution
- Marquer public/privé

#### **Analytics**
- Graphiques CA
- Top produits
- Taux conversion
- Clients récurrents

### 4.3 Dépendances Flutter

```yaml
dependencies:
  flutter:
    sdk: flutter
  http: ^1.1.0
  provider: ^6.1.1
  shared_preferences: ^2.2.2
  fl_chart: ^0.66.0
  intl: ^0.18.1
  cached_network_image: ^3.3.1
```

---

## 💳 PHASE 5 - PAIEMENTS & FACTURES

### 5.1 Finaliser Webhook Stripe

#### **Fichier: `app/api/webhook/stripe/route.ts`**

```typescript
Événements à gérer:
1. payment_intent.succeeded
   - Mettre à jour order.paymentStatus = 'paid'
   - Confirmer stock reservations
   - Générer QR code
   - Envoyer confirmation WhatsApp
   - Déclencher auto_message 'payment_received'

2. payment_intent.payment_failed
   - Mettre à jour order.paymentStatus = 'failed'
   - Libérer stock
   - Notifier client
```

### 5.2 Génération Factures PDF

#### **Installation:**
```bash
npm install @react-pdf/renderer
```

#### **Fichier: `lib/invoice-generator.ts`**

```typescript
Fonctions:
- generateInvoicePDF(orderId)
- uploadToSupabase(pdf, orderId)
- sendViaWhatsApp(customerId, pdfUrl)
```

### 5.3 Génération QR Codes

#### **Fichier: `lib/qrcode-generator.ts`** (déjà existant)

```typescript
Améliorer:
- Ajouter logo GarageConnect
- Encoder orderId + customerPhone
- Format optimisé WhatsApp
```

---

## 🔄 PHASE 6 - MULTI-SOURCES INVENTAIRE

### 6.1 Architecture Adaptateurs

#### **Fichier: `lib/inventory/adapters/base-adapter.ts`**
Interface commune

```typescript
interface InventoryAdapter {
  searchByDimensions(width, height, diameter): Product[]
  checkStock(productId): number
  reserveStock(productId, quantity): boolean
  syncInventory(): void
}
```

#### **Fichier: `lib/inventory/adapters/local-adapter.ts`**
Inventaire local (Prisma)

#### **Fichier: `lib/inventory/adapters/partner-api-adapter.ts`**
API partenaires externes

#### **Fichier: `lib/inventory/aggregator.ts`**
Fusionner résultats multi-sources

```typescript
- searchAcrossSources(dimensions)
- mergeDuplicates()
- sortByPriority()
- filterAvailable()
```

---

## 🧪 PHASE 7 - TESTS & OPTIMISATIONS

### 7.1 Tests End-to-End

**Scénarios:**
1. Nouveau client → recherche → ajout panier → commande → paiement → avis
2. Client existant → voir commandes → nouveau achat
3. Panier expire après 24h
4. Avis demandé 7 jours après livraison

### 7.2 Optimisations

- Cache Redis pour recherches fréquentes
- Index DB optimisés
- Rate limiting API
- Compression images QR

---

## 📊 ESTIMATION TEMPS

| Phase | Durée | Dépendances |
|-------|-------|-------------|
| Phase 1 | ✅ 1 jour (TERMINÉ) | - |
| Phase 2A | 3-4 jours | Phase 1 |
| Phase 2B | 1 jour | Phase 2A |
| Phase 3 | 2-3 jours | Phase 1 |
| Phase 4 | 5-7 jours | Phase 3 |
| Phase 5 | 2 jours | Phase 2A |
| Phase 6 | 3 jours | Phase 2A |
| Phase 7 | 2-3 jours | Toutes |

**TOTAL ESTIMÉ: 19-24 jours de développement**

---

## 🎯 PROCHAINE ÉTAPE IMMÉDIATE

**Commencer Phase 2A - Bot IA WhatsApp:**

1. ✅ Installer `npm install openai`
2. Créer `lib/ai/openai-client.ts`
3. Créer `lib/ai/system-prompt.ts`
4. Créer `lib/ai/intent-detector.ts`
5. Créer `lib/ai/conversation-handler.ts`
6. Créer `lib/cart-service.ts`
7. Créer `lib/inventory/search-service.ts`
8. Mettre à jour `app/api/whatsapp/webhook/route.ts`
9. Tester parcours complet

---

## 💰 COÛTS ESTIMÉS

### OpenAI GPT-4
- ~$0.01 par conversation (5-10 messages)
- 100 conversations/jour = ~$1/jour
- **~$30/mois pour usage modéré**

### Stripe
- 2% + 0,25€ par transaction

### Twilio WhatsApp
- $0.005 par message entrant
- $0.02 par message sortant
- **~$20-50/mois selon volume**

---

## ✅ CONFIGURATION NÉCESSAIRE

### Variables d'environnement (.env)
```bash
# Déjà configuré
DATABASE_URL="prisma://..."
DIRECT_URL="postgresql://..."
STRIPE_SECRET_KEY="sk_test_..."
TWILIO_ACCOUNT_SID="..."
TWILIO_AUTH_TOKEN="..."
TWILIO_WHATSAPP_FROM="whatsapp:+14155238886"

# À ajouter
OPENAI_API_KEY="sk-proj-..." # ⚠️ REQUIS Phase 2A
JWT_SECRET="..." # Pour auth admin Flutter
SUPABASE_STORAGE_BUCKET="invoices" # Pour factures PDF
```

---

## 📝 NOTES IMPORTANTES

1. **Données de test supprimées:**
   - Les champs vehicleBrand, vehicleModel, vehicleYear ont été supprimés de Customer
   - Seules les dimensions pneus sont maintenant nécessaires

2. **Système très configurable:**
   - Tout est modifiable depuis l'admin Flutter
   - Prompts système
   - Messages d'accueil
   - Horaires d'ouverture
   - Messages automatiques

3. **Avis clients:**
   - Demandés automatiquement 7 jours après livraison
   - 1 seul avis par commande
   - Note 1-5 étoiles + commentaire optionnel

4. **Panier:**
   - Expire automatiquement après 24h
   - Job cron pour nettoyage

5. **Analytics:**
   - Statistiques quotidiennes auto-calculées
   - Accessible via API admin

---

**🚀 Projet prêt pour la Phase 2A !**
