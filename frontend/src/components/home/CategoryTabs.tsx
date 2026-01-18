"use client";

import React, { useRef, useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import {
  Flame,
  Music,
  Gamepad2,
  GraduationCap,
  Dumbbell,
  Utensils,
  Film,
  Newspaper,
  Code2,
  Palette,
  Camera,
  Compass,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

const categories = [
  { id: "all", label: "All", icon: Compass },
  { id: "trending", label: "Trending", icon: Flame },
  { id: "music", label: "Music", icon: Music },
  { id: "gaming", label: "Gaming", icon: Gamepad2 },
  { id: "education", label: "Education", icon: GraduationCap },
  { id: "fitness", label: "Fitness", icon: Dumbbell },
  { id: "cooking", label: "Cooking", icon: Utensils },
  { id: "movies", label: "Movies", icon: Film },
  { id: "news", label: "News", icon: Newspaper },
  { id: "programming", label: "Coding", icon: Code2 },
  { id: "art", label: "Art & Design", icon: Palette },
  { id: "photography", label: "Photography", icon: Camera },
];

interface CategoryTabsProps {
  activeCategory: string;
  onCategoryChange: (category: string) => void;
  className?: string;
}

export function CategoryTabs({
  activeCategory,
  onCategoryChange,
  className,
}: CategoryTabsProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(true);

  const updateArrows = () => {
    if (!scrollContainerRef.current) return;
    const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current;
    setShowLeftArrow(scrollLeft > 0);
    setShowRightArrow(scrollLeft < scrollWidth - clientWidth - 10);
  };

  useEffect(() => {
    const container = scrollContainerRef.current;
    if (container) {
      container.addEventListener("scroll", updateArrows);
      updateArrows();
      return () => container.removeEventListener("scroll", updateArrows);
    }
  }, []);

  const scroll = (direction: "left" | "right") => {
    if (!scrollContainerRef.current) return;
    const scrollAmount = 200;
    scrollContainerRef.current.scrollBy({
      left: direction === "left" ? -scrollAmount : scrollAmount,
      behavior: "smooth",
    });
  };

  return (
    <div className={cn("relative group", className)}>
      {/* Left Arrow */}
      {showLeftArrow && (
        <div className="absolute left-0 top-0 bottom-0 z-10 flex items-center">
          <div className="absolute left-0 h-full w-16 bg-gradient-to-r from-background to-transparent pointer-events-none" />
          <Button
            variant="ghost"
            size="icon"
            className="relative h-9 w-9 rounded-full bg-background shadow-md border hover:bg-muted"
            onClick={() => scroll("left")}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
        </div>
      )}

      {/* Categories */}
      <div
        ref={scrollContainerRef}
        className="flex gap-2 overflow-x-auto scrollbar-hide px-1 py-1"
        style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
      >
        {categories.map((category) => {
          const Icon = category.icon;
          const isActive = activeCategory === category.id;

          return (
            <Button
              key={category.id}
              variant={isActive ? "default" : "secondary"}
              size="sm"
              className={cn(
                "shrink-0 gap-1.5 transition-all duration-200",
                isActive
                  ? "bg-primary text-primary-foreground shadow-md"
                  : "bg-muted/50 hover:bg-muted text-foreground"
              )}
              onClick={() => onCategoryChange(category.id)}
            >
              <Icon className="w-4 h-4" />
              <span className="text-sm">{category.label}</span>
            </Button>
          );
        })}
      </div>

      {/* Right Arrow */}
      {showRightArrow && (
        <div className="absolute right-0 top-0 bottom-0 z-10 flex items-center">
          <div className="absolute right-0 h-full w-16 bg-gradient-to-l from-background to-transparent pointer-events-none" />
          <Button
            variant="ghost"
            size="icon"
            className="relative h-9 w-9 rounded-full bg-background shadow-md border hover:bg-muted"
            onClick={() => scroll("right")}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  );
}

export default CategoryTabs;
