/** @type {import('next').NextConfig} */
const nextConfig = {
  // ⚠️ IMPORTANT: If you need API routes (automation, webhooks), REMOVE the line below
  // Static export disables server-side code (API routes won't work)
  // Only enable if deploying to static hosting without API routes
  // output: 'export', // ⚠️ COMMENTED OUT - API routes need server-side execution
  
  trailingSlash: true,
  images: {
    unoptimized: true,
    domains: [
      'localhost',
      'supabase.co',
      'touchnsearch.com',
      'astric.ai',
      'lh3.googleusercontent.com',
      'storage.googleapis.com',
    ],
  },
  eslint: {
    // Repo has many legacy lint warnings; don't block production builds.
    ignoreDuringBuilds: true,
  },
}

module.exports = nextConfig