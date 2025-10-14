# 📱 How to Run the Mobile App

## ✅ Quick Fix

You need to be in the `mobile` directory when running Flutter commands.

### Run These Commands in Order:

```powershell
# Step 1: Navigate to mobile directory
cd C:\Users\PezroX\flutter_setup\all_crm\mobile

# Step 2: Run the app
flutter run -d emulator-5554
```

---

## 📋 Copy-Paste This:

```powershell
cd C:\Users\PezroX\flutter_setup\all_crm\mobile && flutter run -d emulator-5554
```

**OR** if that doesn't work in PowerShell:

```powershell
cd C:\Users\PezroX\flutter_setup\all_crm\mobile
flutter run -d emulator-5554
```

---

## 🔍 Why This Error Happens

The error "No pubspec.yaml file found" means:
- You're in the wrong directory (`all_crm`)
- You need to be in the `mobile` directory
- Flutter looks for `pubspec.yaml` in the current directory

---

## ✅ Correct Directory Structure

```
all_crm/              ← You are here (WRONG)
└── mobile/           ← You need to be here (CORRECT)
    ├── pubspec.yaml  ← Flutter needs this file
    ├── lib/
    ├── android/
    └── ios/
```

---

## 🎯 Step-by-Step Guide

### Option 1: Use PowerShell (Recommended)

Open PowerShell and run:

```powershell
# Navigate to mobile folder
cd C:\Users\PezroX\flutter_setup\all_crm\mobile

# Verify you're in the right place
dir pubspec.yaml

# Run the app
flutter run -d emulator-5554
```

### Option 2: Use the Batch Script

From the `all_crm` directory:

```powershell
.\run_mobile.bat
```

### Option 3: Use VS Code Terminal

1. Open terminal in VS Code
2. Run:
```bash
cd mobile
flutter run -d emulator-5554
```

---

## 📱 What Will Happen

Once you run from the correct directory:

1. ✅ Flutter finds `pubspec.yaml`
2. 🔄 Starts building (3-5 minutes first time)
3. 📲 Installs APK on emulator-5554
4. 🚀 Launches the app automatically

---

## 🎯 Expected Output

You should see:
```
Launching lib\main.dart on emulator-5554 in debug mode...
Running Gradle task 'assembleDebug'...
✓ Built build\app\outputs\flutter-apk\app-debug.apk.
Installing build\app\outputs\flutter-apk\app.apk...
```

---

## 🆘 Still Having Issues?

### Check Your Location
```powershell
pwd
# Should show: C:\Users\PezroX\flutter_setup\all_crm\mobile
```

### Verify File Exists
```powershell
Test-Path pubspec.yaml
# Should return: True
```

### List Available Devices
```powershell
flutter devices
# Should show emulator-5554
```

---

## ✨ Quick Reference

| Command | Purpose |
|---------|---------|
| `cd mobile` | Go to mobile directory |
| `flutter devices` | List available devices |
| `flutter run` | Run on default device |
| `flutter run -d emulator-5554` | Run on specific emulator |
| `flutter clean` | Clean build |
| `flutter pub get` | Get dependencies |

---

## 🎊 Summary

**The Issue**: Running from wrong directory (`all_crm` instead of `mobile`)

**The Solution**: 
```powershell
cd mobile
flutter run -d emulator-5554
```

**That's it!** 🚀
