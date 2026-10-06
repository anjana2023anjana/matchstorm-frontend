import React from 'react';
import type { ElementType, SpecialType } from '../../types/game.types';

interface TileProps {
  type: ElementType;
  special?: SpecialType;
  isSelected: boolean;
  isMatched?: boolean;
  onClick: () => void;
  onDoubleClick?: () => void;
  onTouchStart?: (e: React.TouchEvent) => void;
  onTouchMove?: (e: React.TouchEvent) => void;
  onTouchEnd?: (e: React.TouchEvent) => void;
  onDragStart?: (e: React.DragEvent) => void;
  onDragOver?: (e: React.DragEvent) => void;
  onDrop?: (e: React.DragEvent) => void;
}

export const TileComponent: React.FC<TileProps> = ({
  type,
  special,
  isSelected,
  isMatched = false,
  onClick,
  onDoubleClick,
  onTouchStart,
  onTouchMove,
  onTouchEnd,
  onDragStart,
  onDragOver,
  onDrop,
}) => {
  // If it's a COLOR BOMB: Render the iconic Rainbow Disco Ball / Chocolate with Sprinkles
  if (special === 'COLOR_BOMB') {
    return (
      <div
        onClick={onClick}
        onDoubleClick={onDoubleClick}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
        draggable
        onDragStart={onDragStart}
        onDragOver={onDragOver}
        onDrop={onDrop}
        className={`relative w-full h-full aspect-square rounded-full flex items-center justify-center cursor-pointer select-none touch-none candy-tile-gpu border-2 border-amber-300/80 shadow-[0_0_18px_rgba(251,191,36,0.8),inset_0_2px_6px_rgba(255,255,255,0.7)] bg-gradient-to-tr from-amber-950 via-yellow-700 to-amber-900 transition-transform duration-150 animate-[spin_12s_linear_infinite] ${
          isMatched
            ? 'scale-150 opacity-0 brightness-200 rotate-90 transition-all duration-200'
            : isSelected
            ? 'scale-110 ring-4 ring-yellow-300 ring-offset-2 ring-offset-slate-900 z-20 animate-pulse'
            : 'hover:scale-105 active:scale-95'
        }`}
      >
        {/* Rainbow Sprinkles on Chocolate Ball */}
        <span className="absolute -top-1 w-2.5 h-2.5 rounded-full bg-rose-500 shadow-sm shadow-rose-300 animate-pulse" />
        <span className="absolute -bottom-0.5 right-1 w-2 h-2 rounded-full bg-cyan-400 shadow-sm shadow-cyan-200" />
        <span className="absolute top-2 -left-1 w-2 h-2 rounded-full bg-emerald-400 shadow-sm shadow-emerald-200" />
        <span className="absolute bottom-2 -left-0.5 w-2 h-2 rounded-full bg-purple-400 shadow-sm shadow-purple-200" />
        <span className="absolute top-1 -right-0.5 w-2 h-2 rounded-full bg-amber-300 shadow-sm shadow-amber-200" />

        {/* Center Disco Star */}
        <span className="text-xl md:text-2xl drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] filter">
          🌈
        </span>
      </div>
    );
  }

  // Candy Styling Configs with 3D Glossy Highlights
  const getCandyConfig = (el: ElementType) => {
    switch (el) {
      case 'FIRE':
        return {
          bg: 'bg-gradient-to-b from-red-400 via-rose-500 to-red-700',
          border: 'border-rose-300/40',
          shadow: 'shadow-[0_4px_12px_rgba(225,29,72,0.55),inset_0_2px_4px_rgba(255,255,255,0.6),inset_0_-3px_4px_rgba(0,0,0,0.35)]',
          shape: 'rounded-2xl',
          icon: '🍓',
        };
      case 'WATER':
        return {
          bg: 'bg-gradient-to-b from-sky-300 via-blue-500 to-indigo-700',
          border: 'border-sky-200/50',
          shadow: 'shadow-[0_4px_12px_rgba(37,99,235,0.55),inset_0_2px_4px_rgba(255,255,255,0.7),inset_0_-3px_4px_rgba(0,0,0,0.35)]',
          shape: 'rounded-full',
          icon: '🍬',
        };
      case 'EARTH':
        return {
          bg: 'bg-gradient-to-b from-emerald-300 via-green-500 to-emerald-800',
          border: 'border-emerald-200/40',
          shadow: 'shadow-[0_4px_12px_rgba(16,185,129,0.55),inset_0_2px_4px_rgba(255,255,255,0.6),inset_0_-3px_4px_rgba(0,0,0,0.35)]',
          shape: 'rounded-xl',
          icon: '🍏',
        };
      case 'ELECTRIC':
        return {
          bg: 'bg-gradient-to-b from-amber-200 via-yellow-400 to-amber-600',
          border: 'border-yellow-100/50',
          shadow: 'shadow-[0_4px_12px_rgba(245,158,11,0.55),inset_0_2px_4px_rgba(255,255,255,0.8),inset_0_-3px_4px_rgba(0,0,0,0.3)]',
          shape: 'rounded-2xl',
          icon: '🍋',
        };
      case 'SHIELD':
        return {
          bg: 'bg-gradient-to-b from-fuchsia-300 via-purple-600 to-purple-900',
          border: 'border-purple-300/40',
          shadow: 'shadow-[0_4px_12px_rgba(147,51,234,0.55),inset_0_2px_4px_rgba(255,255,255,0.6),inset_0_-3px_4px_rgba(0,0,0,0.35)]',
          shape: 'rounded-2xl',
          icon: '🍇',
        };
    }
  };

  const candy = getCandyConfig(type);

  return (
    <div
      onClick={onClick}
      onDoubleClick={onDoubleClick}
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
      draggable
      onDragStart={onDragStart}
      onDragOver={onDragOver}
      onDrop={onDrop}
      className={`relative w-full h-full aspect-square flex items-center justify-center cursor-pointer select-none touch-none candy-tile-gpu border transition-transform duration-150 ${
        candy.shape
      } ${candy.bg} ${candy.border} ${candy.shadow} ${
        isMatched
          ? 'scale-125 opacity-0 brightness-150 rotate-45 transition-all duration-200'
          : isSelected
          ? 'scale-110 ring-4 ring-yellow-300 ring-offset-2 ring-offset-slate-900 z-20 animate-pulse shadow-yellow-500/50 shadow-xl'
          : 'hover:scale-105 active:scale-95'
      }`}
    >
      {/* Visual tap again to blast indicator for specials */}
      {isSelected && special && (
        <span className="absolute -top-3.5 bg-gradient-to-r from-yellow-300 to-amber-500 text-slate-950 font-black text-[9px] px-1.5 py-0.5 rounded-full shadow-lg z-30 pointer-events-none whitespace-nowrap animate-bounce border border-yellow-100">
          TAP BLAST 💥
        </span>
      )}

      {/* Gloss Specular Highlight (The Candy Shine) */}
      <span className="absolute top-1 left-2 w-4 h-2 bg-white/60 rounded-full blur-[0.4px] pointer-events-none transform -rotate-12" />
      <span className="absolute top-2 right-2 w-1.5 h-1.5 bg-white/40 rounded-full blur-[0.3px] pointer-events-none" />

      {/* Special Rocket Stripes (Horizontal or Vertical) */}
      {special === 'ROW_ROCKET' && (
        <div className="absolute inset-0 flex flex-col justify-evenly pointer-events-none opacity-85">
          <div className="w-full h-1 bg-white shadow-sm shadow-white" />
          <div className="w-full h-1 bg-white shadow-sm shadow-white" />
          <div className="w-full h-1 bg-white shadow-sm shadow-white" />
        </div>
      )}
      {special === 'COL_ROCKET' && (
        <div className="absolute inset-0 flex justify-evenly pointer-events-none opacity-85">
          <div className="h-full w-1 bg-white shadow-sm shadow-white" />
          <div className="h-full w-1 bg-white shadow-sm shadow-white" />
          <div className="h-full w-1 bg-white shadow-sm shadow-white" />
        </div>
      )}

      {/* Special Wrapped Bomb Glow */}
      {special === 'BOMB' && (
        <div className="absolute -inset-1 border-2 border-dashed border-yellow-300 rounded-2xl animate-spin pointer-events-none opacity-90" />
      )}

      {/* Candy Center Icon */}
      <span className="text-xl md:text-2xl drop-shadow-[0_2px_3px_rgba(0,0,0,0.5)] transform active:scale-90 transition-transform pointer-events-none">
        {special === 'BOMB' ? '💣' : special === 'ROW_ROCKET' || special === 'COL_ROCKET' ? '🚀' : candy.icon}
      </span>
    </div>
  );
};