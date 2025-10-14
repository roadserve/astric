-- Social Media Management Tables
-- Supports Facebook, Instagram, TikTok, Snapchat, Twitter/X, LinkedIn, YouTube

-- Social Media Accounts Table
CREATE TABLE IF NOT EXISTS social_media_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  platform TEXT NOT NULL CHECK (platform IN ('facebook', 'instagram', 'tiktok', 'snapchat', 'twitter', 'linkedin', 'youtube')),
  account_name TEXT NOT NULL,
  account_id TEXT NOT NULL, -- Platform-specific account ID
  access_token TEXT, -- Encrypted access token
  refresh_token TEXT, -- Encrypted refresh token
  token_expires_at TIMESTAMPTZ,
  profile_picture_url TEXT,
  followers_count INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  metadata JSONB DEFAULT '{}', -- Platform-specific data
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES profiles(id),
  UNIQUE(organization_id, platform, account_id)
);

-- Social Media Posts Table
CREATE TABLE IF NOT EXISTS social_media_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  account_id UUID REFERENCES social_media_accounts(id) ON DELETE CASCADE,
  platform TEXT NOT NULL,
  post_type TEXT CHECK (post_type IN ('text', 'image', 'video', 'carousel', 'story', 'reel')),
  content TEXT NOT NULL,
  media_urls TEXT[], -- Array of media URLs
  scheduled_time TIMESTAMPTZ,
  published_time TIMESTAMPTZ,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'scheduled', 'published', 'failed')),
  post_id TEXT, -- Platform-specific post ID
  engagement JSONB DEFAULT '{"likes": 0, "comments": 0, "shares": 0, "views": 0}',
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES profiles(id)
);

-- Social Media Ads Table
CREATE TABLE IF NOT EXISTS social_media_ads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  account_id UUID REFERENCES social_media_accounts(id) ON DELETE CASCADE,
  platform TEXT NOT NULL,
  campaign_name TEXT NOT NULL,
  ad_type TEXT CHECK (ad_type IN ('image', 'video', 'carousel', 'story', 'collection')),
  objective TEXT CHECK (objective IN ('awareness', 'traffic', 'engagement', 'leads', 'sales', 'app_installs')),
  content TEXT,
  media_urls TEXT[],
  target_audience JSONB DEFAULT '{}', -- Age, gender, location, interests
  budget DECIMAL(10, 2),
  daily_budget DECIMAL(10, 2),
  start_date TIMESTAMPTZ,
  end_date TIMESTAMPTZ,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'paused', 'completed', 'failed')),
  ad_id TEXT, -- Platform-specific ad ID
  metrics JSONB DEFAULT '{"impressions": 0, "clicks": 0, "conversions": 0, "spend": 0}',
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES profiles(id)
);

-- Social Media Analytics Table
CREATE TABLE IF NOT EXISTS social_media_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  account_id UUID REFERENCES social_media_accounts(id) ON DELETE CASCADE,
  platform TEXT NOT NULL,
  date DATE NOT NULL,
  followers_count INTEGER DEFAULT 0,
  following_count INTEGER DEFAULT 0,
  posts_count INTEGER DEFAULT 0,
  engagement_rate DECIMAL(5, 2) DEFAULT 0,
  reach INTEGER DEFAULT 0,
  impressions INTEGER DEFAULT 0,
  profile_visits INTEGER DEFAULT 0,
  website_clicks INTEGER DEFAULT 0,
  metrics JSONB DEFAULT '{}', -- Platform-specific metrics
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(account_id, date)
);

-- Bulk Post Scheduler Table
CREATE TABLE IF NOT EXISTS social_media_bulk_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  content TEXT NOT NULL,
  media_urls TEXT[],
  platforms TEXT[] NOT NULL, -- Array of platforms to post to
  account_ids UUID[], -- Array of account IDs
  scheduled_time TIMESTAMPTZ,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'scheduled', 'publishing', 'completed', 'failed')),
  results JSONB DEFAULT '{}', -- Results per platform
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES profiles(id)
);

