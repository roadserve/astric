import 'package:firebase_core/firebase_core.dart';
import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:flutter/foundation.dart';

class FirebaseConfig {
  static FirebaseMessaging get messaging => FirebaseMessaging.instance;
  
  static Future<void> initialize() async {
    await Firebase.initializeApp();
    
    // Request permission for notifications
    await requestNotificationPermission();
    
    // Configure foreground notification presentation
    await messaging.setForegroundNotificationPresentationOptions(
      alert: true,
      badge: true,
      sound: true,
    );
  }
  
  static Future<bool> requestNotificationPermission() async {
    final settings = await messaging.requestPermission(
      alert: true,
      badge: true,
      sound: true,
      provisional: false,
    );
    
    return settings.authorizationStatus == AuthorizationStatus.authorized;
  }
  
  static Future<String?> getFCMToken() async {
    try {
      return await messaging.getToken();
    } catch (e) {
      if (kDebugMode) {
        print('Error getting FCM token: $e');
      }
      return null;
    }
  }
  
  static Future<void> subscribeToTopic(String topic) async {
    await messaging.subscribeToTopic(topic);
  }
  
  static Future<void> unsubscribeFromTopic(String topic) async {
    await messaging.unsubscribeFromTopic(topic);
  }
  
  static void configureForegroundMessageHandler(
    Future<void> Function(RemoteMessage) handler,
  ) {
    FirebaseMessaging.onMessage.listen(handler);
  }
  
  static void configureBackgroundMessageHandler(
    Future<void> Function(RemoteMessage) handler,
  ) {
    FirebaseMessaging.onBackgroundMessage(handler);
  }
}
