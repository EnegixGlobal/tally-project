import React from 'react';
import { useAppContext } from '../../../context/AppContext';
import { Clock } from 'lucide-react';

interface ComingSoonProps {
  title: string;
}

const ComingSoon: React.FC<ComingSoonProps> = ({ title }) => {
  const { theme } = useAppContext();

  return (
    <div className={`flex flex-col items-center justify-center min-h-[calc(100vh-64px)] p-6 pt-[80px] ${theme === 'dark' ? 'text-white' : 'text-gray-800'}`}>
      <div className={`p-8 rounded-xl flex flex-col items-center shadow-lg ${theme === 'dark' ? 'bg-gray-800' : 'bg-white'}`}>
        <Clock size={64} className="mb-6 text-orange-500 animate-pulse" />
        <h1 className="text-3xl font-bold mb-3">{title}</h1>
        <p className="text-lg text-gray-500 text-center max-w-md">
          We are working hard to bring you this feature. Stay tuned for updates!
        </p>
      </div>
    </div>
  );
};

export default ComingSoon;
