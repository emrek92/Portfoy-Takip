import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import Button from './Button';

describe('Button', () => {
    it('renders button with text', () => {
        render(<Button>Click me</Button>);
        expect(screen.getByRole('button', { name: 'Click me' })).toBeInTheDocument();
    });

    it('handles click events', () => {
        const handleClick = vi.fn();
        render(<Button onClick={handleClick}>Click me</Button>);

        fireEvent.click(screen.getByRole('button'));
        expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it('is disabled when disabled prop is true', () => {
        render(<Button disabled>Disabled</Button>);
        expect(screen.getByRole('button')).toBeDisabled();
    });

    it('is disabled when isLoading is true', () => {
        render(<Button isLoading>Loading</Button>);
        expect(screen.getByRole('button')).toBeDisabled();
        expect(screen.getByRole('button')).toHaveAttribute('aria-disabled', 'true');
    });

    it('renders loading spinner when isLoading is true', () => {
        render(<Button isLoading>Loading</Button>);
        expect(screen.getByRole('button').querySelector('svg')).toBeInTheDocument();
    });

    it('renders left icon', () => {
        render(<Button leftIcon={<span data-testid="left-icon">Icon</span>}>With Icon</Button>);
        expect(screen.getByTestId('left-icon')).toBeInTheDocument();
    });

    it('renders right icon', () => {
        render(<Button rightIcon={<span data-testid="right-icon">Icon</span>}>With Icon</Button>);
        expect(screen.getByTestId('right-icon')).toBeInTheDocument();
    });

    it('applies variant classes correctly', () => {
        const { rerender } = render(<Button variant="primary">Primary</Button>);
        expect(screen.getByRole('button')).toHaveClass('bg-[var(--color-accent-blue)]');

        rerender(<Button variant="secondary">Secondary</Button>);
        expect(screen.getByRole('button')).toHaveClass('bg-[var(--color-bg-tertiary)]');

        rerender(<Button variant="danger">Danger</Button>);
        expect(screen.getByRole('button')).toHaveClass('bg-[var(--color-accent-red)]');
    });

    it('applies size classes correctly', () => {
        const { rerender } = render(<Button size="sm">Small</Button>);
        expect(screen.getByRole('button')).toHaveClass('h-8');

        rerender(<Button size="md">Medium</Button>);
        expect(screen.getByRole('button')).toHaveClass('h-10');

        rerender(<Button size="lg">Large</Button>);
        expect(screen.getByRole('button')).toHaveClass('h-12');
    });

    it('has correct accessibility attributes', () => {
        render(<Button aria-label="Custom label">Button</Button>);
        expect(screen.getByRole('button')).toHaveAttribute('aria-label', 'Custom label');
    });
});
