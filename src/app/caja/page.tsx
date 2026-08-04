"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { io } from 'socket.io-client';
import toast, { Toaster } from 'react-hot-toast';
import { FileText, CheckCircle2 } from 'lucide-react';
import ProtectedRoute from '../../components/ProtectedRoute';
import { API_URL, WS_URL } from '../../lib/config';
import { authFetch } from '../../lib/auth';

export default function CajaPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [viewingReceipt, setViewingReceipt] = useState<any>(null);
  const [confirmingOrder, setConfirmingOrder] = useState<any | null>(null);
  const [confirmingMethod, setConfirmingMethod] = useState<'EFECTIVO' | 'TRANSFERENCIA' | null>(null);

  useEffect(() => {
    authFetch(`${API_URL}/orders`).then(r => r.json()).then(data => setOrders(data)).catch(() => { });
    const socket = io(WS_URL);
    socket.on('order_status_updated', (u) => setOrders(prev => prev.map(o => o.id === u.id ? u : o)));
    socket.on('new_order', (o) => setOrders(prev => [o, ...prev]));
    return () => { socket.disconnect(); };
  }, []);

  const markAsPaid = async (id: number, method: string) => {
    await authFetch(`${API_URL}/orders/${id}/payment`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ method }),
    });
    setOrders(prev => prev.map(o => o.id === id ? { ...o, paymentStatus: 'PAID', paymentMethod: method } : o));
    toast.success('Pago confirmado');
  };

  const unpaidOrders = orders.filter(o => o.paymentStatus === 'UNPAID');
  const paidToday = orders.filter(o => o.paymentStatus === 'PAID' && new Date(o.updatedAt).toDateString() === new Date().toDateString());

  return (
    <ProtectedRoute allowedRoles={['ADMIN', 'CASHIER']}>
      <main className="container">
        <Toaster position="top-center" />
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
          <h1>Control de Caja</h1>
          <Link href="/menu-items" className="btn btn-secondary">Volver</Link>
        </div>

        {/* CIERRE DE CAJA DIARIA */}
        <div className="card" style={{ padding: '1.5rem', marginBottom: '2rem', background: 'linear-gradient(to right, #f8fafc, #f1f5f9)' }}>
          <h2 style={{ fontSize: '1.2rem', marginBottom: '1rem', color: 'var(--primary-color)', borderBottom: '2px solid var(--border-color)', paddingBottom: '0.5rem' }}>
            Cierre de Caja Diaria (Hoy)
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
            <div style={{ background: '#fff', padding: '1rem', borderRadius: '8px', border: '1px solid var(--border-color)', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
              <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', display: 'block' }}>Total Recaudado</span>
              <strong style={{ fontSize: '1.5rem', color: '#10b981' }}>
                ${paidToday.reduce((sum, o) => sum + o.total, 0).toFixed(2)}
              </strong>
            </div>
            <div style={{ background: '#fff', padding: '1rem', borderRadius: '8px', border: '1px solid var(--border-color)', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
              <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', display: 'block' }}>Pedidos Completados</span>
              <strong style={{ fontSize: '1.5rem', color: 'var(--text-primary)' }}>
                {paidToday.length}
              </strong>
            </div>
            <div style={{ background: '#fff', padding: '1rem', borderRadius: '8px', border: '1px solid var(--border-color)', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
              <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', display: 'block' }}>En Efectivo</span>
              <strong style={{ fontSize: '1.5rem', color: '#f59e0b' }}>
                ${paidToday.filter(o => o.paymentMethod === 'EFECTIVO').reduce((sum, o) => sum + o.total, 0).toFixed(2)}
              </strong>
            </div>
            <div style={{ background: '#fff', padding: '1rem', borderRadius: '8px', border: '1px solid var(--border-color)', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
              <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', display: 'block' }}>En Transferencia</span>
              <strong style={{ fontSize: '1.5rem', color: '#00BCD4' }}>
                ${paidToday.filter(o => o.paymentMethod === 'TRANSFERENCIA').reduce((sum, o) => sum + o.total, 0).toFixed(2)}
              </strong>
            </div>
          </div>
        </div>

        <h2 style={{ fontSize: '1.2rem', marginBottom: '1rem', color: 'var(--text-secondary)' }}>
          Pedidos Pendientes ({unpaidOrders.length})
        </h2>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '1.5rem', marginBottom: '3rem' }}>
          {unpaidOrders.map(order => (
            <div key={order.id} className="card" style={{ padding: '1.5rem', borderLeft: order.receiptUrl ? '6px solid #00BCD4' : '6px solid #FFC107' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem', alignItems: 'center' }}>
                <div>
                  <strong style={{ fontSize: '1.15rem' }}>#{order.id} - {order.customerName}</strong>
                  {order.paymentMethod && (
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
                      Metodo: <strong>{order.paymentMethod}</strong>
                    </div>
                  )}
                </div>
                <span style={{ fontSize: '1.4rem', fontWeight: 'bold', color: 'var(--primary-color)' }}>${order.total.toFixed(2)}</span>
              </div>

              <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.75rem' }}>
                {order.items.map((it: any) => `${it.quantity}x ${it.product.name}`).join(', ')}
              </div>

              {order.receiptUrl && (
                <div
                  onClick={() => setViewingReceipt(order)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    padding: '0.75rem',
                    background: '#eff6ff',
                    border: '1px solid #bfdbfe',
                    borderRadius: '8px',
                    marginBottom: '0.75rem',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                  }}
                  onMouseEnter={e => (e.currentTarget.style.background = '#dbeafe')}
                  onMouseLeave={e => (e.currentTarget.style.background = '#eff6ff')}
                >
                  <FileText size={22} strokeWidth={1.8} style={{ color: '#1e40af' }} />
                  <div>
                    <strong style={{ fontSize: '0.85rem', color: '#1e40af' }}>Comprobante disponible</strong>
                    <span style={{ display: 'block', fontSize: '0.75rem', color: '#60a5fa' }}>Click para ver</span>
                  </div>
                </div>
              )}

              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button
                  onClick={() => { setConfirmingOrder(order); setConfirmingMethod('EFECTIVO'); }}
                  style={{
                    flex: 1,
                    padding: '0.7rem',
                    borderRadius: '8px',
                    border: '2px solid #22c55e',
                    background: order.paymentMethod === 'EFECTIVO' ? '#f0fdf4' : '#fff',
                    color: '#16a34a',
                    fontWeight: 700,
                    fontSize: '0.85rem',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                  }}
                >
                  {order.receiptUrl ? 'Aprobar + Efectivo' : 'Efectivo'}
                </button>
                <button
                  onClick={() => { setConfirmingOrder(order); setConfirmingMethod('TRANSFERENCIA'); }}
                  style={{
                    flex: 1,
                    padding: '0.7rem',
                    borderRadius: '8px',
                    border: `2px solid ${order.receiptUrl ? '#00BCD4' : '#60a5fa'}`,
                    background: order.paymentMethod === 'TRANSFERENCIA' ? '#f0f9ff' : order.receiptUrl ? '#ecfeff' : '#fff',
                    color: order.receiptUrl ? '#0097a7' : '#0284c7',
                    fontWeight: 700,
                    fontSize: '0.85rem',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                  }}
                >
                  {order.receiptUrl ? 'Aprobar Transferencia' : 'Transferencia'}
                </button>
              </div>
            </div>
          ))}
          {unpaidOrders.length === 0 && (
            <div className="card" style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)' }}>
              <CheckCircle2 size={44} strokeWidth={1.2} style={{ display: 'block', margin: '0 auto 0.5rem', color: '#22c55e' }} />
              No hay pagos pendientes
            </div>
          )}
        </div>



        {viewingReceipt && (
          <div
            style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: '1rem' }}
            onClick={() => setViewingReceipt(null)}
          >
            <div
              style={{ background: '#fff', borderRadius: '16px', padding: '2rem', maxWidth: '500px', width: '100%', position: 'relative', maxHeight: '90vh', overflow: 'auto' }}
              onClick={e => e.stopPropagation()}
            >
              <button
                onClick={() => setViewingReceipt(null)}
                style={{ position: 'absolute', top: '1rem', right: '1rem', background: '#f3f4f6', border: 'none', borderRadius: '50%', width: '32px', height: '32px', fontSize: '1.2rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              >X</button>

              <h3 style={{ marginBottom: '1rem' }}>Comprobante - Pedido #{viewingReceipt.id}</h3>
              <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>
                {viewingReceipt.customerName} - ${viewingReceipt.total.toFixed(2)}
              </p>

              <img
                src={viewingReceipt.receiptUrl}
                alt="Comprobante"
                style={{ width: '100%', borderRadius: '12px', border: '1px solid var(--border-color)', marginBottom: '1.5rem' }}
              />

              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <button
                  onClick={() => { markAsPaid(viewingReceipt.id, 'EFECTIVO'); setViewingReceipt(null); }}
                  style={{ flex: 1, padding: '0.75rem', borderRadius: '8px', border: '2px solid #22c55e', background: '#f0fdf4', color: '#16a34a', fontWeight: 700, cursor: 'pointer' }}
                >
                  Aprobar Efectivo
                </button>
                <button
                  onClick={() => { markAsPaid(viewingReceipt.id, 'TRANSFERENCIA'); setViewingReceipt(null); }}
                  style={{ flex: 1, padding: '0.75rem', borderRadius: '8px', border: '2px solid #00BCD4', background: '#ecfeff', color: '#0097a7', fontWeight: 700, cursor: 'pointer' }}
                >
                  Aprobar Transferencia
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── MODAL: CONFIRMAR EFECTIVO ── */}
        {confirmingOrder && confirmingMethod === 'EFECTIVO' && (
          <div
            style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200, padding: '1rem' }}
            onClick={() => { setConfirmingOrder(null); setConfirmingMethod(null); }}
          >
            <div
              style={{ background: '#fff', borderRadius: '20px', padding: '2.5rem', maxWidth: '400px', width: '100%', textAlign: 'center', position: 'relative', boxShadow: '0 20px 60px rgba(0,0,0,0.25)' }}
              onClick={e => e.stopPropagation()}
            >
              <button
                onClick={() => { setConfirmingOrder(null); setConfirmingMethod(null); }}
                style={{ position: 'absolute', top: '1rem', right: '1rem', background: '#f3f4f6', border: 'none', borderRadius: '50%', width: '32px', height: '32px', fontSize: '1.1rem', cursor: 'pointer' }}
              >×</button>

              <CheckCircle2 size={56} strokeWidth={1.2} style={{ color: '#22c55e', marginBottom: '1rem' }} />
              <h3 style={{ fontSize: '1.3rem', fontWeight: 800, marginBottom: '0.5rem' }}>Confirmar pago en efectivo</h3>
              <p style={{ color: 'var(--text-secondary)', marginBottom: '0.5rem', fontSize: '0.95rem' }}>
                Pedido <strong>#{confirmingOrder.id}</strong> — {confirmingOrder.customerName}
              </p>
              <p style={{ fontSize: '2rem', fontWeight: 900, color: '#22c55e', margin: '1rem 0 1.5rem' }}>
                ${confirmingOrder.total.toFixed(2)}
              </p>
              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <button
                  onClick={() => { setConfirmingOrder(null); setConfirmingMethod(null); }}
                  style={{ flex: 1, padding: '0.85rem', borderRadius: '10px', border: '2px solid var(--border-color)', background: '#f9fafb', fontWeight: 700, cursor: 'pointer', fontSize: '0.95rem' }}
                >
                  Cancelar
                </button>
                <button
                  onClick={() => { markAsPaid(confirmingOrder.id, 'EFECTIVO'); setConfirmingOrder(null); setConfirmingMethod(null); }}
                  style={{ flex: 1, padding: '0.85rem', borderRadius: '10px', border: 'none', background: '#22c55e', color: '#fff', fontWeight: 700, cursor: 'pointer', fontSize: '0.95rem' }}
                >
                  Confirmar Pago
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── MODAL: QR TRANSFERENCIA ── */}
        {confirmingOrder && confirmingMethod === 'TRANSFERENCIA' && (
          <div
            style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200, padding: '1rem' }}
            onClick={() => { setConfirmingOrder(null); setConfirmingMethod(null); }}
          >
            <div
              style={{ background: '#fff', borderRadius: '20px', padding: '2rem', maxWidth: '420px', width: '100%', textAlign: 'center', position: 'relative', boxShadow: '0 20px 60px rgba(0,0,0,0.25)' }}
              onClick={e => e.stopPropagation()}
            >
              <button
                onClick={() => { setConfirmingOrder(null); setConfirmingMethod(null); }}
                style={{ position: 'absolute', top: '1rem', right: '1rem', background: '#f3f4f6', border: 'none', borderRadius: '50%', width: '32px', height: '32px', fontSize: '1.1rem', cursor: 'pointer' }}
              >×</button>

              <h3 style={{ fontSize: '1.2rem', fontWeight: 800, marginBottom: '0.25rem' }}>Pago por Transferencia</h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '1.25rem' }}>
                Pedido <strong>#{confirmingOrder.id}</strong> — <strong style={{ color: '#00BCD4' }}>${confirmingOrder.total.toFixed(2)}</strong>
              </p>

              {/* QR — reemplaza /qr-code.png con tu código QR real */}
              <div style={{ background: '#f8fafc', borderRadius: '16px', padding: '1.25rem', marginBottom: '1.25rem', border: '1px solid #e2e8f0' }}>
                <img
                  src="/qr-code.png"
                  alt="Código QR de pago"
                  style={{ width: '100%', maxWidth: '260px', height: 'auto', borderRadius: '8px', display: 'block', margin: '0 auto' }}
                />
                <p style={{ marginTop: '0.75rem', fontSize: '0.78rem', color: '#64748b' }}>Escanea con tu app de banco para transferir</p>
              </div>

              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <button
                  onClick={() => { setConfirmingOrder(null); setConfirmingMethod(null); }}
                  style={{ flex: 1, padding: '0.85rem', borderRadius: '10px', border: '2px solid var(--border-color)', background: '#f9fafb', fontWeight: 700, cursor: 'pointer', fontSize: '0.9rem' }}
                >
                  Cancelar
                </button>
                <button
                  onClick={() => { markAsPaid(confirmingOrder.id, 'TRANSFERENCIA'); setConfirmingOrder(null); setConfirmingMethod(null); }}
                  style={{ flex: 1, padding: '0.85rem', borderRadius: '10px', border: 'none', background: '#00BCD4', color: '#fff', fontWeight: 700, cursor: 'pointer', fontSize: '0.9rem' }}
                >
                  Confirmar Transferencia
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </ProtectedRoute>
  );
}
