# 🚀 GarageConnect - Guide de Démarrage Rapide

**Temps estimé:** 15-20 minutes  
**Prérequis:** Node.js 18+, npm, compte Supabase

---

## ✅ CHECKLIST DÉMARRAGE

- [ ] 1. Cloner le projet
- [ ] 2. Installer dépendances
- [ ] 3. Configurer .env
- [ ] 4. Setup base de données
- [ ] 5. Créer admin user
- [ ] 6. Tester l'API
- [ ] 7. Configurer webhooks (optionnel)

---

## 1️⃣ INSTALLATION

```bash
# Cloner
git clone https://github.com/tomtessondev/GarageConnect.git
cd GarageConnect

# Installer dépendances
npm install

# Générer client Prisma
npx prisma generate
```

---

## 2️⃣ CONFIGURATION .ENV

Créer `.env` à la racine :

```bash
# Database (Supabase)
DATABASE_URL="postgresql://postgres.[project-id]:[password]@aws-0-eu-central-1.pooler.supabase.com:5432/postgres"

# OpenAI (REQUIS pour bot)
OPENAI_API_KEY="sk-proj-..."
# Obtenir sur: https://platform.openai.com/api-keys

# Twilio WhatsApp (REQUIS pour bot)
TWILIO_ACCOUNT_SID="AC..."
TWILIO_AUTH_TOKEN="..."
TWILIO_WHATSAPP_FROM="whatsapp:+14155238886"
# Obtenir sur: https://console.twilio.com

# Stripe (REQUIS pour paiements)
STRIPE_SECRET_KEY="sk_test_..."
STRIPE_WEBHOOK_SECRET="whsec_..."
# Obtenir sur: https://dashboard.stripe.com/test/apikeys

# JWT & Cron (REQUIS)
JWT_SECRET="$(openssl rand -base64 32)"
CRON_SECRET="$(openssl rand -base64 32)"

# Optionnel
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

---

## 3️⃣ SETUP BASE DE DONNÉES

```bash
# Créer tables dans Supabase
npx prisma db push

# Seeder données de test (20 produits)
npx prisma db seed

# Vérifier avec Prisma Studio
npx prisma studio
# Ouvre http://localhost:5555
```

---

## 4️⃣ CRÉER ADMIN USER

### Option A: Via Prisma Studio

1. Ouvrir Prisma Studio: `npx prisma studio`
2. Aller dans table `User`
3. Créer nouveau user:
```
email: admin@garageconnect.gp
passwordHash: 240be518fabd2724ddb6f04eeb1da5967448d7e831c08c8fa822809f74c720a9
role: admin
firstName: Admin
lastName: GarageConnect
phoneNumber: +590690123456
country: Guadeloupe
```

> **Note:** Ce hash correspond au mot de passe `admin123`

### Option B: Via SQL

```sql
INSERT INTO "User" (
  id, email, "passwordHash", role, 
  "firstName", "lastName", "phoneNumber", country
) VALUES (
  gen_random_uuid(),
  'admin@garageconnect.gp',
  '240be518fabd2724ddb6f04eeb1da5967448d7e831c08c8fa822809f74c720a9',
  'admin',
  'Admin',
  'GarageConnect',
  '+590690123456',
  'Guadeloupe'
);
```

---

## 5️⃣ DÉMARRER LE SERVEUR

```bash
# Mode développement
npm run dev

# Ouvre http://localhost:3000
```

---

## 6️⃣ TESTER L'API

### Test 1: Health Check

```bash
curl http://localhost:3000/api
```

**Réponse attendue:**
```json
{
  "message": "GarageConnect API",
  "version": "1.0.0"
}
```

### Test 2: Login Admin

```bash
curl -X POST http://localhost:3000/api/admin/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@garageconnect.gp",
    "password": "admin123"
  }'
```

**Réponse attendue:**
```json
{
  "success": true,
  "user": {
    "id": "...",
    "email": "admin@garageconnect.gp",
    "role": "admin"
  },
  "token": "eyJhbGc...",
  "refreshToken": "eyJhbGc..."
}
```

### Test 3: Bot Configuration (avec token)

```bash
# Remplacer YOUR_TOKEN par le token reçu du login
curl http://localhost:3000/api/admin/bot-config \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Réponse attendue:**
```json
{
  "id": "...",
  "name": "Configuration par défaut",
  "systemPrompt": "...",
  "isActive": true
}
```

---

## 7️⃣ CONFIGURATION WEBHOOKS (Optionnel pour tests)

### WhatsApp (Twilio)

1. Aller sur https://console.twilio.com/us1/develop/sms/try-it-out/whatsapp-learn
2. Configurer webhook:
   - **URL:** `https://votre-domaine.vercel.app/api/whatsapp/webhook`
   - **Method:** POST

