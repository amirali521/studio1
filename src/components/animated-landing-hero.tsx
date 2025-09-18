
import { cn } from "@/lib/utils";

interface AnimatedLandingHeroProps extends React.SVGProps<SVGSVGElement> {}

export default function AnimatedLandingHero({ className, ...props }: AnimatedLandingHeroProps) {
  return (
    <svg
      viewBox="0 0 500 300"
      xmlns="http://www.w3.org/2000/svg"
      className={cn("bg-transparent w-full h-auto", className)}
      {...props}
    >
      <defs>
        <linearGradient id="hero-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="hsl(var(--primary))" />
          <stop offset="100%" stopColor="hsl(var(--accent))" />
        </linearGradient>
         <linearGradient id="chart-gradient" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="hsl(var(--primary) / 0.5)" />
          <stop offset="100%" stopColor="hsl(var(--primary) / 0)" />
        </linearGradient>
        <filter id="hero-shadow" height="130%">
          <feGaussianBlur in="SourceAlpha" stdDeviation="5"/>
          <feOffset dx="0" dy="4" result="offsetblur"/>
          <feComponentTransfer>
            <feFuncA type="linear" slope="0.2"/>
          </feComponentTransfer>
          <feMerge> 
            <feMergeNode/>
            <feMergeNode in="SourceGraphic"/> 
          </feMerge>
        </filter>
      </defs>

      {/* Main Dashboard Panel */}
      <g style={{ filter: 'url(#hero-shadow)' }}>
        <rect x="50" y="30" width="400" height="240" rx="12" fill="hsl(var(--card))" stroke="hsl(var(--border))" strokeWidth="1"/>
        
        {/* Header */}
        <rect x="50" y="30" width="400" height="40" rx="0" fill="hsl(var(--muted)/0.5)" />
        <line x1="50" y1="70" x2="450" y2="70" stroke="hsl(var(--border))" />
        <circle cx="70" cy="50" r="6" fill="#ef4444" />
        <circle cx="90" cy="50" r="6" fill="#f59e0b" />
        <circle cx="110" cy="50" r="6" fill="#22c55e" />

        {/* Main Content Area */}
        <rect x="65" y="85" width="370" height="170" rx="8" fill="hsl(var(--background))" stroke="hsl(var(--border))"/>

        {/* Animated Chart */}
        <g transform="translate(80, 100)">
          <rect width="200" height="100" fill="hsl(var(--muted)/0.2)" rx="4" />
           <path d="M 0 80 L 30 60 L 60 70 L 90 40 L 120 50 L 150 20 L 180 30" fill="none" stroke="url(#hero-gradient)" strokeWidth="2" />
           <path d="M 0 80 L 30 60 L 60 70 L 90 40 L 120 50 L 150 20 L 180 30 V 100 H 0 Z" fill="url(#chart-gradient)" />
            <style>
              {`
                @keyframes chart-path {
                  0% { d: path("M 0 80 L 30 60 L 60 70 L 90 40 L 120 50 L 150 20 L 180 30"); }
                  50% { d: path("M 0 50 L 30 70 L 60 60 L 90 80 L 120 30 L 150 40 L 180 20"); }
                  100% { d: path("M 0 80 L 30 60 L 60 70 L 90 40 L 120 50 L 150 20 L 180 30"); }
                }
                #chart-path {
                  animation: chart-path 8s ease-in-out infinite;
                }
              `}
            </style>
           <path id="chart-path" d="M 0 80 L 30 60 L 60 70 L 90 40 L 120 50 L 150 20 L 180 30" fill="none" stroke="url(#hero-gradient)" strokeWidth="2" />

        </g>
      </g>

      {/* Floating Product Card 1 */}
      <g className="animate-float" style={{ animationDelay: '0s', filter: 'url(#hero-shadow)' }}>
        <rect x="300" y="90" width="120" height="50" rx="8" fill="hsl(var(--card))" stroke="hsl(var(--border))"/>
        <rect x="310" y="100" width="20" height="20" rx="4" fill="hsl(var(--primary)/0.5)" />
        <rect x="335" y="103" width="70" height="6" rx="2" fill="hsl(var(--muted-foreground)/0.3)" />
        <rect x="335" y="115" width="40" height="6" rx="2" fill="hsl(var(--muted-foreground)/0.2)" />
      </g>

      {/* Floating Product Card 2 */}
       <g className="animate-float-sm" style={{ animationDelay: '1s', filter: 'url(#hero-shadow)' }}>
        <rect x="290" y="150" width="140" height="60" rx="8" fill="hsl(var(--card))" stroke="hsl(var(--border))"/>
        <rect x="300" y="160" width="30" height="30" rx="4" fill="hsl(var(--accent)/0.8)" />
        <rect x="335" y="165" width="80" height="8" rx="2" fill="hsl(var(--muted-foreground)/0.4)" />
        <rect x="335" y="180" width="50" height="8" rx="2" fill="hsl(var(--muted-foreground)/0.2)" />
      </g>

      {/* Floating Scanner Icon */}
      <g transform="translate(90, 220)" className="animate-float" style={{ animationDelay: '0.5s', filter: 'url(#hero-shadow)' }}>
        <circle cx="0" cy="0" r="25" fill="hsl(var(--card))" stroke="hsl(var(--border))" strokeWidth="1" />
        <path d="M -9 -5 L -12 -5 L -12 5 L 12 5 L 12 -5 L 9 -5 L 6 -10 L -6 -10 Z" fill="none" stroke="url(#hero-gradient)" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
        <circle cx="0" cy="0" r="4" fill="none" stroke="url(#hero-gradient)" strokeWidth="2" />
      </g>
    </svg>
  );
}
