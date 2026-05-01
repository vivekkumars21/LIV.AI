"use client";

import React, { useState } from "react";
import { ChevronLeft, ChevronRight, Box } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { FurnitureItem } from "@/lib/three-scene";

interface FurnitureSidebarProps {
  isOpen: boolean;
  onToggle: () => void;
  onSelectItem: (item: FurnitureItem) => void;
  categories: string[];
  items: FurnitureItem[];
}

// Category config: color gradient + SVG icon
const CATEGORY_CONFIG: Record<string, {
  gradient: string;
  border: string;
  accent: string;
  icon: React.ReactNode;
}> = {
  Sofas: {
    gradient: "from-blue-600/25 to-blue-500/10",
    border: "border-blue-400/30",
    accent: "text-blue-300",
    icon: (
      <svg viewBox="0 0 48 32" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
        {/* Back */}
        <rect x="6" y="4" width="36" height="10" rx="2" fill="currentColor" opacity="0.6"/>
        {/* Seat */}
        <rect x="4" y="14" width="40" height="10" rx="2" fill="currentColor" opacity="0.9"/>
        {/* Arm left */}
        <rect x="2" y="10" width="5" height="14" rx="1.5" fill="currentColor" opacity="0.7"/>
        {/* Arm right */}
        <rect x="41" y="10" width="5" height="14" rx="1.5" fill="currentColor" opacity="0.7"/>
        {/* Legs */}
        <rect x="8" y="24" width="3" height="5" rx="1" fill="currentColor" opacity="0.5"/>
        <rect x="37" y="24" width="3" height="5" rx="1" fill="currentColor" opacity="0.5"/>
      </svg>
    ),
  },
  Chairs: {
    gradient: "from-orange-600/25 to-orange-500/10",
    border: "border-orange-400/30",
    accent: "text-orange-300",
    icon: (
      <svg viewBox="0 0 32 40" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
        {/* Seat */}
        <rect x="4" y="16" width="24" height="6" rx="2" fill="currentColor" opacity="0.9"/>
        {/* Back */}
        <rect x="6" y="4" width="20" height="13" rx="2" fill="currentColor" opacity="0.6"/>
        {/* Legs */}
        <rect x="6" y="22" width="3" height="14" rx="1" fill="currentColor" opacity="0.5"/>
        <rect x="23" y="22" width="3" height="14" rx="1" fill="currentColor" opacity="0.5"/>
      </svg>
    ),
  },
  Tables: {
    gradient: "from-amber-600/25 to-amber-500/10",
    border: "border-amber-400/30",
    accent: "text-amber-300",
    icon: (
      <svg viewBox="0 0 52 36" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
        {/* Top */}
        <rect x="2" y="10" width="48" height="5" rx="2" fill="currentColor" opacity="0.9"/>
        {/* Legs */}
        <rect x="8" y="15" width="3" height="18" rx="1" fill="currentColor" opacity="0.5"/>
        <rect x="41" y="15" width="3" height="18" rx="1" fill="currentColor" opacity="0.5"/>
      </svg>
    ),
  },
  Beds: {
    gradient: "from-purple-600/25 to-purple-500/10",
    border: "border-purple-400/30",
    accent: "text-purple-300",
    icon: (
      <svg viewBox="0 0 56 36" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
        {/* Headboard */}
        <rect x="2" y="2" width="8" height="28" rx="2" fill="currentColor" opacity="0.6"/>
        {/* Frame */}
        <rect x="10" y="14" width="44" height="16" rx="2" fill="currentColor" opacity="0.4"/>
        {/* Mattress */}
        <rect x="10" y="10" width="44" height="14" rx="2" fill="currentColor" opacity="0.8"/>
        {/* Pillow */}
        <rect x="14" y="12" width="12" height="8" rx="2" fill="currentColor" opacity="0.4"/>
        <rect x="30" y="12" width="12" height="8" rx="2" fill="currentColor" opacity="0.4"/>
      </svg>
    ),
  },
  Lamps: {
    gradient: "from-yellow-500/25 to-yellow-400/10",
    border: "border-yellow-400/30",
    accent: "text-yellow-300",
    icon: (
      <svg viewBox="0 0 32 48" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
        {/* Shade */}
        <path d="M8 4 L4 18 L28 18 L24 4 Z" fill="currentColor" opacity="0.7"/>
        {/* Glow */}
        <ellipse cx="16" cy="18" rx="12" ry="3" fill="currentColor" opacity="0.3"/>
        {/* Pole */}
        <rect x="14.5" y="18" width="3" height="24" rx="1" fill="currentColor" opacity="0.5"/>
        {/* Base */}
        <ellipse cx="16" cy="43" rx="8" ry="3" fill="currentColor" opacity="0.6"/>
      </svg>
    ),
  },
  Plants: {
    gradient: "from-green-600/25 to-green-500/10",
    border: "border-green-400/30",
    accent: "text-green-300",
    icon: (
      <svg viewBox="0 0 36 48" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
        {/* Pot */}
        <path d="M10 34 L12 44 L24 44 L26 34 Z" fill="currentColor" opacity="0.6"/>
        <rect x="9" y="30" width="18" height="5" rx="1" fill="currentColor" opacity="0.5"/>
        {/* Stem */}
        <rect x="17" y="12" width="2" height="19" rx="1" fill="currentColor" opacity="0.4"/>
        {/* Leaves */}
        <ellipse cx="18" cy="10" rx="10" ry="12" fill="currentColor" opacity="0.8"/>
        <ellipse cx="10" cy="18" rx="7" ry="9" fill="currentColor" opacity="0.5"/>
        <ellipse cx="26" cy="16" rx="7" ry="9" fill="currentColor" opacity="0.5"/>
      </svg>
    ),
  },
  Cabinets: {
    gradient: "from-stone-600/25 to-stone-500/10",
    border: "border-stone-400/30",
    accent: "text-stone-300",
    icon: (
      <svg viewBox="0 0 42 48" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
        {/* Body */}
        <rect x="3" y="4" width="36" height="40" rx="2" fill="currentColor" opacity="0.5"/>
        {/* Doors */}
        <rect x="5" y="6" width="15" height="36" rx="1" fill="currentColor" opacity="0.3"/>
        <rect x="22" y="6" width="15" height="36" rx="1" fill="currentColor" opacity="0.3"/>
        {/* Handles */}
        <circle cx="19" cy="24" r="1.5" fill="currentColor" opacity="0.9"/>
        <circle cx="23" cy="24" r="1.5" fill="currentColor" opacity="0.9"/>
        {/* Mid divider */}
        <rect x="3" y="23" width="36" height="2" fill="currentColor" opacity="0.6"/>
      </svg>
    ),
  },
};

