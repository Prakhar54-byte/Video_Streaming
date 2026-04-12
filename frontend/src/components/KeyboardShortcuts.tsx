"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { 
  Keyboard, Play, Pause, Volume2, VolumeX, Maximize, 
  Heart, MessageSquare, Share2, Download, Bookmark, SkipForward,
  Rewind, Settings, Upload, Search, User, Bell, X, Command,
  ArrowLeft, ArrowRight, ArrowUp, ArrowDown, Home, Video,
  HeartHandshake, ListMusic, Mail, UserCircle, HelpCircle
} from "lucide-react";
import { cn } from "@/lib/utils";

interface Shortcut {
  keys: string[];
  description: string;
}

interface ShortcutCategory {
  id: string;
  label: string;
  icon: typeof Play;
  shortcuts: Shortcut[];
}

const CATEGORIES: ShortcutCategory[] = [
  {
    id: "video",
    label: "Video Controls",
    icon: Play,
    shortcuts: [
      { keys: ["Space"], description: "Play / Pause" },
      { keys: ["K"], description: "Play / Pause" },
      { keys: ["J"], description: "Rewind 10 seconds" },
      { keys: ["L"], description: "Forward 10 seconds" },
      { keys: ["ArrowLeft"], description: "Rewind 5 seconds" },
      { keys: ["ArrowRight"], description: "Forward 5 seconds" },
      { keys: ["ArrowUp"], description: "Volume up" },
      { keys: ["ArrowDown"], description: "Volume down" },
      { keys: ["M"], description: "Mute / Unmute" },
      { keys: ["F"], description: "Toggle fullscreen" },
      { keys: ["C"], description: "Toggle captions" },
      { keys: ["<"], description: "Playback speed down" },
      { keys: [">"], description: "Playback speed up" },
      { keys: ["0-9"], description: "Jump to 0%-90%" },
    ],
  },
  {
    id: "editor",
    label: "Editor",
    icon: Settings,
    shortcuts: [
      { keys: ["Ctrl", "S"], description: "Save draft" },
      { keys: ["Ctrl", "Enter"], description: "Publish video" },
      { keys: ["Ctrl", "Z"], description: "Undo" },
      { keys: ["Ctrl", "Shift", "Z"], description: "Redo" },
      { keys: ["Ctrl", "B"], description: "Bold text" },
      { keys: ["Ctrl", "I"], description: "Italic text" },
      { keys: ["Ctrl", "K"], description: "Add link" },
      { keys: ["Tab"], description: "Next field" },
      { keys: ["Shift", "Tab"], description: "Previous field" },
      { keys: ["Ctrl", "P"], description: "Preview" },
    ],
  },
  {
    id: "navigation",
    label: "Navigation",
    icon: ArrowLeft,
    shortcuts: [
      { keys: ["G", "H"], description: "Go to Home" },
      { keys: ["G", "V"], description: "Go to Videos" },
      { keys: ["G", "S"], description: "Go to Subscriptions" },
      { keys: ["G", "L"], description: "Go to Liked Videos" },
      { keys: ["G", "P"], description: "Go to Playlists" },
      { keys: ["G", "M"], description: "Go to Messages" },
      { keys: ["G", "C"], description: "Go to My Channel" },
      { keys: ["/"], description: "Focus search" },
    ],
  },
  {
    id: "general",
    label: "General",
    icon: Command,
    shortcuts: [
      { keys: ["?"], description: "Show keyboard shortcuts" },
      { keys: ["Esc"], description: "Close modal / Sidebar" },
      { keys: ["Ctrl", "K"], description: "Quick search" },
      { keys: ["Ctrl", "N"], description: "New upload" },
      { keys: ["Ctrl", "D"], description: "Watch later" },
      { keys: ["L"], description: "Like video" },
      { keys: ["D"], description: "Unlike video" },
      { keys: ["S"], description: "Subscribe" },
    ],
  },
];

const KEY_DISPLAY: Record<string, string> = {
  Space: "Space",
  Enter: "Enter",
  Escape: "Esc",
  ArrowLeft: "←",
  ArrowRight: "→",
  ArrowUp: "↑",
  ArrowDown: "↓",
  Tab: "Tab",
  Backspace: "⌫",
  Control: "Ctrl",
  Meta: "⌘",
  Shift: "Shift",
  Alt: "Alt",
};

