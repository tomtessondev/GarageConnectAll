# 🚀 PLAN D'OPTIMISATION PERFORMANCES

## 📊 ANALYSE DES GOULOTS D'ÉTRANGLEMENT

### Temps de Réponse Actuels
```
Message simple:     6-8s   ⚠️
Message avec tool: 11-15s  🚨
Create order:      27s     🔥 TRÈS LENT
```

### Breakdown Détaillé
```
📋 PERFORMANCE SUMMARY (Message simple)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🗄️  Database:  2.5s (30%)  🚨 PROBLÈME
   - db_customer: 1.4-1.7s  ← TRÈS LENT
   - db_context:  1.0-1.1s  ← LENT
   
🤖 AI/GPT-4:   3.5s (40%)  ⚠️
   - ai_gpt4:     1.5-3.5s
   - ai_gpt4_final: 6.7s (create_order)

⚙️  Tools:      12s (create_order) 🔥
   - Création commande + Stripe très lent
```

---

## 🎯 OBJECTIFS CIBLES

| Type Message | Actuel | Cible | Amélioration |
|--------------|--------|-------|--------------|
| Simple       | 6-8s   | **2-3s** | -60% |
| Avec tool    | 11-15s | **4-6s** | -60% |
| Create order | 27s    | **8-10s** | -65% |

---

## 🔧 OPTIMISATIONS À IMPLÉMENTER

### 1. DATABASE (🚨 PRIORITÉ 1)

#### Problème Identifié
```javascript
// ACTUEL - CHARGEMENTS INUTILES
db_customer: 1695ms  // getOrCreateCustomer()
db_context:  1058ms  // buildRichContext() avec cart + orders

// Requêtes répétitives à chaque message !
```

#### Solutions

**A. Réduire Chargements Inutiles**
```typescript
// ❌ AVANT - Charge TOUT
const customer = await prisma.customer.findUnique({
  where: { phoneNumber },
});

// ✅ APRÈS - Select spécifique
const customer = await prisma.customer.findUnique({
  where: { phoneNumber },
  select: {
    id: true,
    phoneNumber: true,
    firstName: true,
    lastName: true,
    // Ne charge PAS les relations inutiles
  }
});
```

**B. Cache Customer (In-Memory)**
```typescript
// Cache simple en mémoire (expire 5 min)
const customerCache = new Map<string, {customer: any, expires: number}>();

function getCachedCustomer(phoneNumber: string) {
  const cached = customerCache.get(phoneNumber);
  if (cached && cached.expires > Date.now()) {
    return cached.customer; // 🚀 0ms au lieu de 1700ms !
  }
  return null;
}
```

**C. Optimiser buildRichContext**
```typescript
// ❌ AVANT - Charge cart + orders à chaque fois
const [cart, orders] = await Promise.all([
  getCart(customer.id),        // 500ms
  prisma.order.findMany({...}) // 500ms
]);

// ✅ APRÈS - Lazy loading + cache
// Ne charger que si nécessaire pour l'étape actuelle
if (currentStep === 'cart' || currentStep === 'checkout') {
  cart = await getCachedCart(customer.id); // Cache 30s
}
```

**Gain estimé : -1.5s → Passe de 2.5s à 1s**

---

### 2. AI/GPT-4 (⚠️ PRIORITÉ 2)

#### Problème
```javascript
// Messages simples utilisent encore GPT-4
ai_gpt4: 3461ms  // Pour "tom_tesson@hotmail.com" (1 mot!)
```

#### Solutions

**A. GPT-4o-mini Plus Agressif**
```typescript
// ❌ AVANT - Seulement messages ≤3 mots
const isSimpleMessage = wordCount <= 3;

// ✅ APRÈS - Messages ≤10 mots OU patterns connus
const isSimpleMessage = 
  wordCount <= 10 || 
  message.match(/^[a-z0-9@.\s]+$/i) || // Email/adresse
  message.match(/^\d+$/); // Nombre seul

// GPT-4o-mini = 3-5x plus rapide que GPT-4
```

**B. Réduire Taille Système Prompt**
```typescript
// ❌ AVANT - Prompt de 500+ tokens
`AGENT PNEUS - GarageConnect...
TOOLS: search_tyres, add_to_cart...
REGLES CRITIQUES:
1. ...
2. ...
[Beaucoup de texte]`

// ✅ APRÈS - Prompt adaptatif selon étape
function getMinimalPrompt(step: SalesStep) {
  // Seulement les règles pertinentes pour l'étape
  if (step === 'search') return searchPrompt;      // 150 tokens
  if (step === 'cart') return cartPrompt;          // 100 tokens
  // etc...
}

// Réduction tokens = réponse plus rapide
```

**C. Cache Réponses Fréquentes**
```typescript
// Questions fréquentes → Cache Redis
const FAQ_CACHE = {
  'comment ça marche': RESPONSE_TUTORIAL,
  'règles': RESPONSE_RULES,
  'voir mon panier': () => view_cart(), // + cache 10s
  // etc...
};
```

**Gain estimé : -2s → Passe de 3.5s à 1.5s**

