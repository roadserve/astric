# 🔧 Automation System Environment Setup

This guide explains how to set up environment variables for the automation system to work properly.

---

## 📋 Required Environment Variables

### **1. n8n Configuration**

The automation system integrates with n8n for workflow execution. You need to set up n8n and configure the following variables:

```env
# n8n API Configuration
N8N_API_URL=http://localhost:5678/api/v1
N8N_API_KEY=your_n8n_api_key_here

# n8n Webhook Base URL (for webhook triggers)
NEXT_PUBLIC_N8N_WEBHOOK_BASE=http://localhost:5678/webhook
```

#### **How to Get n8n API Key:**

1. Install n8n:
   ```bash
   npm install -g n8n
   ```

2. Run n8n:
   ```bash
   n8n start
   ```

3. Open n8n at `http://localhost:5678`

4. Go to **Settings** → **API** → **Create API Key**

5. Copy the API key and paste it in your `.env.local` file

---

### **2. Supabase Configuration**

Already configured if you have the CRM running:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
```

---

## 🚀 Setup Steps

### **Step 1: Install and Configure n8n**

**Option A: Local Installation (Development)**

```bash
# Install n8n globally
npm install -g n8n

# Start n8n
n8n start

# Access n8n at http://localhost:5678
```

**Option B: Docker Installation (Recommended for Production)**

```bash
# Pull n8n docker image
docker pull n8nio/n8n

# Run n8n container
docker run -it --rm \
  --name n8n \
  -p 5678:5678 \
  -v ~/.n8n:/home/node/.n8n \
  n8nio/n8n
```

**Option C: Self-Hosted (Production)**

```bash
# Clone n8n
git clone https://github.com/n8n-io/n8n.git
cd n8n

# Install dependencies
npm install

# Build
npm run build

# Start
npm start
```

---

### **Step 2: Create n8n API Key**

1. Open n8n: `http://localhost:5678`
2. Click on **Settings** (gear icon)
3. Navigate to **API**
4. Click **Create API Key**
5. Give it a name: "CRM Automation"
6. Copy the generated API key

---

### **Step 3: Configure Environment Variables**

Create or update `.env.local` in your `web` directory:

```env
# n8n Configuration
N8N_API_URL=http://localhost:5678/api/v1
N8N_API_KEY=n8n_api_xxxxxxxxxxxxxxxxxxxxxxxxx
NEXT_PUBLIC_N8N_WEBHOOK_BASE=http://localhost:5678/webhook

# Supabase (if not already configured)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

---

### **Step 4: Run Database Migrations**

Make sure all automation tables are created:

```sql
-- Run these SQL files in your Supabase SQL Editor:
-- 1. supabase/create_automation_tables.sql
-- 2. supabase/add_advanced_automation_features.sql
```

Or use the Supabase CLI:

```bash
cd supabase
supabase db push
```

---

### **Step 5: Restart Your Application**

```bash
cd web
npm run dev
```

---

## 🔒 Production Configuration

### **For Production Deployment:**

#### **1. Use Environment Variables (Not .env.local)**

Configure these in your hosting platform (Vercel, Netlify, etc.):

```
N8N_API_URL=https://your-n8n-instance.com/api/v1
N8N_API_KEY=your_production_api_key
NEXT_PUBLIC_N8N_WEBHOOK_BASE=https://your-n8n-instance.com/webhook
```

#### **2. Secure n8n Instance**

- Deploy n8n behind a reverse proxy (Nginx/Cloudflare)
- Enable HTTPS/SSL
- Set up authentication
- Use environment variables for secrets
- Enable webhook authentication

#### **3. n8n Production Deployment Options**

**Option A: Railway**
```bash
# Deploy to Railway.app
railway up
```

**Option B: DigitalOcean**
```bash
# Use n8n one-click app
# Or deploy via Docker
```

**Option C: AWS/GCP/Azure**
```bash
# Deploy via Docker/Kubernetes
# Configure load balancer
# Set up auto-scaling
```

---

## 🧪 Testing the Setup

### **1. Test n8n Connection**

```bash
# Check if n8n is running
curl http://localhost:5678/healthz

# Test API connection
curl -X GET http://localhost:5678/api/v1/workflows \
  -H "X-N8N-API-KEY: your_api_key"
```

### **2. Test Automation System**

1. Go to `/dashboard/automation` in your CRM
2. Click **Create Workflow**
3. Add a simple workflow with:
   - Manual Trigger
   - HTTP Request node
4. Save the workflow
5. Click **Test** button
6. Check execution logs

---

## 🐛 Troubleshooting

### **Issue: "n8n API error" when saving workflows**

**Solution:**
- Check if n8n is running: `http://localhost:5678`
- Verify `N8N_API_URL` in `.env.local`
- Check `N8N_API_KEY` is correct
- Restart both n8n and your Next.js app

### **Issue: "Workflow not configured in n8n"**

**Solution:**
- Make sure workflow was saved successfully
- Check `n8n_workflow_id` column in `automation_workflows` table
- Try creating a new workflow

### **Issue: "Monthly execution limit reached"**

**Solution:**
- Check `automation_subscriptions` table
- Increase `max_executions_per_month` for your organization
- Or wait for monthly reset

### **Issue: "Webhook URL not working"**

**Solution:**
- Verify `NEXT_PUBLIC_N8N_WEBHOOK_BASE` is correct
- Check webhook node configuration in workflow
- Enable webhook endpoint in n8n settings

---

## 📚 Additional Resources

- [n8n Documentation](https://docs.n8n.io/)
- [n8n API Reference](https://docs.n8n.io/api/)
- [Supabase Documentation](https://supabase.com/docs)
- [Next.js Environment Variables](https://nextjs.org/docs/basic-features/environment-variables)

---

## 🎯 Quick Start Checklist

- [ ] Install n8n locally or deploy it
- [ ] Create n8n API key
- [ ] Add environment variables to `.env.local`
- [ ] Run database migrations
- [ ] Restart your application
- [ ] Test by creating a simple workflow
- [ ] Check execution logs

---

## 💡 Pro Tips

1. **Use separate n8n instances** for development and production
2. **Enable n8n logs** for debugging: `n8n start --log-level debug`
3. **Backup n8n workflows** regularly
4. **Monitor n8n performance** in production
5. **Use n8n webhook authentication** for security
6. **Set up n8n email notifications** for errors

---

**Need Help?**
- Check n8n community forum: https://community.n8n.io/
- Review automation logs in `/dashboard/automation/analytics`
- Check browser console for errors
- Review n8n server logs

