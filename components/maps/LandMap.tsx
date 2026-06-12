"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { MapPin } from "lucide-react";
import { ListingCard } from "@/components/listings/ListingCard";
import { EmptyState } from "@/components/shared/EmptyState";
import { MapFiltersPanel } from "@/components/maps/MapFilters";
import type { MapFilters, MapListing } from "@/lib/listings";
import { listingPriceLabel, statusLabel } from "@/lib/listings";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  DEFAULT_ZOOM,
  MAP_STYLE,
  SW_SYDNEY_BOUNDS,
  SW_SYDNEY_CENTER,
} from "@/lib/map/config";
import type { ListingStatus } from "@/lib/types";

const STATUS_MARKER_COLORS: Record<ListingStatus, string> = {
  available: "bg-[#5aa84a]",
  under_offer: "bg-[#dba94e] text-[#13314c]",
  sold: "bg-[#e05b3a]",
};

function hasValidCoords(listing: MapListing): boolean {
  return (
    Number.isFinite(listing.latitude) &&
    Number.isFinite(listing.longitude) &&
    !(listing.latitude === 0 && listing.longitude === 0)
  );
}

function buildQuery(filters: MapFilters): string {
  const params = new URLSearchParams({
    status: filters.status ?? "available",
  });
  if (filters.suburb) params.set("suburb", filters.suburb);
  if (filters.priceMin != null) params.set("priceMin", String(filters.priceMin));
  if (filters.priceMax != null) params.set("priceMax", String(filters.priceMax));
  if (filters.sizeMin != null) params.set("sizeMin", String(filters.sizeMin));
  if (filters.sizeMax != null) params.set("sizeMax", String(filters.sizeMax));
  return params.toString();
}

function hasActiveFilters(filters: MapFilters): boolean {
  return Boolean(
    filters.suburb ||
      filters.priceMin != null ||
      filters.priceMax != null ||
      filters.sizeMin != null ||
      filters.sizeMax != null
  );
}

function markerLabel(listing: MapListing): string {
  if (listing.price > 0) {
    return `$${Math.round(listing.price / 1000)}k`;
  }
  const label = listingPriceLabel(listing);
  if (label.length <= 12) return label;
  return "Land";
}

