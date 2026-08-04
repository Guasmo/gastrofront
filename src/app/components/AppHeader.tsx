'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ShoppingCart, Menu, X } from 'lucide-react';

const ROLE_HEADER_LINKS: Record<string, { href: string; label: string }[]> = {
  KITCHEN: [{ href: '/cocina', label: 'Cocina' }],
  CASHIER: [{ href: '/caja', label: 'Caja' }],
  ADMIN: [
    { href: '/cocina', label: 'Cocina' },
    { href: '/caja', label: 'Caja' },
    { href: '/admin', label: 'Admin' },
    { href: '/productos', label: 'Productos' },
  ],
};

interface AppHeaderProps {
  logged: boolean;
  role: string | null;
  view: 'menu' | 'perfil';
  cartCount: number;
  onToggleView: () => void;
  onShowCart: () => void;
  onShowLogin: () => void;
  onShowRegister: () => void;
  onShowLogout: () => void;
}

export default function AppHeader({
  logged, role, view, cartCount,
  onToggleView, onShowCart, onShowLogin, onShowRegister, onShowLogout,
}: AppHeaderProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const roleLinks = role ? (ROLE_HEADER_LINKS[role] || []) : [];
  const hasManyLinks = role === 'ADMIN' || roleLinks.length > 2;

  return (
    <header className="app-header">
      <div className="app-header-inner">
        <Link href="/" className="app-logo" onClick={view === 'perfil' ? onToggleView : undefined}>
          Gastro<span>Control</span>
        </Link>

        {/* Desktop nav */}
        <nav className={`app-header-nav ${hasManyLinks ? 'app-header-nav--wide' : ''}`}>
          {logged ? (
            <>
              <button onClick={onToggleView} className="header-btn-outline">
                {view === 'perfil' ? 'Menu' : 'Mi Panel'}
              </button>
              {role && role !== 'CUSTOMER' && <Link href="/menu-items" className="header-btn-outline header-btn-nav" style={{ borderColor: 'rgba(255,255,255,0.4)', color: '#fff', textDecoration: 'none' }}>Opciones</Link>}
              {roleLinks.map(link => (
                <Link key={link.href} href={link.href} className="header-btn-outline header-btn-nav" style={{ borderColor: 'rgba(255,255,255,0.4)', color: '#fff', textDecoration: 'none' }}>{link.label}</Link>
              ))}
              <button onClick={onShowLogout} className="header-btn-outline">Salir</button>
            </>
          ) : (
            <>
              <button onClick={onShowLogin} className="header-btn-outline">Iniciar sesion</button>
              <button onClick={onShowRegister} className="header-btn-fill">Registrarse</button>
            </>
          )}
          {logged && view === 'menu' && (
            <button onClick={onShowCart} className="header-cart-btn">
              <ShoppingCart size={18} strokeWidth={2.2} />
              <span className="header-cart-badge">{cartCount}</span>
            </button>
          )}
        </nav>

        {/* Mobile hamburger */}
        {logged && (
          <button className="header-hamburger" onClick={() => setMobileOpen(!mobileOpen)}>
            {mobileOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        )}
      </div>

      {/* Mobile dropdown */}
      {logged && mobileOpen && (
        <div className="header-mobile-menu">
          <button onClick={() => { onToggleView(); setMobileOpen(false); }} className="header-mobile-item">
            {view === 'perfil' ? 'Menu' : 'Mi Panel'}
          </button>
          {role && role !== 'CUSTOMER' && <Link href="/menu-items" className="header-mobile-item" onClick={() => setMobileOpen(false)}>Opciones</Link>}
          {roleLinks.map(link => (
            <Link key={link.href} href={link.href} className="header-mobile-item" onClick={() => setMobileOpen(false)}>{link.label}</Link>
          ))}
          {view === 'menu' && (
            <button onClick={() => { onShowCart(); setMobileOpen(false); }} className="header-mobile-item">
              Carrito ({cartCount})
            </button>
          )}
          <button onClick={() => { onShowLogout(); setMobileOpen(false); }} className="header-mobile-item header-mobile-item--danger">Salir</button>
        </div>
      )}
    </header>
  );
}
