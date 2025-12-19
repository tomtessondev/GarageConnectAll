# 🧪 Phase 7 - Tests & Déploiement - Guide Complet

**Durée estimée:** 2-3 jours  
**Objectif:** Finaliser, tester et déployer en production  
**Statut:** Guide prêt

---

## 🎯 OBJECTIFS

1. ✅ Tests complets du système
2. ✅ Optimisations performance
3. ✅ Configuration production
4. ✅ Déploiement Vercel
5. ✅ Monitoring & alertes
6. ✅ Documentation finale

---

## 📋 CHECKLIST PRÉ-PRODUCTION

### Backend ✅
- [ ] Toutes les routes API testées
- [ ] Gestion erreurs implémentée
- [ ] Variables env configurées
- [ ] Logs structurés
- [ ] Rate limiting (si nécessaire)
- [ ] CORS configuré correctement

### Base de données ✅
- [ ] Migrations finales appliquées
- [ ] Index créés sur colonnes fréquentes
- [ ] Backup automatique configuré
- [ ] Connexion pool optimisée

### Sécurité 🔒
- [ ] JWT secrets forts (256 bits)
- [ ] HTTPS only en production
- [ ] Webhooks signatures vérifiées
- [ ] Mots de passe hashés (SHA-256)
- [ ] Rate limiting activé
- [ ] CORS restrictif

### WhatsApp Bot 💬
- [ ] Prompts testés et optimisés
- [ ] Messages d'erreur clairs
- [ ] Fallbacks implémentés
- [ ] Mode maintenance testé
- [ ] Horaires configurés

### Paiements 💳
- [ ] Stripe en mode production
- [ ] Webhooks testés
- [ ] Emails confirmations
- [ ] QR codes générés
- [ ] Stock réduit correctement

---

## 🧪 TESTS COMPLETS

### 1. Tests API

#### Script de tests (tests/api.test.sh)

```bash
#!/bin/bash

BASE_URL="http://localhost:3000"
TOKEN=""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m'

echo "🧪 Tests API GarageConnect"
echo "=========================="
echo ""

# Test 1: Health Check
echo "Test 1: Health Check"
response=$(curl -s -w "\n%{http_code}" $BASE_URL/api)
status=$(echo "$response" | tail -n 1)
if [ "$status" = "200" ]; then
    echo -e "${GREEN}✓ Health check OK${NC}"
else
    echo -e "${RED}✗ Health check FAILED${NC}"
fi
echo ""

# Test 2: Login Admin
echo "Test 2: Login Admin"
response=$(curl -s -w "\n%{http_code}" -X POST $BASE_URL/api/admin/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@garageconnect.gp","password":"admin123"}')
status=$(echo "$response" | tail -n 1)
if [ "$status" = "200" ]; then
    echo -e "${GREEN}✓ Login OK${NC}"
    TOKEN=$(echo "$response" | head -n -1 | jq -r '.token')
else
    echo -e "${RED}✗ Login FAILED${NC}"
fi
echo ""

# Test 3: Get Bot Config
echo "Test 3: Get Bot Config"
response=$(curl -s -w "\n%{http_code}" $BASE_URL/api/admin/bot-config \
  -H "Authorization: Bearer $TOKEN")
status=$(echo "$response" | tail -n 1)
if [ "$status" = "200" ]; then
    echo -e "${GREEN}✓ Bot config OK${NC}"
else
    echo -e "${RED}✗ Bot config FAILED${NC}"
fi
echo ""

# Test 4: Search Tyres
echo "Test 4: Search Tyres"
response=$(curl -s -w "\n%{http_code}" "$BASE_URL/api/search-tyres?width=205&height=55&diameter=16")
status=$(echo "$response" | tail -n 1)
if [ "$status" = "200" ]; then
    echo -e "${GREEN}✓ Search tyres OK${NC}"
else
    echo -e "${RED}✗ Search tyres FAILED${NC}"
fi
echo ""

echo "=========================="
echo "Tests terminés !"
```

### 2. Tests WhatsApp

**Scénarios à tester:**

1. **Conversation basique**
```
Client: Bonjour
→ Vérifier: Message d'accueil reçu

Client: Je cherche pneus 205/55R16
→ Vérifier: 3 options affichées

Client: Standard
→ Vérifier: Demande quantité

Client: 4
→ Vérifier: Ajout au panier confirmé
```

2. **Gestion erreurs**
```
Client: Dimensions invalides 999/999R99
→ Vérifier: Message erreur clair

Client: Message hors sujet
→ Vérifier: Bot refuse poliment
```

