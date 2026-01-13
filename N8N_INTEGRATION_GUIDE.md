# 🚀 Complete n8n Integration Guide

Based on the [official n8n documentation](https://docs.n8n.io/), this guide implements the key features for your AI SME Copilot platform.

---

## ✅ **What We've Implemented**

### **1. Database Layer** 📊
- ✅ `automation_workflows` - Store workflows
- ✅ `automation_executions` - Track execution logs
- ✅ `automation_subscriptions` - Manage pricing/limits
- ✅ `automation_templates` - Pre-built workflow templates
- ✅ RLS policies for multi-tenant security
- ✅ Usage tracking and limits

### **2. API Routes** 🔌
- ✅ `/api/automation/workflows` - CRUD operations
- ✅ `/api/automation/webhook` - Handle n8n callbacks
- ✅ Subscription limit checking
- ✅ Organization-level isolation
- ✅ Error handling

### **3. Frontend Pages** 🎨
- ✅ `/dashboard/automation` - Dashboard & workflow list
- ✅ `/dashboard/automation/create` - Create new workflows
- ✅ Stats cards (workflows, executions, success rate)
- ✅ Template gallery
- ✅ Usage tracking

### **4. Key Features** ⚡
Based on [n8n documentation](https://docs.n8n.io/):
- ✅ Workflow management
- ✅ Manual triggers
- ✅ Webhook support
- ✅ Schedule triggers (ready for implementation)
- ✅ Execution logging
- ✅ Subscription-based limits

---

## 🐳 **Step 1: Deploy n8n Instance**

### **Option A: Docker (Self-Hosted - Recommended)**

Create `docker-compose.yml`:

```yaml
version: '3.8'

services:
  n8n:
    image: n8nio/n8n:latest
    restart: always
    ports:
      - "5678:5678"
    environment:
      # Basic Auth
      - N8N_BASIC_AUTH_ACTIVE=true
      - N8N_BASIC_AUTH_USER=admin
      - N8N_BASIC_AUTH_PASSWORD=${N8N_PASSWORD}
      
      # Host Configuration
      - N8N_HOST=${N8N_HOST}
      - N8N_PORT=5678
      - N8N_PROTOCOL=https
      
      # Webhook URL
      - WEBHOOK_URL=https://${N8N_HOST}/
      
      # Database (PostgreSQL recommended)
      - DB_TYPE=postgresdb
      - DB_POSTGRESDB_HOST=postgres
      - DB_POSTGRESDB_PORT=5432
      - DB_POSTGRESDB_DATABASE=${POSTGRES_DB}
      - DB_POSTGRESDB_USER=${POSTGRES_USER}
      - DB_POSTGRESDB_PASSWORD=${POSTGRES_PASSWORD}
      
      # Timezone
      - GENERIC_TIMEZONE=Asia/Kolkata
      
      # API
      - N8N_API_KEY_ENABLED=true
      
      # Execution
      - EXECUTIONS_MODE=queue
      - QUEUE_BULL_REDIS_HOST=redis
      - QUEUE_BULL_REDIS_PORT=6379
      
    volumes:
      - n8n_data:/home/node/.n8n
    depends_on:
      - postgres
      - redis
    networks:
      - n8n_network

  postgres:
    image: postgres:15
    restart: always
    environment:
      - POSTGRES_DB=${POSTGRES_DB}
      - POSTGRES_USER=${POSTGRES_USER}
      - POSTGRES_PASSWORD=${POSTGRES_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data
    networks:
      - n8n_network

  redis:
    image: redis:7-alpine
    restart: always
    networks:
      - n8n_network

  # Nginx reverse proxy (optional but recommended)
  nginx:
    image: nginx:alpine
    restart: always
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf:ro
      - ./ssl:/etc/nginx/ssl:ro
    depends_on:
      - n8n
    networks:
      - n8n_network

volumes:
  n8n_data:
  postgres_data:

networks:
  n8n_network:
    driver: bridge
```

Create `.env`:

```env
# n8n
N8N_PASSWORD=your_secure_password_here
N8N_HOST=n8n.yourdomain.com

# PostgreSQL
POSTGRES_DB=n8n
POSTGRES_USER=n8n
POSTGRES_PASSWORD=your_postgres_password
```

Start n8n:

```bash
docker-compose up -d
```

### **Option B: n8n Cloud**

1. Go to [n8n.cloud](https://n8n.cloud)
2. Create account
3. Get API key from Settings → API
4. Use cloud URL in your app

---

## 🔑 **Step 2: Configure API Access**

1. **Access n8n**: `https://n8n.yourdomain.com`
2. **Login**: admin / your_password
3. **Get API Key**:
   - Go to Settings → API
   - Click "Create API Key"
   - Copy the key

4. **Add to your app's `.env.local`**:

```env
# n8n Configuration
N8N_API_URL=https://n8n.yourdomain.com/api/v1
N8N_API_KEY=n8n_api_xxxxxxxxxxxxxxxxxxxxxxxx
N8N_WEBHOOK_URL=https://n8n.yourdomain.com/webhook
N8N_ENABLED=true
```

---

## 📋 **Step 3: Test the Integration**

### **A. Run Database Migration**
```sql
-- In Supabase SQL Editor:
supabase/create_automation_tables.sql
```

### **B. Access the Feature**
1. Go to your app: `localhost:3000/dashboard/automation`
2. You should see:
   - ✅ Stats dashboard
   - ✅ Free plan info (5 workflows, 100 executions)
   - ✅ 5 pre-loaded templates
   - ✅ "Create Workflow" button

### **C. Create a Test Workflow**
1. Click "Create Workflow"
2. Fill in:
   - Name: "Test Workflow"
   - Description: "My first automation"
   - Trigger: Manual
3. Click "Create Workflow"
4. Check Supabase → `automation_workflows` table

---

## 🎯 **Step 4: Common Workflow Templates**

Based on [n8n workflow concepts](https://docs.n8n.io/workflows/), here are pre-configured templates:

### **1. Invoice WhatsApp Automation**
```json
{
  "nodes": [
    {
      "name": "Invoice Created",
      "type": "n8n-nodes-base.webhook",
      "parameters": {
        "httpMethod": "POST",
        "path": "invoice-created"
      }
    },
    {
      "name": "Generate PDF",
      "type": "n8n-nodes-base.httpRequest",
      "parameters": {
        "url": "={{$json.pdf_url}}"
      }
    },
    {
      "name": "Send WhatsApp",
      "type": "n8n-nodes-base.whatsApp",
      "parameters": {
        "to": "={{$json.customer_phone}}",
        "message": "Your invoice is ready!",
        "mediaUrl": "={{$json.pdf_url}}"
      }
    }
  ]
}
```

### **2. Payment Reminder**
```json
{
  "nodes": [
    {
      "name": "Schedule Daily",
      "type": "n8n-nodes-base.cron",
      "parameters": {
        "cronExpression": "0 9 * * *"
      }
    },
    {
      "name": "Get Overdue Invoices",
      "type": "n8n-nodes-base.httpRequest",
      "parameters": {
        "url": "{{$env.APP_URL}}/api/invoices/overdue"
      }
    },
    {
      "name": "Send Reminders",
      "type": "n8n-nodes-base.sendEmail",
      "parameters": {
        "to": "={{$json.customer_email}}",
        "subject": "Payment Reminder",
        "html": "Your payment is overdue..."
      }
    }
  ]
}
```

---

## 🔗 **Step 5: Webhook Integration**

### **Configure n8n Webhook in Your App**

```typescript
// Trigger workflow from your app
const triggerWorkflow = async (invoiceId: string) => {
  const response = await fetch(`${N8N_WEBHOOK_URL}/invoice-created`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      invoiceId,
      customerPhone: '+91XXXXXXXXXX',
      pdfUrl: 'https://yourapp.com/invoices/123.pdf'
    })
  })
  return response.json()
}
```

---

## 💰 **Step 6: Pricing Tiers**

Manage subscription limits:

| Plan | Workflows | Executions/Month | Price |
|------|-----------|------------------|-------|
| Free | 5 | 100 | $0 |
| Basic | 20 | 1,000 | $10 |
| Pro | 50 | 5,000 | $25 |
| Enterprise | Unlimited | Unlimited | $99 |

Update limits in `automation_subscriptions` table.

---

## 📚 **Next Implementation Steps**

### **Phase 2: Enhanced Features**
- [ ] Visual workflow editor (embed n8n iframe)
- [ ] Pre-built action nodes
- [ ] Conditional logic UI
- [ ] Error retry mechanism
- [ ] Execution history viewer

### **Phase 3: Advanced Features**
- [ ] AI-powered workflow suggestions
- [ ] Template marketplace
- [ ] Workflow sharing
- [ ] Analytics dashboard
- [ ] A/B testing workflows

---

## 🔧 **Troubleshooting**

### **Issue: API Connection Failed**
```bash
# Check n8n is running
docker ps | grep n8n

# Check API key
curl -H "X-N8N-API-KEY: your_key" https://n8n.yourdomain.com/api/v1/workflows
```

### **Issue: Webhook Not Triggering**
1. Check webhook URL in n8n
2. Verify firewall allows incoming requests
3. Check webhook logs in n8n

### **Issue: Execution Limit Reached**
```sql
-- Reset monthly executions
UPDATE automation_subscriptions 
SET current_month_executions = 0 
WHERE organization_id = 'your_org_id';
```

---

## 📖 **Resources**

- [n8n Documentation](https://docs.n8n.io/)
- [n8n API Reference](https://docs.n8n.io/api/)
- [n8n Community Forum](https://community.n8n.io/)
- [n8n Workflow Templates](https://n8n.io/workflows/)

---

## 🎉 **You're Ready!**

Your automation feature is now:
- ✅ Fully functional with database
- ✅ API routes configured
- ✅ Frontend UI complete
- ✅ Ready for n8n integration
- ✅ Subscription limits enforced
- ✅ Multi-tenant secure

**Start using it: Go to `/dashboard/automation` and create your first workflow!** 🚀
