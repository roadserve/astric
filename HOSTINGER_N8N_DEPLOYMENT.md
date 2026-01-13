# 🚀 Deploy n8n on Hostinger VPS - Complete Guide

## Overview

This guide will help you deploy n8n on Hostinger VPS and integrate it with your CRM application.

---

## 📋 **Prerequisites**

### **What You Need:**
- ✅ Hostinger VPS plan (recommended: VPS 2 or higher)
- ✅ Domain or subdomain (e.g., `automation.yourdomain.com`)
- ✅ SSH access to your VPS
- ✅ Basic terminal knowledge

### **Recommended Hostinger Plan:**
- **VPS 2** or higher
- **2 GB RAM** minimum (4 GB recommended)
- **Ubuntu 22.04** OS

---

## 🎯 **Deployment Options**

We'll cover **2 methods**:
1. **Docker Installation** (Recommended - Easier)
2. **Manual Installation** (More control)

---

## 🐳 **METHOD 1: Docker Installation (RECOMMENDED)**

### **Step 1: Connect to Your VPS**

```bash
# SSH into your Hostinger VPS
ssh root@your-vps-ip

# Or use the hostname
ssh root@vps-xxxxx.hostinger.com
```

### **Step 2: Update System**

```bash
# Update package list
sudo apt update && sudo apt upgrade -y

# Install required packages
sudo apt install -y curl git
```

### **Step 3: Install Docker**

```bash
# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Start Docker service
sudo systemctl start docker
sudo systemctl enable docker

# Verify installation
docker --version
```

### **Step 4: Install Docker Compose**

```bash
# Download Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose

# Make it executable
sudo chmod +x /usr/local/bin/docker-compose

# Verify installation
docker-compose --version
```

### **Step 5: Create n8n Directory**

```bash
# Create directory for n8n
mkdir -p ~/n8n
cd ~/n8n

# Create data directory
mkdir -p ~/.n8n
```

### **Step 6: Create Docker Compose File**

```bash
# Create docker-compose.yml
nano docker-compose.yml
```

**Paste this configuration:**

```yaml
version: '3.8'

services:
  n8n:
    image: n8nio/n8n:latest
    container_name: n8n
    restart: unless-stopped
    ports:
      - "5678:5678"
    environment:
      # Basic Configuration
      - N8N_BASIC_AUTH_ACTIVE=true
      - N8N_BASIC_AUTH_USER=admin
      - N8N_BASIC_AUTH_PASSWORD=your-secure-password-here
      
      # Webhook URL (Change to your domain)
      - WEBHOOK_URL=https://automation.yourdomain.com/
      - N8N_HOST=automation.yourdomain.com
      - N8N_PROTOCOL=https
      - N8N_PORT=5678
      
      # Database (Using SQLite for simplicity)
      - DB_TYPE=sqlite
      - DB_SQLITE_DATABASE=/home/node/.n8n/database.sqlite
      
      # Timezone
      - GENERIC_TIMEZONE=Asia/Kolkata
      - TZ=Asia/Kolkata
      
      # Execution settings
      - EXECUTIONS_DATA_SAVE_ON_ERROR=all
      - EXECUTIONS_DATA_SAVE_ON_SUCCESS=all
      - EXECUTIONS_DATA_SAVE_MANUAL_EXECUTIONS=true
      
      # API Settings
      - N8N_API_ENABLED=true
      
    volumes:
      - ~/.n8n:/home/node/.n8n
      - ./workflows:/home/node/.n8n/workflows
      - ./credentials:/home/node/.n8n/credentials
    
    labels:
      - "traefik.enable=true"

volumes:
  n8n_data:
```

**Save:** `Ctrl + X`, then `Y`, then `Enter`

### **Step 7: Configure Environment Variables**

```bash
# Create .env file for sensitive data
nano .env
```

**Add:**

```env
N8N_BASIC_AUTH_USER=admin
N8N_BASIC_AUTH_PASSWORD=YourSecurePassword123!
N8N_ENCRYPTION_KEY=your-random-encryption-key-here
```

**Generate encryption key:**
```bash
# Generate a random encryption key
openssl rand -hex 32
```

Copy the output and paste it as `N8N_ENCRYPTION_KEY`

### **Step 8: Start n8n**

```bash
# Start n8n
docker-compose up -d

# Check if it's running
docker ps

# View logs
docker-compose logs -f n8n
```

