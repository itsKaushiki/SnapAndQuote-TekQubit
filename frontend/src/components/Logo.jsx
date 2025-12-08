import React from 'react';

const Logo = ({ width = 200, height = 60, showSubtitle = true, className = '', variant = 'default', showBadge = true }) => {
  const textColor = variant === 'header' ? 'white' : '#6366f1';
  const textColor2 = variant === 'header' ? 'white' : '#06b6d4';
  const carColor = variant === 'header' ? 'white' : '#ffffff';
  const lightningColor = '#06b6d4'; // Teal lightning bolt
  const badgeBgColor = variant === 'header' ? 'rgba(255, 255, 255, 0.2)' : 'rgba(99, 102, 241, 0.15)';
  const badgeTextColor = variant === 'header' ? 'white' : '#6366f1';
  
  return (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      viewBox="0 0 500 80" 
      width={width} 
      height={height}
      className={className}
      fill="none"
    >
      {/* AI Assistant Badge - positioned above text */}
      {showBadge && (
        <g transform="translate(100, 5)">
          <rect 
            x="0" 
            y="0" 
            width="100" 
            height="18" 
            rx="9" 
            fill={badgeBgColor}
            stroke={variant === 'header' ? 'rgba(255, 255, 255, 0.3)' : 'rgba(99, 102, 241, 0.3)'}
            strokeWidth="1"
          />
          <text 
            x="50" 
            y="13" 
            fontFamily="'Inter', -apple-system, sans-serif" 
            fontSize="9" 
            fontWeight="700" 
            fill={badgeTextColor}
            textAnchor="middle"
            letterSpacing="0.1em"
          >
            AI ASSISTANT
          </text>
        </g>
      )}
      
      {/* Electric Car Icon */}
      <g transform="translate(15, 25) scale(1.1)">
        {/* Car Body */}
        <path 
          d="M 20 40 L 15 50 L 15 65 L 25 70 L 65 70 L 75 65 L 75 50 L 70 40 L 65 35 L 50 30 L 35 30 L 20 35 Z" 
          stroke={carColor} 
          strokeWidth="3" 
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        
        {/* Car Windows */}
        <path 
          d="M 30 35 L 45 35 L 45 50 L 35 50 Z" 
          stroke={carColor} 
          strokeWidth="2.5" 
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path 
          d="M 50 35 L 65 35 L 65 50 L 55 50 Z" 
          stroke={carColor} 
          strokeWidth="2.5" 
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        
        {/* Front Wheel */}
        <circle 
          cx="30" 
          cy="65" 
          r="10" 
          stroke={carColor} 
          strokeWidth="3" 
          fill="none"
        />
        
        {/* Lightning Bolt in Front Wheel */}
        <path 
          d="M 27 58 L 24 65 L 30 65 L 27 72 L 33 72 L 36 65 L 30 65 Z" 
          fill={lightningColor}
        />
        
        {/* Rear Wheel */}
        <circle 
          cx="65" 
          cy="65" 
          r="10" 
          stroke={carColor} 
          strokeWidth="3" 
          fill="none"
        />
        
        {/* Wheel Details */}
        <circle cx="30" cy="65" r="5" stroke={carColor} strokeWidth="2" fill="none" opacity="0.5"/>
        <circle cx="65" cy="65" r="5" stroke={carColor} strokeWidth="2" fill="none" opacity="0.5"/>
      </g>
      
      {/* Text - "Snap & Quote" on same line */}
      <g transform="translate(100, 50)">
        <text 
          x="0" 
          y="35" 
          fontFamily="'Inter', 'SF Pro Display', -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', sans-serif" 
          fontSize="42" 
          fontWeight="800" 
          fill={textColor} 
          letterSpacing="-0.02em"
        >
          Snap &amp; Quote
        </text>
      </g>
      
      {/* Subtitle */}
      {showSubtitle && (
        <text x="100" y="70" fontFamily="system-ui, -apple-system, sans-serif" fontSize="14" fill="#a1a1aa" fontWeight="500">
          AI Car Valuation
        </text>
      )}
    </svg>
  );
};

export default Logo;

