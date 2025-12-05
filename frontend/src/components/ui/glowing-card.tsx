"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface GlowingCardProps {
  children: React.ReactNode;
  className?: string;
  glowColor?: string;
  onClick?: () => void;
}

export function GlowingCard({
  children,
  className,
  glowColor = "rgba(249, 115, 22, 0.3)",
  onClick,
}: GlowingCardProps) {
  return (
    <motion.div
      className={cn(
        "relative rounded-xl p-4 bg-card border border-border",
        "hover:border-orange-500/50 transition-all duration-300",
        onClick && "cursor-pointer",
        className,
      )}
      whileHover={{
        scale: 1.02,
        boxShadow: `0 0 20px ${glowColor}, 0 0 40px ${glowColor}`,
      }}
      onClick={onClick}
    >
      {children}
    </motion.div>
  );
}
