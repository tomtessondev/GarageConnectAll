# 📱 Phase 4 - App Flutter Admin - Guide Complet

**Durée estimée:** 5-7 jours  
**Prérequis:** Flutter 3.16+, Android Studio / Xcode  
**Statut:** 0% - À démarrer

---

## 🎯 OBJECTIF

Créer une application mobile Flutter permettant aux administrateurs de:
- Se connecter de manière sécurisée
- Voir les statistiques en temps réel
- Gérer la configuration du bot
- Consulter les conversations
- Modérer les avis clients
- Suivre les commandes

---

## 📋 STRUCTURE APP FLUTTER

### Architecture recommandée

```
garage_connect_admin/
├── lib/
│   ├── main.dart
│   ├── app.dart
│   ├── core/
│   │   ├── constants/
│   │   │   ├── api_constants.dart
│   │   │   └── app_constants.dart
│   │   ├── theme/
│   │   │   ├── app_theme.dart
│   │   │   └── colors.dart
│   │   └── utils/
│   │       ├── validators.dart
│   │       └── formatters.dart
│   ├── data/
│   │   ├── models/
│   │   │   ├── user.dart
│   │   │   ├── bot_config.dart
│   │   │   ├── conversation.dart
│   │   │   ├── order.dart
│   │   │   └── review.dart
│   │   ├── repositories/
│   │   │   ├── auth_repository.dart
│   │   │   ├── bot_repository.dart
│   │   │   └── stats_repository.dart
│   │   └── services/
│   │       ├── api_service.dart
│   │       ├── storage_service.dart
│   │       └── auth_service.dart
│   ├── presentation/
│   │   ├── screens/
│   │   │   ├── auth/
│   │   │   │   ├── login_screen.dart
│   │   │   │   └── splash_screen.dart
│   │   │   ├── dashboard/
│   │   │   │   └── dashboard_screen.dart
│   │   │   ├── bot_config/
│   │   │   │   └── bot_config_screen.dart
│   │   │   ├── conversations/
│   │   │   │   ├── conversations_list_screen.dart
│   │   │   │   └── conversation_detail_screen.dart
│   │   │   ├── reviews/
│   │   │   │   └── reviews_screen.dart
│   │   │   └── orders/
│   │   │       └── orders_screen.dart
│   │   └── widgets/
│   │       ├── stat_card.dart
│   │       ├── custom_app_bar.dart
│   │       └── loading_indicator.dart
│   └── blocs/ (ou providers/)
│       ├── auth/
│       ├── bot_config/
│       └── dashboard/
└── pubspec.yaml
```

---

## 🚀 SETUP PROJET

### 1. Créer projet Flutter

```bash
# Créer nouveau projet
flutter create garage_connect_admin
cd garage_connect_admin

# Tester
flutter run
```

### 2. Dépendances (pubspec.yaml)

```yaml
dependencies:
  flutter:
    sdk: flutter
  
  # State Management
  flutter_bloc: ^8.1.3
  equatable: ^2.0.5
  
  # Networking
  dio: ^5.4.0
  retrofit: ^4.0.3
  
  # Storage
  shared_preferences: ^2.2.2
  flutter_secure_storage: ^9.0.0
  
  # UI
  flutter_svg: ^2.0.9
  google_fonts: ^6.1.0
  fl_chart: ^0.66.0
  
  # Utils
  intl: ^0.19.0
  timeago: ^3.6.0

dev_dependencies:
  flutter_test:
    sdk: flutter
  flutter_lints: ^3.0.0
  build_runner: ^2.4.7
  retrofit_generator: ^8.0.4
```

```bash
flutter pub get
```

---

## 🔐 1. AUTHENTIFICATION

### api_service.dart

