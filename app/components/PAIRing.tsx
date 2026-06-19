'use client';

interface PAIRingProps {
  current: number;
  goal: number;
  size?: number;
}

export default function PAIRing({ current, goal, size = 220 }: PAIRingProps) {
  const radius = 80;
  const circumference = 2 * Math.PI * radius;
  const progress = Math.min(current / goal, 1);
  const offset = circumference - progress * circumference;
  const center = size / 2;

  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        {/* Hintergrund-Ring */}
        <circle cx={center} cy={center} r={radius} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="16" />
        {/* Fortschritt */}
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke="url(#glowGradient)"
          strokeWidth="16"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="ring-animate"
          style={{ filter: 'drop-shadow(0 0 10px rgba(255,107,138,0.55))' }}
        />
        <defs>
          <linearGradient id="glowGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#ff6b8a" />
            <stop offset="100%" stopColor="#ff8c69" />
          </linearGradient>
        </defs>
      </svg>
      {/* Mittiger Text */}
      <div className="absolute flex flex-col items-center justify-center">
        <span className="text-6xl font-bold tracking-tight grad-text">{Math.round(current)}</span>
        <span className="text-sm mt-1" style={{ color: 'var(--muted)' }}>von {goal} Punkten</span>
        {progress >= 1 && (
          <span className="text-xs mt-1 font-semibold" style={{ color: 'var(--accent)' }}>Ziel erreicht ✓</span>
        )}
      </div>
    </div>
  );
}
