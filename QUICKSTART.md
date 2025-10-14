# AI SME Copilot - Quick Start Guide

Get up and running with AI SME Copilot in under 15 minutes!

## Prerequisites

Before you begin, make sure you have:
- ✅ Node.js 18+ installed
- ✅ Flutter SDK (latest stable)
- ✅ Supabase CLI
- ✅ A Supabase account
- ✅ Git installed

## 5-Minute Setup

### Step 1: Clone the Repository

```bash
git clone <repository-url>
cd all_crm
```

### Step 2: Set Up Supabase

```bash
# Install Supabase CLI if not already installed
npm install -g supabase

# Start Supabase locally
cd supabase
supabase start

# This will output:
# - API URL: http://localhost:54321
# - Anon key: your-anon-key
# - Service role key: your-service-role-key
```

**Note these values** - you'll need them in the next steps.

### Step 3: Configure Mobile App

```bash
cd ../mobile

# Copy environment example
cp env.example .env

# Edit .env and add your Supabase credentials
# SUPABASE_URL=http://localhost:54321
# SUPABASE_ANON_KEY=your-anon-key-from-step-2

# Install dependencies
flutter pub get
```

### Step 4: Configure Web Dashboard

```bash
cd ../web

# Copy environment example
cp env.example .env.local

# Edit .env.local and add your Supabase credentials
# NEXT_PUBLIC_SUPABASE_URL=http://localhost:54321
# NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-from-step-2

# Install dependencies
npm install
```

### Step 5: Run the Applications

**Terminal 1 - Mobile App:**
```bash
cd mobile
flutter run
```

**Terminal 2 - Web Dashboard:**
```bash
cd web
npm run dev
```

**Terminal 3 - Supabase (if not already running):**
```bash
cd supabase
supabase start
```

## 🎉 You're Ready!

- **Mobile App**: Should open in your emulator/device
- **Web Dashboard**: Open http://localhost:3000 in your browser
- **Supabase Studio**: Open http://localhost:54323 for database management

## First Steps After Setup

### 1. Create Your Account

1. Open the mobile app or web dashboard
2. Click "Create Account"
3. Fill in your details:
   - Full Name
   - Email
   - Password
4. Click "Sign Up"

### 2. Create Your Organization

1. After login, you'll be prompted to create an organization
2. Fill in:
   - Organization Name
   - GSTIN (optional)
   - Business Address
   - Contact Details
3. Save

### 3. Add Your First Customer

**Mobile:**
- Go to Customers tab
- Tap the + button
- Fill in customer details
- Save

**Web:**
- Navigate to Customers
- Click "Add Customer"
- Fill in details
- Submit

### 4. Create Your First Invoice

**Mobile:**
- Go to Billing tab
- Tap "Create Invoice"
- Select customer
- Add line items
- Review and save

**Web:**
- Go to Invoices
- Click "Create Invoice"
- Fill in details
- Generate PDF

### 5. Try AI Features

**Scan Invoice (Mobile):**
- Go to AI Copilot
- Tap "Scan Invoice"
- Take photo of invoice
- Review extracted data

**Smart Reminders:**
- AI will automatically detect overdue invoices
- Check notifications for smart reminders

## Common Commands

### Database Management

```bash
# Reset database (WARNING: deletes all data)
cd supabase
supabase db reset

# Create new migration
supabase migration new migration_name

# View database in browser
# Go to http://localhost:54323
```

### Development

```bash
# Mobile - Hot Reload
# Just save your files, Flutter will auto-reload

# Web - Auto Refresh
# npm run dev has hot module replacement

# Supabase - Deploy Functions
cd supabase
supabase functions deploy function_name
```

### Testing

```bash
# Mobile Tests
cd mobile
flutter test

# Web Tests
cd web
npm test

# E2E Tests
cd mobile
flutter drive --target=test_driver/app.dart
```

## Sample Data

The database comes pre-loaded with sample data:
- 1 organization (TechCorp Solutions)
- 2 customers (ABC Enterprises, XYZ Industries)
- 3 products/services
- 1 sample invoice
- 1 employee
- 1 WhatsApp campaign

You can view and modify this data in Supabase Studio.

## Troubleshooting

### Supabase Won't Start

```bash
# Check if ports are available
lsof -i :54321  # API port
lsof -i :54323  # Studio port

# If ports are in use, stop Supabase and restart
supabase stop
supabase start
```

