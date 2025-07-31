import React from 'react';
import { useSpotlight } from '../../hooks/useSpotlight';

export const StatCard: React.FC<{ icon: React.ReactNode; label: string; value: number | string, colorClass: string }> = ({ icon, label, value, colorClass }) => {
    const { spotlightProps, Spotlight } = useSpotlight({ color: 'rgba(128, 128, 128, 0.1)' });
    
    return (
        <div {...spotlightProps} className={`relative overflow-hidden p-4 bg-white dark:bg-dark-card rounded-xl shadow-lg flex items-center space-x-4 border-l-4 ${colorClass}`}>
            <Spotlight />
            <div className="flex-shrink-0">{icon}</div>
            <div>
                <p className="text-sm font-medium text-gray-500 dark:text-dark-text-secondary">{label}</p>
                <p className="text-2xl font-bold text-primary-dark dark:text-dark-text-primary">{value}</p>
            </div>
        </div>
    );
};