### **Step 9: Configure Firewall**

```bash
# Allow port 5678
sudo ufw allow 5678/tcp

# Allow SSH (if not already)
sudo ufw allow 22/tcp

# Allow HTTP/HTTPS (for later)
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# Enable firewall
sudo ufw enable

# Check status
sudo ufw status
```

---

## 🌐 **Step 10: Set Up Domain & SSL**

### **Option A: Using Nginx + Let's Encrypt (Recommended)**

#### **Install Nginx:**

```bash
# Install Nginx
sudo apt install -y nginx

# Start Nginx
sudo systemctl start nginx
sudo systemctl enable nginx
```

#### **Create Nginx Configuration:**

```bash
# Create config file
sudo nano /etc/nginx/sites-available/n8n
```

**Paste this:**

```nginx
server {
    listen 80;
    server_name automation.yourdomain.com;

    location / {
        proxy_pass http://localhost:5678;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        
        # WebSocket support
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # Timeouts
        proxy_connect_timeout 90s;
        proxy_send_timeout 90s;
        proxy_read_timeout 90s;
    }
}
```

#### **Enable Site:**

```bash
# Enable the site
sudo ln -s /etc/nginx/sites-available/n8n /etc/nginx/sites-enabled/

# Test Nginx config
sudo nginx -t

# Restart Nginx
sudo systemctl restart nginx
```

#### **Install SSL Certificate:**

```bash
# Install Certbot
sudo apt install -y certbot python3-certbot-nginx

# Get SSL certificate
sudo certbot --nginx -d automation.yourdomain.com

# Follow the prompts
# Choose option 2 (Redirect HTTP to HTTPS)
```

#### **Auto-Renewal:**

```bash
# Test auto-renewal
sudo certbot renew --dry-run

# Renewal will happen automatically via cron
```

---

## 🔑 **Step 11: Generate n8n API Key**

1. **Access n8n:**
   - Go to: `https://automation.yourdomain.com`
   - Login with your credentials

