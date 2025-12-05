"use client";

import React from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface AnimatedBadgeProps {
  children: React.ReactNode;
  variant?:
    | "top_fan"
    | "new_subscriber"
    | "watched_10_plus"
    | "early_supporter";
  className?: string;
}

const badgeConfig = {
  top_fan: {
    emoji: "🔥",
    label: "Top 1% Fan",
    gradient: "from-red-500 to-orange-500",
    glow: "shadow-red-500/50",
  },
  new_subscriber: {
    emoji: "🎉",
    label: "New Subscriber",
    gradient: "from-green-500 to-emerald-500",
    glow: "shadow-green-500/50",
  },
  watched_10_plus: {
    emoji: "👀",
    label: "10+ Videos",
    gradient: "from-blue-500 to-cyan-500",
    glow: "shadow-blue-500/50",
  },
  early_supporter: {
    emoji: "⭐",
    label: "Early Supporter",
    gradient: "from-purple-500 to-pink-500",
    glow: "shadow-purple-500/50",
  },
};

export function AnimatedBadge({
  children,
  variant = "new_subscriber",
  className,
}: AnimatedBadgeProps) {
  const config = badgeConfig[variant];

  return (
    <motion.div
      initial={{ scale: 0, rotate: -180 }}
      animate={{ scale: 1, rotate: 0 }}
      whileHover={{ scale: 1.1, rotate: 5 }}
      className={cn(
        "inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold",
        "bg-gradient-to-r shadow-lg",
        config.gradient,
        config.glow,
        "text-white",
        className,
      )}
    >
      <motion.span
        animate={{
          scale: [1, 1.2, 1],
          rotate: [0, 10, -10, 0],
        }}
        transition={{
          repeat: Infinity,
          duration: 2,
          ease: "easeInOut",
        }}
      >
        {config.emoji}
      </motion.span>
      <span>{config.label}</span>
      {children}
    </motion.div>
  );
}
