
'use client';

interface GaugeProps {
  value: number;
  title: string;
  max?: number;
}

export default function Gauge({ value, title, max = 100 }: GaugeProps) {
  const percentage = (value / max) * 100;
  const circumference = 2 * Math.PI * 90;
  const strokeDasharray = `${(percentage / 100) * circumference} ${circumference}`;

  return (
    <div className="flex flex-col items-center">
      <div className="relative w-56 h-56">
        <svg className="w-full h-full transform -rotate-90" viewBox="0 0 220 220">
          <circle
            cx="110"
            cy="110"
            r="90"
            fill="none"
            stroke="rgba(255,255,255,0.1)"
            strokeWidth="12"
          />
          <circle
            cx="110"
            cy="110"
            r="90"
            fill="none"
            stroke="url(#gradient)"
            strokeWidth="12"
            strokeDasharray={strokeDasharray}
            strokeLinecap="round"
            className="transition-all duration-1000 drop-shadow-lg"
          />
          <defs>
            <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#4DB4FF" />
              <stop offset="50%" stopColor="#FF7BC8" />
              <stop offset="100%" stopColor="#7B5DFF" />
            </linearGradient>
          </defs>
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-5xl font-bold text-white font-inter drop-shadow-lg">{value}</span>
          <span className="text-lg text-white/70 font-inter">/ {max}</span>
        </div>
      </div>
      <h3 className="text-white font-semibold text-xl mt-6 font-inter">{title}</h3>
    </div>
  );
}
