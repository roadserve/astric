-- Google My Business (GMB) Integration
-- Allows organizations to connect and manage multiple GMB profiles

-- GMB accounts table (Google Business Profile accounts)
CREATE TABLE gmb_accounts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    account_name TEXT NOT NULL,
    account_id TEXT NOT NULL, -- Google account ID
    access_token TEXT, -- Encrypted access token
    refresh_token TEXT, -- Encrypted refresh token
    token_expires_at TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT true,
    last_synced_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(organization_id, account_id)
);

-- GMB locations/profiles table
CREATE TABLE gmb_locations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    gmb_account_id UUID NOT NULL REFERENCES gmb_accounts(id) ON DELETE CASCADE,
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    location_name TEXT NOT NULL,
    location_id TEXT NOT NULL, -- Google location ID
    store_code TEXT,
    address JSONB,
    phone TEXT,
    website TEXT,
    category TEXT,
    description TEXT,
    hours JSONB, -- Business hours
    attributes JSONB, -- Business attributes
    photos JSONB, -- Photo URLs
    is_verified BOOLEAN DEFAULT false,
    is_published BOOLEAN DEFAULT false,
    last_synced_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(gmb_account_id, location_id)
);

-- GMB bulk update queue
CREATE TABLE gmb_bulk_updates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    update_type TEXT NOT NULL, -- description, hours, photos, attributes, etc.
    update_data JSONB NOT NULL,
    target_locations UUID[], -- Array of gmb_location IDs to update
    status TEXT DEFAULT 'pending', -- pending, processing, completed, failed
    total_locations INTEGER DEFAULT 0,
    successful_updates INTEGER DEFAULT 0,
    failed_updates INTEGER DEFAULT 0,
    error_details JSONB,
    created_by UUID NOT NULL REFERENCES profiles(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE
);

-- GMB posts table (for managing posts across locations)
CREATE TABLE gmb_posts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    title TEXT,
    content TEXT NOT NULL,
    call_to_action TEXT, -- LEARN_MORE, CALL, BOOK, ORDER, etc.
    action_url TEXT,
    media_urls TEXT[],
    post_type TEXT DEFAULT 'STANDARD', -- STANDARD, EVENT, OFFER, PRODUCT
    event_details JSONB, -- For event posts
    offer_details JSONB, -- For offer posts
    target_locations UUID[], -- Array of gmb_location IDs
    status TEXT DEFAULT 'draft', -- draft, scheduled, published, failed
    scheduled_at TIMESTAMP WITH TIME ZONE,
    published_at TIMESTAMP WITH TIME ZONE,
    created_by UUID NOT NULL REFERENCES profiles(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- GMB reviews table (sync reviews from all locations)
CREATE TABLE gmb_reviews (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    gmb_location_id UUID NOT NULL REFERENCES gmb_locations(id) ON DELETE CASCADE,
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    review_id TEXT NOT NULL, -- Google review ID
    reviewer_name TEXT,
    reviewer_photo_url TEXT,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    review_reply TEXT,
    review_date TIMESTAMP WITH TIME ZONE NOT NULL,
    reply_date TIMESTAMP WITH TIME ZONE,
    is_replied BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(gmb_location_id, review_id)
);

-- GMB insights table (analytics data)
CREATE TABLE gmb_insights (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    gmb_location_id UUID NOT NULL REFERENCES gmb_locations(id) ON DELETE CASCADE,
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    metric_type TEXT NOT NULL, -- QUERIES_DIRECT, QUERIES_INDIRECT, VIEWS_MAPS, VIEWS_SEARCH, etc.
    metric_value INTEGER NOT NULL,
    date DATE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(gmb_location_id, metric_type, date)
);

-- Create indexes
CREATE INDEX idx_gmb_accounts_org_id ON gmb_accounts(organization_id);
CREATE INDEX idx_gmb_accounts_active ON gmb_accounts(organization_id, is_active);
CREATE INDEX idx_gmb_locations_account_id ON gmb_locations(gmb_account_id);
CREATE INDEX idx_gmb_locations_org_id ON gmb_locations(organization_id);
CREATE INDEX idx_gmb_bulk_updates_org_id ON gmb_bulk_updates(organization_id);
CREATE INDEX idx_gmb_bulk_updates_status ON gmb_bulk_updates(organization_id, status);
CREATE INDEX idx_gmb_posts_org_id ON gmb_posts(organization_id);
CREATE INDEX idx_gmb_posts_status ON gmb_posts(organization_id, status);
CREATE INDEX idx_gmb_reviews_location_id ON gmb_reviews(gmb_location_id);
CREATE INDEX idx_gmb_reviews_org_id ON gmb_reviews(organization_id);
CREATE INDEX idx_gmb_reviews_replied ON gmb_reviews(organization_id, is_replied);
CREATE INDEX idx_gmb_insights_location_date ON gmb_insights(gmb_location_id, date);

-- Add updated_at triggers
CREATE TRIGGER update_gmb_accounts_updated_at BEFORE UPDATE ON gmb_accounts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_gmb_locations_updated_at BEFORE UPDATE ON gmb_locations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_gmb_posts_updated_at BEFORE UPDATE ON gmb_posts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_gmb_reviews_updated_at BEFORE UPDATE ON gmb_reviews FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable RLS
ALTER TABLE gmb_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE gmb_locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE gmb_bulk_updates ENABLE ROW LEVEL SECURITY;
ALTER TABLE gmb_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE gmb_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE gmb_insights ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view GMB accounts of their organizations" ON gmb_accounts
    FOR SELECT USING (is_organization_member(organization_id, auth.uid()));

CREATE POLICY "Users can manage GMB accounts of their organizations" ON gmb_accounts
    FOR ALL USING (is_organization_member(organization_id, auth.uid()));

CREATE POLICY "Users can view GMB locations of their organizations" ON gmb_locations
    FOR SELECT USING (is_organization_member(organization_id, auth.uid()));

CREATE POLICY "Users can manage GMB locations of their organizations" ON gmb_locations
    FOR ALL USING (is_organization_member(organization_id, auth.uid()));

CREATE POLICY "Users can view GMB bulk updates of their organizations" ON gmb_bulk_updates
    FOR SELECT USING (is_organization_member(organization_id, auth.uid()));

CREATE POLICY "Users can manage GMB bulk updates of their organizations" ON gmb_bulk_updates
    FOR ALL USING (is_organization_member(organization_id, auth.uid()));

CREATE POLICY "Users can view GMB posts of their organizations" ON gmb_posts
    FOR SELECT USING (is_organization_member(organization_id, auth.uid()));

CREATE POLICY "Users can manage GMB posts of their organizations" ON gmb_posts
    FOR ALL USING (is_organization_member(organization_id, auth.uid()));

CREATE POLICY "Users can view GMB reviews of their organizations" ON gmb_reviews
    FOR SELECT USING (is_organization_member(organization_id, auth.uid()));

CREATE POLICY "Users can manage GMB reviews of their organizations" ON gmb_reviews
    FOR ALL USING (is_organization_member(organization_id, auth.uid()));

CREATE POLICY "Users can view GMB insights of their organizations" ON gmb_insights
    FOR SELECT USING (is_organization_member(organization_id, auth.uid()));
