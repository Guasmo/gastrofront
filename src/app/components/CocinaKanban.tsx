'use client';

import { useMemo, useCallback } from 'react';
import { Kanban, BoardData, BoardItem } from 'react-kanban-kit';

const COLUMNS = [
  { id: 'PENDING', title: 'Recibido', color: '#e4002b', bg: '#fff5f5' },
  { id: 'PREPARING', title: 'Preparando', color: '#f59e0b', bg: '#fffbeb' },
  { id: 'READY', title: 'Listo', color: '#10b981', bg: '#f0fdf4' },
];

function buildBoardData(orders: any[]): BoardData {
  const items: Record<string, BoardItem> = {};
  items['root'] = { id: 'root', title: 'root', parentId: null, children: COLUMNS.map(c => c.id), totalChildrenCount: COLUMNS.length };

  for (const col of COLUMNS) {
    const colOrders = orders.filter(o => o.status === col.id).sort((a, b) => a.id - b.id);
    items[col.id] = { id: col.id, title: col.title, parentId: 'root', children: colOrders.map(o => `order-${o.id}`), totalChildrenCount: colOrders.length };
    for (const order of colOrders) {
      items[`order-${order.id}`] = { id: `order-${order.id}`, title: `#${order.id} - ${order.customerName}`, parentId: col.id, children: [], totalChildrenCount: 0, content: order, type: 'order' };
    }
  }
  return { root: items['root'], ...items };
}

interface CocinaKanbanProps {
  orders: any[];
  onUpdateStatus: (orderId: number, status: string) => void;
  onSelectOrder?: (order: any) => void;
  compact?: boolean;
}

export default function CocinaKanban({ orders, onUpdateStatus, onSelectOrder, compact = false }: CocinaKanbanProps) {
  const boardData = useMemo(() => buildBoardData(orders), [orders]);

  const handleCardMove = useCallback(async (params: { cardId: string; fromColumnId: string; toColumnId: string; position: number }) => {
    await onUpdateStatus(parseInt(params.cardId.replace('order-', '')), params.toColumnId);
  }, [onUpdateStatus]);

  const configMap = useMemo(() => ({
    order: {
      render: ({ data, column }: { data: BoardItem; column: BoardItem }) => {
        const order = data.content;
        if (!order) return <div style={{ padding: '1rem', color: '#999' }}>Sin datos</div>;
        const col = COLUMNS.find(c => c.id === column.id);
        const nextStatusMap: Record<string, string> = { PENDING: 'PREPARING', PREPARING: 'READY' };
        const nextLabelMap: Record<string, string> = { PENDING: 'Empezar Preparacion', PREPARING: 'Marcar Listo' };

        return (
          <div onClick={() => onSelectOrder?.(order)} className="kanban-card" style={{ padding: compact ? '0.75rem' : '1rem' }}>
            <div className="kanban-card-header">
              <span className="kanban-card-id">#{order.id}</span>
              <span className="kanban-badge" style={{ background: col?.color + '20', color: col?.color }}>{col?.title}</span>
            </div>
            <div className="kanban-card-customer" style={{ fontSize: compact ? '0.9rem' : '1rem' }}>{order.customerName}</div>
            <div className="kanban-card-items">
              {order.items?.slice(0, compact ? 2 : 3).map((item: any) => (
                <div key={item.id} className="kanban-card-item" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: compact ? '0.85rem' : '0.9rem' }}>
                  {item.product?.imageUrl ? (
                    item.product.imageUrl.startsWith('http') ? (
                      <img
                        src={item.product.imageUrl}
                        alt={item.product.name}
                        style={{ width: compact ? 20 : 24, height: compact ? 20 : 24, borderRadius: 4, objectFit: 'cover', flexShrink: 0 }}
                      />
                    ) : (
                      <span style={{ fontSize: compact ? '0.9rem' : '1rem', flexShrink: 0 }}>{item.product.imageUrl}</span>
                    )
                  ) : (
                    <span style={{ fontSize: compact ? '0.9rem' : '1rem', flexShrink: 0 }}>🍽️</span>
                  )}
                  <span className="kanban-item-qty">{item.quantity}x</span>
                  <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.product?.name}</span>
                </div>
              ))}
              {order.items?.length > (compact ? 2 : 3) && <div className="kanban-card-more">+{order.items.length - (compact ? 2 : 3)} mas</div>}
              {order.items?.some((i: any) => i.notes) && <div className="kanban-card-note">Tiene notas</div>}
              {order.observations && <div className="kanban-card-note" style={{ color: '#f59e0b' }}>Obs: {order.observations}</div>}
            </div>
            {nextStatusMap[column.id] && (
              <button className="kanban-action-btn" style={{ background: column.id === 'PENDING' ? '#e4002b' : '#10b981', padding: compact ? '0.5rem' : '0.75rem', fontSize: compact ? '0.8rem' : '0.9rem' }}
                onClick={(e) => { e.stopPropagation(); onUpdateStatus(order.id, nextStatusMap[column.id]); }}>
                {nextLabelMap[column.id]}
              </button>
            )}
          </div>
        );
      },
    },
  }), [compact, onSelectOrder, onUpdateStatus]);

  const renderColumnHeader = useCallback((column: BoardItem) => {
    const col = COLUMNS.find(c => c.id === column.id);
    const count = column.children?.length || 0;
    return (
      <div className="kanban-col-header" style={{ background: col?.color, padding: compact ? '0.5rem' : '0.75rem' }}>
        <span style={{ fontSize: compact ? '0.9rem' : '1rem' }}>{col?.title}</span>
        <span className="kanban-col-count">{count}</span>
      </div>
    );
  }, [compact]);

  return (
    <div className="cocina-kanban">
      <Kanban
        dataSource={boardData}
        configMap={configMap}
        renderColumnHeader={renderColumnHeader}
        onCardMove={handleCardMove}
        allowColumnDrag={false}
        cardsGap={compact ? 8 : 10}
        columnWrapperStyle={() => ({
          background: '#f8f9fa', borderRadius: '12px', border: '1px solid #e9ecef',
          minWidth: compact ? '260px' : '320px', maxWidth: compact ? '280px' : '360px',
          maxHeight: compact ? '500px' : 'calc(100vh - 100px)', display: 'flex', flexDirection: 'column',
        })}
        columnListContentStyle={() => ({ padding: compact ? '0.5rem' : '0.75rem', minHeight: '80px', flex: 1, overflowY: 'auto' })}
      />
    </div>
  );
}
