# AI SME Copilot - Setup Guide

This guide will help you set up the AI SME Copilot application on your local development environment.

## Prerequisites

- **Flutter SDK** (latest stable version)
- **Node.js** (18+ recommended)
- **Supabase CLI** (latest version)
- **Firebase project** (for mobile push notifications)
- **Git** (for version control)

## Quick Start

### 1. Clone the Repository

```bash
git clone <repository-url>
cd all_crm
```

### 2. Supabase Setup

1. **Install Supabase CLI**:
   ```bash
   npm install -g supabase
   ```

2. **Login to Supabase**:
   ```bash
   supabase login
   ```

3. **Start Supabase locally**:
   ```bash
   cd supabase
   supabase start
   ```

4. **Apply migrations**:
   ```bash
   supabase db reset
   ```

5. **Note the local URLs** (you'll need these for configuration):
   - API URL: `http://localhost:54321`
   - Anon Key: (shown in terminal output)

### 3. Mobile App Setup

1. **Navigate to mobile directory**:
   ```bash
   cd mobile
   ```

2. **Install dependencies**:
   ```bash
   flutter pub get
   ```

3. **Configure environment**:
   ```bash
   cp env.example .env
   # Edit .env with your Supabase and Firebase credentials
   ```

4. **Run the app**:
   ```bash
   flutter run
   ```

### 4. Web Dashboard Setup

1. **Navigate to web directory**:
   ```bash
   cd web
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Configure environment**:
   ```bash
   cp env.example .env.local
   # Edit .env.local with your Supabase credentials
   ```

4. **Run the development server**:
   ```bash
   npm run dev
   ```

5. **Open in browser**: `http://localhost:3000`

## Environment Configuration

### Mobile App (.env)

```env
# Supabase Configuration
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key

# Firebase Configuration
FIREBASE_PROJECT_ID=your-firebase-project-id
FIREBASE_APP_ID_ANDROID=your-android-app-id
FIREBASE_APP_ID_IOS=your-ios-app-id

# API Configuration
API_BASE_URL=https://your-project.supabase.co/functions/v1

# WhatsApp Configuration
WHATSAPP_ACCESS_TOKEN=your-whatsapp-access-token
WHATSAPP_PHONE_NUMBER_ID=your-phone-number-id
```

### Web Dashboard (.env.local)

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

# API Configuration
NEXT_PUBLIC_API_BASE_URL=https://your-project.supabase.co/functions/v1
```

## Firebase Setup (for Mobile Push Notifications)

1. **Create a Firebase project**:
   - Go to [Firebase Console](https://console.firebase.google.com/)
   - Create a new project
   - Enable Cloud Messaging

2. **Add Android app**:
   - Add Android app with package name: `com.allcrm.app`
   - Download `google-services.json` and place in `mobile/android/app/`

3. **Add iOS app**:
   - Add iOS app with bundle ID: `com.allcrm.app`
   - Download `GoogleService-Info.plist` and place in `mobile/ios/Runner/`

4. **Configure Firebase in Flutter**:
   - Follow the [FlutterFire setup guide](https://firebase.flutter.dev/docs/overview/)

## WhatsApp Business API Setup

1. **Create Meta Developer Account**:
   - Go to [Meta for Developers](https://developers.facebook.com/)
   - Create a new app
   - Add WhatsApp Business API product

2. **Get API Credentials**:
   - Access Token
   - Phone Number ID
   - Webhook Verify Token

3. **Configure in Supabase Edge Functions**:
   - Set environment variables in Supabase dashboard
   - `WHATSAPP_ACCESS_TOKEN`
   - `WHATSAPP_PHONE_NUMBER_ID`

## Database Schema

The application uses the following main tables:

- **organizations**: Company/organization data
- **profiles**: User profile information
- **organization_members**: User-organization relationships with roles
- **customers**: Customer information
- **products**: Product/service catalog
- **invoices**: Invoice data
- **invoice_items**: Invoice line items
- **payments**: Payment records
- **employees**: Employee information
- **attendance**: Attendance tracking
- **payroll**: Payroll calculations
- **whatsapp_campaigns**: WhatsApp marketing campaigns
- **ai_tasks**: AI processing tasks
- **usage_tracking**: Feature usage analytics

## Features Overview

### Core Modules

1. **Authentication & Organization Management**
   - Multi-org support
   - Role-based access control
   - Email/phone authentication

2. **Billing & Invoicing**
   - Create and manage invoices
   - PDF generation
   - Payment tracking
   - GST calculation

3. **WhatsApp CRM**
   - Customer directory
   - Message campaigns
   - Delivery tracking

4. **AI Copilot**
   - OCR invoice scanning
   - Smart reminders
   - Query assistant

5. **Payroll & Attendance**
   - QR code check-in/out
   - Salary calculation
   - Payslip generation

6. **Analytics Dashboard**
   - Sales reports
   - Revenue tracking
   - Performance metrics

## Development Workflow

### Running Tests

```bash
# Mobile tests
cd mobile
flutter test

# Web tests
cd web
npm test
```

### Building for Production

```bash
# Mobile APK
cd mobile
flutter build apk --release

# Web build
cd web
npm run build
```

### Database Management

```bash
# Reset database
cd supabase
supabase db reset

# Create new migration
supabase migration new migration_name

# Apply migrations
supabase db push
```

## Troubleshooting

### Common Issues

1. **Supabase connection issues**:
   - Check if Supabase is running: `supabase status`
   - Verify environment variables
   - Check network connectivity

2. **Flutter build issues**:
   - Run `flutter clean`
   - Run `flutter pub get`
   - Check Flutter version compatibility

3. **Web build issues**:
   - Delete `node_modules` and run `npm install`
   - Check Node.js version
   - Verify environment variables

### Getting Help

- Check the [Flutter documentation](https://flutter.dev/docs)
- Check the [Next.js documentation](https://nextjs.org/docs)
- Check the [Supabase documentation](https://supabase.com/docs)

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License - see the LICENSE file for details.
