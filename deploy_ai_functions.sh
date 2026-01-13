#!/bin/bash

echo "========================================"
echo "AI Copilot - Deploy Edge Functions"
echo "========================================"
echo ""

echo "Step 1: Checking Supabase CLI..."
if ! command -v supabase &> /dev/null; then
    echo "ERROR: Supabase CLI not found!"
    echo "Please install it first: https://supabase.com/docs/guides/cli"
    exit 1
fi
echo "✓ Supabase CLI found"

echo ""
echo "Step 2: Deploying AI Chat Function..."
supabase functions deploy ai_chat
if [ $? -ne 0 ]; then
    echo "ERROR: Failed to deploy ai_chat"
    exit 1
fi
echo "✓ ai_chat deployed"

echo ""
echo "Step 3: Deploying AI Reply Suggest Function..."
supabase functions deploy ai_reply_suggest
if [ $? -ne 0 ]; then
    echo "ERROR: Failed to deploy ai_reply_suggest"
    exit 1
fi
echo "✓ ai_reply_suggest deployed"

echo ""
echo "Step 4: Deploying AI Invoice Parse Function..."
supabase functions deploy ai_invoice_parse
if [ $? -ne 0 ]; then
    echo "ERROR: Failed to deploy ai_invoice_parse"
    exit 1
fi
echo "✓ ai_invoice_parse deployed"

echo ""
echo "========================================"
echo "✓ All AI functions deployed successfully!"
echo "========================================"
echo ""
echo "NEXT STEPS:"
echo "1. Set your Google AI API key in Supabase Dashboard"
echo "   Dashboard → Settings → Edge Functions → Secrets"
echo "   Name: GOOGLE_AI_API_KEY"
echo "   Value: Your API key from https://makersuite.google.com/app/apikey"
echo ""
echo "2. Start your web app:"
echo "   cd web"
echo "   npm run dev"
echo ""
echo "3. Open: http://localhost:3000/dashboard/ai-copilot"
echo ""
echo "Read AI_COPILOT_REAL_AI_SETUP.md for complete guide"
echo "========================================"

