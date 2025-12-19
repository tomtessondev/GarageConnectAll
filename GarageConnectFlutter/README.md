# 📱 GarageConnect Flutter - App Admin Mobile

Application mobile Flutter pour gérer le système GarageConnect.

---

## 🎯 FONCTIONNALITÉS

- ✅ Authentification JWT
- ✅ Dashboard avec statistiques temps réel
- ✅ Gestion configuration bot WhatsApp
- ✅ Consultation conversations clients
- ✅ Gestion avis clients
- ✅ Suivi commandes

---

## 📋 PRÉREQUIS

### Installation Flutter

1. **Télécharger Flutter SDK**
   - macOS: https://docs.flutter.dev/get-started/install/macos
   - Windows: https://docs.flutter.dev/get-started/install/windows
   - Linux: https://docs.flutter.dev/get-started/install/linux

2. **Vérifier installation**
```bash
flutter doctor
```

3. **Installer dépendances système**
```bash
# macOS
brew install --cask android-studio
xcode-select --install

# Linux
sudo apt-get install android-studio
```

---

## 🚀 INSTALLATION

### 1. Cloner et setup

```bash
cd GarageConnectFlutter

# Installer dépendances
flutter pub get

# Vérifier que tout est ok
flutter doctor
```

### 2. Configuration API

Modifier `lib/core/services/api_service.dart`:

```dart
static const String baseUrl = 'https://VOTRE-DOMAINE.vercel.app';
```

Ou utiliser localhost pour développement:
```dart
static const String baseUrl = 'http://10.0.2.2:3000'; // Android emulator
static const String baseUrl = 'http://localhost:3000'; // iOS simulator
```

### 3. Lancer l'application

```bash
# Android
flutter run -d android

# iOS (macOS uniquement)
flutter run -d ios

# Web
flutter run -d chrome
```

---

## 📁 STRUCTURE DU PROJET

```
GarageConnectFlutter/
├── lib/
│   ├── main.dart                          # Point d'entrée
│   ├── core/
│   │   └── services/
│   │       └── api_service.dart          # Client API REST
│   └── presentation/
│       └── screens/
│           └── splash_screen.dart        # Écran de chargement
│
├── pubspec.yaml                          # Dépendances
├── analysis_options.yaml                 # Configuration linter
└── README.md                             # Ce fichier
```

---

## 🔧 DÉVELOPPEMENT

### Ajouter un écran

1. Créer dans `lib/presentation/screens/`:
```dart
// lib/presentation/screens/login_screen.dart
import 'package:flutter/material.dart';

class LoginScreen extends StatelessWidget {
  const LoginScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Login')),
      body: Center(child: Text('Login Screen')),
    );
  }
}
```

2. Ajouter à la navigation dans `main.dart`

### Tests

```bash
# Tests unitaires
flutter test

# Tests intégration
flutter test integration_test/

# Analyse code
flutter analyze
```

---

## 📦 BUILD PRODUCTION

### Android APK

```bash
# Debug
flutter build apk --debug

# Release
flutter build apk --release

# APK se trouve dans: build/app/outputs/flutter-apk/app-release.apk
```

### iOS (macOS uniquement)

```bash
# Release
flutter build ios --release

# Ouvrir Xcode pour signing & distribution
open ios/Runner.xcworkspace
```

### Web

```bash
flutter build web

# Déployer le contenu de build/web/
```

---

## 🔐 SÉCURITÉ

### Token JWT

Le token est stocké localement avec `shared_preferences`:
- Automatiquement ajouté aux requêtes API
- Effacé à la déconnexion
- Invalidé si 401 reçu

### Bonnes pratiques

1. Utiliser HTTPS en production
2. Ne jamais commit de tokens
3. Configurer ProGuard (Android)
4. Activer bitcode (iOS)

---

## 🎨 PERSONNALISATION

### Thème

Modifier dans `lib/main.dart`:

```dart
theme: ThemeData(
  colorScheme: ColorScheme.fromSeed(
    seedColor: Colors.blue,  // Couleur principale
  ),
  textTheme: GoogleFonts.poppinsTextTheme(),
),
```

### Logo

1. Ajouter logo dans `assets/images/logo.png`
2. Décommenter dans `pubspec.yaml`:
```yaml
flutter:
  assets:
    - assets/images/
```

---

## 📊 DÉPENDANCES PRINCIPALES

- **flutter_bloc** - Gestion d'état
- **dio** - Client HTTP
- **shared_preferences** - Storage local
- **google_fonts** - Polices Google
- **fl_chart** - Graphiques

---

## 🐛 TROUBLESHOOTING

### Erreur: "Flutter SDK not found"
```bash
# Ajouter Flutter au PATH
export PATH="$PATH:/path/to/flutter/bin"
```

### Erreur: "Android licenses not accepted"
```bash
flutter doctor --android-licenses
```

### Erreur: "CocoaPods not installed" (iOS)
```bash
sudo gem install cocoapods
cd ios && pod install
```

### Erreur de build
```bash
# Nettoyer et rebuild
flutter clean
flutter pub get
flutter run
```

---

## 📝 PROCHAINES ÉTAPES

### Écrans à créer (voir PHASE_4_FLUTTER_GUIDE.md dans Backend)

1. **Login** - Authentification admin
2. **Dashboard** - Stats et aperçu
3. **Bot Config** - Configuration prompts
4. **Conversations** - Liste conversations
5. **Reviews** - Gestion avis
6. **Orders** - Suivi commandes

**Le code complet de chaque écran est dans:**
`GarageConnectBackend/PHASE_4_FLUTTER_GUIDE.md`

---

## 🚀 ROADMAP

### v1.0.0 - MVP (Semaine 1-2)
- [x] Structure projet
- [x] ApiService
- [x] Splash screen
- [ ] Login screen
- [ ] Dashboard
- [ ] Bot config

### v1.1.0 - Fonctionnalités complètes (Semaine 3)
- [ ] Conversations
- [ ] Reviews management
- [ ] Orders tracking
- [ ] Push notifications

### v2.0.0 - Avancé (Future)
- [ ] Mode offline
- [ ] Analytics avancées
- [ ] Multi-langue
- [ ] Dark mode

---

## 📞 SUPPORT

Pour toute question:
1. Consulter `PHASE_4_FLUTTER_GUIDE.md` dans le backend
2. Vérifier l'API backend est lancée
3. Tester les endpoints avec curl

---

## ✨ ÉTAT ACTUEL

**Projet créé avec succès ! ✅**

- [x] Structure de base
- [x] Configuration Flutter
- [x] ApiService complet
- [x] Splash screen
- [ ] Autres écrans à créer

**Prêt pour le développement ! 🚀**

---

**Suivre PHASE_4_FLUTTER_GUIDE.md dans le backend pour le code complet des écrans.**
