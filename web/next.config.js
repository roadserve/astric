/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    unoptimized: true,
    domains: ['localhost', 'supabase.co', 'touchnsearch.com'],
  },
  env: {
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    NEXT_PUBLIC_N8N_WEBHOOK_BASE: process.env.NEXT_PUBLIC_N8N_WEBHOOK_BASE,
  },
  // NOTE: Disable static export to allow API routes (app router) to run.
  // If you need a static export for production hosting, create a separate
  // build config or env-based toggle, but keep API support for dev/runtime.
  // output: 'export',
  // trailingSlash: true,
}

module.exports = nextConfig