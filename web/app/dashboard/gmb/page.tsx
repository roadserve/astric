'use client'

import React, { useEffect, useMemo, useRef, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  BarChart as RBarChart,
  Bar as RBar,
  CartesianGrid,
  Cell,
  Legend,
  Line as RLine,
  LineChart as RLineChart,
  Pie as RPie,
  PieChart as RPieChart,
  ResponsiveContainer,
  Scatter as RScatter,
  ScatterChart as RScatterChart,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import {
  Building2,
  BarChart3,
  MapPin,
  Edit,
  RefreshCw,
  Plus,
  Search,
  LayoutGrid,
  List,
  MessageSquare,
  Megaphone,
  Sparkles,
  ShieldCheck,
  CalendarDays,
  Send,
  Phone,
  Globe,
  Trophy,
  Target,
  Layers,
  LineChart,
  Command,
} from 'lucide-react'

interface GmbAccount {
  id: string
  account_name: string
  is_active: boolean
  created_at: string
}

interface GmbLocation {
  id: string
  location_name: string
  address: any
  phone: string
  website: string
  description: string
  gmb_account_id: string
  is_active: boolean
  created_at: string
  gmb_account?: GmbAccount
  category?: string
  is_verified?: boolean
  is_published?: boolean
}

interface GmbReview {
  id: string
  gmb_location_id: string
  review_id: string
  reviewer_name: string | null
  reviewer_photo_url: string | null
  rating: number
  comment: string | null
  review_reply: string | null
  review_date: string
  reply_date: string | null
  is_replied: boolean
  location?: { id: string; location_name: string; location_id: string }
}

interface GmbPost {
  id: string
  title: string | null
  content: string
  call_to_action: string | null
  action_url: string | null
  media_urls: string[] | null
  post_type: string
  target_locations: string[] | null
  status: string
  scheduled_at: string | null
  published_at: string | null
  created_at: string
  updated_at: string
}

interface GmbInsightPoint {
  gmb_location_id: string
  metric_type: string
  metric_value: number
  date: string
  location?: { id: string; location_name: string }
}

interface BulkUpdateRow {
  id: string
  update_type: string
  status: string
  total_locations: number | null
  successful_updates: number | null
  failed_updates: number | null
  created_at: string
  completed_at: string | null
}

interface GmbProduct {
  id: string
  organization_id: string
  name: string
  description: string | null
  price: string | null
  category: string | null
  image_urls: string[] | null
  is_active: boolean
  created_at: string
  updated_at: string
}

interface GmbService {
  id: string
  organization_id: string
  name: string
  description: string | null
  category: string | null
  is_active: boolean
  created_at: string
  updated_at: string
}

export default function GmbDashboardPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const supabase = createClientComponentClient()
  const [accounts, setAccounts] = useState<GmbAccount[]>([])
  const [locations, setLocations] = useState<GmbLocation[]>([])
  const [reviews, setReviews] = useState<GmbReview[]>([])
  const [posts, setPosts] = useState<GmbPost[]>([])
  const [insights, setInsights] = useState<GmbInsightPoint[]>([])
  const [bulkUpdates, setBulkUpdates] = useState<BulkUpdateRow[]>([])
  const [products, setProducts] = useState<GmbProduct[]>([])
  const [services, setServices] = useState<GmbService[]>([])
  const [catalogLoading, setCatalogLoading] = useState(false)
  const [catalogTab, setCatalogTab] = useState<'products' | 'services'>('products')
  const [productForm, setProductForm] = useState({ name: '', description: '', price: '', category: '', imageUrls: '' })
  const [serviceForm, setServiceForm] = useState({ name: '', description: '', category: '' })
  const [reviewTemplates, setReviewTemplates] = useState<any[]>([])
  const [autoReplyRules, setAutoReplyRules] = useState<any[]>([])
  const [qrCodes, setQrCodes] = useState<any[]>([])
  const [qrPreviewDataUrl, setQrPreviewDataUrl] = useState<string | null>(null)
  const [qrGenerating, setQrGenerating] = useState(false)
  const [templateForm, setTemplateForm] = useState({ name: '', templateText: '' })
  const [ruleForm, setRuleForm] = useState({ name: '', minRating: 4, maxRating: 5, requireApproval: true, templateId: '' })
  const [qrForm, setQrForm] = useState({ label: '', locationId: '', targetUrl: '' })
  const [qnaItems, setQnaItems] = useState<any[]>([])
  const [qnaLoading, setQnaLoading] = useState(false)
  const [qnaForm, setQnaForm] = useState({ locationId: '', customerName: '', customerContact: '', question: '' })
  const [qnaAnswerDrafts, setQnaAnswerDrafts] = useState<Record<string, string>>({})
  const [rankTest, setRankTest] = useState({ keyword: 'car garage near me', locationName: 'Mumbai,Maharashtra,India' })
  const [rankTesting, setRankTesting] = useState(false)
  const [rankTestResult, setRankTestResult] = useState<any>(null)
  const [rankKeywords, setRankKeywords] = useState<any[]>([])
  const [rankLatestByKeyword, setRankLatestByKeyword] = useState<Record<string, any>>({})
  const [rankPrevByKeyword, setRankPrevByKeyword] = useState<Record<string, any>>({})
  const [rankRuns, setRankRuns] = useState<any[]>([])
  const [rankLoading, setRankLoading] = useState(false)
  const [rankRunning, setRankRunning] = useState(false)
  const [rankKeywordForm, setRankKeywordForm] = useState({
    keyword: '',
    gmbLocationId: '',
    locationName: 'Mumbai,Maharashtra,India',
    languageCode: 'en',
    isScheduled: true,
  })
  const [marketForm, setMarketForm] = useState({ seeds: '', locationCode: '2438' })
  const [marketLoading, setMarketLoading] = useState(false)
  const [marketResults, setMarketResults] = useState<any[]>([])
  const [notice, setNotice] = useState<null | {
    variant: 'success' | 'error' | 'info'
    title: string
    message?: string
  }>(null)
  const [loading, setLoading] = useState(true)
  const [organizationId, setOrganizationId] = useState<string | null>(null)
  const [syncing, setSyncing] = useState(false)
  const [syncingReviews, setSyncingReviews] = useState(false)
  const [syncingInsights, setSyncingInsights] = useState(false)
  const [autoSyncEnabled, setAutoSyncEnabled] = useState(true)
  const [autoSyncStatus, setAutoSyncStatus] = useState<'idle' | 'syncing' | 'error'>('idle')
  const [autoSyncLastAt, setAutoSyncLastAt] = useState<string | null>(null)
  const [autoSyncError, setAutoSyncError] = useState<string | null>(null)
  const [autoSyncBackoffUntil, setAutoSyncBackoffUntil] = useState<number>(0)
  const autoSyncBackoffUntilRef = useRef<number>(0)
  const [actionsOpen, setActionsOpen] = useState(false)
  const [actionsQuery, setActionsQuery] = useState('')
  const [actionsIndex, setActionsIndex] = useState(0)
  const [selectedLocations, setSelectedLocations] = useState<string[]>([])
  const [bulkUpdateType, setBulkUpdateType] = useState('description')
  type ModuleTab = 'listing_management' | 'ai_rank_tracker'
  type ListingTab =
    | 'weekly_tasks'
    | 'overview'
    | 'listings'
    | 'reviews'
    | 'content_updates'
    | 'post_scheduling'
  type AiTab = 'performance' | 'keyword_position' | 'geo_grid_ranker' | 'competitors' | 'market_research'
  type ActiveTab = ListingTab | AiTab

  const [moduleTab, setModuleTab] = useState<ModuleTab>('listing_management')
  const [activeTab, setActiveTab] = useState<ActiveTab>('overview')
  const [contentUpdatesTab, setContentUpdatesTab] = useState<'dashboard' | 'update_history' | 'bulk_product_update' | 'directories'>('dashboard')
  const [geoGridTab, setGeoGridTab] = useState<'scan' | 'history' | 'schedule'>('scan')
  const [geoForm, setGeoForm] = useState({
    keyword: '',
    gmbLocationId: '',
    gridSize: 7,
    stepKm: 1,
    centerLat: '',
    centerLng: '',
  })
  const [geoRuns, setGeoRuns] = useState<any[]>([])
  const [geoSelectedRunId, setGeoSelectedRunId] = useState<string | null>(null)
  const [geoPoints, setGeoPoints] = useState<any[]>([])
  const [geoLoading, setGeoLoading] = useState(false)
  const [geoRunning, setGeoRunning] = useState(false)
  const [sovRunId, setSovRunId] = useState<string | null>(null)
  const [sovPoints, setSovPoints] = useState<any[]>([])
  const [sovTopN, setSovTopN] = useState(3)
  const [sovLoading, setSovLoading] = useState(false)
  const [sovLoadedRunId, setSovLoadedRunId] = useState<string | null>(null)
  const [contentDashboardFocus, setContentDashboardFocus] = useState<
    | null
    | 'phone'
    | 'categories'
    | 'website'
    | 'appointment_link'
    | 'menu_link'
    | 'attributes'
    | 'opening_date'
    | 'opening_hours'
    | 'photos'
    | 'cover_photo'
    | 'videos'
    | 'business_logo'
    | 'chat_link'
    | 'social_links'
    | 'services'
    | 'products'
    | 'description'
    | 'qna'
    | 'posts'
  >(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [reviewFilter, setReviewFilter] = useState<'all' | 'unreplied' | 'replied'>('all')
  const [reviewRating, setReviewRating] = useState<number | 'all'>('all')
  const [reviewLocationId, setReviewLocationId] = useState<string | 'all'>('all')
  const [reviewSearch, setReviewSearch] = useState('')
  const [replyDrafts, setReplyDrafts] = useState<Record<string, string>>({})
  const [posting, setPosting] = useState(false)
  const [listingsView, setListingsView] = useState<'all' | 'verified' | 'unverified' | 'published' | 'unpublished'>('all')
  const [reviewsView, setReviewsView] = useState<'inbox' | 'needs_reply' | 'replied'>('inbox')
  const [reviewsSection, setReviewsSection] = useState<'dashboard' | 'inbox' | 'templates' | 'qr' | 'auto_reply'>('dashboard')
  const [postsView, setPostsView] = useState<'create' | 'drafts' | 'scheduled' | 'published' | 'failed'>('create')
  const [analyticsView, setAnalyticsView] = useState<'overview' | 'by_city' | 'by_location'>('overview')
  const [perfState, setPerfState] = useState<string>('all')
  const [perfCity, setPerfCity] = useState<string>('all')
  const [perfSearch, setPerfSearch] = useState<string>('')
  const [overviewQuickFilter, setOverviewQuickFilter] = useState<
    | 'none'
    | 'phone_missing'
    | 'website_missing'
    | 'unverified'
    | 'unpublished'
    | 'low_rating'
    | 'low_completion'
    | 'highest_reviews'
    | 'lowest_reviews'
  >('none')
  const [overviewShowHidden, setOverviewShowHidden] = useState(false)
  const [overviewSubtab, setOverviewSubtab] = useState<'listings' | 'performance' | 'detailed_comparison' | 'duplicate_finder'>('listings')
  const [overviewRange, setOverviewRange] = useState<'1m' | '6m' | '1y' | 'all'>('6m')
  const [overviewShowMaps, setOverviewShowMaps] = useState(true)
  const [overviewShowSearch, setOverviewShowSearch] = useState(true)
  const [overviewShowWebsiteClicks, setOverviewShowWebsiteClicks] = useState(true)
  const [overviewShowCallClicks, setOverviewShowCallClicks] = useState(true)
  const [overviewShowDirectionClicks, setOverviewShowDirectionClicks] = useState(true)
  const [bulkView, setBulkView] = useState<'update' | 'history'>('update')
  const [postForm, setPostForm] = useState({
    title: '',
    content: '',
    callToAction: '',
    actionUrl: '',
    mediaUrls: '',
    postType: 'STANDARD',
    scheduledAt: '',
    targetLocationIds: [] as string[],
  })
  const [updateData, setUpdateData] = useState({
    description: '',
    phone: '',
    website: '',
  })
  const [bulkHours, setBulkHours] = useState<
    Array<{ day: string; label: string; closed: boolean; open: string; close: string }>
  >([
    { day: 'MONDAY', label: 'Mon', closed: false, open: '09:00', close: '18:00' },
    { day: 'TUESDAY', label: 'Tue', closed: false, open: '09:00', close: '18:00' },
    { day: 'WEDNESDAY', label: 'Wed', closed: false, open: '09:00', close: '18:00' },
    { day: 'THURSDAY', label: 'Thu', closed: false, open: '09:00', close: '18:00' },
    { day: 'FRIDAY', label: 'Fri', closed: false, open: '09:00', close: '18:00' },
    { day: 'SATURDAY', label: 'Sat', closed: false, open: '09:00', close: '18:00' },
    { day: 'SUNDAY', label: 'Sun', closed: true, open: '09:00', close: '18:00' },
  ])
  const [bulkAttributes, setBulkAttributes] = useState<Array<{ attributeId: string; value: string }>>([
    { attributeId: '', value: 'true' },
  ])
  const [revenueEstimate, setRevenueEstimate] = useState<null | {
    estimatedRevenue: number
    estimatedLeads: number
    windowLabel: string
  }>(null)
  const [mediaCategory, setMediaCategory] = useState<'COVER' | 'LOGO' | 'PROFILE'>('COVER')
  const [mediaUploadMode, setMediaUploadMode] = useState<'url' | 'file'>('url')
  const [mediaSourceUrl, setMediaSourceUrl] = useState('')
  const [mediaFile, setMediaFile] = useState<File | null>(null)
  const [mediaUploading, setMediaUploading] = useState(false)
  const [mediaSyncing, setMediaSyncing] = useState(false)
  const [mediaViewerLocationId, setMediaViewerLocationId] = useState<string | null>(null)
  const [mediaAssets, setMediaAssets] = useState<any[]>([])

  useEffect(() => {
    init()
  }, [])

  // URL <-> state sync (deep linking)
  useEffect(() => {
    const module = searchParams.get('module') as any
    const tab = searchParams.get('tab') as any
    const sub = searchParams.get('sub') as any

    if (module === 'listing_management' || module === 'ai_rank_tracker') {
      setModuleTab(module)
    }
    if (tab) {
      setActiveTab(tab)
    }

    if (tab === 'content_updates' && sub) {
      if (['dashboard', 'update_history', 'bulk_product_update', 'directories'].includes(sub)) {
        setContentUpdatesTab(sub)
      }
    }
    if (tab === 'geo_grid_ranker' && sub) {
      if (['scan', 'history', 'schedule'].includes(sub)) {
        setGeoGridTab(sub)
      }
    }
    if (tab === 'reviews' && sub) {
      if (['dashboard', 'inbox', 'templates', 'qr', 'auto_reply'].includes(sub)) {
        setReviewsSection(sub)
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    const params = new URLSearchParams(searchParams.toString())
    params.set('module', moduleTab)
    params.set('tab', activeTab)

    // sub-tabs
    if (activeTab === 'content_updates') params.set('sub', contentUpdatesTab)
    else if (activeTab === 'geo_grid_ranker') params.set('sub', geoGridTab)
    else if (activeTab === 'reviews') params.set('sub', reviewsSection)
    else params.delete('sub')

    router.replace(`/dashboard/gmb?${params.toString()}`, { scroll: false })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [moduleTab, activeTab, contentUpdatesTab, geoGridTab, reviewsSection])

  useEffect(() => {
    if (!notice) return
    const t = setTimeout(() => setNotice(null), 9000)
    return () => clearTimeout(t)
  }, [notice])

  useEffect(() => {
    const listingTabs: ActiveTab[] = ['weekly_tasks', 'overview', 'listings', 'reviews', 'content_updates', 'post_scheduling']
    const aiTabs: ActiveTab[] = ['performance', 'keyword_position', 'geo_grid_ranker', 'competitors', 'market_research']

    if (moduleTab === 'listing_management') {
      if (!listingTabs.includes(activeTab)) setActiveTab('overview')
    } else {
      if (!aiTabs.includes(activeTab)) setActiveTab('performance')
    }
  }, [moduleTab, activeTab])

  useEffect(() => {
    if (activeTab !== 'content_updates') return
    // reset to main dashboard view for consistent UX
    setContentUpdatesTab('dashboard')
  }, [activeTab])

  useEffect(() => {
    if (activeTab !== 'geo_grid_ranker') return
    setGeoGridTab('scan')
  }, [activeTab])

  const notify = (n: { variant: 'success' | 'error' | 'info'; title: string; message?: string }) => {
    setNotice(n)
  }

  const init = async () => {
    try {
      setLoading(true)

      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        setOrganizationId(null)
        return
      }

      const { data: orgMember, error: orgError } = await supabase
        .from('organization_members')
        .select('organization_id')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .maybeSingle()

      if (orgError) {
        console.error('Error loading organization membership:', orgError)
      }

      const orgId = orgMember?.organization_id ?? null
      setOrganizationId(orgId)
      if (orgId) {
        await loadGmbData(orgId)
        await loadCatalogData(orgId)
        await loadReviewsExtras(orgId)
        await loadRankData(orgId)
        await loadGeoGridData(orgId)
        await loadQna(orgId)
      }
    } finally {
      setLoading(false)
    }
  }

  const openActions = () => {
    setActionsOpen(true)
    setActionsQuery('')
    setActionsIndex(0)
  }
  const closeActions = () => {
    setActionsOpen(false)
    setActionsQuery('')
    setActionsIndex(0)
  }

  const actions = useMemo(() => {
    const base: Array<{
      id: string
      label: string
      hint?: string
      keywords: string
      run: () => void | Promise<void>
      disabled?: boolean
    }> = [
      {
        id: 'connect',
        label: 'Connect Google account',
        hint: 'OAuth',
        keywords: 'connect google oauth gmb gbp account',
        run: () => handleConnectGoogle(),
        disabled: loading,
      },
      {
        id: 'sync_all',
        label: 'Sync all locations',
        hint: 'Imports locations',
        keywords: 'sync locations refresh import',
        run: () => handleSyncLocations(),
        disabled: syncing || !organizationId || accounts.length === 0,
      },
      {
        id: 'sync_reviews',
        label: 'Sync reviews',
        hint: 'Fetch latest',
        keywords: 'sync reviews refresh',
        run: () => handleSyncReviews(),
        disabled: syncingReviews || !organizationId || accounts.length === 0,
      },
      {
        id: 'sync_insights',
        label: 'Sync insights (30 days)',
        hint: 'Performance',
        keywords: 'sync insights analytics performance',
        run: () => handleSyncInsights(),
        disabled: syncingInsights || !organizationId || accounts.length === 0,
      },
      {
        id: 'toggle_autosync',
        label: autoSyncEnabled ? 'Turn auto-sync OFF' : 'Turn auto-sync ON',
        hint: 'Background',
        keywords: 'auto sync toggle background realtime',
        run: () => setAutoSyncEnabled((v) => !v),
        disabled: !organizationId,
      },
      {
        id: 'go_listing',
        label: 'Go to: Listing Management → Overview',
        keywords: 'go overview listing management',
        run: () => {
          setModuleTab('listing_management')
          setActiveTab('overview')
        },
      },
      {
        id: 'go_locations',
        label: 'Go to: Listing Management → Listings',
        keywords: 'go listings locations',
        run: () => {
          setModuleTab('listing_management')
          setActiveTab('listings')
        },
      },
      {
        id: 'go_reviews',
        label: 'Go to: Listing Management → Reviews',
        keywords: 'go reviews inbox',
        run: () => {
          setModuleTab('listing_management')
          setActiveTab('reviews')
        },
      },
      {
        id: 'go_content',
        label: 'Go to: Listing Management → Content updates',
        keywords: 'go content updates bulk',
        run: () => {
          setModuleTab('listing_management')
          setActiveTab('content_updates')
        },
      },
      {
        id: 'go_posts',
        label: 'Go to: Listing Management → Post scheduling',
        keywords: 'go posts scheduling',
        run: () => {
          setModuleTab('listing_management')
          setActiveTab('post_scheduling')
        },
      },
      {
        id: 'go_ai_perf',
        label: 'Go to: AI Rank Tracker → Performance',
        keywords: 'go ai performance',
        run: () => {
          setModuleTab('ai_rank_tracker')
          setActiveTab('performance')
        },
      },
      {
        id: 'go_ai_kw',
        label: 'Go to: AI Rank Tracker → Keyword position',
        keywords: 'go ai keyword position ranks',
        run: () => {
          setModuleTab('ai_rank_tracker')
          setActiveTab('keyword_position')
        },
      },
    ]

    const q = actionsQuery.trim().toLowerCase()
    if (!q) return base
    return base.filter((a) => (a.label + ' ' + a.keywords).toLowerCase().includes(q))
  }, [
    accounts.length,
    actionsQuery,
    autoSyncEnabled,
    loading,
    organizationId,
    setActiveTab,
    setAutoSyncEnabled,
    setModuleTab,
    syncing,
    syncingInsights,
    syncingReviews,
  ])

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const key = String(e.key || '').toLowerCase()
      const isK = key === 'k'
      const isEsc = key === 'escape'
      if ((e.ctrlKey || e.metaKey) && isK) {
        e.preventDefault()
        setActionsOpen((v) => {
          const next = !v
          if (next) {
            setActionsQuery('')
            setActionsIndex(0)
          }
          return next
        })
        return
      }
      if (!actionsOpen) return
      if (isEsc) {
        e.preventDefault()
        closeActions()
        return
      }
      if (key === 'arrowdown') {
        e.preventDefault()
        setActionsIndex((i) => Math.min(actions.length - 1, i + 1))
        return
      }
      if (key === 'arrowup') {
        e.preventDefault()
        setActionsIndex((i) => Math.max(0, i - 1))
        return
      }
      if (key === 'enter') {
        e.preventDefault()
        const a = actions[actionsIndex]
        if (!a || a.disabled) return
        Promise.resolve(a.run()).finally(() => closeActions())
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [actions, actionsIndex, actionsOpen])

  // Realtime + auto-refresh: keep UI up to date when DB changes.
  useEffect(() => {
    if (!organizationId) return

    let cancelled = false
    let refreshTimer: any = null
    const scheduleRefresh = () => {
      if (cancelled) return
      if (refreshTimer) clearTimeout(refreshTimer)
      refreshTimer = setTimeout(() => {
        if (cancelled) return
        loadGmbData(organizationId)
      }, 700)
    }

    const channel = supabase
      .channel(`gmb-org-${organizationId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'gmb_accounts', filter: `organization_id=eq.${organizationId}` },
        scheduleRefresh
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'gmb_locations', filter: `organization_id=eq.${organizationId}` },
        scheduleRefresh
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'gmb_reviews', filter: `organization_id=eq.${organizationId}` },
        scheduleRefresh
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'gmb_posts', filter: `organization_id=eq.${organizationId}` },
        scheduleRefresh
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'gmb_insights', filter: `organization_id=eq.${organizationId}` },
        scheduleRefresh
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'gmb_bulk_updates', filter: `organization_id=eq.${organizationId}` },
        scheduleRefresh
      )
      .subscribe()

    // Fallback refresh in case Realtime is not enabled on the project.
    const fallback = setInterval(() => {
      if (!organizationId) return
      loadGmbData(organizationId)
    }, 60_000)

    return () => {
      cancelled = true
      if (refreshTimer) clearTimeout(refreshTimer)
      clearInterval(fallback)
      try {
        supabase.removeChannel(channel)
      } catch {
        // ignore
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [organizationId])

  // Auto-sync from Google (background) so user doesn't have to click "Sync" everywhere.
  useEffect(() => {
    if (!organizationId) return
    if (!autoSyncEnabled) return
    if (accounts.length === 0) return

    autoSyncBackoffUntilRef.current = autoSyncBackoffUntil || 0

    let cancelled = false
    let running = false
    let lastLocationsSyncAt = 0
    let lastReviewsSyncAt = 0
    let lastInsightsSyncAt = 0
    let lastSearchKeywordsSyncAt = 0

    const invokeSilent = async (name: string, body: any) => {
      // If auth session is missing/expired, edge functions will 401 (often with non-JSON body).
      const { data: sessionData } = await supabase.auth.getSession()
      if (!sessionData?.session) {
        throw new Error('auth: Session expired. Please re-login.')
      }

      const { error } = await supabase.functions.invoke(name, { body })
      if (error) {
        const msg = await edgeErrorMessage(error)
        throw new Error(`${name}: ${msg}`)
      }
    }

    const loop = async () => {
      if (cancelled || running) return
      if (autoSyncBackoffUntilRef.current && Date.now() < autoSyncBackoffUntilRef.current) return
      running = true
      setAutoSyncStatus('syncing')
      try {
        const now = Date.now()

        // Reviews + insights frequently (10 min)
        if (now - lastInsightsSyncAt > 10 * 60_000) {
          await invokeSilent('gmb_sync_insights', { organization_id: organizationId, days: 30 })
          lastInsightsSyncAt = now
        }
        if (now - lastSearchKeywordsSyncAt > 10 * 60_000) {
          await invokeSilent('gmb_sync_search_keywords', { organization_id: organizationId, months: 3 })
          lastSearchKeywordsSyncAt = now
        }
        if (now - lastReviewsSyncAt > 10 * 60_000) {
          await invokeSilent('gmb_sync_reviews', { organization_id: organizationId })
          lastReviewsSyncAt = now
        }

        // Locations less frequently (60 min)
        if (now - lastLocationsSyncAt > 60 * 60_000) {
          await invokeSilent('gmb_sync_locations', { organization_id: organizationId })
          lastLocationsSyncAt = now
        }

        setAutoSyncLastAt(new Date().toISOString())
        setAutoSyncError(null)
        autoSyncBackoffUntilRef.current = 0
        setAutoSyncBackoffUntil(0)
        setAutoSyncStatus('idle')
      } catch (e: any) {
        // Don't spam users; just mark status + keep the app usable.
        setAutoSyncStatus('error')
        setAutoSyncError(await edgeErrorMessage(e))
        const until = Date.now() + 15 * 60_000
        autoSyncBackoffUntilRef.current = until
        setAutoSyncBackoffUntil(until)
      } finally {
        running = false
      }
    }

    // Run once shortly after enabling, then on interval.
    const t0 = setTimeout(loop, 2000)
    const t = setInterval(loop, 60_000)

    return () => {
      cancelled = true
      clearTimeout(t0)
      clearInterval(t)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [organizationId, autoSyncEnabled, accounts.length])

  const loadCatalogData = async (orgId: string) => {
    try {
      setCatalogLoading(true)
      const { data: prod, error: prodErr } = await supabase
        .from('gmb_products')
        .select('*')
        .eq('organization_id', orgId)
        .order('created_at', { ascending: false })
        .limit(200)
      if (prodErr) throw prodErr
      setProducts(prod || [])

      const { data: serv, error: servErr } = await supabase
        .from('gmb_services')
        .select('*')
        .eq('organization_id', orgId)
        .order('created_at', { ascending: false })
        .limit(200)
      if (servErr) throw servErr
      setServices(serv || [])
    } catch (e: any) {
      console.error('Error loading catalog:', e)
    } finally {
      setCatalogLoading(false)
    }
  }

  const createProduct = async () => {
    if (!organizationId) return
    if (!productForm.name.trim()) {
      notify({ variant: 'info', title: 'Product name required' })
      return
    }
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const imageUrls = productForm.imageUrls
      .split('\n')
      .map((s) => s.trim())
      .filter(Boolean)
    const { error } = await supabase.from('gmb_products').insert({
      organization_id: organizationId,
      name: productForm.name.trim(),
      description: productForm.description.trim() || null,
      price: productForm.price.trim() || null,
      category: productForm.category.trim() || null,
      image_urls: imageUrls.length ? imageUrls : null,
      created_by: user.id,
    })
    if (error) {
      notify({ variant: 'error', title: 'Failed to create product', message: error.message })
      return
    }
    setProductForm({ name: '', description: '', price: '', category: '', imageUrls: '' })
    notify({ variant: 'success', title: 'Product created' })
    await loadCatalogData(organizationId)
  }

  const createService = async () => {
    if (!organizationId) return
    if (!serviceForm.name.trim()) {
      notify({ variant: 'info', title: 'Service name required' })
      return
    }
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const { error } = await supabase.from('gmb_services').insert({
      organization_id: organizationId,
      name: serviceForm.name.trim(),
      description: serviceForm.description.trim() || null,
      category: serviceForm.category.trim() || null,
      created_by: user.id,
    })
    if (error) {
      notify({ variant: 'error', title: 'Failed to create service', message: error.message })
      return
    }
    setServiceForm({ name: '', description: '', category: '' })
    notify({ variant: 'success', title: 'Service created' })
    await loadCatalogData(organizationId)
  }

  const applyProductToSelected = async (productId: string) => {
    if (!organizationId) return
    if (!selectedLocations.length) {
      notify({ variant: 'info', title: 'Select locations first' })
      return
    }
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const rows = selectedLocations.map((locId) => ({
      organization_id: organizationId,
      gmb_location_id: locId,
      product_id: productId,
      created_by: user.id,
    }))
    const { error } = await supabase
      .from('gmb_location_products')
      .upsert(rows, { onConflict: 'gmb_location_id,product_id' })
    if (error) {
      notify({ variant: 'error', title: 'Failed to apply product', message: error.message })
      return
    }
    notify({ variant: 'success', title: 'Product applied', message: `Applied to ${selectedLocations.length} location(s).` })
  }

  const applyServiceToSelected = async (serviceId: string) => {
    if (!organizationId) return
    if (!selectedLocations.length) {
      notify({ variant: 'info', title: 'Select locations first' })
      return
    }
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const rows = selectedLocations.map((locId) => ({
      organization_id: organizationId,
      gmb_location_id: locId,
      service_id: serviceId,
      created_by: user.id,
    }))
    const { error } = await supabase
      .from('gmb_location_services')
      .upsert(rows, { onConflict: 'gmb_location_id,service_id' })
    if (error) {
      notify({ variant: 'error', title: 'Failed to apply service', message: error.message })
      return
    }
    notify({ variant: 'success', title: 'Service applied', message: `Applied to ${selectedLocations.length} location(s).` })
  }

  const loadReviewsExtras = async (orgId: string) => {
    try {
      const [tpl, rules, qrs] = await Promise.all([
        supabase
          .from('gmb_review_templates')
          .select('*')
          .eq('organization_id', orgId)
          .order('created_at', { ascending: false })
          .limit(100),
        supabase
          .from('gmb_review_auto_reply_rules')
          .select('*')
          .eq('organization_id', orgId)
          .order('created_at', { ascending: false })
          .limit(100),
        supabase
          .from('gmb_qr_codes')
          .select('*')
          .eq('organization_id', orgId)
          .order('created_at', { ascending: false })
          .limit(100),
      ])

      if (!tpl.error) setReviewTemplates(tpl.data || [])
      if (!rules.error) setAutoReplyRules(rules.data || [])
      if (!qrs.error) setQrCodes(qrs.data || [])
    } catch {
      // ignore
    }
  }

  const loadQna = async (orgId: string) => {
    try {
      setQnaLoading(true)
      const { data, error } = await supabase
        .from('gmb_qna_requests')
        .select('*')
        .eq('organization_id', orgId)
        .order('created_at', { ascending: false })
        .limit(200)
      if (error) throw error
      setQnaItems(data || [])
    } catch (e: any) {
      console.error('Error loading Q&A:', e)
    } finally {
      setQnaLoading(false)
    }
  }

  const createQnaRequest = async () => {
    if (!organizationId) return
    if (!qnaForm.question.trim()) {
      notify({ variant: 'info', title: 'Question is required' })
      return
    }
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const { error } = await supabase.from('gmb_qna_requests').insert({
      organization_id: organizationId,
      gmb_location_id: qnaForm.locationId || null,
      customer_name: qnaForm.customerName.trim() || null,
      customer_contact: qnaForm.customerContact.trim() || null,
      question: qnaForm.question.trim(),
      status: 'open',
      created_by: user.id,
    })
    if (error) {
      notify({ variant: 'error', title: 'Failed to create Q&A', message: error.message })
      return
    }
    setQnaForm({ locationId: '', customerName: '', customerContact: '', question: '' })
    notify({ variant: 'success', title: 'Q&A captured' })
    await loadQna(organizationId)
  }

  const answerQnaRequest = async (id: string) => {
    if (!organizationId) return
    const ans = (qnaAnswerDrafts[id] || '').trim()
    if (!ans) {
      notify({ variant: 'info', title: 'Write an answer first' })
      return
    }
    const { error } = await supabase
      .from('gmb_qna_requests')
      .update({ status: 'answered', answer: ans, answered_at: new Date().toISOString() })
      .eq('organization_id', organizationId)
      .eq('id', id)
    if (error) {
      notify({ variant: 'error', title: 'Failed to save answer', message: error.message })
      return
    }
    setQnaAnswerDrafts((p) => ({ ...p, [id]: '' }))
    notify({ variant: 'success', title: 'Answer saved' })
    await loadQna(organizationId)
  }

  const createReviewTemplate = async () => {
    if (!organizationId) return
    if (!templateForm.name.trim() || !templateForm.templateText.trim()) {
      notify({ variant: 'info', title: 'Name and template are required' })
      return
    }
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const { error } = await supabase.from('gmb_review_templates').insert({
      organization_id: organizationId,
      name: templateForm.name.trim(),
      template_text: templateForm.templateText.trim(),
      created_by: user.id,
    })
    if (error) {
      notify({ variant: 'error', title: 'Failed to create template', message: error.message })
      return
    }
    setTemplateForm({ name: '', templateText: '' })
    notify({ variant: 'success', title: 'Template created' })
    await loadReviewsExtras(organizationId)
  }

  const createAutoReplyRule = async () => {
    if (!organizationId) return
    if (!ruleForm.name.trim()) {
      notify({ variant: 'info', title: 'Rule name required' })
      return
    }
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const { error } = await supabase.from('gmb_review_auto_reply_rules').insert({
      organization_id: organizationId,
      name: ruleForm.name.trim(),
      is_enabled: false,
      min_rating: ruleForm.minRating,
      max_rating: ruleForm.maxRating,
      only_unreplied: true,
      require_approval: ruleForm.requireApproval,
      template_id: ruleForm.templateId || null,
      created_by: user.id,
    })
    if (error) {
      notify({ variant: 'error', title: 'Failed to create rule', message: error.message })
      return
    }
    setRuleForm({ name: '', minRating: 4, maxRating: 5, requireApproval: true, templateId: '' })
    notify({ variant: 'success', title: 'Rule created' })
    await loadReviewsExtras(organizationId)
  }

  const toggleRuleEnabled = async (ruleId: string, enabled: boolean) => {
    if (!organizationId) return
    const { error } = await supabase
      .from('gmb_review_auto_reply_rules')
      .update({ is_enabled: enabled })
      .eq('organization_id', organizationId)
      .eq('id', ruleId)
    if (error) {
      notify({ variant: 'error', title: 'Failed to update rule', message: error.message })
      return
    }
    await loadReviewsExtras(organizationId)
  }

  const generateQr = async () => {
    if (!organizationId) return
    if (!qrForm.targetUrl.trim()) {
      notify({ variant: 'info', title: 'Target URL required' })
      return
    }
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    setQrGenerating(true)
    try {
      const code = Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(2, 6)
      const { error } = await supabase.from('gmb_qr_codes').insert({
        organization_id: organizationId,
        gmb_location_id: qrForm.locationId || null,
        code,
        label: qrForm.label.trim() || null,
        target_url: qrForm.targetUrl.trim(),
        created_by: user.id,
      })
      if (error) throw error

      const link = `${window.location.origin}/api/qr/${code}`
      const QRCode = await import('qrcode')
      const dataUrl = await QRCode.toDataURL(link, { margin: 1, width: 512 })
      setQrPreviewDataUrl(dataUrl)
      notify({ variant: 'success', title: 'QR code created' })
      setQrForm({ label: '', locationId: '', targetUrl: '' })
      await loadReviewsExtras(organizationId)
    } catch (e: any) {
      notify({ variant: 'error', title: 'Failed to create QR', message: e?.message || String(e) })
    } finally {
      setQrGenerating(false)
    }
  }

  const runRankProviderTest = async () => {
    if (!rankTest.keyword.trim()) {
      notify({ variant: 'info', title: 'Enter a keyword' })
      return
    }
    setRankTesting(true)
    setRankTestResult(null)
    try {
      const { data, error } = await supabase.functions.invoke('rank_maps_live', {
        body: {
          tasks: [
            {
              keyword: rankTest.keyword.trim(),
              location_name: rankTest.locationName.trim(),
              language_code: 'en',
              zoom: '15z',
              search_this_area: true,
              search_places: true,
            },
          ],
        },
      })
      if (error) throw error
      setRankTestResult(data)
      notify({ variant: 'success', title: 'Provider test completed' })
    } catch (e: any) {
      notify({ variant: 'error', title: 'Provider test failed', message: await edgeErrorMessage(e) })
    } finally {
      setRankTesting(false)
    }
  }

  const loadRankData = async (orgId: string) => {
    try {
      setRankLoading(true)
      const { data: kws, error: kwErr } = await supabase
        .from('rank_keywords')
        .select('id, keyword, gmb_location_id, location_name, language_code, is_active, is_scheduled, created_at, location:gmb_locations(id, location_name)')
        .eq('organization_id', orgId)
        .order('created_at', { ascending: false })
        .limit(200)
      if (kwErr) throw kwErr
      setRankKeywords(kws || [])

      const { data: pts, error: ptErr } = await supabase
        .from('rank_points')
        .select('id, rank_keyword_id, rank_position, found_title, fetched_at, raw')
        .eq('organization_id', orgId)
        .order('fetched_at', { ascending: false })
        .limit(500)
      if (ptErr) throw ptErr

      const map: Record<string, any> = {}
      const prev: Record<string, any> = {}
      for (const p of pts || []) {
        if (!map[p.rank_keyword_id]) map[p.rank_keyword_id] = p
        else if (!prev[p.rank_keyword_id]) prev[p.rank_keyword_id] = p
      }
      setRankLatestByKeyword(map)
      setRankPrevByKeyword(prev)

      const { data: runs, error: runsErr } = await supabase
        .from('rank_runs')
        .select('*')
        .eq('organization_id', orgId)
        .order('created_at', { ascending: false })
        .limit(20)
      if (!runsErr) setRankRuns(runs || [])
    } catch (e: any) {
      console.error('Error loading rank data:', e)
    } finally {
      setRankLoading(false)
    }
  }

  const createRankKeyword = async () => {
    if (!organizationId) return
    if (!rankKeywordForm.keyword.trim()) {
      notify({ variant: 'info', title: 'Keyword is required' })
      return
    }
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const { error } = await supabase.from('rank_keywords').insert({
      organization_id: organizationId,
      gmb_location_id: rankKeywordForm.gmbLocationId || null,
      keyword: rankKeywordForm.keyword.trim(),
      location_name: rankKeywordForm.locationName.trim() || null,
      language_code: rankKeywordForm.languageCode || 'en',
      is_scheduled: !!rankKeywordForm.isScheduled,
      created_by: user.id,
    })
    if (error) {
      notify({ variant: 'error', title: 'Failed to add keyword', message: error.message })
      return
    }
    setRankKeywordForm((p) => ({ ...p, keyword: '' }))
    notify({ variant: 'success', title: 'Keyword added' })
    await loadRankData(organizationId)
  }

  const runKeywordRanksNow = async () => {
    if (!organizationId) return
    setRankRunning(true)
    try {
      const { data, error } = await supabase.functions.invoke('rank_run_keywords', {
        body: { organization_id: organizationId },
      })
      if (error) throw error
      notify({ variant: 'success', title: 'Rank run completed', message: `Success: ${data?.ok ?? 0}, Failed: ${data?.failed ?? 0}` })
      await loadRankData(organizationId)
    } catch (e: any) {
      notify({ variant: 'error', title: 'Rank run failed', message: await edgeErrorMessage(e) })
    } finally {
      setRankRunning(false)
    }
  }

  const exportKeywordRanksCsv = () => {
    const rows = rankKeywords.map((k) => {
      const latest = rankLatestByKeyword[k.id]
      return {
        keyword: k.keyword,
        location: k.location?.location_name || '',
        rank: latest?.rank_position ?? '',
        fetched_at: latest?.fetched_at ?? '',
        found_title: latest?.found_title ?? '',
      }
    })

    const cols = ['keyword', 'location', 'rank', 'fetched_at', 'found_title']
    const esc = (v: any) => `"${String(v ?? '').replaceAll('"', '""')}"`
    const csv = [cols.join(','), ...rows.map((r) => cols.map((c) => esc((r as any)[c])).join(','))].join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `keyword_ranks_${new Date().toISOString().slice(0, 10)}.csv`
    document.body.appendChild(a)
    a.click()
    a.remove()
    URL.revokeObjectURL(url)
  }

  const runMarketResearch = async () => {
    if (!marketForm.seeds.trim()) {
      notify({ variant: 'info', title: 'Enter seed keywords' })
      return
    }
    setMarketLoading(true)
    setMarketResults([])
    try {
      const seeds = marketForm.seeds
        .split('\n')
        .map((s) => s.trim())
        .filter(Boolean)
        .slice(0, 50)

      const { data, error } = await supabase.functions.invoke('market_keywords_for_keywords', {
        body: { location_code: Number(marketForm.locationCode), keywords: seeds },
      })
      if (error) throw error

      const df = data?.response || {}
      const tasks = df?.tasks
      const t0 = Array.isArray(tasks) && tasks.length ? tasks[0] : null
      const r0 = Array.isArray(t0?.result) && t0.result.length ? t0.result[0] : null
      const items = Array.isArray(r0?.items) ? r0.items : []
      setMarketResults(items)
    } catch (e: any) {
      notify({ variant: 'error', title: 'Market research failed', message: await edgeErrorMessage(e) })
    } finally {
      setMarketLoading(false)
    }
  }

  const addKeywordFromResearch = async (kw: string) => {
    if (!organizationId) return
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const { error } = await supabase.from('rank_keywords').insert({
      organization_id: organizationId,
      gmb_location_id: rankKeywordForm.gmbLocationId || null,
      keyword: kw,
      location_name: rankKeywordForm.locationName.trim() || null,
      language_code: rankKeywordForm.languageCode || 'en',
      is_scheduled: true,
      created_by: user.id,
    })
    if (error) {
      notify({ variant: 'error', title: 'Failed to add keyword', message: error.message })
      return
    }
    notify({ variant: 'success', title: 'Keyword added to tracking' })
    await loadRankData(organizationId)
  }

  const loadGeoGridData = async (orgId: string) => {
    try {
      setGeoLoading(true)
      const { data, error } = await supabase.functions.invoke('geo_grid_get', {
        body: { organization_id: orgId, mode: 'runs' },
      })
      if (error) throw error
      setGeoRuns(data?.runs || [])
    } catch (e: any) {
      console.error('Error loading geo grid runs:', e)
    } finally {
      setGeoLoading(false)
    }
  }

  const loadGeoGridPoints = async (orgId: string, runId: string) => {
    const { data, error } = await supabase.functions.invoke('geo_grid_get', {
      body: { organization_id: orgId, run_id: runId, mode: 'points' },
    })
    if (error) throw error
    setGeoPoints(data?.points || [])
  }

  const loadSovPoints = async (orgId: string, runId: string) => {
    const { data, error } = await supabase.functions.invoke('geo_grid_get', {
      body: { organization_id: orgId, run_id: runId, mode: 'points' },
    })
    if (error) throw error
    setSovPoints(data?.points || [])
  }

  const edgeErrorMessage = async (err: any) => {
    let message = err?.message || String(err)
    try {
      const ctx = err?.context
      if (ctx) {
        // Prefer JSON error bodies (our edge functions respond with JSON).
        if (typeof ctx.json === 'function') {
          try {
            const j = await ctx.json()
            const parts = []
            if (j?.error) parts.push(String(j.error))
            if (j?.step) parts.push(`step: ${String(j.step)}`)
            if (j?.details) parts.push(String(j.details))
            if (parts.length) return parts.join(' • ')
          } catch {
            // fall through to text()
          }
        }

        // Supabase can return non-JSON (e.g. auth/routing errors). Capture raw text too.
        if (typeof ctx.text === 'function') {
          const t = await ctx.text()
          const trimmed = String(t || '').trim()
          if (!trimmed) return message
          // If it's JSON-as-text, try to parse.
          try {
            const j = JSON.parse(trimmed)
            const parts = []
            if (j?.error) parts.push(String(j.error))
            if (j?.step) parts.push(`step: ${String(j.step)}`)
            if (j?.details) parts.push(String(j.details))
            if (parts.length) return parts.join(' • ')
          } catch {
            // keep raw (short) text
          }
          return trimmed.length > 400 ? `${trimmed.slice(0, 400)}…` : trimmed
        }
      }
    } catch {
      // ignore
    }
    return message
  }

  // Auto-load competitor/SoV data when opening the tab (less "0 / empty" state).
  useEffect(() => {
    if (activeTab !== 'competitors') return
    if (!organizationId) return
    if (!geoRuns.length) return

    const defaultRun = (geoRuns as any[]).find((r) => r?.status === 'completed') || geoRuns[0]
    if (!defaultRun?.id) return

    const runId = sovRunId || defaultRun.id
    if (!sovRunId) setSovRunId(runId)
    if (sovLoadedRunId === runId) return

    setSovLoading(true)
    loadSovPoints(organizationId, runId)
      .then(() => setSovLoadedRunId(runId))
      .catch(() => {
        // silent; UI still usable
      })
      .finally(() => setSovLoading(false))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, organizationId, geoRuns, sovRunId])

  // Auto-load latest geo grid run on the ranker tab.
  useEffect(() => {
    if (activeTab !== 'geo_grid_ranker') return
    if (!organizationId) return
    if (!geoRuns.length) return
    if (geoSelectedRunId) return

    const defaultRun = (geoRuns as any[]).find((r) => r?.status === 'completed') || geoRuns[0]
    if (!defaultRun?.id) return
    const runId = String(defaultRun.id)
    setGeoSelectedRunId(runId)
    setGeoPoints([])
    loadGeoGridPoints(organizationId, runId).catch(() => {
      // ignore
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, organizationId, geoRuns, geoSelectedRunId])

  const runGeoGrid = async () => {
    if (!organizationId) return
    if (!geoForm.keyword.trim()) {
      notify({ variant: 'info', title: 'Keyword required' })
      return
    }
    setGeoRunning(true)
    try {
      const { data, error } = await supabase.functions.invoke('geo_grid_run', {
        body: {
          organization_id: organizationId,
          gmb_location_id: geoForm.gmbLocationId || null,
          keyword: geoForm.keyword.trim(),
          grid_size: Number(geoForm.gridSize) || 7,
          step_km: Number(geoForm.stepKm) || 1,
          center_lat: geoForm.centerLat ? Number(geoForm.centerLat) : null,
          center_lng: geoForm.centerLng ? Number(geoForm.centerLng) : null,
        },
      })
      if (error) throw error
      notify({
        variant: 'success',
        title: 'Geo grid completed',
        message: `OK: ${data?.ok ?? 0}, Failed: ${data?.failed ?? 0}`,
      })
      await loadGeoGridData(organizationId)
      const runId = data?.run_id
      if (runId) {
        setGeoSelectedRunId(String(runId))
        setGeoPoints([])
        await loadGeoGridPoints(organizationId, String(runId))
      }
    } catch (e: any) {
      notify({ variant: 'error', title: 'Geo grid failed', message: await edgeErrorMessage(e) })
    } finally {
      setGeoRunning(false)
    }
  }

  const loadGmbData = async (orgId: string) => {
    try {
      // Use Edge Function to avoid PostgREST/RLS issues when fetching tokens-backed tables.
      const { data, error } = await supabase.functions.invoke('gmb_get_data', {
        body: { organization_id: orgId },
      })

      if (error) throw error

      setAccounts(data?.accounts || [])
      setLocations(data?.locations || [])
      setPosts(data?.posts || [])
      setReviews(data?.reviews || [])
      setInsights(data?.insights || [])
      setBulkUpdates(data?.bulk_updates || [])
    } catch (error) {
      console.error('Error loading GMB data:', error)
    }
  }

  const baseFilteredLocations = useMemo(() => locations.filter((l) => {
    if (!searchQuery.trim()) return true
    const q = searchQuery.trim().toLowerCase()
    const name = (l.location_name || '').toLowerCase()
    const category = ((l as any).category || '').toLowerCase()
    const addr = (l.address?.addressLines?.[0] || l.address?.formattedAddress || '').toString().toLowerCase()
    return name.includes(q) || category.includes(q) || addr.includes(q)
  }), [locations, searchQuery])

  const filteredLocations = useMemo(() => {
    return baseFilteredLocations.filter((l: any) => {
      if (listingsView === 'verified') return !!l.is_verified
      if (listingsView === 'unverified') return !l.is_verified
      if (listingsView === 'published') return !!l.is_published
      if (listingsView === 'unpublished') return !l.is_published
      return true
    })
  }, [baseFilteredLocations, listingsView])

  const filteredReviews = useMemo(() => {
    return reviews.filter((r) => {
      if (reviewFilter === 'unreplied' && r.is_replied) return false
      if (reviewFilter === 'replied' && !r.is_replied) return false
      if (reviewRating !== 'all' && r.rating !== reviewRating) return false
      if (reviewLocationId !== 'all' && r.gmb_location_id !== reviewLocationId) return false
      if (reviewSearch.trim()) {
        const q = reviewSearch.trim().toLowerCase()
        const name = (r.reviewer_name || '').toLowerCase()
        const comment = (r.comment || '').toLowerCase()
        const loc = (r.location?.location_name || '').toLowerCase()
        if (!name.includes(q) && !comment.includes(q) && !loc.includes(q)) return false
      }
      return true
    })
  }, [reviews, reviewFilter, reviewRating, reviewLocationId, reviewSearch])

  const reviewsForView = useMemo(() => {
    const base =
      reviewsView === 'needs_reply'
        ? filteredReviews.filter((r) => !r.is_replied)
        : reviewsView === 'replied'
          ? filteredReviews.filter((r) => r.is_replied)
          : filteredReviews
    return base
  }, [filteredReviews, reviewsView])

  const postsForView = useMemo(() => {
    if (postsView === 'drafts') return posts.filter((p) => p.status === 'draft')
    if (postsView === 'scheduled') return posts.filter((p) => p.status === 'scheduled')
    if (postsView === 'published') return posts.filter((p) => p.status === 'published')
    if (postsView === 'failed') return posts.filter((p) => p.status === 'failed')
    return posts
  }, [posts, postsView])

  const insightsByLocationTotals = useMemo(() => {
    const map: Record<string, any> = {}
    for (const p of insights) {
      const key = p.gmb_location_id
      if (!map[key]) {
        map[key] = {
          gmb_location_id: key,
          location_name: p.location?.location_name || '—',
          WEBSITE_CLICKS: 0,
          CALL_CLICKS: 0,
          BUSINESS_DIRECTION_REQUESTS: 0,
          IMPRESSIONS: 0,
        }
      }
      if (p.metric_type === 'WEBSITE_CLICKS') map[key].WEBSITE_CLICKS += p.metric_value
      if (p.metric_type === 'CALL_CLICKS') map[key].CALL_CLICKS += p.metric_value
      if (p.metric_type === 'BUSINESS_DIRECTION_REQUESTS') map[key].BUSINESS_DIRECTION_REQUESTS += p.metric_value
      if (
        p.metric_type === 'BUSINESS_IMPRESSIONS_DESKTOP_MAPS' ||
        p.metric_type === 'BUSINESS_IMPRESSIONS_MOBILE_MAPS' ||
        p.metric_type === 'BUSINESS_IMPRESSIONS_DESKTOP_SEARCH' ||
        p.metric_type === 'BUSINESS_IMPRESSIONS_MOBILE_SEARCH'
      ) {
        map[key].IMPRESSIONS += p.metric_value
      }
    }
    return Object.values(map).sort((a: any, b: any) => b.IMPRESSIONS - a.IMPRESSIONS)
  }, [insights])

  const insightsRecentByLocation = useMemo(() => {
    const map: Record<string, any[]> = {}
    for (const p of insights as any[]) {
      const lid = String(p?.gmb_location_id || '')
      if (!lid) continue
      if (!map[lid]) map[lid] = []
      map[lid].push(p)
    }
    for (const lid of Object.keys(map)) {
      map[lid] = map[lid]
        .slice()
        .sort((a, b) => String(b?.date || '').localeCompare(String(a?.date || '')))
        .slice(0, 120)
    }
    return map
  }, [insights])

  const locationById = useMemo(() => {
    const m: Record<string, any> = {}
    for (const l of locations as any[]) m[l.id] = l
    return m
  }, [locations])

  const locationMetaById = useMemo(() => {
    const m: Record<string, { city: string; state: string; postal: string; line: string }> = {}
    for (const l of locations as any[]) {
      const a = l?.address || {}
      const line =
        (Array.isArray(a?.addressLines) && a.addressLines.filter(Boolean).join(', ')) ||
        a?.formattedAddress ||
        a?.addressLine ||
        ''
      const city = a?.locality || a?.city || a?.administrativeAreaLevel2 || a?.subLocality || ''
      const state = a?.administrativeArea || a?.state || a?.administrativeAreaLevel1 || ''
      const postal = a?.postalCode || a?.zip || ''
      m[l.id] = { city: String(city || ''), state: String(state || ''), postal: String(postal || ''), line: String(line || '') }
    }
    return m
  }, [locations])

  const perfStateOptions = useMemo(() => {
    const s = new Set<string>()
    for (const l of locations as any[]) {
      const st = locationMetaById[l.id]?.state || ''
      if (st.trim()) s.add(st.trim())
    }
    return Array.from(s).sort((a, b) => a.localeCompare(b))
  }, [locations, locationMetaById])

  const perfCityOptions = useMemo(() => {
    const s = new Set<string>()
    for (const l of locations as any[]) {
      const meta = locationMetaById[l.id]
      if (!meta) continue
      if (perfState !== 'all' && meta.state !== perfState) continue
      const c = meta.city || ''
      if (c.trim()) s.add(c.trim())
    }
    return Array.from(s).sort((a, b) => a.localeCompare(b))
  }, [locations, locationMetaById, perfState])

  const perfFilteredLocationTotals = useMemo(() => {
    const q = perfSearch.trim().toLowerCase()
    return insightsByLocationTotals.filter((row: any) => {
      const loc = locationById[row.gmb_location_id]
      const meta = locationMetaById[row.gmb_location_id]
      if (!loc) return false
      if (perfState !== 'all' && (meta?.state || '') !== perfState) return false
      if (perfCity !== 'all' && (meta?.city || '') !== perfCity) return false
      if (q) {
        const hay =
          `${row.location_name || ''} ${meta?.line || ''} ${meta?.city || ''} ${meta?.state || ''} ${loc?.phone || ''} ${loc?.website || ''}`
            .toLowerCase()
        if (!hay.includes(q)) return false
      }
      return true
    })
  }, [insightsByLocationTotals, locationById, locationMetaById, perfCity, perfSearch, perfState])

  const perfByCityRows = useMemo(() => {
    const map: Record<string, any> = {}
    for (const row of perfFilteredLocationTotals as any[]) {
      const meta = locationMetaById[row.gmb_location_id] || { city: '', state: '', postal: '', line: '' }
      const city = meta.city || '—'
      const state = meta.state || '—'
      const key = `${state}|||${city}`
      if (!map[key]) {
        map[key] = { key, state, city, locations: 0, WEBSITE_CLICKS: 0, CALL_CLICKS: 0, BUSINESS_DIRECTION_REQUESTS: 0, IMPRESSIONS: 0 }
      }
      map[key].locations += 1
      map[key].WEBSITE_CLICKS += Number(row.WEBSITE_CLICKS || 0)
      map[key].CALL_CLICKS += Number(row.CALL_CLICKS || 0)
      map[key].BUSINESS_DIRECTION_REQUESTS += Number(row.BUSINESS_DIRECTION_REQUESTS || 0)
      map[key].IMPRESSIONS += Number(row.IMPRESSIONS || 0)
    }
    return Object.values(map).sort((a: any, b: any) => b.IMPRESSIONS - a.IMPRESSIONS)
  }, [perfFilteredLocationTotals, locationMetaById])

  const Segmented = ({
    value,
    options,
    onChange,
  }: {
    value: string
    options: Array<{ value: string; label: string; right?: React.ReactNode }>
    onChange: (v: any) => void
  }) => (
    <div className="inline-flex flex-wrap gap-1 rounded-xl bg-gray-100/80 p-1 border border-gray-200">
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          onClick={() => onChange(o.value)}
          className={
            'inline-flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm font-medium transition ' +
            (value === o.value
              ? 'bg-white shadow-sm border border-gray-200 text-gray-900'
              : 'text-gray-600 hover:text-gray-900 hover:bg-white/60')
          }
        >
          {o.label}
          {o.right ? <span className="ml-1">{o.right}</span> : null}
        </button>
      ))}
    </div>
  )

  const insightTotalsByMetric = useMemo(() => {
    const totals: Record<string, number> = {}
    for (const p of insights) {
      totals[p.metric_type] = (totals[p.metric_type] || 0) + (Number(p.metric_value) || 0)
    }
    return totals
  }, [insights])

  const overviewPerfSeries = useMemo(() => {
    const now = Date.now()
    const days = overviewRange === '1m' ? 30 : overviewRange === '6m' ? 180 : overviewRange === '1y' ? 365 : null
    const startAt = days ? now - days * 24 * 60 * 60_000 : null
    const bucket = overviewRange === '1m' ? 'day' : overviewRange === 'all' ? 'month' : 'month'

    const map = new Map<string, any>()
    for (const p of insights as any[]) {
      const d = new Date(p.date)
      if (startAt && d.getTime() < startAt) continue
      const key = bucket === 'day' ? String(p.date) : String(p.date).slice(0, 7)
      if (!map.has(key)) {
        map.set(key, {
          key,
          IMP_MAPS: 0,
          IMP_SEARCH: 0,
          WEBSITE_CLICKS: 0,
          CALL_CLICKS: 0,
          DIRECTIONS: 0,
        })
      }
      const row = map.get(key)
      const mt = String(p.metric_type)
      const mv = Number(p.metric_value || 0)
      if (mt === 'WEBSITE_CLICKS') row.WEBSITE_CLICKS += mv
      if (mt === 'CALL_CLICKS') row.CALL_CLICKS += mv
      if (mt === 'BUSINESS_DIRECTION_REQUESTS') row.DIRECTIONS += mv
      if (mt === 'BUSINESS_IMPRESSIONS_DESKTOP_MAPS' || mt === 'BUSINESS_IMPRESSIONS_MOBILE_MAPS') row.IMP_MAPS += mv
      if (mt === 'BUSINESS_IMPRESSIONS_DESKTOP_SEARCH' || mt === 'BUSINESS_IMPRESSIONS_MOBILE_SEARCH') row.IMP_SEARCH += mv
    }

    const rows = Array.from(map.values()).sort((a, b) => (a.key > b.key ? 1 : -1))
    for (const r of rows) {
      r.IMPRESSIONS = Number(r.IMP_MAPS || 0) + Number(r.IMP_SEARCH || 0)
      r.TOTAL_CLICKS = Number(r.WEBSITE_CLICKS || 0) + Number(r.CALL_CLICKS || 0) + Number(r.DIRECTIONS || 0)
      r.CTR = r.IMPRESSIONS ? Math.round((Number(r.WEBSITE_CLICKS || 0) / r.IMPRESSIONS) * 1000) / 10 : 0
    }
    return rows
  }, [insights, overviewRange])

  const overviewRankSeries = useMemo(() => {
    const now = Date.now()
    const days = overviewRange === '1m' ? 30 : overviewRange === '6m' ? 180 : overviewRange === '1y' ? 365 : null
    const startAt = days ? now - days * 24 * 60 * 60_000 : null
    const bucket = overviewRange === '1m' ? 'day' : 'month'

    const map = new Map<string, { key: string; sum: number; count: number }>()
    for (const kw of rankKeywords as any[]) {
      const latest = rankLatestByKeyword[kw.id]
      const prev = rankPrevByKeyword[kw.id]
      // handled in table; trend uses rank_points below if present
      void prev
    }
    // use rankLatestByKeyword doesn't have history; approximate trend from rankPrevByKeyword is too short.
    // We compute a simple current avg rank line flat if no time series exists.
    const flat = (() => {
      const vals = rankKeywords
        .map((k: any) => rankLatestByKeyword[k.id]?.rank_position)
        .filter((x: any) => x != null)
        .map((x: any) => Number(x))
        .filter((x: any) => Number.isFinite(x) && x > 0)
      return vals.length ? Math.round((vals.reduce((a: number, b: number) => a + b, 0) / vals.length) * 100) / 100 : null
    })()

    if (!flat) return []

    // Build a pseudo-series for display if needed
    const points = 8
    for (let i = points - 1; i >= 0; i--) {
      const d = new Date(Date.now() - i * 30 * 24 * 60 * 60_000)
      if (startAt && d.getTime() < startAt) continue
      const key = bucket === 'day' ? d.toISOString().slice(0, 10) : d.toISOString().slice(0, 7)
      map.set(key, { key, sum: flat, count: 1 })
    }
    return Array.from(map.values()).map((r) => ({ key: r.key, AVG_RANK: r.sum }))
  }, [overviewRange, rankKeywords, rankLatestByKeyword, rankPrevByKeyword])

  const handleConnectGoogle = async () => {
    try {
      setLoading(true)
      
      const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID
      if (!clientId) {
        notify({
          variant: 'error',
          title: 'Missing Google Client ID',
          message: 'Set NEXT_PUBLIC_GOOGLE_CLIENT_ID in web/.env.local and restart dev server.',
        })
        return
      }

      // Get current user and organization
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        notify({ variant: 'error', title: 'Please login first' })
        return
      }

      const orgId = organizationId
      if (!orgId) {
        notify({ variant: 'error', title: 'Organization not found', message: 'Please re-login or complete your profile.' })
        return
      }

      // Start OAuth flow
      const redirectUri = `${window.location.origin}/dashboard/gmb/callback`
      const scope = [
        'https://www.googleapis.com/auth/business.manage',
        'https://www.googleapis.com/auth/userinfo.email',
        'https://www.googleapis.com/auth/userinfo.profile'
      ].join(' ')
      
      // Store organization_id in session for callback
      sessionStorage.setItem('gmb_org_id', orgId)
      
      const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?` +
        `client_id=${clientId}&` +
        `redirect_uri=${encodeURIComponent(redirectUri)}&` +
        `response_type=code&` +
        `scope=${encodeURIComponent(scope)}&` +
        `access_type=offline&` +
        `prompt=consent&` +
        `state=${orgId}`

      window.location.href = authUrl
    } catch (error) {
      console.error('Error starting OAuth:', error)
      notify({ variant: 'error', title: 'Failed to connect Google account', message: 'Please try again.' })
    } finally {
      setLoading(false)
    }
  }

  const handleBulkUpdate = async () => {
    if (selectedLocations.length === 0) {
      notify({ variant: 'info', title: 'Select at least one location' })
      return
    }

    if (!organizationId) {
      notify({ variant: 'error', title: 'Organization not found', message: 'Please re-login and try again.' })
      return
    }

    setLoading(true)

    try {
      let updateDataToSend: any = updateData

      if (bulkUpdateType === 'hours') {
        const toHHMM = (t: string) => String(t || '').replace(':', '').slice(0, 4)
        const periods = bulkHours
          .filter((d) => !d.closed && d.open && d.close)
          .map((d) => ({
            openDay: d.day,
            openTime: toHHMM(d.open),
            closeDay: d.day,
            closeTime: toHHMM(d.close),
          }))
        updateDataToSend = { hours: { periods } }
      }

      if (bulkUpdateType === 'attributes') {
        const attrs = bulkAttributes
          .map((a) => ({ attributeId: a.attributeId.trim(), value: a.value.trim() }))
          .filter((a) => a.attributeId)
          .map((a) => ({
            attributeId: a.attributeId,
            values: a.value ? [a.value] : ['true'],
          }))
        updateDataToSend = { attributes: attrs }
      }

      const { data, error } = await supabase.functions.invoke('gmb_bulk_update', {
        body: {
          organization_id: organizationId,
          update_type: bulkUpdateType,
          update_data: updateDataToSend,
          location_ids: selectedLocations,
        },
      })

      if (error) throw error

      notify({
        variant: 'success',
        title: 'Bulk update completed',
        message: `Successfully updated ${data.successful_updates} location(s).`,
      })
      setSelectedLocations([])
      await loadGmbData(organizationId)
    } catch (error) {
      console.error('Error performing bulk update:', error)
      notify({ variant: 'error', title: 'Bulk update failed', message: 'Please try again.' })
    } finally {
      setLoading(false)
    }
  }

  const setLocationsHidden = async (ids: string[], hidden: boolean) => {
    if (!organizationId) return
    if (!ids.length) return
    try {
      const { error } = await supabase
        .from('gmb_locations')
        .update({ is_active: hidden ? false : true })
        .in('id', ids)
        .eq('organization_id', organizationId)
      if (error) throw error
      notify({ variant: 'success', title: hidden ? 'Listings hidden' : 'Listings unhidden', message: `${ids.length} location(s) updated.` })
      await loadGmbData(organizationId)
    } catch (e: any) {
      notify({ variant: 'error', title: 'Update failed', message: await edgeErrorMessage(e) })
    }
  }

  const handleSyncLocations = async (accountDbId?: string) => {
    if (!organizationId) {
      notify({ variant: 'error', title: 'Organization not found', message: 'Please re-login and try again.' })
      return
    }

    setSyncing(true)
    try {
      const { data, error } = await supabase.functions.invoke('gmb_sync_locations', {
        body: {
          organization_id: organizationId,
          account_db_id: accountDbId,
        },
      })

      if (error) throw error

      const total = data?.total_locations ?? 0
      const perAccount = Array.isArray(data?.accounts) ? data.accounts : []
      const errors = perAccount
        .filter((a: any) => a?.error)
        .map((a: any) => `Account ${a?.account_db_id}: ${a?.error}`)
        .join('\n')

      notify({
        variant: errors ? 'info' : 'success',
        title: 'Locations sync completed',
        message: `Imported ${total} location(s).` + (errors ? `\n\nErrors:\n${errors}` : ''),
      })
      await loadGmbData(organizationId)
    } catch (e: any) {
      console.error('Sync error:', e)
      notify({ variant: 'error', title: 'Locations sync failed', message: await edgeErrorMessage(e) })
    } finally {
      setSyncing(false)
    }
  }

  const handleSyncReviews = async () => {
    if (!organizationId) {
      notify({ variant: 'error', title: 'Organization not found', message: 'Please re-login and try again.' })
      return
    }
    setSyncingReviews(true)
    try {
      const { data, error } = await supabase.functions.invoke('gmb_sync_reviews', {
        body: { organization_id: organizationId },
      })
      if (error) throw error
      const total = data?.total_reviews ?? 0
      const upserted = data?.upserted_reviews ?? 0
      const perLoc = Array.isArray(data?.locations) ? data.locations : []
      const errors = perLoc
        .filter((x: any) => x?.error)
        .map((x: any) => `- ${x?.location_name || x?.location_id}: ${x?.status ? `[${x.status}] ` : ''}${String(x.error).slice(0, 300)}`)
        .join('\n')

      notify({
        variant: errors ? 'info' : 'success',
        title: 'Reviews sync completed',
        message:
          `Total fetched: ${total}\nUpserted: ${upserted}` +
          (errors
            ? `\n\nErrors:\n${errors}`
            : total === 0
              ? `\n\nNote: If you have no public reviews on Google yet, total can be 0.`
              : ''),
      })
      await loadGmbData(organizationId)
    } catch (e: any) {
      notify({ variant: 'error', title: 'Reviews sync failed', message: await edgeErrorMessage(e) })
    } finally {
      setSyncingReviews(false)
    }
  }

  const handleSyncInsights = async () => {
    if (!organizationId) {
      notify({ variant: 'error', title: 'Organization not found', message: 'Please re-login and try again.' })
      return
    }
    setSyncingInsights(true)
    try {
      const { data, error } = await supabase.functions.invoke('gmb_sync_insights', {
        body: { organization_id: organizationId, days: 30 },
      })
      if (error) throw error
      const points = data?.total_points_upserted ?? 0

      // Also sync Search Keywords (monthly) so "Search Keywords" insights are available.
      let keywordsRows = 0
      try {
        const { data: kwData, error: kwErr } = await supabase.functions.invoke('gmb_sync_search_keywords', {
          body: { organization_id: organizationId, months: 3 },
        })
        if (kwErr) throw kwErr
        keywordsRows = kwData?.total_rows_upserted ?? 0
      } catch (e: any) {
        // Do not fail the whole analytics sync; just show it as part of the message below.
        keywordsRows = -1
      }

      const perLoc = Array.isArray(data?.locations) ? data.locations : []
      const errors = perLoc
        .filter((x: any) => x?.error)
        .map((x: any) => `- ${x?.location_name || x?.location_id}: ${x?.status ? `[${x.status}] ` : ''}${String(x.error).slice(0, 300)}`)
        .join('\n')

      notify({
        variant: errors ? 'info' : 'success',
        title: 'Analytics sync completed',
        message:
          `Points upserted: ${points}` +
          `\nSearch keywords rows upserted: ${keywordsRows < 0 ? 'error' : keywordsRows}` +
          (errors
            ? `\n\nErrors:\n${errors}`
            : points === 0
              ? `\n\nNote: Some accounts have 0 for a new range. If you see zeros + errors, it’s an API/permission issue.`
              : ''),
      })
      await loadGmbData(organizationId)
    } catch (e: any) {
      notify({ variant: 'error', title: 'Analytics sync failed', message: await edgeErrorMessage(e) })
    } finally {
      setSyncingInsights(false)
    }
  }

  const exportLocationsCsv = (rows: any[]) => {
    const columns: Array<{ key: string; label: string }> = [
      { key: 'location_name', label: 'Location Name' },
      { key: 'category', label: 'Category' },
      { key: 'address', label: 'Address' },
      { key: 'phone', label: 'Phone' },
      { key: 'website', label: 'Website' },
      { key: 'is_verified', label: 'Verified' },
      { key: 'is_published', label: 'Published' },
    ]

    const escape = (v: any) => {
      const s = (v ?? '').toString().replaceAll('"', '""')
      return `"${s}"`
    }

    const lines = [
      columns.map((c) => escape(c.label)).join(','),
      ...rows.map((r) => {
        const addr = r?.address?.formattedAddress || r?.address?.addressLines?.[0] || ''
        return columns
          .map((c) => {
            const value =
              c.key === 'address'
                ? addr
                : c.key === 'is_verified' || c.key === 'is_published'
                  ? r?.[c.key]
                    ? 'yes'
                    : 'no'
                  : r?.[c.key] ?? ''
            return escape(value)
          })
          .join(',')
      }),
    ].join('\n')

    const blob = new Blob([lines], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `gmb_locations_${new Date().toISOString().slice(0, 10)}.csv`
    document.body.appendChild(a)
    a.click()
    a.remove()
    URL.revokeObjectURL(url)
  }

  const uploadMediaFileToStorage = async (orgId: string, file: File) => {
    const ext = (file.name.split('.').pop() || 'jpg').toLowerCase()
    const safeExt = ['jpg', 'jpeg', 'png', 'webp'].includes(ext) ? ext : 'jpg'
    const path = `org/${orgId}/${Date.now()}_${Math.random().toString(16).slice(2)}.${safeExt}`

    const { data, error } = await supabase.storage.from('gmb_media').upload(path, file, {
      upsert: true,
      contentType: file.type || `image/${safeExt}`,
    })
    if (error) throw error

    const { data: pub } = supabase.storage.from('gmb_media').getPublicUrl(data.path)
    return pub.publicUrl
  }

  const handleCreateMedia = async () => {
    if (!organizationId) {
      notify({ variant: 'error', title: 'Organization not found' })
      return
    }
    if (!selectedLocations.length) {
      notify({ variant: 'info', title: 'Select locations first', message: 'Go to Listings and select target locations.' })
      return
    }

    setMediaUploading(true)
    try {
      let url = mediaSourceUrl.trim()
      if (mediaUploadMode === 'file') {
        if (!mediaFile) {
          notify({ variant: 'info', title: 'Choose a file first' })
          return
        }
        url = await uploadMediaFileToStorage(organizationId, mediaFile)
      }

      if (!url) {
        notify({ variant: 'info', title: 'Provide a URL or upload a file' })
        return
      }

      const { data, error } = await supabase.functions.invoke('gmb_media_create', {
        body: {
          organization_id: organizationId,
          location_ids: selectedLocations,
          category: mediaCategory,
          source_url: url,
          media_format: 'PHOTO',
        },
      })
      if (error) throw error
      notify({ variant: 'success', title: 'Media uploaded', message: `Success: ${data?.ok ?? 0}, Failed: ${data?.failed ?? 0}` })
      setMediaSourceUrl('')
      setMediaFile(null)
    } catch (e: any) {
      notify({ variant: 'error', title: 'Media upload failed', message: await edgeErrorMessage(e) })
    } finally {
      setMediaUploading(false)
    }
  }

  const handleLocalUpdate = async (updateFields: Record<string, any>) => {
    if (!organizationId) return
    if (!selectedLocations.length) {
      notify({ variant: 'info', title: 'Select locations first' })
      return
    }
    try {
      const { data, error } = await supabase.functions.invoke('gmb_local_update', {
        body: { organization_id: organizationId, location_ids: selectedLocations, update_fields: updateFields },
      })
      if (error) throw error
      notify({ variant: 'success', title: 'Saved', message: `Updated ${selectedLocations.length} location(s).` })
      await loadGmbData(organizationId)
      return data
    } catch (e: any) {
      notify({ variant: 'error', title: 'Update failed', message: await edgeErrorMessage(e) })
    }
  }

  const loadMediaAssets = async (orgId: string, locId: string) => {
    const { data, error } = await supabase
      .from('gmb_media_assets')
      .select('*')
      .eq('organization_id', orgId)
      .eq('gmb_location_id', locId)
      .order('created_at', { ascending: false })
      .limit(100)
    if (error) throw error
    setMediaAssets(data || [])
  }

  const handleSyncMedia = async () => {
    if (!organizationId) return
    if (!mediaViewerLocationId) {
      notify({ variant: 'info', title: 'Select a location to view media' })
      return
    }
    setMediaSyncing(true)
    try {
      const { data, error } = await supabase.functions.invoke('gmb_sync_media', {
        body: { organization_id: organizationId, gmb_location_id: mediaViewerLocationId },
      })
      if (error) throw error
      await loadMediaAssets(organizationId, mediaViewerLocationId)
      notify({ variant: 'success', title: 'Media synced', message: `Total: ${data?.total ?? 0}` })
    } catch (e: any) {
      notify({ variant: 'error', title: 'Media sync failed', message: await edgeErrorMessage(e) })
    } finally {
      setMediaSyncing(false)
    }
  }

  const suggestReply = (rating: number, locationName?: string) => {
    const store = locationName ? ` at ${locationName}` : ''
    if (rating >= 5) return `Thanks so much for the wonderful review${store}! We’re happy you had a great experience.`
    if (rating >= 4) return `Thanks for your feedback${store}! We’re glad you had a good experience — we’ll keep improving.`
    if (rating >= 3) return `Thanks for sharing your feedback${store}. We’d love to learn more and make this right — please contact us.`
    return `We’re sorry to hear about your experience${store}. Please contact us so we can resolve this as quickly as possible.`
  }

  const handleReplyReview = async (reviewRowId: string) => {
    if (!organizationId) {
      notify({ variant: 'error', title: 'Organization not found', message: 'Please re-login and try again.' })
      return
    }
    const reply = (replyDrafts[reviewRowId] || '').trim()
    if (!reply) {
      notify({ variant: 'info', title: 'Write a reply first' })
      return
    }
    try {
      const { data, error } = await supabase.functions.invoke('gmb_reply_review', {
        body: { organization_id: organizationId, review_row_id: reviewRowId, reply },
      })
      if (error) throw error
      setReplyDrafts((prev) => ({ ...prev, [reviewRowId]: '' }))
      notify({ variant: 'success', title: 'Reply posted successfully' })
      await loadGmbData(organizationId)
      return data
    } catch (e: any) {
      notify({ variant: 'error', title: 'Failed to post reply', message: await edgeErrorMessage(e) })
    }
  }

  const handleCreatePost = async () => {
    if (!organizationId) {
      notify({ variant: 'error', title: 'Organization not found', message: 'Please re-login and try again.' })
      return
    }
    if (!postForm.content.trim()) {
      notify({ variant: 'info', title: 'Post content is required' })
      return
    }
    if (!postForm.targetLocationIds.length) {
      notify({ variant: 'info', title: 'Select at least one target location' })
      return
    }

    setPosting(true)
    try {
      const media = postForm.mediaUrls
        .split('\n')
        .map((s) => s.trim())
        .filter(Boolean)

      const status = postForm.scheduledAt ? 'scheduled' : 'draft'
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        notify({ variant: 'error', title: 'Please login first' })
        return
      }

      const { data: inserted, error: insertErr } = await supabase
        .from('gmb_posts')
        .insert({
          organization_id: organizationId,
          title: postForm.title || null,
          content: postForm.content,
          call_to_action: postForm.callToAction || null,
          action_url: postForm.actionUrl || null,
          media_urls: media.length ? media : null,
          post_type: postForm.postType || 'STANDARD',
          target_locations: postForm.targetLocationIds,
          status,
          scheduled_at: postForm.scheduledAt ? new Date(postForm.scheduledAt).toISOString() : null,
          created_by: user.id,
        })
        .select('*')
        .single()

      if (insertErr) throw insertErr

      setPostForm({
        title: '',
        content: '',
        callToAction: '',
        actionUrl: '',
        mediaUrls: '',
        postType: 'STANDARD',
        scheduledAt: '',
        targetLocationIds: [],
      })

      notify({ variant: 'success', title: 'Post created', message: postForm.scheduledAt ? 'This post is scheduled.' : 'This post is saved as a draft.' })
      await loadGmbData(organizationId)

      // If not scheduled, offer publish immediately via button in list.
      return inserted
    } catch (e: any) {
      notify({ variant: 'error', title: 'Failed to create post', message: await edgeErrorMessage(e) })
    } finally {
      setPosting(false)
    }
  }

  const handlePublishPost = async (postId: string) => {
    if (!organizationId) return
    setPosting(true)
    try {
      const { data, error } = await supabase.functions.invoke('gmb_create_post', {
        body: { organization_id: organizationId, post_id: postId },
      })
      if (error) throw error
      notify({
        variant: (data?.failed_posts ?? 0) > 0 ? 'info' : 'success',
        title: 'Publish completed',
        message: `Success: ${data?.successful_posts ?? 0}, Failed: ${data?.failed_posts ?? 0}`,
      })
      await loadGmbData(organizationId)
    } catch (e: any) {
      notify({ variant: 'error', title: 'Publish failed', message: await edgeErrorMessage(e) })
    } finally {
      setPosting(false)
    }
  }

  const toggleLocationSelection = (locationId: string) => {
    setSelectedLocations(prev =>
      prev.includes(locationId)
        ? prev.filter(id => id !== locationId)
        : [...prev, locationId]
    )
  }

  const selectAllLocations = () => {
    const currentList = filteredLocations
    const allSelected = currentList.length > 0 && currentList.every((l) => selectedLocations.includes(l.id))
    if (allSelected) {
      setSelectedLocations([])
    } else {
      setSelectedLocations(currentList.map(l => l.id))
    }
  }

  const unrepliedCount = useMemo(() => reviews.filter((r) => !r.is_replied).length, [reviews])
  const draftsCount = useMemo(() => posts.filter((p) => p.status !== 'published').length, [posts])

  const reviewsBi = useMemo(() => {
    const total = reviews.length
    const ratingCounts = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 } as Record<number, number>
    let text = 0
    let replied = 0
    for (const r of reviews as any[]) {
      const rt = Number(r.rating || 0)
      if (rt >= 1 && rt <= 5) ratingCounts[rt] += 1
      if (String(r.comment || '').trim()) text += 1
      if (r.is_replied) replied += 1
    }
    const noText = total - text
    const notReplied = total - replied
    const promoters = ratingCounts[5]
    const passives = ratingCounts[4]
    const detractors = ratingCounts[1] + ratingCounts[2] + ratingCounts[3]
    const nps = total ? Math.round(((promoters - detractors) / total) * 10000) / 100 : 0
    const avg = total
      ? Math.round(((1 * ratingCounts[1] + 2 * ratingCounts[2] + 3 * ratingCounts[3] + 4 * ratingCounts[4] + 5 * ratingCounts[5]) / total) * 100) / 100
      : 0

    return { total, ratingCounts, text, noText, replied, notReplied, promoters, passives, detractors, nps, avg }
  }, [reviews])

  const reviewAggByLocation = useMemo(() => {
    const map: Record<string, { total: number; avg: number; replied: number; text: number }> = {}
    for (const r of reviews as any[]) {
      const lid = String(r.gmb_location_id || '')
      if (!lid) continue
      if (!map[lid]) map[lid] = { total: 0, avg: 0, replied: 0, text: 0 }
      map[lid].total += 1
      map[lid].avg += Number(r.rating || 0)
      if (r.is_replied) map[lid].replied += 1
      if (String(r.comment || '').trim()) map[lid].text += 1
    }
    for (const lid of Object.keys(map)) {
      map[lid].avg = map[lid].total ? Math.round((map[lid].avg / map[lid].total) * 100) / 100 : 0
    }
    return map
  }, [reviews])

  const perLocationCompletion = useMemo(() => {
    const scoreFor = (l: any) => {
      const addr = l?.address?.formattedAddress || l?.address?.addressLines?.[0] || ''
      const present = {
        phone: !!String(l?.phone || '').trim(),
        website: !!String(l?.website || '').trim(),
        description: !!String(l?.description || '').trim(),
        category: !!String(l?.category || '').trim(),
        address: !!String(addr || '').trim(),
        hours: !!l?.hours && (typeof l.hours !== 'object' || Object.keys(l.hours || {}).length > 0),
        photos: !!l?.photos && (Array.isArray(l.photos) ? l.photos.length > 0 : Object.keys(l.photos || {}).length > 0),
        logo: !!String(l?.logo_url || '').trim(),
        cover: !!String(l?.cover_photo_url || '').trim(),
        attributes: !!l?.attributes && (Array.isArray(l.attributes) ? l.attributes.length > 0 : Object.keys(l.attributes || {}).length > 0),
      }
      const keys = Object.keys(present) as Array<keyof typeof present>
      const pct = Math.round((keys.reduce((acc, k) => acc + (present[k] ? 1 : 0), 0) / keys.length) * 100)
      return { pct, present }
    }

    const map: Record<string, any> = {}
    for (const l of locations as any[]) {
      map[String(l.id)] = scoreFor(l)
    }
    return map
  }, [locations])

  const overviewLocations = useMemo(() => {
    const q = searchQuery.trim().toLowerCase()
    let list = (locations as any[])
      .filter((l) => (overviewShowHidden ? true : l?.is_active !== false))
      .filter((l) => {
        if (!q) return true
        const name = String(l?.location_name || '').toLowerCase()
        const city = String(l?.address?.locality || '').toLowerCase()
        const addr = String(l?.address?.formattedAddress || l?.address?.addressLines?.[0] || '').toLowerCase()
        return name.includes(q) || city.includes(q) || addr.includes(q)
      })

    const withStats = list.map((l) => {
      const lid = String(l.id)
      const ra = reviewAggByLocation[lid]
      const comp = perLocationCompletion[lid]
      return { l, reviewsTotal: ra?.total || 0, ratingAvg: ra?.avg || 0, completionPct: comp?.pct ?? 0 }
    })

    const applyFilter = (rows: any[]) => {
      switch (overviewQuickFilter) {
        case 'phone_missing':
          return rows.filter((r) => !String(r.l?.phone || '').trim())
        case 'website_missing':
          return rows.filter((r) => !String(r.l?.website || '').trim())
        case 'unverified':
          return rows.filter((r) => !r.l?.is_verified)
        case 'unpublished':
          return rows.filter((r) => !r.l?.is_published)
        case 'low_rating':
          return rows.filter((r) => r.ratingAvg && r.ratingAvg < 4.2)
        case 'low_completion':
          return rows.filter((r) => (r.completionPct ?? 0) < 70)
        case 'highest_reviews':
          return rows.slice().sort((a, b) => (b.reviewsTotal || 0) - (a.reviewsTotal || 0))
        case 'lowest_reviews':
          return rows.slice().sort((a, b) => (a.reviewsTotal || 0) - (b.reviewsTotal || 0))
        default:
          return rows
      }
    }

    return applyFilter(withStats)
  }, [locations, overviewQuickFilter, overviewShowHidden, perLocationCompletion, reviewAggByLocation, searchQuery])

  const sovRows = useMemo(() => {
    const topN = Math.max(1, Math.min(10, Number(sovTopN) || 3))
    const totalPoints = sovPoints.length || 0
    const map: Record<string, any> = {}

    const pickItems = (raw: any) => {
      const tasks = raw?.tasks || raw?.response?.tasks
      const t0 = Array.isArray(tasks) && tasks.length ? tasks[0] : null
      const r0 = Array.isArray(t0?.result) && t0.result.length ? t0.result[0] : null
      const items = r0?.items
      return Array.isArray(items) ? items : []
    }

    for (const p of sovPoints as any[]) {
      const items = pickItems(p.raw)
      const ranked = items
        .map((it: any) => ({
          title: String(it?.title || it?.name || '').trim(),
          rank: Number(it?.rank_group || it?.rank_absolute || it?.rank || null),
          rating: it?.rating?.value ?? it?.rating ?? null,
          reviews: it?.rating?.reviews_count ?? it?.reviews_count ?? it?.reviewsCount ?? null,
        }))
        .filter((x: any) => x.title)
        .sort((a: any, b: any) => (a.rank || 9999) - (b.rank || 9999))
        .slice(0, topN)

      ranked.forEach((it: any, idx: number) => {
        const key = it.title
        if (!map[key]) {
          map[key] = { title: key, points: 0, avgRank: 0, seen: 0, rating: it.rating, reviews: it.reviews }
        }
        map[key].points += 1
        map[key].avgRank += Number(it.rank || (idx + 1))
        map[key].seen += 1
        if (map[key].rating == null) map[key].rating = it.rating
        if (map[key].reviews == null) map[key].reviews = it.reviews
      })
    }

    const rows = Object.values(map).map((r: any) => ({
      ...r,
      share: totalPoints ? Math.round((r.points / totalPoints) * 10000) / 100 : 0,
      avgRank: r.seen ? Math.round((r.avgRank / r.seen) * 100) / 100 : null,
    }))

    rows.sort((a: any, b: any) => b.share - a.share)
    return { totalPoints, topN, rows }
  }, [sovPoints, sovTopN])

  const fmt = (n: any) => {
    const v = Number(n)
    if (!Number.isFinite(v)) return '—'
    return v.toLocaleString()
  }

  const reviewResponseRate = useMemo(() => {
    const total = reviewsBi.total || 0
    return total ? Math.round((reviewsBi.replied / total) * 1000) / 10 : 0
  }, [reviewsBi])

  const contentDashboardCounts = useMemo(() => {
    const total = locations.length
    const countMissing = (fn: (l: any) => boolean) => locations.filter((l: any) => fn(l)).length
    const missingPhone = countMissing((l) => !String(l?.phone || '').trim())
    const missingWebsite = countMissing((l) => !String(l?.website || '').trim())
    const missingDescription = countMissing((l) => !String(l?.description || '').trim())
    const missingCategory = countMissing((l) => !String(l?.category || '').trim())
    const missingAttributes = countMissing((l) => !l?.attributes || (Array.isArray(l.attributes) && l.attributes.length === 0))
    const missingHours = countMissing((l) => !l?.hours || (typeof l.hours === 'object' && Object.keys(l.hours || {}).length === 0))
    const missingPhotos = countMissing((l) => {
      const p = l?.photos
      if (!p) return true
      if (Array.isArray(p)) return p.length === 0
      if (typeof p === 'object') return Object.keys(p).length === 0
      return true
    })

    // Stored locally (Google push depends on API/category permissions)
    const missingCover = countMissing((l) => !String(l?.cover_photo_url || '').trim())
    const missingLogo = countMissing((l) => !String(l?.logo_url || '').trim())
    const missingVideos = countMissing((l) => {
      const v = l?.videos
      if (!v) return true
      if (Array.isArray(v)) return v.length === 0
      return false
    })
    const missingAppointment = countMissing((l) => !String(l?.appointment_link || '').trim())
    const missingMenu = countMissing((l) => !String(l?.menu_link || '').trim())
    const missingChat = countMissing((l) => !String(l?.chat_link || '').trim())
    const missingSocial = countMissing((l) => {
      const s = l?.social_links
      if (!s) return true
      if (typeof s === 'object') return Object.keys(s).length === 0
      return !String(s || '').trim()
    })
    const missingOpeningDate = countMissing((l) => !String(l?.opening_date || '').trim())
    const missingServices = total
    const missingProducts = total
    const missingQna = total
    const missingAdditionalCategories = countMissing((l) => {
      const a = l?.additional_categories
      if (!a) return true
      if (Array.isArray(a)) return a.length === 0
      if (typeof a === 'string') return !a.trim()
      return true
    })

    return {
      total,
      missingPhone,
      missingWebsite,
      missingDescription,
      missingCategory,
      missingAdditionalCategories,
      missingAttributes,
      missingHours,
      missingPhotos,
      missingCover,
      missingLogo,
      missingVideos,
      missingAppointment,
      missingMenu,
      missingChat,
      missingSocial,
      missingOpeningDate,
      missingServices,
      missingProducts,
      missingQna,
    }
  }, [locations])

  const tabInsightCards = useMemo(() => {
    const impressions =
      (insightTotalsByMetric['BUSINESS_IMPRESSIONS_DESKTOP_MAPS'] || 0) +
      (insightTotalsByMetric['BUSINESS_IMPRESSIONS_MOBILE_MAPS'] || 0) +
      (insightTotalsByMetric['BUSINESS_IMPRESSIONS_DESKTOP_SEARCH'] || 0) +
      (insightTotalsByMetric['BUSINESS_IMPRESSIONS_MOBILE_SEARCH'] || 0)
    const clicksWebsite = insightTotalsByMetric['WEBSITE_CLICKS'] || 0
    const clicksCalls = insightTotalsByMetric['CALL_CLICKS'] || 0
    const directions = insightTotalsByMetric['BUSINESS_DIRECTION_REQUESTS'] || 0

    const base = [
      { k: 'impr', label: 'Impressions', value: fmt(impressions), sub: 'Past window (Insights)' },
      { k: 'web', label: 'Website clicks', value: fmt(clicksWebsite), sub: 'From GBP' },
      { k: 'calls', label: 'Calls', value: fmt(clicksCalls), sub: 'From GBP' },
      { k: 'dir', label: 'Directions', value: fmt(directions), sub: 'From GBP' },
    ]

    if (moduleTab === 'listing_management') {
      if (activeTab === 'reviews') {
        return [
          { k: 'avg', label: 'Rating', value: reviewsBi.avg ? `${reviewsBi.avg.toFixed(2)}★` : '—', sub: 'All reviews' },
          { k: 'pending', label: 'Pending replies', value: fmt(unrepliedCount), sub: 'Needs response' },
          { k: 'rr', label: 'Response rate', value: `${reviewResponseRate}%`, sub: 'Replied / total' },
          { k: 'nps', label: 'NPS', value: fmt(reviewsBi.nps), sub: 'Promoters - detractors' },
        ]
      }
      if (activeTab === 'content_updates') {
        const missingCritical = contentDashboardCounts.missingPhone + contentDashboardCounts.missingWebsite + contentDashboardCounts.missingDescription
        return [
          { k: 'sel', label: 'Selected', value: fmt(selectedLocations.length), sub: 'Locations' },
          { k: 'crit', label: 'Critical missing', value: fmt(missingCritical), sub: 'Phone/Website/Desc' },
          { k: 'photos', label: 'Missing photos', value: fmt(contentDashboardCounts.missingPhotos), sub: 'Locations' },
          { k: 'cover', label: 'Missing cover/logo', value: fmt(contentDashboardCounts.missingCover + contentDashboardCounts.missingLogo), sub: 'Locations' },
        ]
      }
      if (activeTab === 'post_scheduling') {
        const drafts = posts.filter((p) => p.status === 'draft').length
        const scheduled = posts.filter((p) => p.status === 'scheduled').length
        const published = posts.filter((p) => p.status === 'published').length
        const failed = posts.filter((p) => p.status === 'failed').length
        return [
          { k: 'd', label: 'Drafts', value: fmt(drafts), sub: 'Ready to publish' },
          { k: 's', label: 'Scheduled', value: fmt(scheduled), sub: 'Upcoming' },
          { k: 'p', label: 'Published', value: fmt(published), sub: 'All time' },
          { k: 'f', label: 'Failed', value: fmt(failed), sub: 'Needs retry' },
        ]
      }
      // overview / listings / weekly_tasks
      return base
    }

    // AI Rank Tracker
    if (activeTab === 'keyword_position') {
      const latestRanks = rankKeywords
        .map((k: any) => rankLatestByKeyword[k.id]?.rank_position)
        .filter((x: any) => x != null)
        .map((x: any) => Number(x))
        .filter((x: any) => Number.isFinite(x))
      const avgRank = latestRanks.length ? Math.round((latestRanks.reduce((a: number, b: number) => a + b, 0) / latestRanks.length) * 10) / 10 : null
      const improved = rankKeywords.filter((k: any) => {
        const latest = rankLatestByKeyword[k.id]
        const prev = rankPrevByKeyword[k.id]
        return latest?.rank_position != null && prev?.rank_position != null && Number(latest.rank_position) < Number(prev.rank_position)
      }).length
      const dropped = rankKeywords.filter((k: any) => {
        const latest = rankLatestByKeyword[k.id]
        const prev = rankPrevByKeyword[k.id]
        return latest?.rank_position != null && prev?.rank_position != null && Number(latest.rank_position) > Number(prev.rank_position)
      }).length
      return [
        { k: 'kw', label: 'Tracked keywords', value: fmt(rankKeywords.length), sub: 'Active' },
        { k: 'avg', label: 'Avg rank', value: avgRank != null ? fmt(avgRank) : '—', sub: 'Latest' },
        { k: 'up', label: 'Improved', value: fmt(improved), sub: 'Vs previous' },
        { k: 'down', label: 'Dropped', value: fmt(dropped), sub: 'Vs previous' },
      ]
    }
    if (activeTab === 'geo_grid_ranker') {
      const latestRun = geoRuns[0]
      const points = geoPoints.length || 0
      const best = geoPoints
        .map((p: any) => Number(p.rank_position))
        .filter((x: any) => Number.isFinite(x))
        .sort((a: number, b: number) => a - b)[0]
      return [
        { k: 'runs', label: 'Scans', value: fmt(geoRuns.length), sub: 'History' },
        { k: 'pts', label: 'Grid points', value: fmt(points), sub: 'Loaded run' },
        { k: 'best', label: 'Best rank', value: best != null ? fmt(best) : '—', sub: 'Loaded run' },
        { k: 'last', label: 'Latest scan', value: latestRun?.created_at ? new Date(latestRun.created_at).toLocaleDateString() : '—', sub: latestRun?.keyword ? String(latestRun.keyword) : '—' },
      ]
    }
    if (activeTab === 'competitors') {
      const top = sovRows.rows?.[0]
      return [
        { k: 'pts', label: 'SoV points', value: sovRows.totalPoints ? fmt(sovRows.totalPoints) : '—', sub: `Top ${fmt(sovRows.topN)}` },
        { k: 'top', label: 'Top listing', value: top?.title ? String(top.title).slice(0, 22) : '—', sub: top?.share != null ? `${top.share}% share` : 'Run SoV' },
        { k: 'avg', label: 'Top avg rank', value: top?.avgRank != null ? fmt(top.avgRank) : '—', sub: 'Top listing' },
        { k: 'hint', label: 'Next step', value: geoRuns.length ? 'Loaded' : 'Run scan', sub: geoRuns.length ? 'Auto-loading SoV' : 'Geo Grid ranker' },
      ]
    }

    // performance / market research
    return base
  }, [
    activeTab,
    contentDashboardCounts,
    geoPoints,
    geoRuns,
    insightTotalsByMetric,
    moduleTab,
    posts,
    rankKeywords,
    rankLatestByKeyword,
    rankPrevByKeyword,
    reviewResponseRate,
    reviewsBi,
    selectedLocations.length,
    sovRows,
    unrepliedCount,
  ])

  const listingQuality = useMemo(() => {
    const required = [
      { key: 'phone', label: 'Phone' },
      { key: 'website', label: 'Website' },
      { key: 'description', label: 'Description' },
      { key: 'category', label: 'Category' },
      { key: 'address', label: 'Address' },
    ] as const

    if (!locations.length) {
      return {
        completionPct: 0,
        profileStrength: 0,
        violations: 0,
        missingCriticalLocations: 0,
        hidden: 0,
      }
    }

    let totalScore = 0
    let violations = 0
    let missingCriticalLocations = 0
    let hidden = 0

    for (const l of locations as any[]) {
      const addr = l?.address?.formattedAddress || l?.address?.addressLines?.[0] || ''
      const present = {
        phone: !!String(l?.phone || '').trim(),
        website: !!String(l?.website || '').trim(),
        description: !!String(l?.description || '').trim(),
        category: !!String(l?.category || '').trim(),
        address: !!String(addr || '').trim(),
      }

      const score = required.reduce((acc, r) => acc + (present[r.key] ? 1 : 0), 0) / required.length
      totalScore += score

      const criticalMissing = !present.phone || !present.website
      if (criticalMissing) missingCriticalLocations += 1
      if (!present.phone) violations += 1
      if (!present.website) violations += 1
      if (!l?.is_published) hidden += 1
    }

    const completionPct = Math.round((totalScore / locations.length) * 100)
    const profileStrength = Math.round(((totalScore / locations.length) * 10) * 10) / 10

    return { completionPct, profileStrength, violations, missingCriticalLocations, hidden }
  }, [locations])

  const overviewSummary = useMemo(() => {
    const avgRank = (() => {
      const vals = rankKeywords
        .map((k: any) => rankLatestByKeyword[k.id]?.rank_position)
        .filter((x: any) => x != null)
        .map((x: any) => Number(x))
        .filter((x: any) => Number.isFinite(x) && x > 0)
      return vals.length ? Math.round((vals.reduce((a: number, b: number) => a + b, 0) / vals.length) * 100) / 100 : null
    })()

    const visibilityScore = avgRank != null ? Math.max(0, Math.min(100, Math.round((1 / avgRank) * 1000) / 10)) : null

    const avgCategories =
      locations.length
        ? Math.round(
            (locations.reduce((acc: number, l: any) => {
              const extra = Array.isArray(l?.additional_categories) ? l.additional_categories.length : 0
              return acc + (l?.category ? 1 : 0) + extra
            }, 0) /
              locations.length) *
              10
          ) / 10
        : 0

    const photosTotal = locations.reduce((acc: number, l: any) => {
      const p = l?.photos
      if (!p) return acc
      if (Array.isArray(p)) return acc + p.length
      if (typeof p === 'object') return acc + Object.keys(p).length
      return acc
    }, 0)

    const directoriesTotal = 0
    const qnaTotal = qnaItems.length

    return {
      avgRank,
      visibilityScore,
      ratingAvg: reviewsBi.avg || null,
      reviewsTotal: reviewsBi.total || 0,
      avgCategories,
      photosTotal,
      productsTotal: products.length,
      servicesTotal: services.length,
      qnaTotal,
      directoriesTotal,
    }
  }, [locations, products.length, qnaItems.length, rankKeywords, rankLatestByKeyword, reviewsBi.avg, reviewsBi.total, services.length])

  const profileStrengthBreakdown = useMemo(() => {
    const clamp10 = (n: number) => Math.max(0, Math.min(10, Math.round(n * 10) / 10))
    const onPage = clamp10((listingQuality.completionPct / 100) * 10)
    const content = clamp10(((locations.length - contentDashboardCounts.missingDescription) / Math.max(1, locations.length)) * 10)
    const review = clamp10(Math.min(10, (reviewsBi.avg / 5) * 10) * (reviewsBi.total ? 1 : 0.4))
    const sentiment = clamp10(((reviewsBi.promoters || 0) / Math.max(1, reviewsBi.total || 1)) * 10)
    const website = clamp10(((locations.length - contentDashboardCounts.missingWebsite) / Math.max(1, locations.length)) * 10)
    const traffic = clamp10(Math.min(10, ((insightTotalsByMetric['WEBSITE_CLICKS'] || 0) + (insightTotalsByMetric['CALL_CLICKS'] || 0)) / 100))
    return { onPage, content, review, sentiment, website, traffic }
  }, [contentDashboardCounts.missingDescription, contentDashboardCounts.missingWebsite, insightTotalsByMetric, listingQuality.completionPct, locations.length, reviewsBi])

  const completionBreakdown = useMemo(() => {
    const total = Math.max(1, locations.length)
    const pct = (missing: number) => Math.round(((total - missing) / total) * 100)
    return {
      phone: pct(contentDashboardCounts.missingPhone),
      website: pct(contentDashboardCounts.missingWebsite),
      description: pct(contentDashboardCounts.missingDescription),
      hours: pct(contentDashboardCounts.missingHours),
      attributes: pct(contentDashboardCounts.missingAttributes),
      photos: pct(contentDashboardCounts.missingPhotos),
      logo: pct(contentDashboardCounts.missingLogo),
      cover: pct(contentDashboardCounts.missingCover),
      videos: pct(contentDashboardCounts.missingVideos),
      qna: pct(contentDashboardCounts.missingQna),
      products: pct(contentDashboardCounts.missingProducts),
      services: pct(contentDashboardCounts.missingServices),
    }
  }, [contentDashboardCounts, locations.length])

  const suspension = useMemo(() => {
    const maxViolations = Math.max(2, (locations.length || 1) * 2)
    const riskPct = Math.round((Math.min(listingQuality.violations, maxViolations) / maxViolations) * 100)
    const label = riskPct <= 25 ? 'Low' : riskPct <= 55 ? 'Medium' : 'High'
    return { riskPct, label }
  }, [listingQuality.violations, locations.length])

  const handleGenerateRevenue = () => {
    const website = Number(insightTotalsByMetric.WEBSITE_CLICKS || 0)
    const calls = Number(insightTotalsByMetric.CALL_CLICKS || 0)
    const directions = Number(insightTotalsByMetric.BUSINESS_DIRECTION_REQUESTS || 0)
    const totalIntent = website + calls + directions
    const estimatedLeads = Math.max(0, Math.round(totalIntent * 0.08))
    const estimatedRevenue = Math.max(0, Math.round(estimatedLeads * 1200))
    setRevenueEstimate({ estimatedRevenue, estimatedLeads, windowLabel: 'Past 30 days' })
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(1200px_500px_at_20%_0%,rgba(37,99,235,0.10),transparent_60%),radial-gradient(900px_500px_at_80%_10%,rgba(16,185,129,0.08),transparent_55%)] bg-white p-6 md:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Notice */}
        {notice ? (
          <div className="sticky top-4 z-50">
            <div
              className={
                'rounded-xl border px-4 py-3 shadow-sm backdrop-blur bg-white/90 ' +
                (notice.variant === 'success'
                  ? 'border-green-200'
                  : notice.variant === 'error'
                    ? 'border-red-200'
                    : 'border-blue-200')
              }
            >
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <Badge
                      variant={
                        notice.variant === 'success'
                          ? 'success'
                          : notice.variant === 'error'
                            ? 'danger'
                            : 'info'
                      }
                    >
                      {notice.variant.toUpperCase()}
                    </Badge>
                    <div className="font-semibold text-gray-900">{notice.title}</div>
                  </div>
                  {notice.message ? (
                    <pre className="mt-1 whitespace-pre-wrap text-sm text-gray-700 font-sans">{notice.message}</pre>
                  ) : null}
                </div>
                <button
                  type="button"
                  className="text-sm font-medium text-gray-500 hover:text-gray-900"
                  onClick={() => setNotice(null)}
                >
                  Dismiss
                </button>
              </div>
            </div>
          </div>
        ) : null}
        {/* Controls dock: actions + tabs */}
        <div className="-mx-2 px-2">
          <div className="rounded-2xl border bg-white/80 backdrop-blur p-3 shadow-sm">
            <div className="flex flex-col gap-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="text-sm font-semibold text-gray-900">GMB</div>
                <div className="flex items-center gap-2">
                  <Button size="sm" onClick={openActions} className="gap-2">
                    <Command className="h-4 w-4" />
                    Actions
                    <span className="ml-1 rounded-md border bg-white px-2 py-0.5 text-[11px] font-semibold text-gray-700">
                      ⌘/Ctrl K
                    </span>
                  </Button>
                  <button
                    type="button"
                    onClick={() => setAutoSyncEnabled((v) => !v)}
                    disabled={!organizationId}
                    className={
                      'inline-flex items-center gap-2 rounded-lg border bg-white px-2.5 py-2 text-sm font-medium transition ' +
                      (!organizationId ? 'opacity-60 cursor-not-allowed' : 'hover:bg-gray-50')
                    }
                    title="Background sync from Google + realtime UI updates"
                  >
                    <span className="text-gray-700">Auto</span>
                    <span className="text-xs text-gray-500">{autoSyncEnabled ? 'ON' : 'OFF'}</span>
                    <span
                      className={
                        'inline-flex h-2 w-2 rounded-full ' +
                        (autoSyncStatus === 'syncing'
                          ? 'bg-blue-500'
                          : autoSyncStatus === 'error'
                            ? 'bg-red-500'
                            : autoSyncEnabled
                              ? 'bg-emerald-500'
                              : 'bg-gray-300')
                      }
                    />
                  </button>
                </div>
              </div>

              {autoSyncStatus === 'error' && autoSyncError ? (
                <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-800">
                  <div className="font-semibold">Auto-sync paused</div>
                  <div className="mt-1">{autoSyncError}</div>
                  {autoSyncBackoffUntil ? (
                    <div className="mt-1 text-red-700">
                      Will retry after {new Date(autoSyncBackoffUntil).toLocaleTimeString()}
                    </div>
                  ) : null}
                </div>
              ) : null}

              <Tabs value={moduleTab} onValueChange={(v) => setModuleTab(v as any)} className="w-full">
                <TabsList className="w-full justify-start bg-gray-50 border border-gray-200 rounded-xl h-10 p-1 overflow-x-auto flex-nowrap whitespace-nowrap">
                  <TabsTrigger value="listing_management" className="gap-2 rounded-lg px-4 py-2 whitespace-nowrap">
                    <Building2 className="h-4 w-4" />
                    Listing Management
                  </TabsTrigger>
                  <TabsTrigger value="ai_rank_tracker" className="gap-2 rounded-lg px-4 py-2 whitespace-nowrap">
                    <BarChart3 className="h-4 w-4" />
                    AI Rank Tracker
                  </TabsTrigger>
                </TabsList>
              </Tabs>

              <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="w-full">
                <TabsList className="w-full justify-start bg-white border border-gray-200 rounded-xl h-10 p-1 overflow-x-auto flex-nowrap whitespace-nowrap gap-1">
                  {moduleTab === 'listing_management' ? (
                    <>
                      <TabsTrigger value="weekly_tasks" className="gap-2 rounded-lg px-3 py-2 whitespace-nowrap">
                        <Sparkles className="h-4 w-4" />
                        Weekly tasks
                      </TabsTrigger>
                      <TabsTrigger value="overview" className="gap-2 rounded-lg px-3 py-2 whitespace-nowrap">
                        <BarChart3 className="h-4 w-4" />
                        Overview
                      </TabsTrigger>
                      <TabsTrigger value="listings" className="gap-2 rounded-lg px-3 py-2 whitespace-nowrap">
                        <MapPin className="h-4 w-4" />
                        Listings <Badge className="ml-1">{locations.length}</Badge>
                      </TabsTrigger>
                      <TabsTrigger value="reviews" className="gap-2 rounded-lg px-3 py-2 whitespace-nowrap">
                        <MessageSquare className="h-4 w-4" />
                        Reviews{' '}
                        {unrepliedCount ? (
                          <Badge variant="info" className="ml-1">
                            {unrepliedCount} pending
                          </Badge>
                        ) : (
                          <Badge className="ml-1">0</Badge>
                        )}
                      </TabsTrigger>
                      <TabsTrigger value="content_updates" className="gap-2 rounded-lg px-3 py-2 whitespace-nowrap">
                        <Edit className="h-4 w-4" />
                        Content updates{' '}
                        {selectedLocations.length ? <Badge className="ml-1">{selectedLocations.length}</Badge> : null}
                      </TabsTrigger>
                      <TabsTrigger value="post_scheduling" className="gap-2 rounded-lg px-3 py-2 whitespace-nowrap">
                        <Megaphone className="h-4 w-4" />
                        Post scheduling{' '}
                        {draftsCount ? <Badge className="ml-1">{draftsCount}</Badge> : <Badge className="ml-1">0</Badge>}
                      </TabsTrigger>
                    </>
                  ) : (
                    <>
                      <TabsTrigger value="performance" className="gap-2 rounded-lg px-3 py-2 whitespace-nowrap">
                        <CalendarDays className="h-4 w-4" />
                        Performance
                      </TabsTrigger>
                      <TabsTrigger value="keyword_position" className="gap-2 rounded-lg px-3 py-2 whitespace-nowrap">
                        <LineChart className="h-4 w-4" />
                        Keyword position
                      </TabsTrigger>
                      <TabsTrigger value="geo_grid_ranker" className="gap-2 rounded-lg px-3 py-2 whitespace-nowrap">
                        <Target className="h-4 w-4" />
                        Geo grid ranker
                      </TabsTrigger>
                      <TabsTrigger value="competitors" className="gap-2 rounded-lg px-3 py-2 whitespace-nowrap">
                        <Trophy className="h-4 w-4" />
                        Competitors
                      </TabsTrigger>
                      <TabsTrigger value="market_research" className="gap-2 rounded-lg px-3 py-2 whitespace-nowrap">
                        <Layers className="h-4 w-4" />
                        Market research
                      </TabsTrigger>
                    </>
                  )}
                </TabsList>
              </Tabs>
            </div>
          </div>
        </div>

        {/* Business insights (always visible, per tab) */}
        <div className="mt-4 grid gap-3 md:grid-cols-4">
          {tabInsightCards.map((c: any) => (
            <div key={c.k} className="rounded-xl border bg-white p-4">
              <div className="text-xs font-semibold text-gray-600">{c.label}</div>
              <div className="mt-1 text-2xl font-semibold text-gray-900">{c.value}</div>
              <div className="mt-1 text-xs text-gray-500">{c.sub}</div>
            </div>
          ))}
        </div>

        {/* Command palette (Ctrl/Cmd+K) */}
        {actionsOpen ? (
          <div
            className="fixed inset-0 z-50 flex items-start justify-center bg-black/40 p-4"
            onMouseDown={(e) => {
              if (e.target === e.currentTarget) closeActions()
            }}
          >
            <div className="w-full max-w-xl overflow-hidden rounded-2xl border bg-white shadow-2xl">
              <div className="border-b p-3">
                <div className="flex items-center gap-2">
                  <Command className="h-4 w-4 text-gray-500" />
                  <input
                    autoFocus
                    value={actionsQuery}
                    onChange={(e) => {
                      setActionsQuery(e.target.value)
                      setActionsIndex(0)
                    }}
                    placeholder="Type an action… (e.g. sync reviews)"
                    className="w-full bg-transparent text-sm outline-none"
                  />
                  <button
                    type="button"
                    className="rounded-md border px-2 py-0.5 text-xs font-semibold text-gray-700"
                    onClick={closeActions}
                  >
                    Esc
                  </button>
                </div>
                <div className="mt-2 flex items-center justify-between text-xs text-gray-500">
                  <div>↑/↓ to navigate • Enter to run</div>
                  <div>{autoSyncEnabled ? 'Auto-sync ON' : 'Auto-sync OFF'}</div>
                </div>
              </div>

              <div className="max-h-[60vh] overflow-y-auto">
                {actions.length === 0 ? (
                  <div className="p-4 text-sm text-gray-600">No matching actions.</div>
                ) : (
                  <div className="divide-y">
                    {actions.slice(0, 12).map((a, idx) => (
                      <button
                        key={a.id}
                        type="button"
                        disabled={!!a.disabled}
                        onMouseEnter={() => setActionsIndex(idx)}
                        onClick={() => {
                          if (a.disabled) return
                          Promise.resolve(a.run()).finally(() => closeActions())
                        }}
                        className={
                          'w-full px-4 py-3 text-left transition ' +
                          (idx === actionsIndex ? 'bg-gray-50' : 'bg-white') +
                          (a.disabled ? ' opacity-50 cursor-not-allowed' : ' hover:bg-gray-50')
                        }
                      >
                        <div className="flex items-center justify-between gap-3">
                          <div className="min-w-0">
                            <div className="text-sm font-semibold text-gray-900 truncate">{a.label}</div>
                            {a.hint ? <div className="mt-0.5 text-xs text-gray-500 truncate">{a.hint}</div> : null}
                          </div>
                          {a.disabled ? <Badge>Disabled</Badge> : <Badge variant="info">Run</Badge>}
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : null}

        {/* Tab content */}
        {activeTab === 'weekly_tasks' && (
          <Card>
            <CardHeader>
              <CardTitle>Weekly tasks</CardTitle>
              <CardDescription>Quick actions to improve your listings performance.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-3">
                <div className="rounded-xl border p-4 bg-white">
                  <div className="text-sm text-gray-600">Reply to pending reviews</div>
                  <div className="mt-2 text-3xl font-semibold text-gray-900">{unrepliedCount}</div>
                  <div className="mt-3">
                    <Button size="sm" onClick={() => setActiveTab('reviews')}>
                      Go to reviews
                    </Button>
                  </div>
                </div>
                <div className="rounded-xl border p-4 bg-white">
                  <div className="text-sm text-gray-600">Create/schedule posts</div>
                  <div className="mt-2 text-3xl font-semibold text-gray-900">{draftsCount}</div>
                  <div className="mt-3">
                    <Button size="sm" onClick={() => setActiveTab('post_scheduling')}>
                      Go to posts
                    </Button>
                  </div>
                </div>
                <div className="rounded-xl border p-4 bg-white">
                  <div className="text-sm text-gray-600">Improve listing completeness</div>
                  <div className="mt-2 text-3xl font-semibold text-gray-900">{locations.length}</div>
                  <div className="mt-3">
                    <Button size="sm" variant="outline" onClick={() => setActiveTab('listings')}>
                      Review listings
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Selected Listings (RightChoice-style) */}
            <Card className="rounded-2xl">
              <CardHeader className="pb-3">
                <div className="flex flex-col gap-3">
                  <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                    <div>
                      <CardDescription>Overview</CardDescription>
                      <CardTitle className="text-xl">
                        Selected Listings:{' '}
                        <span className="font-semibold">
                          {(selectedLocations.length || locations.length).toLocaleString()}
                        </span>{' '}
                        Locations Selected
                      </CardTitle>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleSyncLocations()}
                        disabled={syncing || !organizationId || accounts.length === 0}
                      >
                        <RefreshCw className="h-4 w-4 mr-2" />
                        {syncing ? 'Refreshing…' : 'Refresh account'}
                      </Button>
                      <label className="inline-flex items-center gap-2 rounded-lg border bg-white px-3 py-2 text-sm">
                        <input
                          type="checkbox"
                          checked={overviewShowHidden}
                          onChange={(e) => setOverviewShowHidden(e.target.checked)}
                        />
                        <span className="text-gray-700">Show hidden listings</span>
                      </label>
                    </div>
                  </div>

                  <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                    <div className="relative w-full md:max-w-2xl">
                      <Search className="h-4 w-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <Input
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search Business Name, City or Location"
                        className="pl-9"
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <select
                        className="w-full md:w-56 p-2 border rounded-md"
                        value={overviewQuickFilter}
                        onChange={(e) => setOverviewQuickFilter(e.target.value as any)}
                      >
                        <option value="none">Filters</option>
                        <option value="phone_missing">Phone Number Missing</option>
                        <option value="website_missing">Website URL Missing</option>
                        <option value="unverified">Unverified Listing</option>
                        <option value="unpublished">Hidden/Unpublished</option>
                        <option value="low_rating">Low Rating</option>
                        <option value="low_completion">Low Completion Score</option>
                        <option value="highest_reviews">Highest Reviews</option>
                        <option value="lowest_reviews">Lowest Reviews</option>
                      </select>
                      {selectedLocations.length ? (
                        <Button
                          variant="outline"
                          onClick={() => setLocationsHidden(selectedLocations, true)}
                          disabled={!organizationId}
                        >
                          Hide Listings
                        </Button>
                      ) : null}
                    </div>
                  </div>

                  {/* Top filter pills */}
                  <div className="flex flex-wrap gap-2">
                    {[
                      { k: 'phone_missing', label: 'Phone Number Missing' },
                      { k: 'website_missing', label: 'Website URL Missing' },
                      { k: 'unverified', label: 'Unverified Listing' },
                      { k: 'low_completion', label: 'Low Completion Score' },
                      { k: 'highest_reviews', label: 'Highest Reviews' },
                      { k: 'lowest_reviews', label: 'Lowest Reviews' },
                    ].map((f: any) => (
                      <button
                        key={f.k}
                        type="button"
                        onClick={() => setOverviewQuickFilter((p: any) => (p === f.k ? 'none' : f.k))}
                        className={
                          'rounded-full border px-3 py-1 text-sm transition ' +
                          (overviewQuickFilter === f.k ? 'bg-gray-900 text-white border-gray-900' : 'bg-white hover:bg-gray-50')
                        }
                      >
                        {f.label}
                      </button>
                    ))}
                    {overviewQuickFilter !== 'none' ? (
                      <Button size="sm" variant="ghost" onClick={() => setOverviewQuickFilter('none')}>
                        Clear
                      </Button>
                    ) : null}
                  </div>

                  <div className="pt-2">
                    <Segmented
                      value={overviewSubtab}
                      onChange={setOverviewSubtab as any}
                      options={[
                        { value: 'listings', label: `Listings`, right: <Badge>{locations.length}</Badge> },
                        { value: 'performance', label: 'Performance Data' },
                        { value: 'detailed_comparison', label: 'Detailed Comparison' },
                        { value: 'duplicate_finder', label: 'Duplicate Finder' },
                      ]}
                    />
                  </div>
                </div>
              </CardHeader>

              <CardContent className="pt-0">
                {overviewSubtab === 'listings' ? (
                  <div className="overflow-hidden rounded-xl border bg-white">
                    <div className="grid grid-cols-12 bg-gray-50 px-4 py-2 text-xs font-semibold text-gray-600">
                      <div className="col-span-5 flex items-center gap-2">Name</div>
                      <div className="col-span-2">Completion Score</div>
                      <div className="col-span-2">Rating</div>
                      <div className="col-span-2">Reviews</div>
                      <div className="col-span-1 text-right">Added</div>
                    </div>
                    <div className="divide-y">
                      {overviewLocations.slice(0, 50).map((row: any) => {
                        const l = row.l
                        const lid = String(l.id)
                        const comp = row.completionPct ?? 0
                        const avg = row.ratingAvg ?? 0
                        const total = row.reviewsTotal ?? 0
                        const addr = l?.address?.formattedAddress || l?.address?.addressLines?.[0] || ''
                        const phone = String(l?.phone || '').trim()
                        const website = String(l?.website || '').trim()
                        const category = String((l as any)?.category || '').trim()
                        const risk =
                          !phone || !website ? 'High' : comp < 70 ? 'Medium' : 'Low'
                        const riskVariant = risk === 'Low' ? 'success' : risk === 'Medium' ? 'info' : 'danger'
                        const lastSyncedAt = (l as any)?.last_synced_at || null
                        const isSynced =
                          lastSyncedAt ? Date.now() - new Date(lastSyncedAt).getTime() < 7 * 24 * 60 * 60_000 : false

                        return (
                          <div key={lid} className="px-4 py-3">
                            <div className="grid grid-cols-12 items-start gap-3">
                              <div className="col-span-5 min-w-0">
                                <div className="flex items-center gap-2">
                                  <input
                                    type="checkbox"
                                    checked={selectedLocations.includes(lid)}
                                    onChange={() => toggleLocationSelection(lid)}
                                  />
                                  <div className="min-w-0">
                                    <div className="font-semibold text-gray-900 truncate">{l.location_name}</div>
                                    <div className="text-xs text-gray-500 truncate">{addr}</div>
                                  </div>
                                  {!l?.is_verified ? <Badge variant="info">Locked</Badge> : null}
                                </div>
                              </div>

                              <div className="col-span-2">
                                <div className="font-semibold text-emerald-700">{comp}%</div>
                                <Progress className="mt-2" value={comp} />
                              </div>

                              <div className="col-span-2 text-sm text-gray-900">
                                {avg ? <span className="font-semibold">{avg.toFixed(2)}★</span> : '—'}
                              </div>

                              <div className="col-span-2 text-sm text-gray-900">
                                {total ? <span className="font-semibold">{total}</span> : '0'}
                              </div>

                              <div className="col-span-1 text-right text-xs text-gray-500">
                                {l.created_at ? new Date(l.created_at).toLocaleDateString() : '—'}
                              </div>
                            </div>

                            <div className="mt-3 grid gap-3 md:grid-cols-6 text-sm">
                              <div className="rounded-lg bg-gray-50 p-3 border">
                                <div className="text-xs text-gray-500">Phone Number</div>
                                <div className="mt-1 font-semibold text-gray-900">{phone || '—'}</div>
                              </div>
                              <div className="rounded-lg bg-gray-50 p-3 border">
                                <div className="text-xs text-gray-500">Website Link</div>
                                <div className="mt-1 font-semibold text-gray-900 truncate">{website || '—'}</div>
                              </div>
                              <div className="rounded-lg bg-gray-50 p-3 border">
                                <div className="text-xs text-gray-500">Category</div>
                                <div className="mt-1 font-semibold text-gray-900 truncate">{category || '—'}</div>
                              </div>
                              <div className="rounded-lg bg-gray-50 p-3 border">
                                <div className="text-xs text-gray-500">Comp. Score</div>
                                <div className="mt-1 font-semibold text-gray-900">{comp}%</div>
                              </div>
                              <div className="rounded-lg bg-gray-50 p-3 border">
                                <div className="text-xs text-gray-500">Suspension Risk</div>
                                <div className="mt-1">
                                  <Badge variant={riskVariant as any}>{risk}</Badge>
                                </div>
                              </div>
                              <div className="rounded-lg bg-gray-50 p-3 border flex items-center justify-between gap-2">
                                <div>
                                  <div className="text-xs text-gray-500">Google Account</div>
                                  <div className="mt-1 font-semibold text-gray-900">{isSynced ? 'Synced' : 'Unsynced'}</div>
                                </div>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => setLocationsHidden([lid], l?.is_active === false ? false : true)}
                                >
                                  {l?.is_active === false ? 'Unhide' : 'Hide'}
                                </Button>
                              </div>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                ) : overviewSubtab === 'performance' ? (
                  <div className="space-y-4">
                    <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                      <Segmented
                        value={overviewRange}
                        onChange={setOverviewRange as any}
                        options={[
                          { value: '1m', label: '1M' },
                          { value: '6m', label: '6M' },
                          { value: '1y', label: '1Y' },
                          { value: 'all', label: 'All time' },
                        ]}
                      />
                      <div className="flex items-center gap-2">
                        <Button size="sm" variant="outline" onClick={() => organizationId && loadGmbData(organizationId)} disabled={!organizationId}>
                          <RefreshCw className="h-4 w-4 mr-2" />
                          Refresh data
                        </Button>
                      </div>
                    </div>

                    {/* KPIs */}
                    <div className="grid gap-3 md:grid-cols-4">
                      {(() => {
                        const sums = overviewPerfSeries.reduce(
                          (acc: any, r: any) => {
                            acc.impr += Number(r.IMPRESSIONS || 0)
                            acc.web += Number(r.WEBSITE_CLICKS || 0)
                            acc.calls += Number(r.CALL_CLICKS || 0)
                            acc.dir += Number(r.DIRECTIONS || 0)
                            return acc
                          },
                          { impr: 0, web: 0, calls: 0, dir: 0 }
                        )
                        const totalClicks = sums.web + sums.calls + sums.dir
                        const ctr = sums.impr ? Math.round((sums.web / sums.impr) * 1000) / 10 : 0
                        return (
                          <>
                            <div className="rounded-xl border bg-white p-4">
                              <div className="text-xs text-gray-500">Impressions</div>
                              <div className="mt-1 text-xl font-semibold text-gray-900">{sums.impr.toLocaleString()}</div>
                            </div>
                            <div className="rounded-xl border bg-white p-4">
                              <div className="text-xs text-gray-500">Total clicks</div>
                              <div className="mt-1 text-xl font-semibold text-gray-900">{totalClicks.toLocaleString()}</div>
                            </div>
                            <div className="rounded-xl border bg-white p-4">
                              <div className="text-xs text-gray-500">Call clicks</div>
                              <div className="mt-1 text-xl font-semibold text-gray-900">{sums.calls.toLocaleString()}</div>
                            </div>
                            <div className="rounded-xl border bg-white p-4">
                              <div className="text-xs text-gray-500">CTR</div>
                              <div className="mt-1 text-xl font-semibold text-gray-900">{ctr ? `${ctr}%` : '—'}</div>
                              <div className="mt-1 text-xs text-gray-500">Website clicks / impressions</div>
                            </div>
                          </>
                        )
                      })()}
                    </div>

                    {/* Hyper Local Heatmap (uses geo-grid points) */}
                    <Card className="rounded-2xl">
                      <CardHeader>
                        <CardTitle>Hyper Local Heatmap</CardTitle>
                        <CardDescription>Geo grid points from your latest scan (scatter view).</CardDescription>
                      </CardHeader>
                      <CardContent>
                        {geoPoints.length ? (
                          <div className="h-[360px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                              <RScatterChart>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="lng" type="number" domain={['auto', 'auto']} tick={false} />
                                <YAxis dataKey="lat" type="number" domain={['auto', 'auto']} tick={false} />
                                <Tooltip
                                  formatter={(v: any, n: any) => [v, n]}
                                  labelFormatter={() => ''}
                                />
                                <RScatter
                                  data={geoPoints.map((p: any) => ({
                                    lat: p.lat,
                                    lng: p.lng,
                                    rank: p.rank_position ?? null,
                                  }))}
                                  fill="#2563eb"
                                />
                              </RScatterChart>
                            </ResponsiveContainer>
                          </div>
                        ) : (
                          <div className="text-sm text-gray-600">
                            Run a Geo Grid scan in <span className="font-medium">AI Rank Tracker → Geo grid ranker</span> and select it to load points.
                          </div>
                        )}
                      </CardContent>
                    </Card>

                    {/* Performance graphs */}
                    <Card className="rounded-2xl">
                      <CardHeader className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                        <div>
                          <CardTitle>Performance Graphs</CardTitle>
                          <CardDescription>Impressions and clicks trend.</CardDescription>
                        </div>
                        <div className="flex flex-wrap gap-2 text-xs">
                          <label className="inline-flex items-center gap-2 rounded-lg border bg-white px-3 py-2">
                            <input type="checkbox" checked={overviewShowMaps} onChange={(e) => setOverviewShowMaps(e.target.checked)} />
                            Google Maps
                          </label>
                          <label className="inline-flex items-center gap-2 rounded-lg border bg-white px-3 py-2">
                            <input type="checkbox" checked={overviewShowSearch} onChange={(e) => setOverviewShowSearch(e.target.checked)} />
                            Google Search
                          </label>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="h-[300px] w-full">
                          <ResponsiveContainer width="100%" height="100%">
                            <RLineChart data={overviewPerfSeries}>
                              <CartesianGrid strokeDasharray="3 3" />
                              <XAxis dataKey="key" tick={{ fontSize: 12 }} />
                              <YAxis tick={{ fontSize: 12 }} />
                              <Tooltip />
                              {overviewShowMaps ? <RLine type="monotone" dataKey="IMP_MAPS" stroke="#ef4444" strokeWidth={2} dot={false} /> : null}
                              {overviewShowSearch ? <RLine type="monotone" dataKey="IMP_SEARCH" stroke="#2563eb" strokeWidth={2} dot={false} /> : null}
                            </RLineChart>
                          </ResponsiveContainer>
                        </div>

                        <div className="h-[260px] w-full">
                          <div className="mb-2 flex flex-wrap gap-2 text-xs">
                            <label className="inline-flex items-center gap-2 rounded-lg border bg-white px-3 py-2">
                              <input
                                type="checkbox"
                                checked={overviewShowDirectionClicks}
                                onChange={(e) => setOverviewShowDirectionClicks(e.target.checked)}
                              />
                              Direction clicks
                            </label>
                            <label className="inline-flex items-center gap-2 rounded-lg border bg-white px-3 py-2">
                              <input
                                type="checkbox"
                                checked={overviewShowCallClicks}
                                onChange={(e) => setOverviewShowCallClicks(e.target.checked)}
                              />
                              Call clicks
                            </label>
                            <label className="inline-flex items-center gap-2 rounded-lg border bg-white px-3 py-2">
                              <input
                                type="checkbox"
                                checked={overviewShowWebsiteClicks}
                                onChange={(e) => setOverviewShowWebsiteClicks(e.target.checked)}
                              />
                              Website clicks
                            </label>
                          </div>
                          <ResponsiveContainer width="100%" height="100%">
                            <RLineChart data={overviewPerfSeries}>
                              <CartesianGrid strokeDasharray="3 3" />
                              <XAxis dataKey="key" tick={{ fontSize: 12 }} />
                              <YAxis tick={{ fontSize: 12 }} />
                              <Tooltip />
                              {overviewShowDirectionClicks ? <RLine type="monotone" dataKey="DIRECTIONS" stroke="#f59e0b" strokeWidth={2} dot={false} /> : null}
                              {overviewShowCallClicks ? <RLine type="monotone" dataKey="CALL_CLICKS" stroke="#7c3aed" strokeWidth={2} dot={false} /> : null}
                              {overviewShowWebsiteClicks ? <RLine type="monotone" dataKey="WEBSITE_CLICKS" stroke="#10b981" strokeWidth={2} dot={false} /> : null}
                            </RLineChart>
                          </ResponsiveContainer>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Reviews Summary */}
                    <Card className="rounded-2xl">
                      <CardHeader className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                        <div>
                          <CardTitle>Reviews Summary</CardTitle>
                          <CardDescription>Rating distribution and response coverage.</CardDescription>
                        </div>
                        <Button size="sm" variant="outline" onClick={() => setActiveTab('reviews')}>
                          Check all reviews
                        </Button>
                      </CardHeader>
                      <CardContent>
                        <div className="grid gap-4 lg:grid-cols-3">
                          <div className="rounded-xl border bg-white p-4 lg:col-span-2">
                            <div className="flex items-center justify-between">
                              <div className="text-sm font-semibold text-gray-900">Rating</div>
                              <Badge>Total Reviews {reviewsBi.total}</Badge>
                            </div>
                            <div className="mt-3 text-4xl font-semibold text-gray-900">{reviewsBi.avg.toFixed(2)}★</div>
                            <div className="mt-4 space-y-2">
                              {[5, 4, 3, 2, 1].map((n) => {
                                const c = (reviewsBi.ratingCounts as any)[n] || 0
                                const pct = reviewsBi.total ? Math.round((c / reviewsBi.total) * 100) : 0
                                return (
                                  <div key={n} className="flex items-center gap-3 text-sm">
                                    <div className="w-6 text-gray-700">{n}</div>
                                    <div className="flex-1 h-2 rounded-full bg-gray-100 overflow-hidden">
                                      <div className="h-full bg-amber-500" style={{ width: `${pct}%` }} />
                                    </div>
                                    <div className="w-10 text-right text-gray-700">{pct}%</div>
                                  </div>
                                )
                              })}
                            </div>
                          </div>

                          <div className="space-y-4">
                            <div className="rounded-xl border bg-white p-4">
                              <div className="text-sm font-semibold text-gray-900 mb-2">Text vs No Text</div>
                              <div className="h-[160px]">
                                <ResponsiveContainer width="100%" height="100%">
                                  <RPieChart>
                                    <RPie
                                      data={[
                                        { name: 'Text', value: reviewsBi.text },
                                        { name: 'No Text', value: reviewsBi.noText },
                                      ]}
                                      dataKey="value"
                                      innerRadius={40}
                                      outerRadius={70}
                                      paddingAngle={2}
                                    >
                                      <Cell fill="#3b82f6" />
                                      <Cell fill="#bfdbfe" />
                                    </RPie>
                                    <Tooltip />
                                  </RPieChart>
                                </ResponsiveContainer>
                              </div>
                            </div>
                            <div className="rounded-xl border bg-white p-4">
                              <div className="text-sm font-semibold text-gray-900 mb-2">Replied vs Not Replied</div>
                              <div className="h-[160px]">
                                <ResponsiveContainer width="100%" height="100%">
                                  <RPieChart>
                                    <RPie
                                      data={[
                                        { name: 'Replied', value: reviewsBi.replied },
                                        { name: 'Not Replied', value: reviewsBi.notReplied },
                                      ]}
                                      dataKey="value"
                                      innerRadius={40}
                                      outerRadius={70}
                                      paddingAngle={2}
                                    >
                                      <Cell fill="#22c55e" />
                                      <Cell fill="#fecaca" />
                                    </RPie>
                                    <Tooltip />
                                  </RPieChart>
                                </ResponsiveContainer>
                              </div>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Average Rank Analysis */}
                    <Card className="rounded-2xl">
                      <CardHeader className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                        <div>
                          <CardTitle>Average Rank Analysis</CardTitle>
                          <CardDescription>Keyword-wise rank movement (based on tracked keywords).</CardDescription>
                        </div>
                        <Button size="sm" variant="outline" onClick={() => setActiveTab('keyword_position')}>
                          Go to keyword tracking
                        </Button>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="h-[260px] w-full">
                          <ResponsiveContainer width="100%" height="100%">
                            <RLineChart data={overviewRankSeries}>
                              <CartesianGrid strokeDasharray="3 3" />
                              <XAxis dataKey="key" tick={{ fontSize: 12 }} />
                              <YAxis tick={{ fontSize: 12 }} />
                              <Tooltip />
                              <RLine type="monotone" dataKey="AVG_RANK" stroke="#2563eb" strokeWidth={2} dot={false} />
                            </RLineChart>
                          </ResponsiveContainer>
                        </div>

                        <div className="overflow-hidden rounded-xl border bg-white">
                          <div className="grid grid-cols-12 bg-gray-50 px-4 py-2 text-xs font-semibold text-gray-600">
                            <div className="col-span-6">Keywords</div>
                            <div className="col-span-2">Rank</div>
                            <div className="col-span-2">Change</div>
                            <div className="col-span-2">Listings</div>
                          </div>
                          <div className="divide-y">
                            {rankKeywords.slice(0, 12).map((k: any) => {
                              const latest = rankLatestByKeyword[k.id]
                              const prev = rankPrevByKeyword[k.id]
                              const rank = latest?.rank_position != null ? Number(latest.rank_position) : null
                              const delta =
                                latest?.rank_position != null && prev?.rank_position != null
                                  ? Number(prev.rank_position) - Number(latest.rank_position)
                                  : null
                              const listings = k.gmb_location_id ? 1 : locations.length
                              return (
                                <div key={k.id} className="grid grid-cols-12 items-center px-4 py-3 text-sm">
                                  <div className="col-span-6 font-medium text-gray-900">{k.keyword}</div>
                                  <div className="col-span-2 text-gray-900">{rank != null ? rank : '—'}</div>
                                  <div className="col-span-2">
                                    {delta == null ? (
                                      <span className="text-gray-500">—</span>
                                    ) : delta > 0 ? (
                                      <span className="text-emerald-700 font-semibold">↑ {delta}</span>
                                    ) : delta < 0 ? (
                                      <span className="text-red-700 font-semibold">↓ {Math.abs(delta)}</span>
                                    ) : (
                                      <span className="text-gray-500">0</span>
                                    )}
                                  </div>
                                  <div className="col-span-2 text-gray-700">{listings}</div>
                                </div>
                              )
                            })}
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Directories (placeholder until integrations are wired) */}
                    <Card className="rounded-2xl">
                      <CardHeader>
                        <CardTitle>Directories</CardTitle>
                        <CardDescription>Directory presence tracking (connect integrations as needed).</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="rounded-xl border bg-white p-4">
                          <div className="grid gap-3 md:grid-cols-4 text-sm">
                            <div className="rounded-lg border bg-gray-50 p-3">
                              <div className="text-xs text-gray-500">Completed</div>
                              <div className="mt-1 text-lg font-semibold text-gray-900">—</div>
                            </div>
                            <div className="rounded-lg border bg-gray-50 p-3">
                              <div className="text-xs text-gray-500">Linked</div>
                              <div className="mt-1 text-lg font-semibold text-gray-900">—</div>
                            </div>
                            <div className="rounded-lg border bg-gray-50 p-3">
                              <div className="text-xs text-gray-500">Unlinked</div>
                              <div className="mt-1 text-lg font-semibold text-gray-900">—</div>
                            </div>
                            <div className="rounded-lg border bg-gray-50 p-3">
                              <div className="text-xs text-gray-500">Unavailable</div>
                              <div className="mt-1 text-lg font-semibold text-gray-900">—</div>
                            </div>
                          </div>
                          <div className="mt-4 grid gap-2 md:grid-cols-6">
                            {['Google', 'Bing', 'Apple', 'Facebook', 'Justdial', 'Others'].map((n) => (
                              <div key={n} className="rounded-lg border bg-white p-3 text-center text-sm font-semibold text-gray-800">
                                {n}
                                <div className="mt-2">
                                  <Button size="sm" variant="outline">Connect</Button>
                                </div>
                              </div>
                            ))}
                          </div>
                          <div className="mt-3 text-xs text-gray-500">
                            Note: Directory sync requires additional integrations/APIs. We can enable them per directory when you want.
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                ) : overviewSubtab === 'detailed_comparison' ? (
                  <div className="rounded-xl border bg-white p-4 text-sm text-gray-700">
                    Detailed Comparison view (select fields + export) will appear here.
                  </div>
                ) : (
                  <div className="rounded-xl border bg-white p-4 text-sm text-gray-700">
                    Duplicate Finder view (phone/website/address duplicates) will appear here.
                  </div>
                )}
              </CardContent>
            </Card>

            {overviewSubtab === 'listings' ? (
              <>
                {/* Overview: top cards */}
                <div className="grid gap-4 lg:grid-cols-3">
                  <Card className="rounded-2xl">
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <CardTitle className="text-lg">Audit successful</CardTitle>
                          <CardDescription>Complete missing info to rank higher</CardDescription>
                        </div>
                        <Badge variant="success">OK</Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-5">
                      <div>
                        <div className="flex items-center justify-between text-sm">
                          <div className="text-gray-600">Completion score</div>
                          <div className="font-semibold text-gray-900">{listingQuality.completionPct}%</div>
                        </div>
                        <Progress className="mt-2" value={listingQuality.completionPct} />
                      </div>
                      <div>
                        <div className="flex items-center justify-between text-sm">
                          <div className="text-gray-600">Profile strength</div>
                          <div className="font-semibold text-gray-900">{listingQuality.profileStrength}</div>
                        </div>
                        <Progress className="mt-2" value={Math.round((listingQuality.profileStrength / 10) * 100)} />
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="rounded-2xl">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-lg">Suspension risk</CardTitle>
                      <CardDescription>Based on missing critical fields</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex items-center gap-4">
                        <div className="relative h-14 w-14">
                          <svg viewBox="0 0 36 36" className="h-14 w-14">
                            <path
                              d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="3"
                              className="text-gray-200"
                            />
                            <path
                              d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="3"
                              strokeDasharray={`${suspension.riskPct}, 100`}
                              className={
                                suspension.label === 'Low'
                                  ? 'text-emerald-500'
                                  : suspension.label === 'Medium'
                                    ? 'text-amber-500'
                                    : 'text-red-500'
                              }
                            />
                          </svg>
                        </div>
                        <div className="min-w-0">
                          <div className="text-sm text-gray-600">Risk</div>
                          <div className="text-xl font-semibold text-gray-900">{suspension.label}</div>
                          <div className="text-xs text-gray-500">{listingQuality.violations} critical field issue(s)</div>
                        </div>
                      </div>
                      <div className="rounded-xl border bg-white p-3">
                        <div className="text-xs font-semibold text-gray-600">Policies</div>
                        <div className="mt-1 text-sm text-gray-700">{listingQuality.missingCriticalLocations} listing(s) missing phone/website</div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="rounded-2xl">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-lg">Revenue calculator</CardTitle>
                      <CardDescription>Estimate revenue from GBP performance</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="text-sm text-gray-600">Set up revenue calculator</div>
                        <Button size="sm" variant="outline" onClick={handleGenerateRevenue}>
                          Generate
                        </Button>
                      </div>
                      <div className="rounded-xl border bg-white p-4">
                        <div className="text-xs font-semibold text-gray-600">{revenueEstimate?.windowLabel || 'Past 30 days'}</div>
                        <div className="mt-2 grid grid-cols-2 gap-3">
                          <div>
                            <div className="text-xs text-gray-500">Estimated leads</div>
                            <div className="text-lg font-semibold text-gray-900">{revenueEstimate?.estimatedLeads ?? '—'}</div>
                          </div>
                          <div>
                            <div className="text-xs text-gray-500">Estimated revenue</div>
                            <div className="text-lg font-semibold text-gray-900">
                              {revenueEstimate ? `₹${revenueEstimate.estimatedRevenue.toLocaleString()}` : '—'}
                            </div>
                          </div>
                        </div>
                        <div className="mt-3 text-xs text-gray-500">Uses clicks/calls/directions from Performance.</div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </>
            ) : null}

            {/* Business Summary (RightChoice-style) */}
            <Card className="rounded-2xl">
              <CardHeader>
                <CardTitle>Business Summary</CardTitle>
                <CardDescription>High-level signals across selected locations.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-3 md:grid-cols-4 lg:grid-cols-8">
                  <div className="rounded-xl border bg-white p-4">
                    <div className="text-xs text-gray-500">Avg. Rank</div>
                    <div className="mt-1 text-xl font-semibold text-gray-900">{overviewSummary.avgRank ?? '—'}</div>
                    <div className="mt-1 text-xs text-gray-500">Across tracked keywords</div>
                  </div>
                  <div className="rounded-xl border bg-white p-4">
                    <div className="text-xs text-gray-500">Visibility Score</div>
                    <div className="mt-1 text-xl font-semibold text-gray-900">
                      {overviewSummary.visibilityScore != null ? `${overviewSummary.visibilityScore}%` : '—'}
                    </div>
                    <div className="mt-1 text-xs text-gray-500">Derived from avg rank</div>
                  </div>
                  <div className="rounded-xl border bg-white p-4">
                    <div className="text-xs text-gray-500">Rating</div>
                    <div className="mt-1 text-xl font-semibold text-gray-900">
                      {overviewSummary.ratingAvg ? `${overviewSummary.ratingAvg.toFixed(2)}★` : '—'}
                    </div>
                    <div className="mt-1 text-xs text-gray-500">{overviewSummary.reviewsTotal.toLocaleString()} reviews</div>
                  </div>
                  <div className="rounded-xl border bg-white p-4">
                    <div className="text-xs text-gray-500">Categories</div>
                    <div className="mt-1 text-xl font-semibold text-gray-900">{overviewSummary.avgCategories || '—'}</div>
                    <div className="mt-1 text-xs text-gray-500">Avg per listing</div>
                  </div>
                  <div className="rounded-xl border bg-white p-4">
                    <div className="text-xs text-gray-500">Photos</div>
                    <div className="mt-1 text-xl font-semibold text-gray-900">{overviewSummary.photosTotal.toLocaleString()}</div>
                    <div className="mt-1 text-xs text-gray-500">Total</div>
                  </div>
                  <div className="rounded-xl border bg-white p-4">
                    <div className="text-xs text-gray-500">Products</div>
                    <div className="mt-1 text-xl font-semibold text-gray-900">{overviewSummary.productsTotal.toLocaleString()}</div>
                    <div className="mt-1 text-xs text-gray-500">Catalog</div>
                  </div>
                  <div className="rounded-xl border bg-white p-4">
                    <div className="text-xs text-gray-500">Services</div>
                    <div className="mt-1 text-xl font-semibold text-gray-900">{overviewSummary.servicesTotal.toLocaleString()}</div>
                    <div className="mt-1 text-xs text-gray-500">Catalog</div>
                  </div>
                  <div className="rounded-xl border bg-white p-4">
                    <div className="text-xs text-gray-500">Q & As</div>
                    <div className="mt-1 text-xl font-semibold text-gray-900">{overviewSummary.qnaTotal.toLocaleString()}</div>
                    <div className="mt-1 text-xs text-gray-500">Tracked</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Profile Strength (simple, actionable) */}
            <Card className="rounded-2xl">
              <CardHeader className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                <div>
                  <CardTitle>Profile Strength</CardTitle>
                  <CardDescription>Actionable strengths by area (0–10).</CardDescription>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={() => setActiveTab('content_updates')}>
                    See tasks
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => exportLocationsCsv(overviewLocations.map((r: any) => r.l))} disabled={!overviewLocations.length}>
                    Export CSV
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 lg:grid-cols-3">
                  <div className="rounded-xl border bg-white p-4">
                    <div className="text-sm font-semibold text-gray-900">Task Management</div>
                    <div className="mt-2 grid grid-cols-2 gap-3 text-sm">
                      <div>
                        <div className="text-xs text-gray-500">Completed Tasks</div>
                        <div className="text-lg font-semibold text-gray-900">0</div>
                      </div>
                      <div>
                        <div className="text-xs text-gray-500">Pending Tasks</div>
                        <div className="text-lg font-semibold text-gray-900">
                          {(contentDashboardCounts.missingPhone +
                            contentDashboardCounts.missingWebsite +
                            contentDashboardCounts.missingDescription +
                            contentDashboardCounts.missingHours +
                            contentDashboardCounts.missingAttributes) || 0}
                        </div>
                      </div>
                    </div>
                    <div className="mt-3 text-xs text-gray-500">Auto-generated from missing fields across listings.</div>
                  </div>

                  <div className="rounded-xl border bg-white p-4 lg:col-span-2">
                    <div className="grid gap-3 md:grid-cols-2">
                      {[
                        { k: 'onPage', label: 'On Page Strength', v: profileStrengthBreakdown.onPage },
                        { k: 'content', label: 'Content Strength', v: profileStrengthBreakdown.content },
                        { k: 'review', label: 'Review Strength', v: profileStrengthBreakdown.review },
                        { k: 'sentiment', label: 'Sentiment Strength', v: profileStrengthBreakdown.sentiment },
                        { k: 'website', label: 'Website Strength', v: profileStrengthBreakdown.website },
                        { k: 'traffic', label: 'Traffic Strength', v: profileStrengthBreakdown.traffic },
                      ].map((s) => (
                        <div key={s.k} className="rounded-lg border bg-gray-50 p-3">
                          <div className="flex items-center justify-between text-xs text-gray-600">
                            <span className="font-semibold">{s.label}</span>
                            <span className="font-semibold text-gray-900">{s.v.toFixed(1)}</span>
                          </div>
                          <Progress className="mt-2" value={Math.round((s.v / 10) * 100)} />
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Completion Score breakdown */}
            <Card className="rounded-2xl">
              <CardHeader className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                <div>
                  <CardTitle>Completion Score</CardTitle>
                  <CardDescription>Coverage by field across all listings.</CardDescription>
                </div>
                <Button size="sm" variant="outline" onClick={() => setActiveTab('content_updates')}>
                  View details
                </Button>
              </CardHeader>
              <CardContent>
                <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                  {[
                    { k: 'phone', label: 'Phone No.', v: completionBreakdown.phone },
                    { k: 'website', label: 'Website URLs', v: completionBreakdown.website },
                    { k: 'description', label: 'Description', v: completionBreakdown.description },
                    { k: 'hours', label: 'Opening Hours', v: completionBreakdown.hours },
                    { k: 'attributes', label: 'Attributes', v: completionBreakdown.attributes },
                    { k: 'photos', label: 'Photos', v: completionBreakdown.photos },
                    { k: 'logo', label: 'Logo', v: completionBreakdown.logo },
                    { k: 'cover', label: 'Cover Photo', v: completionBreakdown.cover },
                    { k: 'videos', label: 'Videos', v: completionBreakdown.videos },
                  ].map((b) => (
                    <div key={b.k} className="rounded-xl border bg-white p-4">
                      <div className="flex items-center justify-between text-sm">
                        <div className="text-gray-700">{b.label}</div>
                        <div className="font-semibold text-gray-900">{b.v}%</div>
                      </div>
                      <Progress className="mt-2" value={b.v} />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <div className="grid gap-6 lg:grid-cols-3">
              <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ShieldCheck className="h-5 w-5" />
                  Connected Accounts
                </CardTitle>
                <CardDescription>
                  Manage access, sync status, and connected profiles.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {accounts.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <Building2 className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                    <p className="font-medium">No accounts connected yet</p>
                    <p className="text-sm">Connect your Google account to import locations.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {accounts.map((account: any) => (
                      <div key={account.id} className="flex flex-col gap-3 rounded-xl border p-4 md:flex-row md:items-center md:justify-between">
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="font-semibold text-gray-900">{account.account_name}</p>
                            <Badge variant="success">Connected</Badge>
                          </div>
                          <p className="text-sm text-gray-500">
                            Last synced: {account.last_synced_at ? new Date(account.last_synced_at).toLocaleString() : '—'}
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleSyncLocations(account.id)}
                            disabled={syncing}
                          >
                            <RefreshCw className="h-4 w-4 mr-2" />
                            {syncing ? 'Syncing…' : 'Sync'}
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => setActiveTab('listings')}
                            disabled={loading}
                          >
                            View listings
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

              <Card>
              <CardHeader>
                <CardTitle>Modules</CardTitle>
                <CardDescription>Features included in this dashboard</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="rounded-xl border p-4">
                  <div className="flex items-center gap-2 font-semibold">
                    <MapPin className="h-4 w-4" /> Listing management
                  </div>
                  <p className="mt-1 text-sm text-gray-600">Import locations, verify status, and keep info consistent.</p>
                </div>
                <div className="rounded-xl border p-4">
                  <div className="flex items-center gap-2 font-semibold">
                    <Edit className="h-4 w-4" /> Bulk updates
                  </div>
                  <p className="mt-1 text-sm text-gray-600">Update descriptions, phones, websites across locations.</p>
                </div>
                <div className="rounded-xl border p-4">
                  <div className="flex items-center gap-2 font-semibold">
                    <MessageSquare className="h-4 w-4" /> Reviews (module)
                  </div>
                  <p className="mt-1 text-sm text-gray-600">Centralize reviews and replies (module ready to extend).</p>
                </div>
                <div className="rounded-xl border p-4">
                  <div className="flex items-center gap-2 font-semibold">
                    <Megaphone className="h-4 w-4" /> Posts (module)
                  </div>
                  <p className="mt-1 text-sm text-gray-600">Create and publish posts across locations (extendable).</p>
                </div>
              </CardContent>
              </Card>
            </div>
          </div>
        )}

        {activeTab === 'listings' && (
          <Card>
            <CardHeader>
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <MapPin className="h-5 w-5" />
                    Listings
                    {selectedLocations.length ? <Badge className="ml-2">{selectedLocations.length} selected</Badge> : null}
                  </CardTitle>
                  <CardDescription>
                    Search, filter and manage your Google Business Profile locations.
                  </CardDescription>
                </div>
                <div className="flex flex-wrap gap-2 items-center">
                  <Button
                    variant="outline"
                    onClick={() => exportLocationsCsv(filteredLocations as any[])}
                    disabled={filteredLocations.length === 0}
                  >
                    Export CSV
                  </Button>
                  <div className="relative">
                    <Search className="h-4 w-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <Input
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search locations…"
                      className="pl-9 w-64"
                    />
                  </div>
                  <Button variant="outline" onClick={() => setViewMode('grid')} disabled={viewMode === 'grid'}>
                    <LayoutGrid className="h-4 w-4 mr-2" />
                    Grid
                  </Button>
                  <Button variant="outline" onClick={() => setViewMode('list')} disabled={viewMode === 'list'}>
                    <List className="h-4 w-4 mr-2" />
                    List
                  </Button>
                  <Button onClick={() => setActiveTab('content_updates')} disabled={locations.length === 0}>
                    <Edit className="h-4 w-4 mr-2" />
                    Content updates
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {/* Summary tiles */}
              <div className="grid gap-3 md:grid-cols-3 mb-4">
                <div className="rounded-xl border bg-white p-4">
                  <div className="text-sm font-semibold text-gray-900">Active plan</div>
                  <div className="mt-1 text-2xl font-semibold text-emerald-700">{locations.length}</div>
                </div>
                <div className="rounded-xl border bg-white p-4">
                  <div className="text-sm font-semibold text-gray-900">Plan expired</div>
                  <div className="mt-1 text-2xl font-semibold text-gray-900">{listingQuality.missingCriticalLocations}</div>
                </div>
                <div className="rounded-xl border bg-white p-4">
                  <div className="text-sm font-semibold text-gray-900">Hidden</div>
                  <div className="mt-1 text-2xl font-semibold text-gray-900">{listingQuality.hidden}</div>
                </div>
              </div>

              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between mb-4">
                <Segmented
                  value={listingsView}
                  onChange={setListingsView as any}
                  options={[
                    { value: 'all', label: 'All', right: <Badge>{locations.length}</Badge> },
                    { value: 'verified', label: 'Verified', right: <Badge variant="success">{locations.filter((l: any) => l.is_verified).length}</Badge> },
                    { value: 'unverified', label: 'Unverified', right: <Badge>{locations.filter((l: any) => !l.is_verified).length}</Badge> },
                    { value: 'published', label: 'Published', right: <Badge variant="info">{locations.filter((l: any) => l.is_published).length}</Badge> },
                    { value: 'unpublished', label: 'Unpublished', right: <Badge>{locations.filter((l: any) => !l.is_published).length}</Badge> },
                  ]}
                />
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" onClick={selectAllLocations} disabled={filteredLocations.length === 0}>
                    Select all (view)
                  </Button>
                  <Button size="sm" onClick={() => setActiveTab('content_updates')} disabled={selectedLocations.length === 0}>
                    <Edit className="h-4 w-4 mr-2" />
                    Update selected
                  </Button>
                </div>
              </div>

              {locations.length === 0 && !loading ? (
                <div className="text-center py-12">
                  <MapPin className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                  <h3 className="text-lg font-semibold mb-2">No Locations Found</h3>
                  <p className="text-gray-600 mb-4">
                    Sync your account to import locations.
                  </p>
                  <Button onClick={() => handleSyncLocations()} disabled={syncing || accounts.length === 0}>
                    <RefreshCw className="h-4 w-4 mr-2" />
                    {syncing ? 'Syncing…' : 'Sync now'}
                  </Button>
                </div>
              ) : (
                <>
                  <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between mb-4">
                    <div className="text-sm text-gray-600">
                      Showing <span className="font-medium">{filteredLocations.length}</span> of{' '}
                      <span className="font-medium">{baseFilteredLocations.length}</span> locations
                    </div>
                    <div className="flex items-center gap-2">
                      <Button variant="outline" size="sm" onClick={selectAllLocations}>
                        {selectedLocations.length > 0 ? 'Toggle selection' : 'Select all (filtered)'}
                      </Button>
                      <Badge>{selectedLocations.length} selected</Badge>
                    </div>
                  </div>

                  {viewMode === 'list' ? (
                    <div className="overflow-hidden rounded-xl border">
                      <div className="grid grid-cols-12 bg-gray-50 px-4 py-2 text-xs font-semibold text-gray-600">
                        <div className="col-span-1"> </div>
                        <div className="col-span-4">Location</div>
                        <div className="col-span-3">Category</div>
                        <div className="col-span-2">Status</div>
                        <div className="col-span-2">Website</div>
                      </div>
                      <div className="divide-y">
                        {filteredLocations.map((location: any) => {
                          const addressLine = location.address?.addressLines?.[0] || location.address?.formattedAddress
                          return (
                            <div key={location.id} className="grid grid-cols-12 items-center px-4 py-3 text-sm">
                              <div className="col-span-1">
                                <input
                                  type="checkbox"
                                  checked={selectedLocations.includes(location.id)}
                                  onChange={() => toggleLocationSelection(location.id)}
                                />
                              </div>
                              <div className="col-span-4">
                                <div className="font-medium text-gray-900">{location.location_name}</div>
                                <div className="text-xs text-gray-500">{addressLine || '—'}</div>
                              </div>
                              <div className="col-span-3 text-gray-700">{location.category || '—'}</div>
                              <div className="col-span-2 flex flex-wrap gap-2">
                                {location.is_verified && <Badge variant="success">Verified</Badge>}
                                {location.is_published && <Badge variant="info">Published</Badge>}
                                {!location.is_verified && !location.is_published && <Badge>—</Badge>}
                              </div>
                              <div className="col-span-2">
                                {location.website ? (
                                  <a className="text-blue-600 hover:underline" href={location.website} target="_blank" rel="noreferrer">
                                    Open
                                  </a>
                                ) : (
                                  <span className="text-gray-500">—</span>
                                )}
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  ) : (
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {filteredLocations.map((location: any) => (
                        <Card key={location.id}>
                          <CardHeader className="space-y-2">
                            <div className="flex items-start justify-between gap-3">
                              <CardTitle className="text-lg flex items-center gap-2">
                                <MapPin className="h-4 w-4" />
                                {location.location_name}
                              </CardTitle>
                              <input
                                type="checkbox"
                                checked={selectedLocations.includes(location.id)}
                                onChange={() => toggleLocationSelection(location.id)}
                              />
                            </div>
                            <CardDescription>{location.category || '—'}</CardDescription>
                          </CardHeader>
                          <CardContent>
                            <div className="space-y-2 text-sm">
                              <p className="text-gray-600">{location.address?.addressLines?.[0] || location.address?.formattedAddress || '—'}</p>
                              {location.phone ? (
                                <p className="flex items-center gap-2 text-gray-800">
                                  <Phone className="h-4 w-4 text-gray-400" />
                                  {location.phone}
                                </p>
                              ) : null}
                              {location.website && (
                                <a href={location.website} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                                  <span className="inline-flex items-center gap-2">
                                    <Globe className="h-4 w-4" />
                                    Visit website
                                  </span>
                                </a>
                              )}
                              <div className="flex items-center gap-2 mt-4">
                                {location.is_verified && (
                                  <Badge variant="success">Verified</Badge>
                                )}
                                {location.is_published && (
                                  <Badge variant="info">Published</Badge>
                                )}
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        )}

        {activeTab === 'content_updates' && (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Edit className="h-5 w-5" />
                    Content Updates
                  </CardTitle>
                  <CardDescription>Content dashboard + bulk updates</CardDescription>
                </div>
                <Button variant="outline" onClick={() => setActiveTab('listings')}>
                  Back to listings
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <Segmented
                value={contentUpdatesTab}
                onChange={setContentUpdatesTab as any}
                options={[
                  { value: 'dashboard', label: 'Dashboard' },
                  { value: 'update_history', label: 'Update History', right: <Badge>{bulkUpdates.length}</Badge> },
                  { value: 'bulk_product_update', label: 'Bulk Product Update' },
                  { value: 'directories', label: 'Directories' },
                ]}
              />

              {contentUpdatesTab === 'update_history' ? (
                <div className="space-y-3">
                  {bulkUpdates.length === 0 ? (
                    <div className="text-sm text-gray-600">No bulk update history yet.</div>
                  ) : (
                    <div className="overflow-hidden rounded-xl border">
                      <div className="grid grid-cols-12 bg-gray-50 px-4 py-2 text-xs font-semibold text-gray-600">
                        <div className="col-span-3">Created</div>
                        <div className="col-span-2">Type</div>
                        <div className="col-span-2">Status</div>
                        <div className="col-span-3">Result</div>
                        <div className="col-span-2">Completed</div>
                      </div>
                      <div className="divide-y">
                        {bulkUpdates.map((u) => (
                          <div key={u.id} className="grid grid-cols-12 items-center px-4 py-3 text-sm">
                            <div className="col-span-3 text-gray-700">{new Date(u.created_at).toLocaleString()}</div>
                            <div className="col-span-2 font-medium text-gray-900">{u.update_type}</div>
                            <div className="col-span-2">
                              <Badge
                                variant={
                                  u.status === 'completed'
                                    ? 'success'
                                    : u.status === 'failed'
                                      ? 'danger'
                                      : 'info'
                                }
                              >
                                {u.status}
                              </Badge>
                            </div>
                            <div className="col-span-3 text-gray-700">
                              {(u.successful_updates ?? 0)}/{u.total_locations ?? 0} ok
                              {(u.failed_updates ?? 0) ? ` • ${(u.failed_updates ?? 0)} failed` : ''}
                            </div>
                            <div className="col-span-2 text-gray-500">
                              {u.completed_at ? new Date(u.completed_at).toLocaleString() : '—'}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : null}

              {contentUpdatesTab === 'directories' ? (
                <div className="rounded-xl border bg-white p-4 text-sm text-gray-700">
                  <div className="font-semibold text-gray-900">Directories</div>
                  <div className="mt-1 text-gray-600">
                    Note: “Directories” (listing distribution across third-party directories) is not part of the official Google Business Profile API.
                    We can add CSV-based workflows and/or third-party directory partner integrations here.
                  </div>
                </div>
              ) : null}

              {contentUpdatesTab === 'bulk_product_update' ? (
                <div className="space-y-4">
                  <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                    <div>
                      <div className="font-semibold text-gray-900">Bulk Product Update</div>
                      <div className="text-sm text-gray-600">
                        Manage Products/Services and apply to selected locations (local catalog; Google push depends on API field support).
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge>{selectedLocations.length} selected</Badge>
                      <Button size="sm" variant="outline" onClick={() => setActiveTab('listings')}>
                        Select locations
                      </Button>
                    </div>
                  </div>

                  <Segmented
                    value={catalogTab}
                    onChange={setCatalogTab as any}
                    options={[
                      { value: 'products', label: 'Products', right: <Badge>{products.length}</Badge> },
                      { value: 'services', label: 'Services', right: <Badge>{services.length}</Badge> },
                    ]}
                  />

                  {catalogTab === 'products' ? (
                    <div className="grid gap-4 lg:grid-cols-2">
                      <div className="rounded-xl border bg-white p-4">
                        <div className="font-semibold text-gray-900 mb-3">Create product</div>
                        <div className="space-y-3">
                          <div>
                            <Label>Name *</Label>
                            <Input className="mt-2" value={productForm.name} onChange={(e) => setProductForm((p) => ({ ...p, name: e.target.value }))} />
                          </div>
                          <div>
                            <Label>Description</Label>
                            <Textarea className="mt-2" rows={3} value={productForm.description} onChange={(e) => setProductForm((p) => ({ ...p, description: e.target.value }))} />
                          </div>
                          <div className="grid gap-3 md:grid-cols-2">
                            <div>
                              <Label>Price</Label>
                              <Input className="mt-2" value={productForm.price} onChange={(e) => setProductForm((p) => ({ ...p, price: e.target.value }))} placeholder="₹ / $ / text" />
                            </div>
                            <div>
                              <Label>Category</Label>
                              <Input className="mt-2" value={productForm.category} onChange={(e) => setProductForm((p) => ({ ...p, category: e.target.value }))} />
                            </div>
                          </div>
                          <div>
                            <Label>Image URLs (one per line)</Label>
                            <Textarea className="mt-2 font-mono text-xs" rows={3} value={productForm.imageUrls} onChange={(e) => setProductForm((p) => ({ ...p, imageUrls: e.target.value }))} placeholder="https://..." />
                          </div>
                          <Button onClick={createProduct} disabled={catalogLoading}>
                            {catalogLoading ? 'Saving…' : 'Create product'}
                          </Button>
                        </div>
                      </div>

                      <div className="rounded-xl border bg-white p-4">
                        <div className="font-semibold text-gray-900 mb-3">Products</div>
                        {products.length === 0 ? (
                          <div className="text-sm text-gray-600">No products yet.</div>
                        ) : (
                          <div className="space-y-3 max-h-[420px] overflow-y-auto pr-1">
                            {products.map((p) => (
                              <div key={p.id} className="rounded-xl border p-3">
                                <div className="flex items-start justify-between gap-3">
                                  <div>
                                    <div className="font-semibold text-gray-900">{p.name}</div>
                                    <div className="text-xs text-gray-500">
                                      {p.category ? `${p.category} • ` : ''}{p.price || '—'}
                                    </div>
                                    {p.description ? <div className="mt-2 text-sm text-gray-700">{p.description}</div> : null}
                                  </div>
                                  <Button size="sm" onClick={() => applyProductToSelected(p.id)}>
                                    Apply
                                  </Button>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  ) : null}

                  {catalogTab === 'services' ? (
                    <div className="grid gap-4 lg:grid-cols-2">
                      <div className="rounded-xl border bg-white p-4">
                        <div className="font-semibold text-gray-900 mb-3">Create service</div>
                        <div className="space-y-3">
                          <div>
                            <Label>Name *</Label>
                            <Input className="mt-2" value={serviceForm.name} onChange={(e) => setServiceForm((p) => ({ ...p, name: e.target.value }))} />
                          </div>
                          <div>
                            <Label>Description</Label>
                            <Textarea className="mt-2" rows={3} value={serviceForm.description} onChange={(e) => setServiceForm((p) => ({ ...p, description: e.target.value }))} />
                          </div>
                          <div>
                            <Label>Category</Label>
                            <Input className="mt-2" value={serviceForm.category} onChange={(e) => setServiceForm((p) => ({ ...p, category: e.target.value }))} />
                          </div>
                          <Button onClick={createService} disabled={catalogLoading}>
                            {catalogLoading ? 'Saving…' : 'Create service'}
                          </Button>
                        </div>
                      </div>

                      <div className="rounded-xl border bg-white p-4">
                        <div className="font-semibold text-gray-900 mb-3">Services</div>
                        {services.length === 0 ? (
                          <div className="text-sm text-gray-600">No services yet.</div>
                        ) : (
                          <div className="space-y-3 max-h-[420px] overflow-y-auto pr-1">
                            {services.map((s) => (
                              <div key={s.id} className="rounded-xl border p-3">
                                <div className="flex items-start justify-between gap-3">
                                  <div>
                                    <div className="font-semibold text-gray-900">{s.name}</div>
                                    <div className="text-xs text-gray-500">{s.category || '—'}</div>
                                    {s.description ? <div className="mt-2 text-sm text-gray-700">{s.description}</div> : null}
                                  </div>
                                  <Button size="sm" onClick={() => applyServiceToSelected(s.id)}>
                                    Apply
                                  </Button>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  ) : null}
                </div>
              ) : null}

              {contentUpdatesTab === 'dashboard' ? (
                <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
                  {/* Left: Dashboard tiles */}
                  <div className="space-y-4">
                    <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                      <div>
                        <div className="text-sm font-semibold text-gray-900">Content Dashboard</div>
                        <div className="text-xs text-gray-500">Pick an item to manage. Bulk actions stay on the right.</div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge>{selectedLocations.length} selected</Badge>
                        <Button size="sm" variant="outline" onClick={() => setActiveTab('listings')}>
                          Change selection
                        </Button>
                      </div>
                    </div>

                    <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                      {[
                        { key: 'phone', title: 'Phone Number', missing: contentDashboardCounts.missingPhone, action: () => { setContentDashboardFocus('phone'); setBulkUpdateType('phone') } },
                        { key: 'website', title: 'Website Link', missing: contentDashboardCounts.missingWebsite, action: () => { setContentDashboardFocus('website'); setBulkUpdateType('website') } },
                        { key: 'description', title: 'Description', missing: contentDashboardCounts.missingDescription, action: () => { setContentDashboardFocus('description'); setBulkUpdateType('description') } },
                        { key: 'opening_hours', title: 'Opening Hours', missing: contentDashboardCounts.missingHours, action: () => { setContentDashboardFocus('opening_hours'); setBulkUpdateType('hours') } },
                        { key: 'attributes', title: 'Attributes', missing: contentDashboardCounts.missingAttributes, action: () => { setContentDashboardFocus('attributes'); setBulkUpdateType('attributes') } },
                        { key: 'categories', title: 'Additional Categories', missing: (contentDashboardCounts as any).missingAdditionalCategories ?? contentDashboardCounts.missingCategory, action: () => { setContentDashboardFocus('categories') } },
                        { key: 'appointment_link', title: 'Appointment Link', missing: contentDashboardCounts.missingAppointment, action: () => { setContentDashboardFocus('appointment_link') } },
                        { key: 'menu_link', title: 'Menu Link', missing: contentDashboardCounts.missingMenu, action: () => { setContentDashboardFocus('menu_link') } },
                        { key: 'chat_link', title: 'Chat Link', missing: contentDashboardCounts.missingChat, action: () => { setContentDashboardFocus('chat_link') } },
                        { key: 'social_links', title: 'Social Links', missing: contentDashboardCounts.missingSocial, action: () => { setContentDashboardFocus('social_links') } },
                        { key: 'opening_date', title: 'Opening Date', missing: contentDashboardCounts.missingOpeningDate, action: () => { setContentDashboardFocus('opening_date') } },
                        { key: 'photos', title: 'Photos', missing: contentDashboardCounts.missingPhotos, action: () => { setContentDashboardFocus('photos') } },
                        { key: 'cover_photo', title: 'Cover Photo', missing: contentDashboardCounts.missingCover, action: () => { setContentDashboardFocus('cover_photo') } },
                        { key: 'business_logo', title: 'Business Logo', missing: contentDashboardCounts.missingLogo, action: () => { setContentDashboardFocus('business_logo') } },
                        { key: 'videos', title: 'Videos', missing: contentDashboardCounts.missingVideos, action: () => { setContentDashboardFocus('videos') } },
                        { key: 'qna', title: 'Q&A', missing: contentDashboardCounts.missingQna, action: () => { setContentDashboardFocus('qna') } },
                        { key: 'products', title: 'Products / Services', missing: contentDashboardCounts.missingProducts + contentDashboardCounts.missingServices, action: () => { setContentUpdatesTab('bulk_product_update') } },
                        { key: 'posts', title: 'Posts', missing: draftsCount, action: () => { setContentDashboardFocus('posts'); setActiveTab('post_scheduling') } },
                      ].map((t: any) => (
                        <button
                          key={t.key}
                          type="button"
                          onClick={t.action}
                          className={
                            'rounded-xl border bg-white p-4 text-left hover:bg-gray-50 transition ' +
                            (contentDashboardFocus === t.key ? 'ring-2 ring-gray-900/10' : '')
                          }
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <div className="text-sm font-semibold text-gray-900">{t.title}</div>
                              <div className="mt-1 text-xs text-gray-500">
                                Missing: <span className="font-medium text-gray-900">{t.missing}</span> / {contentDashboardCounts.total}
                              </div>
                            </div>
                            <Badge variant={t.missing ? 'info' : 'success'}>{t.missing ? 'Action' : 'OK'}</Badge>
                          </div>
                          <div className="mt-3 text-xs text-gray-600">
                            {t.key === 'posts' ? 'Manage posts and scheduling' : 'Open management'}
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Right: Management panel (sticky on desktop) */}
                  <div className="space-y-4 lg:sticky lg:top-28 h-fit">
                    <div className="rounded-2xl border bg-white p-5 space-y-2">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="text-sm font-semibold text-gray-900">Manage</div>
                          <div className="text-xs text-gray-500">
                            Selected locations: <span className="font-medium text-gray-900">{selectedLocations.length}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button size="sm" variant="outline" onClick={() => setActiveTab('listings')}>
                            Selection
                          </Button>
                          {contentDashboardFocus ? (
                            <Button size="sm" variant="ghost" onClick={() => setContentDashboardFocus(null)}>
                              Clear
                            </Button>
                          ) : null}
                        </div>
                      </div>
                      {!selectedLocations.length ? (
                        <div className="text-xs text-gray-600">
                          Tip: Select locations in <span className="font-medium">Listings</span> for bulk updates.
                        </div>
                      ) : null}
                    </div>

                    {contentDashboardFocus ? (
                      <div className="rounded-2xl border bg-white p-5 text-sm text-gray-700">
                        Managing: <span className="font-semibold text-gray-900">{contentDashboardFocus}</span>
                      </div>
                    ) : (
                      <div className="rounded-2xl border bg-white p-5 text-sm text-gray-700">
                        Pick a tile on the left to open its editor. Insights are shown above for quick context.
                      </div>
                    )}

                    {/* Media manager */}
                    {contentDashboardFocus &&
                    ['photos', 'cover_photo', 'business_logo', 'videos'].includes(contentDashboardFocus) ? (
                    <div className="rounded-2xl border bg-white p-5 space-y-4">
                      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                        <div>
                          <div className="text-sm font-semibold text-gray-900">Media Manager</div>
                          <div className="text-xs text-gray-500">
                            Upload to Google Business Profile (COVER/LOGO/PROFILE). Videos support depends on API.
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button size="sm" variant="outline" onClick={handleSyncMedia} disabled={mediaSyncing || !mediaViewerLocationId}>
                            <RefreshCw className="h-4 w-4 mr-2" />
                            {mediaSyncing ? 'Syncing…' : 'Sync media'}
                          </Button>
                        </div>
                      </div>

                      <div className="grid gap-3 md:grid-cols-2">
                        <div className="space-y-3">
                          <div className="grid gap-3 md:grid-cols-2">
                            <div>
                              <Label>Category</Label>
                              <select
                                className="w-full mt-2 p-2 border rounded-md"
                                value={mediaCategory}
                                onChange={(e) => setMediaCategory(e.target.value as any)}
                              >
                                <option value="COVER">Cover</option>
                                <option value="LOGO">Logo</option>
                                <option value="PROFILE">Profile</option>
                              </select>
                            </div>
                            <div>
                              <Label>Upload mode</Label>
                              <select
                                className="w-full mt-2 p-2 border rounded-md"
                                value={mediaUploadMode}
                                onChange={(e) => setMediaUploadMode(e.target.value as any)}
                              >
                                <option value="url">From URL</option>
                                <option value="file">Upload file</option>
                              </select>
                            </div>
                          </div>

                          {mediaUploadMode === 'url' ? (
                            <div>
                              <Label>Image URL</Label>
                              <Input className="mt-2" value={mediaSourceUrl} onChange={(e) => setMediaSourceUrl(e.target.value)} placeholder="https://..." />
                            </div>
                          ) : (
                            <div>
                              <Label>Upload image</Label>
                              <Input
                                className="mt-2"
                                type="file"
                                accept="image/png,image/jpeg,image/webp"
                                onChange={(e) => setMediaFile(e.target.files?.[0] || null)}
                              />
                              <div className="mt-1 text-xs text-gray-500">Uploads to Supabase Storage bucket `gmb_media`.</div>
                            </div>
                          )}

                          <Button onClick={handleCreateMedia} disabled={mediaUploading}>
                            {mediaUploading ? 'Uploading…' : `Upload to ${selectedLocations.length} location(s)`}
                          </Button>
                          <div className="text-xs text-gray-500">
                            Tip: Select target locations in <span className="font-medium">Listings</span> first.
                          </div>
                        </div>

                        <div className="space-y-3">
                          <div>
                            <Label>View location media</Label>
                            <select
                              className="w-full mt-2 p-2 border rounded-md"
                              value={mediaViewerLocationId || ''}
                              onChange={async (e) => {
                                const v = e.target.value || null
                                setMediaViewerLocationId(v)
                                setMediaAssets([])
                                if (v && organizationId) {
                                  try {
                                    await loadMediaAssets(organizationId, v)
                                  } catch {
                                    // ignore
                                  }
                                }
                              }}
                            >
                              <option value="">Select location…</option>
                              {locations.map((l) => (
                                <option key={l.id} value={l.id}>
                                  {l.location_name}
                                </option>
                              ))}
                            </select>
                          </div>

                          <div className="rounded-xl border p-3 max-h-64 overflow-y-auto">
                            {mediaAssets.length === 0 ? (
                              <div className="text-sm text-gray-600">No media loaded yet. Select a location and click Sync.</div>
                            ) : (
                              <div className="grid grid-cols-2 gap-3">
                                {mediaAssets.map((m) => (
                                  <div key={m.id} className="rounded-lg border overflow-hidden bg-white">
                                    {m.google_url || m.source_url ? (
                                      // eslint-disable-next-line @next/next/no-img-element
                                      <img
                                        src={m.google_url || m.source_url}
                                        alt={m.category || 'Media'}
                                        className="h-28 w-full object-cover"
                                      />
                                    ) : (
                                      <div className="h-28 w-full bg-gray-100" />
                                    )}
                                    <div className="p-2 text-xs text-gray-700">
                                      <div className="font-semibold">{m.category || '—'}</div>
                                      <div className="text-gray-500">{m.media_format || 'PHOTO'}</div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : null}

                  {/* Q&A workflow (fallback when API not available) */}
                  {contentDashboardFocus === 'qna' ? (
                    <div className="rounded-2xl border bg-white p-5 space-y-4">
                      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                        <div>
                          <div className="text-sm font-semibold text-gray-900">Q&A (workflow)</div>
                          <div className="text-xs text-gray-500">
                            Google Business Profile APIs don’t reliably expose full Q&A management; this workflow captures questions and tracks answers inside Astric.
                          </div>
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => organizationId && loadQna(organizationId)}
                          disabled={qnaLoading || !organizationId}
                        >
                          {qnaLoading ? 'Loading…' : 'Refresh'}
                        </Button>
                      </div>

                      <div className="grid gap-4 lg:grid-cols-2">
                        <div className="rounded-xl border p-4">
                          <div className="font-semibold text-gray-900 mb-3">Capture question</div>
                          <div className="space-y-3">
                            <div>
                              <Label>Location (optional)</Label>
                              <select
                                className="w-full mt-2 p-2 border rounded-md"
                                value={qnaForm.locationId}
                                onChange={(e) => setQnaForm((p) => ({ ...p, locationId: e.target.value }))}
                              >
                                <option value="">None</option>
                                {locations.map((l) => (
                                  <option key={l.id} value={l.id}>{l.location_name}</option>
                                ))}
                              </select>
                            </div>
                            <div className="grid gap-3 md:grid-cols-2">
                              <div>
                                <Label>Customer name</Label>
                                <Input className="mt-2" value={qnaForm.customerName} onChange={(e) => setQnaForm((p) => ({ ...p, customerName: e.target.value }))} />
                              </div>
                              <div>
                                <Label>Customer contact</Label>
                                <Input className="mt-2" value={qnaForm.customerContact} onChange={(e) => setQnaForm((p) => ({ ...p, customerContact: e.target.value }))} placeholder="Phone/Email" />
                              </div>
                            </div>
                            <div>
                              <Label>Question *</Label>
                              <Textarea className="mt-2" rows={4} value={qnaForm.question} onChange={(e) => setQnaForm((p) => ({ ...p, question: e.target.value }))} />
                            </div>
                            <Button onClick={createQnaRequest}>Save question</Button>
                          </div>
                        </div>

                        <div className="rounded-xl border p-4">
                          <div className="font-semibold text-gray-900 mb-3">Questions</div>
                          {qnaItems.length === 0 ? (
                            <div className="text-sm text-gray-600">No questions yet.</div>
                          ) : (
                            <div className="space-y-3 max-h-[420px] overflow-y-auto pr-1">
                              {qnaItems.map((q) => (
                                <div key={q.id} className="rounded-xl border p-3">
                                  <div className="flex items-start justify-between gap-3">
                                    <div>
                                      <div className="font-semibold text-gray-900">{q.customer_name || 'Customer'}</div>
                                      <div className="text-xs text-gray-500">
                                        {new Date(q.created_at).toLocaleString()} • {q.status}
                                      </div>
                                    </div>
                                    <Badge variant={q.status === 'answered' ? 'success' : 'info'}>{q.status}</Badge>
                                  </div>
                                  <div className="mt-2 text-sm text-gray-800">{q.question}</div>
                                  <div className="mt-3 bg-gray-50 rounded-lg p-3">
                                    <div className="text-xs font-semibold text-gray-600">Answer</div>
                                    <Textarea
                                      className="mt-2"
                                      rows={3}
                                      value={qnaAnswerDrafts[q.id] ?? q.answer ?? ''}
                                      onChange={(e) => setQnaAnswerDrafts((p) => ({ ...p, [q.id]: e.target.value }))}
                                      placeholder="Write an answer…"
                                    />
                                    <div className="mt-2 flex gap-2">
                                      <Button size="sm" onClick={() => answerQnaRequest(q.id)} disabled={!String(qnaAnswerDrafts[q.id] || '').trim()}>
                                        Save answer
                                      </Button>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ) : null}

                  {/* Local-only fields */}
                  {contentDashboardFocus === 'appointment_link' ? (
                    <div className="rounded-2xl border bg-white p-5 space-y-3">
                      <div className="font-semibold text-gray-900">Appointment Link</div>
                      <div className="text-xs text-gray-500">Saved in Astric (Google API support varies by account/category).</div>
                      <Input
                        placeholder="https://..."
                        value={(updateData as any).appointment_link || ''}
                        onChange={(e) => setUpdateData((p: any) => ({ ...p, appointment_link: e.target.value }))}
                      />
                      <Button size="sm" onClick={() => handleLocalUpdate({ appointment_link: (updateData as any).appointment_link || null })}>
                        Save to selected
                      </Button>
                    </div>
                  ) : null}

                  {contentDashboardFocus === 'menu_link' ? (
                    <div className="rounded-2xl border bg-white p-5 space-y-3">
                      <div className="font-semibold text-gray-900">Menu Link</div>
                      <div className="text-xs text-gray-500">Saved in Astric (Google API support varies).</div>
                      <Input
                        placeholder="https://..."
                        value={(updateData as any).menu_link || ''}
                        onChange={(e) => setUpdateData((p: any) => ({ ...p, menu_link: e.target.value }))}
                      />
                      <Button size="sm" onClick={() => handleLocalUpdate({ menu_link: (updateData as any).menu_link || null })}>
                        Save to selected
                      </Button>
                    </div>
                  ) : null}

                  {contentDashboardFocus === 'chat_link' ? (
                    <div className="rounded-2xl border bg-white p-5 space-y-3">
                      <div className="font-semibold text-gray-900">Chat Link</div>
                      <div className="text-xs text-gray-500">Use WhatsApp/website chat link; saved in Astric.</div>
                      <Input
                        placeholder="https://wa.me/..."
                        value={(updateData as any).chat_link || ''}
                        onChange={(e) => setUpdateData((p: any) => ({ ...p, chat_link: e.target.value }))}
                      />
                      <Button size="sm" onClick={() => handleLocalUpdate({ chat_link: (updateData as any).chat_link || null })}>
                        Save to selected
                      </Button>
                    </div>
                  ) : null}

                  {contentDashboardFocus === 'social_links' ? (
                    <div className="rounded-2xl border bg-white p-5 space-y-3">
                      <div className="font-semibold text-gray-900">Social Links</div>
                      <div className="text-xs text-gray-500">Add your social URLs. We will save a clean JSON object internally.</div>
                      <div className="grid gap-3 md:grid-cols-2">
                        <div>
                          <Label>Facebook</Label>
                          <Input
                            className="mt-2"
                            placeholder="https://facebook.com/..."
                            value={(updateData as any).social_facebook || ''}
                            onChange={(e) => setUpdateData((p: any) => ({ ...p, social_facebook: e.target.value }))}
                          />
                        </div>
                        <div>
                          <Label>Instagram</Label>
                          <Input
                            className="mt-2"
                            placeholder="https://instagram.com/..."
                            value={(updateData as any).social_instagram || ''}
                            onChange={(e) => setUpdateData((p: any) => ({ ...p, social_instagram: e.target.value }))}
                          />
                        </div>
                        <div>
                          <Label>YouTube</Label>
                          <Input
                            className="mt-2"
                            placeholder="https://youtube.com/@..."
                            value={(updateData as any).social_youtube || ''}
                            onChange={(e) => setUpdateData((p: any) => ({ ...p, social_youtube: e.target.value }))}
                          />
                        </div>
                        <div>
                          <Label>LinkedIn</Label>
                          <Input
                            className="mt-2"
                            placeholder="https://linkedin.com/company/..."
                            value={(updateData as any).social_linkedin || ''}
                            onChange={(e) => setUpdateData((p: any) => ({ ...p, social_linkedin: e.target.value }))}
                          />
                        </div>
                      </div>
                      <Button
                        size="sm"
                        onClick={() => {
                          const obj: any = {}
                          const fb = String((updateData as any).social_facebook || '').trim()
                          const ig = String((updateData as any).social_instagram || '').trim()
                          const yt = String((updateData as any).social_youtube || '').trim()
                          const li = String((updateData as any).social_linkedin || '').trim()
                          if (fb) obj.facebook = fb
                          if (ig) obj.instagram = ig
                          if (yt) obj.youtube = yt
                          if (li) obj.linkedin = li
                          handleLocalUpdate({ social_links: Object.keys(obj).length ? obj : null })
                        }}
                      >
                        Save to selected
                      </Button>
                    </div>
                  ) : null}

                  {contentDashboardFocus === 'opening_date' ? (
                    <div className="rounded-2xl border bg-white p-5 space-y-3">
                      <div className="font-semibold text-gray-900">Opening Date</div>
                      <div className="text-xs text-gray-500">Saved in Astric.</div>
                      <Input
                        type="date"
                        value={(updateData as any).opening_date || ''}
                        onChange={(e) => setUpdateData((p: any) => ({ ...p, opening_date: e.target.value }))}
                      />
                      <Button size="sm" onClick={() => handleLocalUpdate({ opening_date: (updateData as any).opening_date || null })}>
                        Save to selected
                      </Button>
                    </div>
                  ) : null}

                  {contentDashboardFocus === 'categories' ? (
                    <div className="rounded-2xl border bg-white p-5 space-y-3">
                      <div className="font-semibold text-gray-900">Additional Categories</div>
                      <div className="text-xs text-gray-500">Saved in Astric now; can be pushed to Google later (depends on API/category permissions).</div>
                      <Textarea
                        rows={4}
                        value={(updateData as any).additional_categories_text || ''}
                        onChange={(e) => setUpdateData((p: any) => ({ ...p, additional_categories_text: e.target.value }))}
                        placeholder="One category per line"
                      />
                      <Button
                        size="sm"
                        onClick={() => {
                          const arr = ((updateData as any).additional_categories_text || '')
                            .split('\\n')
                            .map((s: string) => s.trim())
                            .filter(Boolean)
                          handleLocalUpdate({ additional_categories: arr.length ? arr : null })
                        }}
                      >
                        Save to selected
                      </Button>
                    </div>
                  ) : null}

                    {/* Bulk update (collapsed by default to reduce clutter) */}
                    <details
                      className="rounded-2xl border bg-white p-5"
                      open={
                        !!contentDashboardFocus &&
                        ['phone', 'website', 'description', 'opening_hours', 'attributes'].includes(contentDashboardFocus)
                      }
                    >
                      <summary className="cursor-pointer select-none text-sm font-semibold text-gray-900">
                        Bulk update (Google)
                        <span className="ml-2 text-xs font-normal text-gray-500">Update across selected locations</span>
                      </summary>
                      <div className="mt-4 space-y-4">
                        {/* Update Type */}
                        <div>
                          <Label>What do you want to update?</Label>
                          <select
                            className="w-full mt-2 p-2 border rounded-md"
                            value={bulkUpdateType}
                            onChange={(e) => setBulkUpdateType(e.target.value)}
                          >
                            <option value="description">Business Description</option>
                            <option value="phone">Phone Number</option>
                            <option value="website">Website URL</option>
                            <option value="hours">Business Hours</option>
                            <option value="attributes">Business Attributes</option>
                          </select>
                        </div>

                        {/* Update Fields */}
                        <div>
                          <Label>New Information</Label>
                          {bulkUpdateType === 'description' && (
                            <Textarea
                              className="mt-2"
                              placeholder="Enter business description..."
                              rows={5}
                              value={updateData.description}
                              onChange={(e) => setUpdateData({ ...updateData, description: e.target.value })}
                            />
                          )}
                          {bulkUpdateType === 'phone' && (
                            <Input
                              className="mt-2"
                              placeholder="+91 9876543210"
                              value={updateData.phone}
                              onChange={(e) => setUpdateData({ ...updateData, phone: e.target.value })}
                            />
                          )}
                          {bulkUpdateType === 'website' && (
                            <Input
                              className="mt-2"
                              placeholder="https://example.com"
                              value={updateData.website}
                              onChange={(e) => setUpdateData({ ...updateData, website: e.target.value })}
                            />
                          )}
                          {bulkUpdateType === 'hours' && (
                            <div className="mt-2 space-y-2">
                              <div className="text-xs text-gray-500">
                                Set opening hours normally. We will generate the required Google payload automatically.
                              </div>
                              <div className="overflow-hidden rounded-xl border">
                                <div className="grid grid-cols-12 bg-gray-50 px-3 py-2 text-[11px] font-semibold text-gray-600">
                                  <div className="col-span-3">Day</div>
                                  <div className="col-span-3">Closed</div>
                                  <div className="col-span-3">Open</div>
                                  <div className="col-span-3">Close</div>
                                </div>
                                <div className="divide-y">
                                  {bulkHours.map((d, idx) => (
                                    <div key={d.day} className="grid grid-cols-12 items-center gap-2 px-3 py-2">
                                      <div className="col-span-3 text-sm font-medium text-gray-900">{d.label}</div>
                                      <div className="col-span-3">
                                        <label className="inline-flex items-center gap-2 text-sm text-gray-700">
                                          <input
                                            type="checkbox"
                                            checked={d.closed}
                                            onChange={(e) => {
                                              const next = bulkHours.slice()
                                              next[idx] = { ...next[idx], closed: e.target.checked }
                                              setBulkHours(next)
                                            }}
                                          />
                                          Closed
                                        </label>
                                      </div>
                                      <div className="col-span-3">
                                        <Input
                                          type="time"
                                          value={d.open}
                                          disabled={d.closed}
                                          onChange={(e) => {
                                            const next = bulkHours.slice()
                                            next[idx] = { ...next[idx], open: e.target.value }
                                            setBulkHours(next)
                                          }}
                                        />
                                      </div>
                                      <div className="col-span-3">
                                        <Input
                                          type="time"
                                          value={d.close}
                                          disabled={d.closed}
                                          onChange={(e) => {
                                            const next = bulkHours.slice()
                                            next[idx] = { ...next[idx], close: e.target.value }
                                            setBulkHours(next)
                                          }}
                                        />
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            </div>
                          )}
                          {bulkUpdateType === 'attributes' && (
                            <div className="mt-2 space-y-2">
                              <div className="text-xs text-gray-500">
                                Enter Attribute IDs and values. We’ll format the payload for Google automatically.
                              </div>
                              <div className="space-y-2">
                                {bulkAttributes.map((a, idx) => (
                                  <div key={idx} className="grid gap-2 md:grid-cols-12">
                                    <div className="md:col-span-7">
                                      <Input
                                        placeholder="attributeId (example: has_wheelchair_accessible_entrance)"
                                        value={a.attributeId}
                                        onChange={(e) => {
                                          const next = bulkAttributes.slice()
                                          next[idx] = { ...next[idx], attributeId: e.target.value }
                                          setBulkAttributes(next)
                                        }}
                                      />
                                    </div>
                                    <div className="md:col-span-4">
                                      <Input
                                        placeholder="value (true/false or text)"
                                        value={a.value}
                                        onChange={(e) => {
                                          const next = bulkAttributes.slice()
                                          next[idx] = { ...next[idx], value: e.target.value }
                                          setBulkAttributes(next)
                                        }}
                                      />
                                    </div>
                                    <div className="md:col-span-1 flex items-center justify-end">
                                      <Button
                                        type="button"
                                        size="sm"
                                        variant="ghost"
                                        onClick={() => setBulkAttributes((p) => p.filter((_, i) => i !== idx))}
                                        disabled={bulkAttributes.length <= 1}
                                      >
                                        Remove
                                      </Button>
                                    </div>
                                  </div>
                                ))}
                                <Button
                                  type="button"
                                  size="sm"
                                  variant="outline"
                                  onClick={() => setBulkAttributes((p) => [...p, { attributeId: '', value: 'true' }])}
                                >
                                  Add attribute
                                </Button>
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Location Selection (kept for functionality, collapsed to reduce noise) */}
                        <details className="rounded-xl border p-3 bg-white">
                          <summary className="cursor-pointer select-none text-sm font-semibold text-gray-900">
                            Select locations <span className="text-xs font-normal text-gray-500">({selectedLocations.length} selected)</span>
                          </summary>
                          <div className="mt-3">
                            <div className="flex items-center justify-between mb-2">
                              <Label>Locations</Label>
                              <Button variant="ghost" size="sm" onClick={selectAllLocations}>
                                Select All (filtered)
                              </Button>
                            </div>
                            <div className="border rounded-lg divide-y max-h-64 overflow-y-auto">
                              {filteredLocations.map((location: any) => (
                                <label key={location.id} className="flex items-center p-3 hover:bg-gray-50 cursor-pointer">
                                  <input
                                    type="checkbox"
                                    className="mr-3"
                                    checked={selectedLocations.includes(location.id)}
                                    onChange={() => toggleLocationSelection(location.id)}
                                  />
                                  <div className="flex-1">
                                    <p className="font-medium">{location.location_name}</p>
                                    <p className="text-sm text-gray-500">{location.address?.addressLines?.[0]}</p>
                                  </div>
                                  <MapPin className="h-4 w-4 text-gray-400" />
                                </label>
                              ))}
                            </div>
                          </div>
                        </details>

                        {/* Action Button */}
                        <Button className="w-full" onClick={handleBulkUpdate} disabled={selectedLocations.length === 0 || loading}>
                          {loading ? 'Updating...' : `Update ${selectedLocations.length} Location(s)`}
                        </Button>
                      </div>
                    </details>
                  </div>
                </div>
              ) : null}
            </CardContent>
          </Card>
        )}

        {activeTab === 'reviews' && (
          <Card>
            <CardHeader>
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <MessageSquare className="h-5 w-5" />
                    Review Management
                  </CardTitle>
                  <CardDescription>
                    Sync, filter, and reply to reviews across all locations.
                  </CardDescription>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={handleSyncReviews} disabled={syncingReviews || !organizationId || accounts.length === 0}>
                    <RefreshCw className="h-4 w-4 mr-2" />
                    {syncingReviews ? 'Syncing…' : 'Sync reviews'}
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <Segmented
                value={reviewsSection}
                onChange={setReviewsSection as any}
                options={[
                  { value: 'dashboard', label: 'Dashboard' },
                  { value: 'inbox', label: 'Inbox', right: <Badge>{reviews.length}</Badge> },
                  { value: 'templates', label: 'Templates', right: <Badge>{reviewTemplates.length}</Badge> },
                  { value: 'auto_reply', label: 'Auto-reply rules', right: <Badge>{autoReplyRules.length}</Badge> },
                  { value: 'qr', label: 'QR codes', right: <Badge>{qrCodes.length}</Badge> },
                ]}
              />

              {reviewsSection === 'dashboard' ? (
                <div className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-3">
                    <Card>
                      <CardHeader className="pb-2">
                        <CardDescription>Rating</CardDescription>
                        <CardTitle className="text-2xl">{reviewsBi.avg.toFixed(2)}</CardTitle>
                      </CardHeader>
                      <CardContent className="pt-0 text-sm text-gray-600">
                        Total reviews: <span className="font-medium text-gray-900">{reviewsBi.total}</span>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardHeader className="pb-2">
                        <CardDescription>NPS score</CardDescription>
                        <CardTitle className="text-2xl">{reviewsBi.nps}</CardTitle>
                      </CardHeader>
                      <CardContent className="pt-0 text-xs text-gray-600">
                        Promoters: {reviewsBi.promoters} • Passives: {reviewsBi.passives} • Detractors: {reviewsBi.detractors}
                      </CardContent>
                    </Card>
                    <Card>
                      <CardHeader className="pb-2">
                        <CardDescription>Reply rate</CardDescription>
                        <CardTitle className="text-2xl">
                          {reviewsBi.total ? Math.round((reviewsBi.replied / reviewsBi.total) * 100) : 0}%
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="pt-0 text-xs text-gray-600">
                        Replied: {reviewsBi.replied} • Not replied: {reviewsBi.notReplied}
                      </CardContent>
                    </Card>
                  </div>

                  <div className="grid gap-4 lg:grid-cols-2">
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg">Rating distribution</CardTitle>
                        <CardDescription>Count by stars</CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        {[5, 4, 3, 2, 1].map((s) => (
                          <div key={s} className="flex items-center gap-3">
                            <div className="w-10 text-sm font-medium text-gray-900">{s}★</div>
                            <div className="flex-1">
                              <Progress value={reviewsBi.total ? (reviewsBi.ratingCounts[s] / reviewsBi.total) * 100 : 0} />
                            </div>
                            <div className="w-12 text-right text-sm text-gray-600">{reviewsBi.ratingCounts[s]}</div>
                          </div>
                        ))}
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg">Text vs No text</CardTitle>
                        <CardDescription>How many reviews include comments</CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div className="flex items-center gap-3">
                          <div className="w-20 text-sm font-medium text-gray-900">Text</div>
                          <div className="flex-1">
                            <Progress value={reviewsBi.total ? (reviewsBi.text / reviewsBi.total) * 100 : 0} />
                          </div>
                          <div className="w-12 text-right text-sm text-gray-600">{reviewsBi.text}</div>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="w-20 text-sm font-medium text-gray-900">No text</div>
                          <div className="flex-1">
                            <Progress value={reviewsBi.total ? (reviewsBi.noText / reviewsBi.total) * 100 : 0} />
                          </div>
                          <div className="w-12 text-right text-sm text-gray-600">{reviewsBi.noText}</div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              ) : null}

              {reviewsSection === 'templates' ? (
                <div className="grid gap-4 lg:grid-cols-2">
                  <div className="rounded-xl border bg-white p-4">
                    <div className="font-semibold text-gray-900 mb-3">Create template</div>
                    <div className="space-y-3">
                      <div>
                        <Label>Name</Label>
                        <Input className="mt-2" value={templateForm.name} onChange={(e) => setTemplateForm((p) => ({ ...p, name: e.target.value }))} />
                      </div>
                      <div>
                        <Label>Template</Label>
                        <Textarea className="mt-2" rows={5} value={templateForm.templateText} onChange={(e) => setTemplateForm((p) => ({ ...p, templateText: e.target.value }))} placeholder="Use {{location}} and {{name}} if desired." />
                      </div>
                      <Button onClick={createReviewTemplate}>Create</Button>
                    </div>
                  </div>

                  <div className="rounded-xl border bg-white p-4">
                    <div className="font-semibold text-gray-900 mb-3">Templates</div>
                    {reviewTemplates.length === 0 ? (
                      <div className="text-sm text-gray-600">No templates yet.</div>
                    ) : (
                      <div className="space-y-3 max-h-[420px] overflow-y-auto pr-1">
                        {reviewTemplates.map((t) => (
                          <div key={t.id} className="rounded-xl border p-3">
                            <div className="font-semibold text-gray-900">{t.name}</div>
                            <div className="mt-2 text-sm text-gray-700 whitespace-pre-wrap">{t.template_text}</div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ) : null}

              {reviewsSection === 'auto_reply' ? (
                <div className="grid gap-4 lg:grid-cols-2">
                  <div className="rounded-xl border bg-white p-4">
                    <div className="font-semibold text-gray-900 mb-3">Create auto-reply rule</div>
                    <div className="space-y-3">
                      <div>
                        <Label>Rule name</Label>
                        <Input className="mt-2" value={ruleForm.name} onChange={(e) => setRuleForm((p) => ({ ...p, name: e.target.value }))} />
                      </div>
                      <div className="grid gap-3 md:grid-cols-2">
                        <div>
                          <Label>Min rating</Label>
                          <Input className="mt-2" type="number" min={1} max={5} value={ruleForm.minRating} onChange={(e) => setRuleForm((p) => ({ ...p, minRating: Number(e.target.value) }))} />
                        </div>
                        <div>
                          <Label>Max rating</Label>
                          <Input className="mt-2" type="number" min={1} max={5} value={ruleForm.maxRating} onChange={(e) => setRuleForm((p) => ({ ...p, maxRating: Number(e.target.value) }))} />
                        </div>
                      </div>
                      <div>
                        <Label>Template</Label>
                        <select className="w-full mt-2 p-2 border rounded-md" value={ruleForm.templateId} onChange={(e) => setRuleForm((p) => ({ ...p, templateId: e.target.value }))}>
                          <option value="">None</option>
                          {reviewTemplates.map((t) => (
                            <option key={t.id} value={t.id}>{t.name}</option>
                          ))}
                        </select>
                      </div>
                      <label className="flex items-center gap-2 text-sm text-gray-700">
                        <input type="checkbox" checked={ruleForm.requireApproval} onChange={(e) => setRuleForm((p) => ({ ...p, requireApproval: e.target.checked }))} />
                        Require approval
                      </label>
                      <Button onClick={createAutoReplyRule}>Create rule</Button>
                      <div className="text-xs text-gray-500">
                        Auto-posting replies depends on your approval setting. We’ll keep this safe by default.
                      </div>
                    </div>
                  </div>

                  <div className="rounded-xl border bg-white p-4">
                    <div className="font-semibold text-gray-900 mb-3">Rules</div>
                    {autoReplyRules.length === 0 ? (
                      <div className="text-sm text-gray-600">No rules yet.</div>
                    ) : (
                      <div className="space-y-3 max-h-[420px] overflow-y-auto pr-1">
                        {autoReplyRules.map((r) => (
                          <div key={r.id} className="rounded-xl border p-3">
                            <div className="flex items-start justify-between gap-3">
                              <div>
                                <div className="font-semibold text-gray-900">{r.name}</div>
                                <div className="text-xs text-gray-500">
                                  Rating {r.min_rating}–{r.max_rating} • {r.only_unreplied ? 'Only unreplied' : 'All'} • {r.require_approval ? 'Approval' : 'Auto'}
                                </div>
                              </div>
                              <Button size="sm" variant={r.is_enabled ? 'outline' : 'default'} onClick={() => toggleRuleEnabled(r.id, !r.is_enabled)}>
                                {r.is_enabled ? 'Disable' : 'Enable'}
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ) : null}

              {reviewsSection === 'qr' ? (
                <div className="grid gap-4 lg:grid-cols-2">
                  <div className="rounded-xl border bg-white p-4">
                    <div className="font-semibold text-gray-900 mb-3">Create custom QR codes</div>
                    <div className="space-y-3">
                      <div>
                        <Label>Label</Label>
                        <Input className="mt-2" value={qrForm.label} onChange={(e) => setQrForm((p) => ({ ...p, label: e.target.value }))} placeholder="Front desk / Poster / etc." />
                      </div>
                      <div>
                        <Label>Location (optional)</Label>
                        <select className="w-full mt-2 p-2 border rounded-md" value={qrForm.locationId} onChange={(e) => setQrForm((p) => ({ ...p, locationId: e.target.value }))}>
                          <option value="">None</option>
                          {locations.map((l) => (
                            <option key={l.id} value={l.id}>{l.location_name}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <Label>Target URL *</Label>
                        <Input className="mt-2" value={qrForm.targetUrl} onChange={(e) => setQrForm((p) => ({ ...p, targetUrl: e.target.value }))} placeholder="Google review link / website link" />
                        <div className="mt-1 text-xs text-gray-500">QR redirects via `/api/qr/:code` and tracks scans.</div>
                      </div>
                      <Button onClick={generateQr} disabled={qrGenerating}>
                        {qrGenerating ? 'Generating…' : 'Generate'}
                      </Button>

                      {qrPreviewDataUrl ? (
                        <div className="mt-3 rounded-xl border p-3 bg-gray-50">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={qrPreviewDataUrl} alt="QR code" className="w-48 h-48 mx-auto" />
                          <div className="mt-2 text-center text-xs text-gray-600">Right click to save</div>
                        </div>
                      ) : null}
                    </div>
                  </div>

                  <div className="rounded-xl border bg-white p-4">
                    <div className="font-semibold text-gray-900 mb-3">QR codes</div>
                    {qrCodes.length === 0 ? (
                      <div className="text-sm text-gray-600">No QR codes yet.</div>
                    ) : (
                      <div className="space-y-3 max-h-[420px] overflow-y-auto pr-1">
                        {qrCodes.map((q) => (
                          <div key={q.id} className="rounded-xl border p-3">
                            <div className="font-semibold text-gray-900">{q.label || 'QR code'}</div>
                            <div className="text-xs text-gray-500 mt-1">Code: {q.code}</div>
                            <div className="mt-2 text-xs">
                              <a className="text-blue-600 hover:underline" href={q.target_url} target="_blank" rel="noreferrer">
                                Target
                              </a>
                            </div>
                            <div className="mt-2 text-xs text-gray-600">
                              Redirect link: <span className="font-mono">{typeof window !== 'undefined' ? `${window.location.origin}/api/qr/${q.code}` : `/api/qr/${q.code}`}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ) : null}

              {reviewsSection === 'inbox' ? (
                <>
                  <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                    <Segmented
                      value={reviewsView}
                      onChange={setReviewsView as any}
                      options={[
                        { value: 'inbox', label: 'Inbox', right: <Badge>{reviews.length}</Badge> },
                        { value: 'needs_reply', label: 'Needs reply', right: <Badge variant="info">{unrepliedCount}</Badge> },
                        { value: 'replied', label: 'Replied', right: <Badge>{reviews.filter((r) => r.is_replied).length}</Badge> },
                      ]}
                    />
                    <div className="text-sm text-gray-600">
                      Showing <span className="font-medium">{reviewsForView.length}</span> of{' '}
                      <span className="font-medium">{reviews.length}</span>
                    </div>
                  </div>

                  <div className="grid gap-3 md:grid-cols-3">
                    <div>
                      <Label>Rating</Label>
                      <select
                        className="w-full mt-2 p-2 border rounded-md"
                        value={reviewRating}
                        onChange={(e) => setReviewRating(e.target.value === 'all' ? 'all' : Number(e.target.value))}
                      >
                        <option value="all">All</option>
                        <option value="5">5</option>
                        <option value="4">4</option>
                        <option value="3">3</option>
                        <option value="2">2</option>
                        <option value="1">1</option>
                      </select>
                    </div>
                    <div>
                      <Label>Location</Label>
                      <select
                        className="w-full mt-2 p-2 border rounded-md"
                        value={reviewLocationId}
                        onChange={(e) => setReviewLocationId(e.target.value as any)}
                      >
                        <option value="all">All</option>
                        {locations.map((l) => (
                          <option key={l.id} value={l.id}>{l.location_name}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <Label>Search</Label>
                      <Input className="mt-2" value={reviewSearch} onChange={(e) => setReviewSearch(e.target.value)} placeholder="Name, comment, location…" />
                    </div>
                  </div>

                  {reviewsForView.length === 0 ? (
                    <div className="text-center py-10 text-gray-500">
                      No reviews found. Click <span className="font-medium">Sync reviews</span>.
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {reviewsForView.map((r) => {
                        const draft = replyDrafts[r.id] ?? ''
                        const locName = r.location?.location_name
                        return (
                          <div key={r.id} className="rounded-xl border p-4">
                            <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                              <div className="space-y-1">
                                <div className="flex items-center gap-2">
                                  <div className="font-semibold text-gray-900">{r.reviewer_name || 'Anonymous'}</div>
                                  <Badge variant={r.rating >= 4 ? 'success' : r.rating === 3 ? 'neutral' : 'info'}>
                                    {r.rating}★
                                  </Badge>
                                  {r.is_replied ? <Badge variant="info">Replied</Badge> : <Badge>Unreplied</Badge>}
                                </div>
                                <div className="text-xs text-gray-500">
                                  {locName ? `${locName} • ` : ''}{new Date(r.review_date).toLocaleString()}
                                </div>
                                {r.comment && <div className="text-sm text-gray-800 mt-2">{r.comment}</div>}
                              </div>
                            </div>

                            <div className="mt-3 rounded-lg bg-gray-50 p-3">
                              <div className="text-xs font-semibold text-gray-600">Reply</div>
                              <Textarea
                                className="mt-2"
                                rows={3}
                                value={draft || r.review_reply || ''}
                                onChange={(e) => setReplyDrafts((prev) => ({ ...prev, [r.id]: e.target.value }))}
                                placeholder="Write a reply…"
                              />
                              <div className="mt-2 flex flex-wrap gap-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() =>
                                    setReplyDrafts((prev) => ({
                                      ...prev,
                                      [r.id]: suggestReply(r.rating, locName),
                                    }))
                                  }
                                >
                                  Suggest reply
                                </Button>
                                <Button
                                  size="sm"
                                  onClick={() => handleReplyReview(r.id)}
                                  disabled={!draft.trim() || !organizationId}
                                >
                                  <Send className="h-4 w-4 mr-2" />
                                  Post reply
                                </Button>
                              </div>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </>
              ) : null}
            </CardContent>
          </Card>
        )}

        {activeTab === 'post_scheduling' && (
          <Card>
            <CardHeader>
              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Megaphone className="h-5 w-5" />
                    Posts
                  </CardTitle>
                  <CardDescription>Create drafts, schedule, and publish across locations.</CardDescription>
                </div>
                <Segmented
                  value={postsView}
                  onChange={setPostsView as any}
                  options={[
                    { value: 'create', label: 'Create' },
                    { value: 'drafts', label: 'Drafts', right: <Badge>{posts.filter((p) => p.status === 'draft').length}</Badge> },
                    { value: 'scheduled', label: 'Scheduled', right: <Badge>{posts.filter((p) => p.status === 'scheduled').length}</Badge> },
                    { value: 'published', label: 'Published', right: <Badge variant="success">{posts.filter((p) => p.status === 'published').length}</Badge> },
                    { value: 'failed', label: 'Failed', right: <Badge variant="danger">{posts.filter((p) => p.status === 'failed').length}</Badge> },
                  ]}
                />
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {postsView === 'create' ? (
                <div className="grid gap-4 lg:grid-cols-2">
                  <div className="rounded-xl border p-4">
                    <div className="font-semibold text-gray-900 mb-3">Create Post</div>
                    <div className="space-y-3">
                    <div>
                      <Label>Title (optional)</Label>
                      <Input className="mt-2" value={postForm.title} onChange={(e) => setPostForm((p) => ({ ...p, title: e.target.value }))} />
                    </div>
                    <div>
                      <Label>Content *</Label>
                      <Textarea className="mt-2" rows={4} value={postForm.content} onChange={(e) => setPostForm((p) => ({ ...p, content: e.target.value }))} />
                    </div>
                    <div className="grid gap-3 md:grid-cols-2">
                      <div>
                        <Label>CTA</Label>
                        <select
                          className="w-full mt-2 p-2 border rounded-md"
                          value={postForm.callToAction}
                          onChange={(e) => setPostForm((p) => ({ ...p, callToAction: e.target.value }))}
                        >
                          <option value="">None</option>
                          <option value="LEARN_MORE">Learn more</option>
                          <option value="CALL">Call</option>
                          <option value="BOOK">Book</option>
                          <option value="ORDER">Order</option>
                        </select>
                      </div>
                      <div>
                        <Label>CTA URL</Label>
                        <Input className="mt-2" value={postForm.actionUrl} onChange={(e) => setPostForm((p) => ({ ...p, actionUrl: e.target.value }))} placeholder="https://…" />
                      </div>
                    </div>
                    <div>
                      <Label>Media URLs (one per line)</Label>
                      <Textarea className="mt-2 font-mono text-xs" rows={3} value={postForm.mediaUrls} onChange={(e) => setPostForm((p) => ({ ...p, mediaUrls: e.target.value }))} placeholder="https://…jpg" />
                    </div>
                    <div className="grid gap-3 md:grid-cols-2">
                      <div>
                        <Label>Post type</Label>
                        <select
                          className="w-full mt-2 p-2 border rounded-md"
                          value={postForm.postType}
                          onChange={(e) => setPostForm((p) => ({ ...p, postType: e.target.value }))}
                        >
                          <option value="STANDARD">Standard</option>
                          <option value="EVENT">Event</option>
                          <option value="OFFER">Offer</option>
                        </select>
                      </div>
                      <div>
                        <Label>Schedule (optional)</Label>
                        <Input
                          className="mt-2"
                          type="datetime-local"
                          value={postForm.scheduledAt}
                          onChange={(e) => setPostForm((p) => ({ ...p, scheduledAt: e.target.value }))}
                        />
                      </div>
                    </div>
                    <div>
                      <div className="flex items-center justify-between">
                        <Label>Target locations *</Label>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() =>
                            setPostForm((p) => ({
                              ...p,
                              targetLocationIds:
                                p.targetLocationIds.length === locations.length ? [] : locations.map((l) => l.id),
                            }))
                          }
                        >
                          Toggle all
                        </Button>
                      </div>
                      <div className="mt-2 border rounded-lg divide-y max-h-56 overflow-y-auto">
                        {locations.map((l) => (
                          <label key={l.id} className="flex items-center p-3 hover:bg-gray-50 cursor-pointer">
                            <input
                              type="checkbox"
                              className="mr-3"
                              checked={postForm.targetLocationIds.includes(l.id)}
                              onChange={() =>
                                setPostForm((p) => ({
                                  ...p,
                                  targetLocationIds: p.targetLocationIds.includes(l.id)
                                    ? p.targetLocationIds.filter((x) => x !== l.id)
                                    : [...p.targetLocationIds, l.id],
                                }))
                              }
                            />
                            <div className="flex-1">
                              <div className="font-medium">{l.location_name}</div>
                              <div className="text-xs text-gray-500">{l.category || ''}</div>
                            </div>
                          </label>
                        ))}
                      </div>
                    </div>
                      <Button className="w-full" onClick={handleCreatePost} disabled={posting}>
                        {posting ? 'Saving…' : 'Create post'}
                      </Button>
                    </div>
                  </div>

                  <div className="rounded-xl border p-4">
                    <div className="font-semibold text-gray-900 mb-3">Tips</div>
                    <div className="text-sm text-gray-600 space-y-2">
                      <div className="rounded-lg bg-gray-50 p-3 border">
                        Use short content + 1 CTA link for best performance.
                      </div>
                      <div className="rounded-lg bg-gray-50 p-3 border">
                        Schedule posts during working hours to maximize clicks.
                      </div>
                      <div className="rounded-lg bg-gray-50 p-3 border">
                        After publishing, sync insights to see impact.
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="rounded-xl border">
                  <div className="grid grid-cols-12 bg-gray-50 px-4 py-2 text-xs font-semibold text-gray-600">
                    <div className="col-span-4">Post</div>
                    <div className="col-span-2">Status</div>
                    <div className="col-span-3">Schedule/Published</div>
                    <div className="col-span-1">Targets</div>
                    <div className="col-span-2">Actions</div>
                  </div>
                  <div className="divide-y">
                    {postsForView.length === 0 ? (
                      <div className="px-4 py-8 text-sm text-gray-600">No posts in this view.</div>
                    ) : (
                      postsForView.map((p) => (
                        <div key={p.id} className="grid grid-cols-12 items-center px-4 py-3 text-sm gap-2">
                          <div className="col-span-4">
                            <div className="font-medium text-gray-900">{p.title || 'Untitled'}</div>
                            <div className="text-xs text-gray-500 line-clamp-2">{p.content}</div>
                          </div>
                          <div className="col-span-2">
                            <Badge
                              variant={
                                p.status === 'published'
                                  ? 'success'
                                  : p.status === 'failed'
                                    ? 'danger'
                                    : p.status === 'scheduled'
                                      ? 'info'
                                      : 'neutral'
                              }
                            >
                              {p.status}
                            </Badge>
                          </div>
                          <div className="col-span-3 text-xs text-gray-600">
                            {p.scheduled_at ? `Scheduled: ${new Date(p.scheduled_at).toLocaleString()}` : ''}
                            {p.published_at ? `Published: ${new Date(p.published_at).toLocaleString()}` : ''}
                            {!p.scheduled_at && !p.published_at ? '—' : ''}
                          </div>
                          <div className="col-span-1 text-gray-700">{p.target_locations?.length ?? 0}</div>
                          <div className="col-span-2 flex gap-2 justify-end">
                            <Button
                              size="sm"
                              onClick={() => handlePublishPost(p.id)}
                              disabled={posting || p.status === 'published' || p.status === 'scheduled'}
                            >
                              Publish
                            </Button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {activeTab === 'performance' && (
          <Card>
            <CardHeader>
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <CalendarDays className="h-5 w-5" />
                    Performance Analytics (30 days)
                  </CardTitle>
                  <CardDescription>
                    Sync Google Business Profile performance metrics and view totals.
                  </CardDescription>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <Segmented
                    value={analyticsView}
                    onChange={setAnalyticsView as any}
                    options={[
                      { value: 'overview', label: 'Overview' },
                      { value: 'by_city', label: 'By city' },
                      { value: 'by_location', label: 'By location' },
                    ]}
                  />
                  <Button variant="outline" onClick={handleSyncInsights} disabled={syncingInsights || !organizationId || accounts.length === 0}>
                    <RefreshCw className="h-4 w-4 mr-2" />
                    {syncingInsights ? 'Syncing…' : 'Sync insights'}
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-xl border bg-white p-4">
                <div className="grid gap-3 md:grid-cols-3">
                  <div>
                    <Label>State</Label>
                    <select
                      className="w-full mt-2 p-2 border rounded-md"
                      value={perfState}
                      onChange={(e) => {
                        const v = e.target.value
                        setPerfState(v)
                        setPerfCity('all')
                      }}
                    >
                      <option value="all">All states</option>
                      {perfStateOptions.map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <Label>City</Label>
                    <select className="w-full mt-2 p-2 border rounded-md" value={perfCity} onChange={(e) => setPerfCity(e.target.value)}>
                      <option value="all">All cities</option>
                      {perfCityOptions.map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <Label>Search</Label>
                    <Input className="mt-2" value={perfSearch} onChange={(e) => setPerfSearch(e.target.value)} placeholder="Search location / phone / website…" />
                  </div>
                </div>
                <div className="mt-2 text-xs text-gray-500">
                  Showing <span className="font-medium text-gray-900">{perfFilteredLocationTotals.length}</span> location(s) with insights in the last 30 days.
                </div>
              </div>

              {analyticsView === 'overview' ? (
                <div className="grid gap-4 md:grid-cols-4">
                  <Card>
                    <CardHeader className="pb-2">
                      <CardDescription>Website clicks</CardDescription>
                      <CardTitle className="text-2xl">{insightTotalsByMetric.WEBSITE_CLICKS || 0}</CardTitle>
                    </CardHeader>
                  </Card>
                  <Card>
                    <CardHeader className="pb-2">
                      <CardDescription>Call clicks</CardDescription>
                      <CardTitle className="text-2xl">{insightTotalsByMetric.CALL_CLICKS || 0}</CardTitle>
                    </CardHeader>
                  </Card>
                  <Card>
                    <CardHeader className="pb-2">
                      <CardDescription>Directions</CardDescription>
                      <CardTitle className="text-2xl">{insightTotalsByMetric.BUSINESS_DIRECTION_REQUESTS || 0}</CardTitle>
                    </CardHeader>
                  </Card>
                  <Card>
                    <CardHeader className="pb-2">
                      <CardDescription>Total impressions</CardDescription>
                      <CardTitle className="text-2xl">
                        {(insightTotalsByMetric.BUSINESS_IMPRESSIONS_DESKTOP_MAPS || 0) +
                          (insightTotalsByMetric.BUSINESS_IMPRESSIONS_MOBILE_MAPS || 0) +
                          (insightTotalsByMetric.BUSINESS_IMPRESSIONS_DESKTOP_SEARCH || 0) +
                          (insightTotalsByMetric.BUSINESS_IMPRESSIONS_MOBILE_SEARCH || 0)}
                      </CardTitle>
                    </CardHeader>
                  </Card>
                </div>
              ) : null}

              {analyticsView === 'by_city' ? (
                <div className="overflow-hidden rounded-xl border">
                  <div className="grid grid-cols-12 bg-gray-50 px-4 py-2 text-xs font-semibold text-gray-600">
                    <div className="col-span-4">City</div>
                    <div className="col-span-2">Locations</div>
                    <div className="col-span-2">Website</div>
                    <div className="col-span-2">Calls</div>
                    <div className="col-span-2">Impressions</div>
                  </div>
                  <div className="divide-y">
                    {perfByCityRows.length === 0 ? (
                      <div className="px-4 py-8 text-sm text-gray-600">No insights data for the selected filters.</div>
                    ) : (
                      perfByCityRows.slice(0, 50).map((r: any) => (
                        <div key={r.key} className="grid grid-cols-12 items-center px-4 py-3 text-sm">
                          <div className="col-span-4 min-w-0">
                            <div className="font-medium text-gray-900 truncate">{r.city}</div>
                            <div className="text-xs text-gray-500 truncate">{r.state}</div>
                          </div>
                          <div className="col-span-2 text-gray-900">{r.locations}</div>
                          <div className="col-span-2 text-gray-700">{r.WEBSITE_CLICKS}</div>
                          <div className="col-span-2 text-gray-700">{r.CALL_CLICKS}</div>
                          <div className="col-span-2 font-semibold text-gray-900">{r.IMPRESSIONS}</div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              ) : null}

              {analyticsView === 'by_location' ? (
                <div className="overflow-hidden rounded-xl border">
                  <div className="grid grid-cols-12 bg-gray-50 px-4 py-2 text-xs font-semibold text-gray-600">
                    <div className="col-span-5">Location</div>
                    <div className="col-span-2">Website</div>
                    <div className="col-span-1">Calls</div>
                    <div className="col-span-2">Directions</div>
                    <div className="col-span-2">Impressions</div>
                  </div>
                  <div className="divide-y">
                    {perfFilteredLocationTotals.length === 0 ? (
                      <div className="px-4 py-8 text-sm text-gray-600">No insights data yet.</div>
                    ) : (
                      perfFilteredLocationTotals.map((row: any) => {
                        const loc = locationById[row.gmb_location_id]
                        const meta = locationMetaById[row.gmb_location_id]
                        const cityState = [meta?.city, meta?.state].filter(Boolean).join(', ') || '—'
                        const addrLine = meta?.line || loc?.address?.formattedAddress || '—'
                        return (
                          <div key={row.gmb_location_id} className="grid grid-cols-12 items-center px-4 py-3 text-sm">
                            <div className="col-span-5 min-w-0">
                              <div className="font-medium text-gray-900 truncate">{row.location_name}</div>
                              <div className="text-xs text-gray-500 truncate">{addrLine}</div>
                              <div className="mt-1 flex flex-wrap items-center gap-2 text-xs">
                                <span className="rounded-full bg-gray-100 px-2 py-0.5 text-gray-700">{cityState}</span>
                                {loc?.phone ? <span className="text-gray-600">• {loc.phone}</span> : null}
                                {loc?.website ? (
                                  <a className="text-blue-600 hover:underline" href={loc.website} target="_blank" rel="noreferrer">
                                    Website
                                  </a>
                                ) : null}
                              </div>
                            </div>
                            <div className="col-span-2 text-gray-700">{row.WEBSITE_CLICKS}</div>
                            <div className="col-span-1 text-gray-700">{row.CALL_CLICKS}</div>
                            <div className="col-span-2 text-gray-700">{row.BUSINESS_DIRECTION_REQUESTS}</div>
                            <div className="col-span-2 font-semibold text-gray-900">{row.IMPRESSIONS}</div>
                          </div>
                        )
                      })
                    )}
                  </div>
                </div>
              ) : null}

              {insights.length > 0 && analyticsView === 'overview' ? (
                <div className="rounded-xl border bg-white overflow-hidden">
                  <div className="flex flex-col gap-2 px-4 py-3 md:flex-row md:items-center md:justify-between">
                    <div>
                      <div className="font-semibold text-gray-900">Workshops (location-wise)</div>
                      <div className="text-xs text-gray-500">
                        Compact summary for the last 30 days. Expand a workshop to see recent metric rows.
                      </div>
                    </div>
                    <details className="md:text-right">
                      <summary className="cursor-pointer text-sm font-medium text-blue-700 hover:underline">
                        View raw feed (last 200 rows)
                      </summary>
                      <div className="mt-2 max-h-80 overflow-y-auto rounded-lg border bg-white">
                        <div className="grid grid-cols-12 bg-gray-50 px-3 py-2 text-[11px] font-semibold text-gray-600">
                          <div className="col-span-3">Date</div>
                          <div className="col-span-5">Location</div>
                          <div className="col-span-3">Metric</div>
                          <div className="col-span-1 text-right">Val</div>
                        </div>
                        <div className="divide-y">
                          {insights.slice(-200).reverse().map((p, idx) => (
                            <div
                              key={`${p.gmb_location_id}-${p.metric_type}-${p.date}-${idx}`}
                              className="grid grid-cols-12 items-center px-3 py-2 text-xs"
                            >
                              <div className="col-span-3 text-gray-600">{p.date}</div>
                              <div className="col-span-5 text-gray-900 truncate">{p.location?.location_name || '—'}</div>
                              <div className="col-span-3 text-gray-600 truncate">{p.metric_type}</div>
                              <div className="col-span-1 text-right font-medium text-gray-900">{p.metric_value}</div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </details>
                  </div>

                  <div className="divide-y">
                    {perfFilteredLocationTotals.length === 0 ? (
                      <div className="px-4 py-8 text-sm text-gray-600">No insights data yet.</div>
                    ) : (
                      perfFilteredLocationTotals.map((row: any) => {
                        const loc = locationById[row.gmb_location_id]
                        const meta = locationMetaById[row.gmb_location_id]
                        const cityState = [meta?.city, meta?.state].filter(Boolean).join(', ') || '—'
                        const addrLine = meta?.line || loc?.address?.formattedAddress || '—'

                        const impressions = Number(row.IMPRESSIONS || 0)
                        const website = Number(row.WEBSITE_CLICKS || 0)
                        const calls = Number(row.CALL_CLICKS || 0)
                        const directions = Number(row.BUSINESS_DIRECTION_REQUESTS || 0)
                        const ctr = impressions ? Math.round((website / impressions) * 1000) / 10 : 0

                        const recent = insightsRecentByLocation[String(row.gmb_location_id)] || []
                        const prettyMetric = (mt: string) => {
                          if (mt === 'WEBSITE_CLICKS') return 'Website clicks'
                          if (mt === 'CALL_CLICKS') return 'Calls'
                          if (mt === 'BUSINESS_DIRECTION_REQUESTS') return 'Directions'
                          if (mt === 'BUSINESS_IMPRESSIONS_DESKTOP_MAPS') return 'Impr. (Maps desktop)'
                          if (mt === 'BUSINESS_IMPRESSIONS_MOBILE_MAPS') return 'Impr. (Maps mobile)'
                          if (mt === 'BUSINESS_IMPRESSIONS_DESKTOP_SEARCH') return 'Impr. (Search desktop)'
                          if (mt === 'BUSINESS_IMPRESSIONS_MOBILE_SEARCH') return 'Impr. (Search mobile)'
                          return mt
                        }

                        return (
                          <details key={row.gmb_location_id} className="group">
                            <summary className="cursor-pointer list-none px-4 py-3 hover:bg-gray-50">
                              <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                                <div className="min-w-0">
                                  <div className="flex items-center gap-2">
                                    <div className="font-medium text-gray-900 truncate">{row.location_name}</div>
                                    <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[11px] text-gray-700">
                                      {cityState}
                                    </span>
                                  </div>
                                  <div className="text-xs text-gray-500 truncate">{addrLine}</div>
                                  <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-gray-600">
                                    {loc?.phone ? <span>• {loc.phone}</span> : null}
                                    {loc?.website ? (
                                      <a className="text-blue-600 hover:underline" href={loc.website} target="_blank" rel="noreferrer">
                                        Website
                                      </a>
                                    ) : null}
                                  </div>
                                </div>

                                <div className="grid grid-cols-2 gap-2 md:grid-cols-5 md:gap-3 shrink-0">
                                  <div className="rounded-lg border bg-white px-3 py-2">
                                    <div className="text-[11px] text-gray-500">Impressions</div>
                                    <div className="font-semibold text-gray-900">{impressions}</div>
                                  </div>
                                  <div className="rounded-lg border bg-white px-3 py-2">
                                    <div className="text-[11px] text-gray-500">Website</div>
                                    <div className="font-semibold text-gray-900">{website}</div>
                                  </div>
                                  <div className="rounded-lg border bg-white px-3 py-2">
                                    <div className="text-[11px] text-gray-500">Calls</div>
                                    <div className="font-semibold text-gray-900">{calls}</div>
                                  </div>
                                  <div className="rounded-lg border bg-white px-3 py-2">
                                    <div className="text-[11px] text-gray-500">Directions</div>
                                    <div className="font-semibold text-gray-900">{directions}</div>
                                  </div>
                                  <div className="rounded-lg border bg-white px-3 py-2">
                                    <div className="text-[11px] text-gray-500">CTR</div>
                                    <div className="font-semibold text-gray-900">{ctr}%</div>
                                  </div>
                                </div>
                              </div>
                            </summary>

                            <div className="px-4 pb-4">
                              <div className="mt-2 rounded-xl border bg-white overflow-hidden">
                                <div className="flex items-center justify-between bg-gray-50 px-3 py-2">
                                  <div className="text-xs font-semibold text-gray-700">Recent metrics (this workshop)</div>
                                  <div className="text-[11px] text-gray-500">Showing latest {Math.min(40, recent.length)}</div>
                                </div>
                                <div className="divide-y max-h-72 overflow-y-auto">
                                  {recent.slice(0, 40).map((p: any, idx: number) => (
                                    <div key={`${p.metric_type}-${p.date}-${idx}`} className="grid grid-cols-12 items-center px-3 py-2 text-xs">
                                      <div className="col-span-3 text-gray-600">{p.date}</div>
                                      <div className="col-span-7 text-gray-700 truncate">{prettyMetric(String(p.metric_type || ''))}</div>
                                      <div className="col-span-2 text-right font-medium text-gray-900">{p.metric_value}</div>
                                    </div>
                                  ))}
                                  {recent.length === 0 ? (
                                    <div className="px-3 py-6 text-sm text-gray-600">No recent metric rows for this workshop.</div>
                                  ) : null}
                                </div>
                              </div>
                            </div>
                          </details>
                        )
                      })
                    )}
                  </div>
                </div>
              ) : null}
            </CardContent>
          </Card>
        )}

        {activeTab === 'keyword_position' && (
          <Card>
            <CardHeader>
              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div>
                  <CardTitle>Keyword Position Tracking</CardTitle>
                  <CardDescription>Track Google Maps ranks for keywords (requires Rank Provider integration).</CardDescription>
                </div>
                <Button variant="outline" onClick={runRankProviderTest} disabled={rankTesting}>
                  {rankTesting ? 'Testing…' : 'Test provider'}
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="text-sm text-gray-600">
                    Track and export keyword ranks. Scheduling is controlled via <span className="font-mono">is_scheduled</span>.
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" onClick={exportKeywordRanksCsv} disabled={rankKeywords.length === 0}>
                      Export CSV
                    </Button>
                    <Button onClick={runKeywordRanksNow} disabled={rankRunning}>
                      {rankRunning ? 'Running…' : 'Run now'}
                    </Button>
                  </div>
                </div>

                <div className="grid gap-4 lg:grid-cols-2">
                  <div className="rounded-xl border bg-white p-4">
                    <div className="font-semibold text-gray-900 mb-3">Add keyword</div>
                    <div className="space-y-3">
                      <div>
                        <Label>Keyword *</Label>
                        <Input className="mt-2" value={rankKeywordForm.keyword} onChange={(e) => setRankKeywordForm((p) => ({ ...p, keyword: e.target.value }))} placeholder="e.g. car repair near me" />
                      </div>
                      <div className="grid gap-3 md:grid-cols-2">
                        <div>
                          <Label>Target location (optional)</Label>
                          <select className="w-full mt-2 p-2 border rounded-md" value={rankKeywordForm.gmbLocationId} onChange={(e) => setRankKeywordForm((p) => ({ ...p, gmbLocationId: e.target.value }))}>
                            <option value="">None</option>
                            {locations.map((l) => (
                              <option key={l.id} value={l.id}>{l.location_name}</option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <Label>Language</Label>
                          <Input className="mt-2" value={rankKeywordForm.languageCode} onChange={(e) => setRankKeywordForm((p) => ({ ...p, languageCode: e.target.value }))} placeholder="en" />
                        </div>
                      </div>
                      <div>
                        <Label>Provider location name fallback</Label>
                        <Input className="mt-2" value={rankKeywordForm.locationName} onChange={(e) => setRankKeywordForm((p) => ({ ...p, locationName: e.target.value }))} placeholder="City,State,Country" />
                      </div>
                      <label className="flex items-center gap-2 text-sm text-gray-700">
                        <input type="checkbox" checked={rankKeywordForm.isScheduled} onChange={(e) => setRankKeywordForm((p) => ({ ...p, isScheduled: e.target.checked }))} />
                        Include in scheduled runs
                      </label>
                      <Button onClick={createRankKeyword} disabled={rankLoading}>Add keyword</Button>
                      <div className="text-xs text-gray-500">
                        Best accuracy comes from storing lat/lng on locations (we’ll add via sync) and using provider GPS queries.
                      </div>
                    </div>
                  </div>

                  <div className="rounded-xl border bg-white p-4">
                    <div className="font-semibold text-gray-900 mb-3">Keywords</div>
                    {rankKeywords.length === 0 ? (
                      <div className="text-sm text-gray-600">No keywords yet.</div>
                    ) : (
                      <div className="overflow-hidden rounded-xl border">
                        <div className="grid grid-cols-12 bg-gray-50 px-4 py-2 text-xs font-semibold text-gray-600">
                          <div className="col-span-5">Keyword</div>
                          <div className="col-span-4">Location</div>
                          <div className="col-span-3 text-right">Latest rank</div>
                        </div>
                        <div className="divide-y max-h-[380px] overflow-y-auto">
                          {rankKeywords.map((k) => {
                            const latest = rankLatestByKeyword[k.id]
                            const prev = rankPrevByKeyword[k.id]
                            const delta =
                              latest?.rank_position != null && prev?.rank_position != null
                                ? Number(prev.rank_position) - Number(latest.rank_position)
                                : null
                            return (
                              <div key={k.id} className="grid grid-cols-12 items-center px-4 py-3 text-sm">
                                <div className="col-span-5 font-medium text-gray-900">{k.keyword}</div>
                                <div className="col-span-4 text-gray-700">{k.location?.location_name || k.location_name || '—'}</div>
                                <div className="col-span-3 text-right font-semibold text-gray-900">
                                  {latest?.rank_position ?? '—'}{' '}
                                  {delta != null ? (
                                    <span
                                      className={`ml-1 text-xs font-medium ${
                                        delta > 0 ? 'text-emerald-700' : delta < 0 ? 'text-red-700' : 'text-gray-500'
                                      }`}
                                    >
                                      {delta > 0 ? `↑${delta}` : delta < 0 ? `↓${Math.abs(delta)}` : '—'}
                                    </span>
                                  ) : null}
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="rounded-xl border bg-white p-4">
                  <div className="font-semibold text-gray-900 mb-3">Recent runs</div>
                  {rankRuns.length === 0 ? (
                    <div className="text-sm text-gray-600">No runs yet.</div>
                  ) : (
                    <div className="overflow-hidden rounded-xl border">
                      <div className="grid grid-cols-12 bg-gray-50 px-4 py-2 text-xs font-semibold text-gray-600">
                        <div className="col-span-4">Created</div>
                        <div className="col-span-2">Status</div>
                        <div className="col-span-2">Total</div>
                        <div className="col-span-2">OK</div>
                        <div className="col-span-2">Failed</div>
                      </div>
                      <div className="divide-y max-h-64 overflow-y-auto">
                        {rankRuns.map((r) => (
                          <div key={r.id} className="grid grid-cols-12 items-center px-4 py-2 text-sm">
                            <div className="col-span-4 text-gray-700">{new Date(r.created_at).toLocaleString()}</div>
                            <div className="col-span-2">
                              <Badge
                                variant={r.status === 'completed' ? 'success' : r.status === 'failed' ? 'danger' : 'info'}
                              >
                                {r.status}
                              </Badge>
                            </div>
                            <div className="col-span-2">{r.total_tasks ?? 0}</div>
                            <div className="col-span-2">{r.successful_tasks ?? 0}</div>
                            <div className="col-span-2">{r.failed_tasks ?? 0}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <div className="grid gap-4 lg:grid-cols-2">
                  <div className="rounded-xl border bg-white p-4">
                    <div className="font-semibold text-gray-900 mb-3">Provider test (DataForSEO)</div>
                    <div className="space-y-3">
                      <div>
                        <Label>Keyword</Label>
                        <Input className="mt-2" value={rankTest.keyword} onChange={(e) => setRankTest((p) => ({ ...p, keyword: e.target.value }))} />
                      </div>
                      <div>
                        <Label>Location name</Label>
                        <Input className="mt-2" value={rankTest.locationName} onChange={(e) => setRankTest((p) => ({ ...p, locationName: e.target.value }))} />
                        <div className="mt-1 text-xs text-gray-500">Example: City,State,Country</div>
                      </div>
                      <Button onClick={runRankProviderTest} disabled={rankTesting}>
                        {rankTesting ? 'Testing…' : 'Run test'}
                      </Button>
                      <div className="text-xs text-gray-500">
                        Requires Supabase secrets: <span className="font-mono">DATAFORSEO_LOGIN</span> and <span className="font-mono">DATAFORSEO_PASSWORD</span>.
                      </div>
                    </div>
                  </div>

                  <div className="rounded-xl border bg-white p-4">
                    <div className="font-semibold text-gray-900 mb-3">Test response</div>
                    {!rankTestResult ? (
                      <div className="text-sm text-gray-600">Run a test to verify credentials and response shape.</div>
                    ) : (
                      <div className="space-y-3">
                        {(() => {
                          const tasks = (rankTestResult as any)?.response?.tasks || (rankTestResult as any)?.tasks
                          const t0 = Array.isArray(tasks) && tasks.length ? tasks[0] : null
                          const r0 = Array.isArray(t0?.result) && t0.result.length ? t0.result[0] : null
                          const items = Array.isArray(r0?.items) ? r0.items : []
                          const top = items.slice(0, 8).map((it: any) => ({
                            title: String(it?.title || it?.name || '').trim(),
                            rank: it?.rank_group ?? it?.rank_absolute ?? it?.rank ?? null,
                            rating: it?.rating?.value ?? it?.rating ?? null,
                            reviews: it?.rating?.reviews_count ?? it?.reviews_count ?? it?.reviewsCount ?? null,
                          }))

                          return (
                            <>
                              <div className="grid gap-3 md:grid-cols-3">
                                <div className="rounded-lg border bg-gray-50 p-3">
                                  <div className="text-xs font-semibold text-gray-600">Places found</div>
                                  <div className="mt-1 text-lg font-semibold text-gray-900">{items.length || '—'}</div>
                                </div>
                                <div className="rounded-lg border bg-gray-50 p-3">
                                  <div className="text-xs font-semibold text-gray-600">Keyword</div>
                                  <div className="mt-1 text-sm font-semibold text-gray-900 truncate">{rankTest.keyword}</div>
                                </div>
                                <div className="rounded-lg border bg-gray-50 p-3">
                                  <div className="text-xs font-semibold text-gray-600">Location</div>
                                  <div className="mt-1 text-sm font-semibold text-gray-900 truncate">{rankTest.locationName}</div>
                                </div>
                              </div>

                              {top.length ? (
                                <div className="overflow-hidden rounded-xl border">
                                  <div className="grid grid-cols-12 bg-gray-50 px-3 py-2 text-[11px] font-semibold text-gray-600">
                                    <div className="col-span-7">Title</div>
                                    <div className="col-span-2 text-right">Rank</div>
                                    <div className="col-span-3 text-right">Rating</div>
                                  </div>
                                  <div className="divide-y">
                                    {top.map((it: any, idx: number) => (
                                      <div key={idx} className="grid grid-cols-12 items-center px-3 py-2 text-xs">
                                        <div className="col-span-7 font-medium text-gray-900 truncate">{it.title || '—'}</div>
                                        <div className="col-span-2 text-right text-gray-900">{it.rank ?? '—'}</div>
                                        <div className="col-span-3 text-right text-gray-700">
                                          {it.rating != null ? `${it.rating}★` : '—'}
                                          {it.reviews != null ? ` • ${it.reviews}` : ''}
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              ) : (
                                <div className="text-sm text-gray-600">No items returned by provider.</div>
                              )}

                              <details className="rounded-xl border bg-white p-3">
                                <summary className="cursor-pointer text-sm font-semibold text-gray-800">View raw response</summary>
                                <pre className="mt-2 text-xs bg-gray-50 border rounded-lg p-3 overflow-auto max-h-[420px] whitespace-pre-wrap">
{JSON.stringify(rankTestResult, null, 2)}
                                </pre>
                              </details>
                            </>
                          )
                        })()}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {activeTab === 'geo_grid_ranker' && (
          <Card>
            <CardHeader>
              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div>
                  <CardTitle>Geo Grid Ranker</CardTitle>
                  <CardDescription>Run a grid scan to visualize ranks around a location.</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <Segmented
                value={geoGridTab}
                onChange={setGeoGridTab as any}
                options={[
                  { value: 'scan', label: 'Geo Grid Scan' },
                  { value: 'history', label: 'Scan History' },
                  { value: 'schedule', label: 'Schedule Grid' },
                ]}
              />

              {geoGridTab === 'scan' ? (
                <div className="space-y-4">
                  <div className="grid gap-4 lg:grid-cols-2">
                    <div className="rounded-xl border bg-white p-4">
                      <div className="font-semibold text-gray-900 mb-3">Run geo grid scan</div>
                      <div className="space-y-3">
                        <div>
                          <Label>Keyword *</Label>
                          <Input className="mt-2" value={geoForm.keyword} onChange={(e) => setGeoForm((p) => ({ ...p, keyword: e.target.value }))} placeholder="e.g. car wash near me" />
                        </div>
                        <div>
                          <Label>Target listing (recommended)</Label>
                          <select
                            className="w-full mt-2 p-2 border rounded-md"
                            value={geoForm.gmbLocationId}
                            onChange={(e) => setGeoForm((p) => ({ ...p, gmbLocationId: e.target.value }))}
                          >
                            <option value="">Select location…</option>
                            {locations.map((l: any) => (
                              <option key={l.id} value={l.id}>{l.location_name}</option>
                            ))}
                          </select>
                          <div className="mt-1 text-xs text-gray-500">
                            If your location has lat/lng (via sync), scan will center automatically.
                          </div>
                        </div>
                        <div className="grid gap-3 md:grid-cols-2">
                          <div>
                            <Label>Grid</Label>
                            <select className="w-full mt-2 p-2 border rounded-md" value={geoForm.gridSize} onChange={(e) => setGeoForm((p) => ({ ...p, gridSize: Number(e.target.value) }))}>
                              <option value={5}>5x5</option>
                              <option value={7}>7x7</option>
                              <option value={9}>9x9</option>
                              <option value={11}>11x11</option>
                            </select>
                          </div>
                          <div>
                            <Label>Step (km)</Label>
                            <Input className="mt-2" type="number" value={geoForm.stepKm} onChange={(e) => setGeoForm((p) => ({ ...p, stepKm: Number(e.target.value) }))} />
                          </div>
                        </div>
                        <div className="grid gap-3 md:grid-cols-2">
                          <div>
                            <Label>Center lat (optional)</Label>
                            <Input className="mt-2" value={geoForm.centerLat} onChange={(e) => setGeoForm((p) => ({ ...p, centerLat: e.target.value }))} placeholder="19.07" />
                          </div>
                          <div>
                            <Label>Center lng (optional)</Label>
                            <Input className="mt-2" value={geoForm.centerLng} onChange={(e) => setGeoForm((p) => ({ ...p, centerLng: e.target.value }))} placeholder="72.87" />
                          </div>
                        </div>
                        <Button onClick={runGeoGrid} disabled={geoRunning}>
                          {geoRunning ? 'Running…' : 'Run scan'}
                        </Button>
                      </div>
                    </div>

                    <div className="rounded-xl border bg-white p-4">
                      <div className="font-semibold text-gray-900 mb-3">Latest scans</div>
                      {geoRuns.length === 0 ? (
                        <div className="text-sm text-gray-600">No scans yet.</div>
                      ) : (
                        <div className="space-y-2">
                          <select
                            className="w-full p-2 border rounded-md"
                            value={geoSelectedRunId || ''}
                            onChange={async (e) => {
                              const runId = e.target.value || null
                              setGeoSelectedRunId(runId)
                              setGeoPoints([])
                              if (runId && organizationId) {
                                await loadGeoGridPoints(organizationId, runId)
                              }
                            }}
                          >
                            <option value="">Select scan…</option>
                            {geoRuns.map((r: any) => (
                              <option key={r.id} value={r.id}>
                                {new Date(r.created_at).toLocaleString()} • {r.keyword} • {r.status}
                              </option>
                            ))}
                          </select>

                          {(() => {
                            const run = geoSelectedRunId ? geoRuns.find((r: any) => r.id === geoSelectedRunId) : null
                            const errs = Array.isArray(run?.error_details) ? run.error_details : []
                            const show = run && run.status !== 'completed'
                            return show ? (
                              <div className="rounded-xl border bg-amber-50 border-amber-200 p-3 text-xs text-amber-900">
                                <div className="flex items-center justify-between gap-2">
                                  <div className="font-semibold">
                                    Scan status: {String(run.status || '—')}
                                  </div>
                                  <div className="text-amber-800">
                                    OK: {run.successful_points ?? 0} • Failed: {run.failed_points ?? 0}
                                  </div>
                                </div>
                                {errs.length ? (
                                  <div className="mt-2 space-y-1">
                                    <div className="font-semibold">Why it failed (sample):</div>
                                    {errs.slice(0, 3).map((e: any, idx: number) => (
                                      <div key={idx} className="truncate">
                                        {String(e?.error || '').slice(0, 180)}
                                      </div>
                                    ))}
                                    <div className="mt-1 text-amber-800">
                                      Tip: try 5x5 grid + step 1km first. If errors show 401/402/429, it’s credentials/credits/rate-limit on DataForSEO.
                                    </div>
                                  </div>
                                ) : (
                                  <div className="mt-2 text-amber-800">No error details were stored for this run.</div>
                                )}
                              </div>
                            ) : null
                          })()}

                          {geoPoints.length ? (
                            <div className="overflow-auto rounded-xl border">
                              <table className="w-full text-sm">
                                <tbody>
                                  {(() => {
                                    const maxX = Math.max(...geoPoints.map((p: any) => p.grid_x)) + 1
                                    const maxY = Math.max(...geoPoints.map((p: any) => p.grid_y)) + 1
                                    const map = new Map<string, any>()
                                    for (const p of geoPoints) map.set(`${p.grid_x},${p.grid_y}`, p)
                                    const rows = []
                                    for (let y = 0; y < maxY; y++) {
                                      const cells = []
                                      for (let x = 0; x < maxX; x++) {
                                        const p = map.get(`${x},${y}`)
                                        const v = p?.rank_position
                                        const label = v == null ? '—' : String(v)
                                        const cls =
                                          v == null
                                            ? 'bg-gray-50 text-gray-500'
                                            : v <= 3
                                              ? 'bg-emerald-50 text-emerald-800'
                                              : v <= 10
                                                ? 'bg-amber-50 text-amber-800'
                                                : 'bg-red-50 text-red-800'
                                        cells.push(
                                          <td key={x} className={`border px-3 py-2 text-center font-semibold ${cls}`}>
                                            {label}
                                          </td>
                                        )
                                      }
                                      rows.push(<tr key={y}>{cells}</tr>)
                                    }
                                    return rows
                                  })()}
                                </tbody>
                              </table>
                            </div>
                          ) : (
                            <div className="text-sm text-gray-600">Select a scan to view grid.</div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ) : null}
              {geoGridTab === 'history' ? (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-gray-600">History of geo grid scans</div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => organizationId && loadGeoGridData(organizationId)}
                      disabled={geoLoading}
                    >
                      {geoLoading ? 'Loading…' : 'Refresh'}
                    </Button>
                  </div>
                  {geoRuns.length === 0 ? (
                    <div className="text-sm text-gray-600">No scans yet.</div>
                  ) : (
                    <div className="overflow-hidden rounded-xl border">
                      <div className="grid grid-cols-12 bg-gray-50 px-4 py-2 text-xs font-semibold text-gray-600">
                        <div className="col-span-4">Created</div>
                        <div className="col-span-4">Keyword</div>
                        <div className="col-span-2">Grid</div>
                        <div className="col-span-2">Status</div>
                      </div>
                      <div className="divide-y">
                        {geoRuns.map((r: any) => (
                          <button
                            key={r.id}
                            type="button"
                            className="grid grid-cols-12 items-center px-4 py-3 text-sm hover:bg-gray-50 text-left"
                            onClick={async () => {
                              setGeoSelectedRunId(r.id)
                              if (organizationId) await loadGeoGridPoints(organizationId, r.id)
                              setGeoGridTab('scan')
                            }}
                          >
                            <div className="col-span-4 text-gray-700">{new Date(r.created_at).toLocaleString()}</div>
                            <div className="col-span-4 font-medium text-gray-900">{r.keyword}</div>
                            <div className="col-span-2 text-gray-700">{r.grid_size}x{r.grid_size}</div>
                            <div className="col-span-2">
                              <Badge variant={r.status === 'completed' ? 'success' : r.status === 'failed' ? 'danger' : 'info'}>
                                {r.status}
                              </Badge>
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : null}
              {geoGridTab === 'schedule' ? (
                <div className="rounded-xl border bg-white p-4 text-sm text-gray-700">
                  Scheduled scans can be enabled via Supabase cron once your keyword/geo configs are saved.\n\nNext step: store geo-grid schedules per location+keyword and run them via `geo_grid_run` in a cron job.
                </div>
              ) : null}
            </CardContent>
          </Card>
        )}

        {activeTab === 'competitors' && (
          <Card>
            <CardHeader>
              <CardTitle>Competitors & Share of Voice</CardTitle>
              <CardDescription>Uses Geo Grid scans to estimate share-of-voice in the local pack.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {geoRuns.length === 0 ? (
                  <div className="rounded-xl border bg-white p-4 text-sm text-gray-700">
                    No Geo Grid scans yet. Run a scan first to see competitor share-of-voice for your business/area.
                    <div className="mt-3">
                      <Button
                        size="sm"
                        onClick={() => {
                          setActiveTab('geo_grid_ranker')
                          setGeoGridTab('scan')
                        }}
                      >
                        Run geo grid scan
                      </Button>
                    </div>
                  </div>
                ) : null}

                <div className="grid gap-3 md:grid-cols-3">
                  <div>
                    <Label>Geo Grid run</Label>
                    <select
                      className="w-full mt-2 p-2 border rounded-md"
                      value={sovRunId || ''}
                      onChange={(e) => {
                        const id = e.target.value || null
                        setSovRunId(id)
                        setSovLoadedRunId(null)
                        setSovPoints([])
                      }}
                    >
                      <option value="">Select run…</option>
                      {geoRuns.map((r: any) => (
                        <option key={r.id} value={r.id}>
                          {new Date(r.created_at).toLocaleString()} • {r.keyword}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <Label>Top N</Label>
                    <select
                      className="w-full mt-2 p-2 border rounded-md"
                      value={sovTopN}
                      onChange={(e) => setSovTopN(Number(e.target.value))}
                    >
                      <option value={3}>Top 3</option>
                      <option value={5}>Top 5</option>
                      <option value={10}>Top 10</option>
                    </select>
                  </div>
                  <div className="flex items-end">
                    <Button
                      className="w-full"
                      onClick={async () => {
                        if (!organizationId) return
                        if (!sovRunId) {
                          notify({ variant: 'info', title: 'Select a geo grid run' })
                          return
                        }
                        setSovLoading(true)
                        await loadSovPoints(organizationId, sovRunId)
                        setSovLoadedRunId(sovRunId)
                        setSovLoading(false)
                      }}
                      disabled={!organizationId || !sovRunId || sovLoading}
                    >
                      {sovLoading ? 'Loading…' : 'Load share of voice'}
                    </Button>
                  </div>
                </div>

                <div className="grid gap-4 lg:grid-cols-3">
                  <Card className="lg:col-span-1">
                    <CardHeader className="pb-2">
                      <CardDescription>Your review summary</CardDescription>
                      <CardTitle className="text-2xl">{reviewsBi.avg.toFixed(2)}★</CardTitle>
                    </CardHeader>
                    <CardContent className="pt-0 text-sm text-gray-600">
                      Total reviews tracked: <span className="font-medium text-gray-900">{reviewsBi.total}</span>
                    </CardContent>
                  </Card>
                  <Card className="lg:col-span-2">
                    <CardHeader className="pb-2">
                      <CardDescription>Share of voice</CardDescription>
                      <CardTitle className="text-2xl">{sovRows.totalPoints ? `${sovRows.totalPoints} points` : '—'}</CardTitle>
                    </CardHeader>
                    <CardContent className="pt-0 text-sm text-gray-600">
                      Based on presence in Top {sovRows.topN} across geo grid points.
                    </CardContent>
                  </Card>
                </div>

                {sovRows.rows.length === 0 ? (
                  <div className="rounded-xl border bg-white p-4 text-sm text-gray-700">
                    Run a Geo Grid scan first, then select it above to compute share of voice.
                  </div>
                ) : (
                  <div className="overflow-hidden rounded-xl border bg-white">
                    <div className="grid grid-cols-12 bg-gray-50 px-4 py-2 text-xs font-semibold text-gray-600">
                      <div className="col-span-5">Business</div>
                      <div className="col-span-2">SoV %</div>
                      <div className="col-span-2">Avg rank</div>
                      <div className="col-span-3">Rating</div>
                    </div>
                    <div className="divide-y">
                      {sovRows.rows.slice(0, 25).map((r: any) => (
                        <div key={r.title} className="grid grid-cols-12 items-center px-4 py-3 text-sm">
                          <div className="col-span-5">
                            <div className="font-medium text-gray-900">{r.title}</div>
                            <div className="mt-1 h-2 w-full rounded-full bg-gray-100 overflow-hidden">
                              <div className="h-full bg-blue-600" style={{ width: `${Math.min(100, r.share)}%` }} />
                            </div>
                          </div>
                          <div className="col-span-2 font-semibold text-gray-900">{r.share}</div>
                          <div className="col-span-2 text-gray-900">{r.avgRank ?? '—'}</div>
                          <div className="col-span-3 text-gray-700">
                            {r.rating != null ? `${r.rating}★` : '—'}{r.reviews != null ? ` • ${r.reviews} reviews` : ''}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {activeTab === 'market_research' && (
          <Card>
            <CardHeader>
              <CardTitle>Market research</CardTitle>
              <CardDescription>Discover keywords and add them to tracking (requires rank provider).</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid gap-4 lg:grid-cols-2">
                  <div className="rounded-xl border bg-white p-4">
                    <div className="font-semibold text-gray-900 mb-3">Keyword ideas (DataForSEO)</div>
                    <div className="space-y-3">
                      <div>
                        <Label>Seed keywords (one per line)</Label>
                        <Textarea className="mt-2" rows={4} value={marketForm.seeds} onChange={(e) => setMarketForm((p) => ({ ...p, seeds: e.target.value }))} placeholder="car garage\ncar repair\n..." />
                      </div>
                      <div>
                        <Label>Location code</Label>
                        <Input className="mt-2" value={marketForm.locationCode} onChange={(e) => setMarketForm((p) => ({ ...p, locationCode: e.target.value }))} />
                        <div className="mt-1 text-xs text-gray-500">
                          DataForSEO uses numeric location codes (example shown is India = 2438; change as needed).
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button onClick={runMarketResearch} disabled={marketLoading}>
                          {marketLoading ? 'Searching…' : 'Search'}
                        </Button>
                        <Button variant="outline" onClick={() => setActiveTab('keyword_position')}>
                          Go to keyword tracking
                        </Button>
                      </div>
                    </div>
                  </div>

                  <div className="rounded-xl border bg-white p-4">
                    <div className="font-semibold text-gray-900 mb-3">Add-to-tracking defaults</div>
                    <div className="space-y-3 text-sm text-gray-700">
                      <div>
                        Selected target location: <span className="font-medium">{rankKeywordForm.gmbLocationId ? 'Selected' : 'None'}</span>
                      </div>
                      <div>
                        Provider location name: <span className="font-mono">{rankKeywordForm.locationName}</span>
                      </div>
                      <div>
                        Language: <span className="font-mono">{rankKeywordForm.languageCode}</span>
                      </div>
                      <div className="text-xs text-gray-500">
                        Set these in Keyword Position tab before adding many keywords.
                      </div>
                    </div>
                  </div>
                </div>

                <div className="rounded-xl border bg-white">
                  <div className="flex items-center justify-between px-4 py-3 border-b">
                    <div>
                      <div className="font-semibold text-gray-900">Results</div>
                      <div className="text-xs text-gray-500">{marketResults.length} keywords</div>
                    </div>
                  </div>

                  {marketResults.length === 0 ? (
                    <div className="px-4 py-8 text-sm text-gray-600">No results yet. Run a search.</div>
                  ) : (
                    <div className="overflow-auto">
                      <div className="grid grid-cols-12 bg-gray-50 px-4 py-2 text-xs font-semibold text-gray-600 min-w-[900px]">
                        <div className="col-span-5">Keyword</div>
                        <div className="col-span-2">Volume</div>
                        <div className="col-span-2">Competition</div>
                        <div className="col-span-1">CPC</div>
                        <div className="col-span-2 text-right">Actions</div>
                      </div>
                      <div className="divide-y min-w-[900px]">
                        {marketResults.slice(0, 200).map((it: any, idx: number) => (
                          <div key={`${it.keyword}-${idx}`} className="grid grid-cols-12 items-center px-4 py-3 text-sm">
                            <div className="col-span-5 font-medium text-gray-900">{it.keyword}</div>
                            <div className="col-span-2 text-gray-700">{it.search_volume ?? '—'}</div>
                            <div className="col-span-2 text-gray-700">{it.competition ?? '—'}</div>
                            <div className="col-span-1 text-gray-700">{it.cpc ?? '—'}</div>
                            <div className="col-span-2 text-right">
                              <Button size="sm" onClick={() => addKeywordFromResearch(it.keyword)}>
                                Add
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
