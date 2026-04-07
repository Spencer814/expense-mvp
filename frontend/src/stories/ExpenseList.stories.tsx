import type { Meta, StoryObj } from '@storybook/react';
import { http, HttpResponse } from 'msw';
import { BrowserRouter } from 'react-router-dom';
import ExpenseList from '../components/ExpenseList';

const mockExpenses = [
  {
    id: 1,
    title: 'Office Supplies',
    vendor_name: 'Staples',
    amount: '$45.00',
    expense_date: '2024-03-15',
    status: 'draft' as const,
  },
  {
    id: 2,
    title: 'Client Lunch',
    vendor_name: 'The Capital Grille',
    amount: '$125.00',
    expense_date: '2024-03-10',
    status: 'submitted' as const,
  },
  {
    id: 3,
    title: 'Software License',
    vendor_name: 'JetBrains',
    amount: '$299.00',
    expense_date: '2024-03-01',
    status: 'approved' as const,
  },
  {
    id: 4,
    title: 'Travel to Conference',
    vendor_name: 'United Airlines',
    amount: '$450.00',
    expense_date: '2024-02-28',
    status: 'paid' as const,
  },
  {
    id: 5,
    title: 'Personal Item',
    vendor_name: 'Amazon',
    amount: '$80.00',
    expense_date: '2024-02-25',
    status: 'rejected' as const,
  },
];

const meta: Meta<typeof ExpenseList> = {
  title: 'Expense/ExpenseList',
  component: ExpenseList,
  decorators: [
    (Story) => (
      <BrowserRouter>
        <Story />
      </BrowserRouter>
    ),
  ],
  parameters: {
    layout: 'fullscreen',
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof ExpenseList>;

export const Default: Story = {
  parameters: {
    msw: {
      handlers: [
        http.get('/api/expenses', () => HttpResponse.json(mockExpenses)),
      ],
    },
  },
};

export const Loading: Story = {
  parameters: {
    msw: {
      handlers: [
        http.get('/api/expenses', async () => {
          await new Promise<void>((resolve) => { setTimeout(resolve, 999999); });
          return HttpResponse.json([]);
        }),
      ],
    },
  },
};

export const Empty: Story = {
  parameters: {
    msw: {
      handlers: [
        http.get('/api/expenses', () => HttpResponse.json([])),
      ],
    },
  },
};

export const Error: Story = {
  parameters: {
    msw: {
      handlers: [
        http.get('/api/expenses', () => new HttpResponse(null, { status: 500, statusText: 'Internal Server Error' })),
      ],
    },
  },
};

export const OnlyDrafts: Story = {
  parameters: {
    msw: {
      handlers: [
        http.get('/api/expenses', () => HttpResponse.json(mockExpenses.filter((e) => e.status === 'draft'))),
      ],
    },
  },
};

export const ManyExpenses: Story = {
  parameters: {
    msw: {
      handlers: [
        http.get('/api/expenses', () => {
          const manyExpenses = Array.from({ length: 20 }, (_, i) => ({
            id: i + 1,
            title: `Expense ${i + 1}`,
            vendor_name: `Vendor ${i + 1}`,
            amount: `$${(Math.random() * 500).toFixed(2)}`,
            expense_date: new Date(2026, 2, 28 - i).toISOString().split('T')[0],
            status: (['draft', 'submitted', 'approved', 'rejected', 'paid'] as const)[i % 5],
          }));
          return HttpResponse.json(manyExpenses);
        }),
      ],
    },
  },
};
