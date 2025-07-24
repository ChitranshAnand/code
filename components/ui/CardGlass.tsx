
'use client';

interface CardGlassProps {
  children: React.ReactNode;
  className?: string;
}

export default function CardGlass({ children, className = '' }: CardGlassProps) {
  return (
    <div className={`bg-white/20 backdrop-blur-xl border border-white/30 rounded-3xl shadow-[0_8px_32px_0_rgba(31,38,135,0.37)] ${className}`}>
      {children}
    </div>
  );
}
