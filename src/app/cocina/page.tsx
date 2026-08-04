"use client";

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { io, Socket } from 'socket.io-client';
import { UtensilsCrossed } from 'lucide-react';
import ProtectedRoute from '../../components/ProtectedRoute';
import { API_URL, WS_URL } from '../../lib/config';
import { authFetch } from '../../lib/auth';
import CocinaKanban from '../components/CocinaKanban';

export default function CocinaPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [socket, setSocket] = useState<Socket | null>(null);
  useEffect(() => {
    const s = io(WS_URL);
    setSocket(s);
    authFetch(`${API_URL}/orders`).then(r => r.json()).then(data => { setOrders(data); }).catch(() => {});
    s.on('new_order', (order) => { setOrders(prev => { const n = [order, ...prev]; return n; }); });
    s.on('order_status_updated', (updated) => { setOrders(prev => { const n = prev.map(o => o.id === updated.id ? updated : o); return n; }); });
    return () => { s.disconnect(); };
  }, []);

  const updateStatus = useCallback(async (orderId: number, newStatus: string) => {
    setOrders(prev => { const n = prev.map(o => o.id === orderId ? { ...o, status: newStatus } : o); return n; });
    await authFetch(`${API_URL}/orders/${orderId}/status`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status: newStatus }) });
  }, []);

  return (
    <ProtectedRoute allowedRoles={['KITCHEN']}>
      <div className="cocina-root">
        <header className="cocina-header">
          <h1 className="cocina-title">Monitor de Cocina</h1>
          <nav className="cocina-nav">
            <Link href="/" className="header-btn-outline" style={{ borderColor: 'rgba(255,255,255,0.4)', color: '#fff' }}>Menu Principal</Link>
          </nav>
        </header>
        <CocinaKanban 
          orders={orders} 
          onUpdateStatus={updateStatus} 
          onSelectOrder={setSelectedOrder} 
        />

        {selectedOrder && (
          <div className="modal-overlay" onClick={() => setSelectedOrder(null)}>
            <div className="cocina-detail" onClick={e => e.stopPropagation()}>
              <button className="modal-close" onClick={() => setSelectedOrder(null)}>X</button>
              <h2 className="cocina-detail-title">Orden #{selectedOrder.id}</h2>
              <div className="cocina-detail-grid">
                <div className="cocina-detail-field"><span>Cliente</span><strong>{selectedOrder.customerName}</strong></div>
                <div className="cocina-detail-field"><span>Total</span><strong style={{ color: 'var(--primary)' }}>${selectedOrder.total?.toFixed(2)}</strong></div>
                <div className="cocina-detail-field"><span>Estado</span><strong>{selectedOrder.status}</strong></div>
                <div className="cocina-detail-field"><span>Pago</span><strong>{selectedOrder.paymentMethod || 'Sin metodo'}</strong></div>
                {selectedOrder.observations && (
                  <div className="cocina-detail-field" style={{ gridColumn: '1 / -1' }}><span>Observaciones</span><strong style={{ color: '#f59e0b' }}>{selectedOrder.observations}</strong></div>
                )}
              </div>
              <h3 className="cocina-detail-subtitle">Items del Pedido</h3>
              {selectedOrder.items?.map((item: any) => (
                <div key={item.id} className="cocina-detail-item">
                  <div className="cocina-detail-item-top" style={{ alignItems: 'center', gap: '0.5rem' }}>
                    {/* Product image in detail modal */}
                    {item.product?.imageUrl ? (
                      item.product.imageUrl.startsWith('http') ? (
                        <img
                          src={item.product.imageUrl}
                          alt={item.product.name}
                          style={{ width: 32, height: 32, borderRadius: 6, objectFit: 'cover', flexShrink: 0 }}
                        />
                      ) : (
                        <span style={{ fontSize: '1.4rem' }}>{item.product.imageUrl}</span>
                      )
                    ) : (
                      <UtensilsCrossed size={22} strokeWidth={1.5} style={{ color: '#aaa', flexShrink: 0 }} />
                    )}
                    <span><strong>{item.quantity}x</strong> {item.product?.name || `Producto #${item.productId}`}</span>
                    <span style={{ fontWeight: 600, color: '#6B7280', marginLeft: 'auto' }}>${(item.priceAtTime * item.quantity).toFixed(2)}</span>
                  </div>
                  {item.notes && <div className="cocina-detail-note">Nota: {item.notes}</div>}
                </div>
              ))}
              <div className="cocina-detail-actions">
                {selectedOrder.status === 'PENDING' && <button onClick={() => { updateStatus(selectedOrder.id, 'PREPARING'); setSelectedOrder(null); }} style={{ flex: 1, padding: '0.85rem', background: '#e4002b', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 700, cursor: 'pointer' }}>Empezar Preparacion</button>}
                {selectedOrder.status === 'PREPARING' && <button onClick={() => { updateStatus(selectedOrder.id, 'READY'); setSelectedOrder(null); }} style={{ flex: 1, padding: '0.85rem', background: '#10b981', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 700, cursor: 'pointer' }}>Marcar como Listo</button>}
                {selectedOrder.status === 'READY' && <button onClick={() => { updateStatus(selectedOrder.id, 'DELIVERED'); setSelectedOrder(null); }} style={{ flex: 1, padding: '0.85rem', background: '#6B7280', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 700, cursor: 'pointer' }}>Entregar al Cliente</button>}
              </div>
            </div>
          </div>
        )}
      </div>
    </ProtectedRoute>
  );
}
