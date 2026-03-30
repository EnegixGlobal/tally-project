type CreateOrderPayload = {
  orderId: string;
  amount: number;
  currency?: string;
  user?: { id?: string | number; name?: string; email?: string } | null;
  productinfo?: string;
  planId?: string | number;
  companyId?: string | number;
};

const API_BASE = import.meta.env.VITE_API_URL || '';

export async function createOrder(payload: CreateOrderPayload) {
  const token = localStorage.getItem('token');
  const res = await fetch(`${API_BASE}/api/payments/create-order`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`createOrder failed: ${res.status} ${text}`);
  }
  return res.json();
}

export async function getPaymentStatus(orderId: string) {
  const token = localStorage.getItem('token');
  const res = await fetch(`${API_BASE}/api/payments/status/${encodeURIComponent(orderId)}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`getPaymentStatus failed: ${res.status} ${text}`);
  }
  return res.json();
}

export default { createOrder, getPaymentStatus };
