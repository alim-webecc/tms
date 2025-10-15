// frontend-v0/components/ui/button.stories.tsx
import type { Meta, StoryObj } from '@storybook/react';
import { Button } from './button';

const meta: Meta<typeof Button> = {
  title: 'UI/Button',
  component: Button,
  parameters: { layout: 'centered' },
  args: {
    children: 'Button',
  },
};
export default meta;

type Story = StoryObj<typeof Button>;

export const Default: Story = {
  args: { variant: 'default' },
};

export const Secondary: Story = {
  args: { variant: 'secondary' },
};

export const Destructive: Story = {
  args: { variant: 'destructive' },
};

export const Outline: Story = {
  args: { variant: 'outline' },
};

export const Ghost: Story = {
  args: { variant: 'ghost' },
};

export const LinkVariant: Story = {
  args: { variant: 'link' },
};

export const Small: Story = {
  args: { size: 'sm' },
};

export const Large: Story = {
  args: { size: 'lg' },
};

export const WithIcon: Story = {
  args: {
    children: (
      <>
        <svg viewBox="0 0 20 20" className="size-4" fill="currentColor">
          <path d="M10 2a8 8 0 100 16 8 8 0 000-16zm1 11H9v-1h2v1zm0-3H9V5h2v5z" />
        </svg>
        Mit Icon
      </>
    ),
  },
};
