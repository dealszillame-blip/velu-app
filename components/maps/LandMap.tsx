"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { ListingCard } from "@/components/listings/ListingCard";
import { MapFiltersPanel } from "@/components/maps/MapFilters";
import type { MapFilters, MapListing } from "@/lib/listings";
import { listingPriceLabel } from "@/lib/listings";
import {
  DEFAULT_ZOOM,
  MAP_STYLE,
  SW_SYDNEY_BOUNDS,
  SW_SYDNEY_CENTER,
} from "@/lib/map/config";
import type { ListingStatus } from "@/lib/types";

const STATUS_MARKER_COLORS: Record<ListingStatus, string> = {
  available: "bg-emerald-600",
  under_offer: "bg-amber-500",
  sold: "bg-slate-500",
};

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

  const renderMarkers = useCallback(
    (map: maplibregl.Map, data: MapListing[]) => {
      clearMarkers();

      data.forEach((listing) => {
        const el = document.createElement("button");
        el.type = "button";
        el.className = `rounded-full border-2 border-white px-2 py-1 text-xs font-semibold text-white shadow-md ${STATUS_MARKER_COLORS[listing.status]}`;
        el.textContent = markerLabel(listing);
        el.setAttribute("aria-label", `${listing.address}, ${listing.suburb}`);

        el.addEventListener("click", (e) => {
          e.stopPropagation();
          setSelected(listing);
          map.flyTo({
            center: [listing.longitude, listing.latitude],
            zoom: 14,
            essential: true,
          });
        });

        const marker = new maplibregl.Marker({ element: el })
          .setLngLat([listing.longitude, listing.latitude])
          .addTo(map);

        markersRef.current.push(marker);
      });
    },
    [clearMarkers]
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
  const status = filters.status ?? "available";

  return (
    <div className="grid gap-4 lg:grid-cols-[280px_1fr]">
      <MapFiltersPanel
        filters={filters}
        onChange={setFilters}
        resultCount={listings.length}
        onClear={() => setFilters({ status })}
      />

      <div className="relative min-h-[480px] overflow-hidden rounded-lg border bg-muted/20">
        <div ref={mapContainer} className="absolute inset-0 h-full w-full" />

        {loading && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-background/60 text-sm">
            Loading listings…
          </div>
        )}

        {mapError && (
          <div className="absolute inset-x-4 top-4 z-20 rounded-md border border-destructive/30 bg-background p-3 text-sm text-destructive shadow-sm">
            {mapError}
          </div>
        )}

        {showEmptyState && (
          <div className="absolute inset-x-4 top-1/2 z-10 -translate-y-1/2 rounded-md border bg-background/95 p-4 text-center shadow-sm">
            <p className="font-medium">No {status === "under_offer" ? "under contract" : status} listings</p>
            <p className="mt-1 text-sm text-muted-foreground">
              {hasActiveFilters(filters)
                ? "Nothing matches your filters — try clearing them."
                : "Run a Domain sync to populate listings: npm run sync:domain"}
            </p>
            {hasActiveFilters(filters) && (
              <button
                type="button"
                className="mt-3 text-sm underline"
                onClick={() => setFilters({ status })}
              >
                Clear filters
              </button>
            )}
          </div>
        )}

        {selected && (
          <div className="absolute bottom-4 left-4 right-4 z-20 max-w-sm">
            <ListingCard listing={selected} onClose={() => setSelected(null)} />
          </div>
        )}
      </div>
    </div>
  );
}