```dart
import 'package:dio/dio.dart';
import 'package:shared_preferences/shared_preferences.dart';

class ApiService {
  static const String baseUrl = 'https://your-domain.vercel.app';
  late Dio _dio;
  String? _token;

  ApiService() {
    _dio = Dio(BaseOptions(
      baseUrl: baseUrl,
      connectTimeout: const Duration(seconds: 30),
      receiveTimeout: const Duration(seconds: 30),
    ));

    _dio.interceptors.add(
      InterceptorsWrapper(
        onRequest: (options, handler) async {
          if (_token != null) {
            options.headers['Authorization'] = 'Bearer $_token';
          }
          return handler.next(options);
        },
        onError: (error, handler) async {
          if (error.response?.statusCode == 401) {
            // Token expired, redirect to login
            await clearToken();
          }
          return handler.next(error);
        },
      ),
    );
  }

  Future<void> setToken(String token) async {
    _token = token;
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString('auth_token', token);
  }

  Future<void> loadToken() async {
    final prefs = await SharedPreferences.getInstance();
    _token = prefs.getString('auth_token');
  }

  Future<void> clearToken() async {
    _token = null;
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove('auth_token');
  }

  Future<Map<String, dynamic>> login(String email, String password) async {
    try {
      final response = await _dio.post(
        '/api/admin/auth/login',
        data: {'email': email, 'password': password},
      );
      
      if (response.data['token'] != null) {
        await setToken(response.data['token']);
      }
      
      return response.data;
    } catch (e) {
      rethrow;
    }
  }

  Future<Map<String, dynamic>> getBotConfig() async {
    final response = await _dio.get('/api/admin/bot-config');
    return response.data;
  }

  Future<Map<String, dynamic>> updateBotConfig(Map<String, dynamic> config) async {
    final response = await _dio.put('/api/admin/bot-config', data: config);
    return response.data;
  }
}
```

### login_screen.dart

```dart
import 'package:flutter/material.dart';

class LoginScreen extends StatefulWidget {
  const LoginScreen({super.key});

  @override
  State<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen> {
  final _formKey = GlobalKey<FormState>();
  final _emailController = TextEditingController();
  final _passwordController = TextEditingController();
  bool _isLoading = false;
  bool _obscurePassword = true;

  @override
  void dispose() {
    _emailController.dispose();
    _passwordController.dispose();
    super.dispose();
  }

  Future<void> _handleLogin() async {
    if (!_formKey.currentState!.validate()) return;

    setState(() => _isLoading = true);

    try {
      // Implement login logic with ApiService
      // On success, navigate to dashboard
      
      if (mounted) {
        Navigator.of(context).pushReplacementNamed('/dashboard');
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Erreur: ${e.toString()}')),
        );
      }
    } finally {
      if (mounted) {
        setState(() => _isLoading = false);
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: SafeArea(
        child: Center(
          child: SingleChildScrollView(
            padding: const EdgeInsets.all(24),
            child: Form(
              key: _formKey,
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  // Logo
                  Icon(
                    Icons.admin_panel_settings,
                    size: 80,
                    color: Theme.of(context).primaryColor,
                  ),
                  const SizedBox(height: 16),
                  
                  Text(
                    'GarageConnect Admin',
                    style: Theme.of(context).textTheme.headlineMedium,
                  ),
                  const SizedBox(height: 48),

                  // Email field
                  TextFormField(
                    controller: _emailController,
                    keyboardType: TextInputType.emailAddress,
                    decoration: const InputDecoration(
                      labelText: 'Email',
                      prefixIcon: Icon(Icons.email),
                      border: OutlineInputBorder(),
                    ),
                    validator: (value) {
                      if (value == null || value.isEmpty) {
                        return 'Email requis';
                      }
                      if (!value.contains('@')) {
                        return 'Email invalide';
                      }
                      return null;
                    },
                  ),
                  const SizedBox(height: 16),

                  // Password field
                  TextFormField(
                    controller: _passwordController,
                    obscureText: _obscurePassword,
                    decoration: InputDecoration(
                      labelText: 'Mot de passe',
                      prefixIcon: const Icon(Icons.lock),
                      suffixIcon: IconButton(
                        icon: Icon(
                          _obscurePassword
                              ? Icons.visibility
                              : Icons.visibility_off,
                        ),
                        onPressed: () {
                          setState(() {
                            _obscurePassword = !_obscurePassword;
                          });
                        },
                      ),
                      border: const OutlineInputBorder(),
                    ),
                    validator: (value) {
                      if (value == null || value.isEmpty) {
                        return 'Mot de passe requis';
                      }
                      return null;
                    },
                  ),
                  const SizedBox(height: 24),

                  // Login button
                  SizedBox(
                    width: double.infinity,
                    height: 50,
                    child: ElevatedButton(
                      onPressed: _isLoading ? null : _handleLogin,
                      child: _isLoading
                          ? const CircularProgressIndicator(color: Colors.white)
                          : const Text('Se connecter'),
                    ),
                  ),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }
}
```

