import React, { useState, useEffect, useRef, useCallback } from 'react';
import { cn } from '../../lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, Search } from 'lucide-react';

export interface AutocompleteProps<T> {
    value: string;
    onChange: (value: string) => void;
    onSelect: (item: T) => void;
    fetchOptions: (query: string) => Promise<T[]>;
    renderOption: (item: T) => React.ReactNode;
    getOptionLabel: (item: T) => string;
    label?: string;
    placeholder?: string;
    className?: string;
    helperText?: string;
    error?: string;
}

function Autocomplete<T>({
    value,
    onChange,
    onSelect,
    fetchOptions,
    renderOption,
    getOptionLabel,
    label,
    placeholder,
    className,
    helperText,
    error,
}: AutocompleteProps<T>) {
    const [isOpen, setIsOpen] = useState(false);
    const [options, setOptions] = useState<T[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const wrapperRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);
    const skipNextSearch = useRef(false);

    // Debounce search
    useEffect(() => {
        if (skipNextSearch.current) {
            skipNextSearch.current = false;
            return;
        }

        const timer = setTimeout(async () => {
            if (value.length >= 1) { // Trigger on first letter as requested
                setIsLoading(true);
                try {
                    const results = await fetchOptions(value);
                    setOptions(results);
                    setIsOpen(true);
                } catch (err) {
                    console.error('Search failed:', err);
                    setOptions([]);
                } finally {
                    setIsLoading(false);
                }
            } else {
                setOptions([]);
                setIsOpen(false);
            }
        }, 300); // 300ms debounce

        return () => clearTimeout(timer);
    }, [value, fetchOptions]);

    // Click outside to close
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleSelect = (item: T) => {
        skipNextSearch.current = true;
        onSelect(item);
        onChange(getOptionLabel(item));
        setIsOpen(false);
    };

    const inputId = React.useId();

    return (
        <div className="w-full relative" ref={wrapperRef}>
            {label && (
                <label
                    htmlFor={inputId}
                    className="block text-sm font-medium text-[var(--color-text-primary)] mb-1.5"
                >
                    {label}
                </label>
            )}

            <div className="relative">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-secondary)]">
                    {isLoading ? <Loader2 className="animate-spin" size={18} /> : <Search size={18} />}
                </div>
                <input
                    ref={inputRef}
                    id={inputId}
                    type="text"
                    className={cn(
                        'flex w-full rounded-xl border bg-[var(--color-bg-secondary)] px-4 py-2.5 pl-10 text-sm',
                        'text-[var(--color-text-primary)] placeholder:text-[var(--color-text-secondary)]',
                        'transition-all duration-200',
                        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-focus-ring)]',
                        error
                            ? 'border-[var(--color-accent-red)] focus-visible:ring-[var(--color-accent-red)]'
                            : 'border-[var(--color-border)]',
                        className
                    )}
                    placeholder={placeholder}
                    value={value}
                    onChange={(e) => {
                        onChange(e.target.value);
                        if (!isOpen && e.target.value.length >= 1) setIsOpen(true);
                    }}
                    onFocus={() => {
                        if (value.length >= 1 && options.length > 0) setIsOpen(true);
                    }}
                    autoComplete="off"
                />
            </div>

            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="absolute z-50 w-full mt-1 bg-[var(--color-bg-secondary)] border border-[var(--color-border)] rounded-xl shadow-lg max-h-60 overflow-auto"
                    >
                        {options.length > 0 ? (
                            options.map((option, index) => (
                                <button
                                    key={index}
                                    className="w-full text-left px-4 py-2 text-sm text-[var(--color-text-primary)] hover:bg-[var(--color-bg-tertiary)] transition-colors flex items-center justify-between group"
                                    onClick={() => handleSelect(option)}
                                >
                                    {renderOption(option)}
                                </button>
                            ))
                        ) : (
                            <div className="px-4 py-3 text-sm text-[var(--color-text-secondary)] text-center italic">
                                Sonuç bulunamadı
                            </div>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>

            {error ? (
                <p className="mt-1.5 text-sm text-[var(--color-accent-red)]">{error}</p>
            ) : helperText ? (
                <p className="mt-1.5 text-sm text-[var(--color-text-secondary)]">{helperText}</p>
            ) : null}
        </div>
    );
}

export default Autocomplete;
