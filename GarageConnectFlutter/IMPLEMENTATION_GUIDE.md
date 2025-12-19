# 📱 GarageConnect Flutter - Guide d'Implémentation

## 🎯 Vue d'ensemble

Application mobile Flutter d'administration pour GarageConnect, permettant aux gérants de garage de gérer les commandes, services et paramètres depuis leur smartphone ou tablette.

## 📁 Structure du Projet

```
lib/
├── core/
│   └── services/
│       └── api_service.dart          # Service API REST complet
│
├── presentation/
│   ├── screens/
│   │   ├── splash_screen.dart        # Écran de chargement
│   │   ├── login_screen.dart         # Authentification
│   │   ├── home_screen.dart          # Dashboard principal
│   │   ├── orders_screen.dart        # Gestion des commandes
│   │   ├── services_screen.dart      # Gestion des services
│   │   └── settings_screen.dart      # Paramètres de l'app
│   │
│   └── widgets/
│       ├── dashboard_card.dart       # Carte de statistique
│       ├── order_card.dart           # Carte de commande
│       ├── service_card.dart         # Carte de service
│       └── recent_orders_list.dart   # Liste des commandes récentes
│
└── main.dart                          # Point d'entrée de l'application
```

## 🚀 Installation et Configuration

### 1. Prérequis

- Flutter SDK 3.5.0 ou supérieur
- Dart 3.5.0 ou supérieur
- Android Studio / Xcode pour les émulateurs
- Un backend GarageConnect en cours d'exécution

### 2. Installation des dépendances

```bash
cd GarageConnectFlutter
flutter pub get
```

### 3. Configuration de l'API

Modifier l'URL de base dans `lib/core/services/api_service.dart` :

```dart
static const String baseUrl = 'http://votre-serveur:3000/api';
```

Pour le développement local :
- iOS Simulator: `http://localhost:3000/api`
- Android Emulator: `http://10.0.2.2:3000/api`
- Appareil physique: `http://[IP-DE-VOTRE-MAC]:3000/api`

### 4. Lancement de l'application

```bash
# Liste des appareils disponibles
flutter devices

# Lancer sur un appareil spécifique
flutter run -d [device-id]

# Lancer en mode debug
flutter run --debug

# Lancer en mode release
flutter run --release
```

## 📱 Fonctionnalités Implémentées

### ✅ Écran de Connexion
- Authentification par email/mot de passe
- Validation des champs
- Gestion des erreurs
- Navigation vers le dashboard

### ✅ Dashboard Principal
- 4 cartes de statistiques :
  - Commandes en attente
  - Commandes terminées
  - Revenu total
  - Services actifs
- Liste des commandes récentes
- Pull-to-refresh
- Navigation bottom bar

### ✅ Gestion des Commandes
- Affichage de toutes les commandes
- Filtres par statut :
  - Toutes
  - En attente
  - En cours
  - Terminées
  - Annulées
- Actions rapides :
  - Démarrer une commande
  - Terminer une commande
  - Annuler une commande
- Pull-to-refresh

### ✅ Gestion des Services
- Liste de tous les services
- Activation/désactivation rapide
- Affichage des prix
- Bouton d'édition (à implémenter)
- Pull-to-refresh

### ✅ Paramètres
- Profil de l'administrateur
- Section paramètres (notifications, langue, thème)
- Section support (aide, confidentialité, CGU)
- Déconnexion sécurisée
- Version de l'application

## 🔌 Service API

Le `ApiService` fournit toutes les méthodes nécessaires :

```dart
// Authentification
await apiService.login(email, password);

// Dashboard
await apiService.getDashboardStats();

// Commandes
await apiService.getOrders(status: 'pending', limit: 10);
await apiService.updateOrderStatus(orderId, 'completed');

// Services
await apiService.getServices();
await apiService.updateServiceStatus(serviceId, true);
```

## 🎨 Personnalisation

### Thème

Le thème est défini dans `main.dart` :

```dart
theme: ThemeData(
  colorScheme: ColorScheme.fromSeed(
    seedColor: const Color(0xFF2196F3), // Couleur principale
    brightness: Brightness.light,
  ),
  useMaterial3: true,
  textTheme: GoogleFonts.poppinsTextTheme(),
),
```

### Couleurs des Statuts

Définies dans chaque composant concerné :
- 🟠 Orange : En attente
- 🔵 Bleu : En cours
- 🟢 Vert : Terminée
- 🔴 Rouge : Annulée

## 📋 TODO - Fonctionnalités à Implémenter