---

## 📊 2. DASHBOARD

### dashboard_screen.dart

```dart
import 'package:flutter/material.dart';

class DashboardScreen extends StatefulWidget {
  const DashboardScreen({super.key});

  @override
  State<DashboardScreen> createState() => _DashboardScreenState();
}

class _DashboardScreenState extends State<DashboardScreen> {
  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Dashboard'),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh),
            onPressed: () {
              // Refresh data
            },
          ),
        ],
      ),
      drawer: _buildDrawer(context),
      body: RefreshIndicator(
        onRefresh: _refreshData,
        child: ListView(
          padding: const EdgeInsets.all(16),
          children: [
            // Stats cards
            _buildStatsGrid(),
            const SizedBox(height: 24),
            
            // Recent conversations
            _buildSectionTitle('Conversations récentes'),
            _buildRecentConversations(),
            
            const SizedBox(height: 24),
            
            // Recent orders
            _buildSectionTitle('Commandes récentes'),
            _buildRecentOrders(),
          ],
        ),
      ),
    );
  }

  Widget _buildDrawer(BuildContext context) {
    return Drawer(
      child: ListView(
        children: [
          DrawerHeader(
            decoration: BoxDecoration(
              color: Theme.of(context).primaryColor,
            ),
            child: const Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              mainAxisAlignment: MainAxisAlignment.end,
              children: [
                Icon(Icons.admin_panel_settings, size: 48, color: Colors.white),
                SizedBox(height: 8),
                Text(
                  'Admin Panel',
                  style: TextStyle(color: Colors.white, fontSize: 24),
                ),
              ],
            ),
          ),
          ListTile(
            leading: const Icon(Icons.dashboard),
            title: const Text('Dashboard'),
            onTap: () => Navigator.pop(context),
          ),
          ListTile(
            leading: const Icon(Icons.settings),
            title: const Text('Configuration Bot'),
            onTap: () {
              Navigator.pop(context);
              Navigator.pushNamed(context, '/bot-config');
            },
          ),
          ListTile(
            leading: const Icon(Icons.chat),
            title: const Text('Conversations'),
            onTap: () {
              Navigator.pop(context);
              Navigator.pushNamed(context, '/conversations');
            },
          ),
          ListTile(
            leading: const Icon(Icons.star),
            title: const Text('Avis'),
            onTap: () {
              Navigator.pop(context);
              Navigator.pushNamed(context, '/reviews');
            },
          ),
          const Divider(),
          ListTile(
            leading: const Icon(Icons.logout),
            title: const Text('Déconnexion'),
            onTap: () => _handleLogout(context),
          ),
        ],
      ),
    );
  }

  Widget _buildStatsGrid() {
    return GridView.count(
      crossAxisCount: 2,
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      mainAxisSpacing: 16,
      crossAxisSpacing: 16,
      children: [
        _StatCard(
          title: 'Conversations',
          value: '124',
          icon: Icons.chat_bubble,
          color: Colors.blue,
        ),
        _StatCard(
          title: 'Commandes',
          value: '45',
          icon: Icons.shopping_cart,
          color: Colors.green,
        ),
        _StatCard(
          title: 'Avis',
          value: '38',
          icon: Icons.star,
          color: Colors.orange,
        ),
        _StatCard(
          title: 'Revenu',
          value: '15.4K€',
          icon: Icons.euro,
          color: Colors.purple,
        ),
      ],
    );
  }

  Widget _buildSectionTitle(String title) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: Text(
        title,
        style: const TextStyle(
          fontSize: 18,
          fontWeight: FontWeight.bold,
        ),
      ),
    );
  }

  Widget _buildRecentConversations() {
    // Build list of conversations
    return Card(
      child: ListView.separated(
        shrinkWrap: true,
        physics: const NeverScrollableScrollPhysics(),
        itemCount: 5,
        separatorBuilder: (_, __) => const Divider(),
        itemBuilder: (context, index) {
          return ListTile(
            leading: const CircleAvatar(child: Icon(Icons.person)),
            title: Text('Client ${index + 1}'),
            subtitle: const Text('Dernière conversation...'),
            trailing: const Text('Il y a 2h'),
            onTap: () {
              // Navigate to conversation detail
            },
          );
        },
      ),
    );
  }

  Widget _buildRecentOrders() {
    // Build list of orders
    return Card(
      child: ListView.separated(
        shrinkWrap: true,
        physics: const NeverScrollableScrollPhysics(),
        itemCount: 5,
        separatorBuilder: (_, __) => const Divider(),
        itemBuilder: (context, index) {
          return ListTile(
            leading: const Icon(Icons.shopping_bag),
            title: Text('Commande GC-20241130-00${index + 1}'),
            subtitle: const Text('4 pneus - 540€'),
            trailing: const Chip(label: Text('Payé')),
          );
        },
      ),
    );
  }

  Future<void> _refreshData() async {
    // Implement refresh logic
    await Future.delayed(const Duration(seconds: 1));
  }

  void _handleLogout(BuildContext context) {
    // Clear token and navigate to login
    Navigator.of(context).pushReplacementNamed('/login');
  }
}

class _StatCard extends StatelessWidget {
  final String title;
  final String value;
  final IconData icon;
  final Color color;

  const _StatCard({
    required this.title,
    required this.value,
    required this.icon,
    required this.color,
  });

  @override
  Widget build(BuildContext context) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Icon(icon, size: 32, color: color),
            const Spacer(),
            Text(
              value,
              style: const TextStyle(
                fontSize: 24,
                fontWeight: FontWeight.bold,
              ),
            ),
            Text(
              title,
              style: TextStyle(
                color: Colors.grey[600],
              ),
            ),
          ],
        ),
      ),
    );
  }
}
```

