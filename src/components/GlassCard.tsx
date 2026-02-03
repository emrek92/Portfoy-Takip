import React from 'react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

interface GlassCardProps {
    children: React.ReactNode;
    className?: string;
    onClick?: () => void;
}

export const GlassCard: React.FC<GlassCardProps> = ({ children, className, onClick }) => {
    return (
        <div
            onClick={onClick}
            className={cn(
                "glass rounded-xl p-5 transition-all duration-300 hover:border-white/20 hover:shadow-xl hover:shadow-black/20",
                onClick && "cursor-pointer active:scale-[0.98]",
                className
            )}
        >
            {children}
        </div>
    );
};
