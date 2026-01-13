# 🏢 Google My Business Integration - Feature Guide

## Overview

The GMB integration allows you to connect and manage multiple Google Business Profile locations from one centralized dashboard. Update all your profiles at once, manage reviews, create posts, and track insights across all locations.

---

## ✨ Key Features

### 1. **Connect Multiple Google Accounts**
- Connect one or more Google accounts
- Automatically import all business locations
- Secure OAuth 2.0 authentication
- Token refresh handling

### 2. **Bulk Profile Updates**
Update all locations simultaneously:
- **Business Description**: Update description for all locations
- **Phone Number**: Change phone number across all profiles
- **Website URL**: Update website for all locations
- **Business Hours**: Set consistent hours
- **Attributes**: Add/remove attributes (WiFi, Parking, etc.)

### 3. **Centralized Post Management**
- Create posts once, publish to multiple locations
- Support for different post types:
  - Standard posts
  - Event posts
  - Offer posts
  - Product posts
- Schedule posts for optimal timing
- Track post performance

### 4. **Review Management**
- View all reviews from all locations in one place
- Reply to reviews in bulk
- Filter by rating and location
- Track response rates
- AI-powered reply suggestions

### 5. **Analytics & Insights**
- Aggregate metrics across all locations
- Track views, searches, and actions
- Compare location performance
- Export reports

---

## 🗄️ Database Schema

### Tables Created:

1. **gmb_accounts**: Connected Google accounts
2. **gmb_locations**: Business locations/profiles
3. **gmb_bulk_updates**: Bulk update queue and history
4. **gmb_posts**: Posts across locations
5. **gmb_reviews**: Synced reviews from all locations
6. **gmb_insights**: Analytics data

---

## 🔧 Setup Instructions

### Step 1: Run Database Migration

Go to your Supabase SQL Editor and run:
```sql
-- Copy and paste from: supabase/migrations/20231201000005_gmb_integration.sql
```

### Step 2: Configure Google Cloud Project

1. **Go to Google Cloud Console**: https://console.cloud.google.com/
2. **Create a new project** or select existing
3. **Enable APIs**:
   - Google My Business API
   - Google My Business Account Management API
   - Google My Business Business Information API
4. **Create OAuth 2.0 Credentials**:
   - Go to APIs & Services → Credentials
   - Create OAuth 2.0 Client ID
   - Application type: Web application
   - Authorized redirect URIs: 
     - `http://localhost:3000/api/auth/google/callback`
     - `https://your-domain.com/api/auth/google/callback`
5. **Note down**:
   - Client ID
   - Client Secret

### Step 3: Configure Environment Variables

Add to your `.env.local` (web) and `.env` (mobile):

```env
# Google OAuth
GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-client-secret
GOOGLE_REDIRECT_URI=http://localhost:3000/api/auth/google/callback

# Google My Business API
GOOGLE_GMB_API_KEY=your-api-key
```

### Step 4: Deploy Edge Functions

```bash
cd supabase
supabase functions deploy gmb_connect
supabase functions deploy gmb_bulk_update
supabase functions deploy gmb_sync_reviews
supabase functions deploy gmb_create_post
```

---

## 📱 How to Use

### Mobile App

1. **Navigate to GMB Dashboard**:
   - Open app → Settings → Google My Business
   - Or add to main navigation

2. **Connect Google Account**:
   - Tap "Connect Google Account"
   - Sign in with Google
   - Grant permissions
   - Your locations will be imported automatically

3. **Bulk Update Profiles**:
   - Tap "Bulk Update Profiles"
   - Select update type (description, phone, etc.)
   - Enter new information
   - Select locations to update
   - Tap "Update All"

4. **View Results**:
   - See success/failure count
   - Review any errors
   - Changes reflected immediately

### Web Dashboard

1. **Access GMB Dashboard**:
   - Go to: http://localhost:3000/dashboard/gmb
   - Or navigate from main dashboard

2. **Connect Account**:
   - Click "Connect Account"
   - Authorize with Google
   - Locations imported automatically

3. **Bulk Update**:
   - Select update type from dropdown
   - Enter new information
   - Check locations to update
   - Click "Update X Location(s)"

4. **View Locations**:
   - See all locations in grid view
   - View verification status
   - Quick access to edit individual locations

---

## 🎯 Use Cases

### 1. **Update Business Hours for Holiday**
- Select "Business Hours"
- Set holiday hours
- Select all locations
- Update all at once