---

## ⚙️ 3. CONFIGURATION BOT

### bot_config_screen.dart

```dart
import 'package:flutter/material.dart';

class BotConfigScreen extends StatefulWidget {
  const BotConfigScreen({super.key});

  @override
  State<BotConfigScreen> createState() => _BotConfigScreenState();
}

class _BotConfigScreenState extends State<BotConfigScreen> {
  final _formKey = GlobalKey<FormState>();
  final _systemPromptController = TextEditingController();
  final _welcomeMessageController = TextEditingController();
  bool _isLoading = true;
  bool _maintenanceMode = false;
  bool _autoReplyEnabled = true;

  @override
  void initState() {
    super.initState();
    _loadConfig();
  }

  Future<void> _loadConfig() async {
    setState(() => _isLoading = true);
    try {
      // Load from API
      // final config = await apiService.getBotConfig();
      // _systemPromptController.text = config['systemPrompt'];
      // etc.
    } catch (e) {
      // Handle error
    } finally {
      setState(() => _isLoading = false);
    }
  }

  Future<void> _saveConfig() async {
    if (!_formKey.currentState!.validate()) return;

    try {
      // Save to API
      // await apiService.updateBotConfig({...});
      
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Configuration enregistrée')),
        );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Erreur: ${e.toString()}')),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_isLoading) {
      return const Scaffold(
        body: Center(child: CircularProgressIndicator()),
      );
    }

    return Scaffold(
      appBar: AppBar(
        title: const Text('Configuration Bot'),
        actions: [
          IconButton(
            icon: const Icon(Icons.save),
            onPressed: _saveConfig,
          ),
        ],
      ),
      body: Form(
        key: _formKey,
        child: ListView(
          padding: const EdgeInsets.all(16),
          children: [
            SwitchListTile(
              title: const Text('Mode maintenance'),
              subtitle: const Text('Désactiver temporairement le bot'),
              value: _maintenanceMode,
              onChanged: (value) {
                setState(() => _maintenanceMode = value);
              },
            ),
            
            SwitchListTile(
              title: const Text('Réponses automatiques'),
              subtitle: const Text('Activer les réponses auto'),
              value: _autoReplyEnabled,
              onChanged: (value) {
                setState(() => _autoReplyEnabled = value);
              },
            ),
            
            const SizedBox(height: 24),
            
            TextFormField(
              controller: _systemPromptController,
              maxLines: 10,
              decoration: const InputDecoration(
                labelText: 'Prompt système',
                border: OutlineInputBorder(),
              ),
              validator: (value) {
                if (value == null || value.isEmpty) {
                  return 'Prompt requis';
                }
                return null;
              },
            ),
            
            const SizedBox(height: 16),
            
            TextFormField(
              controller: _welcomeMessageController,
              maxLines: 5,
              decoration: const InputDecoration(
                labelText: 'Message d\'accueil',
                border: OutlineInputBorder(),
              ),
              validator: (value) {
                if (value == null || value.isEmpty) {
                  return 'Message requis';
                }
                return null;
              },
            ),
          ],
        ),
      ),
    );
  }

  @override
  void dispose() {
    _systemPromptController.dispose();
    _welcomeMessageController.dispose();
    super.dispose();
  }
}
```

