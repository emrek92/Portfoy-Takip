import React, { useEffect, useRef, useCallback, forwardRef } from 'react';
import { createPortal } from 'react-dom';
import { cn, trapFocus } from '../../lib/utils';
import { X } from 'lucide-react';
import Button from './Button';

export interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    title?: string;
    description?: string;
    children: React.ReactNode;
    footer?: React.ReactNode;
    size?: 'sm' | 'md' | 'lg' | 'xl';
    showCloseButton?: boolean;
    closeOnOverlayClick?: boolean;
    closeOnEscape?: boolean;
    className?: string;
}

const Modal = forwardRef<HTMLDivElement, ModalProps>(
    (
        {
            isOpen,
            onClose,
            title,
            description,
            children,
            footer,
            size = 'md',
            showCloseButton = true,
            closeOnOverlayClick = true,
            closeOnEscape = true,
            className,
        },
        ref
    ) => {
        const overlayRef = useRef<HTMLDivElement>(null);
        const contentRef = useRef<HTMLDivElement>(null);
        const previousActiveElement = useRef<HTMLElement | null>(null);

        // Store the previously focused element
        useEffect(() => {
            if (isOpen) {
                previousActiveElement.current = document.activeElement as HTMLElement;
            }
        }, [isOpen]);

        // Handle escape key
        const handleKeyDown = useCallback(
            (event: KeyboardEvent) => {
                if (event.key === 'Escape' && closeOnEscape) {
                    onClose();
                }
                if (event.key === 'Tab' && contentRef.current) {
                    trapFocus(contentRef.current, event);
                }
            },
            [closeOnEscape, onClose]
        );

        useEffect(() => {
            if (isOpen) {
                document.addEventListener('keydown', handleKeyDown);
                document.body.style.overflow = 'hidden';

                // Focus the first focusable element or the modal itself
                setTimeout(() => {
                    const focusableElements = contentRef.current?.querySelectorAll<HTMLElement>(
                        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
                    );
                    if (focusableElements && focusableElements.length > 0) {
                        focusableElements[0].focus();
                    } else {
                        contentRef.current?.focus();
                    }
                }, 0);
            }

            return () => {
                document.removeEventListener('keydown', handleKeyDown);
                document.body.style.overflow = '';
                // Restore focus
                previousActiveElement.current?.focus();
            };
        }, [isOpen, handleKeyDown]);

        const handleOverlayClick = (event: React.MouseEvent) => {
            if (closeOnOverlayClick && event.target === overlayRef.current) {
                onClose();
            }
        };

        if (!isOpen) return null;

        const sizeClasses = {
            sm: 'max-w-md',
            md: 'max-w-lg',
            lg: 'max-w-2xl',
            xl: 'max-w-4xl',
        };

        return createPortal(
            <div
                ref={overlayRef}
                className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200"
                onClick={handleOverlayClick}
                role="presentation"
                aria-hidden="true"
            >
                <div
                    ref={contentRef}
                    className={cn(
                        'relative w-full bg-[var(--color-bg-secondary)] rounded-2xl shadow-2xl',
                        'border border-[var(--color-border)]',
                        'animate-in zoom-in-95 duration-200',
                        sizeClasses[size],
                        className
                    )}
                    role="dialog"
                    aria-modal="true"
                    aria-labelledby={title ? 'modal-title' : undefined}
                    aria-describedby={description ? 'modal-description' : undefined}
                    tabIndex={-1}
                >
                    {/* Header */}
                    {(title || showCloseButton) && (
                        <div className="flex items-start justify-between gap-4 p-6 pb-0">
                            <div className="flex-1">
                                {title && (
                                    <h2
                                        id="modal-title"
                                        className="text-xl font-bold text-[var(--color-text-primary)]"
                                    >
                                        {title}
                                    </h2>
                                )}
                                {description && (
                                    <p
                                        id="modal-description"
                                        className="mt-1 text-sm text-[var(--color-text-secondary)]"
                                    >
                                        {description}
                                    </p>
                                )}
                            </div>
                            {showCloseButton && (
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={onClose}
                                    className="flex-shrink-0 -mr-2 -mt-2"
                                    aria-label="Close modal"
                                >
                                    <X size={20} />
                                </Button>
                            )}
                        </div>
                    )}

                    {/* Content */}
                    <div className="p-6">{children}</div>

                    {/* Footer */}
                    {footer && (
                        <div className="flex items-center justify-end gap-3 p-6 pt-0">
                            {footer}
                        </div>
                    )}
                </div>
            </div>,
            document.body
        );
    }
);

Modal.displayName = 'Modal';

export default Modal;
