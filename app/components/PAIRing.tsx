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
        {/* Background ring */}
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke="#1a1a2e"
          strokeWidth="14"
        />
        {/* Glow effect */}
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke="url(#glowGradient)"
          strokeWidth="14"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="ring-animate"
          style={{ filter: 'drop-shadow(0 0 8px #ff6b8a)' }}
        />
        <defs>
          <linearGradient id="glowGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#ff6b8a" />
            <stop offset="100%" stopColor="#ff8c69" />
          </linearGradient>
        </defs>
      </svg>
      {/* Center text */}
      <div className="absolute flex flex-col items-center justify-center">
        <span className="text-5xl font-bold tracking-tight" style={{ color: '#f0f0f0' }}>
          {Math.round(current)}
        </span>
        <span className="text-sm mt-1" style={{ color: '#8888aa' }}>
          von {goal} PAI
        </span>
        {progress >= 1 && (
          <span className="text-xs mt-1" style={{ color: '#ff6b8a' }}>Ziel erreicht ✓</span>
        )}
      </div>
    </div>
  );
}
