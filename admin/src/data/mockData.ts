import type { User, SubscriptionPlan, Payment, SupportTicket, TallyConnection, DashboardStats, ChartData, AIInsight } from '../types';

export const mockUsers: User[] = [
  {
    id: '1',
    name: 'John Doe',
    email: 'john@example.com',
    status: 'active',
    subscription: {
      plan: 'Professional',
      status: 'active',
      startDate: '2024-01-15',
      endDate: '2024-12-15',
      amount: 2999
    },
    lastLogin: '2024-01-10T10:30:00Z',
    createdAt: '2024-01-01T00:00:00Z'
  },
  {
    id: '2',
    name: 'Jane Smith',
    email: 'jane@example.com',
    status: 'active',
    subscription: {
      plan: 'Business',
      status: 'active',
      startDate: '2024-02-01',
      endDate: '2024-12-01',
      amount: 4999
    },
    lastLogin: '2024-01-09T14:20:00Z',
    createdAt: '2024-01-15T00:00:00Z'
  },
  {
    id: '3',
    name: 'Mike Johnson',
    email: 'mike@example.com',
    status: 'suspended',
    subscription: {
      plan: 'Basic',
      status: 'cancelled',
      startDate: '2023-12-01',
      endDate: '2024-01-01',
      amount: 1499
    },
    lastLogin: '2024-01-05T09:15:00Z',
    createdAt: '2023-12-01T00:00:00Z'
  }
];

export const mockPlans: SubscriptionPlan[] = [
  {
    id: '1',
    name: 'Basic',
    price: 1499,
    duration: 'monthly',
    features: ['Single Company', 'Basic Reports', 'Email Support'],
    isActive: true,
    createdAt: '2024-01-01T00:00:00Z'
  },
  {
    id: '2',
    name: 'Professional',
    price: 2999,
    duration: 'monthly',
    features: ['Multiple Companies', 'Advanced Reports', 'Priority Support', 'API Access'],
    isActive: true,
    createdAt: '2024-01-01T00:00:00Z'
  },
  {
    id: '3',
    name: 'Business',
    price: 4999,
    duration: 'monthly',
    features: ['Unlimited Companies', 'Custom Reports', '24/7 Support', 'API Access', 'White Label'],
    isActive: true,
    createdAt: '2024-01-01T00:00:00Z'
  }
];

export const mockPayments: Payment[] = [
  {
    id: '1',
    userId: '1',
    userName: 'John Doe',
    amount: 2999,
    status: 'success',
    date: '2024-01-15T10:30:00Z',
    method: 'card',
    transactionId: 'TXN_123456789'
  },
  {
    id: '2',
    userId: '2',
    userName: 'Jane Smith',
    amount: 4999,
    status: 'success',
    date: '2024-01-14T14:20:00Z',
    method: 'upi',
    transactionId: 'TXN_987654321'
  },
  {
    id: '3',
    userId: '3',
    userName: 'Mike Johnson',
    amount: 1499,
    status: 'failed',
    date: '2024-01-13T09:15:00Z',
    method: 'netbanking',
    transactionId: 'TXN_456789123'
  }
];

export const mockTickets: SupportTicket[] = [
  {
    id: '1',
    userId: '1',
    userName: 'John Doe',
    subject: 'Unable to sync Tally data',
    description: 'I am facing issues while syncing my Tally data with the application.',
    status: 'open',
    priority: 'high',
    createdAt: '2024-01-10T10:30:00Z',
    updatedAt: '2024-01-10T10:30:00Z'
  },
  {
    id: '2',
    userId: '2',
    userName: 'Jane Smith',
    subject: 'Billing inquiry',
    description: 'I need clarification on my recent billing statement.',
    status: 'in-progress',
    priority: 'medium',
    createdAt: '2024-01-09T14:20:00Z',
    updatedAt: '2024-01-09T15:00:00Z'
  }
];

export const mockConnections: TallyConnection[] = [
  {
    id: '1',
    companyName: 'ABC Enterprises',
    status: 'connected',
    lastSync: '2024-01-10T10:30:00Z',
    userId: '1',
    userName: 'John Doe'
  },
  {
    id: '2',
    companyName: 'XYZ Corp',
    status: 'syncing',
    lastSync: '2024-01-09T14:20:00Z',
    userId: '2',
    userName: 'Jane Smith'
  }
];

export const mockStats: DashboardStats = {
  totalUsers: 1247,
  activeSubscriptions: 856,
  monthlyRevenue: 2547800,
  yearlyRevenue: 28456900,
  pendingTickets: 12,
  failedPayments: 8
};

export const mockChartData: ChartData[] = [
  { month: 'Jan', revenue: 2100000, users: 180, subscriptions: 120 },
  { month: 'Feb', revenue: 2300000, users: 220, subscriptions: 150 },
  { month: 'Mar', revenue: 2400000, users: 250, subscriptions: 180 },
  { month: 'Apr', revenue: 2600000, users: 280, subscriptions: 200 },
  { month: 'May', revenue: 2450000, users: 320, subscriptions: 220 },
  { month: 'Jun', revenue: 2700000, users: 360, subscriptions: 250 },
  { month: 'Jul', revenue: 2800000, users: 400, subscriptions: 280 },
  { month: 'Aug', revenue: 2900000, users: 440, subscriptions: 310 },
  { month: 'Sep', revenue: 2750000, users: 480, subscriptions: 330 },
  { month: 'Oct', revenue: 2850000, users: 520, subscriptions: 360 },
  { month: 'Nov', revenue: 2950000, users: 560, subscriptions: 390 },
  { month: 'Dec', revenue: 2547800, users: 600, subscriptions: 420 }
];

export const mockAIInsights: AIInsight[] = [
  {
    id: '1',
    type: 'churn',
    title: 'High Churn Risk Identified',
    description: '12 users are at high risk of churning based on usage patterns',
    confidence: 85,
    impact: 'high',
    createdAt: '2024-01-10T10:30:00Z'
  },
  {
    id: '2',
    type: 'renewal',
    title: 'Renewal Opportunity',
    description: '45 subscriptions are due for renewal in the next 30 days',
    confidence: 92,
    impact: 'medium',
    createdAt: '2024-01-09T14:20:00Z'
  },
  {
    id: '3',
    type: 'usage',
    title: 'Feature Usage Trend',
    description: 'API usage has increased by 34% this month',
    confidence: 78,
    impact: 'low',
    createdAt: '2024-01-08T09:15:00Z'
  }
];