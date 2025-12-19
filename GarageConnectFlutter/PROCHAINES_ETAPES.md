# 🚀 Prochaines Étapes - Configuration Backend API

## 📊 Situation Actuelle

✅ **Application Flutter** : Complète et fonctionnelle  
⚠️ **Backend API** : Endpoints non créés dans le projet Next.js

## 🔍 Diagnostic

L'erreur 404 sur `/api/admin/auth/login` est normale car :
- Votre backend Next.js actuel n'a **pas encore d'endpoints API créés**
- Le dossier `app/api/` est vide ou n'existe pas
- L'application Flutter essaie d'appeler des endpoints qui n'existent pas encore

## ✅ Solution : Créer les Endpoints Backend

### Option 1 : Backend Minimal pour Tester Flutter

Créez ces fichiers dans votre projet Next.js :

#### 1. Endpoint de Test
`app/api/test/route.ts`
```typescript
export async function GET() {
  return Response.json({ 
    message: 'Backend Next.js fonctionne !',
    timestamp: new Date().toISOString()
  });
}
```

#### 2. Endpoint de Connexion (Mock)
`app/api/auth/login/route.ts`
```typescript
import { NextRequest } from 'next/server';

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { email, password } = body;

  // Mock simple pour tester
  if (email === 'admin@garageconnect.gp' && password === 'admin123') {
    return Response.json({
      success: true,
      token: 'mock-jwt-token-12345',
      user: {
        id: '1',
        email: email,
        name: 'Administrateur',
        role: 'admin'
      }
    });
  }

  return Response.json(
    { success: false, message: 'Identifiants incorrects' },
    { status: 401 }
  );
}
```

#### 3. Endpoint Dashboard Stats (Mock)
`app/api/admin/dashboard/stats/route.ts`
```typescript
export async function GET() {
  return Response.json({
    pendingOrders: 5,
    completedOrders: 23,
    totalRevenue: 4567.89,
    activeServices: 8
  });
}
```

#### 4. Endpoint Orders (Mock)
`app/api/admin/orders/route.ts`
```typescript
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const status = searchParams.get('status');

  const mockOrders = [
    {
      id: 'ord-001',
      customer_name: 'Jean Dupont',
      status: 'pending',
      total_price: 129.99,
      created_at: new Date().toISOString(),
    },
    {
      id: 'ord-002',
      customer_name: 'Marie Martin',
      status: 'in_progress',
      total_price: 89.50,
      created_at: new Date(Date.now() - 3600000).toISOString(),
    }
  ];

  return Response.json({
    orders: status 
      ? mockOrders.filter(o => o.status === status)
      : mockOrders
  });
}
```

#### 5. Endpoint Services (Mock)
`app/api/admin/services/route.ts`
```typescript
export async function GET() {
  return Response.json({
    services: [
      {
        id: 'srv-001',
        name: 'Changement Pneus',
        description: 'Remplacement des 4 pneus',
        price: 120.00,
        is_active: true
      },
      {
        id: 'srv-002',
        name: 'Vidange',
        description: 'Vidange moteur complète',
        price: 45.00,
        is_active: true
      }
    ]
  });
}
```

### Option 2 : Utiliser GarageConnectBackend (Node.js)

Si vous préférez utiliser le backend Node.js que nous avons créé :

1. **Lancez GarageConnectBackend** :
```bash
cd GarageConnectBackend
npm install
npm run dev
# Backend sur http://localhost:3001
```

2. **Modifiez l'URL dans Flutter** :
```dart
// lib/core/config/environment.dart
static const String developmentUrl = 'http://192.168.1.221:3001';
```

3. **Note** : Les endpoints du backend Node.js sont déjà créés et documentés

## 🔧 Mettre à Jour l'ApiService Flutter

Une fois les endpoints créés, vérifiez que l'ApiService utilise les bons chemins :

### Si vous utilisez Next.js avec les endpoints ci-dessus :

```dart
// Modifier dans lib/core/services/api_service.dart

// Connexion
final response = await _dio.post(
  '/api/auth/login',  // ⬅️ Pas /api/admin/auth/login
  data: {'email': email, 'password': password},
);
```

### Si vous utilisez GarageConnectBackend (Node.js) :

Les chemins actuels sont déjà corrects :
```dart
'/api/admin/auth/login'
'/api/admin/dashboard/stats'
'/api/admin/orders'
// etc.
```

## 🧪 Tester la Connexion

### 1. Tester l'endpoint de test
```bash
curl http://192.168.1.221:3000/api/test
```

Devrait retourner :
```json
{
  "message": "Backend Next.js fonctionne !",
  "timestamp": "2025-11-30T..."
}
```

### 2. Tester la connexion
```bash
curl -X POST http://192.168.1.221:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@garageconnect.gp","password":"admin123"}'
```

Devrait retourner :
```json
{
  "success": true,
  "token": "mock-jwt-token-12345",
  "user": {...}
}
```

### 3. Lancer l'app Flutter
```bash
cd GarageConnectFlutter
flutter run
```

Essayez de vous connecter avec :
- **Email** : `admin@garageconnect.gp`
- **Password** : `admin123`

## 📚 Structure Complète Recommandée

```
votre-projet/
├── app/
│   └── api/
│       ├── test/
│       │   └── route.ts              ✅ Test de connexion
│       ├── auth/
│       │   └── login/
│       │       └── route.ts          ✅ Connexion
│       └── admin/
│           ├── dashboard/
│           │   └── stats/
│           │       └── route.ts      ✅ Statistiques
│           ├── orders/
│           │   ├── route.ts          ✅ Liste commandes
│           │   └── [id]/
│           │       └── status/
│           │           └── route.ts  ✅ Maj statut
│           └── services/
│               ├── route.ts          ✅ Liste services
│               └── [id]/
│                   └── status/
│                       └── route.ts  ✅ Maj service
└── GarageConnectFlutter/
    └── ...                           ✅ App mobile complète
```

## 🎯 Checklist de Démarrage

- [ ] Choisir backend : Next.js (nouveau) ou Node.js (existant)
- [ ] Créer les endpoints API nécessaires
- [ ] Tester chaque endpoint avec curl
- [ ] Mettre à jour l'URL dans `environment.dart`
- [ ] Ajuster les chemins dans `api_service.dart` si nécessaire
- [ ] Lancer l'app Flutter et tester la connexion
- [ ] Vérifier les logs Dio dans le terminal Flutter

## 💡 Conseil

**Commencez simple** :
1. Créez d'abord `/api/test/route.ts`
2. Testez qu'il fonctionne
3. Créez `/api/auth/login/route.ts`
4. Testez la connexion Flutter
5. Ajoutez les autres endpoints progressivement

## 🆘 Besoin d'Aide ?

Consultez :
- `CONNEXION_API_DEBUG.md` - Guide de débogage détaillé
- `IMPLEMENTATION_GUIDE.md` - Guide d'implémentation Flutter
- `PROJET_FINAL_RECAP.md` - Récapitulatif complet du projet

---

**Prochaine Action** : Créer les endpoints backend ou lancer GarageConnectBackend Node.js
