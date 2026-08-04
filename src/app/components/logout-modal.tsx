'use client';

import { useRouter } from 'next/navigation';
import { LogOut } from 'lucide-react';
import { logout } from '../../lib/auth';

interface LogoutModalProps {
  onClose: () => void;
}

export default function LogoutModal({ onClose }: LogoutModalProps) {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="auth-modal" onClick={e => e.stopPropagation()} style={{ textAlign: 'center', padding: '2.5rem' }}>
        <button className="modal-close" onClick={onClose}>X</button>
        <LogOut size={44} strokeWidth={1.2} style={{ display: 'block', marginBottom: '0.75rem', color: '#374151' }} />
        <h2 className="auth-title">Cerrar Sesion</h2>
        <p className="auth-subtitle">Estas seguro de que quieres salir?</p>
        <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.5rem' }}>
          <button onClick={onClose} className="auth-submit" style={{ flex: 1, background: '#f3f4f6', color: 'var(--text)' }}>Cancelar</button>
          <button onClick={() => { logout(); window.location.href = '/'; }} className="auth-submit" style={{ flex: 1 }}>Cerrar Sesion</button>
        </div>
      </div>
    </div>
  );
}
