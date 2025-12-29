"use client";

import { forwardRef } from "react";
import {
  motion,
  useMotionValue,
  useSpring,
  useTransform,
  HTMLMotionProps,
} from "framer-motion";
import { Canvas } from "@react-three/fiber";
import { MeshDistortMaterial, Sphere, Float } from "@react-three/drei";
import { cn } from "@/lib/utils";

function AnimatedSphere({ color = "#f97316" }: { color?: string }) {
  return (
    <Float speed={4} rotationIntensity={1} floatIntensity={2}>
      <Sphere args={[1, 100, 200]} scale={1.8}>
        <MeshDistortMaterial
          color={color}
          attach="material"
          distort={0.5}
          speed={2}
          roughness={0.2}
          metalness={0.8}
        />
      </Sphere>
    </Float>
  );
}

interface TiltCardProps extends Omit<HTMLMotionProps<"div">, "children"> {
  children: React.ReactNode;
  isActive?: boolean;
  activeColor?: string;
}

export const TiltCard = forwardRef<HTMLDivElement, TiltCardProps>(
  (
    {
      children,
      className,
      isActive,
      activeColor = "#f97316",
      onMouseMove,
      onMouseLeave,
      style,
      ...props
    },
    ref,
  ) => {
    const x = useMotionValue(0);
    const y = useMotionValue(0);

    const mouseX = useSpring(x, { stiffness: 500, damping: 100 });
    const mouseY = useSpring(y, { stiffness: 500, damping: 100 });

    const rotateX = useTransform(mouseY, [-0.5, 0.5], ["17.5deg", "-17.5deg"]);
    const rotateY = useTransform(mouseX, [-0.5, 0.5], ["-17.5deg", "17.5deg"]);

    const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
      const rect = e.currentTarget.getBoundingClientRect();
      const width = rect.width;
      const height = rect.height;
      const mouseXFromCenter = e.clientX - rect.left - width / 2;
      const mouseYFromCenter = e.clientY - rect.top - height / 2;
      x.set(mouseXFromCenter / width);
      y.set(mouseYFromCenter / height);

      onMouseMove?.(e);
    };

    const handleMouseLeave = (e: React.MouseEvent<HTMLDivElement>) => {
      x.set(0);
      y.set(0);

      onMouseLeave?.(e);
    };

    return (
      <motion.div
        ref={ref}
        style={{
          rotateX,
          rotateY,
          transformStyle: "preserve-3d",
          ...style,
        }}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        className={cn(
          "relative w-full rounded-xl cursor-pointer transition-all duration-200 group perspective-1000",
          isActive
            ? "bg-gradient-to-br from-orange-500/10 to-red-500/10 border border-orange-500/20"
            : "hover:bg-accent",
          className,
        )}
        {...props}
      >
        {/* Three.js Background for Active State */}
        {isActive && (
          <div className="absolute inset-0 overflow-hidden rounded-xl opacity-20 pointer-events-none">
            <Canvas>
              <ambientLight intensity={0.5} />
              <directionalLight position={[10, 10, 5]} intensity={1} />
              <AnimatedSphere color={activeColor} />
            </Canvas>
          </div>
        )}

        <div
          className="relative z-10"
          style={{ transform: "translateZ(20px)" }}
        >
          {children}
        </div>
      </motion.div>
    );
  },
);

TiltCard.displayName = "TiltCard";
