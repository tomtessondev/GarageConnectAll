# 🔍 Guide de Débogage - Connexion API

## 🚨 Erreur 404 sur `/api/admin/auth/login`

Cette erreur signifie que l'endpoint n'existe pas sur votre backend.

### ✅ Solutions

#### 1. Vérifier les Endpoints Disponibles

Sur votre backend Next.js, vérifiez quel endpoint d'authentification existe :

```bash
# Dans votre dossier backend
ls app/api/
```

Cherchez un fichier comme :
- `app/api/auth/route.ts`
- `app/api/login/route.ts`
- `app/api/admin/login/route.ts`

#### 2. Tester l'Endpoint avec curl

```bash
# Test depuis votre terminal
curl -X POST http://192.168.1.221:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@garageconnect.gp","password":"test123"}'
```

Remplacez `/api/auth/login` par le bon chemin trouvé à l'étape 1.

#### 3. Mettre à Jour l'ApiService

Une fois le bon endpoint trouvé, modifiez `lib/core/services/api_service.dart` :

```dart
// Auth
Future<Map<String, dynamic>> login(String email, String password) async {
  try {
    final response = await _dio.post(
      '/api/auth/login',  // ⬅️ Mettez le bon chemin ici
      data: {'email': email, 'password': password},
    );
    // ...
  }
}
```

## 🔄 Changer d'Environnement

### En Développement Local

Modifiez `lib/core/config/environment.dart` :

```dart
// Pour iOS Simulator
static const String developmentUrl = 'http://localhost:3000';

// Pour Android Emulator
static const String developmentUrl = 'http://10.0.2.2:3000';

// Pour Appareil Physique (utilisez l'IP de votre Mac)
static const String developmentUrl = 'http://192.168.1.221:3000';
```

### En Production (Vercel)

```dart
static const EnvironmentType currentEnvironment = EnvironmentType.production;
static const String productionUrl = 'https://votre-app.vercel.app';
```

## 📱 Tester la Connexion

### 1. Vérifier que le Backend est Accessible

```bash
# Depuis votre Mac
curl http://192.168.1.221:3000/api/health

# Ou testez simplement dans le navigateur
open http://192.168.1.221:3000
```

### 2. Vérifier les Logs Flutter

Dans votre terminal Flutter, vous devriez voir les logs de requête :

```
[DIO] ╔ Request ║ POST
[DIO] ║ http://192.168.1.221:3000/api/auth/login
[DIO] ║ Headers: {...}
[DIO] ║ Body: {"email":"...","password":"..."}
[DIO] ╚ Response ║ 404 Not Found
```

### 3. Créer un Endpoint de Test

Sur votre backend Next.js, créez `app/api/test/route.ts` :

```typescript
export async function GET() {
  return Response.json({ 
    message: 'Backend accessible',
    timestamp: new Date().toISOString()
  });
}
```

Puis testez :
```bash
curl http://192.168.1.221:3000/api/test
```

## 🔐 Endpoints Typiques Backend

Vérifiez si votre backend a ces routes :

### Pour GarageConnect Next.js
```
POST /api/auth/login          → Connexion utilisateur
GET  /api/orders              → Liste des commandes  
GET  /api/services            → Liste des services
```

### Pour GarageConnectBackend Node.js
```
POST /api/admin/auth/login         → Connexion admin
GET  /api/admin/dashboard/stats    → Statistiques
GET  /api/admin/orders             → Commandes
```

## 🛠️ Commandes Utiles

```bash
# Voir les logs réseau de l'app
flutter run --verbose

# Nettoyer et rebuild
flutter clean && flutter pub get && flutter run

# Voir les requêtes HTTP en temps réel
# (Les logs Dio s'afficheront automatiquement en mode dev)
```

## 📝 Checklist de Vérification

- [ ] Backend Next.js est lancé (`npm run dev`)
- [ ] L'URL dans `environment.dart` est correcte
- [ ] L'IP `192.168.1.221` est bien celle de votre Mac
- [ ] Le firewall ne bloque pas le port 3000
- [ ] Le bon endpoint existe dans `app/api/`
- [ ] L'endpoint accepte les requêtes POST avec email/password
- [ ] Les logs Dio montrent la bonne URL appelée

## 🆘 Aide Rapide

**Erreur "Connection refused"**
→ Le backend n'est pas lancé ou l'IP est incorrecte

**Erreur 404**
→ L'endpoint n'existe pas, vérifiez le chemin

**Erreur 401/403**
→ Le backend fonctionne mais refuse la connexion (vérifier credentials)

**Pas de réponse**
→ Timeout, vérifiez le réseau et le firewall

## 💡 Astuce

Pour trouver votre IP Mac rapidement :
```bash
ifconfig | grep "inet " | grep -v 127.0.0.1
```

Utilisez cette IP dans `environment.dart` si vous testez sur un appareil physique.