function formatDims(item: FurnitureItem) {
  const { width, depth, height } = item.dimensions;
  return `${width}×${depth}×${height}m`;
}

function formatPrice(price: number): string {
  return `₹${(price / 1000).toFixed(price >= 10000 ? 0 : 1)}K`;
}

export function FurnitureSidebar({
  isOpen,
  onToggle,
  onSelectItem,
  categories,
  items,
}: FurnitureSidebarProps) {
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const filteredItems = items.filter((item) => {
    const matchesCategory = !activeCategory || item.category === activeCategory;
    const matchesSearch =
      !searchQuery ||
      item.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <>
      {/* Toggle Button */}
      <button
        onClick={onToggle}
        className={`absolute left-0 top-1/2 z-30 -translate-y-1/2 rounded-r-2xl border border-l-0 border-white/20 bg-slate-950/70 p-2.5 text-white shadow-2xl backdrop-blur-3xl transition-all hover:bg-slate-800/80 ${
          isOpen ? "translate-x-[280px]" : "translate-x-0"
        }`}
      >
        {isOpen ? (
          <ChevronLeft className="h-5 w-5" />
        ) : (
          <ChevronRight className="h-5 w-5" />
        )}
      </button>

      {/* Sidebar */}
      <div
        className={`absolute left-0 top-0 z-20 flex h-full w-[280px] flex-col border-r border-white/10 bg-slate-950/70 backdrop-blur-3xl transition-transform duration-300 shadow-[20px_0_60px_rgba(0,0,0,0.5)] overflow-hidden ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Glass Sheen */}
        <div className="absolute inset-0 pointer-events-none bg-gradient-to-br from-white/5 to-transparent" />

        {/* Header */}
        <div className="relative border-b border-white/10 p-4 bg-white/5">
          <div className="flex items-center gap-2 mb-1">
            <Box className="h-4 w-4 text-white/50" />
            <h2 className="text-xs font-black uppercase tracking-[0.25em] text-white/80">
              3D Model Catalog
            </h2>
          </div>
          <p className="text-[10px] text-white/30 tracking-wide">
            Procedural models · Click to place
          </p>

          {/* Search */}
          <div className="relative mt-3">
            <input
              type="text"
              placeholder="Search furniture..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-xl border border-white/15 bg-black/30 py-2 px-4 text-sm text-white placeholder-white/30 focus:border-white/40 focus:outline-none backdrop-blur-md transition-all"
            />
          </div>
        </div>

        {/* Category Pills */}
        <div className="relative flex flex-wrap gap-1.5 border-b border-white/10 p-3">
          <button
            onClick={() => setActiveCategory(null)}
            className={`rounded-xl px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider transition-all ${
              !activeCategory
                ? "bg-white text-black shadow-lg"
                : "bg-white/10 text-white/60 hover:bg-white/20 hover:text-white"
            }`}
          >
            All
          </button>
          {categories.map((cat) => {
            const cfg = CATEGORY_CONFIG[cat];
            return (
              <button
                key={cat}
                onClick={() => setActiveCategory(activeCategory === cat ? null : cat)}
                className={`rounded-xl px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider transition-all ${
                  activeCategory === cat
                    ? "bg-white text-black shadow-lg"
                    : `bg-white/10 hover:bg-white/20 ${cfg?.accent ?? "text-white/60"} hover:text-white`
                }`}
              >
                {cat}
              </button>
            );
          })}
        </div>

        {/* Items List */}
        <ScrollArea className="relative flex-1">
          <div className="space-y-2 p-3">
            {filteredItems.map((item) => {
              const cfg = CATEGORY_CONFIG[item.category];
              return (
                <button
                  key={item.id}
                  onClick={() => onSelectItem(item)}
                  className={`group w-full rounded-2xl border bg-gradient-to-br p-0 text-left transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] overflow-hidden ${
                    cfg
                      ? `${cfg.gradient} ${cfg.border}`
                      : "from-white/5 to-transparent border-white/10"
                  }`}
                >
                  {/* Icon Panel */}
                  <div className="flex items-center gap-3 p-3 pb-2">
                    <div
                      className={`flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-xl border bg-black/30 p-2 transition-all group-hover:bg-black/50 ${
                        cfg?.border ?? "border-white/10"
                      } ${cfg?.accent ?? "text-white/50"}`}
                    >
                      {cfg?.icon ?? <Box className="h-6 w-6" />}
                    </div>

                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-semibold text-white/90 group-hover:text-white leading-tight truncate">
                        {item.name}
                      </h3>
                      <p className={`mt-0.5 text-[10px] font-medium tracking-wide ${cfg?.accent ?? "text-white/40"}`}>
                        {item.category}
                      </p>
                    </div>
                  </div>

                  {/* Details Row */}
                  <div className="flex items-center justify-between border-t border-white/5 px-3 py-2">
                    <span className="text-[10px] font-mono text-white/40 tracking-wide">
                      {formatDims(item)}
                    </span>
                    {item.price ? (
                      <span className="rounded-lg bg-black/30 px-2 py-0.5 text-[10px] font-bold text-white/70 border border-white/10">
                        {formatPrice(item.price)}
                      </span>
                    ) : (
                      <span className="rounded-lg bg-black/20 px-2 py-0.5 text-[10px] text-white/30 border border-white/5">
                        3D Model
                      </span>
                    )}
                  </div>
                </button>
              );
            })}

            {filteredItems.length === 0 && (
              <div className="py-10 text-center text-sm text-white/30">
                No items found
              </div>
            )}
          </div>
        </ScrollArea>

        {/* Footer */}
        <div className="relative border-t border-white/10 p-3 text-center">
          <p className="text-[10px] text-white/30 tracking-widest uppercase">
            {filteredItems.length} models · Click to place
          </p>
        </div>
      </div>
    </>
  );
}
