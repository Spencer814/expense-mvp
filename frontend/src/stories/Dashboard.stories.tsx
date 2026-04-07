import type { Meta, StoryObj } from '@storybook/react';
import { http, HttpResponse } from 'msw';
import Dashboard from '../components/Dashboard';

const mockDashboardData = {
  stats: {
    submitted_count: 5,
    approved_count: 12,
    paid_count: 45,
    pending_amount: '$3,250.00',
  },
  category_totals: [
    { category: 'travel', total: '$2,500.00' },
    { category: 'meals', total: '$1,200.00' },
    { category: 'office', total: '$800.00' },
    { category: 'software', total: '$1,500.00' },
    { category: 'equipment', total: '$3,000.00' },
  ],
};

const meta: Meta<typeof Dashboard> = {
  title: 'Expense/Dashboard',
  component: Dashboard,
  parameters: {
    layout: 'fullscreen',
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof Dashboard>;

export const Default: Story = {
  parameters: {
    msw: {
      handlers: [
        http.get('/api/dashboard', () => HttpResponse.json(mockDashboardData)),
      ],
    },
  },
};

export const Loading: Story = {
  parameters: {
    msw: {
      handlers: [
        http.get('/api/dashboard', async () => {
          await new Promise<void>((resolve) => { setTimeout(resolve, 999999); });
          return HttpResponse.json(mockDashboardData);
        }),
      ],
    },
  },
};

export const Error: Story = {
  parameters: {
    msw: {
      handlers: [
        http.get('/api/dashboard', () => new HttpResponse(null, { status: 500, statusText: 'Internal Server Error' })),
      ],
    },
  },
};

export const HighVolume: Story = {
  parameters: {
    msw: {
      handlers: [
        http.get('/api/dashboard', () => HttpResponse.json({
            stats: {
              submitted_count: 150,
              approved_count: 320,
              paid_count: 1250,
              pending_amount: '$125,750.00',
            },
            category_totals: [
              { category: 'travel', total: '$45,000.00' },
              { category: 'meals', total: '$12,500.00' },
              { category: 'office', total: '$8,000.00' },
              { category: 'software', total: '$35,000.00' },
              { category: 'equipment', total: '$55,000.00' },
              { category: 'supplies', total: '$5,250.00' },
              { category: 'other', total: '$15,000.00' },
            ],
          })),
      ],
    },
  },
};

export const NoExpenses: Story = {
  parameters: {
    msw: {
      handlers: [
        http.get('/api/dashboard', () => HttpResponse.json({
            stats: {
              submitted_count: 0,
              approved_count: 0,
              paid_count: 0,
              pending_amount: '$0.00',
            },
            category_totals: [],
          })),
      ],
    },
  },
};
