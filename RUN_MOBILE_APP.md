# 📱 Running Mobile App on Emulator

## Prerequisites

### 1. Install Flutter
If you haven't installed Flutter yet:
1. Download from: https://docs.flutter.dev/get-started/install/windows
2. Extract to `C:\src\flutter`
3. Add `C:\src\flutter\bin` to your system PATH
4. Restart your terminal

### 2. Install Android Studio
1. Download from: https://developer.android.com/studio
2. Install Android SDK
3. Create an Android emulator (AVD)

---

## Quick Start Commands

### Step 1: Verify Flutter Installation
```powershell
flutter doctor
```

This will show you what's missing. You should see:
- ✓ Flutter SDK
- ✓ Android toolchain
- ✓ Android Studio
- ✓ Connected devices

### Step 2: Accept Android Licenses
```powershell
flutter doctor --android-licenses
```

Press 'y' for all licenses.

### Step 3: Install Dependencies
```powershell
cd mobile
flutter pub get
flutter pub run build_runner build --delete-conflicting-outputs
```

### Step 4: Start Emulator
```powershell
# List available emulators
flutter emulators

# Launch an emulator (replace with your emulator name)
flutter emulators --launch <emulator_id>

# Or open Android Studio and start emulator from AVD Manager
```

### Step 5: Run the App
```powershell
cd mobile
flutter run
```

---

## Create Android Emulator (If you don't have one)

### Using Android Studio:
1. Open Android Studio
2. Click "More Actions" → "Virtual Device Manager"
3. Click "Create Device"
4. Select "Pixel 5" or any phone
5. Download a system image (e.g., API 33)
6. Click "Finish"

### Using Command Line:
```powershell
# List available system images
flutter emulators

# Create emulator
avdmanager create avd -n pixel_5 -k "system-images;android-33;google_apis;x86_64" -d "pixel_5"
```

---

## Troubleshooting

### "Flutter not found"
- Make sure Flutter is in your PATH
- Restart your terminal
- Run: `where flutter` to check

### "No devices found"
- Start an emulator first
- Or connect a physical device with USB debugging
- Run: `flutter devices` to see available devices

### "Android licenses not accepted"
- Run: `flutter doctor --android-licenses`

### Build errors
```powershell
cd mobile
flutter clean
flutter pub get
flutter pub run build_runner build --delete-conflicting-outputs
flutter run
```

---

## Alternative: Run on Physical Device

### Android Phone:
1. Enable Developer Options on your phone
2. Enable USB Debugging
3. Connect phone via USB
4. Run: `flutter devices` to verify
5. Run: `flutter run`

---

## What the Mobile App Includes

Once running, you'll have access to:
- 📱 Complete authentication (email/phone)
- 💼 Invoice creation and management
- 👥 Customer directory
- 📊 Dashboard with analytics
- 🤖 AI features (OCR scanning)
- ✓ Attendance tracking with QR
- 📱 Push notifications (with Firebase)
- 💬 WhatsApp CRM features

---

## Configuration

Your mobile app is already configured with:
- ✅ Supabase credentials (in mobile/.env)
- ✅ App config (in mobile/lib/core/config/app_config.dart)

For Firebase push notifications (optional):
1. Create a Firebase project
2. Download `google-services.json`
3. Place in `mobile/android/app/`
4. Update `mobile/.env` with Firebase credentials

---

## Current Project Status

### ✅ Web App
- Running on: http://localhost:3000
- Status: ✅ WORKING

### ⏳ Mobile App
- Status: Waiting for Flutter installation
- Once Flutter is installed: Ready to run!

---

## Quick Check Command

Run this to see if you're ready:
```powershell
cd mobile
flutter doctor -v
flutter devices
```

This will tell you:
- ✓ What's installed correctly
- ✗ What's missing
- 📱 Available devices/emulators

---

## Time Estimates

- Installing Flutter: ~15 minutes
- Installing Android Studio: ~20 minutes
- Creating emulator: ~10 minutes
- First build: ~5-10 minutes
- Subsequent runs: ~30 seconds

Total setup time: ~45-60 minutes (first time only)

---

## Need Help?

If you encounter any issues:
1. Run `flutter doctor` to diagnose
2. Check error messages carefully
3. Restart your terminal if PATH changes
4. Restart Android Studio if needed

---

**Note**: The web app is fully functional and doesn't require the mobile app. You can use the web dashboard for all features while setting up Flutter!
