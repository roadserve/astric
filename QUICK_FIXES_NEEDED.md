# 🚨 Quick Fixes Needed

## ⚡ **IMMEDIATE FIXES (5 minutes)**

### 1. Fix Next.js Config (BREAKING ISSUE)

**File:** `web/next.config.js`

**Problem:** Static export mode breaks all API routes.

**Fix:**
```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  // ❌ REMOVE THIS LINE: output: 'export',
  trailingSlash: true,
  images: {
    // ✅ Keep unoptimized if you're using static hosting
    unoptimized: true,
    domains: ['localhost', 'supabase.co', 'touchnsearch.com', 'astric.ai'],
  },
}

module.exports = nextConfig
```

**Why:** API routes need server-side execution. Static export only generates HTML files.

---

### 2. Add Environment Variable Validation

**File:** `web/lib/supabase.ts`

**Current (Unsafe):**
```typescript
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
```

**Fix:**
```typescript
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Missing Supabase environment variables.\n' +
    'Please create .env.local and add:\n' +
    'NEXT_PUBLIC_SUPABASE_URL=your_url\n' +
    'NEXT_PUBLIC_SUPABASE_ANON_KEY=your_key'
  )
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
```

**Why:** Better error messages instead of cryptic runtime crashes.

---

### 3. Update TypeScript Target

**File:** `web/tsconfig.json`

**Change:**
```json
{
  "compilerOptions": {
    "target": "ES2020",  // Changed from "es5"
    // ... rest stays same
  }
}
```

**Why:** Modern JavaScript, better performance, smaller bundles.

---

## 🔄 **SOON TO FIX (30 minutes)**

### 4. Upgrade Node.js

**Current:** v18.20.8  
**Required:** v20+ LTS

```bash
# Using nvm (recommended):
nvm install 20
nvm use 20

# Verify:
node --version  # Should show v20.x.x
```

**Why:** Supabase deprecating Node 18 support.

---

### 5. Create .env.local

```bash
cd web
cp env.example .env.local
```

Then edit `.env.local` and add your Supabase credentials:
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

---

## 📋 **CHECKLIST**

- [ ] Remove `output: 'export'` from `next.config.js`
- [ ] Add environment variable validation in `lib/supabase.ts`
- [ ] Update TypeScript target to ES2020
- [ ] Create `.env.local` file
- [ ] Upgrade to Node.js 20
- [ ] Test API routes work (`/api/automation/workflows`)
- [ ] Restart dev server: `npm run dev`

---

## 🎯 **After Fixes, Test:**

1. ✅ Server starts without errors
2. ✅ API routes respond (check `/api/automation/workflows`)
3. ✅ Login/Register works
4. ✅ Dashboard loads
5. ✅ No console warnings about missing env vars

---

**For full details, see:** `PROJECT_COMPATIBILITY_REPORT.md`



