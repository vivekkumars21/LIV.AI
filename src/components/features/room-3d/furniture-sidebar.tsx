"use client";

import React, { useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Search,
  Sofa,
  Armchair,
  Table,
  BedDouble,
  Lamp,
  Flower2,
  BookOpen,
} from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { FurnitureItem } from "@/lib/three-scene";

interface FurnitureSidebarProps {
  isOpen: boolean;
  onToggle: () => void;
  onSelectItem: (item: FurnitureItem) => void;
  categories: string[];
  items: FurnitureItem[];
}

const CATEGORY_ICONS: Record<string, React.ReactNode> = {
  Sofas: <Sofa className="h-4 w-4" />,
  Chairs: <Armchair className="h-4 w-4" />,
  Tables: <Table className="h-4 w-4" />,
  Beds: <BedDouble className="h-4 w-4" />,
  Lamps: <Lamp className="h-4 w-4" />,
  Plants: <Flower2 className="h-4 w-4" />,
  Cabinets: <BookOpen className="h-4 w-4" />,
};

const CATEGORY_COLORS: Record<string, string> = {
  Sofas: "from-blue-500/20 to-blue-600/10 border-blue-500/30",
  Chairs: "from-orange-500/20 to-orange-600/10 border-orange-500/30",
  Tables: "from-amber-500/20 to-amber-600/10 border-amber-500/30",
  Beds: "from-purple-500/20 to-purple-600/10 border-purple-500/30",
  Lamps: "from-yellow-500/20 to-yellow-600/10 border-yellow-500/30",
  Plants: "from-green-500/20 to-green-600/10 border-green-500/30",
  Cabinets: "from-stone-500/20 to-stone-600/10 border-stone-500/30",
};

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
        className={`absolute left-0 top-1/2 z-30 -translate-y-1/2 rounded-r-2xl border border-l-0 border-white/20 bg-white/40 p-2 text-foreground shadow-lg backdrop-blur-md transition-all hover:bg-white/60 ${
          isOpen ? "translate-x-[280px]" : "translate-x-0"
        }`}
      >
        {isOpen ? (
          <ChevronLeft className="h-4 w-4" />
        ) : (
          <ChevronRight className="h-4 w-4" />
        )}
      </button>

      {/* Sidebar */}
      <div
        className={`absolute left-0 top-0 z-20 flex h-full w-[280px] flex-col border-r border-white/20 bg-white/90 backdrop-blur-md transition-transform duration-300 ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Header */}
        <div className="border-b border-white/20 p-4">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            Furniture Catalog
          </h2>

          {/* Search */}
          <div className="relative mt-3">
            <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground/50" />
            <input
              type="text"
              placeholder="Search furniture..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-xl border border-white/20 bg-white/50 py-2 pl-9 pr-3 text-sm text-foreground placeholder-muted-foreground/50 focus:border-primary/50 focus:outline-none backdrop-blur-sm"
            />
          </div>
        </div>

        {/* Categories */}
        <div className="flex flex-wrap gap-1.5 border-b border-white/20 p-3">
          <button
            onClick={() => setActiveCategory(null)}
            className={`rounded-xl px-2.5 py-1 text-xs font-medium transition-all ${
              !activeCategory
                ? "bg-primary text-primary-foreground shadow-sm"
                : "bg-white/50 text-muted-foreground hover:bg-white/80 hover:text-foreground"
            }`}
          >
            All
          </button>
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() =>
                setActiveCategory(activeCategory === cat ? null : cat)
              }
              className={`flex items-center gap-1 rounded-xl px-2.5 py-1 text-xs font-medium transition-all ${
                activeCategory === cat
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "bg-white/50 text-muted-foreground hover:bg-white/80 hover:text-foreground"
              }`}
            >
              {CATEGORY_ICONS[cat]}
              {cat}
            </button>
          ))}
        </div>

        {/* Items List */}
        <ScrollArea className="flex-1">
          <div className="space-y-2 p-3">
            {filteredItems.map((item) => (
              <button
                key={item.id}
                onClick={() => onSelectItem(item)}
                className={`group w-full rounded-2xl border bg-gradient-to-br p-3 text-left transition-all hover:scale-[1.02] hover:shadow-lg active:scale-[0.98] ${
                  CATEGORY_COLORS[item.category] ??
                  "from-white/40 to-white/20 border-white/30"
                }`}
              >
                {/* Item Preview */}
                <div className="mb-2 flex h-16 items-center justify-center rounded-lg bg-white/30 backdrop-blur-sm">
                  <div className="text-2xl opacity-60">
                    {CATEGORY_ICONS[item.category]}
                  </div>
                </div>

                <h3 className="text-sm font-medium text-foreground group-hover:text-primary">
                  {item.name}
                </h3>

                <div className="mt-1 flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">
                    {item.dimensions.width}×{item.dimensions.depth}×
                    {item.dimensions.height}m
                  </span>
                  {item.price && (
                    <span className="rounded-lg bg-white/50 px-1.5 py-0.5 text-xs font-medium text-primary backdrop-blur-sm">
                      {formatPrice(item.price)}
                    </span>
                  )}
                </div>

                {item.material && (
                  <span className="mt-1 block text-[10px] text-muted-foreground/60">
                    {item.material}
                  </span>
                )}
              </button>
            ))}

            {filteredItems.length === 0 && (
              <div className="py-8 text-center text-sm text-muted-foreground">
                No items found
              </div>
            )}
          </div>
        </ScrollArea>

        {/* Footer */}
        <div className="border-t border-white/20 p-3 text-center text-xs text-muted-foreground">
          Click an item to place it in the room
        </div>
      </div>
    </>
  );
}
