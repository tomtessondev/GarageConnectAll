# 🚀 Plan d'Optimisation des Performances

## 📊 État Actuel (Problèmes Identifiés)

### Temps de réponse : **6-11 secondes** ❌

```
📊 Breakdown actuel:
   🗄️  Database:  1.5-2s    (24-31%)
   🤖 AI/GPT-4:   3-5s      (42-54%)
   📱 Messaging:  0ms       (0%)
   ⚙️  Other:     variable
```

---

## 🎯 Objectifs

- **Temps total cible : < 3 secondes** ✅
- Base de données : < 500ms
- GPT-4 : < 2 secondes
- Messaging : < 100ms

---

## 🔧 Solutions d'Optimisation

### 1️⃣ **OPTIMISATION GPT-4** (3-5s → 1.5-2s)

#### A. Réduire la taille du prompt système
**Problème** : Le prompt système est très long (>2000 tokens)
**Impact** : Plus de tokens = temps de traitement plus long

**Solution** :
```typescript
// AVANT (prompt trop verbeux)
"╔══════════════════════════════════════╗
║  CONTEXTE CLIENT ACTUEL
╚══════════════════════════════════════╝
... beaucoup de texte ..."

// APRÈS (prompt condensé)
"CONTEXTE: ${customerName}, ${cartItems.length} articles, ${currentStep}

MISSION: Guide vers achat. Utilise tools. Update progress.

TOOLS: search_tyres, add_to_cart, view_cart, update_progress, etc.

STYLE: Court (2-3 lignes), tutoiement, emojis modérés.

ÉTAPE ${currentStep}: [instructions concises]"
```

**Gain estimé** : -30% de temps GPT-4 (1-1.5s économisés)

#### B. Utiliser GPT-4o-mini pour les réponses simples
**Problème** : GPT-4 est utilisé même pour des réponses basiques
**Solution** : Détecter les intentions simples et utiliser GPT-4o-mini

```typescript
// Détection intention simple
const isSimpleIntent = ['bonjour', 'merci', 'oui', 'non'].includes(message.toLowerCase());

if (isSimpleIntent) {
  // Utiliser GPT-4o-mini (3-5x plus rapide)
  model = 'gpt-4o-mini';
} else {
  // Utiliser GPT-4 pour complexité
  model = 'gpt-4';
}
```

**Gain estimé** : 50% des requêtes utilisent le mini = -40% temps moyen

#### C. Streaming GPT-4 (réponse progressive)
```typescript
// Envoyer la réponse au fur et à mesure
const stream = await openai.chat.completions.create({
  model: 'gpt-4',
  messages: [...],
  stream: true,
});

// Le client voit "Assistant est en train d'écrire..." pendant le streaming
```

**Gain perçu** : L'utilisateur voit une réponse immédiate

---

### 2️⃣ **OPTIMISATION BASE DE DONNÉES** (1.5-2s → 300-500ms)

#### A. Requêtes parallèles déjà en place ✅
```typescript
// DÉJÀ FAIT - GARDER
const [cart, orders] = await Promise.all([
  getCart(customer.id),
  prisma.order.findMany({ ... }),
]);
```

#### B. Ajouter des index manquants
```prisma
model Conversation {
  // ...
  @@index([customerId, status]) // Requête commune
  @@index([phoneNumber, status]) // Pour recherche rapide
}

model Message {
  // ...
  @@index([conversationId, timestamp]) // Historique optimisé
}

model Cart {
  // ...
  @@index([customerId, expiresAt]) // Carts actifs
}
```

**Commande** :
```bash
npx prisma migrate dev --name add_performance_indexes
```

**Gain estimé** : -40% temps DB (600-800ms économisés)

#### C. Caching Redis pour données fréquentes
```typescript
// Cache customer info (5 min)
async function getCachedCustomer(phoneNumber: string) {
  const cacheKey = `customer:${phoneNumber}`;
  const cached = await redis.get(cacheKey);
  
  if (cached) return JSON.parse(cached);
  
  const customer = await prisma.customer.findUnique({ where: { phoneNumber } });
  await redis.setex(cacheKey, 300, JSON.stringify(customer)); // 5 min
  
  return customer;
}

// Cache conversation active (2 min)
async function getCachedConversation(customerId: string) {
  const cacheKey = `conversation:${customerId}`;
  const cached = await redis.get(cacheKey);
  
  if (cached) return JSON.parse(cached);
  
  const conversation = await getOrCreateConversation(...);
  await redis.setex(cacheKey, 120, JSON.stringify(conversation)); // 2 min
  
  return conversation;
}
```

**Gain estimé** : -50% temps DB pour données chaudes (400-600ms)

#### D. Lazy loading du contexte
```typescript
// NE PAS charger les commandes si pas nécessaire
async function buildRichContext(customer, conversation, options = {}) {
  const [cart] = await Promise.all([
    getCart(customer.id),
    // Charger orders SEULEMENT si demandé
    options.includeOrders ? prisma.order.findMany(...) : Promise.resolve([]),
  ]);
  
  // ...
}
```

