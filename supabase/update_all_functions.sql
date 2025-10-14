-- This file documents the Supabase credentials for Edge Functions
-- These are already configured in the functions, but you can set them as secrets for production

-- Set Supabase secrets (run these in your terminal with Supabase CLI)
-- supabase secrets set SUPABASE_URL=https://nazedodnkzkuxvsuedmb.supabase.co
-- supabase secrets set SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5hemVkb2Rua3prdXh2c3VlZG1iIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk1Mjc3MjgsImV4cCI6MjA3NTEwMzcyOH0.33dMgS9GW9DW3XKPnQ1hTw5zzGbflzTue0VH1QRAVwE
-- supabase secrets set SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5hemVkb2Rua3prdXh2c3VlZG1iIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1OTUyNzcyOCwiZXhwIjoyMDc1MTAzNzI4fQ.VFx60HhZ33R6sjclr_RqEiwWbYdmnTVXy6kpLUYpWs8

-- Additional secrets for integrations
-- supabase secrets set WHATSAPP_ACCESS_TOKEN=your_whatsapp_token
-- supabase secrets set WHATSAPP_PHONE_NUMBER_ID=your_phone_number_id
-- supabase secrets set WEBHOOK_VERIFY_TOKEN=your_verify_token
-- supabase secrets set GOOGLE_CLIENT_ID=your_google_client_id
-- supabase secrets set GOOGLE_CLIENT_SECRET=your_google_client_secret
-- supabase secrets set GOOGLE_REDIRECT_URI=http://localhost:3000/api/auth/google/callback

-- Note: All Edge Functions have fallback credentials hardcoded for development
-- For production, use the secrets above
