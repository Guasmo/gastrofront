"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { io } from 'socket.io-client';
import ProtectedRoute from '../../components/ProtectedRoute';
import { API_URL, WS_URL } from '../../lib/config';
import { authFetch } from '../../lib/auth';

export default function PantallaPage() {
  const [orders, setOrders] = useState<any[]>([]);

  useEffect(() => {
    authFetch(`${API_URL}/orders`).then(r => r.json()).then(setOrders).catch(() => {});

    const socket = io(WS_URL);
    socket.on('new_order', (order) => setOrders(prev => [order, ...prev]));
    socket.on('order_status_updated', (updated) => setOrders(prev => prev.map(o => o.id === updated.id ? updated : o)));
    return () => { socket.disconnect(); };
  }, []);

  const preparingOrders = orders.filter(o => o.status === 'PREPARING');
  const readyOrders = orders.filter(o => o.status === 'READY');

  return (
    <ProtectedRoute allowedRoles={['CUSTOMER', 'CASHIER', 'ADMIN']}>
    <main style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <header style={{ padding: '1.5rem', textAlign: 'center', background: '#ffffff', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1 style={{ margin: 0, color: 'var(--primary-color)' }}>Gastro-Control</h1>
        <Link href="/" className="btn btn-secondary">Regresar</Link>
      </header>

      <div style={{ display: 'flex', flex: 1 }}>
        <div style={{ flex: 1, padding: '2rem', borderRight: '1px solid var(--border-color)' }}>
          <h2 style={{ fontSize: '2.5rem', textAlign: 'center', marginBottom: '2rem', color: '#FF9800' }}>En Preparacion</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: '1.5rem' }}>
            {preparingOrders.map(order => (
              <div key={order.id} className="card" style={{ padding: '1.5rem', textAlign: 'center', border: '2px solid rgba(255, 152, 0, 0.3)' }}>
                <span style={{ fontSize: '3rem', fontWeight: 'bold' }}>#{order.id}</span>
                <p style={{ marginTop: '0.5rem', color: 'var(--text-secondary)', fontSize: '1.2rem' }}>{order.customerName.split(' ')[0]}</p>
              </div>
            ))}
            {preparingOrders.length === 0 && (
              <p style={{ textAlign: 'center', gridColumn: '1 / -1', color: 'var(--text-secondary)', fontSize: '1.5rem' }}>No hay ordenes en preparacion.</p>
            )}
          </div>
        </div>

        <div style={{ flex: 1, padding: '2rem' }}>
          <h2 style={{ fontSize: '2.5rem', textAlign: 'center', marginBottom: '2rem', color: '#4CAF50' }}>Listos para Retirar</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: '1.5rem' }}>
            {readyOrders.map(order => (
              <div key={order.id} className="card" style={{ padding: '2rem', textAlign: 'center', border: '3px solid #4CAF50', animation: 'pulse 2s infinite' }}>
                <span style={{ fontSize: '4rem', fontWeight: 'bold', color: '#4CAF50' }}>#{order.id}</span>
                <p style={{ marginTop: '0.5rem', fontWeight: 'bold', fontSize: '1.5rem' }}>{order.customerName}</p>
              </div>
            ))}
            {readyOrders.length === 0 && (
              <p style={{ textAlign: 'center', gridColumn: '1 / -1', color: 'var(--text-secondary)', fontSize: '1.5rem' }}>Ninguna orden lista por el momento.</p>
            )}
          </div>
        </div>
      </div>
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes pulse {
          0% { box-shadow: 0 0 0 0 rgba(76, 175, 80, 0.4); }
          70% { box-shadow: 0 0 0 15px rgba(76, 175, 80, 0); }
          100% { box-shadow: 0 0 0 0 rgba(76, 175, 80, 0); }
        }
      `}} />
    </main>
    </ProtectedRoute>
  );
}
