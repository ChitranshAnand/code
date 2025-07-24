
'use client';

import { useState } from 'react';
import CardGlass from './CardGlass';

interface AccordionItemProps {
  title: string;
  content: string;
  isExpanded: boolean;
  onToggle: () => void;
}

export default function AccordionItem({ title, content, isExpanded, onToggle }: AccordionItemProps) {
  return (
    <CardGlass className="mb-4 overflow-hidden">
      <button
        onClick={onToggle}
        className="w-full p-8 flex items-center justify-between text-left hover:bg-white/10 transition-colors duration-200"
      >
        <h3 className="text-white font-semibold text-xl font-inter">{title}</h3>
        <i className={`ri-arrow-${isExpanded ? 'up' : 'down'}-s-line text-white text-2xl transition-transform duration-300`}></i>
      </button>
      {isExpanded && (
        <div className="px-8 pb-8 pt-0">
          <p className="text-white/80 text-base font-inter leading-relaxed">{content}</p>
        </div>
      )}
    </CardGlass>
  );
}
