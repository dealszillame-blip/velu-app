-- Velu MVP — buyer-facing nearby builders for owned land

CREATE OR REPLACE FUNCTION public.get_public_builders_near_listing(p_listing_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM public.land_listings ll
    WHERE ll.id = p_listing_id
      AND ll.buyer_id = auth.uid()
      AND ll.source = 'buyer_owned'
  ) THEN
    RETURN '[]'::jsonb;
  END IF;

  RETURN COALESCE((
    SELECT jsonb_agg(builder_row ORDER BY (builder_row->>'distance_km')::numeric)
    FROM (
      SELECT jsonb_build_object(
        'id', p.id,
        'full_name', p.full_name,
        'company_name', p.company_name,
        'avatar_url', p.avatar_url,
        'headline', bp.headline,
        'google_rating', bp.google_rating,
        'google_review_count', bp.google_review_count,
        'anchor_address', bp.anchor_address,
        'service_radius_km', bp.service_radius_km,
        'profile_published', bp.profile_published,
        'distance_km', ROUND((ST_Distance(bp.anchor_geom, ll.geom) / 1000.0)::numeric, 1),
        'portfolio', COALESCE((
          SELECT jsonb_agg(
            jsonb_build_object(
              'id', recent.id,
              'title', recent.title,
              'location', recent.location,
              'completed_year', recent.completed_year,
              'image_url', recent.image_url
            )
          )
          FROM (
            SELECT pp.id, pp.title, pp.location, pp.completed_year, pp.image_url
            FROM public.builder_portfolio_projects pp
            WHERE pp.builder_id = p.id
            ORDER BY pp.sort_order, pp.created_at
            LIMIT 3
          ) recent
        ), '[]'::jsonb)
      ) AS builder_row
      FROM public.builder_profiles bp
      JOIN public.profiles p ON p.id = bp.id
      JOIN public.land_listings ll ON ll.id = p_listing_id
      WHERE bp.is_onboarded = TRUE
        AND bp.anchor_geom IS NOT NULL
        AND ST_DWithin(bp.anchor_geom, ll.geom, bp.service_radius_km * 1000)
    ) matched
  ), '[]'::jsonb);
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_public_builders_near_listing(UUID) TO authenticated;
