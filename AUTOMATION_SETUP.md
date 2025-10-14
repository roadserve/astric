# 🚀 Automation Feature Setup Guide

## Overview

This guide will help you set up the n8n automation feature in your AI SME Copilot platform.

---

## 📋 **Step 1: Run Database Migration**

Run the SQL script to create all necessary tables:

```sql
-- In Supabase SQL Editor, run:
supabase/create_automation_tables.sql
```

This creates:
- ✅ `automation_workflows` - Store customer workflows
- ✅ `automation_executions` - Track execution logs
- ✅ `automation_subscriptions` - Manage pricing tiers
- ✅ `automation_templates` - Pre-built workflow templates

---

## 🐳 **Step 2: Deploy n8n (Choose One Option)**

### **Option A: Docker (Self-Hosted - Recommended)**

1. **Create `docker-compose.yml`:**

```yaml
version: '3.8'

services:
  n8n:
    image: n8nio/n8n:latest
    restart: always
    ports:
      - "5678:5678"
    environment:
      - N8N_BASIC_AUTH_ACTIVE=true
      - N8N_BASIC_AUTH_USER=admin
      - N8N_BASIC_AUTH_PASSWORD=${N8N_PASSWORD}
      - N8N_HOST=${N8N_HOST}
      - N8N_PORT=5678
      - N8N_PROTOCOL=https
      - NODE_ENV=production
      - WEBHOOK_URL=https://${N8N_HOST}/
      - GENERIC_TIMEZONE=Asia/Kolkata
    volumes:
      - n8n_data:/home/node/.n8n
    networks:
      - n8n_network

  # Optional: Nginx reverse proxy
  nginx:
    image: nginx:alpine
    restart: always
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
      - ./ssl:/etc/nginx/ssl
    depends_on:
      - n8n
    networks:
      - n8n_network

volumes:
  n8n_data:

networks:
  n8n_network:
```

2. **Create `.env` file:**

```env
N8N_PASSWORD=your_secure_password
N8N_HOST=n8n.yourdomain.com
```

3. **Start n8n:**

```bash
docker-compose up -d
```

4. **Access n8n:**
- URL: `https://n8n.yourdomain.com`
- Login: admin / your_secure_password

---

### **Option B: n8n Cloud (Managed Service)**

1. Go to [n8n.cloud](https://n8n.cloud)
2. Create an account
3. Get your API key from Settings
4. Note your instance URL

---

## 🔑 **Step 3: Get n8n API Key**

1. Login to n8n
2. Go to **Settings** → **API**
3. Click **Create API Key**
4. Copy the key

---

## ⚙️ **Step 4: Configure Environment Variables**

Add to your `.env.local` file:

```env
# n8n Configuration
N8N_API_URL=https://n8n.yourdomain.com/api/v1
N8N_API_KEY=your_n8n_api_key_here
N8N_WEBHOOK_URL=https://n8n.yourdomain.com/webhook
```

---

## 🎨 **Step 5: Access the Automation Page**

1. Login to your app
2. Go to sidebar → **Automation** ⚡
3. You should see:
   - Stats dashboard
   - Workflow list (empty for now)
   - Pre-loaded templates

---

## 📊 **Step 6: Create API Routes (Next.js)**

Create these API routes to connect with n8n:

### **`web/app/api/automation/workflows/route.ts`**

```typescript
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const response = await fetch(`${process.env.N8N_API_URL}/workflows`, {
      headers: {
        'X-N8N-API-KEY': process.env.N8N_API_KEY || ''
      }
    })
    
    const workflows = await response.json()
    return NextResponse.json(workflows)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch workflows' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    
    const response = await fetch(`${process.env.N8N_API_URL}/workflows`, {
      method: 'POST',
      headers: {
        'X-N8N-API-KEY': process.env.N8N_API_KEY || '',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body)
    })
    
    const workflow = await response.json()
    return NextResponse.json(workflow)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create workflow' }, { status: 500 })
  }
}
```

---

## 🎯 **Step 7: Test the Feature**

1. **Go to Automation page** (`/dashboard/automation`)
2. **Check subscription info** - Should show "Free Plan"
3. **View templates** - Pre-loaded templates should appear
4. **Try creating a workflow** (will connect to n8n once API routes are set up)

---

## 💰 **Pricing Tiers**

Default tiers created in database:

| Plan | Workflows | Executions/Month | Price |
|------|-----------|------------------|-------|
| **Free** | 5 | 100 | $0 |
| **Basic** | 20 | 1,000 | $10 |
| **Pro** | 50 | 5,000 | $25 |
| **Enterprise** | Unlimited | Unlimited | $99 |

---

## 🔧 **Common Workflows You Can Build**

### **1. Invoice Automation**
- Trigger: New invoice created
- Action: Send WhatsApp message with PDF

### **2. Payment Reminders**
- Trigger: Invoice overdue
- Action: Send reminder via email/WhatsApp

### **3. Customer Onboarding**
- Trigger: New customer added
- Action: Send welcome message

### **4. Daily Reports**
- Trigger: Schedule (daily at 9 AM)
- Action: Email revenue report

### **5. Data Sync**
- Trigger: New customer
- Action: Add to Google Sheets

---

## 📚 **Next Steps**

1. ✅ **Deploy n8n instance**
2. ✅ **Create API routes** to connect with n8n
3. ✅ **Build workflow editor** UI (or embed n8n iframe)
4. ✅ **Add webhook endpoints** for triggers
5. ✅ **Create more templates**
6. ✅ **Add pricing/upgrade flow**

---

## 🆘 **Need Help?**

- n8n Docs: https://docs.n8n.io
- n8n Community: https://community.n8n.io
- API Reference: https://docs.n8n.io/api/

---

## 🎉 **You're All Set!**

Your automation feature is now ready! Users can:
- ✅ View their workflows
- ✅ Check execution stats
- ✅ Browse templates
- ✅ Track usage limits

The foundation is complete - now you can build on it! 🚀
