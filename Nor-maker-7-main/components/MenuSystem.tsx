
import React from 'react';

export const MenuItem = ({ label, shortcut, icon, onClick, disabled, setOpenMenu }: any) => (
    <div
        className={`flex items-center px-4 py-2 md:py-1 cursor-pointer gap-3 text-[11px] font-ui transition-none border border-transparent ${disabled ? 'text-gray-400 shadow-none' : 'hover:bg-win-select hover:text-white hover:border-transparent text-black'}`}
        onPointerDown={(e) => {
            if(!disabled && onClick) {
                e.stopPropagation();
                onClick();
                if (setOpenMenu) setOpenMenu(null);
            }
        }}
    >
        <div className="w-4 flex justify-center shrink-0">{icon && React.isValidElement(icon) ? React.cloneElement(icon as React.ReactElement<any>, { size: 14 } as any) : icon}</div>
        <span className="flex-1 whitespace-nowrap">{label}</span>
        {shortcut && <span className="ml-6 text-[10px] opacity-80 hidden md:block">{shortcut}</span>}
    </div>
);

export const MenuDropdown = ({ children, align = 'left', style = {} }: any) => (
    <div
        className={`fixed top-[22px] mt-[1px] bg-white border border-gray-500 shadow-[2px_2px_4px_rgba(0,0,0,0.4)] min-w-[200px] py-0.5 z-[9999]`}
        style={{
            ...style,
            ...(align === 'right' ? { right: '4px' } : {})
        }}
        onClick={(e) => e.stopPropagation()}
    >
        <div className="absolute left-[26px] top-0 bottom-0 w-px bg-gray-200"></div>
        {children}
    </div>
);

export const MenuSeparator = () => <div className="h-px bg-gray-300 my-1 mx-2"></div>;
