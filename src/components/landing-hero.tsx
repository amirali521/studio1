
import { cn } from "@/lib/utils";

interface LandingHeroProps extends React.SVGProps<SVGSVGElement> {}

export default function LandingHero({ className, ...props }: LandingHeroProps) {
  return (
    <svg
      viewBox="0 0 400 220"
      xmlns="http://www.w3.org/2000/svg"
      className={cn("bg-background", className)}
      {...props}
    >
      <defs>
        <linearGradient id="grad1" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity="0.8" />
          <stop offset="100%" stopColor="hsl(var(--accent))" stopOpacity="0.8" />
        </linearGradient>
        <filter id="dropshadow" height="130%">
            <feGaussianBlur in="SourceAlpha" stdDeviation="3"/>
            <feOffset dx="2" dy="2" result="offsetblur"/>
            <feComponentTransfer>
                <feFuncA type="linear" slope="0.3"/>
            </feComponentTransfer>
            <feMerge> 
                <feMergeNode/>
                <feMergeNode in="SourceGraphic"/> 
            </feMerge>
        </filter>
      </defs>
      
      {/* Background shapes */}
      <rect width="400" height="220" fill="hsl(var(--background))" />
      
      {/* Main card */}
      <rect x="20" y="20" width="360" height="180" rx="12" fill="hsl(var(--card))" stroke="hsl(var(--border))" strokeWidth="1" style={{filter: 'url(#dropshadow)'}}/>

      {/* Left panel - QR Code style */}
      <g>
        <rect x="40" y="40" width="80" height="80" fill="hsl(var(--primary))" rx="4"/>
        <rect x="48" y="48" width="16" height="16" fill="hsl(var(--card))" rx="2"/>
        <rect x="48" y="88" width="16" height="16" fill="hsl(var(--card))" rx="2"/>
        <rect x="80" y="48" width="16" height="16" fill="hsl(var(--card))" rx="2"/>
        
        <rect x="72" y="72" width="32" height="32" fill="hsl(var(--card))" rx="2"/>
        <rect x="105" y="45" width="5" height="5" fill="hsl(var(--card))"/>
        <rect x="105" y="55" width="5" height="5" fill="hsl(var(--card))"/>
        <rect x="68" y="45" width="5" height="5" fill="hsl(var(--card))"/>
        <rect x="68" y="65" width="5" height="5" fill="hsl(var(--card))"/>
      </g>
      
      {/* Right Panel - Chart style */}
      <g>
        {/* Title */}
        <rect x="140" y="40" width="100" height="12" fill="hsl(var(--muted))" rx="4"/>
        
        {/* Bars */}
        <rect x="140" y="70" width="25" height="50" fill="hsl(var(--primary))" opacity="0.3" rx="3"/>
        <rect x="175" y="85" width="25" height="35" fill="hsl(var(--primary))" opacity="0.5" rx="3"/>
        <rect x="210" y="60" width="25" height="60" fill="hsl(var(--primary))" opacity="0.7" rx="3"/>
        <rect x="245" y="90" width="25" height="30" fill="hsl(var(--primary))" rx="3"/>
        
        {/* Axis */}
        <rect x="140" y="120" width="130" height="2" fill="hsl(var(--border))" />
      </g>
      
      {/* Bottom section - list items */}
      <g>
        <rect x="40" y="140" width="320" height="2" fill="hsl(var(--border))" />
        
        {/* Item 1 */}
        <circle cx="50" cy="160" r="6" fill="hsl(var(--accent))" opacity="0.5"/>
        <rect x="65" y="155" width="120" height="10" fill="hsl(var(--muted))" rx="3"/>
        <rect x="320" y="155" width="40" height="10" fill="hsl(var(--muted))" rx="3"/>

        {/* Item 2 */}
        <circle cx="50" cy="180" r="6" fill="hsl(var(--accent))" opacity="0.7"/>
        <rect x="65" y="175" width="90" height="10" fill="hsl(var(--muted))" rx="3"/>
        <rect x="320" y="175" width="40" height="10" fill="hsl(var(--muted))" rx="3"/>
      </g>
      
       {/* Floating action button */}
       <circle cx="340" cy="165" r="25" fill="url(#grad1)" style={{filter: 'url(#dropshadow)'}}/>
       <path d="M 335 160 L 345 160 L 345 170 L 335 170 Z M 335 160 L 330 155 M 345 170 L 350 175" stroke="hsl(var(--primary-foreground))" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
       <path d="M 335 160 L 330 165 M 345 170 L 340 175" stroke="hsl(var(--primary-foreground))" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}
