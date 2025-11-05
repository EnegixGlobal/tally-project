import React, { useEffect, useRef } from 'react';
import type { LucideIcon } from 'lucide-react';
import { gsap } from 'gsap';
import { useTheme } from '../../context/ThemeContext';

interface StatsCardProps {
  title: string;
  value: string;
  change: string;
  changeType: 'positive' | 'negative' | 'neutral';
  icon: LucideIcon;
  color: string;
}

const StatsCard: React.FC<StatsCardProps> = ({ title, value, change, changeType, icon: Icon, color }) => {
  const { theme } = useTheme();
  const cardRef = useRef<HTMLDivElement>(null);
  const valueRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const tl = gsap.timeline();
    
    tl.fromTo(cardRef.current, 
      { opacity: 0, y: 20 },
      { opacity: 1, y: 0, duration: 0.5 }
    );
    
    tl.fromTo(valueRef.current, 
      { opacity: 0, scale: 0.8 },
      { opacity: 1, scale: 1, duration: 0.3 }
    );
  }, []);

  const getChangeColor = () => {
    switch (changeType) {
      case 'positive':
        return theme === 'dark' ? 'text-green-400' : 'text-green-600';
      case 'negative':
        return theme === 'dark' ? 'text-red-400' : 'text-red-600';
      default:
        return theme === 'dark' ? 'text-gray-400' : 'text-gray-600';
    }
  };

  return (
    <div
      ref={cardRef}
      className={`rounded-xl shadow-sm border p-4 sm:p-6 hover:shadow-md transition-shadow ${
        theme === 'dark' 
          ? 'bg-gray-800 border-gray-700' 
          : 'bg-white border-gray-200'
      }`}
    >
      <div className="flex items-center justify-between gap-3">
        <div className="flex-1">
          <p className={`text-sm font-medium ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>{title}</p>
          <div ref={valueRef} className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900 dark:text-white mt-1">
            {value}
          </div>
          <p className={`text-xs lg:text-sm mt-1 ${getChangeColor()}`}>
            {change}
          </p>
        </div>
        <div className={`p-2 sm:p-3 rounded-lg ${color} flex-shrink-0`}>
          <Icon className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
        </div>
      </div>
    </div>
  );
};

export default StatsCard;