-- Social Media Insights Table
CREATE TABLE IF NOT EXISTS social_media_insights (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  account_id UUID REFERENCES social_media_accounts(id) ON DELETE CASCADE,
  post_id UUID REFERENCES social_media_posts(id) ON DELETE CASCADE,
  ad_id UUID REFERENCES social_media_ads(id) ON DELETE CASCADE,
  platform TEXT NOT NULL,
  insight_type TEXT CHECK (insight_type IN ('post_performance', 'ad_performance', 'audience', 'engagement')),
  data JSONB NOT NULL,
  recommendations TEXT[],
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_social_accounts_org ON social_media_accounts(organization_id);
CREATE INDEX IF NOT EXISTS idx_social_accounts_platform ON social_media_accounts(platform);
CREATE INDEX IF NOT EXISTS idx_social_posts_org ON social_media_posts(organization_id);
CREATE INDEX IF NOT EXISTS idx_social_posts_status ON social_media_posts(status);
CREATE INDEX IF NOT EXISTS idx_social_ads_org ON social_media_ads(organization_id);
CREATE INDEX IF NOT EXISTS idx_social_ads_status ON social_media_ads(status);
CREATE INDEX IF NOT EXISTS idx_social_analytics_account ON social_media_analytics(account_id, date);
CREATE INDEX IF NOT EXISTS idx_social_insights_account ON social_media_insights(account_id);

-- Enable Row Level Security
ALTER TABLE social_media_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE social_media_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE social_media_ads ENABLE ROW LEVEL SECURITY;
ALTER TABLE social_media_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE social_media_bulk_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE social_media_insights ENABLE ROW LEVEL SECURITY;

-- RLS Policies for social_media_accounts
CREATE POLICY "Users can view their org's social accounts"
  ON social_media_accounts FOR SELECT
  USING (organization_id IN (
    SELECT organization_id FROM profiles WHERE id = auth.uid()
  ));

CREATE POLICY "Users can insert social accounts for their org"
  ON social_media_accounts FOR INSERT
  WITH CHECK (organization_id IN (
    SELECT organization_id FROM profiles WHERE id = auth.uid()
  ));

CREATE POLICY "Users can update their org's social accounts"
  ON social_media_accounts FOR UPDATE
  USING (organization_id IN (
    SELECT organization_id FROM profiles WHERE id = auth.uid()
  ));

CREATE POLICY "Users can delete their org's social accounts"
  ON social_media_accounts FOR DELETE
  USING (organization_id IN (
    SELECT organization_id FROM profiles WHERE id = auth.uid()
  ));

-- RLS Policies for social_media_posts
CREATE POLICY "Users can view their org's posts"
  ON social_media_posts FOR SELECT
  USING (organization_id IN (
    SELECT organization_id FROM profiles WHERE id = auth.uid()
  ));

CREATE POLICY "Users can insert posts for their org"
  ON social_media_posts FOR INSERT
  WITH CHECK (organization_id IN (
    SELECT organization_id FROM profiles WHERE id = auth.uid()
  ));

CREATE POLICY "Users can update their org's posts"
  ON social_media_posts FOR UPDATE
  USING (organization_id IN (
    SELECT organization_id FROM profiles WHERE id = auth.uid()
  ));

CREATE POLICY "Users can delete their org's posts"
  ON social_media_posts FOR DELETE
  USING (organization_id IN (
    SELECT organization_id FROM profiles WHERE id = auth.uid()
  ));

-- RLS Policies for social_media_ads (similar pattern)
CREATE POLICY "Users can view their org's ads"
  ON social_media_ads FOR SELECT
  USING (organization_id IN (
    SELECT organization_id FROM profiles WHERE id = auth.uid()
  ));

CREATE POLICY "Users can manage their org's ads"
  ON social_media_ads FOR ALL
  USING (organization_id IN (
    SELECT organization_id FROM profiles WHERE id = auth.uid()
  ));

-- RLS Policies for analytics and insights
CREATE POLICY "Users can view their org's analytics"
  ON social_media_analytics FOR SELECT
  USING (organization_id IN (
    SELECT organization_id FROM profiles WHERE id = auth.uid()
  ));

CREATE POLICY "Users can view their org's insights"
  ON social_media_insights FOR SELECT
  USING (organization_id IN (
    SELECT organization_id FROM profiles WHERE id = auth.uid()
  ));

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_social_media_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER update_social_accounts_updated_at
  BEFORE UPDATE ON social_media_accounts
  FOR EACH ROW EXECUTE FUNCTION update_social_media_updated_at();

CREATE TRIGGER update_social_posts_updated_at
  BEFORE UPDATE ON social_media_posts
  FOR EACH ROW EXECUTE FUNCTION update_social_media_updated_at();

CREATE TRIGGER update_social_ads_updated_at
  BEFORE UPDATE ON social_media_ads
  FOR EACH ROW EXECUTE FUNCTION update_social_media_updated_at();

-- Function to calculate engagement rate
CREATE OR REPLACE FUNCTION calculate_engagement_rate(
  likes INTEGER,
  comments INTEGER,
  shares INTEGER,
  followers INTEGER
)
RETURNS DECIMAL AS $$
BEGIN
  IF followers = 0 THEN
    RETURN 0;
  END IF;
  RETURN ((likes + comments + shares)::DECIMAL / followers * 100);
END;
$$ LANGUAGE plpgsql;

COMMENT ON TABLE social_media_accounts IS 'Connected social media accounts for organizations';
COMMENT ON TABLE social_media_posts IS 'Social media posts across all platforms';
COMMENT ON TABLE social_media_ads IS 'Social media advertising campaigns';
COMMENT ON TABLE social_media_analytics IS 'Daily analytics data for social accounts';
COMMENT ON TABLE social_media_bulk_posts IS 'Bulk post scheduler for multiple platforms';
COMMENT ON TABLE social_media_insights IS 'AI-powered insights and recommendations';
