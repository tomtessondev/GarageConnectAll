# 13 - GUIDE D'INSTALLATION

[← Retour à l'index](./00_INDEX.md)

---

## 📑 TABLE DES MATIÈRES

1. [Prérequis Système](#1-prérequis-système)
2. [Installation Backend](#2-installation-backend)
3. [Configuration Services Externes](#3-configuration-services-externes)
4. [Variables d'Environnement](#4-variables-denvironnement)
5. [Setup Base de Données](#5-setup-base-de-données)

---

## 1. PRÉREQUIS SYSTÈME

### 1.1 Logiciels Requis

**Node.js & npm**
- Node.js 18+ recommandé
- npm 9+ ou yarn 1.22+
- Installation : https://nodejs.org

**Git**
- Version 2.x+
- Installation : https://git-scm.com

**PostgreSQL Client** (optionnel)
- Pour accéder directement à la DB
- Ou utiliser Prisma Studio

### 1.2 Comptes Services Externes

**Supabase** (Base de données)
- Compte gratuit : https://supabase.com
- Créer un nouveau projet
- Noter l'URL de connexion

**OpenAI** (Bot IA) ⚠️ REQUIS
- Compte : https://platform.openai.com
- Générer API key
- Modèle : GPT-4 Turbo

**Twilio** (WhatsApp) ⚠️ REQUIS
- Compte : https://twilio.com
- WhatsApp Sandbox pour tests
- Production : numéro WhatsApp Business

**Stripe** (Paiements) ⚠️ REQUIS
- Compte : https://stripe.com
- Mode test disponible
- Configurer webhooks

**Vercel** (Hébergement)
- Compte gratuit : https://vercel.com
- Connecter repository Git
- Configuration automatique

---

## 2. INSTALLATION BACKEND

### 2.1 Cloner le Projet

```bash
# Via HTTPS
git clone https://github.com/votre-compte/GarageConnect.git

# Ou via SSH
git clone git@github.com:votre-compte/GarageConnect.git

# Accéder au dossier backend
cd GarageConnect/GarageConnectBackend
```

### 2.2 Installer les Dépendances

```bash
# Avec npm
npm install

# Ou avec yarn
yarn install

# Vérifier l'installation
npm list --depth=0
```

**Dépendances installées :**
- Next.js 16.0.0
- Prisma 6.18.0
- OpenAI 6.9.1
- Twilio 5.10.3
- Stripe 19.1.0
- Et toutes les dépendances listées dans `package.json`

### 2.3 Générer le Client Prisma

```bash
# Génère le client TypeScript pour accéder à la DB
npx prisma generate

# Vérification
ls -la node_modules/.prisma/client
```

---

## 3. CONFIGURATION SERVICES EXTERNES

### 3.1 Supabase (Base de Données)

**Créer le Projet :**
1. Aller sur https://supabase.com
2. Créer un nouveau projet
3. Choisir région (Europe recommandé)
4. Noter le mot de passe DB

**Obtenir l'URL de Connexion :**
1. Aller dans Settings → Database
2. Copier "Connection string"
3. Format : `postgresql://postgres:[PASSWORD]@db.[PROJECT].supabase.co:5432/postgres`

**Connection Pooling (Recommandé) :**
1. Utiliser le Pooler Supabase
2. Connection string avec pooler
3. Format : `postgresql://postgres.[PROJECT]:[PASSWORD]@aws-0-eu-central-1.pooler.supabase.com:5432/postgres`

### 3.2 OpenAI (GPT-4)

**Créer l'API Key :**
1. Aller sur https://platform.openai.com/api-keys
2. Cliquer "Create new secret key"
3. Nommer la clé (ex: "GarageConnect Prod")
4. Copier et sauvegarder immédiatement (ne sera plus visible)
5. Format : `sk-proj-...`

**Vérifier l'Accès GPT-4 :**
- Modèle requis : `gpt-4-turbo-preview`
- Vérifier quota disponible
- Configurer limites de dépense

### 3.3 Twilio WhatsApp

**Mode Sandbox (Tests) :**
1. Créer compte sur https://twilio.com
2. Aller dans Messaging → Try it out → Send a WhatsApp message
3. Suivre instructions pour joindre le sandbox
4. Noter :
   - Account SID : `AC...`
   - Auth Token : `...`
   - WhatsApp From : `whatsapp:+14155238886`

**Mode Production :**
1. Demander accès WhatsApp Business API
2. Soumettre numéro de téléphone
3. Validation par Twilio (2-3 jours)
4. Configuration webhook production

**Configurer le Webhook :**
- URL : `https://votre-domaine.vercel.app/api/whatsapp/webhook`
- Method : POST
- Tester avec le sandbox

### 3.4 Stripe (Paiements)

**Mode Test :**
1. Créer compte sur https://stripe.com
2. Rester en mode Test (toggle en haut)
3. Aller dans Developers → API keys
4. Noter :
   - Publishable key : `pk_test_...` (non utilisé dans backend)
   - Secret key : `sk_test_...` ⚠️ À garder secret

**Configurer les Webhooks :**
1. Aller dans Developers → Webhooks
2. Add endpoint
3. URL : `https://votre-domaine.vercel.app/api/webhook/stripe`
4. Events à écouter :
   - `payment_intent.succeeded`
   - `payment_intent.payment_failed`
   - `charge.succeeded`
5. Noter le Signing secret : `whsec_...`

**Stripe CLI (Développement local) :**
```bash
# Installer
brew install stripe/stripe-cli/stripe

# Login
stripe login

# Forward webhooks vers local
stripe listen --forward-to localhost:3000/api/webhook/stripe

# Dans un autre terminal, tester
stripe trigger payment_intent.succeeded
```

---

## 4. VARIABLES D'ENVIRONNEMENT

### 4.1 Créer le Fichier .env

```bash
# À la racine de GarageConnectBackend
touch .env

# Éditer avec votre éditeur préféré
nano .env
# ou
code .env
```

### 4.2 Configuration Complète

```bash
# ============================================
# DATABASE (Supabase)
# ============================================
DATABASE_URL="postgresql://postgres.[PROJECT]:[PASSWORD]@aws-0-eu-central-1.pooler.supabase.com:5432/postgres"
DIRECT_URL="postgresql://postgres:[PASSWORD]@db.[PROJECT].supabase.co:5432/postgres"

# ============================================
# OPENAI (IA Bot) - REQUIS
# ============================================
OPENAI_API_KEY="sk-proj-..."

# ============================================
# TWILIO WHATSAPP - REQUIS
# ============================================
TWILIO_ACCOUNT_SID="AC..."
TWILIO_AUTH_TOKEN="..."
TWILIO_WHATSAPP_FROM="whatsapp:+14155238886"

# ============================================
# STRIPE PAYMENTS - REQUIS
# ============================================
STRIPE_SECRET_KEY="sk_test_..."
STRIPE_WEBHOOK_SECRET="whsec_..."

# ============================================
# JWT & AUTHENTICATION - REQUIS
# ============================================
# Générer avec: openssl rand -base64 32
JWT_SECRET="votre-secret-jwt-256-bits"

# ============================================
# CRON JOBS SECURITY - REQUIS
# ============================================
# Générer avec: openssl rand -base64 32
CRON_SECRET="votre-secret-cron-256-bits"

# ============================================
# APPLICATION URLS (Optionnel)
# ============================================
NEXT_PUBLIC_APP_URL="http://localhost:3000"
NEXT_PUBLIC_API_URL="http://localhost:3000/api"

# ============================================
# EMAIL (Optionnel - pour notifications)
# ============================================
# Si utilisation de Resend ou autre
# EMAIL_FROM="noreply@garageconnect.gp"
# RESEND_API_KEY="re_..."

# ============================================
# REDIS (Optionnel - pour cache)
# ============================================
# REDIS_URL="redis://..."
```

### 4.3 Générer les Secrets

```bash
# JWT Secret (256 bits)
openssl rand -base64 32

# Exemple de sortie: 8xK2mP9vQ4rT6wY3zN7bL5jH1cF0gD8aE4iU2oM6sX=
# Copier et coller dans JWT_SECRET=

# CRON Secret
openssl rand -base64 32

# Copier dans CRON_SECRET=
```

### 4.4 Vérification .env

```bash
# Vérifier que le fichier existe et n'est pas vide
cat .env | grep -v "^#" | grep -v "^$"

# Compter les variables configurées
cat .env | grep -v "^#" | grep "=" | wc -l
# Devrait afficher au moins 8 (variables requises)
```

**⚠️ Important :**
- Ne JAMAIS committer `.env` dans Git
- Vérifier que `.env` est dans `.gitignore`
- Créer `.env.example` sans les vraies valeurs

---

## 5. SETUP BASE DE DONNÉES

### 5.1 Créer les Tables

```bash
# Push le schema vers la DB (crée toutes les tables)
npx prisma db push

# Sortie attendue:
# ✓ Generated Prisma Client
# ✓ The database is now in sync with your Prisma schema
```

**Tables créées :**
- 17 tables (User, Customer, Product, Order, etc.)
- Relations configurées
- Index appliqués

### 5.2 Vérifier la Création

```bash
# Ouvrir Prisma Studio (interface graphique)
npx prisma studio

# Accessible sur http://localhost:5555
# Vous devriez voir toutes les tables (vides)
```

### 5.3 Seeder les Données de Test

```bash
# Insérer 20 produits de test
npx prisma db seed

# Sortie attendue:
# ✓ Seeding completed
# ✓ 20 products created
```

**Produits créés :**
- 5 marques (Michelin, Continental, etc.)
- 5 dimensions différentes
- 3 catégories (Budget, Standard, Premium)

### 5.4 Créer l'Admin User

**Option A : Via Prisma Studio**
1. Ouvrir : `npx prisma studio`
2. Aller dans table `User`
3. Cliquer "Add record"
4. Remplir :
   ```
   email: admin@garageconnect.gp
   passwordHash: 240be518fabd2724ddb6f04eeb1da5967448d7e831c08c8fa822809f74c720a9
   role: admin
   firstName: Admin
   lastName: GarageConnect
   ```
5. Save

> **Note :** Ce hash correspond au mot de passe `admin123`

**Option B : Via SQL Direct**
```sql
-- Connexion à Supabase SQL Editor
INSERT INTO "users" (
  id, email, password_hash, role, first_name, last_name
) VALUES (
  gen_random_uuid(),
  'admin@garageconnect.gp',
  '240be518fabd2724ddb6f04eeb1da5967448d7e831c08c8fa822809f74c720a9',
  'admin',
  'Admin',
  'GarageConnect'
);
```

### 5.5 Vérification Finale DB

```bash
# Compter les tables
npx prisma studio
# Ouvrir et vérifier 17 tables visibles

# Compter les produits
# Dans Prisma Studio → Product table
# Devrait afficher 20 produits
```

---

## 6. DÉMARRAGE DE L'APPLICATION

### 6.1 Mode Développement

```bash
# Lancer le serveur de développement
npm run dev

# Serveur accessible sur http://localhost:3000
```

**Logs attendus :**
```
▲ Next.js 16.0.0
- Local:        http://localhost:3000
- Network:      http://192.168.1.x:3000

✓ Ready in 2.5s
```

### 6.2 Tester les Endpoints

**Health Check :**
```bash
curl http://localhost:3000/api

# Réponse attendue:
# {"message":"GarageConnect API","version":"1.0.0"}
```

**Test Login Admin :**
```bash
curl -X POST http://localhost:3000/api/admin/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@garageconnect.gp","password":"admin123"}'

# Réponse attendue:
# {"success":true,"user":{...},"token":"eyJhbGc..."}
```

### 6.3 Test WhatsApp (Sandbox)

1. Ouvrir WhatsApp
2. Envoyer message au numéro Twilio sandbox
3. Message : "Bonjour"
4. Attendre réponse du bot

---

## 7. PROBLÈMES COURANTS

### Erreur: "Cannot find module"
```bash
# Solution: Réinstaller
rm -rf node_modules package-lock.json
npm install
npx prisma generate
```

### Erreur: "Database connection failed"
```bash
# Vérifier l'URL dans .env
echo $DATABASE_URL

# Tester la connexion
npx prisma db pull
```

### Erreur: "OpenAI API key invalid"
```bash
# Vérifier la clé
echo $OPENAI_API_KEY

# Doit commencer par sk-proj-
```

### Erreur: Port 3000 déjà utilisé
```bash
# Changer le port
PORT=3001 npm run dev

# Ou tuer le processus
lsof -ti:3000 | xargs kill -9
```

---

## ✅ CHECKLIST INSTALLATION

- [ ] Node.js 18+ installé
- [ ] Projet cloné localement
- [ ] Dépendances npm installées
- [ ] Prisma client généré
- [ ] Compte Supabase créé
- [ ] Compte OpenAI créé et API key obtenue
- [ ] Compte Twilio créé et sandbox configuré
- [ ] Compte Stripe créé en mode test
- [ ] Fichier .env créé et rempli
- [ ] JWT_SECRET et CRON_SECRET générés
- [ ] Base de données pushée (tables créées)
- [ ] Données de test seedées (20 produits)
- [ ] Admin user créé
- [ ] Serveur démarre sans erreur (npm run dev)
- [ ] API health check répond
- [ ] Login admin fonctionne
- [ ] Prisma Studio accessible

**Si tous les items sont cochés : Installation réussie ! 🎉**

---

[← Retour à l'index](./00_INDEX.md) | [Suivant : Déploiement →](./14_DEPLOIEMENT.md)
