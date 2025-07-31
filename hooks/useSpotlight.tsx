import React, { useState } from 'react';

interface UseSpotlightOptions {
  size?: number;
  color?: string;
  enabled?: boolean;
}

export const useSpotlight = ({ size = 300, color = 'rgba(59, 187, 217, 0.1)', enabled = true }: UseSpotlightOptions = {}) => {
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [opacity, setOpacity] = useState(0);

  const handleMouseMove = (e: React.MouseEvent<HTMLElement>) => {
    if (!enabled) return;
    const rect = e.currentTarget.getBoundingClientRect();
    setMousePos({ x: e.clientX - rect.left, y: e.clientY - rect.top });
  };

  const handleMouseEnter = () => {
    if (enabled) setOpacity(1);
  };

  const handleMouseLeave = () => {
    if (enabled) setOpacity(0);
  };

  const Spotlight: React.FC = () => {
    if (!enabled) return null;
    return (
        <div
            className="absolute inset-0 transition-opacity duration-500 pointer-events-none"
            style={{
                opacity: opacity,
                background: `radial-gradient(${size}px circle at ${mousePos.x}px ${mousePos.y}px, ${color}, transparent 80%)`,
            }}
        />
    );
  };

  const spotlightProps = {
    onMouseMove: handleMouseMove,
    onMouseEnter: handleMouseEnter,
    onMouseLeave: handleMouseLeave,
  };

  return { spotlightProps, Spotlight };
};
