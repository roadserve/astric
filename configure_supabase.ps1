# Supabase Configuration Script
# This script configures Supabase credentials for both web and mobile apps

$SUPABASE_URL = "https://nazedodnkzkuxvsuedmb.supabase.co"
$SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5hemVkb2Rua3prdXh2c3VlZG1iIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk1Mjc3MjgsImV4cCI6MjA3NTEwMzcyOH0.33dMgS9GW9DW3XKPnQ1hTw5zzGbflzTue0VH1QRAVwE"
$SUPABASE_SERVICE_ROLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5hemVkb2Rua3prdXh2c3VlZG1iIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1OTUyNzcyOCwiZXhwIjoyMDc1MTAzNzI4fQ.VFx60HhZ33R6sjclr_RqEiwWbYdmnTVXy6kpLUYpWs8"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Configuring Supabase Credentials" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Configure Web Dashboard
Write-Host "Configuring Web Dashboard (.env.local)..." -ForegroundColor Yellow

$webEnvContent = @"
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=$SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY=$SUPABASE_ANON_KEY

# API Configuration
NEXT_PUBLIC_API_BASE_URL=$SUPABASE_URL/functions/v1

# App Configuration
NEXT_PUBLIC_APP_NAME=AI SME Copilot
NEXT_PUBLIC_APP_VERSION=1.0.0

# Service Role Key (KEEP THIS SECRET - Only for server-side operations)
SUPABASE_SERVICE_ROLE_KEY=$SUPABASE_SERVICE_ROLE_KEY
"@

$webEnvContent | Out-File -FilePath "web\.env.local" -Encoding UTF8 -Force
Write-Host "[SUCCESS] Web configuration saved to web\.env.local" -ForegroundColor Green
Write-Host ""

# Configure Mobile App
Write-Host "Configuring Mobile App (.env)..." -ForegroundColor Yellow

$mobileEnvContent = @"
# Supabase Configuration
SUPABASE_URL=$SUPABASE_URL
SUPABASE_ANON_KEY=$SUPABASE_ANON_KEY

# Firebase Configuration (Add your Firebase credentials here)
FIREBASE_PROJECT_ID=your-firebase-project-id
FIREBASE_APP_ID_ANDROID=your-android-app-id
FIREBASE_APP_ID_IOS=your-ios-app-id

# API Configuration
API_BASE_URL=$SUPABASE_URL/functions/v1

# WhatsApp Configuration (Add when ready)
WHATSAPP_ACCESS_TOKEN=your-whatsapp-access-token
WHATSAPP_PHONE_NUMBER_ID=your-phone-number-id

# App Configuration
APP_NAME=AI SME Copilot
APP_VERSION=1.0.0
"@

$mobileEnvContent | Out-File -FilePath "mobile\.env" -Encoding UTF8 -Force
Write-Host "[SUCCESS] Mobile configuration saved to mobile\.env" -ForegroundColor Green
Write-Host ""

# Update mobile config file
Write-Host "Updating mobile app configuration file..." -ForegroundColor Yellow

$configContent = @"
class AppConfig {
  // Supabase Configuration
  static const String supabaseUrl = '$SUPABASE_URL';
  
  static const String supabaseAnonKey = '$SUPABASE_ANON_KEY';
  
  // Firebase Configuration
  static const String firebaseProjectId = String.fromEnvironment(
    'FIREBASE_PROJECT_ID',
    defaultValue: 'your-firebase-project-id',
  );
  
  // App Configuration
  static const String appName = 'AI SME Copilot';
  static const String appVersion = '1.0.0';
  
  // API Configuration
  static const String apiBaseUrl = '$SUPABASE_URL/functions/v1';
  
  // WhatsApp Configuration
  static const String whatsappApiUrl = 'https://graph.facebook.com/v18.0';
  
  // File Upload Configuration
  static const int maxFileSize = 10 * 1024 * 1024; // 10MB
  static const List<String> allowedImageTypes = ['jpg', 'jpeg', 'png', 'webp'];
  static const List<String> allowedDocumentTypes = ['pdf', 'doc', 'docx'];
}
"@

$configContent | Out-File -FilePath "mobile\lib\core\config\app_config.dart" -Encoding UTF8 -Force
Write-Host "[SUCCESS] Updated mobile\lib\core\config\app_config.dart" -ForegroundColor Green
Write-Host ""

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Configuration Complete!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Next Steps:" -ForegroundColor Yellow
Write-Host "1. Run migrations to set up your Supabase database" -ForegroundColor White
Write-Host "   cd supabase" -ForegroundColor Gray
Write-Host "   supabase link --project-ref nazedodnkzkuxvsuedmb" -ForegroundColor Gray
Write-Host "   supabase db push" -ForegroundColor Gray
Write-Host ""
Write-Host "2. Start the web dashboard:" -ForegroundColor White
Write-Host "   cd web" -ForegroundColor Gray
Write-Host "   npm run dev" -ForegroundColor Gray
Write-Host ""
Write-Host "3. (Optional) Install Flutter and run mobile app:" -ForegroundColor White
Write-Host "   cd mobile" -ForegroundColor Gray
Write-Host "   flutter pub get" -ForegroundColor Gray
Write-Host "   flutter run" -ForegroundColor Gray
Write-Host ""
Write-Host "Your Supabase project: https://nazedodnkzkuxvsuedmb.supabase.co" -ForegroundColor Cyan
Write-Host ""
