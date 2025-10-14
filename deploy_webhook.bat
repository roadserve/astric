@echo off
cd supabase
npx supabase@latest functions deploy webhook_inbound --no-verify-jwt
pause
