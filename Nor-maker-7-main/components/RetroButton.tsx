import React from 'react';

interface RetroButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'toolbar';
  isLoading?: boolean;
  icon?: React.ReactNode;
}

const RetroButton: React.FC<RetroButtonProps> = ({
  children,
  variant = 'primary',
  isLoading,
  className = '',
  icon,
  ...props
}) => {

  // Windows Classic Button Logic
  let base = "font-ui text-[8px] flex items-center select-none focus:outline-none focus:ring-1 focus:ring-black focus:ring-offset-1 focus:ring-offset-white whitespace-nowrap ";

  if (variant === 'toolbar') {
      // Toolbar buttons are flat until hovered
      base += "p-1 md:p-1 p-2 border border-transparent hover:border-win-highlight hover:shadow-win-out active:border-win-darkshadow active:shadow-win-in rounded-[2px] ";
  } else {
      // Standard dialog buttons (Windows 2000 Style)
      // Main difference: 2px border logic for depth
      base += "bg-win-face text-win-text px-3 py-1 shadow-[inset_1px_1px_var(--win-highlight),inset_-1px_-1px_var(--win-shadow),1px_1px_#000] active:shadow-[inset_1px_1px_#000,inset_-1px_-1px_var(--win-highlight)] active:translate-y-[1px] active:translate-x-[1px] ";
  }

  return (
    <button
      className={`${base} ${className} ${isLoading ? 'opacity-50 cursor-wait' : ''}`}
      disabled={isLoading}
      {...props}
    >
      {isLoading ? (
        <span className="animate-spin mr-1">⏳</span>
      ) : icon}
      {children && <span className={icon ? "ml-1" : ""}>{children}</span>}
    </button>
  );
};

export default RetroButton;