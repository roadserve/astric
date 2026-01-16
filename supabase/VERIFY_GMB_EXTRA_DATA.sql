-- GMB extra data verification checks

-- 1) Locations: extra fields coverage
select
  count(*) as total_locations,
  count(*) filter (where special_hours is not null) as with_special_hours,
  count(*) filter (where service_area is not null) as with_service_area,
  count(*) filter (where open_info is not null) as with_open_info,
  count(*) filter (where labels is not null) as with_labels,
  count(*) filter (where more_hours is not null) as with_more_hours
from public.gmb_locations;

-- 2) Attributes + categories normalized
select
  (select count(*) from public.gmb_location_attributes) as attributes_rows,
  (select count(*) from public.gmb_location_categories) as categories_rows;

-- 3) Posts: raw + google name + publications
select
  count(*) as posts_total,
  count(*) filter (where raw_post is not null) as posts_with_raw,
  count(*) filter (where google_post_name is not null) as posts_with_google_name
from public.gmb_posts;

select
  count(*) as publications_total,
  count(*) filter (where status = 'published') as published_total,
  count(*) filter (where status = 'failed') as failed_total
from public.gmb_post_publications;

select
  count(*) as templates_total,
  count(*) filter (where is_active) as templates_active
from public.gmb_post_templates;

-- 4) Insights + fetch logs + keywords
select
  count(*) as insights_rows,
  max(date) as latest_insight_date
from public.gmb_insights;

select
  count(*) as fetch_logs,
  max(fetched_at) as latest_fetch_log
from public.gmb_insights_fetches;

select
  count(*) as search_keywords_rows,
  max(month) as latest_keyword_month
from public.gmb_search_keywords_monthly;

-- 5) Freshness summary
select
  max(last_synced_at) as locations_last_synced_at
from public.gmb_locations;

select
  max(review_date) as reviews_last_date
from public.gmb_reviews;

select
  max(created_at) as media_assets_last_date
from public.gmb_media_assets;

select
  max(created_at) as posts_last_date
from public.gmb_posts;

select
  max(created_at) as post_publications_last_date
from public.gmb_post_publications;

select
  max(created_at) as qna_last_date
from public.gmb_qna_requests;

-- 6) Missing-field distribution
select
  count(*) filter (where phone is null or trim(phone) = '') as missing_phone,
  count(*) filter (where website is null or trim(website) = '') as missing_website,
  count(*) filter (where description is null or trim(description) = '') as missing_description,
  count(*) filter (where hours is null) as missing_hours,
  count(*) filter (where special_hours is null) as missing_special_hours,
  count(*) filter (where service_area is null) as missing_service_area,
  count(*) filter (where open_info is null) as missing_open_info,
  count(*) filter (where logo_url is null or trim(logo_url) = '') as missing_logo,
  count(*) filter (where cover_photo_url is null or trim(cover_photo_url) = '') as missing_cover
from public.gmb_locations;
