"use client";

import { useState, useEffect, useMemo } from 'react';
import { io, Socket } from 'socket.io-client';
import { Kanban, BoardData, BoardItem } from 'react-kanban-kit';
import ProtectedRoute from '../../components/ProtectedRoute';
import { API_URL, WS_URL } from '../../lib/config';
import { authFetch } from '../../lib/auth';

const COLUMNS = [
  { id: 'PENDING', title: 'Recibido', color: '#e4002b', bg: '#fff5f5' },
  { id: 'PREPARING', title: 'Preparando', color: '#f59e0b', bg: '#fffbeb' },
  { id: 'READY', title: 'Listo', color: '#10b981', bg: '#f0fdf4' },
];

function buildBoardData(orders: any[]): BoardData {
  const items: Record<string, BoardItem> = {};
  items['root'] = { id: 'root', title: 'root', parentId: null, children: COLUMNS.map(c => c.id), totalChildrenCount: COLUMNS.length };

  for (const col of COLUMNS) {
    const colOrders = orders.filter(o => o.status === col.id).sort((a: any, b: any) => a.id - b.id);
    items[col.id] = { id: col.id, title: col.title, parentId: 'root', children: colOrders.map((o: any) => `order-${o.id}`), totalChildrenCount: colOrders.length };
    for (const order of colOrders) {
      items[`order-${order.id}`] = { id: `order-${order.id}`, title: `#${order.id} - ${order.customerName}`, parentId: col.id, children: [], totalChildrenCount: 0, content: order, type: 'order' };
    }
  }
  return { root: items['root'], ...items };
}

export default function PantallaTVPage() {
  const [orders, setOrders] = useState<any[]>([]);

  useEffect(() => {
    const s: Socket = io(WS_URL);
    authFetch(`${API_URL}/orders`).then(r => r.json()).then(data => setOrders(data)).catch(() => {});
    s.on('new_order', (order: any) => setOrders(prev => [order, ...prev]));
    s.on('order_status_updated', (updated: any) => setOrders(prev => prev.map(o => o.id === updated.id ? updated : o)));
    return () => { s.disconnect(); };
  }, []);

  const boardData = useMemo(() => buildBoardData(orders), [orders]);

  const configMap = useMemo(() => ({
    order: {
      render: ({ data, column }: { data: BoardItem; column: BoardItem }) => {
        const order = data.content;
        if (!order) return null;
        const col = COLUMNS.find(c => c.id === column.id);
        return (
          <div className="tv-card">
            <div className="tv-card-header">
              <span className="tv-card-id">#{order.id}</span>
              <span className="tv-badge" style={{ background: col?.color + '20', color: col?.color }}>{col?.title}</span>
            </div>
            <div className="tv-card-customer">{order.customerName}</div>
            <div className="tv-card-items">
              {order.items?.slice(0, 4).map((item: any) => (
                <div key={item.id} className="tv-card-item">
                  <span className="tv-item-qty">{item.quantity}x</span>
                  <span>{item.product?.name}</span>
                </div>
              ))}
              {order.items?.length > 4 && <div className="tv-card-more">+{order.items.length - 4} mas</div>}
              {order.items?.some((i: any) => i.notes) && <div className="tv-card-note">Tiene notas</div>}
              {order.observations && <div className="tv-card-note" style={{ color: '#f59e0b' }}>Obs: {order.observations}</div>}
            </div>
          </div>
        );
      },
    },
  }), []);

  const renderColumnHeader = (column: BoardItem) => {
    const col = COLUMNS.find(c => c.id === column.id);
    const count = column.children?.length || 0;
    return (
      <div className="tv-col-header" style={{ background: col?.color }}>
        <span>{col?.title}</span>
        <span className="tv-col-count">{count}</span>
      </div>
    );
  };

  return (
    <ProtectedRoute allowedRoles={['KITCHEN', 'ADMIN']}>
      <div className="tv-root">
        <header className="tv-header">
          <div className="tv-header-left">
            <span className="tv-logo">GastroControl</span>
            <span className="tv-subtitle">Pantalla de Cocina</span>
          </div>
          <div className="tv-header-right">
            <span className="tv-clock">{new Date().toLocaleTimeString('es-EC', { hour: '2-digit', minute: '2-digit' })}</span>
          </div>
        </header>
        <div className="tv-kanban">
          <Kanban
            dataSource={boardData}
            configMap={configMap}
            renderColumnHeader={renderColumnHeader}
            allowColumnDrag={false}
            cardsGap={12}
            columnWrapperStyle={() => ({
              background: '#f9fafb', borderRadius: '16px', border: '2px solid #e5e7eb',
              minWidth: '320px', maxWidth: '400px', flex: 1,
              maxHeight: 'calc(100vh - 90px)', display: 'flex', flexDirection: 'column',
            })}
            columnListContentStyle={() => ({ padding: '1rem', minHeight: '100px', flex: 1, overflowY: 'auto' })}
          />
        </div>
      </div>
    </ProtectedRoute>
  );
}
