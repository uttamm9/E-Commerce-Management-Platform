import React from 'react';
import { Loader2 } from 'lucide-react';

const Loader = ({ size = 'md', fullScreen = false, text = '' }) => {
  const sizeMap = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
    xl: 'w-16 h-16',
  };

  const spinner = (
    <div className="flex flex-col items-center justify-center p-4">
      <Loader2
        className={`${sizeMap[size] || sizeMap.md} animate-spin text-indigo-600`}
      />
      {text && <p className="mt-2 text-sm text-gray-500 font-medium">{text}</p>}
    </div>
  );

  if (fullScreen) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/80 backdrop-blur-sm">
        {spinner}
      </div>
    );
  }

  return spinner;
};

export default Loader;