### 2. **Change Phone Number**
- Select "Phone Number"
- Enter new phone
- Select relevant locations
- Update instantly

### 3. **Update Description for Promotion**
- Select "Business Description"
- Write promotional description
- Select all locations
- Publish to all profiles

### 4. **Add New Attribute**
- Select "Business Attributes"
- Choose attributes (WiFi, Parking, etc.)
- Select locations
- Update all profiles

### 5. **Create Festive Post**
- Go to "Create Post"
- Write festive message
- Add images
- Select all locations
- Schedule or publish immediately

---

## 🔄 API Integration

### Google My Business API Endpoints Used:

1. **Account Management API**:
   - `GET /v1/accounts` - List accounts
   - `GET /v1/accounts/{accountId}/locations` - List locations

2. **Business Information API**:
   - `PATCH /v1/locations/{locationId}` - Update location
   - `GET /v1/locations/{locationId}` - Get location details

3. **Posts API**:
   - `POST /v4/accounts/{accountId}/locations/{locationId}/localPosts` - Create post
   - `GET /v4/accounts/{accountId}/locations/{locationId}/localPosts` - List posts

4. **Reviews API**:
   - `GET /v4/accounts/{accountId}/locations/{locationId}/reviews` - Get reviews
   - `PUT /v4/accounts/{accountId}/locations/{locationId}/reviews/{reviewId}/reply` - Reply to review

---

## 🔐 Security

- OAuth 2.0 for authentication
- Encrypted token storage
- Automatic token refresh
- Row Level Security (RLS) policies
- Audit logs for all updates

---

## 📊 Features Included

### ✅ Implemented
- [x] Connect Google accounts
- [x] Import business locations
- [x] Bulk update descriptions
- [x] Bulk update phone numbers
- [x] Bulk update websites
- [x] Bulk update hours
- [x] Bulk update attributes
- [x] Sync reviews
- [x] Create posts across locations
- [x] Track update history

### 🔜 Coming Soon
- [ ] AI-generated post content
- [ ] Automated review responses
- [ ] Photo management across locations
- [ ] Q&A management
- [ ] Booking integration
- [ ] Product catalog sync

---

## 💡 Pro Tips

1. **Regular Sync**: Sync reviews and insights daily
2. **Consistent Branding**: Use bulk updates to maintain consistency
3. **Respond to Reviews**: Use AI suggestions for quick responses
4. **Schedule Posts**: Plan content calendar in advance
5. **Monitor Insights**: Track which locations perform best

---

## 🆘 Troubleshooting

### Connection Issues
- Verify Google Cloud project is set up correctly
- Check OAuth credentials
- Ensure APIs are enabled
- Verify redirect URIs match

### Update Failures
- Check token expiration
- Verify location IDs are correct
- Ensure you have edit permissions
- Check API quotas

### Sync Issues
- Refresh access tokens
- Check network connectivity
- Verify API permissions
- Review error logs

---

## 📈 Benefits

### Time Savings
- Update 10+ locations in seconds instead of hours
- Automated review syncing
- Bulk post creation

### Consistency
- Ensure all locations have same information
- Maintain brand consistency
- Synchronized updates

### Insights
- Aggregate analytics across locations
- Compare performance
- Identify top-performing locations

### Efficiency
- Manage everything from one dashboard
- No need to log into multiple accounts
- Streamlined workflow

---

## 🎯 Example Workflows

### Workflow 1: New Promotion Launch
1. Create promotional description
2. Select all locations
3. Bulk update descriptions
4. Create promotional post
5. Publish to all locations
6. Track engagement

### Workflow 2: Holiday Hours Update
1. Set holiday hours
2. Select all locations
3. Bulk update hours
4. Create holiday post
5. Monitor customer queries

### Workflow 3: Review Management
1. Sync all reviews
2. Filter by unresponded
3. Use AI to generate responses
4. Reply in bulk
5. Track response rate

---

## 📞 API Rate Limits

Google My Business API has rate limits:
- **Queries**: 10,000 per day
- **Updates**: 1,000 per day per location
- **Posts**: 100 per day per location

The app handles rate limiting automatically and queues updates if needed.

---

## ✨ Summary

The GMB integration provides a powerful, centralized way to manage all your Google Business Profiles. Save time, maintain consistency, and improve your online presence across all locations!

**Access the feature:**
- Web: http://localhost:3000/dashboard/gmb
- Mobile: Settings → Google My Business

---

**Start managing your business profiles smarter today!** 🚀
