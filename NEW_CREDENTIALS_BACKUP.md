# 🔑 New Google Cloud Credentials

## ⚠️ KEEP THIS FILE SECURE - DO NOT COMMIT TO GIT!

---

## Google Cloud Project - New Account

**Project ID:** (check in Google Cloud Console)  
**Google Account:** (your email)  
**Created:** October 4, 2025

---

## OAuth 2.0 Credentials

### Client ID:
```
691497466571-ubn88sgthaj789qqlfs84uvk1otg6b0c.apps.googleusercontent.com
```

### Client Secret:
```
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
```

### API Key:
```
AIzaSyCvWG5qs-VkPqSf0lWqjV-eggBrgRv74DA
```

---

## Authorized Redirect URIs

Make sure these are added in Google Cloud Console:

**Development:**
```
http://localhost:3000/dashboard/gmb/callback
```

**Production:**
```
https://touchnsearch.com/dashboard/gmb/callback
```

---

## Required APIs Status

- [ ] My Business Business Information API - Enable
- [ ] My Business Account Management API - Enable
- [ ] Google Maps API - Enable
- [ ] Billing - Enable (Important!)

---

## Supabase Edge Functions Secrets

Add these in Supabase Dashboard → Edge Functions → Secrets:

```bash
GOOGLE_CLIENT_ID=691497466571-ubn88sgthaj789qqlfs84uvk1otg6b0c.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=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
GOOGLE_MY_BUSINESS_API_KEY=AIzaSyCvWG5qs-VkPqSf0lWqjV-eggBrgRv74DA
GOOGLE_REDIRECT_URI=http://localhost:3000/dashboard/gmb/callback
```

---

## Next Steps

1. ✅ Credentials saved
2. ⏳ Update Supabase secrets
3. ⏳ Update local .env.local file
4. ⏳ Verify Google Cloud APIs are enabled
5. ⏳ Verify billing is enabled
6. ⏳ Redeploy edge functions
7. ⏳ Clear browser cache
8. ⏳ Test GMB connection

---

## Important Notes

- **Billing Status:** Make sure billing is enabled in Google Cloud
- **Quotas:** Check that API quotas are not 0
- **OAuth Consent:** Make sure test users are added
- **Redirect URIs:** Must match exactly (no trailing slashes)

---

**🔒 SECURITY:** Never share these credentials publicly!

