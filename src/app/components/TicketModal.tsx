'use client';

import { CheckCircle2, Download } from 'lucide-react';

interface TicketModalProps {
  order: any;
  onClose: () => void;
}

export default function TicketModal({ order, onClose }: TicketModalProps) {
  if (!order) return null;

  const ticketContent = `
================================
       GASTROCONTROL
================================

  TICKET #${order.id}
  ${new Date(order.createdAt).toLocaleString('es-EC')}

--------------------------------
  Cliente: ${order.customerName}
  Metodo: ${order.paymentMethod || 'Sin metodo'}
--------------------------------

  ${order.items?.map((item: any) =>
    `${item.quantity}x ${item.product?.name || 'Producto'}  $${(item.priceAtTime * item.quantity).toFixed(2)}`
  ).join('\n  ')}

--------------------------------
  TOTAL: $${order.total?.toFixed(2)}

${order.observations ? `\n  Obs: ${order.observations}\n` : ''}
================================
  Gracias por tu pedido!
================================`.trim();

  const handleDownload = () => {
    const blob = new Blob([ticketContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ticket-${order.id}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="ticket-modal" onClick={e => e.stopPropagation()}>
        <div className="ticket-modal-check">
          <CheckCircle2 size={56} strokeWidth={1.8} color="#10b981" />
        </div>
        <h2 className="ticket-modal-title">Pedido Enviado!</h2>
        <p className="ticket-modal-sub">Tu pedido llego a la cocina</p>

        <div className="ticket-modal-number">
          <span className="ticket-modal-label">Numero de ticket</span>
          <span className="ticket-modal-id">#{order.id}</span>
        </div>

        <div className="ticket-modal-details">
          <div className="ticket-modal-row">
            <span>Cliente</span>
            <strong>{order.customerName}</strong>
          </div>
          <div className="ticket-modal-row">
            <span>Metodo de pago</span>
            <strong>{order.paymentMethod || 'Sin metodo'}</strong>
          </div>
          <div className="ticket-modal-row">
            <span>Total</span>
            <strong style={{ color: 'var(--primary)' }}>${order.total?.toFixed(2)}</strong>
          </div>
          {order.observations && (
            <div className="ticket-modal-row">
              <span>Observaciones</span>
              <strong style={{ fontSize: '0.8rem' }}>{order.observations}</strong>
            </div>
          )}
        </div>

        <div className="ticket-modal-actions">
          <button onClick={handleDownload} className="ticket-modal-btn ticket-modal-btn--download">
            <Download size={16} strokeWidth={2.5} /> Descargar Ticket
          </button>
          <button onClick={onClose} className="ticket-modal-btn ticket-modal-btn--close">
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}
