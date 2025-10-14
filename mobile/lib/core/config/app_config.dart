class AppConfig {
  // Supabase Configuration
  static const String supabaseUrl = 'https://nazedodnkzkuxvsuedmb.supabase.co';
  
  static const String supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5hemVkb2Rua3prdXh2c3VlZG1iIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk1Mjc3MjgsImV4cCI6MjA3NTEwMzcyOH0.33dMgS9GW9DW3XKPnQ1hTw5zzGbflzTue0VH1QRAVwE';
  
  // Firebase Configuration
  static const String firebaseProjectId = String.fromEnvironment(
    'FIREBASE_PROJECT_ID',
    defaultValue: 'your-firebase-project-id',
  );
  
  // App Configuration
  static const String appName = 'AI SME Copilot';
  static const String appVersion = '1.0.0';
  
  // API Configuration
  static const String apiBaseUrl = 'https://nazedodnkzkuxvsuedmb.supabase.co/functions/v1';
  
  // WhatsApp Configuration
  static const String whatsappApiUrl = 'https://graph.facebook.com/v18.0';
  
  // File Upload Configuration
  static const int maxFileSize = 10 * 1024 * 1024; // 10MB
  static const List<String> allowedImageTypes = ['jpg', 'jpeg', 'png', 'webp'];
  static const List<String> allowedDocumentTypes = ['pdf', 'doc', 'docx'];
}
