import 'package:dio/dio.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../config/environment.dart';

class ApiService {
  static final ApiService _instance = ApiService._internal();
  factory ApiService() => _instance;
  
  late Dio _dio;
  String? _token;
  bool _isInitialized = false;

  ApiService._internal() {
    _dio = Dio(BaseOptions(
      baseUrl: Environment.baseUrl,
      connectTimeout: const Duration(seconds: 30),
      receiveTimeout: const Duration(seconds: 30),
    ));

    // Log les requêtes en développement
    if (Environment.enableLogs) {
      _dio.interceptors.add(LogInterceptor(
        request: true,
        requestHeader: true,
        requestBody: true,
        responseHeader: false,
        responseBody: true,
        error: true,
      ));
    }

    _dio.interceptors.add(
      InterceptorsWrapper(
        onRequest: (options, handler) async {
          // Charger le token au premier appel si pas encore fait
          if (!_isInitialized) {
            await _initializeToken();
          }
          if (_token != null) {
            options.headers['Authorization'] = 'Bearer $_token';
          }
          return handler.next(options);
        },
        onError: (error, handler) async {
          if (error.response?.statusCode == 401) {
            await clearToken();
          }
          return handler.next(error);
        },
      ),
    );
  }

  Future<void> _initializeToken() async {
    if (!_isInitialized) {
      await loadToken();
      _isInitialized = true;
    }
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

  // Auth
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

  // Bot Config
  Future<Map<String, dynamic>> getBotConfig() async {
    final response = await _dio.get('/api/admin/bot-config');
    return response.data;
  }

  Future<Map<String, dynamic>> updateBotConfig(
      Map<String, dynamic> config) async {
    final response = await _dio.put('/api/admin/bot-config', data: config);
    return response.data;
  }

  // Analytics
  Future<Map<String, dynamic>> getAnalytics(String period) async {
    final response = await _dio.get(
      '/api/admin/analytics',
      queryParameters: {'period': period},
    );
    return response.data;
  }

  // Conversations
  Future<Map<String, dynamic>> getConversations({
    int page = 1,
    int limit = 20,
    String? search,
  }) async {
    final response = await _dio.get(
      '/api/admin/conversations',
      queryParameters: {
        'page': page,
        'limit': limit,
        if (search != null) 'search': search,
      },
    );
    return response.data;
  }

  Future<Map<String, dynamic>> getConversationDetails(String id) async {
    final response = await _dio.get('/api/admin/conversations/$id');
    return response.data;
  }

  // Reviews
  Future<Map<String, dynamic>> getReviews({
    int page = 1,
    int limit = 20,
    int? rating,
    bool? isPublic,
  }) async {
    final response = await _dio.get(
      '/api/admin/reviews',
      queryParameters: {
        'page': page,
        'limit': limit,
        if (rating != null) 'rating': rating,
        if (isPublic != null) 'isPublic': isPublic,
      },
    );
    return response.data;
  }

  Future<Map<String, dynamic>> toggleReviewVisibility(
    String reviewId,
    bool isPublic,
  ) async {
    final response = await _dio.put(
      '/api/admin/reviews/toggle-visibility',
      data: {'reviewId': reviewId, 'isPublic': isPublic},
    );
    return response.data;
  }

  // Dashboard Stats
  Future<Map<String, dynamic>> getDashboardStats() async {
    final response = await _dio.get('/api/admin/dashboard/stats');
    return response.data;
  }

  // Orders
  Future<List<Map<String, dynamic>>> getOrders({
    int page = 1,
    int limit = 20,
    String? status,
    String? paymentStatus,
  }) async {
    final response = await _dio.get(
      '/api/admin/orders',
      queryParameters: {
        'page': page,
        'limit': limit,
        if (status != null) 'status': status,
        if (paymentStatus != null) 'paymentStatus': paymentStatus,
      },
    );
    // Retourne la liste d'orders
    return List<Map<String, dynamic>>.from(response.data['orders'] ?? []);
  }

  Future<Map<String, dynamic>> updateOrderStatus(
    String orderId,
    String status,
  ) async {
    final response = await _dio.put(
      '/api/admin/orders/$orderId/status',
      data: {'status': status},
    );
    return response.data;
  }

  // Services
  Future<List<Map<String, dynamic>>> getServices() async {
    final response = await _dio.get('/api/admin/services');
    return List<Map<String, dynamic>>.from(response.data['services'] ?? []);
  }

  Future<Map<String, dynamic>> updateServiceStatus(
    String serviceId,
    bool isActive,
  ) async {
    final response = await _dio.put(
      '/api/admin/services/$serviceId/status',
      data: {'isActive': isActive},
    );
    return response.data;
  }
}
