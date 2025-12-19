# 03 - BASE DE DONNÉES

[← Retour à l'index](./00_INDEX.md)

---

## 📑 TABLE DES MATIÈRES

1. [Schéma Relationnel](#1-schéma-relationnel)
2. [Tables Principales](#2-tables-principales)
3. [Relations et Clés](#3-relations-et-clés)
4. [Index et Optimisations](#4-index-et-optimisations)
5. [Seed Data](#5-seed-data)

---

## 1. SCHÉMA RELATIONNEL

### 1.1 Vue d'ensemble

**Fichier source :** `GarageConnectBackend/prisma/schema.prisma`

**Statistiques :**
- 17 tables PostgreSQL
- Relations 1-to-1, 1-to-many, many-to-many
- Indexes optimisés pour requêtes fréquentes
- Constraints de validation
- Soft deletes avec CASCADE

### 1.2 Groupes de Tables

**Utilisateurs & Clients**
- `User` - Admins du système
- `Customer` - Clients WhatsApp

**Produits & Inventaire**
- `Product` - Pneus en stock
- `Distributor` - Fournisseurs
- `InventorySource` - Sources multi-catalogues
- `StockReservation` - Réservations temporaires

**Conversations & Messages**
- `Conversation` - Sessions chat
- `Message` - Historique messages

**Commandes & Paiements**
- `Order` - Commandes
- `OrderItem` - Lignes de commande
- `Payment` - Transactions
- `Invoice` - Factures
- `PickupTracking` - Suivi retrait

**Panier**
- `Cart` - Paniers temporaires (24h)
- `CartItem` - Contenu paniers

**Avis & Configuration**
- `Review` - Avis clients
- `BotConfig` - Configuration bot
- `AutoMessage` - Messages automatiques
- `Analytics` - Statistiques
- `Service` - Services additionnels

---

## 2. TABLES PRINCIPALES

### 2.1 User (Admins)

**Description :** Utilisateurs admin de la plateforme

**Champs principaux :**
```
- id (UUID, PK)
- email (String, unique)
- passwordHash (String)
- role (String, default: "admin")
- firstName, lastName (String)
- createdAt, updatedAt (DateTime)
```

**Utilisation :**
- Login admin via `app/api/admin/auth/login/`
- JWT authentication
- Gestion via app Flutter

### 2.2 Customer (Clients)

**Description :** Clients WhatsApp de la plateforme

**Champs principaux :**
```
- id (UUID, PK)
- phoneNumber (String, unique)
- firstName, lastName (String)
- email, address, city, postalCode (String)
- country (String, default: "Guadeloupe")
- createdAt, updatedAt (DateTime)
```

**Relations :**
- conversations (1-to-many)
- orders (1-to-many)
- carts (1-to-many)
- reviews (1-to-many)
- stockReservations (1-to-many)

**Utilisation :**
- Créé automatiquement au premier message
- Stocke infos de livraison
- Historique d'achats

### 2.3 Product (Pneus)

**Description :** Catalogue de pneus disponibles

**Champs principaux :**
```
- id (UUID, PK)
- sku (String, unique)
- name, brand, model (String)
- width, height, diameter (Int)
- dimensions (String, ex: "205/55R16")
- priceRetail (Decimal)
- stockQuantity (Int)
- category (Enum: budget, standard, premium)
- season (Enum: summer, winter, all_season)
- condition (Enum: new, premium, recycled)
- source (String, default: "local")
- imageUrl, description (String)
- createdAt, updatedAt (DateTime)
```

**Indexes :**
- dimensions
- brand
- category
- source
- stockQuantity

**Utilisation :**
- Recherche via `lib/inventory/search-service.ts`
- Filtrage par dimensions
- Groupement par catégorie

### 2.4 Conversation

**Description :** Sessions de conversation WhatsApp

**Champs principaux :**
```
- id (UUID, PK)
- customerId (UUID, FK)
- phoneNumber (String)
- state (String) - État du parcours
- context (JSON) - Contexte conversation
- status (Enum: active, completed, abandoned)
- startedAt, endedAt (DateTime)
```

**Relations :**
- customer (many-to-1)
- messages (1-to-many)
- orders (1-to-many)

**Utilisation :**
- Gère état parcours client
- Historique conversations
- Contexte pour IA

### 2.5 Message

**Description :** Messages échangés dans conversations

**Champs principaux :**
```
- id (UUID, PK)
- conversationId (UUID, FK)
- sender (String: 'user' | 'assistant')
- content (Text)
- metadata (JSON)
- timestamp (DateTime)
```

**Indexes :**
- conversationId
- timestamp

**Utilisation :**
- Historique complet
- Training data future
- Analyse conversations

### 2.6 Order (Commandes)

**Description :** Commandes clients

**Champs principaux :**
```
- id (UUID, PK)
- customerId (UUID, FK)
- orderNumber (String, unique)
- subtotal, tax, shipping, totalAmount (Decimal)
- status (Enum: pending, confirmed, paid, ready_pickup, completed, cancelled)
- paymentStatus (Enum: pending, paid, failed, refunded)
- paymentMethod (Enum: stripe, cod)
- stripePaymentIntentId (String)
- deliveryAddress, deliveryCity, deliveryPostalCode (String)
- createdAt, updatedAt (DateTime)
```

**Relations :**
- customer (many-to-1)
- conversation (many-to-1)
- items (1-to-many)
- payments (1-to-many)
- invoice (1-to-1)
- pickupTracking (1-to-1)
- review (1-to-1)

**Indexes :**
- customerId
- status
- orderNumber
- paymentStatus

**Workflow :**
1. pending - Créée
2. confirmed - Validée
3. paid - Payée (Stripe)
4. ready_pickup - QR envoyé
5. completed - Récupérée
6. cancelled - Annulée

### 2.7 OrderItem

**Description :** Lignes de commande

**Champs principaux :**
```
- id (UUID, PK)
- orderId (UUID, FK)
- productId (UUID, FK)
- quantity (Int)
- unitPrice, subtotal (Decimal)
- createdAt (DateTime)
```

**Relations :**
- order (many-to-1)
- product (many-to-1)

### 2.8 Payment

**Description :** Transactions de paiement

**Champs principaux :**
```
- id (UUID, PK)
- orderId (UUID, FK)
- amount (Decimal)
- method (Enum: stripe, cod)
- status (Enum: pending, paid, failed, refunded)
- stripePaymentIntentId (String)
- stripeChargeId (String)
- metadata (JSON)
- createdAt, updatedAt (DateTime)
```

**Indexes :**
- orderId
- status
- stripePaymentIntentId

**Utilisation :**
- Suivi paiements Stripe
- Webhooks `app/api/webhook/stripe/`
- Réconciliation comptable

### 2.9 Cart & CartItem

**Description :** Paniers temporaires (expire 24h)

**Cart :**
```
- id (UUID, PK)
- customerId (UUID, FK)
- expiresAt (DateTime)
- createdAt, updatedAt (DateTime)
```

**CartItem :**
```
- id (UUID, PK)
- cartId (UUID, FK)
- productId (UUID, FK)
- quantity (Int)
- addedAt (DateTime)
```

**Nettoyage :**
- Cron job : `app/api/cron/clean-expired-carts/`
- Fréquence : Toutes les heures

### 2.10 Review (Avis)

**Description :** Avis clients sur commandes

**Champs principaux :**
```
- id (UUID, PK)
- orderId (UUID, FK, unique)
- customerId (UUID, FK)
- rating (Int, 1-5)
- comment (Text)
- isPublic (Boolean)
- createdAt, updatedAt (DateTime)
```

**Contraintes :**
- Un seul avis par commande
- Rating entre 1 et 5

**Collecte automatique :**
- Cron job : `app/api/cron/request-reviews/`
- Délai : J+7 après livraison
- Message automatique WhatsApp

### 2.11 BotConfig

**Description :** Configuration du bot IA

**Champs principaux :**
```
- id (UUID, PK)
- name (String)
- systemPrompt (Text)
- welcomeMessage (Text)
- availableActions (JSON)
- minPrice, maxPrice (Decimal)
- businessHours (JSON)
- autoReplyEnabled (Boolean)
- maintenanceMode (Boolean)
- maintenanceMessage (Text)
- isActive (Boolean)
- version (String)
- createdAt, updatedAt (DateTime)
```

**Usage :**
- Une seule config active à la fois
- Modifiable via `app/api/admin/bot-config/`
- Rechargée à chaque conversation

### 2.12 PickupTracking

**Description :** Suivi retrait commandes

**Champs principaux :**
```
- id (UUID, PK)
- orderId (UUID, FK, unique)
- status (Enum: pending, picked_up, validated)
- pickedUpDate (DateTime)
- validatedDate (DateTime)
- warehouseStaffId (String)
- notes (String)
```

**Workflow :**
1. pending - QR envoyé
2. picked_up - Client à l'entrepôt
3. validated - QR scanné, commande remise

### 2.13 StockReservation

**Description :** Réservations temporaires de stock

**Champs principaux :**
```
- id (UUID, PK)
- productId (UUID, FK)
- quantity (Int)
- customerId (UUID, FK)
- orderId (UUID, FK)
- expiresAt (DateTime)
- status (String: pending, confirmed, expired, cancelled)
- createdAt (DateTime)
```

**Indexes :**
- status
- expiresAt
- productId

**Utilisation :**
- Réserve stock pendant 15 min
- Expire automatiquement
- Libère stock si non confirmé

---

## 3. RELATIONS ET CLÉS

### 3.1 Relations Principales

**Customer → Conversations (1-to-many)**
```
Customer.conversations ←→ Conversation.customerId
```

**Customer → Orders (1-to-many)**
```
Customer.orders ←→ Order.customerId
```

**Order → OrderItems (1-to-many)**
```
Order.items ←→ OrderItem.orderId
```

**Order → Invoice (1-to-1)**
```
Order.invoice ←→ Invoice.orderId (unique)
```

**Order → Review (1-to-1)**
```
Order.review ←→ Review.orderId (unique)
```

**Product → OrderItems (1-to-many)**
```
Product.orderItems ←→ OrderItem.productId
```

**Conversation → Messages (1-to-many)**
```
Conversation.messages ←→ Message.conversationId
```

### 3.2 Cascade Deletes

**Configuration :**
- Message → CASCADE si Conversation supprimée
- OrderItem → CASCADE si Order supprimée
- Payment → CASCADE si Order supprimée
- CartItem → CASCADE si Cart supprimé

**Protection :**
- Product ne peut être supprimé si OrderItems existent
- Customer ne peut être supprimé si Orders existent

---

## 4. INDEX ET OPTIMISATIONS

### 4.1 Index Critiques

**Product**
```
@@index([dimensions])     - Recherche fréquente
@@index([brand])          - Filtre par marque
@@index([category])       - Budget/Standard/Premium
@@index([stockQuantity])  - Disponibilité
```

**Order**
```
@@index([customerId])     - Historique client
@@index([status])         - Dashboard admin
@@index([orderNumber])    - Recherche rapide
@@index([paymentStatus])  - Suivi paiements
```

**Conversation**
```
@@index([customerId])     - Conversations client
@@index([status])         - Active/Completed
@@index([phoneNumber])    - Lookup rapide
```

**Message**
```
@@index([conversationId]) - Historique conversation
@@index([timestamp])      - Tri chronologique
```

### 4.2 Unique Constraints

```
User.email                - Login unique
Customer.phoneNumber      - WhatsApp unique
Product.sku              - SKU unique
Order.orderNumber        - Numéro commande unique
Review.orderId           - Un avis par commande
Invoice.orderId          - Une facture par commande
```

---

## 5. SEED DATA

### 5.1 Fichier Seed

**Fichier :** `GarageConnectBackend/prisma/seed.ts`

**Commande :**
```bash
npx prisma db seed
```

### 5.2 Données Créées

**20 Produits de Test**
- Marques : Michelin, Continental, Bridgestone, Goodyear, Pirelli
- Dimensions variées : 185/65R15, 195/55R16, 205/55R16, 215/60R16, 225/45R17
- 3 catégories : Budget, Standard, Premium
- Prix : 85€ à 165€

**Exemples :**
```
1. Michelin Energy Saver - 185/65R15 - Standard - 115€
2. Continental EcoContact - 185/65R15 - Budget - 85€
3. Bridgestone Turanza - 195/55R16 - Premium - 145€
```

### 5.3 Configuration Initiale

**Admin User (à créer manuellement)**
```
Email: admin@garageconnect.gp
Password hash: (voir QUICKSTART.md)
Role: admin
```

**Bot Config (première config)**
```
Créée automatiquement au démarrage
Prompts par défaut
Messages d'accueil français
```

---

## 📊 STATISTIQUES DATABASE

**Taille Estimée**
- Schema : ~500 lignes Prisma
- Tables : 17
- Relations : 25+
- Index : 20+
- Constraints : 15+

**Performance**
- Queries optimisées avec index
- Connection pooling Supabase
- Prisma query cache
- Relations eager/lazy loading

---

[← Retour à l'index](./00_INDEX.md) | [Suivant : Backend Services →](./04_BACKEND_SERVICES.md)
