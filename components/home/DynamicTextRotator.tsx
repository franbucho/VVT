import React, { useState, useEffect } from 'react';

interface RotatingText {
  title: string;
  text: string;
}

interface DynamicTextRotatorProps {
  items: RotatingText[];
}

export const DynamicTextRotator: React.FC<DynamicTextRotatorProps> = ({ items }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFading, setIsFading] = useState(false);

  useEffect(() => {
    if (items.length <= 1) return;

    // Interval: 6 seconds visible + 1 second for fade transition
    const intervalId = setInterval(() => {
      setIsFading(true); // Start fade-out

      // Wait for fade-out to complete before changing text and fading in
      setTimeout(() => {
        setCurrentIndex((prevIndex) => (prevIndex + 1) % items.length);
        setIsFading(false); // Start fade-in
      }, 1000); // Must match the transition duration
    }, 7000);

    return () => clearInterval(intervalId);
  }, [items.length]);

  if (items.length === 0) {
    return null;
  }

  const currentItem = items[currentIndex];

  return (
    <div
      // Apply transition classes based on the isFading state
      className={`transition-all duration-1000 ease-in-out ${isFading ? 'opacity-0 translate-y-5' : 'opacity-100 translate-y-0'}`}
    >
      <h2 className="text-3xl sm:text-4xl font-bold mb-4 bg-gradient-to-r from-primary-dark to-accent bg-clip-text text-transparent dark:from-dark-text-primary dark:to-dark-accent">{currentItem.title}</h2>
      <p className="text-lg text-primary-dark/90 dark:text-dark-text-secondary max-w-3xl mx-auto leading-relaxed">
        {currentItem.text}
      </p>
    </div>
  );
};