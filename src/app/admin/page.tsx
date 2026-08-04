"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { io } from 'socket.io-client';
import ProtectedRoute from '../../components/ProtectedRoute';
import { API_URL, WS_URL } from '../../lib/config';
import { authFetch } from '../../lib/auth';

export default function AdminPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [inventory, setInventory] = useState<any[]>([]);
  const [lowStockAlerts, setLowStockAlerts] = useState<any[]>([]);

  useEffect(() => {
    authFetch(`${API_URL}/orders`).then(r => r.json()).then(data => setOrders(data)).catch(() => { });
    authFetch(`${API_URL}/inventory`).then(r => r.json()).then(data => setInventory(data)).catch(() => { });
    authFetch(`${API_URL}/inventory/alerts`).then(r => r.json()).then(data => setLowStockAlerts(data)).catch(() => { });

    const socket = io(WS_URL);

    socket.on('order_status_updated', (updated) => {
      setOrders(prev => prev.map(o => o.id === updated.id ? updated : o));
    });

    socket.on('new_order', (order) => {
      setOrders(prev => [order, ...prev]);
    });

    socket.on('low_stock_alert', (data) => {
      setLowStockAlerts(prev => {
        const exists = prev.find(a => a.item === data.item);
        if (exists) return prev;
        return [...prev, data];
      });
    });

    return () => { socket.disconnect(); };
  }, []);

  const markAsPaid = async (id: number) => {
    await authFetch(`${API_URL}/orders/${id}/payment`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ method: 'EFECTIVO' })
    });
    setOrders(prev => prev.map(o => o.id === id ? { ...o, paymentStatus: 'PAID', paymentMethod: 'EFECTIVO' } : o));
  };

  const advanceStatus = async (id: number, currentStatus: string) => {
    let nextStatus = currentStatus;
    if (currentStatus === 'PENDING') nextStatus = 'APPROVED';
    else if (currentStatus === 'APPROVED') nextStatus = 'PREPARING';
    else if (currentStatus === 'PREPARING') nextStatus = 'READY';
    else if (currentStatus === 'READY') nextStatus = 'DELIVERED';

    await authFetch(`${API_URL}/orders/${id}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: nextStatus })
    });
  };

  return (
    <ProtectedRoute allowedRoles={['ADMIN']}>
      <main className="container">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
          <h1>Panel de Administracion</h1>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <Link href="/productos" className="btn btn-secondary">Gestionar Menu</Link>
            <Link href="/menu-items" className="btn btn-secondary">Volver al Inicio</Link>
          </div>
        </div>

        {lowStockAlerts.length > 0 && (
          <div style={{ marginBottom: '2rem', padding: '1rem', background: '#FEF3C7', border: '1px solid #F59E0B', borderRadius: 'var(--border-radius)' }}>
            <h3 style={{ color: '#92400E', marginBottom: '0.5rem' }}>Alertas de Stock Bajo</h3>
            {lowStockAlerts.map((alert, i) => (
              <div key={i} style={{ padding: '0.5rem 0', color: '#92400E', fontSize: '0.9rem' }}>
                <strong>{alert.item}</strong>: {alert.current} restante (minimo: {alert.minimum})
              </div>
            ))}
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '1.5rem' }}>
          <div className="card" style={{ padding: '1.5rem' }}>
            <h2 style={{ borderBottom: '2px solid var(--primary-color)', paddingBottom: '0.5rem', marginBottom: '1.5rem' }}>Monitor de Cocina</h2>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {orders.filter(o => o.status !== 'DELIVERED' && o.status !== 'COMPLETED').map(order => (
                <div key={order.id} className="card" style={{ padding: '1rem', borderLeft: order.status === 'READY' ? '4px solid #4CAF50' : '4px solid var(--primary-color)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                    <strong>#{order.id} - {order.customerName}</strong>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{order.status}</span>
                  </div>
                  <button
                    onClick={() => advanceStatus(order.id, order.status)}
                    className="btn btn-primary"
                    style={{ width: '100%', padding: '0.5rem', fontSize: '0.8rem' }}
                  >
                    {order.status === 'PENDING' ? 'Aprobar' : order.status === 'APPROVED' ? 'Preparar' : order.status === 'PREPARING' ? 'Marcar Listo' : 'Entregar'}
                  </button>
                </div>
              ))}
              {orders.filter(o => o.status !== 'DELIVERED' && o.status !== 'COMPLETED').length === 0 && <p>No hay ordenes activas en cocina.</p>}
            </div>
          </div>

          <div className="card" style={{ padding: '1.5rem' }}>
            <h2 style={{ borderBottom: '2px solid #4CAF50', paddingBottom: '0.5rem', marginBottom: '1.5rem' }}>Control de Caja</h2>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {orders.filter(o => o.paymentStatus === 'UNPAID').map(order => (
                <div key={order.id} className="card" style={{ padding: '1rem', borderLeft: '4px solid #FFC107' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                    <strong>#{order.id} - {order.customerName}</strong>
                    <span style={{ fontWeight: 'bold', color: 'var(--primary-color)' }}>${order.total.toFixed(2)}</span>
                  </div>
                  <button
                    onClick={() => markAsPaid(order.id)}
                    className="btn btn-secondary"
                    style={{ width: '100%', padding: '0.5rem', fontSize: '0.8rem', marginTop: '0.5rem', borderColor: '#4CAF50', color: '#4CAF50' }}
                  >
                    Marcar como Pagado
                  </button>
                </div>
              ))}
              {orders.filter(o => o.paymentStatus === 'UNPAID').length === 0 && <p>No hay pagos pendientes.</p>}
            </div>
          </div>

          <div className="card" style={{ padding: '1.5rem' }}>
            <h2 style={{ borderBottom: '2px solid #00BCD4', paddingBottom: '0.5rem', marginBottom: '1.5rem' }}>Inventario</h2>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {inventory.map(item => (
                <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem', borderRadius: '4px', background: item.quantity <= item.minimumStock && item.minimumStock > 0 ? '#FEF3C7' : 'transparent' }}>
                  <span>{item.name}</span>
                  <span style={{ fontWeight: 'bold' }}>{item.quantity} {item.unit}</span>
                </div>
              ))}
              {inventory.length === 0 && <p>No hay items en inventario.</p>}
            </div>
          </div>
        </div>
      </main>
    </ProtectedRoute>
  );
}