**Gain estimé** : -30% requêtes inutiles

---

### 3️⃣ **OPTIMISATION ARCHITECTURE** 

#### A. Queue asynchrone pour logs/analytics
```typescript
// Ne PAS attendre l'écriture des logs
await saveMessage(conversation.id, 'user', message); // ❌ Bloquant

// MIEUX : Queue background
messageQueue.add('save-message', { conversationId, message }); // ✅ Non-bloquant
```

#### B. Webhook response immédiate
```typescript
// app/api/whatsapp/webhook/route.ts
export async function POST(req: Request) {
  const body = await req.json();
  
  // Répondre 200 IMMÉDIATEMENT à Twilio
  const response = Response.json({ success: true }, { status: 200 });
  
  // Traiter le message en arrière-plan
  processMessageAsync(body).catch(console.error);
  
  return response;
}
```

**Gain** : Twilio ne timeout plus, meilleure fiabilité

---

### 4️⃣ **OPTIMISATION CONVERSATION**

#### A. Limiter l'historique
```typescript
// AVANT : 10 derniers messages
const history = conversation.messages.slice(-10);

// APRÈS : 5 derniers (suffisant pour contexte)
const history = conversation.messages.slice(-5);
```

**Gain** : -50% tokens historique = -10% temps GPT-4

#### B. Compression du contexte
```typescript
// Au lieu d'envoyer tout le searchResults
context: {
  searchResults: results, // ❌ Peut être énorme (3+ produits complets)
}

// Envoyer uniquement les IDs
context: {
  searchResultIds: results.map(r => r.id), // ✅ Minimal
}

// Recharger depuis DB au besoin
```

---

## 📋 Plan d'Action Prioritaire

### Phase 1 - Quick Wins (1-2 heures) 🔥
1. ✅ Ajouter indexes manquants DB
2. ✅ Réduire historique messages (10 → 5)
3. ✅ Condenser le prompt système
4. ✅ Cache Redis customer + conversation

**Gain attendu : 6-11s → 3-5s**

### Phase 2 - Optimisations Moyennes (2-4 heures)
1. ⚡ Lazy loading contexte
2. ⚡ GPT-4o-mini pour réponses simples
3. ⚡ Queue asynchrone logs
4. ⚡ Webhook response immédiate

**Gain attendu : 3-5s → 2-3s**

### Phase 3 - Optimisations Avancées (4-8 heures)
1. 🚀 Streaming GPT-4
2. 🚀 Compression contexte avancée
3. 🚀 Connection pooling optimisé
4. 🚀 CDN pour assets statiques

**Gain attendu : 2-3s → 1-2s**

---

## 🔍 Monitoring et Mesures

### Métriques à suivre
```typescript
// Ajouter dans performance-monitor.ts
interface PerformanceMetrics {
  totalTime: number;
  dbTime: number;
  aiTime: number;
  cacheHitRate: number; // Nouveau
  messageSizeBytes: number; // Nouveau
}
```

### Dashboard temps réel
```typescript
// Afficher dans les logs
console.log(`
📊 PERFORMANCE:
   Total: ${total}ms
   DB: ${db}ms (${(db/total*100).toFixed(1)}%)
   AI: ${ai}ms (${(ai/total*100).toFixed(1)}%)
   Cache: ${cacheHits}/${totalRequests} (${(cacheHits/totalRequests*100).toFixed(1)}%)
`);
```

---

## ✅ Checklist d'Implémentation

### Immédiat (faire maintenant)
- [ ] Ajouter indexes DB (migration Prisma)
- [ ] Réduire historique à 5 messages
- [ ] Implémenter cache Redis customer
- [ ] Condenser le prompt système

### Court terme (cette semaine)
- [ ] GPT-4o-mini pour intentions simples
- [ ] Lazy loading contexte
- [ ] Queue asynchrone pour logs
- [ ] Webhook response immédiate

### Moyen terme (ce mois)
- [ ] Streaming GPT-4
- [ ] Compression contexte avancée
- [ ] Monitoring avancé
- [ ] Tests de charge

---

## 🎯 Résultat Attendu

**Avant** : 6-11 secondes ❌
**Après Phase 1** : 3-5 secondes ⚡
**Après Phase 2** : 2-3 secondes ⚡⚡
**Après Phase 3** : 1-2 secondes 🚀

**Amélioration totale : -75% du temps de réponse**

---

## 📝 Notes Importantes

1. **Ne pas tout faire d'un coup** - Implémenter phase par phase
2. **Mesurer après chaque changement** - Confirmer les gains
3. **Monitorer en production** - S'assurer de la stabilité
4. **Backup avant migrations** - Toujours avoir un rollback

---

**Prêt à démarrer les optimisations ?**
Commençons par la Phase 1 (Quick Wins) ! 🚀