---

## 📋 CHECKLIST DÉVELOPPEMENT

### Semaine 1 (Jours 1-3)
- [ ] Setup projet Flutter
- [ ] Installer dépendances
- [ ] Configurer API service
- [ ] Créer modèles de données
- [ ] Implémenter écran login
- [ ] Implémenter splash screen
- [ ] Tester connexion API

### Semaine 2 (Jours 4-5)
- [ ] Créer dashboard
- [ ] Implémenter stats cards
- [ ] Créer navigation drawer
- [ ] Implémenter bot config screen
- [ ] Tester CRUD bot config

### Semaine 2-3 (Jours 6-7)
- [ ] Écran conversations
- [ ] Écran avis
- [ ] Écran commandes
- [ ] Polish UI/UX
- [ ] Tests complets
- [ ] Build APK/IPA

---

## 🚀 COMMANDES UTILES

```bash
# Dev
flutter run

# Build Android
flutter build apk --release

# Build iOS
flutter build ios --release

# Tests
flutter test

# Analyze
flutter analyze
```

---

## 📖 RESSOURCES

- **Flutter Docs:** https://docs.flutter.dev
- **Dio:** https://pub.dev/packages/dio
- **Bloc:** https://bloclibrary.dev
- **Material Design:** https://m3.material.io

---

## 🎯 RÉSULTAT ATTENDU

Application mobile permettant de:
✅ Se connecter de manière sécurisée  
✅ Voir les statistiques en temps réel  
✅ Modifier la configuration du bot  
✅ Consulter les conversations  
✅ Gérer les avis clients  
✅ Suivre les commandes

**Interface moderne, fluide et intuitive ! 📱**