### Flutter Build Issues

```bash
# Clean and rebuild
flutter clean
flutter pub get
flutter run
```

### Web Build Issues

```bash
# Clear cache and reinstall
rm -rf node_modules
rm package-lock.json
npm install
npm run dev
```

### Database Connection Issues

1. Check if Supabase is running: `supabase status`
2. Verify environment variables in `.env` files
3. Check network connectivity
4. Restart Supabase: `supabase stop && supabase start`

## Next Steps

### Explore Features

1. **Billing**: Create invoices, track payments
2. **GST**: Generate GST reports
3. **Payroll**: Add employees, track attendance
4. **WhatsApp**: Send marketing campaigns
5. **AI**: Try OCR, smart reminders
6. **Analytics**: View business insights

### Customize

1. **Branding**: Update logo and colors in settings
2. **Invoice Template**: Customize PDF template
3. **Email Templates**: Modify notification emails
4. **Roles**: Set up team members with roles

### Deploy to Production

When ready to deploy:
1. Read `DEPLOYMENT.md` for detailed instructions
2. Create production Supabase project
3. Deploy web dashboard to Vercel
4. Publish mobile apps to stores
5. Configure production API keys

## Learning Resources

### Documentation
- `README.md` - Project overview
- `SETUP.md` - Detailed setup guide
- `FEATURES.md` - Complete feature list
- `PROJECT_STRUCTURE.md` - Architecture details
- `DEPLOYMENT.md` - Production deployment

### Video Tutorials
- Getting Started (5 min)
- Creating Your First Invoice (3 min)
- WhatsApp Campaign Setup (7 min)
- Using AI Features (10 min)
- Monthly GST Filing (8 min)

### API Documentation
- REST API Reference
- WebSocket Events
- Webhook Configuration
- SDK Documentation

## Getting Help

### Support Channels
- 📧 Email: support@aismecopilot.com
- 💬 Discord: discord.gg/aismecopilot
- 📚 Docs: docs.aismecopilot.com
- 🐛 Issues: github.com/aismecopilot/issues

### Community
- Forum: community.aismecopilot.com
- Stack Overflow: Tag `ai-sme-copilot`
- Twitter: @aismecopilot

## Pro Tips

### Mobile Development
1. Use hot reload (save file) for quick iteration
2. Use Flutter DevTools for debugging
3. Test on real devices for best experience
4. Enable debug mode for detailed logs

### Web Development
1. Use React DevTools for component inspection
2. Check Network tab for API calls
3. Use Lighthouse for performance audits
4. Test responsive design on different screens

### Database
1. Use Supabase Studio for visual queries
2. Check RLS policies if data isn't showing
3. Monitor query performance in dashboard
4. Use database functions for complex logic

### Performance
1. Enable caching for frequently accessed data
2. Use pagination for large lists
3. Optimize images before upload
4. Minimize API calls with batch requests

## Keyboard Shortcuts

### Web Dashboard
- `Ctrl/Cmd + K` - Quick search
- `Ctrl/Cmd + N` - New invoice
- `Ctrl/Cmd + ,` - Settings
- `Ctrl/Cmd + /` - Help

### Mobile App
- Swipe left - Delete item
- Pull down - Refresh
- Long press - More options
- Double tap - Quick action

## What's Next?

Now that you're set up, here are some suggested paths:

### For Business Users
1. Set up your organization profile
2. Import customer data
3. Create your first invoice
4. Send a WhatsApp campaign
5. Review analytics

### For Developers
1. Explore the codebase structure
2. Understand the database schema
3. Try creating a new feature
4. Write tests for your code
5. Contribute to the project

### For DevOps
1. Set up CI/CD pipeline
2. Configure monitoring
3. Set up staging environment
4. Plan production deployment
5. Configure backups

## Success Checklist

- [ ] Supabase running locally
- [ ] Mobile app running on device/emulator
- [ ] Web dashboard accessible in browser
- [ ] Account created successfully
- [ ] Organization set up
- [ ] First customer added
- [ ] First invoice created
- [ ] Sample data visible
- [ ] All tabs/pages loading correctly
- [ ] No console errors

## Congratulations! 🎊

You've successfully set up AI SME Copilot! You're now ready to streamline your business operations with AI-powered tools.

Happy coding! 🚀
