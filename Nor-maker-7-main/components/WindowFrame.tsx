
import React, { useState, useRef } from 'react';
import { X, Minus, Square } from 'lucide-react';

interface WindowFrameProps {
    title: string;
    children: React.ReactNode;
    onClose: () => void;
    isActive?: boolean;
    onActivate?: () => void;
    icon?: React.ReactElement;
    isMDI?: boolean;
    initialX?: number;
    initialY?: number;
    initialW?: number;
    initialH?: number;
    onMinimize?: () => void;
}

const WindowFrame: React.FC<WindowFrameProps> = ({
    title, children, onClose, isActive = true, onActivate, icon,
    isMDI = false, initialX = 50, initialY = 50, initialW = 600, initialH = 400, onMinimize
}) => {
    const [pos, setPos] = useState({ x: initialX, y: initialY });
    const [size, setSize] = useState({ w: initialW, h: initialH });
    const [isDragging, setIsDragging] = useState(false);
    const [isMaximized, setIsMaximized] = useState(false);
    const dragRef = useRef({ startX: 0, startY: 0, initialPosX: 0, initialPosY: 0 });

    const handlePointerDown = (e: React.PointerEvent) => {
        if (!isMDI || isMaximized) return;
        dragRef.current = { startX: e.clientX, startY: e.clientY, initialPosX: pos.x, initialPosY: pos.y };
        setIsDragging(true);
        e.currentTarget.setPointerCapture(e.pointerId);
    };

    const handlePointerMove = (e: React.PointerEvent) => {
        if (!isDragging) return;
        let newX = dragRef.current.initialPosX + (e.clientX - dragRef.current.startX);
        let newY = dragRef.current.initialPosY + (e.clientY - dragRef.current.startY);

        if (newX < 15 && newX > -15) newX = 0;
        if (newY < 15 && newY > -15) newY = 0;
        if (newY < 0) newY = 0;

        setPos({ x: newX, y: newY });
    };

    const handlePointerUp = (e: React.PointerEvent) => {
        setIsDragging(false);
        e.currentTarget.releasePointerCapture(e.pointerId);
    };

    const style = isMDI ? {
        position: 'absolute' as const,
        left: isMaximized ? 0 : pos.x,
        top: isMaximized ? 0 : pos.y,
        width: isMaximized ? '100%' : size.w,
        height: isMaximized ? '100%' : size.h,
        zIndex: isActive ? 50 : 10,
    } : {};

    return (
        <div
            className={`flex flex-col bg-win-face shadow-win-window overflow-hidden ${isActive ? 'z-10' : 'z-0'} ${isMDI ? 'absolute shadow-[2px_2px_10px_rgba(0,0,0,0.5)] border border-win-highlight' : 'h-full w-full'}`}
            style={style}
            onPointerDown={onActivate}
        >
            <div
                className={`flex justify-between items-center px-1 py-0.5 select-none h-[24px] ${isActive ? 'bg-gradient-to-r from-win-blue to-win-blueGrad' : 'bg-gradient-to-r from-win-inactive to-win-inactiveGrad'}`}
                onPointerDown={handlePointerDown}
                onPointerMove={handlePointerMove}
                onPointerUp={handlePointerUp}
                onDoubleClick={() => isMDI && setIsMaximized(!isMaximized)}
            >
                <div className="flex items-center gap-1.5 text-white font-ui font-bold text-[9px] pl-0.5 pointer-events-none">
                    {icon ? React.cloneElement(icon, { size: 14, className: 'filter drop-shadow-sm' } as any) : <img src="https://esm.sh/lucide-static/icons/gamepad-2.svg" className="w-3.5 h-3.5 filter invert brightness-0 shrink-0" />}
                    <span className="truncate drop-shadow-[1px_1px_0_rgba(0,0,0,0.5)] tracking-wide pt-[1px]">{title}</span>
                </div>
                <div className="flex gap-0.5 shrink-0 items-center">
                    {isMDI && <button onClick={(e) => { e.stopPropagation(); if(onMinimize) onMinimize(); }} className="w-[16px] h-[14px] bg-win-face shadow-win-out flex items-center justify-center active:shadow-win-in active:pt-px focus:outline-none rounded-[2px] opacity-80 hover:bg-gray-200"><Minus size={10} className="text-black stroke-[3px] mb-1"/></button>}
                    {isMDI && <button onClick={(e) => { e.stopPropagation(); setIsMaximized(!isMaximized); }} className="w-[16px] h-[14px] bg-win-face shadow-win-out flex items-center justify-center active:shadow-win-in active:pt-px focus:outline-none rounded-[2px] opacity-80 hover:bg-gray-200"><Square size={9} className="text-black stroke-[2.5px]"/></button>}
                    <button onClick={(e) => { e.stopPropagation(); onClose(); }} className="w-[16px] h-[14px] bg-win-face shadow-win-out flex items-center justify-center active:shadow-win-in active:pt-px focus:outline-none ml-0.5 rounded-[2px] hover:bg-red-200"><X size={12} className="text-black stroke-[2.5px]"/></button>
                </div>
            </div>
            <div className="flex-1 overflow-hidden relative border-l border-r border-b border-win-face p-[2px]">
                <div className="w-full h-full bg-win-face shadow-win-in overflow-auto relative">
                    {children}
                </div>
            </div>
            {isMDI && !isMaximized && (
                <div
                    className="absolute bottom-0 right-0 w-4 h-4 cursor-se-resize"
                    onPointerDown={(e) => {
                        e.stopPropagation();
                        const startX = e.clientX;
                        const startY = e.clientY;
                        const startW = size.w;
                        const startH = size.h;

                        const handleMove = (moveEvent: PointerEvent) => {
                            setSize({
                                w: Math.max(200, startW + (moveEvent.clientX - startX)),
                                h: Math.max(100, startH + (moveEvent.clientY - startY))
                            });
                        };
                        const handleUp = () => {
                            window.removeEventListener('pointermove', handleMove);
                            window.removeEventListener('pointerup', handleUp);
                        };
                        window.addEventListener('pointermove', handleMove);
                        window.addEventListener('pointerup', handleUp);
                    }}
                />
            )}
        </div>
    );
};

export default WindowFrame;
