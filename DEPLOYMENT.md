# Deployment Guide

This guide covers deploying the AI SME Copilot application to production.

## Prerequisites

- Supabase project (production)
- Vercel account (for web dashboard)
- Google Cloud/Firebase project
- WhatsApp Business API credentials
- Domain name (optional)

## 1. Supabase Production Setup

### Create Production Project

1. Go to [Supabase Dashboard](https://app.supabase.com/)
2. Create a new project
3. Note down:
   - Project URL
   - Anon/Public key
   - Service role key (keep secure!)

### Apply Database Migrations

```bash
# Link to production project
cd supabase
supabase link --project-ref your-project-ref

# Push migrations
supabase db push

# Apply seed data (optional, for testing)
supabase db seed
```

### Configure Edge Functions

```bash
# Set environment variables
supabase secrets set WHATSAPP_ACCESS_TOKEN=your_token
supabase secrets set WHATSAPP_PHONE_NUMBER_ID=your_phone_id
supabase secrets set WEBHOOK_VERIFY_TOKEN=your_verify_token

# Deploy all functions
supabase functions deploy ai_invoice_parse
supabase functions deploy whatsapp_send
supabase functions deploy create_invoice_pdf
supabase functions deploy file_gst
supabase functions deploy payroll_run
supabase functions deploy ai_reply_suggest
supabase functions deploy usage_billing_job
supabase functions deploy webhook_inbound
```

### Enable Realtime

1. Go to Database → Replication
2. Enable replication for tables that need real-time updates:
   - `invoices`
   - `campaign_recipients`
   - `attendance`

### Set Up Storage Buckets

```sql
-- Create storage buckets
INSERT INTO storage.buckets (id, name, public) 
VALUES ('invoices', 'invoices', false);

INSERT INTO storage.buckets (id, name, public) 
VALUES ('documents', 'documents', false);

-- Set up storage policies
CREATE POLICY "Authenticated users can upload documents"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'documents');

CREATE POLICY "Users can view their org documents"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'documents');
```

## 2. Web Dashboard Deployment (Vercel)

### Configure Environment Variables

Create production environment variables in Vercel:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
NEXT_PUBLIC_API_BASE_URL=https://your-project.supabase.co/functions/v1
NEXT_PUBLIC_APP_NAME=AI SME Copilot
NEXT_PUBLIC_APP_VERSION=1.0.0
```

### Deploy to Vercel

```bash
cd web

# Install Vercel CLI
npm install -g vercel

# Deploy
vercel --prod
```

Or use the Vercel Dashboard:
1. Import your GitHub repository
2. Configure build settings:
   - Framework: Next.js
   - Build Command: `npm run build`
   - Output Directory: `.next`
3. Add environment variables
4. Deploy

### Configure Custom Domain (Optional)

1. Go to Vercel Dashboard → Settings → Domains
2. Add your custom domain
3. Update DNS records as instructed

## 3. Mobile App Deployment

### Android

#### Configure Release Build

1. Create `mobile/android/key.properties`:
```properties
storePassword=your_store_password
keyPassword=your_key_password
keyAlias=your_key_alias
storeFile=your_keystore_path
```

2. Update `mobile/android/app/build.gradle`:
```gradle
android {
    ...
    signingConfigs {
        release {
            keyAlias keystoreProperties['keyAlias']
            keyPassword keystoreProperties['keyPassword']
            storeFile keystoreProperties['storeFile'] ? file(keystoreProperties['storeFile']) : null
            storePassword keystoreProperties['storePassword']
        }
    }
    buildTypes {
        release {
            signingConfig signingConfigs.release
        }
    }
}
```

3. Build release APK:
```bash
cd mobile
flutter build apk --release
```

4. Build App Bundle (for Play Store):
```bash
flutter build appbundle --release
```

#### Deploy to Google Play Store

1. Go to [Google Play Console](https://play.google.com/console)
2. Create a new app
3. Complete store listing
4. Upload app bundle
5. Set up internal testing → closed testing → production

### iOS

#### Configure Release Build

1. Open `mobile/ios/Runner.xcworkspace` in Xcode
2. Update Bundle Identifier
3. Configure signing with your Apple Developer account
4. Update version and build number

#### Build for iOS

```bash
cd mobile
flutter build ipa --release
```

#### Deploy to App Store

1. Open Xcode
2. Product → Archive
3. Upload to App Store Connect
4. Submit for review

## 4. Firebase Configuration

### Set Up Cloud Messaging

1. Go to Firebase Console → Cloud Messaging
2. Upload APNs certificate (iOS)
3. Configure Android app with SHA keys
4. Set up topics for targeted notifications

### Deploy FCM Token Management

Add token management in your app:

```dart
final token = await FirebaseMessaging.instance.getToken();
// Send token to Supabase
await supabase.from('user_fcm_tokens').upsert({
  'user_id': userId,
  'token': token,
  'platform': Platform.isAndroid ? 'android' : 'ios',
});
```

## 5. WhatsApp Business API Setup

### Configure Webhook

1. In Meta Developer Console:
   - Set Callback URL: `https://your-project.supabase.co/functions/v1/webhook_inbound`
   - Set Verify Token: your webhook verify token
   - Subscribe to: `messages`, `message_status`

2. Test webhook:
```bash
curl -X GET 'https://your-project.supabase.co/functions/v1/webhook_inbound?hub.mode=subscribe&hub.verify_token=your_token&hub.challenge=test'
```

### Configure Phone Number

1. Add business phone number in Meta console
2. Verify phone number
3. Set up message templates
4. Get approval for templates

## 6. Monitoring and Analytics

### Set Up Sentry (Error Tracking)

```bash
# Install Sentry
npm install @sentry/nextjs
flutter pub add sentry_flutter

# Configure Sentry
# web/sentry.client.config.js
# mobile/lib/main.dart
```

### Enable Supabase Logs

1. Go to Supabase Dashboard → Logs
2. Set up log retention
3. Configure alerts for errors

### Set Up Uptime Monitoring

Use services like:
- Better Uptime
- Pingdom
- UptimeRobot

Monitor:
- Web dashboard
- API endpoints
- Edge functions
- Database health

## 7. Backup and Recovery

### Database Backups

Supabase Pro provides automatic daily backups. For additional safety:

```bash
# Manual backup
pg_dump -h db.your-project.supabase.co -U postgres > backup.sql

# Restore
psql -h db.your-project.supabase.co -U postgres < backup.sql
```

### Storage Backups

Set up periodic backups of storage buckets using Supabase CLI or custom scripts.

## 8. Performance Optimization

### Enable CDN

- Vercel automatically provides CDN for web assets
- Configure caching headers for static content

### Database Optimization

```sql
-- Add additional indexes for frequently queried data
CREATE INDEX CONCURRENTLY idx_invoices_customer_status 
ON invoices(customer_id, status) 
WHERE status != 'cancelled';

-- Enable query performance insights
```

### Edge Function Optimization

- Keep functions small and focused
- Use connection pooling for database queries
- Cache frequently accessed data
- Set appropriate timeout values

## 9. Security Checklist

- [ ] Enable RLS policies on all tables
- [ ] Rotate service role key regularly
- [ ] Use environment variables for secrets
- [ ] Enable HTTPS only
- [ ] Configure CORS properly
- [ ] Set up rate limiting
- [ ] Enable 2FA for admin accounts
- [ ] Regular security audits
- [ ] Keep dependencies updated
- [ ] Monitor for suspicious activity

## 10. Post-Deployment

### Testing Checklist

- [ ] User authentication flow
- [ ] Invoice creation and PDF generation
- [ ] WhatsApp message sending
- [ ] Payment recording
- [ ] Payroll calculation
- [ ] AI features (OCR, suggestions)
- [ ] Mobile push notifications
- [ ] Email notifications
- [ ] Data synchronization
- [ ] Offline functionality (mobile)

### User Onboarding

1. Create documentation/help center
2. Set up in-app tutorials
3. Create video guides
4. Provide support channels

### Marketing

1. Update landing page
2. Announce launch
3. Set up analytics (Google Analytics, Mixpanel)
4. Configure conversion tracking

## Maintenance

### Regular Tasks

- Monitor error logs daily
- Review performance metrics weekly
- Update dependencies monthly
- Review and optimize database queries
- Check backup integrity
- Review user feedback

### Scaling Considerations

When you need to scale:
- Upgrade Supabase plan for more resources
- Implement caching layer (Redis)
- Consider read replicas for database
- Optimize expensive queries
- Use queue system for heavy tasks

## Support

For issues during deployment:
- Check Supabase logs
- Review Edge Function logs
- Test API endpoints individually
- Verify environment variables
- Check RLS policies
- Review CORS configuration

## Cost Optimization

- Monitor Supabase usage dashboard
- Set up billing alerts
- Review and optimize API calls
- Implement request caching
- Use connection pooling
- Optimize image sizes
- Enable compression

---

**Note**: This is a comprehensive deployment guide. Adjust based on your specific requirements and infrastructure preferences.
