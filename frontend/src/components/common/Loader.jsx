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
    <div
      className="flex flex-col items-center justify-center gap-3"
      role="status"
      aria-live="polite"
      aria-label={text || 'Loading'}
    >
      <div className="relative flex items-center justify-center rounded-full bg-indigo-50 ring-8 ring-indigo-50/40">
        <Loader2
          aria-hidden="true"
          className={`${sizeMap[size] || sizeMap.md} animate-spin text-indigo-600`}
          strokeWidth={2}
        />
      </div>
      {text && (
        <p className="text-sm font-medium tracking-wide text-gray-500">
          {text}
        </p>
      )}
    </div>
  );

  if (fullScreen) {
    return (
      <div className="flex min-h-[55vh] w-full items-center justify-center py-12">
        {spinner}
      </div>
    );
  }

  return spinner;
};

export default Loader;
