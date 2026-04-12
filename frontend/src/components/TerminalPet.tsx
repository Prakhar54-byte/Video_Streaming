"use client";

declare global {
  interface Window {
    __TERMINAL_PET_COORDS__?: { x: number; y: number };
    __TERMINAL_PET_THEME__?: string;
  }
}

import { useState, useEffect, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

type PetState = "idle" | "typing" | "happy" | "sleeping";

interface TerminalLine {
  type: "input" | "output" | "error" | "system";
  content: string;
  timestamp: Date;
}

type PetType = "dog" | "cat" | "fox" | "robot" | "bunny";

const PET_TYPES: { type: PetType; emoji: string; name: string }[] = [
  { type: "dog", emoji: "🐕", name: "Dog" },
  { type: "cat", emoji: "🐱", name: "Cat" },
  { type: "fox", emoji: "🦊", name: "Fox" },
  { type: "robot", emoji: "🤖", name: "Robot" },
  { type: "bunny", emoji: "🐰", name: "Bunny" },
];

const COMMANDS: Record<string, (args: string[]) => string> = {
  help: () => `Available commands:
  help    - Show this help message
  date    - Show current date and time
  whoami  - Display current user info
  echo    - Print text to terminal
  clear   - Clear the terminal
  cat     - Show a random cat fact
  8ball   - Ask the magic 8ball
  coords  - Show current position
  theme   - Toggle terminal theme
  ping    - Check connection status`,
  
  date: () => new Date().toLocaleString(),
  
  whoami: () => {
    const users = ["spark_admin", "video_master", "code_ninja", "stream_king", "dev_guru"];
    return users[Math.floor(Math.random() * users.length)];
  },
  
  echo: (args) => args.join(" ") || "echo what?",
  
  clear: () => {
    return "__CLEAR__";
  },
  
  cat: () => {
    const facts = [
      "Cats sleep for 70% of their lives",
      "A cat's purr vibrates at 25-150 Hz",
      "Cats can jump 6x their length",
      "Cats have 230 bones in their body",
      "A group of cats is called a 'clowder'",
    ];
    return facts[Math.floor(Math.random() * facts.length)];
  },
  
  "8ball": (args) => {
    const responses = [
      "Yes, definitely!",
      "No way!",
      "Ask again later",
      "Without a doubt",
      "My sources say no",
      "Definitely not",
      "You may rely on it",
    ];
    if (!args.length) return "Ask a question first!";
    return `🔮 ${responses[Math.floor(Math.random() * responses.length)]}`;
  },
  
  coords: (args) => {
    const cat = window.__TERMINAL_PET_COORDS__;
    if (cat) {
      return `Position: ${cat.x}%, ${cat.y}%`;
    }
    return "Position unknown";
  },
  
  theme: () => {
    window.__TERMINAL_PET_THEME__ = window.__TERMINAL_PET_THEME__ === "dark" ? "light" : "dark";
    return `Theme switched to ${window.__TERMINAL_PET_THEME__}`;
  },
  
  ping: () => "🏓 Pong! Connection stable",
};

export function TerminalPet() {
  const [showModal, setShowModal] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [terminalLines, setTerminalLines] = useState<TerminalLine[]>([
    { type: "system", content: "Terminal Pet v1.0.0 initialized", timestamp: new Date() },
    { type: "system", content: "Type 'help' for available commands", timestamp: new Date() },
  ]);
  const [input, setInput] = useState("");
  const [position, setPosition] = useState({ x: 85, y: 85 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [petState, setPetState] = useState<PetState>("idle");
  const [theme, setTheme] = useState<"dark" | "light">("dark");
  const [isRoaming, setIsRoaming] = useState(false);
  const [petType, setPetType] = useState<PetType>("cat");
  const [animationEnabled, setAnimationEnabled] = useState(true);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const isMoving = useRef(false);
  const styleRef = useRef<HTMLStyleElement | null>(null);

  useEffect(() => {
    setTimeout(() => setIsRoaming(true), 1500);
  }, []);

  useEffect(() => {
    if (!styleRef.current) {
      styleRef.current = document.createElement("style");
      styleRef.current.textContent = `
        @keyframes petFloat {
          0%, 100% { transform: translateY(0px) translateX(0px) rotate(0deg); }
          25% { transform: translateY(-8px) translateX(5px) rotate(-1deg); }
          50% { transform: translateY(-4px) translateX(-4px) rotate(1deg); }
          75% { transform: translateY(-12px) translateX(3px) rotate(-0.5deg); }
        }
        @keyframes petType {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.05); }
        }
        @keyframes petHappy {
          0%, 100% { transform: translateY(0) rotate(0deg); }
          25% { transform: translateY(-10px) rotate(-10deg); }
          75% { transform: translateY(-10px) rotate(10deg); }
        }
        @keyframes petSleep {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(2px); }
        }
        @keyframes blink {
          0%, 90%, 100% { transform: scaleY(1); }
          95% { transform: scaleY(0.1); }
        }
        @keyframes cursorBlink {
          0%, 50% { opacity: 1; }
          51%, 100% { opacity: 0; }
        }
        .pet-float { animation: petFloat 4s ease-in-out infinite; }
        .pet-type { animation: petType 0.5s ease-in-out infinite; }
        .pet-happy { animation: petHappy 0.6s ease-in-out; }
        .pet-sleep { animation: petSleep 3s ease-in-out infinite; }
        .eye-blink { animation: blink 4s ease-in-out infinite; }
        .terminal-cursor { animation: cursorBlink 1s step-end infinite; }
        .terminal-pet-transition { transition: left 1s cubic-bezier(0.4, 0, 0.2, 1), top 1s cubic-bezier(0.4, 0, 0.2, 1); }
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

  useEffect(() => {
    (window as any).__TERMINAL_PET_COORDS__ = position;
  }, [position]);

  useEffect(() => {
    (window as any).__TERMINAL_PET_THEME__ = theme;
  }, [theme]);

  const renderPetSVG = (type: PetType) => {
    const isBlinking = petState === "sleeping";
    const isHappy = petState === "happy";
    const isTyping = petState === "typing";
    
    const animationClass = isHappy ? "pet-happy" : isTyping ? "pet-type" : (isRoaming && petState === "idle" && animationEnabled) ? "pet-float" : "";
    
    if (type === "robot") {
      return (
        <svg width="50" height="50" viewBox="0 0 50 50" className={animationClass}>
          <defs>
            <linearGradient id="robotGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#9CA3AF" />
              <stop offset="100%" stopColor="#6B7280" />
            </linearGradient>
          </defs>
          
          <rect x="12" y="12" width="26" height="30" rx="4" fill="url(#robotGradient)" />
          <rect x="8" y="16" width="4" height="18" rx="1" fill="#6B7280" />
          <rect x="38" y="16" width="4" height="18" rx="1" fill="#6B7280" />
          <rect x="15" y="6" width="6" height="8" rx="2" fill="url(#robotGradient)" />
          <rect x="29" y="6" width="6" height="8" rx="2" fill="url(#robotGradient)" />
          
          {isBlinking ? (
            <>
              <line x1="17" y1="18" x2="21" y2="18" stroke="#1a1a1a" strokeWidth="2" />
              <line x1="29" y1="18" x2="33" y2="18" stroke="#1a1a1a" strokeWidth="2" />
            </>
          ) : (
            <>
              <rect x="17" y="16" width="5" height="5" rx="1" fill="#10B981" />
              <rect x="29" y="16" width="5" height="5" rx="1" fill="#10B981" />
            </>
          )}
          
          <rect x="18" y="26" width="14" height="7" rx="2" fill="#1a1a1a" />
          <rect x="20" y="28" width="3" height="2" fill="#EF4444" />
          <rect x="26" y="28" width="3" height="2" fill="#3B82F6" />
          <rect x="14" y="40" width="7" height="3" rx="1" fill="#4B5563" />
          <rect x="29" y="40" width="7" height="3" rx="1" fill="#4B5563" />
        </svg>
      );
    }

    if (type === "bunny") {
      return (
        <svg width="50" height="50" viewBox="0 0 50 50" className={animationClass}>
          <defs>
            <linearGradient id="bunnyGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#F9A8D4" />
              <stop offset="100%" stopColor="#EC4899" />
            </linearGradient>
          </defs>
          
          <ellipse cx="25" cy="36" rx="15" ry="12" fill="url(#bunnyGradient)" />
          <ellipse cx="25" cy="36" rx="10" ry="8" fill="#FBCFE8" />
          
          <ellipse cx="14" cy="4" rx="5" ry="12" fill="url(#bunnyGradient)" transform="rotate(-10 14 15)" />
          <ellipse cx="36" cy="4" rx="5" ry="12" fill="url(#bunnyGradient)" transform="rotate(10 36 15)" />
          <ellipse cx="14" cy="5" rx="3" ry="8" fill="#FBCFE8" transform="rotate(-10 14 15)" />
          <ellipse cx="36" cy="5" rx="3" ry="8" fill="#FBCFE8" transform="rotate(10 36 15)" />
          
          {isBlinking ? (
            <>
              <path d="M18 18 Q21 21 24 18" stroke="#1a1a1a" strokeWidth="2" fill="none" strokeLinecap="round" />
              <path d="M26 18 Q29 21 32 18" stroke="#1a1a1a" strokeWidth="2" fill="none" strokeLinecap="round" />
            </>
          ) : (
            <>
              <ellipse cx="20" cy="18" rx="3" ry="4" fill="#1a1a1a" />
              <ellipse cx="30" cy="18" rx="3" ry="4" fill="#1a1a1a" />
              <circle cx="21" cy="16" r="1.2" fill="#FFF" />
              <circle cx="31" cy="16" r="1.2" fill="#FFF" />
            </>
          )}
          
          <ellipse cx="25" cy="24" rx="3" ry="2" fill="#F472B6" />
          <circle cx="25" cy="23" r="1.5" fill="#EC4899" />
          
          <path d="M40 32 Q44 28 42 22" stroke="url(#bunnyGradient)" strokeWidth="3" fill="none" strokeLinecap="round" />
          
          <ellipse cx="16" cy="46" rx="3" ry="2" fill="#EC4899" />
          <ellipse cx="34" cy="46" rx="3" ry="2" fill="#EC4899" />
        </svg>
      );
    }

    if (type === "fox") {
      return (
        <svg width="50" height="50" viewBox="0 0 50 50" className={animationClass}>
          <defs>
            <linearGradient id="foxGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#FF6B00" />
              <stop offset="100%" stopColor="#FF4500" />
            </linearGradient>
          </defs>
          
          <ellipse cx="25" cy="36" rx="15" ry="12" fill="url(#foxGradient)" />
          
          <path d="M10 16 L6 2 L16 10 Z" fill="url(#foxGradient)" />
          <path d="M40 16 L44 2 L34 10 Z" fill="url(#foxGradient)" />
          <path d="M11 12 L8 5 L14 10 Z" fill="#FFF" />
          <path d="M39 12 L42 5 L36 10 Z" fill="#FFF" />
          
          <circle cx="25" cy="20" r="12" fill="url(#foxGradient)" />
          
          <path d="M18 16 L21 19 L25 16 L29 19 L32 16 L32 17 L18 17 Z" fill="#1a1a1a" />
          
          {isBlinking ? (
            <>
              <path d="M19 20 Q22 23 25 20" stroke="#1a1a1a" strokeWidth="2" fill="none" strokeLinecap="round" />
              <path d="M25 20 Q28 23 31 20" stroke="#1a1a1a" strokeWidth="2" fill="none" strokeLinecap="round" />
            </>
          ) : (
            <>
              <ellipse cx="21" cy="20" rx="3" ry="4" fill="#1a1a1a" />
              <ellipse cx="29" cy="20" rx="3" ry="4" fill="#1a1a1a" />
              <circle cx="22" cy="18" r="1.2" fill="#FFF" />
              <circle cx="30" cy="18" r="1.2" fill="#FFF" />
            </>
          )}
          
          <path d="M21 24 L25 27 L29 24" fill="#1a1a1a" />
          
          <path d="M40 36 Q44 30 42 24" stroke="url(#foxGradient)" strokeWidth="4" fill="none" strokeLinecap="round" />
          
          <ellipse cx="16" cy="46" rx="3" ry="2" fill="#FF4500" />
          <ellipse cx="34" cy="46" rx="3" ry="2" fill="#FF4500" />
        </svg>
      );
    }

    if (type === "dog") {
      return (
        <svg width="50" height="50" viewBox="0 0 50 50" className={animationClass}>
          <defs>
            <linearGradient id="dogGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#FF9500" />
              <stop offset="100%" stopColor="#FF6B00" />
            </linearGradient>
          </defs>
          
          <ellipse cx="25" cy="36" rx="16" ry="12" fill="url(#dogGradient)" />
          <ellipse cx="25" cy="36" rx="10" ry="8" fill="#FFE4B5" />
          
          <ellipse cx="12" cy="12" rx="5" ry="7" fill="url(#dogGradient)" transform="rotate(-20 12 12)" />
          <ellipse cx="38" cy="12" rx="5" ry="7" fill="url(#dogGradient)" transform="rotate(20 38 12)" />
          <ellipse cx="12" cy="12" rx="3" ry="4" fill="#FFB800" transform="rotate(-20 12 12)" />
          <ellipse cx="38" cy="12" rx="3" ry="4" fill="#FFB800" transform="rotate(20 38 12)" />
          
          {isBlinking ? (
            <>
              <path d="M18 18 Q21 21 24 18" stroke="#1a1a1a" strokeWidth="2" fill="none" strokeLinecap="round" />
              <path d="M26 18 Q29 21 32 18" stroke="#1a1a1a" strokeWidth="2" fill="none" strokeLinecap="round" />
            </>
          ) : (
            <>
              <ellipse cx="20" cy="18" rx="3" ry="4" fill="#1a1a1a" />
              <ellipse cx="30" cy="18" rx="3" ry="4" fill="#1a1a1a" />
              <circle cx="21" cy="16" r="1.2" fill="#FFF" />
              <circle cx="31" cy="16" r="1.2" fill="#FFF" />
            </>
          )}
          
          <ellipse cx="25" cy="24" rx="4" ry="3" fill="#FFE4B5" />
          <ellipse cx="25" cy="23" rx="2" ry="1.5" fill="#1a1a1a" />
          <path d="M22 25 L25 27 L28 25" stroke="#1a1a1a" strokeWidth="1" fill="none" />
          
          <path d="M42 38 Q46 34 44 28" stroke="url(#dogGradient)" strokeWidth="4" fill="none" strokeLinecap="round" />
          
          <ellipse cx="16" cy="46" rx="3" ry="2" fill="#FF6B00" />
          <ellipse cx="34" cy="46" rx="3" ry="2" fill="#FF6B00" />
        </svg>
      );
    }

    return (
      <svg width="50" height="50" viewBox="0 0 50 50" className={animationClass}>
        <defs>
          <linearGradient id="catGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FF9500" />
            <stop offset="100%" stopColor="#FF6B00" />
          </linearGradient>
          <linearGradient id="catInnerEar" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FFB800" />
            <stop offset="100%" stopColor="#FF8C00" />
          </linearGradient>
        </defs>
        
        <ellipse cx="25" cy="35" rx="16" ry="12" fill="url(#catGradient)" />
        <ellipse cx="25" cy="35" rx="10" ry="8" fill="#FFE4B5" />
        
        <path d="M11 10 L8 2 L16 8 Z" fill="url(#catGradient)" />
        <path d="M39 10 L42 2 L34 8 Z" fill="url(#catGradient)" />
        <path d="M12 8 L10 3 L15 7 Z" fill="url(#catInnerEar)" />
        <path d="M38 8 L40 3 L35 7 Z" fill="url(#catInnerEar)" />
        
        {isBlinking ? (
          <>
            <path d="M17 18 Q20 21 23 18" stroke="#1a1a1a" strokeWidth="2" fill="none" strokeLinecap="round" />
            <path d="M27 18 Q30 21 33 18" stroke="#1a1a1a" strokeWidth="2" fill="none" strokeLinecap="round" />
          </>
        ) : (
          <>
            <ellipse cx="19" cy="18" rx="3" ry="4" fill="#1a1a1a" />
            <ellipse cx="31" cy="18" rx="3" ry="4" fill="#1a1a1a" />
            <circle cx="20" cy="17" r="1" fill="#FFF" />
            <circle cx="32" cy="17" r="1" fill="#FFF" />
          </>
        )}
        
        <path d="M23 22 L25 24 L27 22" fill="#FFB6C1" stroke="#1a1a1a" strokeWidth="0.5" />
        
        <line x1="8" y1="22" x2="16" y2="21" stroke="#1a1a1a" strokeWidth="0.5" opacity="0.5" />
        <line x1="8" y1="24" x2="16" y2="24" stroke="#1a1a1a" strokeWidth="0.5" opacity="0.5" />
        <line x1="34" y1="21" x2="42" y2="22" stroke="#1a1a1a" strokeWidth="0.5" opacity="0.5" />
        <line x1="34" y1="24" x2="42" y2="24" stroke="#1a1a1a" strokeWidth="0.5" opacity="0.5" />
        
        <path d="M40 38 Q46 30 44 25" stroke="url(#catGradient)" strokeWidth="4" fill="none" strokeLinecap="round" />
        
        <ellipse cx="17" cy="46" rx="3" ry="2" fill="#FF6B00" />
        <ellipse cx="33" cy="46" rx="3" ry="2" fill="#FF6B00" />
      </svg>
    );
  };

  const movePet = useCallback(() => {
    if (isMoving.current || isDragging || showModal || !animationEnabled) return;
    isMoving.current = true;
    setPetState("idle");
    
    setTimeout(() => {
      const currentX = position.x;
      const currentY = position.y;
      const direction = Math.random();
      let newX: number, newY: number;
      
      if (direction < 0.25) {
        newX = Math.max(70, Math.random() * 85);
        newY = Math.max(75, currentY + (Math.random() - 0.5) * 15);
      } else if (direction < 0.5) {
        newX = Math.min(95, 85 + Math.random() * 10);
        newY = Math.max(75, currentY + (Math.random() - 0.5) * 15);
      } else if (direction < 0.75) {
        newX = Math.max(70, currentX + (Math.random() - 0.5) * 15);
        newY = Math.max(75, Math.random() * 85);
      } else {
        newX = Math.max(70, currentX + (Math.random() - 0.5) * 15);
        newY = Math.min(95, 85 + Math.random() * 10);
      }
      
      newX = Math.max(70, Math.min(95, newX));
      newY = Math.max(75, Math.min(95, newY));
      
      setPosition({ x: newX, y: newY });
      
      setTimeout(() => {
        setIsRoaming(true);
        isMoving.current = false;
      }, 1000);
    }, 500);
  }, [isDragging, showModal, position, animationEnabled]);

  useEffect(() => {
    if (!animationEnabled) return;
    const moveInterval = setInterval(() => {
      if (!showModal && !isDragging) {
        movePet();
      }
    }, 4000 + Math.random() * 2000);
    
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
    const rect = (e.target as HTMLElement)?.closest(".terminal-pet-container")?.getBoundingClientRect();
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
        x: Math.max(70, Math.min(95, newX)),
        y: Math.max(75, Math.min(95, newY)),
      });
    },
    [isDragging, dragOffset]
  );

  const handleMouseUp = useCallback(() => {
    if (isDragging) {
      setPetState("happy");
      setTimeout(() => setPetState("idle"), 600);
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

  const executeCommand = (cmd: string) => {
    const trimmed = cmd.trim();
    if (!trimmed) return;

    setTerminalLines((prev) => [
      ...prev,
      { type: "input", content: trimmed, timestamp: new Date() },
    ]);
    setPetState("typing");

    const parts = trimmed.split(" ");
    const command = parts[0].toLowerCase();
    const args = parts.slice(1);

    setTimeout(() => {
      if (COMMANDS[command]) {
        const output = COMMANDS[command](args);
        if (output === "__CLEAR__") {
          setTerminalLines([]);
        } else {
          setTerminalLines((prev) => [
            ...prev,
            { type: "output", content: output, timestamp: new Date() },
          ]);
        }
      } else if (command === "clear") {
        setTerminalLines([]);
      } else {
        setTerminalLines((prev) => [
          ...prev,
          { type: "error", content: `Command not found: ${command}. Type 'help' for available commands.`, timestamp: new Date() },
        ]);
      }
      setPetState("happy");
      setTimeout(() => setPetState("idle"), 800);
    }, 300);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      executeCommand(input);
      setInput("");
    }
  };

  const getPetStateText = () => {
    if (!animationEnabled) return "Paused";
    switch (petState) {
      case "typing": return "typing...";
      case "happy": return "meow!";
      case "sleeping": return "sleeping";
      default: return isRoaming ? "roaming" : "idle";
    }
  };

  const currentPetEmoji = PET_TYPES.find(p => p.type === petType)?.emoji || "🐱";

  return (
    <>
      <div
        className={`fixed z-50 cursor-grab transition-all duration-300 terminal-pet-container ${
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
            setPetState("typing");
          }
        }}
        onMouseDown={handleMouseDown}
        title={`${currentPetEmoji} Click to open terminal`}
      >
        <div className="relative flex flex-col items-center">
          <div className={isExpanded ? "bg-zinc-800 rounded-lg p-3 shadow-lg" : ""}>
            {renderPetSVG(petType)}
          </div>
          <span className="mt-1 text-xs font-medium text-orange-400 drop-shadow-md">
            {getPetStateText()}
          </span>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4" onClick={() => setShowModal(false)}>
          <div 
            className={`w-full max-w-lg ${theme === "dark" ? "bg-zinc-900 border-zinc-700" : "bg-zinc-100 border-zinc-300"} border rounded-xl shadow-2xl overflow-hidden`}
            onClick={(e) => e.stopPropagation()}
          >
            <div className={`p-4 border-b ${theme === "dark" ? "border-zinc-800 bg-zinc-900" : "border-zinc-200 bg-zinc-50"} flex items-center justify-between`}>
              <div className="flex items-center gap-3">
                <div className={animationEnabled ? "animate-bounce" : ""}>{renderPetSVG(petType)}</div>
                <div>
                  <h2 className="text-lg font-bold text-orange-500">Terminal Pet</h2>
                  <p className={`text-xs ${theme === "dark" ? "text-zinc-500" : "text-zinc-400"}`}>Interactive terminal companion</p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => {
                  setShowModal(false);
                  setPetState("idle");
                }}
                className={theme === "dark" ? "text-zinc-400 hover:text-white hover:bg-zinc-800" : "text-zinc-600 hover:text-zinc-900 hover:bg-zinc-200"}
              >
                ✕
              </Button>
            </div>

            <div className={`p-4 border-b ${theme === "dark" ? "border-zinc-800" : "border-zinc-200"}`}>
              <div className="flex flex-wrap items-center gap-4">
                <div>
                  <label className={`text-xs font-medium ${theme === "dark" ? "text-zinc-400" : "text-zinc-600"} mb-2 block`}>Pet Type</label>
                  <div className="flex gap-1">
                    {PET_TYPES.map((pet) => (
                      <button
                        key={pet.type}
                        onClick={() => setPetType(pet.type)}
                        className={`w-8 h-8 rounded-lg text-lg flex items-center justify-center transition-all ${
                          petType === pet.type
                            ? "bg-orange-600 scale-110"
                            : theme === "dark" ? "bg-zinc-800 hover:bg-zinc-700" : "bg-zinc-200 hover:bg-zinc-300"
                        }`}
                        title={pet.name}
                      >
                        {pet.emoji}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className={`text-xs font-medium ${theme === "dark" ? "text-zinc-400" : "text-zinc-600"} mb-2 block`}>Animation</label>
                  <button
                    onClick={() => setAnimationEnabled(!animationEnabled)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                      animationEnabled
                        ? "bg-emerald-600 text-white"
                        : theme === "dark" ? "bg-zinc-700 text-zinc-300" : "bg-zinc-300 text-zinc-600"
                    }`}
                  >
                    {animationEnabled ? "⏸️ Pause" : "▶️ Play"}
                  </button>
                </div>
              </div>
            </div>

            <div className={`h-64 overflow-y-auto p-4 font-mono text-sm ${theme === "dark" ? "bg-black text-green-400" : "bg-white text-green-700"}`}>
              {terminalLines.map((line, i) => (
                <div key={i} className="mb-1">
                  {line.type === "input" && (
                    <span className="text-blue-500">➜ ~ </span>
                  )}
                  {line.type === "output" && (
                    <span className="text-green-400"> </span>
                  )}
                  {line.type === "error" && (
                    <span className="text-red-400">✖ </span>
                  )}
                  {line.type === "system" && (
                    <span className="text-yellow-500">ℹ </span>
                  )}
                  <span className={line.type === "input" ? "text-blue-400" : ""}>{line.content}</span>
                </div>
              ))}
              <div className="flex items-center mt-2">
                <span className="text-blue-500">➜ ~ </span>
                <textarea
                  ref={textareaRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  className="flex-1 bg-transparent border-none outline-none text-inherit resize-none"
                  placeholder="Type a command..."
                  autoFocus
                  rows={1}
                />
                <span className={`w-2 h-4 terminal-cursor ${theme === "dark" ? "bg-green-400" : "bg-green-600"}`} />
              </div>
            </div>

            <div className={`p-3 border-t ${theme === "dark" ? "border-zinc-800 bg-zinc-900" : "border-zinc-200 bg-zinc-50"} flex justify-between items-center`}>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setTheme(theme === "dark" ? "light" : "dark");
                    setTerminalLines((prev) => [
                      ...prev,
                      { type: "system", content: `Theme switched to ${theme === "dark" ? "light" : "dark"} mode`, timestamp: new Date() },
                    ]);
                  }}
                  className={`text-xs ${theme === "dark" ? "border-zinc-700 text-zinc-400 hover:bg-zinc-800" : "border-zinc-300 text-zinc-600 hover:bg-zinc-100"}`}
                >
                  🎨 Theme
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setTerminalLines([]);
                    setTerminalLines((prev) => [
                      ...prev,
                      { type: "system", content: "Terminal cleared", timestamp: new Date() },
                    ]);
                  }}
                  className={`text-xs ${theme === "dark" ? "border-zinc-700 text-zinc-400 hover:bg-zinc-800" : "border-zinc-300 text-zinc-600 hover:bg-zinc-100"}`}
                >
                  🗑 Clear
                </Button>
              </div>
              <span className={`text-xs ${theme === "dark" ? "text-zinc-600" : "text-zinc-400"}`}>Press Esc to close</span>
            </div>
          </div>
        </div>
      )}
    </>
  );
}