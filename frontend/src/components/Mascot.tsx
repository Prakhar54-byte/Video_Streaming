"use client";
import React from 'react';

interface MascotProps {
  state: 'idle' | 'learning' | 'celebrating' | 'error';
  level: number;
  type?: 'dog' | 'cat' | 'fox' | 'robot' | 'bunny';
}

const PET_EMOJIS = {
  dog: '🐕',
  cat: '🐱',
  fox: '🦊',
  robot: '🤖',
  bunny: '🐰',
};

export const Mascot: React.FC<MascotProps> = ({ state, level, type = 'dog' }) => {
  const emoji = PET_EMOJIS[type] || '🐕';

  return (
    <div className="flex flex-col items-center justify-center p-4">
      <div className="relative group cursor-pointer">
        {/* Glow effect */}
        <div className="absolute inset-0 bg-primary blur-2xl opacity-20 rounded-full animate-pulse group-hover:opacity-40 transition-opacity"></div>
        
        {/* Mascot Face/Body using Emoji with CSS animations */}
        <div className={`text-8xl relative z-10 select-none transition-transform duration-300 group-hover:scale-110 
          ${state === 'learning' ? 'animate-bounce' : ''}
          ${state === 'celebrating' ? 'animate-bounce' : ''}
          ${state === 'error' ? 'rotate-12' : ''}
        `}>
          {emoji}
        </div>

        {/* Level Badge */}
        <div className="absolute -bottom-2 -right-2 bg-primary text-primary-foreground text-xs font-bold px-2 py-0.5 rounded-full border-2 border-[#080a0f] z-20">
          Lv.{level}
        </div>
      </div>
      
      <div className="mt-6 bg-white/5 border border-white/10 px-4 py-1.5 rounded-full flex items-center gap-2">
        <div className={`w-2 h-2 rounded-full ${state === 'idle' ? 'bg-blue-400' : 'bg-primary animate-ping'}`}></div>
        <span className="text-xs font-bold text-white uppercase tracking-wider">
          {state === 'idle' ? 'Resting' : state === 'learning' ? 'Processing Code' : state.toUpperCase()}
        </span>
      </div>
    </div>
  );
};