### Haute Priorité
- [ ] **Détails de commande** : Écran complet avec toutes les informations
- [ ] **Édition de service** : Formulaire de modification des services
- [ ] **Ajout de service** : Formulaire de création de service
- [ ] **Gestion des erreurs** : Meilleure gestion avec retry automatique
- [ ] **Cache local** : Stockage des données pour mode hors ligne
- [ ] **Notifications push** : Firebase Cloud Messaging

### Moyenne Priorité
- [ ] **Recherche** : Barre de recherche dans les commandes
- [ ] **Filtres avancés** : Date, montant, client
- [ ] **Statistiques détaillées** : Graphiques et analytics
- [ ] **Gestion des clients** : CRUD complet
- [ ] **Gestion du stock** : Pièces et pneus
- [ ] **Historique** : Actions et modifications

### Basse Priorité
- [ ] **Mode sombre** : Thème dark complet
- [ ] **Multilingue** : i18n (FR, EN, ES)
- [ ] **Export PDF** : Factures et rapports
- [ ] **Scanner QR** : Lecture de codes commande
- [ ] **Photos** : Upload d'images de véhicules
- [ ] **Signature** : Signature électronique clients

## 🧪 Tests

### Tests Unitaires

```bash
flutter test
```

### Tests d'Intégration

```bash
flutter test integration_test/
```

### Tests de Performance

```bash
flutter run --profile
flutter run --release
```

## 🏗️ Build pour Production

### Android (APK)

```bash
# Debug
flutter build apk --debug

# Release
flutter build apk --release

# Split APK par architecture
flutter build apk --split-per-abi
```

### Android (App Bundle)

```bash
flutter build appbundle --release
```

### iOS

```bash
flutter build ios --release
```

## 📊 Architecture et Patterns

### State Management
- **StatefulWidget** : Pour les écrans avec état local
- **setState()** : Gestion simple de l'état
- 🔜 À considérer : Provider, Riverpod ou Bloc pour une app plus complexe

### Patterns Utilisés
- **Repository Pattern** : ApiService comme couche d'abstraction
- **Widget Composition** : Widgets réutilisables et composables
- **Separation of Concerns** : Screens, Widgets, Services séparés

### Conventions de Code
- Utilisation de `const` pour les widgets immutables
- Noms explicites et en anglais
- Commentaires en français pour la documentation
- Formatage automatique avec `flutter format`

## 🔒 Sécurité

### Mises en place
- ✅ HTTPS pour toutes les requêtes API
- ✅ Validation des entrées utilisateur
- ✅ Gestion sécurisée des tokens (à améliorer)

### À implémenter
- [ ] Stockage sécurisé des tokens (flutter_secure_storage)
- [ ] Refresh token automatique
- [ ] Biométrie (Face ID / Touch ID)
- [ ] Certificate pinning
- [ ] Obfuscation du code

## 📱 Compatibilité

### Versions supportées
- **iOS** : 12.0 et supérieur
- **Android** : API 21 (Android 5.0) et supérieur

### Appareils testés
- iPhone (iOS 15+)
- iPad (iOS 15+)
- Smartphones Android (5.0+)
- Tablettes Android (5.0+)

## 🐛 Débogage

### Logs

```dart
// Dans le code
print('Debug: $message');
debugPrint('Debug détaillé: $data');

// Dans le terminal
flutter logs
```

### DevTools

```bash
flutter pub global activate devtools
flutter pub global run devtools
```

### Problèmes Courants

**Erreur de connexion API**
```
Solution: Vérifier l'URL de base et que le backend est accessible
```

**Erreurs de build**
```bash
flutter clean
flutter pub get
flutter run
```

**Hot reload ne fonctionne pas**
```
Solution: Redémarrer l'application (r = hot reload, R = full restart)
```

## 📞 Support

Pour toute question ou problème :
- Consulter la documentation Flutter : https://flutter.dev
- Vérifier les issues GitHub du projet
- Contacter l'équipe de développement

## 🎓 Ressources d'Apprentissage

- [Flutter Documentation](https://flutter.dev/docs)
- [Dart Language Tour](https://dart.dev/guides/language/language-tour)
- [Flutter Widget Catalog](https://flutter.dev/docs/development/ui/widgets)
- [Material Design Guidelines](https://material.io/design)
- [Flutter Best Practices](https://flutter.dev/docs/development/best-practices)

---

**Version** : 1.0.0  
**Dernière mise à jour** : 30/11/2025  
**Statut** : En développement actif
