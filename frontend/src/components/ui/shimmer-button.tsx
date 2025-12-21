"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface ShimmerButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  shimmerColor?: string;
  shimmerSize?: string;
  borderRadius?: string;
  shimmerDuration?: string;
  background?: string;
  className?: string;
  children?: React.ReactNode;
}

export function ShimmerButton({
  shimmerColor = "#ffffff",
  shimmerSize = "0.05em",
  shimmerDuration = "3s",
  borderRadius = "100px",
  background = "linear-gradient(135deg, #f97316 0%, #ef4444 50%, #eab308 100%)",
  className,
  children,
  ...props
}: ShimmerButtonProps) {
  return (
    <motion.button
      style={{
        background,
        borderRadius,
      }}
      className={cn(
        "relative overflow-hidden px-6 py-2 text-white font-medium",
        className,
      )}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      {...(props as any)}
    >
      <span className="relative z-10 flex items-center justify-center gap-2">
        {children}
      </span>
      <motion.div
        className="absolute inset-0"
        style={{
          background: `linear-gradient(90deg, transparent, ${shimmerColor}, transparent)`,
          backgroundSize: `${shimmerSize} 100%`,
        }}
        animate={{
          x: ["-200%", "200%"],
        }}
        transition={{
          repeat: Infinity,
          duration: parseFloat(shimmerDuration),
          ease: "linear",
        }}
      />
    </motion.button>
  );
}
