
import { cn } from "@/lib/utils";

interface LandingHeroProps extends React.SVGProps<SVGSVGElement> {}

export default function LandingHero({ className, ...props }: LandingHeroProps) {
  return (
    <svg
      viewBox="0 0 500 300"
      xmlns="http://www.w3.org/2000/svg"
      className={cn("bg-transparent", className)}
      {...props}
    >
      <defs>
        <linearGradient id="hero-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="hsl(var(--primary))" />
          <stop offset="100%" stopColor="hsl(var(--accent))" />
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

      {/* Main card - POS */}
      <g style={{ filter: 'url(#hero-shadow)' }}>
        <rect x="50" y="30" width="400" height="240" rx="12" fill="hsl(var(--card))" stroke="hsl(var(--border))" strokeWidth="1"/>
        
        {/* Header */}
        <rect x="50" y="30" width="400" height="40" rx="0" fill="hsl(var(--muted)/0.5)" />
         <line x1="50" y1="70" x2="450" y2="70" stroke="hsl(var(--border))" />
        <circle cx="70" cy="50" r="6" fill="#ef4444" />
        <circle cx="90" cy="50" r="6" fill="#f59e0b" />
        <circle cx="110" cy="50" r="6" fill="#22c55e" />

        {/* Left Panel - Item List */}
        <rect x="65" y="85" width="200" height="170" rx="8" fill="hsl(var(--background))" stroke="hsl(var(--border))"/>

        {/* Items */}
        <g>
          <rect x="75" y="95" width="180" height="30" rx="4" fill="hsl(var(--muted))" />
          <rect x="80" y="102" width="100" height="8" rx="2" fill="hsl(var(--muted-foreground)/0.2)" />
          <rect x="225" y="102" width="20" height="8" rx="2" fill="hsl(var(--muted-foreground)/0.2)" />
        </g>
        <g>
          <rect x="75" y="135" width="180" height="30" rx="4" fill="hsl(var(--primary)/0.9)" />
          <rect x="80" y="142" width="80" height="8" rx="2" fill="hsl(var(--primary-foreground)/0.8)" />
          <rect x="225" y="142" width="20" height="8" rx="2" fill="hsl(var(--primary-foreground)/0.8)" />
        </g>
         <g>
          <rect x="75" y="175" width="180" height="30" rx="4" fill="hsl(var(--muted))" />
          <rect x="80" y="182" width="120" height="8" rx="2" fill="hsl(var(--muted-foreground)/0.2)" />
          <rect x="225" y="182" width="20" height="8" rx="2" fill="hsl(var(--muted-foreground)/0.2)" />
        </g>

         {/* Right Panel - Total & Action */}
        <rect x="280" y="85" width="155" height="170" rx="8" fill="hsl(var(--background))" stroke="hsl(var(--border))" />
        <rect x="290" y="95" width="80" height="10" rx="3" fill="hsl(var(--muted-foreground)/0.3)" />
        <rect x="290" y="120" width="135" height="25" rx="4" fill="hsl(var(--muted-foreground)/0.1)" />
        
        {/* Divider */}
        <line x1="290" y1="160" x2="425" y2="160" stroke="hsl(var(--border))" strokeWidth="1" />

        {/* Finalize Button */}
        <rect x="290" y="175" width="135" height="40" rx="6" fill="url(#hero-gradient)" />
        <text x="357.5" y="200" textAnchor="middle" fill="hsl(var(--primary-foreground))" fontSize="12" fontWeight="bold">Finalize</text>

        {/* Floating camera icon */}
        <g transform="translate(230, 220)">
            <circle cx="0" cy="0" r="25" fill="hsl(var(--card))" stroke="hsl(var(--border))" strokeWidth="1" />
            <path d="M -9 -5 L -12 -5 L -12 5 L 12 5 L 12 -5 L 9 -5 L 6 -10 L -6 -10 Z" fill="none" stroke="url(#hero-gradient)" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
            <circle cx="0" cy="0" r="4" fill="none" stroke="url(#hero-gradient)" strokeWidth="2" />
        </g>
      </g>
    </svg>
  );
}
