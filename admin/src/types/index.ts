export interface User {
  id: string;
  name: string;
  email: string;
  status: 'active' | 'suspended' | 'pending';
  subscription: {
    plan: string;
    status: 'active' | 'cancelled' | 'expired';
    startDate: string;
    endDate: string;
    amount: number;
  };
  lastLogin: string;
  createdAt: string;
}

export interface SubscriptionPlan {
  id: string;
  name: string;
  price: number;
  duration: 'monthly' | 'yearly';
  features: string[];
  isActive: boolean;
  createdAt: string;
}

export interface Payment {
  id: string;
  userId: string;
  userName: string;
  amount: number;
  status: 'success' | 'failed' | 'pending' | 'refunded';
  date: string;
  method: 'card' | 'upi' | 'netbanking';
  transactionId: string;
}

export interface SupportTicket {
  id: string;
  userId: string;
  userName: string;
  subject: string;
  description: string;
  status: 'open' | 'in-progress' | 'resolved' | 'closed';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  createdAt: string;
  updatedAt: string;
}

export interface TallyConnection {
  id: string;
  companyName: string;
  status: 'connected' | 'disconnected' | 'syncing' | 'error';
  lastSync: string;
  userId: string;
  userName: string;
}

export interface DashboardStats {
  totalUsers: number;
  activeSubscriptions: number;
  monthlyRevenue: number;
  yearlyRevenue: number;
  pendingTickets: number;
  failedPayments: number;
}

export interface ChartData {
  month: string;
  revenue: number;
  users: number;
  subscriptions: number;
}

export interface AIInsight {
  id: string;
  type: 'churn' | 'renewal' | 'usage' | 'trend';
  title: string;
  description: string;
  confidence: number;
  impact: 'high' | 'medium' | 'low';
  createdAt: string;
}