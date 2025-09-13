
import { cn } from "@/lib/utils";

interface LandingHeroProps extends React.SVGProps<SVGSVGElement> {}

export default function LandingHero({ className, ...props }: LandingHeroProps) {
  return (
    <svg
      viewBox="0 0 400 300"
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
      <rect width="400" height="300" fill="hsl(var(--background))" />
      
      {/* Main card */}
      <rect x="20" y="20" width="360" height="260" rx="12" fill="hsl(var(--card))" stroke="hsl(var(--border))" strokeWidth="1" style={{filter: 'url(#dropshadow)'}}/>

      {/* Left panel - QR Code style */}
      <g>
        <rect x="40" y="40" width="100" height="100" fill="hsl(var(--primary))" rx="4"/>
        <rect x="48" y="48" width="20" height="20" fill="hsl(var(--card))" rx="2"/>
        <rect x="48" y="92" width="20" height="20" fill="hsl(var(--card))" rx="2"/>
        <rect x="92" y="48" width="20" height="20" fill="hsl(var(--card))" rx="2"/>
        
        <rect x="80" y="80" width="40" height="40" fill="hsl(var(--card))" rx="2"/>
        <rect x="125" y="45" width="5" height="5" fill="hsl(var(--card))"/>
        <rect x="125" y="55" width="5" height="5" fill="hsl(var(--card))"/>
        <rect x="70" y="45" width="5" height="5" fill="hsl(var(--card))"/>
        <rect x="70" y="65" width="5" height="5" fill="hsl(var(--card))"/>
      </g>
      
      {/* Right Panel - Chart style */}
      <g>
        {/* Title */}
        <rect x="160" y="40" width="100" height="12" fill="hsl(var(--muted))" rx="4"/>
        
        {/* Bars */}
        <rect x="160" y="70" width="30" height="70" fill="hsl(var(--primary))" opacity="0.3" rx="3"/>
        <rect x="200" y="90" width="30" height="50" fill="hsl(var(--primary))" opacity="0.5" rx="3"/>
        <rect x="240" y="60" width="30" height="80" fill="hsl(var(--primary))" opacity="0.7" rx="3"/>
        <rect x="280" y="100" width="30" height="40" fill="hsl(var(--primary))" rx="3"/>
        
        {/* Axis */}
        <rect x="160" y="140" width="150" height="2" fill="hsl(var(--border))" />
      </g>
      
      {/* Bottom section - list items */}
      <g>
        <rect x="40" y="160" width="320" height="2" fill="hsl(var(--border))" />
        
        {/* Item 1 */}
        <circle cx="50" cy="185" r="8" fill="hsl(var(--accent))" opacity="0.5"/>
        <rect x="70" y="180" width="120" height="10" fill="hsl(var(--muted))" rx="3"/>
        <rect x="320" y="180" width="40" height="10" fill="hsl(var(--muted))" rx="3"/>

        {/* Item 2 */}
        <circle cx="50" cy="215" r="8" fill="hsl(var(--accent))" opacity="0.7"/>
        <rect x="70" y="210" width="90" height="10" fill="hsl(var(--muted))" rx="3"/>
        <rect x="320" y="210" width="40" height="10" fill="hsl(var(--muted))" rx="3"/>

        {/* Item 3 */}
        <circle cx="50" cy="245" r="8" fill="hsl(var(--accent))" />
        <rect x="70" y="240" width="150" height="10" fill="hsl(var(--muted))" rx="3"/>
        <rect x="320" y="240" width="40" height="10" fill="hsl(var(--muted))" rx="3"/>
      </g>
      
       {/* Floating action button */}
       <circle cx="340" cy="250" r="25" fill="url(#grad1)" style={{filter: 'url(#dropshadow)'}}/>
       <path d="M 335 245 L 345 245 L 345 255 L 335 255 Z M 335 245 L 330 240 M 345 255 L 350 260" stroke="hsl(var(--primary-foreground))" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
       <path d="M 335 245 L 330 250 M 345 255 L 340 260" stroke="hsl(var(--primary-foreground))" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}
