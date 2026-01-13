# 🚀 Deploy to touchnsearch.com on Hostinger

This guide will help you deploy your AI SME Copilot CRM application to your touchnsearch.com domain on Hostinger.

## 📋 Prerequisites

- ✅ Domain: touchnsearch.com (already registered and active)
- ✅ Hostinger account with hosting plan
- ✅ Supabase project configured
- ✅ Local development environment set up

## 🔧 Step 1: Prepare Your Application

### 1.1 Update Environment Variables

1. **Get your Supabase credentials:**
   - Go to your Supabase project dashboard
   - Navigate to Settings > API
   - Copy your Project URL and anon/public key

2. **Update production environment:**
   ```bash
   # Edit web/.env.production
   NEXT_PUBLIC_SUPABASE_URL=your_actual_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_actual_supabase_anon_key
   NEXT_PUBLIC_SITE_URL=https://touchnsearch.com
   ```

### 1.2 Build Your Application

```bash
cd web
npm install
npm run build
```

This creates an `out` folder with your static files.

## 🌐 Step 2: Configure Hostinger

### 2.1 Access Hostinger File Manager

1. Log into your Hostinger control panel
2. Go to **Websites** → **Manage**
3. Click on **File Manager**

### 2.2 Upload Your Files

1. **Navigate to public_html folder** (this is your website root)
2. **Delete any existing files** (like index.html, etc.)
3. **Upload the contents of the `out` folder** to public_html
   - Upload all files and folders from `web/out/` to `public_html/`

### 2.3 Set Up .htaccess (if not already uploaded)

The .htaccess file should already be in your web folder. If not, create it in public_html with the content from `web/.htaccess`.

## 🔗 Step 3: Configure Domain Settings

### 3.1 Update DNS Settings

In your Hostinger control panel:

1. Go to **Domains** → **touchnsearch.com** → **DNS / Nameservers**
2. **Current nameservers:** ns1.dns-parking.com, ns2.dns-parking.com
3. **Change to Hostinger nameservers:**
   - ns1.dns-parking.com → ns1.dns-parking.com (keep as is)
   - ns2.dns-parking.com → ns2.dns-parking.com (keep as is)

### 3.2 Configure Domain in Hostinger

1. Go to **Websites** → **Manage**
2. **Add Domain:** touchnsearch.com
3. **Point to:** public_html folder
4. **Enable SSL:** Yes (Hostinger provides free SSL)

## 🔒 Step 4: SSL Configuration

1. In Hostinger control panel, go to **SSL**
2. **Enable SSL** for touchnsearch.com
3. **Force HTTPS** redirect
4. Wait 5-10 minutes for SSL to activate

## 🚀 Step 5: Deploy and Test

### 5.1 Upload Files

```bash
# From your local machine, in the web folder:
npm run build

# Then upload the contents of the 'out' folder to public_html
```

### 5.2 Test Your Deployment

1. **Visit:** https://touchnsearch.com
2. **Check:** All pages load correctly
3. **Test:** Login/registration functionality
4. **Verify:** Supabase connection works

## 🔧 Step 6: Configure Supabase for Production

### 6.1 Update Supabase Settings

1. Go to your Supabase project dashboard
2. **Settings** → **API**
3. **Add to Site URL:** https://touchnsearch.com
4. **Add to Redirect URLs:**
   - https://touchnsearch.com/auth/callback
   - https://touchnsearch.com/dashboard

### 6.2 Update RLS Policies

Make sure your Row Level Security policies allow access from the production domain.

## 📱 Step 7: Mobile App Configuration

Update your mobile app to point to the production API:

```dart
// In mobile/lib/core/config/app_config.dart
const String baseUrl = 'https://touchnsearch.com';
const String supabaseUrl = 'your_supabase_url';
const String supabaseAnonKey = 'your_supabase_anon_key';
```

## 🎯 Step 8: Final Checklist

- [ ] Domain points to Hostinger hosting
- [ ] SSL certificate is active
- [ ] All files uploaded to public_html
- [ ] .htaccess file is in place
- [ ] Environment variables are set correctly
- [ ] Supabase is configured for production
- [ ] Website loads at https://touchnsearch.com
- [ ] All features work correctly
- [ ] Mobile app connects to production

## 🆘 Troubleshooting

### Common Issues:

1. **404 Errors:** Check .htaccess file is uploaded
2. **Supabase Connection:** Verify environment variables
3. **SSL Issues:** Wait 10-15 minutes after enabling
4. **CORS Errors:** Update Supabase site URL settings

### Support:

- **Hostinger Support:** Available 24/7 in control panel
- **Supabase Docs:** https://supabase.com/docs
- **Next.js Deployment:** https://nextjs.org/docs/deployment

## 🎉 Success!

Your AI SME Copilot CRM is now live at **https://touchnsearch.com**!

---

**Next Steps:**
- Set up Google Analytics
- Configure email notifications
- Set up automated backups
- Monitor performance and usage
