# 04 - SERVICES BACKEND

[← Retour à l'index](./00_INDEX.md)

---

## 📑 TABLE DES MATIÈRES

1. [Services IA](#1-services-ia)
2. [Service Recherche](#2-service-recherche)
3. [Services Panier & Commandes](#3-services-panier--commandes)
4. [Services Paiements](#4-services-paiements)
5. [Services Messaging](#5-services-messaging)

---

## 1. SERVICES IA

### 1.1 OpenAI Client (`lib/ai/openai-client.ts`)

**Rôle :** Client pour communiquer avec GPT-4

**Fonctions principales :**
```typescript
generateChatCompletion(messages, options)
  → Génère une réponse du bot
  
extractProductDimensions(userMessage)
  → Extrait dimensions pneus du message
```

**Configuration :**
- Modèle : `gpt-4-turbo-preview`
- Temperature : 0.7
- Max tokens : 150

### 1.2 Conversation Handler (`lib/ai/conversation-handler.ts`)

**Rôle :** Orchestrateur principal du bot

**Fonctions :**
```typescript
handleMessage(phoneNumber, messageBody)
  → Gère un message WhatsApp complet
  
_processIntent(intent, context)
  → Route vers l'action appropriée
```

**Intents supportés :**
- `search_product` - Recherche pneus
- `view_cart` - Voir panier
- `checkout` - Commander
- `track_order` - Suivi commande
- `leave_review` - Laisser avis

### 1.3 System Prompt (`lib/ai/system-prompt.ts`)

**Rôle :** Prompts et personnalité du bot

**Contenu :**
- Personnalité du bot
- Instructions de formatage
- Exemples de réponses
- Règles métier

---

## 2. SERVICE RECHERCHE

### 2.1 Search Service (`lib/inventory/search-service.ts`)

**Rôle :** Recherche intelligente de pneus

**Fonction principale :**
```typescript
searchTyres(dimensions: string)
  → Retourne 3 options (Budget, Standard, Premium)
```

**Algorithme :**
1. Parse dimensions (ex: "205/55R16")
2. Query DB avec filtres
3. Groupe par catégorie
4. Sélectionne meilleur de chaque catégorie
5. Formate réponse conversationnelle

**Exemple de retour :**
```typescript
{
  budget: {
    id: "uuid",
    name: "Continental EcoContact",
    price: 95,
    brand: "Continental"
  },
  standard: { ... },
  premium: { ... }
}
```

---

## 3. SERVICES PANIER & COMMANDES

### 3.1 Cart Service (`lib/cart-service.ts`)

**Rôle :** Gestion des paniers temporaires

**Fonctions principales :**
```typescript
getOrCreateCart(customerId)
  → Récupère ou crée panier (expire 24h)
  
addToCart(cartId, productId, quantity)
  → Ajoute article au panier
  
clearExpiredCarts()
  → Nettoie paniers expirés (cron)
```

**Règles :**
- Expiration : 24h
- Réservation stock : 15 min
- Auto-nettoyage : Toutes les heures

### 3.2 Order Service (`lib/order-service.ts`)

**Rôle :** Gestion du cycle de vie des commandes

**Fonctions principales :**
```typescript
createOrder(customerId, cartId, deliveryInfo)
  → Crée commande depuis panier
  
updateOrderStatus(orderId, newStatus)
  → Met à jour statut commande
  
getOrdersByCustomer(customerId)
  → Historique commandes client
```

**Workflow statuts :**
```
pending → confirmed → paid → ready_pickup → completed
                            ↓
                        cancelled
```

### 3.3 Customer Info Service (`lib/customer-info-service.ts`)

**Rôle :** Collecte et validation infos client

**Fonctions :**
```typescript
collectDeliveryInfo(phoneNumber)
  → Collecte adresse, email, nom
  
validateEmail(email)
  → Valide format email
```

---

## 4. SERVICES PAIEMENTS

### 4.1 Stripe Service (`lib/stripe.ts`)

**Rôle :** Intégration paiements Stripe

**Fonctions :**
```typescript
createPaymentIntent(orderId, amount)
  → Crée intention de paiement
  
handleWebhook(event)
  → Traite événements webhook
```

**Événements webhook :**
- `payment_intent.succeeded` → Marque commande payée
- `payment_intent.payment_failed` → Notifie échec
- `charge.succeeded` → Enregistre transaction

### 4.2 QR Code Service (`lib/qrcode-service.ts`)

**Rôle :** Génération et gestion QR codes

**Fonctions :**
```typescript
generateOrderQR(orderId)
  → Génère QR code pour retrait
  
validateQR(qrData)
  → Valide QR à l'entrepôt
```

**Format QR :**
```json
{
  "orderId": "uuid",
  "customerPhone": "+590...",
  "timestamp": "ISO8601",
  "signature": "hash"
}
```

---

## 5. SERVICES MESSAGING

### 5.1 Twilio Service (`lib/twilio.ts`)

**Rôle :** Envoi messages WhatsApp

**Fonctions :**
```typescript
sendWhatsAppMessage(to, body, mediaUrl?)
  → Envoie message (texte ou média)
  
sendTemplate(to, templateName, params)
  → Envoie template pré-approuvé
```

**Templates disponibles :**
- Confirmation commande
- QR code retrait
- Demande avis J+7

### 5.2 WhatsApp Helpers (`lib/whatsapp-helpers.ts`)

**Rôle :** Formatage messages WhatsApp

**Fonctions :**
```typescript
formatProductList(products)
  → Formate liste produits avec emojis
  
formatOrderSummary(order)
  → Formate récapitulatif commande
```

### 5.3 Review Service (`lib/review-service.ts`)

**Rôle :** Collecte automatique d'avis

**Fonctions :**
```typescript
requestReview(orderId)
  → Demande avis J+7 après livraison
  
saveReview(orderId, rating, comment)
  → Enregistre avis client
```

**Processus :**
1. Cron quotidien détecte commandes J+7
2. Envoie message WhatsApp automatique
3. Collecte rating + commentaire
4. Stocke dans DB avec `isPublic` flag

---

## 6. SERVICES UTILITAIRES

### 6.1 Session Manager (`lib/session-manager.ts`)

**Rôle :** Gestion sessions conversations

**Fonctions :**
```typescript
getSession(phoneNumber)
  → Récupère contexte conversation
  
updateSession(phoneNumber, context)
  → Met à jour contexte
```

### 6.2 Session Storage (`lib/session-storage.ts`)

**Rôle :** Persistance sessions (fichier JSON)

**Format :**
```json
{
  "+590690123456": {
    "state": "awaiting_quantity",
    "selectedProduct": "uuid",
    "lastActivity": "ISO8601"
  }
}
```

### 6.3 Email Service (`lib/email-service.ts`)

**Rôle :** Envoi emails (factures, notifications)

**Fonctions :**
```typescript
sendInvoice(orderId, email)
  → Envoie facture par email
  
sendOrderConfirmation(orderId, email)
  → Envoie confirmation commande
```

---

## 7. ARCHITECTURE DES SERVICES

### 7.1 Dépendances

```
conversation-handler
    ├── openai-client
    ├── search-service
    ├── cart-service
    ├── order-service
    ├── customer-info-service
    └── twilio

order-service
    ├── cart-service
    ├── stripe
    ├── qrcode-service
    └── email-service

cart-service
    └── prisma

review-service
    ├── prisma
    └── twilio
```

### 7.2 Patterns Utilisés

**Service Layer Pattern**
- Séparation logique métier / API
- Réutilisabilité
- Testabilité

**Repository Pattern (via Prisma)**
- Abstraction accès données
- Client typé

**Factory Pattern**
- Création clients (OpenAI, Twilio, Stripe)
- Configuration centralisée

---

## 8. EXEMPLES D'UTILISATION

### 8.1 Recherche de Pneus

```typescript
import { searchTyres } from '@/lib/inventory/search-service'

const results = await searchTyres('205/55R16')
// Retourne 3 options groupées
```

### 8.2 Création Commande

```typescript
import { createOrder } from '@/lib/order-service'

const order = await createOrder({
  customerId: 'uuid',
  cartId: 'uuid',
  deliveryAddress: '15 Rue...',
  deliveryCity: 'Pointe-à-Pitre',
  deliveryPostalCode: '97110'
})
```

### 8.3 Envoi Message WhatsApp

```typescript
import { sendWhatsAppMessage } from '@/lib/twilio'

await sendWhatsAppMessage(
  'whatsapp:+590690123456',
  'Votre commande est prête !'
)
```

---

## 9. TESTS

### 9.1 Test Search Service

```bash
# Via API
curl http://localhost:3000/api/search-tyres?dimensions=205/55R16
```

### 9.2 Test Bot Complet

```
1. Envoyer "Bonjour" au sandbox Twilio
2. Bot répond avec menu
3. Taper "205/55R16"
4. Bot retourne 3 options
5. Suivre le flow complet
```

---

## 📊 STATISTIQUES SERVICES

**Fichiers services :** 20+ fichiers TypeScript
**Lines of code :** ~3000 lignes
**Couverture :** Tous les besoins métier
**Tests :** À développer (Phase 7)

---

[← Retour à l'index](./00_INDEX.md) | [Suivant : Bot WhatsApp →](./05_BOT_WHATSAPP.md)
