import type { Meta, StoryObj } from '@storybook/react';
import { Button } from './index';
import { Plus, ArrowRight, Loader2 } from 'lucide-react';

const meta: Meta<typeof Button> = {
    title: 'UI/Button',
    component: Button,
    parameters: {
        layout: 'centered',
    },
    tags: ['autodocs'],
    argTypes: {
        variant: {
            control: 'select',
            options: ['primary', 'secondary', 'outline', 'ghost', 'danger'],
        },
        size: {
            control: 'select',
            options: ['sm', 'md', 'lg'],
        },
        isLoading: {
            control: 'boolean',
        },
        disabled: {
            control: 'boolean',
        },
    },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Primary: Story = {
    args: {
        children: 'Button',
        variant: 'primary',
    },
};

export const Secondary: Story = {
    args: {
        children: 'Button',
        variant: 'secondary',
    },
};

export const Outline: Story = {
    args: {
        children: 'Button',
        variant: 'outline',
    },
};

export const Ghost: Story = {
    args: {
        children: 'Button',
        variant: 'ghost',
    },
};

export const Danger: Story = {
    args: {
        children: 'Delete',
        variant: 'danger',
    },
};

export const Small: Story = {
    args: {
        children: 'Small',
        size: 'sm',
    },
};

export const Medium: Story = {
    args: {
        children: 'Medium',
        size: 'md',
    },
};

export const Large: Story = {
    args: {
        children: 'Large',
        size: 'lg',
    },
};

export const WithLeftIcon: Story = {
    args: {
        children: 'Add Item',
        leftIcon: <Plus size={18} />,
    },
};

export const WithRightIcon: Story = {
    args: {
        children: 'Next',
        rightIcon: <ArrowRight size={18} />,
    },
};

export const Loading: Story = {
    args: {
        children: 'Loading',
        isLoading: true,
    },
};

export const Disabled: Story = {
    args: {
        children: 'Disabled',
        disabled: true,
    },
};

export const AllVariants: Story = {
    render: () => (
        <div className="flex flex-col gap-4">
            <div className="flex gap-2">
                <Button variant="primary">Primary</Button>
                <Button variant="secondary">Secondary</Button>
                <Button variant="outline">Outline</Button>
                <Button variant="ghost">Ghost</Button>
                <Button variant="danger">Danger</Button>
            </div>
            <div className="flex gap-2">
                <Button size="sm">Small</Button>
                <Button size="md">Medium</Button>
                <Button size="lg">Large</Button>
            </div>
            <div className="flex gap-2">
                <Button isLoading>Loading</Button>
                <Button disabled>Disabled</Button>
            </div>
        </div>
    ),
};