3. **Commande complète**
```
1. Recherche pneus ✓
2. Ajout panier ✓
3. Commande ✓
4. Adresse fournie ✓
5. Lien paiement reçu ✓
6. Paiement test ✓
7. QR code reçu ✓
```

### 3. Tests Stripe

```bash
# Test webhook local
stripe listen --forward-to localhost:3000/api/webhook/stripe

# Trigger events
stripe trigger payment_intent.succeeded
stripe trigger payment_intent.payment_failed
stripe trigger payment_intent.canceled
```

### 4. Tests Cron Jobs

```bash
# Test nettoyage paniers
curl http://localhost:3000/api/cron/clean-expired-carts \
  -H "Authorization: Bearer ${CRON_SECRET}"

# Test demande avis
curl http://localhost:3000/api/cron/request-reviews \
  -H "Authorization: Bearer ${CRON_SECRET}"
```

---

## ⚡ OPTIMISATIONS

### 1. Base de données

#### Créer index pour performance

```sql
-- Index pour recherches fréquentes
CREATE INDEX idx_product_dimensions ON "Product" (width, height, diameter);
CREATE INDEX idx_order_status ON "Order" (status);
CREATE INDEX idx_order_customer ON "Order" ("customerId");
CREATE INDEX idx_conversation_customer ON "Conversation" ("customerId");
CREATE INDEX idx_message_conversation ON "Message" ("conversationId");

-- Index pour cron jobs
CREATE INDEX idx_cart_expired ON "Cart" ("expiresAt");
CREATE INDEX idx_order_completed ON "Order" (status, "createdAt");
```

### 2. Next.js

#### next.config.ts optimisé

```typescript
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  
  // Optimizations
  compress: true,
  poweredByHeader: false,
  
  // Production only
  ...(process.env.NODE_ENV === 'production' && {
    swcMinify: true,
    compiler: {
      removeConsole: {
        exclude: ['error', 'warn'],
      },
    },
  }),
};

export default nextConfig;
```

### 3. Prisma

#### prisma/schema.prisma - Connection pool

```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
  directUrl = env("DIRECT_URL")
  
  // Connection pool settings
  relationMode = "prisma"
  
  pool = {
    timeout = 10
    max_size = 10
  }
}
```

### 4. Rate Limiting (optionnel)

```typescript
// lib/rate-limit.ts
import { LRUCache } from 'lru-cache';

type Options = {
  uniqueTokenPerInterval?: number;
  interval?: number;
};

export function rateLimit(options?: Options) {
  const tokenCache = new LRUCache({
    max: options?.uniqueTokenPerInterval || 500,
    ttl: options?.interval || 60000,
  });

  return {
    check: (limit: number, token: string) =>
      new Promise<void>((resolve, reject) => {
        const tokenCount = (tokenCache.get(token) as number[]) || [0];
        if (tokenCount[0] === 0) {
          tokenCache.set(token, tokenCount);
        }
        tokenCount[0] += 1;

        const currentUsage = tokenCount[0];
        const isRateLimited = currentUsage >= limit;

        return isRateLimited ? reject() : resolve();
      }),
  };
}
```

---

## 🚀 DÉPLOIEMENT VERCEL

### 1. Préparer l'environnement

```bash
# Install Vercel CLI
npm i -g vercel

# Login
vercel login

# Link project
vercel link
```

### 2. Variables d'environnement

Dans Vercel Dashboard → Settings → Environment Variables:

```bash
# Production
DATABASE_URL="postgresql://..."
OPENAI_API_KEY="sk-proj-..."
TWILIO_ACCOUNT_SID="AC..."
TWILIO_AUTH_TOKEN="..."
STRIPE_SECRET_KEY="sk_live_..." # Mode PRODUCTION
STRIPE_WEBHOOK_SECRET="whsec_..." # Secret PRODUCTION
JWT_SECRET="..."
CRON_SECRET="..."

# Optionnel
SENTRY_DSN="..." # Pour monitoring
```

### 3. Déployer

```bash
# Preview deployment
vercel

# Production deployment
vercel --prod
```

### 4. Configurer webhooks

**Twilio:**
- URL: `https://votre-domaine.vercel.app/api/whatsapp/webhook`

**Stripe:**
- URL: `https://votre-domaine.vercel.app/api/webhook/stripe`
- Events: `payment_intent.*`

---

## 📊 MONITORING

### 1. Vercel Analytics

```typescript
// app/layout.tsx
import { Analytics } from '@vercel/analytics/react';

export default function RootLayout() {
  return (
    <html>
      <body>
        {children}
        <Analytics />
      </body>
    </html>
  );
}
```

