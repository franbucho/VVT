
import React from 'react';

// The Feature type itself in types.ts now has titleKey and descriptionKey as translated strings
// because getFeaturesList in constants.ts pre-translates them.
interface FeatureFromList {
  icon: React.ReactNode;
  titleKey: string; // This will actually be the translated string
  descriptionKey: string; // This will actually be the translated string
}

interface FeatureCardProps {
  feature: FeatureFromList;
}

export const FeatureCard: React.FC<FeatureCardProps> = ({ feature }) => {
  return (
    <div className="flex flex-col items-center p-6 bg-white rounded-xl shadow-lg hover:shadow-xl transition-shadow duration-300 h-full">
      <div className="mb-4 text-accent">
        {feature.icon}
      </div>
      <h3 className="mb-2 text-xl font-semibold text-primary text-center">{feature.titleKey}</h3>
      <p className="text-primary/80 text-center text-sm">{feature.descriptionKey}</p>
    </div>
  );
};