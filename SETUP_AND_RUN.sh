#!/bin/bash

echo "🚀 Astric.ai Setup Script"
echo "=========================="
echo ""

# Check if .env.local exists
if [ ! -f "web/.env.local" ]; then
    echo "⚠️  .env.local file not found!"
    echo ""
    echo "Creating .env.local template..."
    echo ""
    
    cat > web/.env.local << 'EOF'
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url_here
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key_here

# Google AI API Key (for Gemini AI Chatbot)
GOOGLE_AI_API_KEY=your_google_ai_api_key_here

# Site Configuration
NEXT_PUBLIC_SITE_URL=http://localhost:3000
NEXT_PUBLIC_APP_NAME=Astric.ai
NODE_ENV=development
EOF

    echo "✅ Created web/.env.local template"
    echo ""
    echo "⚠️  IMPORTANT: You need to edit web/.env.local and add your actual keys:"
    echo ""
    echo "1. Supabase Keys:"
    echo "   - Go to https://app.supabase.com"
    echo "   - Select your project"
    echo "   - Settings → API"
    echo "   - Copy 'Project URL' and 'anon/public' key"
    echo ""
    echo "2. Google AI API Key:"
    echo "   - Go to https://aistudio.google.com/app/apikey"
    echo "   - Create a new API key"
    echo "   - Copy the key"
    echo ""
    read -p "Press Enter after you've updated the .env.local file..."
else
    echo "✅ .env.local file found"
fi

echo ""
echo "📦 Checking dependencies..."
cd web

if [ ! -d "node_modules" ]; then
    echo "Installing dependencies..."
    npm install
else
    echo "✅ Dependencies already installed"
fi

echo ""
echo "🎉 Setup complete!"
echo ""
echo "Starting development server..."
echo "Visit: http://localhost:3000"
echo ""
echo "The AI chatbot will appear as a purple button in the bottom-right corner!"
echo ""

npm run dev

