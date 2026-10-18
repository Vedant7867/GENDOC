import React from 'react';

interface BrandLogoProps {
  size?: 'sm' | 'md' | 'lg';
  theme?: 'dark' | 'light';
  showSubtitle?: boolean;
}

export const GendocStarLogo: React.FC<{ size?: 'sm' | 'md' | 'lg' }> = ({ size = 'md' }) => {
  const containerSizes = {
    sm: 'w-7 h-7',
    md: 'w-9 h-9',
    lg: 'w-11 h-11',
  };
  const svgSizes = {
    sm: 'w-6 h-6',
    md: 'w-8 h-8',
    lg: 'w-10 h-10',
  };

  return (
    <div className={`relative flex items-center justify-center ${containerSizes[size]} shrink-0`}>
      <div className="absolute inset-0 bg-blue-500/30 rounded-full blur-md" />
      <svg viewBox="0 0 36 36" className={`${svgSizes[size]} relative z-10`} fill="none">
        <path
          d="M18 2C18 11.5 24.5 18 34 18C24.5 18 18 24.5 18 34C18 24.5 11.5 18 2 18C11.5 18 18 11.5 18 2Z"
          fill="url(#starGrad)"
        />
        <defs>
          <linearGradient id="starGrad" x1="2" y1="2" x2="34" y2="34" gradientUnits="userSpaceOnUse">
            <stop stopColor="#93C5FD" />
            <stop offset="0.5" stopColor="#3B82F6" />
            <stop offset="1" stopColor="#1D4ED8" />
          </linearGradient>
        </defs>
      </svg>
    </div>
  );
};

export const BrandLogo: React.FC<BrandLogoProps> = ({
  size = 'md',
  theme = 'dark',
  showSubtitle = true,
}) => {
  const isDark = theme === 'dark';

  return (
    <div className="flex items-center gap-3 select-none">
      <GendocStarLogo size={size} />

      <div className="flex flex-col">
        <span
          className={`font-bold tracking-wide leading-tight ${isDark ? 'text-white' : 'text-slate-900'
            } ${size === 'lg' ? 'text-xl' : size === 'sm' ? 'text-sm' : 'text-[17px]'}`}
        >
          GENDOC
        </span>
        {showSubtitle && (
          <span
            className={`font-medium tracking-wider uppercase leading-tight mt-0.5 ${isDark ? 'text-slate-400' : 'text-blue-600'
              } ${size === 'lg' ? 'text-xs' : 'text-[10.5px]'}`}
          >
            ACM- NIT SURAT
          </span>
        )}
      </div>
    </div>
  );
};
