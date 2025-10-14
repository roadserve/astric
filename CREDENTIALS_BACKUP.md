# 🔑 Google My Business Credentials

## ⚠️ KEEP THIS FILE SECURE - DO NOT COMMIT TO GIT!

---

## Google Cloud Project Details

**Project Name**: touchnsearch-master-api  
**Project ID**: (check in Google Cloud Console)

---

## OAuth 2.0 Credentials

### Client ID:
```
614145210861-d87gdj9a628k9ubc8rtgn8dikekn28k5.apps.googleusercontent.com
```

### Client Secret:
```
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
```

### API Key:
```
AIzaSyCWtqBu90jMa0b1gqsTIPtoQYzOAlWXJJM
```

---

## Authorized Redirect URIs

**Production:**
```
https://touchnsearch.com/dashboard/gmb/callback
```

**Development:**
```
http://localhost:3000/dashboard/gmb/callback
```

---

## Environment Variables

### For Local Development (web/.env.local):
```bash
NEXT_PUBLIC_GOOGLE_CLIENT_ID=614145210861-d87gdj9a628k9ubc8rtgn8dikekn28k5.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=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
GOOGLE_MY_BUSINESS_API_KEY=AIzaSyCWtqBu90jMa0b1gqsTIPtoQYzOAlWXJJM
GOOGLE_REDIRECT_URI=http://localhost:3000/dashboard/gmb/callback
```

### For Production (Supabase Edge Functions):
```bash
GOOGLE_CLIENT_ID=614145210861-d87gdj9a628k9ubc8rtgn8dikekn28k5.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=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
GOOGLE_MY_BUSINESS_API_KEY=AIzaSyCWtqBu90jMa0b1gqsTIPtoQYzOAlWXJJM
GOOGLE_REDIRECT_URI=https://touchnsearch.com/dashboard/gmb/callback
```

---

## APIs Enabled

- ✅ My Business Business Information API
- ✅ My Business Account Management API
- ✅ Google Maps API

---

## OAuth Scopes

- `https://www.googleapis.com/auth/business.manage`
- `https://www.googleapis.com/auth/userinfo.email`
- `https://www.googleapis.com/auth/userinfo.profile`

---

## Setup Date
Created: October 4, 2025

---

## Next Steps

1. ✅ Credentials obtained
2. ⏳ Add to Supabase Edge Functions
3. ⏳ Test locally
4. ⏳ Deploy to production
5. ⏳ Test GMB connection

---

**🔒 SECURITY NOTE:**
- Never commit these credentials to Git
- Add `.env.local` to `.gitignore`
- Keep this file secure
- Rotate credentials if compromised
