import React from 'react';
import { cn } from '../../lib/utils';

interface SkeletonProps {
    className?: string;
    variant?: 'text' | 'rect' | 'circle' | 'card' | 'row';
}

const Skeleton: React.FC<SkeletonProps> = ({ className, variant = 'text' }) => {
    const baseClasses = "relative overflow-hidden bg-[var(--color-bg-tertiary)]/40 rounded animate-pulse";
    const shimmerClasses = "after:absolute after:inset-0 after:-translate-x-full after:animate-shimmer after:bg-gradient-to-r after:from-transparent after:via-white/5 after:to-transparent";

    const variantClasses = {
        text: "h-3 w-3/4",
        rect: "h-24 w-full",
        circle: "h-10 w-10 rounded-full",
        card: "h-32 w-full rounded-2xl",
        row: "h-16 w-full rounded-xl",
    };

    return (
        <div
            className={cn(
                baseClasses,
                shimmerClasses,
                variantClasses[variant],
                className
            )}
        />
    );
};

export default Skeleton;
