'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Home, LogOut } from 'lucide-react';
import { getRole, getUserName, isLoggedIn, logout } from '../../lib/auth';

const CARD_CONFIG: Record<string, { href: string; image: string; title: string; desc: string }[]> = {
  KITCHEN: [
    { href: '/', image: '/pedir.png', title: 'Pedir', desc: 'Realiza pedidos del menú' },
    { href: '/cocina', image: '/cocina.png', title: 'Cocina', desc: 'Gestiona órdenes en el tablero' },
    { href: '/pantalla-tv', image: '/cocina.png', title: 'Pantalla TV', desc: 'Vista del tablero para tv' },
  ],
  CASHIER: [
    { href: '/', image: '/pedir.png', title: 'Pedir', desc: 'Realiza pedidos del menú' },
    { href: '/caja', image: '/caja.png', title: 'Caja', desc: 'Gestiona pagos y cierre de caja' },
  ],
  ADMIN: [
    { href: '/', image: '/pedir.png', title: 'Pedir', desc: 'Realiza pedidos del menú' },
    { href: '/cocina', image: '/cocina.png', title: 'Cocina', desc: 'Monitor de cocina en vivo' },
    { href: '/caja', image: '/caja.png', title: 'Caja', desc: 'Pagos y cierre diario' },
    { href: '/admin', image: '/administracion.png', title: 'Admin', desc: 'Panel de administración' },
    { href: '/productos', image: '/productos.png', title: 'Productos', desc: 'Gestión del menú' },
    { href: '/pantalla-tv', image: '/cocina.png', title: 'Pantalla TV', desc: 'Vista del tablero para tv' },
  ],
};

export default function MenuItemsPage() {
  const router = useRouter();
  const [role, setRole] = useState<string | null>(null);
  const [name, setName] = useState<string | null>(null);

  useEffect(() => {
    if (!isLoggedIn()) { router.push('/login'); return; }
    const r = getRole();
    if (!r || r === 'CUSTOMER') { router.push('/'); return; }
    setRole(r);
    setName(getUserName());
  }, [router]);

  if (!role) return null;

  const cards = CARD_CONFIG[role] || CARD_CONFIG['ADMIN'];

  return (
    <div style={{
      position: 'relative',
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
      padding: '2rem 1.5rem',
      gap: '2rem',
      overflow: 'hidden',
    }}>
      {/* Video background */}
      <video autoPlay muted loop playsInline style={{
        position: 'absolute', inset: 0,
        width: '100%', height: '100%',
        objectFit: 'cover', zIndex: 0,
      }}>
        <source src="/cocina.mp4" type="video/mp4" />
      </video>

      {/* Dark overlay */}
      <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.58)', zIndex: 1 }} />

      {/* Header */}
      <div style={{ position: 'relative', zIndex: 2, textAlign: 'center' }}>
        <h1 style={{ fontSize: '1.9rem', fontWeight: 900, margin: 0, color: '#fff', letterSpacing: '-0.03em' }}>
          Bienvenido, {name}
        </h1>
        <p style={{ color: 'rgba(255,255,255,0.55)', marginTop: '0.35rem', fontSize: '0.9rem', letterSpacing: '0.02em' }}>
          Selecciona una opción para continuar
        </p>
      </div>

      {/* Cards — single row */}
      <div style={{
        position: 'relative', zIndex: 2,
        display: 'flex',
        flexDirection: 'row',
        gap: '1rem',
        width: '100%',
        maxWidth: '1100px',
        justifyContent: 'center',
      }}>
        {cards.map((card, i) => (
          <Link
            key={card.href}
            href={card.href}
            style={{
              position: 'relative',
              flex: '1 1 0',
              minWidth: 0,
              height: '260px',
              borderRadius: '16px',
              overflow: 'hidden',
              textDecoration: 'none',
              boxShadow: '0 4px 24px rgba(0,0,0,0.4)',
              transition: 'transform 0.3s cubic-bezier(0.34,1.56,0.64,1), box-shadow 0.3s ease',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'flex-end',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.transform = 'translateY(-6px) scale(1.03)';
              e.currentTarget.style.boxShadow = '0 20px 50px rgba(0,0,0,0.6)';
              const bg = e.currentTarget.querySelector('.card-bg') as HTMLElement;
              if (bg) bg.style.transform = 'scale(1.08)';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.transform = 'translateY(0) scale(1)';
              e.currentTarget.style.boxShadow = '0 4px 24px rgba(0,0,0,0.4)';
              const bg = e.currentTarget.querySelector('.card-bg') as HTMLElement;
              if (bg) bg.style.transform = 'scale(1)';
            }}
          >
            {/* Photo */}
            <div className="card-bg" style={{
              position: 'absolute', inset: 0,
              backgroundImage: `url(${card.image})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              transition: 'transform 0.4s ease',
            }} />

            {/* Bottom-to-top fade vignette */}
            <div style={{
              position: 'absolute', inset: 0,
              background: 'linear-gradient(to top, rgba(0,0,0,0.88) 0%, rgba(0,0,0,0.35) 50%, rgba(0,0,0,0.0) 100%)',
            }} />

            {/* Text anchored to bottom */}
            <div style={{
              position: 'relative',
              padding: '1.1rem 1.25rem',
            }}>
              <h2 style={{
                fontSize: '1.15rem',
                fontWeight: 800,
                margin: '0 0 0.2rem',
                color: '#fff',
                letterSpacing: '-0.01em',
              }}>
                {card.title}
              </h2>
              <p style={{
                fontSize: '0.78rem',
                color: 'rgba(255,255,255,0.65)',
                margin: 0,
                lineHeight: 1.4,
              }}>
                {card.desc}
              </p>
            </div>
          </Link>
        ))}
      </div>

      {/* Bottom actions */}
      <div style={{ position: 'relative', zIndex: 2, display: 'flex', gap: '0.75rem' }}>
        <Link href="/"
          style={{ background: 'rgba(255,255,255,0.08)', backdropFilter: 'blur(10px)', border: '1px solid rgba(255,255,255,0.22)', borderRadius: '10px', padding: '0.55rem 1.3rem', fontSize: '0.85rem', cursor: 'pointer', color: 'rgba(255,255,255,0.8)', textDecoration: 'none', transition: 'all 0.2s' }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = '#fff'; e.currentTarget.style.color = '#fff'; }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.22)'; e.currentTarget.style.color = 'rgba(255,255,255,0.8)'; }}>
          <Home size={15} strokeWidth={2} /> Ir al inicio
        </Link>
        <button
          onClick={() => logout()}
          style={{ background: 'rgba(255,255,255,0.08)', backdropFilter: 'blur(10px)', border: '1px solid rgba(255,255,255,0.22)', borderRadius: '10px', padding: '0.55rem 1.3rem', fontSize: '0.85rem', cursor: 'pointer', color: 'rgba(255,255,255,0.8)', transition: 'all 0.2s' }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = '#ef4444'; e.currentTarget.style.color = '#ef4444'; }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.22)'; e.currentTarget.style.color = 'rgba(255,255,255,0.8)'; }}>
          <LogOut size={15} strokeWidth={2} /> Cerrar sesión
        </button>
      </div>
    </div>
  );
}
