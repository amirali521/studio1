
import { cn } from "@/lib/utils";

interface AnimatedAnalyticsBackgroundProps extends React.SVGProps<SVGSVGElement> {}

export default function AnimatedAnalyticsBackground({ className, ...props }: AnimatedAnalyticsBackgroundProps) {
  return (
    <svg
      viewBox="0 0 800 600"
      xmlns="http://www.w3.org/2000/svg"
      className={cn("w-full h-full", className)}
      preserveAspectRatio="xMidYMid slice"
      {...props}
    >
      <defs>
        <linearGradient id="bg-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="hsl(var(--background))" stopOpacity="0" />
          <stop offset="100%" stopColor="hsl(var(--background))" stopOpacity="0.5" />
        </linearGradient>
        <linearGradient id="bar-gradient" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="hsl(var(--primary) / 0.6)" />
          <stop offset="100%" stopColor="hsl(var(--primary) / 0.1)" />
        </linearGradient>
         <linearGradient id="accent-gradient" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="hsl(var(--accent) / 0.8)" />
          <stop offset="100%" stopColor="hsl(var(--accent) / 0.2)" />
        </linearGradient>
        <style>
          {`
            @keyframes growBar1 {
              0%, 100% { height: 150px; y: 350px; }
              50% { height: 200px; y: 300px; }
            }
            @keyframes growBar2 {
              0%, 100% { height: 250px; y: 250px; }
              50% { height: 220px; y: 280px; }
            }
            @keyframes growBar3 {
              0%, 100% { height: 180px; y: 320px; }
              50% { height: 250px; y: 250px; }
            }
            @keyframes drawPath {
              from { stroke-dashoffset: 1000; }
              to { stroke-dashoffset: 0; }
            }
             @keyframes floatDot {
              0%, 100% { transform: translateY(0); }
              50% { transform: translateY(-10px); }
            }
          `}
        </style>
      </defs>

      {/* Grid Lines */}
      <g stroke="hsl(var(--border) / 0.5)" strokeWidth="1">
        {[...Array(20)].map((_, i) => (
          <line key={`h-${i}`} x1="0" y1={i * 50} x2="800" y2={i * 50} />
        ))}
        {[...Array(20)].map((_, i) => (
          <line key={`v-${i}`} x1={i * 50} y1="0" x2={i * 50} y2="600" />
        ))}
      </g>
      
      {/* Animated Bars */}
      <g>
        <rect x="100" width="80" rx="8" fill="url(#bar-gradient)" style={{ animation: 'growBar1 12s ease-in-out infinite' }} />
        <rect x="220" width="80" rx="8" fill="url(#bar-gradient)" style={{ animation: 'growBar2 12s ease-in-out infinite', animationDelay: '2s' }} />
        <rect x="340" width="80" rx="8" fill="url(#bar-gradient)" style={{ animation: 'growBar3 12s ease-in-out infinite', animationDelay: '4s' }} />
      </g>
      
      {/* Animated Line Path */}
      <path
        d="M 450 400 C 500 350, 550 250, 600 280 S 700 350, 750 320"
        fill="none"
        stroke="hsl(var(--accent))"
        strokeWidth="4"
        strokeDasharray="1000"
        style={{ animation: 'drawPath 8s ease-in-out infinite alternate' }}
      />

       {/* Floating Dots */}
      <circle cx="500" cy="150" r="10" fill="hsl(var(--accent) / 0.8)" style={{ animation: 'floatDot 8s ease-in-out infinite', animationDelay: '1s' }} />
      <circle cx="650" cy="200" r="15" fill="hsl(var(--primary) / 0.5)" style={{ animation: 'floatDot 10s ease-in-out infinite', animationDelay: '3s' }} />
      <circle cx="200" cy="200" r="8" fill="hsl(var(--accent) / 0.6)" style={{ animation: 'floatDot 9s ease-in-out infinite', animationDelay: '2s' }}/>

      {/* Gradient Overlay to fade into background */}
      <rect x="0" y="0" width="800" height="600" fill="url(#bg-gradient)" />
    </svg>
  );
}
