import React from 'react';
import { useLanguage } from '../../contexts/LanguageContext';
import { AdminChartDataPoint } from '../../types';

interface DailyActivityChartProps {
  data: AdminChartDataPoint[];
}

export const DailyActivityChart: React.FC<DailyActivityChartProps> = ({ data }) => {
  const { language } = useLanguage();

  if (!data || data.length === 0) {
    return <div className="text-center p-8 text-gray-500 dark:text-dark-text-secondary">No activity data for the last 7 days.</div>;
  }

  const maxValue = Math.max(...data.map(d => d.newUsers), ...data.map(d => d.evaluations), 10); // at least 10 for scale

  const formatDate = (dateString: string) => {
    const date = new Date(dateString + 'T00:00:00'); // Assume UTC to avoid timezone shifts
    return date.toLocaleDateString(language, { month: 'short', day: 'numeric' });
  };

  return (
    <div className="p-4 rounded-lg bg-gray-50 dark:bg-dark-background/50">
      <h3 className="text-lg font-semibold mb-4 text-primary-dark dark:text-dark-text-primary">Daily Activity (Last 7 Days)</h3>
      <div className="flex justify-end items-center gap-4 text-xs mb-4 text-primary-dark/80 dark:text-dark-text-secondary">
          <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-sm bg-accent dark:bg-dark-accent"></div>
              <span>New Users</span>
          </div>
          <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-sm bg-primary-dark dark:bg-dark-border"></div>
              <span>Evaluations</span>
          </div>
      </div>
      <div className="w-full h-64 flex justify-around items-end gap-2 border-l border-b border-gray-300 dark:border-dark-border p-2">
        {data.map((dayData, index) => (
          <div key={index} className="flex-1 flex flex-col items-center group relative h-full pt-4">
             {/* Tooltip */}
            <div className="absolute bottom-full mb-2 w-max p-2 text-xs bg-black/80 text-white rounded-md opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
              <p className="font-bold">{formatDate(dayData.date)}</p>
              <div className="mt-1">
                <p><span className="text-accent dark:text-dark-accent">●</span> Users: {dayData.newUsers}</p>
                <p><span className="text-primary-dark dark:text-dark-border">●</span> Evaluations: {dayData.evaluations}</p>
              </div>
            </div>

            <div className="flex items-end h-full w-full gap-1">
              {/* New Users Bar */}
              <div
                className="w-1/2 bg-accent dark:bg-dark-accent rounded-t-sm hover:opacity-80 transition-all duration-200"
                style={{ height: `${(dayData.newUsers / maxValue) * 100}%` }}
              />
              {/* Evaluations Bar */}
              <div
                className="w-1/2 bg-primary-dark dark:bg-dark-border rounded-t-sm hover:opacity-80 transition-all duration-200"
                style={{ height: `${(dayData.evaluations / maxValue) * 100}%` }}
              />
            </div>
            <span className="text-xs mt-2 text-gray-600 dark:text-dark-text-secondary absolute -bottom-5">{formatDate(dayData.date)}</span>
          </div>
        ))}
      </div>
    </div>
  );
};