function ShortcutKey({ keys }: { keys: string[] }) {
  return (
    <div className="flex items-center gap-1">
      {keys.map((key, index) => (
        <span key={index} className="flex items-center">
          {index > 0 && (
            <span className="text-zinc-600 mx-1 text-xs">+</span>
          )}
          <kbd className="min-w-[24px] px-2 py-1 text-xs bg-zinc-700/80 border border-zinc-600/50 rounded-md text-zinc-200 font-mono text-center shadow-sm">
            {KEY_DISPLAY[key] || key}
          </kbd>
        </span>
      ))}
    </div>
  );
}

export function KeyboardShortcuts() {
  const [isOpen, setIsOpen] = useState(false);
  const [activeCategory, setActiveCategory] = useState("video");

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === "Escape") {
      setIsOpen(false);
    }
    if (e.key === "?" && !e.ctrlKey && !e.metaKey && !e.altKey) {
      const target = e.target as HTMLElement;
      if (target.tagName !== "INPUT" && target.tagName !== "TEXTAREA" && !target.isContentEditable) {
        e.preventDefault();
        setIsOpen(true);
      }
    }
  }, []);

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  const currentCategory = CATEGORIES.find(c => c.id === activeCategory);

  return (
    <>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setIsOpen(true)}
        className="gap-2 text-zinc-400 hover:text-white hover:bg-zinc-800"
      >
        <Keyboard className="w-4 h-4" />
        <span className="hidden sm:inline">Shortcuts</span>
        <kbd className="hidden sm:inline-flex items-center gap-1 px-1.5 py-0.5 text-xs bg-zinc-800 border border-zinc-700 rounded">
          ?
        </kbd>
      </Button>

      {isOpen && (
        <div 
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsOpen(false);
          }}
        >
          <div className="w-full max-w-4xl bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="p-4 border-b border-zinc-800 flex items-center justify-between bg-gradient-to-r from-zinc-900 to-zinc-800/50">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-orange-500/20 rounded-lg">
                  <Keyboard className="w-5 h-5 text-orange-500" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-white">Keyboard Shortcuts</h2>
                  <p className="text-xs text-zinc-400">Press ? to toggle this dialog</p>
                </div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex border-b border-zinc-800">
              {CATEGORIES.map((category) => (
                <button
                  key={category.id}
                  onClick={() => setActiveCategory(category.id)}
                  className={cn(
                    "flex items-center gap-2 px-4 py-3 text-sm font-medium transition-all border-b-2",
                    activeCategory === category.id
                      ? "text-orange-500 border-orange-500 bg-orange-500/10"
                      : "text-zinc-400 border-transparent hover:text-zinc-300 hover:bg-zinc-800/50"
                  )}
                >
                  <category.icon className="w-4 h-4" />
                  {category.label}
                </button>
              ))}
            </div>

            <div className="p-4 max-h-[400px] overflow-y-auto">
              <div className="grid gap-3 sm:grid-cols-2">
                {currentCategory?.shortcuts.map((shortcut, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 rounded-xl bg-zinc-800/50 hover:bg-zinc-800 transition-all border border-zinc-700/50 hover:border-zinc-600"
                  >
                    <span className="text-sm text-zinc-300">{shortcut.description}</span>
                    <ShortcutKey keys={shortcut.keys} />
                  </div>
                ))}
              </div>
            </div>

            <div className="p-4 border-t border-zinc-800 bg-zinc-900/50">
              <div className="flex items-center justify-between text-xs text-zinc-500">
                <div className="flex items-center gap-2">
                  <kbd className="px-1.5 py-0.5 bg-zinc-800 border border-zinc-700 rounded text-zinc-400">?</kbd>
                  <span>Press anytime to open</span>
                </div>
                <div className="flex items-center gap-2">
                  <kbd className="px-1.5 py-0.5 bg-zinc-800 border border-zinc-700 rounded text-zinc-400">Esc</kbd>
                  <span>to close</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}