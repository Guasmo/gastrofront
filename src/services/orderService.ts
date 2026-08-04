import { API_URL } from '../lib/config';

export interface CartItem {
  product: {
    id: number;
    name: string;
    price: number;
    imageUrl: string;
    description?: string;
    category?: { name: string };
    recipes?: any[];
  };
  quantity: number;
  notes: string;
  selectedExtras: { name: string; price: number; qty: number }[];
}

export interface OrderPayload {
  customerName: string;
  total: number;
  observations: string;
  items: { productId: number; quantity: number; price: number; notes: string }[];
  paymentMethod: string | null;
}

export async function fetchMyOrders(token: string): Promise<any[]> {
  const res = await fetch(`${API_URL}/orders`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) return [];
  return res.json();
}

export async function submitOrder(payload: OrderPayload, token?: string | null): Promise<any> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${API_URL}/orders`, {
    method: 'POST',
    headers,
    body: JSON.stringify(payload),
  });

  if (!res.ok) throw new Error('Error al enviar pedido');
  return res.json();
}
