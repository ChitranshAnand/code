
'use client';

interface HowItWorksItemProps {
  number: number;
  title: string;
  description: string;
}

export default function HowItWorksItem({ number, title, description }: HowItWorksItemProps) {
  return (
    <div className="flex flex-col items-center text-center">
      <div className="w-12 h-12 bg-white/20 backdrop-blur-xl rounded-2xl flex items-center justify-center mb-4 shadow-lg">
        <span className="text-white text-lg font-bold font-inter">{number}</span>
      </div>
      <h3 className="text-white font-semibold text-lg mb-2 font-inter">{title}</h3>
      <p className="text-white/80 text-sm font-inter leading-relaxed max-w-48">{description}</p>
    </div>
  );
}
