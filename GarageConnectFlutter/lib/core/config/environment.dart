/// Configuration d'environnement pour GarageConnect
class Environment {
  // Mode actuel (à changer selon vos besoins)
  static const EnvironmentType currentEnvironment = EnvironmentType.development;

  // URLs selon l'environnement
  static String get baseUrl {
    switch (currentEnvironment) {
      case EnvironmentType.development:
        return developmentUrl;
      case EnvironmentType.production:
        return productionUrl;
    }
  }

  // URL de développement local
  // iOS Simulator: localhost
  // Android Emulator: 10.0.2.2
  // Appareil physique: Utilisez l'IP de votre machine (192.168.1.221)
  static const String developmentUrl = 'http://192.168.1.221:3000';
  
  // URL de production (Vercel)
  static const String productionUrl = 'https://your-domain.vercel.app';

  // Informations de debug
  static bool get isDevelopment => currentEnvironment == EnvironmentType.development;
  static bool get isProduction => currentEnvironment == EnvironmentType.production;

  // Afficher les logs selon l'environnement
  static bool get enableLogs => isDevelopment;
}

enum EnvironmentType {
  development,
  production,
}