### 2. Sentry (erreurs)

```bash
npm install @sentry/nextjs
```

```typescript
// sentry.client.config.ts
import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  tracesSampleRate: 0.1,
  environment: process.env.NODE_ENV,
});
```

### 3. Logs structurés

```typescript
// lib/logger.ts
export const logger = {
  info: (message: string, data?: any) => {
    console.log(JSON.stringify({
      level: 'info',
      message,
      data,
      timestamp: new Date().toISOString(),
    }));
  },
  
  error: (message: string, error?: any) => {
    console.error(JSON.stringify({
      level: 'error',
      message,
      error: error?.message || error,
      stack: error?.stack,
      timestamp: new Date().toISOString(),
    }));
  },
};
```

---

## 📝 DOCUMENTATION FINALE

### 1. Créer .env.example

```bash
# Database
DATABASE_URL="postgresql://..."

# OpenAI
OPENAI_API_KEY="sk-proj-..."

# Twilio WhatsApp
TWILIO_ACCOUNT_SID="AC..."
TWILIO_AUTH_TOKEN="..."
TWILIO_WHATSAPP_FROM="whatsapp:+..."

# Stripe
STRIPE_SECRET_KEY="sk_..."
STRIPE_WEBHOOK_SECRET="whsec_..."

# Auth & Cron
JWT_SECRET="générer avec: openssl rand -base64 32"
CRON_SECRET="générer avec: openssl rand -base64 32"
```

### 2. Mettre à jour README.md

```markdown
## 🚀 Déploiement

Le projet est déployé sur Vercel:
- Production: https://garageconnect.vercel.app
- Staging: https://garageconnect-staging.vercel.app

## 📞 Support

Email: support@garageconnect.gp
WhatsApp: +590 690 XX XX XX
```

---

## ✅ CHECKLIST LANCEMENT

### J-7 (Une semaine avant)
- [ ] Tests complets effectués
- [ ] Optimisations appliquées
- [ ] Variables env production configurées
- [ ] Webhooks configurés
- [ ] Backup DB configuré
- [ ] Monitoring activé

### J-1 (Veille du lancement)
- [ ] Double-check toutes les variables
- [ ] Test parcours complet
- [ ] Vérifier crédits API (OpenAI, Twilio)
- [ ] S'assurer Stripe en mode live
- [ ] Briefing équipe support

### Jour J (Lancement)
- [ ] Deploy production
- [ ] Vérifier tous les services
- [ ] Test achat réel
- [ ] Surveiller logs
- [ ] Communiquer lancement

### J+1 (Après lancement)
- [ ] Analyser metrics
- [ ] Vérifier feedbacks
- [ ] Corriger bugs urgents
- [ ] Optimiser si nécessaire

---

## 🐛 TROUBLESHOOTING PRODUCTION

### Logs Vercel

```bash
# Voir logs temps réel
vercel logs --follow

# Logs d'une fonction
vercel logs [function-name]
```

### Erreurs communes

**1. Timeout cron jobs**
- Augmenter timeout dans vercel.json
- Optimiser requêtes DB

**2. Rate limit OpenAI**
- Implémenter cache
- Gérer backoff exponentiel

**3. Webhook failures**
- Vérifier signatures
- Implémenter retry logic
- Logger tous les webhooks

---

## 📈 MÉTRIQUES À SURVEILLER

### Business
- Nombre conversations/jour
- Taux conversion (conv → commande)
- Revenu moyen par commande
- Note moyenne avis clients

### Technique
- Temps réponse API (<500ms)
- Taux erreur (<1%)
- Uptime (>99.5%)
- Utilisation crédits API

### WhatsApp
- Messages entrants/sortants
- Taux réponse bot
- Temps réponse moyen
- Erreurs Twilio

---

## 🎉 POST-LANCEMENT

### Semaine 1
- Surveiller logs quotidiennement
- Collecter feedbacks utilisateurs
- Corriger bugs critiques
- Ajuster prompts si nécessaire

### Mois 1
- Analyser données complètes
- Optimiser conversions
- Ajouter fonctionnalités demandées
- Planifier améliorations

---

## 🚀 PRÊT POUR LA PRODUCTION !

**Checklist finale:**
✅ Backend testé  
✅ Bot optimisé  
✅ Paiements validés  
✅ Monitoring actif  
✅ Documentation complète  

**Le système GarageConnect est prêt ! 🎊**

---

**Bon lancement ! 🚀**
