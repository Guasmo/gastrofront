'use client';

import { useState } from 'react';
import { login, register } from '../../lib/auth';

interface AuthModalProps {
  mode: 'login' | 'register';
  onClose: () => void;
  onModeChange: (mode: 'login' | 'register') => void;
  onSuccess: (role: string) => void;
}

export default function AuthModal({ mode, onClose, onModeChange, onSuccess }: AuthModalProps) {
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (mode === 'login') {
        const user = await login(form.email, form.password);
        if (user.role !== 'CUSTOMER') {
          onClose();
          setForm({ name: '', email: '', password: '' });
          window.location.href = '/menu-items';
          return;
        }
        onSuccess(user.role);
      } else {
        const user = await register(form.name, form.email, form.password);
        onSuccess(user.role);
      }
      onClose();
      setForm({ name: '', email: '', password: '' });
      window.location.reload();
    } catch (err: any) {
      setError(err.message || 'Error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="auth-modal" onClick={e => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}>X</button>
        <h2 className="auth-title">{mode === 'login' ? 'Iniciar Sesion' : 'Crear Cuenta'}</h2>
        <p className="auth-subtitle">{mode === 'login' ? 'Ingresa para hacer tu pedido' : 'Registrate para empezar a pedir'}</p>
        {error && <div className="auth-error">{error}</div>}
        <form onSubmit={handleSubmit} className="auth-form">
          {mode === 'register' && (
            <input type="text" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required placeholder="Tu nombre" />
          )}
          <input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} required placeholder="tu@email.com" />
          <input type="password" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} required minLength={6} placeholder="Minimo 6 caracteres" />
          <button type="submit" disabled={loading} className="auth-submit">
            {loading ? 'Procesando...' : mode === 'login' ? 'Iniciar Sesion' : 'Crear Cuenta'}
          </button>
        </form>
        <p className="auth-switch">
          {mode === 'login' ? (
            <>No tienes cuenta? <button onClick={() => { onModeChange('register'); setError(''); }}>Registrate</button></>
          ) : (
            <>Ya tienes cuenta? <button onClick={() => { onModeChange('login'); setError(''); }}>Inicia sesion</button></>
          )}
        </p>
      </div>
    </div>
  );
}
