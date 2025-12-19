# 02 - ARCHITECTURE TECHNIQUE

[← Retour à l'index](./00_INDEX.md)

---

## 📑 TABLE DES MATIÈRES

1. [Schéma d'Architecture Globale](#1-schéma-darchitecture-globale)
2. [Stack Technologique](#2-stack-technologique)
3. [Structure des Projets](#3-structure-des-projets)
4. [Flux de Communication](#4-flux-de-communication)
5. [Patterns Architecturaux](#5-patterns-architecturaux)

---

## 1. SCHÉMA D'ARCHITECTURE GLOBALE

### 1.1 Vue d'ensemble

```
┌─────────────────────────────────────────────────────────────────┐
│                         GARAGECONNECT                           │
│                    Architecture Complète                        │
└─────────────────────────────────────────────────────────────────┘

    ┌──────────────┐
    │   CLIENT     │
    │  WhatsApp    │
    │   📱 Mobile  │
    └──────┬───────┘
           │
           │ Messages
           ▼
    ┌──────────────┐
    │   TWILIO     │
    │  WhatsApp    │
    │     API      │
    └──────┬───────┘
           │
           │ Webhook
           ▼
┌──────────────────────────────────────────────────────────────┐
│                    BACKEND NEXT.JS                           │
│                   (Vercel Hosting)                           │
│                                                              │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  APP ROUTER (app/)                                  │   │
│  │                                                      │   │
│  │  ┌─────────────┐  ┌──────────────┐  ┌───────────┐ │   │
│  │  │   Webhook   │  │  API Admin   │  │   Cron    │ │   │
│  │  │  WhatsApp   │  │   (JWT)      │  │   Jobs    │ │   │
│  │  └─────────────┘  └──────────────┘  └───────────┘ │   │
│  │                                                      │   │
│  │  ┌─────────────┐  ┌──────────────┐  ┌───────────┐ │   │
│  │  │  Webhook    │  │  API Orders  │  │  Search   │ │   │
│  │  │   Stripe    │  │              │  │   Tyres   │ │   │
│  │  └─────────────┘  └──────────────┘  └───────────┘ │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                              │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  SERVICES (lib/)                                    │   │
│  │                                                      │   │
│  │  ┌──────────┐  ┌──────────┐  ┌─────────────────┐  │   │
│  │  │ AI/GPT-4 │  │  Cart    │  │  Order Service  │  │   │
│  │  │ Handler  │  │ Service  │  │                 │  │   │
│  │  └──────────┘  └──────────┘  └─────────────────┘  │   │
│  │                                                      │   │
│  │  ┌──────────┐  ┌──────────┐  ┌─────────────────┐  │   │
│  │  │ Inventory│  │  Review  │  │   QR Code       │  │   │
│  │  │  Search  │  │ Service  │  │   Generator     │  │   │
│  │  └──────────┘  └──────────┘  └─────────────────┘  │   │
│  │                                                      │   │
│  │  ┌──────────┐  ┌──────────┐  ┌─────────────────┐  │   │
│  │  │  Stripe  │  │  Twilio  │  │   Auth/JWT      │  │   │
│  │  │          │  │          │  │                 │  │   │
│  │  └──────────┘  └──────────┘  └─────────────────┘  │   │
│  └─────────────────────────────────────────────────────┘   │
└──────────────────────────────────────────────────────────────┘
           │                      │                    │
           ▼                      ▼                    ▼
    ┌──────────┐          ┌──────────┐        ┌──────────┐
    │ OpenAI   │          │ Supabase │        │  Stripe  │
    │  GPT-4   │          │PostgreSQL│        │ Payments │
    └──────────┘          └──────────┘        └──────────┘

┌──────────────────────────────────────────────────────────────┐
│              FLUTTER ADMIN APP (Mobile)                      │
│                                                              │
│  ┌─────────┐  ┌──────────┐  ┌──────────┐  ┌────────────┐  │
│  │  Login  │  │Dashboard │  │ Bot      │  │Conversatio│  │
│  │  Screen │  │  Screen  │  │ Config   │  │ns Screen  │  │
│  └─────────┘  └──────────┘  └──────────┘  └────────────┘  │
│                                                              │
│  ┌─────────┐  ┌──────────┐       API Service (Dio)         │
│  │ Reviews │  │  Orders  │       └──────────────┘           │
│  │ Screen  │  │  Screen  │                                  │
│  └─────────┘  └──────────┘                                  │
└──────────────────────────────────────────────────────────────┘
                        │
                        │ HTTPS/REST API
                        ▼
                  Backend Next.js
```

### 1.2 Composants Principaux

**Niveau Client**
- 📱 WhatsApp Mobile (interface utilisateur)
- 📱 Flutter Admin App (gestion)

**Niveau Communication**
- 🔗 Twilio WhatsApp API (messages)
- 🔗 Webhook entrant/sortant

**Niveau Backend**
- ⚙️ Next.js 15 (App Router)
- 🧠 Services métier (lib/)
- �� Authentication JWT
- ⏰ Cron jobs automatisés

**Niveau Données**
- 💾 Supabase PostgreSQL (données)
- 🤖 OpenAI GPT-4 (IA)
- 💳 Stripe (paiements)

---

## 2. STACK TECHNOLOGIQUE

### 2.1 Backend

**Framework & Langage**
- **Next.js 15** - Framework React avec App Router
  - Fichier : `GarageConnectBackend/package.json`
  - Version : 16.0.0
  - Routing API natif
  - Server-side rendering
  - Edge functions support

- **TypeScript 5** - Typage statique
  - Configuration : `GarageConnectBackend/tsconfig.json`
  - Strict mode activé
  - Path aliases configurés

**Base de Données**
- **PostgreSQL** - Base relationnelle
  - Hébergement : Supabase
  - 17 tables
  - Relations complexes

- **Prisma 6.18** - ORM
  - Fichier schema : `GarageConnectBackend/prisma/schema.prisma`
  - Client auto-généré
  - Migrations gérées
  - Studio pour admin

**Intelligence Artificielle**
- **OpenAI GPT-4 Turbo** - Moteur conversationnel
  - Bibliothèque : `openai` v6.9.1
  - Fichiers : `GarageConnectBackend/lib/ai/`
  - Temperature configurée : 0.7
  - Max tokens : 150

**Messaging**
- **Twilio WhatsApp API** - Communication client
  - Bibliothèque : `twilio` v5.10.3
  - Fichiers : `GarageConnectBackend/lib/twilio.ts`
  - Webhook : `app/api/whatsapp/webhook/`
  - Sandbox pour tests

**Paiements**
- **Stripe** - Processeur paiements
  - Bibliothèque : `stripe` v19.1.0
  - Fichiers : `GarageConnectBackend/lib/stripe.ts`
  - Webhook : `app/api/webhook/stripe/`
  - Payment Intents API

**Authentication**
- **JWT (jose)** - Tokens sécurisés
  - Bibliothèque : `jose` v6.1.2
  - Fichiers : `GarageConnectBackend/lib/auth/`
  - Access tokens : 7 jours
  - Refresh tokens : 30 jours

**Utilitaires**
- **QR Code** - Génération codes
  - Bibliothèque : `qrcode` v1.5.4
  - Fichier : `lib/qrcode-generator.ts`

- **Date-fns** - Manipulation dates
  - Bibliothèque : `date-fns` v4.1.0
  - Format français

- **Zod** - Validation données
  - Bibliothèque : `zod` v4.1.12
  - Schémas de validation

### 2.2 Frontend (Flutter)

**Framework**
- **Flutter 3.x** - Framework multi-plateformes
  - Fichier : `GarageConnectFlutter/pubspec.yaml`
  - Support Android/iOS
  - Material Design

**State Management**
- **flutter_bloc 8.1.3** - Pattern Bloc
  - Architecture réactive
  - Séparation logique/UI

- **equatable 2.0.5** - Comparaison objets
  - Optimisation rebuilds

**Networking**
- **dio 5.4.0** - Client HTTP
  - Intercepteurs configurés
  - Retry automatique

- **retrofit 4.0.3** - API client
  - Génération code
  - Type-safe

**Storage**
- **shared_preferences 2.2.2** - Préférences
  - Stockage simple

- **flutter_secure_storage 9.0.0** - Tokens
  - Stockage sécurisé
  - Keychain/Keystore

**UI**
- **google_fonts 6.1.0** - Polices
- **fl_chart 0.66.0** - Graphiques
- **flutter_svg 2.0.9** - Icônes SVG

**Utilitaires**
- **intl 0.19.0** - Internationalisation
- **timeago 3.6.0** - Dates relatives

### 2.3 Infrastructure

**Hosting**
- **Vercel** - Backend Next.js
  - Auto-scaling
  - Edge Network CDN
  - Deploy automatique
  - Fichier : `GarageConnectBackend/vercel.json`

**Database**
- **Supabase** - PostgreSQL managé
  - Connection pooling
  - Backups automatiques
  - Interface admin

**Cron Jobs**
- **Vercel Cron** - Tâches planifiées
  - Clean carts : toutes les heures
  - Request reviews : quotidien 10h
  - Configuration : `vercel.json`

**Monitoring** (à configurer)
- Vercel Analytics
- Logs temps réel
- Error tracking (Sentry recommandé)

---

## 3. STRUCTURE DES PROJETS

### 3.1 Backend - GarageConnectBackend/

```
GarageConnectBackend/
│
├── app/                           # Next.js App Router
│   ├── api/                       # Routes API
│   │   ├── route.ts              # Health check
│   │   ├── admin/                # 🔐 Routes admin (JWT)
│   │   │   ├── auth/
│   │   │   │   └── login/
│   │   │   │       └── route.ts  # POST /api/admin/auth/login
│   │   │   ├── analytics/
│   │   │   │   └── route.ts      # GET /api/admin/analytics
│   │   │   ├── bot-config/
│   │   │   │   └── route.ts      # GET/PUT /api/admin/bot-config
│   │   │   ├── conversations/
│   │   │   │   ├── route.ts      # GET /api/admin/conversations
│   │   │   │   └── [id]/
│   │   │   │       └── route.ts  # GET /api/admin/conversations/:id
│   │   │   ├── reviews/
│   │   │   │   └── route.ts      # GET/PUT /api/admin/reviews
│   │   │   └── orders/
│   │   │       └── route.ts      # GET/PUT /api/admin/orders
│   │   │
│   │   ├── cron/                 # ⏰ Cron jobs
│   │   │   ├── clean-expired-carts/
│   │   │   │   └── route.ts      # Toutes les heures
│   │   │   └── request-reviews/
│   │   │       └── route.ts      # Quotidien 10h
│   │   │
│   │   ├── orders/               # 📦 Commandes publiques
│   │   │   ├── route.ts
│   │   │   └── [id]/
│   │   │       └── route.ts
│   │   │
│   │   ├── payment/              # 💳 Paiements
│   │   │   └── create-intent/
│   │   │       └── route.ts
│   │   │
│   │   ├── qrcode/               # 📱 QR codes
│   │   │   └── [orderId]/
│   │   │       └── route.ts
│   │   │
│   │   ├── search-tyres/         # 🔍 Recherche
│   │   │   └── route.ts
│   │   │
│   │   ├── webhook/              # 🔗 Webhooks
│   │   │   └── stripe/
│   │   │       └── route.ts      # Webhook Stripe
│   │   │
│   │   └── whatsapp/             # 💬 WhatsApp
│   │       ├── send/
│   │       │   └── route.ts
│   │       └── webhook/
│   │           └── route.ts      # Webhook Twilio
│   │
│   ├── layout.tsx                # Layout principal
│   ├── globals.css               # Styles globaux
│   └── favicon.ico               # Icône site
│
├── lib/                          # 📚 Services & Logique métier
│   ├── ai/                       # 🤖 Intelligence Artificielle
│   │   ├── conversation-handler.ts   # Orchestrateur bot
│   │   ├── openai-client.ts          # Client GPT-4
│   │   └── system-prompt.ts          # Prompts configurables
│   │
│   ├── auth/                     # 🔐 Authentication
│   │   ├── jwt.ts                # Génération/validation JWT
│   │   └── middleware.ts         # Protection routes
│   │
│   ├── inventory/                # 📦 Inventaire
│   │   └── search-service.ts     # Recherche pneus
│   │
│   ├── cart-service.ts           # 🛒 Gestion panier
│   ├── order-service.ts          # 📋 Gestion commandes
│   ├── review-service.ts         # ⭐ Avis clients
│   ├── qrcode-service.ts         # 📱 QR codes
│   ├── qrcode-generator.ts       # Génération QR
│   ├── customer-info-service.ts  # 👤 Info clients
│   ├── email-service.ts          # 📧 Emails
│   ├── prisma.ts                 # Client Prisma
│   ├── redis.ts                  # Cache Redis
│   ├── stripe.ts                 # Client Stripe
│   ├── twilio.ts                 # Client Twilio
│   ├── whatsapp-helpers.ts       # Helpers WhatsApp
│   ├── whatsapp-media.ts         # Média WhatsApp
│   ├── session-manager.ts        # Sessions
│   └── session-storage.ts        # Stockage sessions
│
├── prisma/                       # 💾 Base de données
│   ├── schema.prisma             # Schéma DB (17 tables)
│   └── seed.ts                   # Données de test
│
├── types/                        # 📝 Types TypeScript
│   └── index.ts                  # Types globaux
│
├── scripts/                      # 🛠️ Scripts utilitaires
│   └── enable-24-7.ts            # Activation 24/7
│
├── public/                       # 📁 Fichiers statiques
│   └── *.svg                     # Icônes
│
├── .env                          # ⚙️ Variables environnement
├── .env.example                  # Exemple .env
├── package.json                  # Dépendances npm
├── tsconfig.json                 # Config TypeScript
├── next.config.ts                # Config Next.js
├── vercel.json                   # Config Vercel + Cron
├── eslint.config.mjs             # Config ESLint
├── postcss.config.mjs            # Config PostCSS
│
└── [15 fichiers .md]             # 📚 Documentation
```

### 3.2 Frontend - GarageConnectFlutter/

```
GarageConnectFlutter/
│
├── lib/                          # Code Dart
│   ├── main.dart                 # Point d'entrée
│   │
│   ├── core/                     # 🎯 Core features
│   │   ├── config/               # Configuration
│   │   │   ├── app_config.dart
│   │   │   └── theme.dart
│   │   │
│   │   └── services/             # Services
│   │       └── api_service.dart  # Client API (Dio)
│   │
│   └── presentation/             # 🎨 UI
│       ├── screens/              # Écrans
│       │   ├── splash_screen.dart
│       │   ├── login_screen.dart
│       │   ├── dashboard_screen.dart
│       │   ├── bot_config_screen.dart
│       │   ├── conversations_screen.dart
│       │   ├── reviews_screen.dart
│       │   └── orders_screen.dart
│       │
│       └── widgets/              # Composants réutilisables
│           └── common/
│
├── android/                      # 📱 Build Android
│   ├── app/
│   │   ├── build.gradle.kts
│   │   └── src/main/
│   │       └── AndroidManifest.xml
│   └── build.gradle.kts
│
├── ios/                          # 🍎 Build iOS
│   ├── Runner/
│   │   └── Info.plist
│   └── Podfile
│
├── web/                          # 🌐 Build Web
│   └── index.html
│
├── test/                         # 🧪 Tests
│   └── widget_test.dart
│
├── pubspec.yaml                  # Dépendances Flutter
├── analysis_options.yaml         # Config analyseur Dart
│
└── [Documentation .md]           # Guides Flutter
```

---

## 4. FLUX DE COMMUNICATION

### 4.1 Flux d'achat complet - Diagramme de séquence

```
Client     Twilio    Backend      OpenAI    Prisma    Stripe
WhatsApp   API       Next.js      GPT-4     DB        API
  │          │          │           │         │         │
  │ "Bonjour"│          │           │         │         │
  ├─────────>│          │           │         │         │
  │          │ Webhook  │           │         │         │
  │          ├─────────>│           │         │         │
  │          │          │ Get/Create│         │         │
  │          │          │ Customer  │         │         │
  │          │          ├─────────────────────>│         │
  │          │          │<─────────────────────┤         │
  │          │          │           │         │         │
  │          │          │ Get       │         │         │
  │          │          │ Conversation        │         │
  │          │          ├─────────────────────>│         │
  │          │          │<─────────────────────┤         │
  │          │          │           │         │         │
  │          │          │ Chat      │         │         │
  │          │          │ Completion│         │         │
  │          │          ├──────────>│         │         │
  │          │          │<──────────┤         │         │
  │          │          │           │         │         │
  │          │          │ Save      │         │         │
  │          │          │ Message   │         │         │
  │          │          ├─────────────────────>│         │
  │          │ Response │           │         │         │
  │          │<─────────┤           │         │         │
  │<─────────┤          │           │         │         │
  │          │          │           │         │         │
  │ "205/55R16"         │           │         │         │
  ├─────────>│          │           │         │         │
  │          ├─────────>│           │         │         │
  │          │          │ Extract   │         │         │
  │          │          │ Dimensions│         │         │
  │          │          ├──────────>│         │         │
  │          │          │<──────────┤         │         │
  │          │          │           │         │         │
  │          │          │ Search    │         │         │
  │          │          │ Products  │         │         │
  │          │          ├─────────────────────>│         │
  │          │          │<─────────────────────┤         │
  │          │          │           │         │         │
  │          │          │ Format    │         │         │
  │          │          │ Results   │         │         │
  │          │<─────────┤           │         │         │
  │<─────────┤          │           │         │         │
  │ "3 options"         │           │         │         │
  │          │          │           │         │         │
  │ "Standard"          │           │         │         │
  ├─────────>│          │           │         │         │
  │          ├─────────>│           │         │         │
  │          │          │ Detect    │         │         │
  │          │          │ Selection │         │         │
  │          │          ├──────────>│         │         │
  │          │          │<──────────┤         │         │
  │          │<─────────┤           │         │         │
  │<─────────┤          │           │         │         │
  │ "Combien?"          │           │         │         │
  │          │          │           │         │         │
  │ "4"                 │           │         │         │
  ├─────────>│          │           │         │         │
  │          ├─────────>│           │         │         │
  │          │          │ Add to    │         │         │
  │          │          │ Cart      │         │         │
  │          │          ├─────────────────────>│         │
  │          │          │<─────────────────────┤         │
  │          │<─────────┤           │         │         │
  │<─────────┤          │           │         │         │
  │ "✅ Ajouté"         │           │         │         │
  │          │          │           │         │         │
  │ "Commander"         │           │         │         │
  ├─────────>│          │           │         │         │
  │          ├─────────>│           │         │         │
  │          │          │ Create    │         │         │
  │          │          │ Order     │         │         │
  │          │          ├─────────────────────>│         │
  │          │          │           │         │         │
  │          │          │ Create    │         │         │
  │          │          │ Payment   │         │         │
  │          │          │ Intent    │         │         │
  │          │          ├─────────────────────────────>│
  │          │          │<─────────────────────────────┤
  │          │          │ (payment_url)       │         │
  │          │<─────────┤           │         │         │
  │<─────────┤          │           │         │         │
  │ "Lien paiement"     │           │         │         │
  │          │          │           │         │         │
  │ [Paie sur Stripe]   │           │         │         │
  ├────────────────────────────────────────────────────>│
  │          │          │           │         │         │
  │          │          │ Webhook   │         │         │
  │          │          │ payment   │         │         │
  │          │          │ success   │         │         │
  │          │          │<─────────────────────────────┤
  │          │          │           │         │         │
  │          │          │ Update    │         │         │
  │          │          │ Order     │         │         │
  │          │          ├─────────────────────>│         │
  │          │          │           │         │         │
  │          │          │ Generate  │         │         │
  │          │          │ QR Code   │         │         │
  │          │<─────────┤           │         │         │
  │<─────────┤          │           │         │         │
  │ "✅ Payé + QR"      │           │         │         │
```

### 4.2 Flux API Admin

```
Flutter     Backend      Prisma
Admin       Next.js      DB
  │            │           │
  │ POST /api/admin/auth/login
  ├───────────>│           │
  │            │ Verify    │
  │            │ Password  │
  │            ├──────────>│
  │            │<──────────┤
  │            │           │
  │            │ Generate  │
  │            │ JWT       │
  │            │           │
  │<───────────┤           │
  │ (token)    │           │
  │            │           │
  │ GET /api/admin/analytics
  │ [Bearer token]         │
  ├───────────>│           │
  │            │ Verify    │
  │            │ JWT       │
  │            │           │
  │            │ Query     │
  │            │ Stats     │
  │            ├──────────>│
  │            │<──────────┤
  │<───────────┤           │
  │ (stats)    │           │
```

---

## 5. PATTERNS ARCHITECTURAUX

### 5.1 Backend Patterns

**API Routes Pattern (Next.js)**
- Fichiers : `app/api/*/route.ts`
- HTTP methods : GET, POST, PUT, DELETE
- Handlers asynchrones
- Response JSON standardisé

**Service Layer Pattern**
- Dossier : `lib/`
- Séparation logique métier / API
- Réutilisabilité
- Testabilité

**Repository Pattern (Prisma)**
- Client centralisé : `lib/prisma.ts`
- Queries typées
- Transactions gérées

**Middleware Pattern**
- Fichier : `lib/auth/middleware.ts`
- Vérification JWT
- Protection routes admin

**Webhook Pattern**
- Twilio : `app/api/whatsapp/webhook/`
- Stripe : `app/api/webhook/stripe/`
- Signature verification
- Idempotency

### 5.2 Frontend Patterns

**BLoC Pattern (Flutter)**
- Business Logic Component
- Séparation UI/Logic
- Streams réactifs
- States immutables

**Repository Pattern**
- ApiService : `lib/core/services/api_service.dart`
- Abstraction réseau
- Error handling centralisé

**Widget Composition**
- Widgets réutilisables
- Props typées
- State management

---

[← Retour à l'index](./00_INDEX.md) | [Suivant : Base de Données →](./03_BASE_DE_DONNEES.md)
