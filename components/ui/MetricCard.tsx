
'use client';

import CardGlass from './CardGlass';

interface MetricCardProps {
  title: string;
  value: string;
  description: string;
  color: string;
  icon: string;
}

export default function MetricCard({ title, value, description, color, icon }: MetricCardProps) {
  return (
    <CardGlass className="p-6 hover:scale-[1.02] transition-all duration-300 cursor-pointer hover:shadow-[0_8px_32px_0_rgba(31,38,135,0.5)]">
      <div className="flex items-start justify-between mb-4">
        <div className={`w-12 h-12 flex items-center justify-center rounded-2xl ${color} shadow-lg`}>
          <i className={`${icon} text-white text-xl`}></i>
        </div>
        <span className="text-3xl font-bold text-white font-inter">{value}</span>
      </div>
      <h3 className="text-white font-semibold text-lg mb-2 font-inter">{title}</h3>
      <p className="text-white/70 text-sm font-inter leading-relaxed">{description}</p>
    </CardGlass>
  );
}
