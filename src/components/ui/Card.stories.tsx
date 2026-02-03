import type { Meta, StoryObj } from '@storybook/react';
import { Card, CardHeader, CardContent, CardFooter } from './index';
import { Button } from './index';

const meta: Meta<typeof Card> = {
    title: 'UI/Card',
    component: Card,
    parameters: {
        layout: 'centered',
    },
    tags: ['autodocs'],
    argTypes: {
        variant: {
            control: 'select',
            options: ['default', 'glass', 'elevated'],
        },
        padding: {
            control: 'select',
            options: ['none', 'sm', 'md', 'lg'],
        },
        hover: {
            control: 'boolean',
        },
    },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
    args: {
        children: 'Card content',
        variant: 'default',
    },
};

export const Glass: Story = {
    args: {
        children: 'Glass card content',
        variant: 'glass',
    },
};

export const Elevated: Story = {
    args: {
        children: 'Elevated card content',
        variant: 'elevated',
    },
};

export const WithHover: Story = {
    args: {
        children: 'Hover over me',
        variant: 'default',
        hover: true,
    },
};

export const CompleteCard: Story = {
    render: () => (
        <Card variant="glass" className="w-80">
            <CardHeader
                title="Card Title"
                subtitle="Card subtitle description"
                action={<Button variant="ghost" size="sm">...</Button>}
            />
            <CardContent>
                <p className="text-[var(--color-text-secondary)]">
                    This is the main content of the card. You can put any content here.
                </p>
            </CardContent>
            <CardFooter>
                <Button variant="outline">Cancel</Button>
                <Button>Confirm</Button>
            </CardFooter>
        </Card>
    ),
};

export const AllVariants: Story = {
    render: () => (
        <div className="flex flex-col gap-4">
            <Card variant="default">
                <p>Default Card</p>
            </Card>
            <Card variant="glass">
                <p>Glass Card</p>
            </Card>
            <Card variant="elevated">
                <p>Elevated Card</p>
            </Card>
        </div>
    ),
};
