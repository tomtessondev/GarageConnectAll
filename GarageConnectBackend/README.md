# 🚗 GarageConnect

**Plateforme de vente de pneus en Guadeloupe avec bot WhatsApp IA**

[![Next.js](https://img.shields.io/badge/Next.js-15-black)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue)](https://www.typescriptlang.org/)
[![Prisma](https://img.shields.io/badge/Prisma-6-2D3748)](https://www.prisma.io/)
[![OpenAI](https://img.shields.io/badge/OpenAI-GPT--4-412991)](https://openai.com/)
[![Status](https://img.shields.io/badge/Status-71%25%20Complete-green)](.)

---

## 🎯 Concept

GarageConnect permet aux clients de rechercher et acheter des pneus **directement via WhatsApp**, guidés par un bot IA conversationnel propulsé par GPT-4.

**Parcours client simplifié:**
1. 💬 Chat WhatsApp avec le bot
2. 🔍 Recherche pneus par dimensions
3. 🛒 Ajout au panier
4. 💳 Paiement Stripe sécurisé
5. 📱 QR code pour retrait

---

## ✨ Fonctionnalités

### ✅ Opérationnel (71%)

- **Bot WhatsApp IA** - Conversationnel avec GPT-4
- **Recherche intelligente** - Par dimensions (Largeur/Hauteur/Diamètre)
- **Panier dynamique** - Expire automatiquement après 24h
- **Paiements sécurisés** - Intégration Stripe complète
- **QR Codes** - Génération automatique pour retrait
- **Avis clients** - Collection automatique 7 jours après achat
- **API Admin** - Authentification JWT, gestion configuration
- **Automatisations** - Nettoyage paniers, demandes avis

### 🚧 En développement (29%)

- **App Flutter Admin** - Interface mobile pour gérer le système
- **Multi-sources** - Agrégation inventaire de partenaires
- **Tests & Deploy** - Tests E2E, optimisations, production

---

## 🚀 Démarrage Rapide

**Installation en 15 minutes:**

```bash
# 1. Clone
git clone https://github.com/tomtessondev/GarageConnect.git
cd GarageConnect

# 2. Install
npm install

# 3. Configure .env (voir QUICKSTART.md)
cp .env.example .env
# Remplir les clés API

# 4. Setup DB
npx prisma generate
npx prisma db push
npx prisma db seed

# 5. Start
npm run dev
```

📖 **Guide complet:** [QUICKSTART.md](./QUICKSTART.md)

---

## 📂 Structure Projet

```
GarageConnect/
├── app/
│   ├── api/
│   │   ├── admin/          # API Admin (JWT)
│   │   ├── cron/           # Jobs automatisés
│   │   ├── whatsapp/       # Webhook WhatsApp
│   │   └── webhook/        # Webhook Stripe
│   └── ...
├── lib/
│   ├── ai/                 # Services IA (GPT-4)
│   ├── auth/               # Authentification JWT
│   ├── inventory/          # Recherche pneus
│   ├── cart-service.ts     # Gestion panier
│   ├── order-service.ts    # Gestion commandes
│   ├── review-service.ts   # Avis clients
│   └── qrcode-service.ts   # QR codes
├── prisma/
│   ├── schema.prisma       # Schéma DB
│   └── seed.ts             # Données test
└── docs/                   # 📚 Documentation
```

---

## 🛠️ Stack Technique

**Backend:**
- Next.js 15 (App Router)
- TypeScript
- PostgreSQL + Prisma
- OpenAI GPT-4 Turbo

**Services:**
- Twilio WhatsApp API
- Stripe Payments
- Vercel (Hosting + Cron)

**À venir:**
- Flutter (App Admin)

---

## 📚 Documentation

### 🎯 Guides principaux

- **[QUICKSTART.md](./QUICKSTART.md)** ⭐ - Installation rapide (15 min)
- **[PROJECT_SUMMARY.md](./PROJECT_SUMMARY.md)** - Vue d'ensemble complète
- **[IMPLEMENTATION_PLAN.md](./IMPLEMENTATION_PLAN.md)** - Plan 7 phases détaillé

### 📖 Documentation phases

- **[PHASE_2A_COMPLETE.md](./PHASE_2A_COMPLETE.md)** - Bot IA WhatsApp
- **[PHASE_2B_COMPLETE.md](./PHASE_2B_COMPLETE.md)** - Automatisations
- **[PHASE_3_COMPLETE.md](./PHASE_3_COMPLETE.md)** - API Admin
- **[PHASE_5_COMPLETE.md](./PHASE_5_COMPLETE.md)** - Paiements & QR Codes

### 🗂️ Références techniques

- **[DATABASE_SCHEMA.md](./DATABASE_SCHEMA.md)** - Schéma base de données
- **[CLEANUP_SUMMARY.md](./CLEANUP_SUMMARY.md)** - Historique nettoyage

---

## 🔑 Variables d'environnement

```bash
# Database
DATABASE_URL="postgresql://..."

# OpenAI (REQUIS)
OPENAI_API_KEY="sk-proj-..."

# Twilio WhatsApp (REQUIS)
TWILIO_ACCOUNT_SID="AC..."
TWILIO_AUTH_TOKEN="..."

# Stripe (REQUIS)
STRIPE_SECRET_KEY="sk_..."
STRIPE_WEBHOOK_SECRET="whsec_..."

# Auth (REQUIS)
JWT_SECRET="générer avec: openssl rand -base64 32"
CRON_SECRET="générer avec: openssl rand -base64 32"
```

---

## 🧪 Tests

### API Admin

```bash
# Login
curl -X POST http://localhost:3000/api/admin/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@garageconnect.gp","password":"admin123"}'
```

### Bot WhatsApp

```bash
# Via Twilio Sandbox
# Envoyer: "Bonjour" au numéro WhatsApp configuré
```

### Stripe Webhooks

```bash
stripe listen --forward-to localhost:3000/api/webhook/stripe
stripe trigger payment_intent.succeeded
```

---

## 📊 Progression

- [x] **Phase 1** - Base de Données (100%)
- [x] **Phase 2A** - Bot IA WhatsApp (100%)
- [x] **Phase 2B** - Automatisations (100%)
- [x] **Phase 3** - API Admin (100%)
- [x] **Phase 5** - Paiements & QR Codes (100%)
- [ ] **Phase 4** - App Flutter Admin (0%)
- [ ] **Phase 6** - Multi-sources Inventaire (0%)
- [ ] **Phase 7** - Tests & Optimisations (0%)

**🎯 71% Complet** - Backend entièrement fonctionnel !

---

## 🎨 Captures d'écran

### Bot WhatsApp
```
👤 Client: Bonjour
🤖 Bot: 👋 Bienvenue chez GarageConnect !
         Je peux vous aider à trouver les pneus parfaits.

👤 Client: Je cherche pneus 205/55R16
🤖 Bot: 🔍 J'ai trouvé 3 excellentes options...
         💰 BUDGET - 95€
         ⭐ STANDARD - 135€ ✨
         💎 PREMIUM - 165€
```

### Admin API Response
```json
{
  "success": true,
  "user": {
    "email": "admin@garageconnect.gp",
    "role": "admin"
  },
  "token": "eyJhbGc..."
}
```

---

## 🤝 Contribution

Le projet est actuellement en développement actif.

### Roadmap

1. **Court terme** - Finaliser Phase 4 (Flutter Admin)
2. **Moyen terme** - Phase 6 (Multi-sources)
3. **Long terme** - Phase 7 (Tests & Production)

---

## 📞 Support

### Documentation
Consulter d'abord la [documentation complète](./PROJECT_SUMMARY.md)

### Ressources externes
- **Next.js:** https://nextjs.org/docs
- **Prisma:** https://www.prisma.io/docs
- **OpenAI:** https://platform.openai.com/docs
- **Twilio WhatsApp:** https://www.twilio.com/docs/whatsapp
- **Stripe:** https://stripe.com/docs

---

## 📄 Licence

Propriétaire - GarageConnect © 2024

---

## 🎉 Statut

**✅ Système backend complet et opérationnel**

Le cœur de GarageConnect fonctionne et est prêt pour:
- Tests utilisateurs
- Démonstration client
- Développement app admin
- Déploiement MVP

**Prochaine étape:** Création de l'application Flutter admin

---

**Fait avec ❤️ en Guadeloupe 🇬🇵**
