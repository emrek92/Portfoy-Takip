import type { Meta, StoryObj } from '@storybook/react';
import { Input } from './index';
import { Search, Mail, Lock } from 'lucide-react';

const meta: Meta<typeof Input> = {
    title: 'UI/Input',
    component: Input,
    parameters: {
        layout: 'centered',
    },
    tags: ['autodocs'],
    argTypes: {
        label: {
            control: 'text',
        },
        helperText: {
            control: 'text',
        },
        error: {
            control: 'text',
        },
        disabled: {
            control: 'boolean',
        },
    },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
    args: {
        placeholder: 'Enter text...',
    },
};

export const WithLabel: Story = {
    args: {
        label: 'Email Address',
        placeholder: 'email@example.com',
        type: 'email',
    },
};

export const WithHelperText: Story = {
    args: {
        label: 'Username',
        placeholder: 'johndoe',
        helperText: 'This will be your public display name.',
    },
};

export const WithError: Story = {
    args: {
        label: 'Password',
        type: 'password',
        placeholder: '••••••••',
        error: 'Password must be at least 8 characters.',
    },
};

export const WithLeftIcon: Story = {
    args: {
        placeholder: 'Search...',
        leftIcon: <Search size={18} />,
    },
};

export const WithRightIcon: Story = {
    args: {
        label: 'Email',
        placeholder: 'email@example.com',
        rightIcon: <Mail size={18} />,
    },
};

export const Disabled: Story = {
    args: {
        label: 'Disabled Input',
        placeholder: 'Cannot edit this',
        disabled: true,
    },
};

export const AllStates: Story = {
    render: () => (
        <div className="flex flex-col gap-4 w-80">
            <Input placeholder="Default input" />
            <Input label="With Label" placeholder="Input with label" />
            <Input
                label="With Helper"
                placeholder="Input with helper"
                helperText="This is helper text"
            />
            <Input
                label="With Error"
                placeholder="Input with error"
                error="This field is required"
            />
            <Input
                label="With Icons"
                placeholder="Search..."
                leftIcon={<Search size={18} />}
                rightIcon={<Lock size={18} />}
            />
            <Input label="Disabled" placeholder="Disabled input" disabled />
        </div>
    ),
};