function MapListingItem({
  listing,
  selected,
  onSelect,
}: {
  listing: MapListing;
  selected: boolean;
  onSelect: (listing: MapListing) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onSelect(listing)}
      className={cn(
        "w-full rounded-xl px-3 py-3 text-left transition-colors",
        selected
          ? "bg-primary text-primary-foreground"
          : "hover:bg-muted/80"
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="truncate text-sm font-medium">{listing.address}</p>
          <p
            className={cn(
              "text-xs",
              selected ? "text-primary-foreground/75" : "text-muted-foreground"
            )}
          >
            {listing.suburb} · {listing.land_size_sqm} m²
          </p>
        </div>
        <span
          className={cn(
            "shrink-0 text-sm font-semibold",
            selected ? "text-primary-foreground" : "text-foreground"
          )}
        >
          {listingPriceLabel(listing)}
        </span>
      </div>
    </button>
  );
}

export function LandMap() {
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const markersRef = useRef<maplibregl.Marker[]>([]);
  const [filters, setFilters] = useState<MapFilters>({ status: "available" });
  const [listings, setListings] = useState<MapListing[]>([]);
  const [selected, setSelected] = useState<MapListing | null>(null);
  const [loading, setLoading] = useState(true);
  const [mapError, setMapError] = useState<string | null>(null);
  const [mapReady, setMapReady] = useState(false);

  const clearMarkers = useCallback(() => {
    markersRef.current.forEach((marker) => marker.remove());
    markersRef.current = [];
  }, []);

  const selectListing = useCallback((listing: MapListing) => {
    setSelected(listing);
    if (mapRef.current) {
      mapRef.current.flyTo({
        center: [listing.longitude, listing.latitude],
        zoom: 14,
        essential: true,
      });
    }
  }, []);

  const renderMarkers = useCallback(
    (map: maplibregl.Map, data: MapListing[]) => {
      clearMarkers();

      const mappable = data.filter(hasValidCoords);

      mappable.forEach((listing) => {
        const el = document.createElement("button");
        el.type = "button";
        el.className = `rounded-full px-3 py-1.5 text-xs font-semibold text-white shadow-[0_2px_8px_rgba(19,49,76,0.2)] ${STATUS_MARKER_COLORS[listing.status]}`;
        el.textContent = markerLabel(listing);
        el.setAttribute("aria-label", `${listing.address}, ${listing.suburb}`);

        el.addEventListener("click", (e) => {
          e.stopPropagation();
          selectListing(listing);
        });

        const marker = new maplibregl.Marker({ element: el })
          .setLngLat([listing.longitude, listing.latitude])
          .addTo(map);

        markersRef.current.push(marker);
      });

      if (mappable.length === 1) {
        map.flyTo({
          center: [mappable[0].longitude, mappable[0].latitude],
          zoom: 14,
          essential: true,
        });
      } else if (mappable.length > 1) {
        const bounds = new maplibregl.LngLatBounds();
        mappable.forEach((listing) => {
          bounds.extend([listing.longitude, listing.latitude]);
        });
        map.fitBounds(bounds, { padding: 72, maxZoom: 14, duration: 800 });
      }
    },
    [clearMarkers, selectListing]
  );

  const loadListings = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/listings?${buildQuery(filters)}`);
      const data = await res.json();

      if (!res.ok) {
        const message = data.error ?? "Failed to load listings";
        if (message.includes("get_listings_for_map")) {
          setMapError(
            "Database migration missing — run 007_listing_rpc.sql and 008_domain_sync.sql in Supabase SQL Editor."
          );
        } else {
          setMapError(message);
        }
        setListings([]);
        return;
      }

      setMapError(null);
      setListings(Array.isArray(data) ? data : []);
    } catch {
      setMapError("Could not reach the listings API.");
      setListings([]);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    loadListings();
  }, [loadListings]);

  useEffect(() => {
    if (!mapContainer.current || mapRef.current) return;

    const map = new maplibregl.Map({
      container: mapContainer.current,
      style: MAP_STYLE,
      center: SW_SYDNEY_CENTER,
      zoom: DEFAULT_ZOOM,
      maxBounds: SW_SYDNEY_BOUNDS,
    });

    map.addControl(new maplibregl.NavigationControl(), "top-right");

    map.on("load", () => {
      setMapReady(true);
      map.resize();
    });

    map.on("error", (e) => {
      setMapError(
        e.error?.message ?? "Map tiles failed to load. Check your network connection."
      );
    });

    map.on("click", () => setSelected(null));

    mapRef.current = map;

    return () => {
      clearMarkers();
      map.remove();
      mapRef.current = null;
      setMapReady(false);
    };
  }, [clearMarkers]);

  useEffect(() => {
    if (mapRef.current && mapReady) {
      renderMarkers(mapRef.current, listings);
    }
  }, [listings, mapReady, renderMarkers]);

  const showEmptyState = !loading && !mapError && listings.length === 0;
  const missingCoords =
    !loading &&
    listings.length > 0 &&
    listings.every((listing) => !hasValidCoords(listing));
  const status = filters.status ?? "available";

  return (
    <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
      <div className="space-y-4">
        <MapFiltersPanel
          filters={filters}
          onChange={setFilters}
          resultCount={listings.length}
          onClear={() => setFilters({ status })}
        />

        <div className="surface-subtle overflow-hidden">
          <div className="flex items-center justify-between border-b border-black/[0.06] px-4 py-3">
            <p className="label-caps">Listings</p>
            {!loading && (
              <Badge variant="outline" className="rounded-full text-xs">
                {statusLabel(status)}
              </Badge>
            )}
          </div>

          {loading && (
            <p className="px-4 py-8 text-center text-sm text-muted-foreground">
              Loading listings…
            </p>
          )}

          {!loading && listings.length > 0 && (
            <div className="max-h-[320px] space-y-1 overflow-y-auto p-2 lg:max-h-[400px]">
              {listings.map((listing) => (
                <MapListingItem
                  key={listing.id}
                  listing={listing}
                  selected={selected?.id === listing.id}
                  onSelect={selectListing}
                />
              ))}
            </div>
          )}

          {showEmptyState && (
            <div className="px-4 py-6">
              <EmptyState
                className="py-8"
                icon={<MapPin className="h-5 w-5" strokeWidth={1.5} />}
                title={`No ${status === "under_offer" ? "under contract" : status} listings`}
                description={
                  hasActiveFilters(filters)
                    ? "Try adjusting your filters or reset to see all listings."
                    : "Listings appear here once synced from Domain or demo seed data."
                }
                hint={
                  !hasActiveFilters(filters)
                    ? "Demo: run 010_demo_seed.sql for 3 lots in Ingleburn, Campbelltown, and Leumeah."
                    : undefined
                }
                action={
                  hasActiveFilters(filters) ? (
                    <button
                      type="button"
                      className="text-sm font-medium text-foreground underline-offset-4 hover:underline"
                      onClick={() => setFilters({ status })}
                    >
                      Reset filters
                    </button>
                  ) : undefined
                }
              />
            </div>
          )}
        </div>
      </div>

      <div className="surface relative min-h-[420px] overflow-hidden sm:min-h-[520px] lg:min-h-[560px]">
        <div ref={mapContainer} className="absolute inset-0 h-full w-full" />

        {loading && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-background/70 backdrop-blur-sm">
            <p className="text-sm text-muted-foreground">Loading map…</p>
          </div>
        )}

        {mapError && (
          <div className="absolute inset-x-4 top-4 z-20 rounded-2xl bg-destructive/10 px-4 py-3 text-sm text-destructive">
            {mapError}
          </div>
        )}

        {missingCoords && (
          <div className="absolute inset-x-4 top-4 z-20 rounded-2xl border border-[#dba94e]/30 bg-[#dba94e]/10 px-4 py-3 text-sm text-[#13314c]">
            Listings loaded but map coordinates are missing. Re-save listings with
            a full address or re-run the demo seed in Supabase.
          </div>
        )}

        {selected && (
          <div className="absolute bottom-4 left-4 right-4 z-20 mx-auto max-w-sm">
            <ListingCard listing={selected} onClose={() => setSelected(null)} />
          </div>
        )}
      </div>
    </div>
  );
}
