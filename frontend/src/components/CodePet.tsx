"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type PetState = "sleeping" | "running" | "excited";

interface CodePetProps {
  externalCode?: string;
  onCodeSync?: (code: string) => void;
}

const BROADCAST_CHANNEL_NAME = "spark-code-pet-sync";

type PetType = "dog" | "cat" | "fox" | "robot" | "bunny";

const PET_TYPES: { type: PetType; emoji: string; name: string }[] = [
  { type: "dog", emoji: "🐕", name: "Dog" },
  { type: "cat", emoji: "🐱", name: "Cat" },
  { type: "fox", emoji: "🦊", name: "Fox" },
  { type: "robot", emoji: "🤖", name: "Robot" },
  { type: "bunny", emoji: "🐰", name: "Bunny" },
];

const PET_COLORS: Record<PetType, { primary: string; secondary: string }> = {
  dog: { primary: "#FF9500", secondary: "#FF6B00" },
  cat: { primary: "#FF9500", secondary: "#FF6B00" },
  fox: { primary: "#FF6B00", secondary: "#FF4500" },
  robot: { primary: "#6B7280", secondary: "#4B5563" },
  bunny: { primary: "#F472B6", secondary: "#EC4899" },
};

export function CodePet({ externalCode, onCodeSync }: CodePetProps) {
  const [showModal, setShowModal] = useState(false);
  const [language, setLanguage] = useState("javascript");
  const [code, setCode] = useState("");
  const [output, setOutput] = useState("");
  const [outputTime, setOutputTime] = useState<number | null>(null);
  const [position, setPosition] = useState({ x: 20, y: 80 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [petState, setPetState] = useState<PetState>("sleeping");
  const [eyeState, setEyeState] = useState<"open" | "closed">("closed");
  const [isRoaming, setIsRoaming] = useState(false);
  const [petType, setPetType] = useState<PetType>("dog");
  const [animationEnabled, setAnimationEnabled] = useState(true);

  useEffect(() => {
    setTimeout(() => setIsRoaming(true), 1000);
  }, []);
  const styleRef = useRef<HTMLStyleElement | null>(null);
  const isMoving = useRef(false);
  const executionTimeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const broadcastRef = useRef<BroadcastChannel | null>(null);

  useEffect(() => {
    try {
      broadcastRef.current = new BroadcastChannel(BROADCAST_CHANNEL_NAME);
      broadcastRef.current.onmessage = (event) => {
        if (event.data.type === "code-sync-response" && event.data.code) {
          setCode(event.data.code);
          setOutput("✅ Code synced from editor!");
          setPetState("excited");
          setEyeState("open");
          setTimeout(() => {
            setPetState("sleeping");
            setEyeState("closed");
          }, 1000);
        }
      };
    } catch (e) {
      console.log("BroadcastChannel not supported");
    }
    return () => {
      if (broadcastRef.current) {
        broadcastRef.current.close();
      }
    };
  }, []);

  useEffect(() => {
    if (!styleRef.current) {
      styleRef.current = document.createElement("style");
      styleRef.current.textContent = `
        @keyframes petBounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-8px); }
        }
        @keyframes petRun {
          0%, 100% { transform: translateX(0) rotate(-5deg); }
          25% { transform: translateX(5px) rotate(5deg); }
          50% { transform: translateX(0) rotate(5deg); }
          75% { transform: translateX(-5px) rotate(-5deg); }
        }
        @keyframes petExcited {
          0%, 100% { transform: scale(1) rotate(0deg); }
          25% { transform: scale(1.1) rotate(-10deg); }
          50% { transform: scale(1.15) rotate(0deg); }
          75% { transform: scale(1.1) rotate(10deg); }
        }
        @keyframes petSleep {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(3px); }
        }
        @keyframes tail-wag {
          0%, 100% { transform: rotate(-10deg); }
          50% { transform: rotate(10deg); }
        }
        @keyframes eye-close {
          0%, 100% { transform: scaleY(1); }
          50% { transform: scaleY(0.1); }
        }
        @keyframes petFloat {
          0%, 100% { transform: translateY(0px) translateX(0px) rotate(0deg); }
          25% { transform: translateY(-12px) translateX(8px) rotate(-2deg); }
          50% { transform: translateY(-6px) translateX(-6px) rotate(2deg); }
          75% { transform: translateY(-18px) translateX(4px) rotate(-1deg); }
        }
        @keyframes petBounceNew {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-20px); }
        }
        @keyframes petIdle {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.05); }
        }
        .eye-close {
          animation: eye-close 0.15s ease-in-out forwards;
        }
        @keyframes zzzFloat {
          0% { opacity: 0; transform: translateY(0) translateX(0); }
          50% { opacity: 0.8; }
          100% { opacity: 0; transform: translateY(-20px) translateX(10px); }
        }
        .pet-bounce { animation: petBounce 2s ease-in-out infinite; }
        .pet-running { animation: petRun 0.3s ease-in-out infinite; }
        .pet-excited { animation: petExcited 0.4s ease-in-out infinite; }
        .pet-sleep { animation: petSleep 3s ease-in-out infinite; }
        .pet-roaming { animation: petFloat 4s ease-in-out infinite; }
        .pet-bounce-anim { animation: petBounceNew 1s ease-in-out infinite; }
        .pet-idle { animation: petIdle 2s ease-in-out infinite; }
        .zzz-anim { animation: zzzFloat 2s ease-in-out infinite; }
        .pet-container {
          transition: left 1.5s cubic-bezier(0.4, 0, 0.2, 1), top 1.5s cubic-bezier(0.4, 0, 0.2, 1);
        }
      `;
      document.head.appendChild(styleRef.current);
    }
    return () => {
      if (styleRef.current) {
        styleRef.current.remove();
        styleRef.current = null;
      }
    };
  }, []);

  const renderPetSVG = () => {
    const isClosed = eyeState === "closed";
    const isExcited = petState === "excited";
    const isRunning = petState === "running";
    const colors = PET_COLORS[petType];

    const eyeAnimation = isClosed ? "eye-close" : "eye-open";
    let bodyAnimation = "";
    if (isRunning) bodyAnimation = "pet-running";
    else if (isExcited) bodyAnimation = "pet-excited";
    else bodyAnimation = "pet-sleep";

    if (petType === "robot") {
      return (
        <svg width="60" height="60" viewBox="0 0 60 60" className={bodyAnimation}>
          <defs>
            <linearGradient id="robotGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#9CA3AF" />
              <stop offset="100%" stopColor="#6B7280" />
            </linearGradient>
          </defs>
          
          <rect x="15" y="15" width="30" height="35" rx="5" fill="url(#robotGradient)" />
          <rect x="10" y="20" width="5" height="20" rx="2" fill="#6B7280" />
          <rect x="45" y="20" width="5" height="20" rx="2" fill="#6B7280" />
          <rect x="18" y="8" width="8" height="10" rx="2" fill="url(#robotGradient)" />
          <rect x="34" y="8" width="8" height="10" rx="2" fill="url(#robotGradient)" />
          
          {isClosed ? (
            <>
              <line x1="20" y1="22" x2="26" y2="22" stroke="#1a1a1a" strokeWidth="2" />
              <line x1="34" y1="22" x2="40" y2="22" stroke="#1a1a1a" strokeWidth="2" />
            </>
          ) : (
            <>
              <rect x="20" y="20" width="6" height="6" rx="1" fill="#10B981" />
              <rect x="34" y="20" width="6" height="6" rx="1" fill="#10B981" />
              {isExcited && (
                <>
                  <rect x="20" y="20" width="2" height="2" fill="#FFF" />
                  <rect x="34" y="20" width="2" height="2" fill="#FFF" />
                </>
              )}
            </>
          )}
          
          <rect x="22" y="32" width="16" height="8" rx="2" fill="#1a1a1a" />
          <rect x="24" y="34" width="4" height="2" fill="#EF4444" />
          <rect x="30" y="34" width="4" height="2" fill="#3B82F6" />
          <rect x="18" y="48" width="8" height="4" rx="1" fill="#4B5563" />
          <rect x="34" y="48" width="8" height="4" rx="1" fill="#4B5563" />
        </svg>
      );
    }

    if (petType === "bunny") {
      return (
        <svg width="60" height="60" viewBox="0 0 60 60" className={bodyAnimation}>
          <defs>
            <linearGradient id="bunnyGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#F9A8D4" />
              <stop offset="100%" stopColor="#EC4899" />
            </linearGradient>
          </defs>
          
          <ellipse cx="30" cy="38" rx="18" ry="14" fill="url(#bunnyGradient)" />
          <ellipse cx="30" cy="38" rx="12" ry="10" fill="#FBCFE8" />
          
          <ellipse cx="18" y1="6" rx="6" ry="14" fill="url(#bunnyGradient)" transform="rotate(-10 18 20)" />
          <ellipse cx="42" y1="6" rx="6" ry="14" fill="url(#bunnyGradient)" transform="rotate(10 42 20)" />
          <ellipse cx="18" y1="8" rx="3" ry="10" fill="#FBCFE8" transform="rotate(-10 18 20)" />
          <ellipse cx="42" y1="8" rx="3" ry="10" fill="#FBCFE8" transform="rotate(10 42 20)" />
          
          {isClosed ? (
            <>
              <path d="M22 20 Q25 23 28 20" stroke="#1a1a1a" strokeWidth="2" fill="none" strokeLinecap="round" />
              <path d="M32 20 Q35 23 38 20" stroke="#1a1a1a" strokeWidth="2" fill="none" strokeLinecap="round" />
            </>
          ) : (
            <>
              <ellipse cx="24" cy="20" rx="4" ry="5" fill="#1a1a1a" />
              <ellipse cx="36" cy="20" rx="4" ry="5" fill="#1a1a1a" />
              <circle cx="25" cy="18" r="1.5" fill="#FFF" />
              <circle cx="37" cy="18" r="1.5" fill="#FFF" />
            </>
          )}
          
          <ellipse cx="30" cy="26" rx="4" ry="3" fill="#F472B6" />
          <circle cx="30" cy="25" r="2" fill="#EC4899" />
          
          <path d="M48 35 Q52 30 50 25" stroke="url(#bunnyGradient)" strokeWidth="4" fill="none" strokeLinecap="round" />
          
          <ellipse cx="20" cy="50" rx="4" ry="3" fill="#EC4899" />
          <ellipse cx="40" cy="50" rx="4" ry="3" fill="#EC4899" />
        </svg>
      );
    }

    if (petType === "fox") {
      return (
        <svg width="60" height="60" viewBox="0 0 60 60" className={bodyAnimation}>
          <defs>
            <linearGradient id="foxGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#FF6B00" />
              <stop offset="100%" stopColor="#FF4500" />
            </linearGradient>
          </defs>
          
          <ellipse cx="30" cy="38" rx="18" ry="14" fill="url(#foxGradient)" />
          
          <path d="M12 20 L8 2 L20 14 Z" fill="url(#foxGradient)" />
          <path d="M48 20 L52 2 L40 14 Z" fill="url(#foxGradient)" />
          <path d="M13 16 L10 6 L18 14 Z" fill="#FFF" />
          <path d="M47 16 L50 6 L42 14 Z" fill="#FFF" />
          
          <circle cx="30" cy="22" r="14" fill="url(#foxGradient)" />
          
          <path d="M22 18 L26 22 L30 18 L34 22 L38 18 L38 20 L22 20 Z" fill="#1a1a1a" />
          
          {isClosed ? (
            <>
              <path d="M23 24 Q26 27 29 24" stroke="#1a1a1a" strokeWidth="2" fill="none" strokeLinecap="round" />
              <path d="M31 24 Q34 27 37 24" stroke="#1a1a1a" strokeWidth="2" fill="none" strokeLinecap="round" />
            </>
          ) : (
            <>
              <circle cx="25" cy="24" r="4" fill="#1a1a1a" />
              <circle cx="35" cy="24" r="4" fill="#1a1a1a" />
              <circle cx="26" cy="23" r="1.5" fill="#FFF" />
              <circle cx="36" cy="23" r="1.5" fill="#FFF" />
            </>
          )}
          
          <path d="M25 29 L30 32 L35 29" fill="#1a1a1a" />
          
          {isExcited && (
            <>
              <ellipse cx="16" cy="26" rx="4" ry="2" fill="#FF6B6B" opacity="0.6" />
              <ellipse cx="44" cy="26" rx="4" ry="2" fill="#FF6B6B" opacity="0.6" />
            </>
          )}
          
          <path d="M48 38 Q54 32 52 28" stroke="url(#foxGradient)" strokeWidth="5" fill="none" strokeLinecap="round" />
          
          <ellipse cx="20" cy="50" rx="4" ry="3" fill="#FF4500" />
          <ellipse cx="40" cy="50" rx="4" ry="3" fill="#FF4500" />
        </svg>
      );
    }

    if (petType === "cat") {
      return (
        <svg width="60" height="60" viewBox="0 0 60 60" className={bodyAnimation}>
          <defs>
            <linearGradient id="catGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#FF9500" />
              <stop offset="100%" stopColor="#FF6B00" />
            </linearGradient>
          </defs>
          
          <ellipse cx="30" cy="38" rx="18" ry="14" fill="url(#catGradient)" />
          <ellipse cx="30" cy="38" rx="12" ry="10" fill="#FFE4B5" />
          
          <path d="M14 12 L10 2 L20 10 Z" fill="url(#catGradient)" />
          <path d="M46 12 L50 2 L40 10 Z" fill="url(#catGradient)" />
          <path d="M15 8 L12 3 L18 8 Z" fill="#FFB800" />
          <path d="M45 8 L48 3 L42 8 Z" fill="#FFB800" />
          
          {isClosed ? (
            <>
              <path d="M22 20 Q25 23 28 20" stroke="#1a1a1a" strokeWidth="2" fill="none" strokeLinecap="round" />
              <path d="M32 20 Q35 23 38 20" stroke="#1a1a1a" strokeWidth="2" fill="none" strokeLinecap="round" />
            </>
          ) : (
            <>
              <ellipse cx="24" cy="20" rx="4" ry="5" fill="#1a1a1a" />
              <ellipse cx="36" cy="20" rx="4" ry="5" fill="#1a1a1a" />
              <circle cx="25" cy="18" r="1.5" fill="#FFF" />
              <circle cx="37" cy="18" r="1.5" fill="#FFF" />
              <ellipse cx="20" cy="20" rx="2" ry="3" fill="rgba(255,255,255,0.2)" />
              <ellipse cx="40" cy="20" rx="2" ry="3" fill="rgba(255,255,255,0.2)" />
            </>
          )}
          
          <ellipse cx="30" cy="26" rx="3" ry="2" fill="#FFB6C1" />
          
          <line x1="12" y1="26" x2="20" y2="25" stroke="#1a1a1a" strokeWidth="0.5" opacity="0.5" />
          <line x1="12" y1="28" x2="20" y2="28" stroke="#1a1a1a" strokeWidth="0.5" opacity="0.5" />
          <line x1="40" y1="25" x2="48" y2="26" stroke="#1a1a1a" strokeWidth="0.5" opacity="0.5" />
          <line x1="40" y1="28" x2="48" y2="28" stroke="#1a1a1a" strokeWidth="0.5" opacity="0.5" />
          
          {isExcited && (
            <>
              <ellipse cx="16" cy="26" rx="4" ry="2" fill="#FF6B6B" opacity="0.6" />
              <ellipse cx="44" cy="26" rx="4" ry="2" fill="#FF6B6B" opacity="0.6" />
            </>
          )}
          
          <path d="M48 40 Q54 35 52 28" stroke="url(#catGradient)" strokeWidth="4" fill="none" strokeLinecap="round" style={isExcited ? { animation: "tail-wag 0.3s ease-in-out infinite" } : {}} />
          
          <ellipse cx="20" cy="50" rx="4" ry="3" fill="#FF6B00" />
          <ellipse cx="40" cy="50" rx="4" ry="3" fill="#FF6B00" />
        </svg>
      );
    }

    return (
      <svg width="60" height="60" viewBox="0 0 60 60" className={bodyAnimation}>
        <defs>
          <linearGradient id="sparkGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FF9500" />
            <stop offset="50%" stopColor="#FF6B00" />
            <stop offset="100%" stopColor="#FFB800" />
          </linearGradient>
          <linearGradient id="sparkGradientLight" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FFB800" />
            <stop offset="100%" stopColor="#FF6B00" />
          </linearGradient>
        </defs>
        
        <ellipse cx="30" cy="38" rx="20" ry="15" fill="url(#sparkGradient)" />
        
        <circle cx="30" cy="22" r="16" fill="url(#sparkGradient)" />
        
        <ellipse cx="16" cy="10" rx="6" ry="8" fill="url(#sparkGradient)" transform="rotate(-20 16 10)" />
        <ellipse cx="44" cy="10" rx="6" ry="8" fill="url(#sparkGradient)" transform="rotate(20 44 10)" />
        <ellipse cx="16" cy="10" rx="4" ry="5" fill="#FFB800" transform="rotate(-20 16 10)" />
        <ellipse cx="44" cy="10" rx="4" ry="5" fill="#FFB800" transform="rotate(20 44 10)" />
        
        <ellipse cx="30" cy="26" rx="6" ry="4" fill="#FFE4B5" />
        <ellipse cx="30" cy="24" rx="3" ry="2" fill="#1a1a1a" />
        <path d="M27 26 L30 29 L33 26" stroke="#1a1a1a" strokeWidth="1.5" fill="none" strokeLinecap="round" />
        
        {isClosed ? (
          <>
            <path d="M22 18 Q25 21 28 18" stroke="#1a1a1a" strokeWidth="2" fill="none" strokeLinecap="round" />
            <path d="M32 18 Q35 21 38 18" stroke="#1a1a1a" strokeWidth="2" fill="none" strokeLinecap="round" />
          </>
        ) : (
          <>
            <circle cx="24" cy="18" r="4" fill="#1a1a1a" />
            <circle cx="36" cy="18" r="4" fill="#1a1a1a" />
            <circle cx="25" cy="17" r="1.5" fill="#FFF" />
            <circle cx="37" cy="17" r="1.5" fill="#FFF" />
          </>
        )}
        
        {isExcited && (
          <>
            <ellipse cx="18" cy="24" rx="4" ry="2" fill="#FF6B6B" opacity="0.6" />
            <ellipse cx="42" cy="24" rx="4" ry="2" fill="#FF6B6B" opacity="0.6" />
          </>
        )}
        
        <path 
          d="M50 38 Q56 32 54 28" 
          stroke="url(#sparkGradient)" 
          strokeWidth="4" 
          fill="none" 
          strokeLinecap="round"
          style={isExcited ? { animation: "tail-wag 0.3s ease-in-out infinite" } : {}}
        />
        
        <ellipse cx="20" cy="50" rx="4" ry="3" fill="#FF6B00" />
        <ellipse cx="40" cy="50" rx="4" ry="3" fill="#FF6B00" />
        <ellipse cx="26" cy="51" rx="3" ry="2" fill="#FF9500" />
        <ellipse cx="34" cy="51" rx="3" ry="2" fill="#FF9500" />
      </svg>
    );
  };

  const movePet = useCallback(() => {
    if (isMoving.current || isDragging || showModal) return;
    isMoving.current = true;
    setPetState("running");
    setEyeState("open");
    setIsRoaming(false);
    
    setTimeout(() => {
      const currentX = position.x;
      const currentY = position.y;
      const direction = Math.random();
      let newX: number, newY: number;
      
      if (direction < 0.25) {
        newX = Math.max(5, Math.random() * 20);
        newY = Math.max(10, currentY + (Math.random() - 0.5) * 20);
      } else if (direction < 0.5) {
        newX = Math.min(90, 80 + Math.random() * 15);
        newY = Math.max(10, currentY + (Math.random() - 0.5) * 20);
      } else if (direction < 0.75) {
        newX = Math.max(5, currentX + (Math.random() - 0.5) * 20);
        newY = Math.max(10, Math.random() * 25);
      } else {
        newX = Math.max(5, currentX + (Math.random() - 0.5) * 20);
        newY = Math.min(85, 60 + Math.random() * 20);
      }
      
      newX = Math.max(5, Math.min(90, newX));
      newY = Math.max(10, Math.min(85, newY));
      
      setPosition({ x: newX, y: newY });
      
      setTimeout(() => {
        setPetState("sleeping");
        setEyeState("closed");
        setIsRoaming(true);
        isMoving.current = false;
      }, 800);
    }, 500);
  }, [isDragging, showModal, position]);

  useEffect(() => {
    if (!animationEnabled) return;
    const moveInterval = setInterval(() => {
      if (!showModal && !isDragging) {
        movePet();
      }
    }, 2500 + Math.random() * 1500);
    
    return () => clearInterval(moveInterval);
  }, [movePet, showModal, isDragging, animationEnabled]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setShowModal(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    const rect = (e.target as HTMLElement).closest(".pet-container")?.getBoundingClientRect();
    if (rect) {
      setDragOffset({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      });
    }
  };

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!isDragging) return;
      const container = document.body;
      const newX = ((e.clientX - dragOffset.x) / container.clientWidth) * 100;
      const newY = ((e.clientY - dragOffset.y) / container.clientHeight) * 100;
      setPosition({
        x: Math.max(5, Math.min(90, newX)),
        y: Math.max(10, Math.min(85, newY)),
      });
    },
    [isDragging, dragOffset]
  );

  const handleMouseUp = useCallback(() => {
    if (isDragging) {
      setPetState("excited");
      setEyeState("open");
      setIsRoaming(false);
      setTimeout(() => {
        setPetState("sleeping");
        setEyeState("closed");
        setIsRoaming(true);
      }, 1000);
    }
    setIsDragging(false);
  }, [isDragging]);

  useEffect(() => {
    if (isDragging) {
      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("mouseup", handleMouseUp);
      return () => {
        window.removeEventListener("mousemove", handleMouseMove);
        window.removeEventListener("mouseup", handleMouseUp);
      };
    }
  }, [isDragging, handleMouseMove, handleMouseUp]);

  const getAnimationClass = () => {
    if (!animationEnabled) return "";
    if (isRoaming && petState === "sleeping") {
      return "pet-roaming";
    }
    switch (petState) {
      case "running": return "pet-running";
      case "excited": return "pet-excited";
      case "sleeping": return "pet-idle";
      default: return "pet-bounce-anim";
    }
  };

  const checkCodeSafety = (code: string): { safe: boolean; warning?: string } => {
    const dangerous = [
      { pattern: /while\s*\(\s*true\s*\)/gi, msg: "Infinite while loop detected" },
      { pattern: /for\s*\(\s*;\s*;\s*\)/gi, msg: "Infinite for loop detected" },
      { pattern: /while\s*\(/gi, msg: "Potential infinite loop" },
      { pattern: /eval\s*\(/gi, msg: "eval() is disabled for safety" },
      { pattern: /Function\s*\(/gi, msg: "Function constructor is disabled" },
      { pattern: /setTimeout\s*\(\s*['"`]/gi, msg: "setTimeout with string is disabled" },
      { pattern: /setInterval\s*\(\s*['"`]/gi, msg: "setInterval with string is disabled" },
      { pattern: /document\s*\./gi, msg: "DOM access is disabled" },
      { pattern: /window\s*\./gi, msg: "window access is disabled" },
      { pattern: /fetch\s*\(/gi, msg: "Network requests are disabled" },
      { pattern: /XMLHttpRequest/gi, msg: "Network requests are disabled" },
    ];

    for (const { pattern, msg } of dangerous) {
      if (pattern.test(code)) {
        return { safe: false, warning: msg };
      }
    }
    return { safe: true };
  };

  const runCode = () => {
    if (!code.trim()) {
      setOutput("Please enter some code first!");
      return;
    }

    const safety = checkCodeSafety(code);
    if (!safety.safe) {
      setOutput(`⚠️ Security Warning: ${safety.warning}\n\nPlease modify your code to remove this pattern.`);
      return;
    }

    if (code.length > 1000) {
      setOutput("⚠️ Code too long! Maximum 1000 characters allowed.\n\nPlease shorten your code.");
      return;
    }

    if (language === "javascript" || language === "typescript") {
      const startTime = performance.now();
      
      const maxIterations = 10000;
      let iterationCount = 0;
      
      try {
        const monitoredCode = `
          let __iterations = 0;
          const __checkIter = () => {
            if (++__iterations > ${maxIterations}) throw new Error('Code too complex - exceeded ${maxIterations} iterations');
          };
          ${code.replace(/;/g, '; __checkIter(); ')}
        `;
        
        const logs: string[] = [];
        const customConsole = {
          log: (...args: unknown[]) => {
            if (iterationCount < maxIterations) {
              logs.push(args.map(a => String(a)).join(" "));
            }
          },
          error: (...args: unknown[]) => logs.push("❌ Error: " + args.map(a => String(a)).join(" ")),
          warn: (...args: unknown[]) => logs.push("⚠️ Warning: " + args.map(a => String(a)).join(" ")),
          info: (...args: unknown[]) => logs.push("ℹ️ " + args.map(a => String(a)).join(" ")),
        };

        if (executionTimeoutRef.current) {
          if (executionTimeoutRef.current) clearTimeout(executionTimeoutRef.current);
        }

        const executionPromise = new Promise<void>((resolve, reject) => {
          executionTimeoutRef.current = setTimeout(() => {
            reject(new Error("Execution timeout - code took longer than 5 seconds"));
          }, 5000);

          try {
            const fn = new Function("console", monitoredCode);
            fn(customConsole);
            resolve();
          } catch (err) {
            reject(err);
          }
        });

        executionPromise
          .then(() => {
            if (executionTimeoutRef.current) clearTimeout(executionTimeoutRef.current);
            const endTime = performance.now();
            const elapsed = (endTime - startTime).toFixed(2);
            setOutputTime(Number(elapsed));
            
            if (logs.length > 0) {
              setOutput(logs.join("\n") + `\n\n⏱️ Executed in ${elapsed}ms`);
            } else {
              setOutput(`✅ Code executed successfully in ${elapsed}ms (no output)`);
            }
            
            setPetState("excited");
            setEyeState("open");
            setTimeout(() => {
              setPetState("sleeping");
              setEyeState("closed");
            }, 1500);
          })
          .catch((err) => {
            if (executionTimeoutRef.current) clearTimeout(executionTimeoutRef.current);
            const endTime = performance.now();
            setOutputTime(Number((endTime - startTime).toFixed(2)));
            setOutput(`❌ Error: ${err instanceof Error ? err.message : String(err)}\n\n⏱️ Failed after ${(endTime - startTime).toFixed(2)}ms`);
          });
          
        setOutput("⏳ Running...");
        
      } catch (err) {
        setOutput(`❌ Error: ${err instanceof Error ? err.message : String(err)}`);
      }
    } else if (language === "python" || language === "python3") {
      setOutput("🐍 Python3 execution is coming soon!\n\nWe're building a secure Python runtime. Stay tuned!");
      setPetState("sleeping");
    } else if (language === "html") {
      setOutput("🌐 HTML/CSS preview is coming soon!\n\nWe're working on a safe HTML renderer. Check back later!");
      setPetState("sleeping");
    } else if (language === "go") {
      setOutput("🐹 Go execution is coming soon!\n\nWe're implementing Go support. Stay tuned!");
      setPetState("sleeping");
    } else if (language === "typescript") {
      setOutput("📘 TypeScript is treated as JavaScript for now.\n\nFull TS support coming soon!");
      setPetState("sleeping");
    }
  };

  const syncFromEditor = () => {
    if (broadcastRef.current) {
      broadcastRef.current.postMessage({ type: "code-sync-request" });
      setOutput("📡 Requesting code from editor...");
    } else if (externalCode) {
      setCode(externalCode);
      setOutput("✅ Code synced from editor!");
      setPetState("excited");
      setEyeState("open");
      setTimeout(() => {
        setPetState("sleeping");
        setEyeState("closed");
      }, 1000);
    } else {
      setOutput("⚠️ No code found in main editor.\n\nMake sure the video page has code in the editor first.");
    }
  };

  const syncToEditor = () => {
    if (onCodeSync) {
      onCodeSync(code);
      setOutput("✅ Code pushed to main editor!");
      setPetState("excited");
      setEyeState("open");
      setTimeout(() => {
        setPetState("sleeping");
        setEyeState("closed");
      }, 1000);
    } else {
      setOutput("⚠️ Cannot push code - editor connection not available.");
    }
  };

  const clearOutput = () => {
    setOutput("");
    setOutputTime(null);
  };

  const languages = [
    { value: "javascript", label: "JavaScript", emoji: "🟨", ready: true },
    { value: "typescript", label: "TypeScript", emoji: "📘", ready: false, note: "(JS for now)" },
    { value: "python3", label: "Python3", emoji: "🐍", ready: false },
    { value: "html", label: "HTML/CSS", emoji: "🌐", ready: false },
    { value: "go", label: "Go", emoji: "🐹", ready: false },
  ];

  const currentPetEmoji = PET_TYPES.find(p => p.type === petType)?.emoji || "🐕";

  return (
    <>
      <div
        className={`fixed z-50 cursor-grab transition-all duration-300 ${
          isDragging ? "cursor-grabbing scale-110" : "hover:scale-105"
        }`}
        style={{
          left: `${position.x}%`,
          top: `${position.y}%`,
          transform: "translate(-50%, -50%)",
        }}
        onClick={(e) => {
          if (!isDragging) {
            e.stopPropagation();
            setShowModal(true);
            setPetState("excited");
            setEyeState("open");
            setIsRoaming(false);
            setTimeout(() => {
              setPetState("sleeping");
              setEyeState("closed");
              setIsRoaming(true);
            }, 1000);
          }
        }}
        onMouseDown={handleMouseDown}
        title={`${currentPetEmoji} Click me to code!`}
      >
        <div className={`pet-container relative flex flex-col items-center ${petState === "excited" ? "pet-bounce-anim" : ""}`}>
          <div className={`${getAnimationClass()}`}>
            {renderPetSVG()}
          </div>
          
          {petState === "sleeping" && eyeState === "closed" && animationEnabled && (
            <>
              <div className="absolute -top-2 -right-4 text-lg zzz-anim">💤</div>
              <div className="absolute -top-1 -right-6 text-sm zzz-anim" style={{ animationDelay: "0.5s" }}>Z</div>
              <div className="absolute -top-0 -right-8 text-xs zzz-anim" style={{ animationDelay: "1s" }}>z</div>
            </>
          )}
          
          {petState === "excited" && animationEnabled && (
            <div className="absolute -top-2 left-1/2 -translate-x-1/2 text-2xl animate-bounce">✨</div>
          )}
          
          <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-3 h-3 bg-yellow-400 rounded-full animate-ping" />
          <span className="mt-1 text-xs font-medium text-yellow-400 drop-shadow-md">
            {petState === "running" ? "Running!" : petState === "excited" ? "Yay!" : !animationEnabled ? "Paused" : isRoaming ? "Roaming..." : "Click me!"}
          </span>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4" onClick={() => setShowModal(false)}>
          <div 
            className="w-full max-w-2xl bg-zinc-900 border border-zinc-700 rounded-2xl shadow-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-5 border-b border-zinc-800 flex items-center justify-between bg-gradient-to-r from-zinc-900 to-zinc-800">
              <div className="flex items-center gap-4">
                <div className={animationEnabled ? "animate-bounce" : ""}>{renderPetSVG()}</div>
                <div>
                  <h2 className="text-xl font-bold text-white">Code Pet Playground</h2>
                  <p className="text-sm text-zinc-400">Run code with your furry companion!</p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => {
                  setShowModal(false);
                  setPetState("sleeping");
                  setEyeState("closed");
                }}
                className="text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-full"
              >
                ✕
              </Button>
            </div>

            <div className="p-5 space-y-4">
              <div className="flex flex-wrap items-center gap-4">
                <div>
                  <label className="text-sm font-medium text-zinc-300 mb-2 block">Pet Type</label>
                  <div className="flex gap-2">
                    {PET_TYPES.map((pet) => (
                      <button
                        key={pet.type}
                        onClick={() => setPetType(pet.type)}
                        className={`w-10 h-10 rounded-lg text-xl flex items-center justify-center transition-all ${
                          petType === pet.type
                            ? "bg-orange-600 scale-110"
                            : "bg-zinc-800 hover:bg-zinc-700"
                        }`}
                        title={pet.name}
                      >
                        {pet.emoji}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-zinc-300 mb-2 block">Animation</label>
                  <button
                    onClick={() => setAnimationEnabled(!animationEnabled)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                      animationEnabled
                        ? "bg-emerald-600 text-white"
                        : "bg-zinc-700 text-zinc-300"
                    }`}
                  >
                    {animationEnabled ? "⏸️ Pause" : "▶️ Play"}
                  </button>
                </div>
              </div>

              <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-3 flex items-start gap-3">
                <span className="text-xl">⚡</span>
                <div className="text-sm text-amber-200">
                  <span className="font-bold">Code Limits:</span> Max 1000 chars, 5s timeout, 10000 iterations. 
                  Infinite loops and dangerous patterns are blocked.
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-zinc-300 mb-2 block">
                  Language
                </label>
                <div className="flex flex-wrap gap-2">
                  {languages.map((lang) => (
                    <button
                      key={lang.value}
                      onClick={() => {
                        if (lang.ready) {
                          setLanguage(lang.value);
                        } else {
                          setOutput(`🚧 ${lang.label} is coming soon! ${lang.note || ""}\n\nWe&apos;re working on adding ${lang.label} support. Stay tuned!`);
                        }
                      }}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                        language === lang.value
                          ? "bg-emerald-600 text-white"
                          : "bg-zinc-800 text-zinc-300 hover:bg-zinc-700"
                      }`}
                    >
                      {lang.emoji} {lang.label}
                      {!lang.ready && <span className="ml-1 text-xs opacity-60">(Soon)</span>}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-medium text-zinc-300">
                    Your Code
                  </label>
                  <span className={`text-xs ${code.length > 1000 ? "text-red-400" : "text-zinc-500"}`}>
                    {code.length}/1000 characters
                  </span>
                </div>
                <Textarea
                  value={code}
                  onChange={(e) => setCode(e.target.value.slice(0, 1100))}
                  placeholder={
                    language === "javascript"
                      ? "// Write your JavaScript here\nconsole.log('Hello, World!');\n\nconst add = (a, b) => a + b;\nconsole.log(add(2, 3));"
                      : language === "typescript"
                      ? "// Write your TypeScript here (runs as JS)\nconst greet = (name: string): string => `Hello, ${name}!`;\nconsole.log(greet('World'));"
                      : "// This language is coming soon!"
                  }
                  className={`min-h-[150px] bg-zinc-800 border-zinc-700 text-zinc-100 font-mono text-sm resize-none ${
                    code.length > 1000 ? "border-red-500" : ""
                  }`}
                />
              </div>

              <div className="flex gap-3">
                <Button
                  onClick={runCode}
                  className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-medium py-2"
                >
                  ▶ Run Code
                </Button>
                <Button
                  onClick={syncFromEditor}
                  variant="outline"
                  className="bg-zinc-800 border-zinc-700 text-zinc-300 hover:bg-zinc-700"
                >
                  📥 Sync In
                </Button>
                <Button
                  onClick={syncToEditor}
                  variant="outline"
                  className="bg-zinc-800 border-zinc-700 text-zinc-300 hover:bg-zinc-700"
                >
                  📤 Push
                </Button>
              </div>

              {output && (
                <div className="relative">
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-sm font-medium text-zinc-300">
                      Output {outputTime !== null && <span className="text-zinc-500 text-xs ml-2">(⏱️ {outputTime}ms)</span>}
                    </label>
                    <button 
                      onClick={clearOutput}
                      className="text-xs text-zinc-500 hover:text-zinc-300 transition"
                    >
                      Clear
                    </button>
                  </div>
                  <div className="bg-black rounded-lg p-4 font-mono text-sm text-zinc-300 min-h-[100px] max-h-[250px] overflow-auto whitespace-pre-wrap border border-zinc-800">
                    {output}
                  </div>
                </div>
              )}
            </div>

            <div className="p-4 border-t border-zinc-800 bg-zinc-900/50">
              <div className="flex justify-between items-center text-xs text-zinc-500">
                <span>💡 Your pet loves safe code!</span>
                <span>Press Esc to close</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}