2. **Create API Key:**
   - Click on your profile (bottom left)
   - Go to **Settings**
   - Click **API** tab
   - Click **Create API Key**
   - Copy the key (you'll need this!)

---

## 🔗 **Step 12: Connect to Your CRM**

### **Update Your CRM Environment Variables:**

Create or update `.env.local` in your CRM project:

```bash
# In your CRM project (web folder)
nano .env.local
```

**Add:**

```env
# n8n Configuration
N8N_API_URL=https://automation.yourdomain.com/api/v1
N8N_API_KEY=your-api-key-from-step-11
N8N_WEBHOOK_URL=https://automation.yourdomain.com/webhook
```

**Save and restart your CRM:**

```bash
# Stop your dev server (Ctrl+C)
# Restart it
npm run dev
```

---

## ✅ **Step 13: Test the Connection**

### **Test from Your CRM:**

1. Login to your CRM
2. Go to `/dashboard/automation`
3. Click "Create Workflow"
4. Fill in details and submit
5. Should create workflow in n8n!

### **Test n8n API Directly:**

```bash
# Test API connection
curl -X GET https://automation.yourdomain.com/api/v1/workflows \
  -H "X-N8N-API-KEY: your-api-key"
```

---

## 📊 **Monitoring & Management**

### **Check n8n Status:**

```bash
# Check if n8n is running
docker ps | grep n8n

# View logs
docker-compose logs -f n8n

# Restart n8n
docker-compose restart n8n

# Stop n8n
docker-compose down

# Start n8n
docker-compose up -d
```

### **Update n8n:**

```bash
# Pull latest image
docker-compose pull

# Restart with new image
docker-compose up -d
```

### **Backup n8n Data:**

```bash
# Create backup directory
mkdir -p ~/backups

# Backup n8n data
tar -czf ~/backups/n8n-backup-$(date +%Y%m%d).tar.gz ~/.n8n

# Download to local machine
# (Run from your local machine)
scp root@your-vps-ip:~/backups/n8n-backup-*.tar.gz ./
```

---

## 🔐 **Security Best Practices**

### **1. Change Default Passwords:**

```bash
# Update docker-compose.yml with strong password
nano docker-compose.yml

# Update N8N_BASIC_AUTH_PASSWORD
```

### **2. Enable Firewall:**

```bash
# Only allow necessary ports
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable
```

### **3. Regular Updates:**

```bash
# Update system regularly
sudo apt update && sudo apt upgrade -y

# Update n8n regularly
docker-compose pull
docker-compose up -d
```

### **4. Use Strong API Keys:**

- Don't share your API keys
- Rotate keys periodically
- Use environment variables (never hardcode)

---

## 🚨 **Troubleshooting**

### **Issue: Can't access n8n**

```bash
# Check if n8n is running
docker ps

# Check logs for errors
docker-compose logs -f n8n

# Check Nginx
sudo nginx -t
sudo systemctl status nginx

# Check firewall
sudo ufw status
```

### **Issue: Webhook not working**

```bash
# Check WEBHOOK_URL in docker-compose.yml
# Make sure it matches your domain

# Restart n8n
docker-compose restart n8n
```

### **Issue: Database errors**

```bash
# Stop n8n
docker-compose down

# Check database file
ls -lh ~/.n8n/database.sqlite

# Restart n8n
docker-compose up -d
```

### **Issue: Out of memory**

```bash
# Check memory usage
free -h

# Upgrade VPS plan on Hostinger
# Or add swap space:
sudo fallocate -l 2G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile
```

---

## 📈 **Scaling & Performance**

### **Use PostgreSQL Instead of SQLite:**

Update `docker-compose.yml`:

```yaml
version: '3.8'

services:
  postgres:
    image: postgres:14
    container_name: n8n-postgres
    restart: unless-stopped
    environment:
      - POSTGRES_USER=n8n
      - POSTGRES_PASSWORD=your-db-password
      - POSTGRES_DB=n8n
    volumes:
      - postgres_data:/var/lib/postgresql/data

  n8n:
    image: n8nio/n8n:latest
    container_name: n8n
    restart: unless-stopped
    depends_on:
      - postgres
    ports:
      - "5678:5678"
    environment:
      - DB_TYPE=postgresdb
      - DB_POSTGRESDB_HOST=postgres
      - DB_POSTGRESDB_PORT=5432
      - DB_POSTGRESDB_DATABASE=n8n
      - DB_POSTGRESDB_USER=n8n
      - DB_POSTGRESDB_PASSWORD=your-db-password
      # ... other environment variables
    volumes:
      - ~/.n8n:/home/node/.n8n

volumes:
  postgres_data:
```

---

## 💰 **Cost Estimate**

### **Hostinger VPS Pricing:**
- **VPS 1:** ~$4/month (1 GB RAM) - Not recommended for n8n
- **VPS 2:** ~$7/month (2 GB RAM) - Minimum recommended
- **VPS 3:** ~$10/month (4 GB RAM) - **Recommended**
- **VPS 4:** ~$15/month (8 GB RAM) - For production

### **Additional Costs:**
- Domain: ~$10/year (if needed)
- SSL Certificate: **FREE** (Let's Encrypt)

**Total:** ~$10-15/month for a solid setup

---

## ✅ **Quick Setup Checklist**

- [ ] SSH into Hostinger VPS
- [ ] Install Docker & Docker Compose
- [ ] Create docker-compose.yml
- [ ] Configure environment variables
- [ ] Start n8n with `docker-compose up -d`
- [ ] Configure firewall
- [ ] Point domain to VPS IP
- [ ] Install Nginx
- [ ] Configure Nginx reverse proxy
- [ ] Install SSL certificate with Certbot
- [ ] Access n8n at your domain
- [ ] Generate API key
- [ ] Update CRM .env.local
- [ ] Test workflow creation
- [ ] Set up backups

---

## 📚 **Next Steps**

1. ✅ Deploy n8n on Hostinger (follow this guide)
2. ✅ Generate API key in n8n
3. ✅ Update CRM environment variables
4. ✅ Test workflow creation
5. ✅ Build your first automation
6. ✅ Set up monitoring
7. ✅ Schedule regular backups

---

## 🆘 **Need Help?**

### **Hostinger Support:**
- 24/7 Live Chat
- Knowledge Base
- Ticket System

### **n8n Community:**
- Forum: https://community.n8n.io/
- Discord: https://discord.gg/n8n
- Documentation: https://docs.n8n.io/

### **Your CRM:**
- See: `N8N_INTEGRATION_GUIDE.md`
- See: `AUTOMATION_SETUP.md`

---

## 🎉 **You're Ready!**

Follow this guide step-by-step and you'll have n8n running on Hostinger in about 30 minutes!

**Happy Automating! 🚀**