---

### 3. CREATE ORDER (🔥 PRIORITÉ 3)

#### Problème
```javascript
tools_execution: 11929ms  // Création commande + Stripe
ai_gpt4_final:   6731ms   // Formatage réponse
TOTAL:           27s      🔥
```

#### Solutions

**A. Paralléliser Opérations**
```typescript
// ❌ AVANT - Séquentiel
await updateCustomer();     // 200ms
const order = await createOrder();    // 500ms
const { paymentUrl } = await createPaymentIntent(); // 1500ms
const message = formatConfirmation(); // 200ms

// ✅ APRÈS - Parallèle quand possible
const [order, _] = await Promise.all([
  createOrder(),
  updateCustomer(), // En parallèle !
]);

const { paymentUrl } = await createPaymentIntent(order.id);
```

**B. Optimiser Stripe**
```typescript
// ❌ AVANT - Attente synchrone
const paymentIntent = await stripe.paymentIntents.create({...});
const paymentUrl = paymentIntent.payment_method_options?.link?.url;

// ✅ APRÈS - Mode async si possible
// Ou générer URL côté client (Stripe Elements)
```

**C. Réduire Final GPT Call**
```typescript
// ❌ AVANT - GPT-4 reformate tout
ai_gpt4_final: 6731ms

// ✅ APRÈS - Template prédéfini
const confirmationMessage = `
✅ Commande ${order.orderNumber} créée !

💳 PAIEMENT SÉCURISÉ
${paymentUrl}

🔒 Nous ne demanderons JAMAIS vos données bancaires via WhatsApp
`;
// Pas besoin de GPT-4 → 0ms !
```

**Gain estimé : -15s → Passe de 27s à 12s**

---

### 4. ARCHITECTURE GÉNÉRALE (🎯 PRIORITÉ 4)

#### A. Redis Cache
```typescript
// Cache distribué pour:
- Customer data (TTL: 5min)
- Cart data (TTL: 30s)
- Search results (TTL: 1h)
- FAQ responses (TTL: 24h)
```

#### B. Lazy Loading Messages
```typescript
// ❌ AVANT - Charge 3 derniers messages
messages: {
  orderBy: { timestamp: 'desc' },
  take: 3,
}

// ✅ APRÈS - Ne charge que si conversation > 1 message
if (conversation.messageCount > 1) {
  messages = await getLastMessages(3);
}
```

#### C. Connection Pooling
```typescript
// Vérifier pool Prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
  // Ajouter connection_limit si nécessaire
}
```

---

## 📈 GAINS ESTIMÉS

### Résumé des Améliorations

| Composant | Actuel | Optimisé | Gain |
|-----------|--------|----------|------|
| Database  | 2.5s   | **1.0s** | -60% |
| AI/GPT    | 3.5s   | **1.5s** | -57% |
| Tools     | 12s    | **7s**   | -42% |
| **TOTAL** | **18s** | **9.5s** | **-47%** |

### Nouveaux Temps Cibles

```
✅ Message simple:     2-3s   (vs 6-8s)   -60%
✅ Message avec tool:  4-6s   (vs 11-15s) -60%
✅ Create order:       10-12s (vs 27s)    -60%
```

---

## 🚀 PLAN D'IMPLÉMENTATION

### Phase 1 : Quick Wins (30 min)
- ✅ Cache customer in-memory
- ✅ GPT-4o-mini plus agressif (≤10 mots)
- ✅ Select spécifique DB queries

### Phase 2 : Optimisations DB (1h)
- ✅ Lazy load messages
- ✅ Cache cart data
- ✅ Optimiser buildRichContext

### Phase 3 : Optimisations AI (1h)
- ✅ Prompts adaptatifs par étape
- ✅ Cache réponses fréquentes
- ✅ Templates prédéfinis

### Phase 4 : Create Order (1h)
- ✅ Paralléliser opérations
- ✅ Template confirmation (sans GPT final)
- ✅ Optimiser Stripe calls

### Phase 5 : Redis Cache (2h)
- ✅ Setup Redis
- ✅ Cache customer/cart/search
- ✅ Invalidation stratégique

---

## 📊 MESURES DE SUCCÈS

### KPIs à Suivre
```typescript
// Performance Monitor amélioré
✅ P50 (médiane): < 5s
✅ P95: < 10s
✅ P99: < 15s

// By type
✅ Simple messages: < 3s (P95)
✅ Tool calls: < 6s (P95)
✅ Create order: < 12s (P95)
```

---

## 🎯 PROCHAINES ÉTAPES

Voulez-vous que je commence par :

1. **Phase 1 - Quick Wins** (30 min, -30% temps) ⚡
   - Cache in-memory
   - GPT-4o-mini agressif
   - Select DB optimisé

2. **Phase 2 - DB Optimizations** (1h, -40% temps) 🗄️
   - Lazy loading
   - Cache cart
   - Optimiser queries

3. **Phase 3 - Create Order** (1h, -50% create_order) 🔥
   - Parallélisation
   - Templates
   - Optimiser Stripe

Quelle phase voulez-vous implémenter en premier ?
