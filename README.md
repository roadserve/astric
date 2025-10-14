# ⚡ Astric.ai - Your Business Automations

![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)
![License](https://img.shields.io/badge/license-MIT-green.svg)
![Status](https://img.shields.io/badge/status-active-success.svg)

**The all-in-one business automation platform designed for SMEs**

🌐 **Website:** [astric.ai](https://astric.ai)  
📧 **Email:** hello@astric.ai  
🐦 **Twitter:** [@astricai](https://twitter.com/astricai)

---

## 🎯 **What is Astric.ai?**

Astric.ai is an intelligent business automation platform that empowers SMEs to automate workflows, manage CRM, and scale operations effortlessly. With AI-powered tools and 60+ integrations, transform repetitive tasks into automated workflows in minutes—no coding required.

### **Key Features:**

- ⚡ **Visual Workflow Builder** - Drag-and-drop with 60+ node types
- 🤖 **AI-Powered Automation** - Leverage OpenAI, Claude, and Gemini
- 💬 **Multi-Channel Communication** - WhatsApp, Email, SMS, Social Media
- 📊 **Smart CRM** - Manage customers, leads, and pipelines
- 📈 **Analytics & Insights** - Track performance in real-time
- 🔄 **Version Control** - Workflow versioning and rollback
- 🧪 **A/B Testing** - Optimize workflow performance
- 🏪 **Marketplace** - Share and discover workflows
- 👥 **Team Collaboration** - Comments and permissions
- 🔐 **Enterprise Security** - Bank-grade encryption, RLS policies

---

## 🚀 **Quick Start**

### **Prerequisites:**

- Node.js 18+ 
- PostgreSQL (via Supabase)
- n8n (for workflow execution)

### **Installation:**

```bash
# Clone the repository
git clone https://github.com/yourusername/astric-ai.git
cd astric-ai

# Install dependencies
cd web
npm install

# Setup environment variables
cp .env.example .env.local
# Edit .env.local with your configuration

# Run database migrations
# Execute SQL files in Supabase SQL Editor

# Start development server
npm run dev
```

Visit `http://localhost:3000`

---

## ⚙️ **Configuration**

### **Environment Variables:**

Create `.env.local` in the `web` directory:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_key

# n8n Configuration
N8N_API_URL=http://localhost:5678/api/v1
N8N_API_KEY=your_n8n_api_key
NEXT_PUBLIC_N8N_WEBHOOK_BASE=http://localhost:5678/webhook

# App Configuration
NEXT_PUBLIC_APP_NAME=Astric.ai
NEXT_PUBLIC_APP_URL=https://astric.ai
```

For detailed setup instructions, see `AUTOMATION_ENV_SETUP.md`

---

## 📚 **Documentation**

- 📘 **[Branding Guide](BRANDING.md)** - Brand identity, mission, vision
- 📗 **[Environment Setup](AUTOMATION_ENV_SETUP.md)** - n8n and environment configuration
- 📕 **[Complete Documentation](AUTOMATION_COMPLETE.md)** - Full system documentation
- 📙 **[API Reference](AUTOMATION_COMPLETE.md#api-documentation)** - API endpoints and examples

---

## 🏗️ **Architecture**

```
┌─────────────────────────────────────────────────────┐
│              Frontend (Next.js 14)                   │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐          │
│  │Dashboard │  │  Editor  │  │  Wizard  │          │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘          │
└───────┼─────────────┼─────────────┼─────────────────┘
        │             │             │
┌───────┼─────────────┼─────────────┼─────────────────┐
│         API Routes (Next.js API)                     │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐          │
│  │Workflows │  │Variables │  │Comments  │  etc...   │
└───────┼─────────────┼─────────────┼─────────────────┘
        │             │             │
┌───────┼─────────────┼─────────────┼─────────────────┐
│            Supabase (PostgreSQL)                     │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐          │
│  │17 Tables │  │RLS Secure│  │Real-time │          │
└───────┼─────────────┼─────────────┼─────────────────┘
        │             │             │
┌───────┼─────────────┴─────────────┴─────────────────┐
│              n8n (Workflow Engine)                   │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐          │
│  │ Execute  │  │Webhooks  │  │Schedule  │          │
└──────────────────────────────────────────────────────┘
```

---

## 🎨 **Tech Stack**

### **Frontend:**
- ⚛️ Next.js 14 (App Router)
- 🎨 Tailwind CSS
- 🧩 shadcn/ui Components
- 📊 Recharts (Analytics)

### **Backend:**
- 🗄️ Supabase (PostgreSQL + Auth + Real-time)
- 🔧 Next.js API Routes
- 🤖 n8n (Workflow Engine)

### **Integrations:**
- 📧 Email (SMTP)
- 💬 WhatsApp Business API
- 📱 SMS (Twilio)
- 🤖 AI (OpenAI, Claude, Gemini)
- 💳 Payment Gateways (Stripe, Razorpay)
- 📊 CRMs (HubSpot, Salesforce)
- 🗄️ Databases (PostgreSQL, MySQL, MongoDB)
- ☁️ Cloud Storage (AWS S3, Google Drive)

---

## 📊 **Database Schema**

### **Core Tables:**
- `organizations` - Multi-tenant organizations
- `profiles` - User profiles
- `customers` - CRM customers
- `products` - Product catalog
- `invoices` - Billing & invoices

### **Automation Tables (17):**
- `automation_workflows` - Workflow definitions
- `automation_workflow_nodes` - Visual editor nodes
- `automation_workflow_versions` - Version control
- `automation_executions` - Execution logs
- `automation_analytics` - Performance metrics
- `automation_ab_tests` - A/B testing
- `automation_variables` - Dynamic configuration
- `automation_credentials` - Secure credentials
- `automation_templates` - Pre-built templates
- `automation_marketplace_workflows` - Shared workflows
- `automation_subscriptions` - Usage limits
- ... and more

---

## 🔐 **Security**

- ✅ Row Level Security (RLS) on all tables
- ✅ Multi-tenant data isolation
- ✅ Encrypted credential storage
- ✅ JWT-based authentication
- ✅ API key management
- ✅ Audit logging
- ✅ HTTPS/SSL enforced
- ✅ GDPR compliant (in progress)

---

## 🎯 **Features**

### **✅ Automation**
- Visual workflow builder
- 60+ node types
- Scheduled workflows (cron)
- Webhook triggers
- Conditional logic (IF/THEN)
- Loops and iterations
- Error handling & retries
- Version control
- A/B testing
- Template marketplace

### **✅ CRM**
- Customer management
- Lead tracking
- Deal pipeline
- Activity timeline
- Contact segmentation
- Custom fields
- Import/Export

### **✅ Communication**
- WhatsApp Business API
- Email campaigns
- SMS notifications
- Social media integration
- Bulk messaging
- Templates & variables

### **✅ Billing**
- Invoice generation
- Payment tracking
- Expense management
- Quotations
- Credit/Debit notes
- Multi-currency support
- Tax calculations (GST)

### **✅ Analytics**
- Dashboard insights
- Workflow performance
- Success rate tracking
- Execution logs
- Custom reports
- Export capabilities

---

## 🚀 **Deployment**

### **Vercel (Recommended):**

```bash
# Install Vercel CLI
npm install -g vercel

# Deploy
vercel

# Set environment variables in Vercel dashboard
# Deploy production
vercel --prod
```

### **Docker:**

```bash
# Build image
docker build -t astric-ai .

# Run container
docker run -p 3000:3000 astric-ai
```

### **Self-Hosted:**

```bash
# Build production
npm run build

# Start production server
npm start
```

---

## 📈 **Roadmap**

### **Q1 2025:**
- ✅ Core automation platform
- ✅ Visual workflow builder
- ✅ 60+ integrations
- ✅ CRM & billing modules
- ✅ Multi-tenant architecture

### **Q2 2025:**
- 🔜 Mobile app (React Native)
- 🔜 Advanced AI features
- 🔜 Workflow marketplace launch
- 🔜 White-label solution
- 🔜 API developer platform

### **Q3 2025:**
- 🔜 Enterprise features
- 🔜 Custom integrations builder
- 🔜 Advanced analytics & ML
- 🔜 Multi-language support
- 🔜 Global CDN deployment

### **Q4 2025:**
- 🔜 IPO preparation 🚀
- 🔜 Strategic partnerships
- 🔜 Expansion to 50+ countries
- 🔜 1M+ users milestone

---

## 🤝 **Contributing**

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

### **Development Workflow:**

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📝 **License**

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 🙏 **Acknowledgments**

Built with ❤️ using:
- [Next.js](https://nextjs.org/)
- [Supabase](https://supabase.com/)
- [n8n](https://n8n.io/)
- [Tailwind CSS](https://tailwindcss.com/)
- [shadcn/ui](https://ui.shadcn.com/)

---

## 📞 **Support & Contact**

### **Need Help?**
- 📧 Email: support@astric.ai
- 💬 Live Chat: astric.ai/chat
- 📚 Documentation: docs.astric.ai
- 🎓 Tutorials: youtube.com/@astricai

### **Business Inquiries:**
- 💼 Sales: sales@astric.ai
- 🤝 Partnerships: partners@astric.ai
- 📰 Press: press@astric.ai

### **Social Media:**
- 🐦 Twitter: [@astricai](https://twitter.com/astricai)
- 💼 LinkedIn: [/company/astricai](https://linkedin.com/company/astricai)
- 📸 Instagram: [@astric.ai](https://instagram.com/astric.ai)
- 📺 YouTube: [/c/AstricAI](https://youtube.com/c/AstricAI)

---

## 🌟 **Show Your Support**

If you find Astric.ai helpful, please:
- ⭐ Star this repository
- 🐦 Follow us on Twitter
- 📢 Share with your network
- 💬 Leave a review

---

## 📊 **Stats**

![GitHub stars](https://img.shields.io/github/stars/yourusername/astric-ai?style=social)
![GitHub forks](https://img.shields.io/github/forks/yourusername/astric-ai?style=social)
![GitHub issues](https://img.shields.io/github/issues/yourusername/astric-ai)
![GitHub pull requests](https://img.shields.io/github/issues-pr/yourusername/astric-ai)

---

<p align="center">
  <b>Built with ❤️ by the Astric.ai Team</b><br>
  <i>Empowering businesses to automate intelligently</i>
</p>

<p align="center">
  <a href="https://astric.ai">Website</a> •
  <a href="https://docs.astric.ai">Documentation</a> •
  <a href="https://astric.ai/blog">Blog</a> •
  <a href="https://astric.ai/pricing">Pricing</a>
</p>

---

**Made with ⚡ in India 🇮🇳 for the World 🌍**