### Pour tests locaux (ngrok)

```bash
# Terminal 1: Lancer serveur
npm run dev

# Terminal 2: Exposer avec ngrok
ngrok http 3000

# Utiliser l'URL ngrok dans Twilio
```

### Stripe Webhooks

1. Installer Stripe CLI:
```bash
brew install stripe/stripe-cli/stripe
```

2. Login:
```bash
stripe login
```

3. Forward webhooks:
```bash
stripe listen --forward-to localhost:3000/api/webhook/stripe
```

4. Dans nouvel onglet, trigger test:
```bash
stripe trigger payment_intent.succeeded
```

---

## 🧪 TESTS RAPIDES

### Test Bot WhatsApp (Sandbox)

1. Envoyer WhatsApp à votre numéro Twilio
2. Message: `Bonjour`
3. Attendre réponse bot
4. Tester: `Je cherche pneus 205/55R16`

### Test Recherche Pneus

```bash
curl http://localhost:3000/api/search-tyres?width=205&height=55&diameter=16
```

### Test Cron Jobs

```bash
# Nettoyage paniers
curl http://localhost:3000/api/cron/clean-expired-carts \
  -H "Authorization: Bearer ${CRON_SECRET}"

# Demande avis
curl http://localhost:3000/api/cron/request-reviews \
  -H "Authorization: Bearer ${CRON_SECRET}"
```

---

## 🐛 TROUBLESHOOTING

### Erreur: "Cannot find module 'X'"

```bash
npm install
npx prisma generate
```

### Erreur: "Database connection failed"

1. Vérifier `DATABASE_URL` dans `.env`
2. Tester connexion:
```bash
npx prisma db pull
```

### Erreur: "OpenAI API key invalid"

1. Vérifier clé sur https://platform.openai.com/api-keys
2. S'assurer qu'elle commence par `sk-proj-`

### Erreur: "JWT verification failed"

1. Régénérer `JWT_SECRET`:
```bash
openssl rand -base64 32
```
2. Redémarrer serveur

### Bot ne répond pas sur WhatsApp

1. Vérifier webhook configuré dans Twilio
2. Vérifier logs Vercel/console
3. Tester webhook:
```bash
curl -X POST http://localhost:3000/api/whatsapp/webhook \
  -d "From=whatsapp:+590690123456&Body=Bonjour"
```

---

## 📊 VÉRIFIER QUE TOUT FONCTIONNE

### Checklist Backend

- [ ] ✅ Serveur démarre sans erreur
- [ ] ✅ Login admin fonctionne
- [ ] ✅ Prisma Studio accessible
- [ ] ✅ 20 produits visibles dans DB
- [ ] ✅ Bot config récupérable via API

### Checklist Bot WhatsApp

- [ ] ✅ Webhook configuré
- [ ] ✅ Bot répond "Bonjour"
- [ ] ✅ Recherche pneus fonctionne
- [ ] ✅ Ajout panier fonctionne

### Checklist Paiements

- [ ] ✅ Stripe configuré
- [ ] ✅ Webhook Stripe actif
- [ ] ✅ Test paiement réussit

---

## 🚀 DÉPLOIEMENT VERCEL

```bash
# Installer Vercel CLI
npm i -g vercel

# Deploy
vercel

# Configure variables env dans dashboard
# https://vercel.com/[username]/garageconnect/settings/environment-variables

# Deploy production
vercel --prod
```

---

## 📚 PROCHAINES ÉTAPES

Après installation réussie:

1. **Tester parcours complet** - WhatsApp → Recherche → Achat → Paiement
2. **Lire documentation** - `PROJECT_SUMMARY.md`
3. **Personnaliser bot** - Modifier prompts via API
4. **Créer app Flutter** - Pour interface admin
5. **Ajouter produits** - Via Prisma Studio ou API

---

## 🆘 BESOIN D'AIDE ?

### Documentation
- `PROJECT_SUMMARY.md` - Vue d'ensemble
- `IMPLEMENTATION_PLAN.md` - Plan complet
- `PHASE_2A_COMPLETE.md` - Détails bot IA
- `DATABASE_SCHEMA.md` - Structure DB

### Ressources externes
- **Prisma:** https://www.prisma.io/docs
- **Next.js:** https://nextjs.org/docs
- **OpenAI:** https://platform.openai.com/docs
- **Twilio:** https://www.twilio.com/docs/whatsapp
- **Stripe:** https://stripe.com/docs

---

## 🎉 FÉLICITATIONS !

Si tous les tests passent, votre installation est **complète** !

Le système GarageConnect est **opérationnel** et prêt pour le développement ou les tests utilisateurs.

**Bon développement ! 🚀**
