'use client';

import { ClipboardList, Phone, FileText, PackageOpen } from 'lucide-react';

interface PerfilSectionProps {
  userName: string | null;
  role: string | null;
  perfilTab: 'pedidos' | 'contactos' | 'terminos';
  myOrders: any[];
  onTabChange: (tab: 'pedidos' | 'contactos' | 'terminos') => void;
  onGoToMenu: () => void;
  getStatusColor: (status: string) => { bg: string; text: string; label: string };
}

export default function PerfilSection({
  userName, role, perfilTab, myOrders, onTabChange, getStatusColor,
}: PerfilSectionProps) {
  return (
    <div className="perfil-layout">
      <aside className="perfil-sidebar">
        <div className="perfil-avatar">{userName?.[0]?.toUpperCase() ?? 'U'}</div>
        <div className="perfil-name">{userName}</div>
        <div className="perfil-role">{role}</div>
        <nav className="perfil-nav">
          <button className={`perfil-nav-btn ${perfilTab === 'pedidos' ? 'active' : ''}`} onClick={() => onTabChange('pedidos')}>
            <ClipboardList size={15} strokeWidth={2} /> Pedidos
          </button>
          <button className={`perfil-nav-btn ${perfilTab === 'contactos' ? 'active' : ''}`} onClick={() => onTabChange('contactos')}>
            <Phone size={15} strokeWidth={2} /> Contactos
          </button>
          <button className={`perfil-nav-btn ${perfilTab === 'terminos' ? 'active' : ''}`} onClick={() => onTabChange('terminos')}>
            <FileText size={15} strokeWidth={2} /> Terminos legales
          </button>
        </nav>
      </aside>

      <main className="perfil-content">
        {perfilTab === 'pedidos' && (
          <section className="my-orders-section">
            <h2 style={{ marginBottom: '1rem' }}>Mis Pedidos</h2>
            {myOrders.length === 0 ? (
              <div className="empty-category">
                <PackageOpen size={48} strokeWidth={1.2} style={{ color: 'var(--text-sec)', marginBottom: '0.75rem' }} />
                <h3>No tienes pedidos todavía</h3>
                <p>Tus pedidos aparecerán aquí</p>
              </div>
            ) : (
              myOrders.map((order: any) => {
                const statusInfo = getStatusColor(order.status);
                return (
                  <div key={order.id} className="order-row">
                    <div>
                      <span className="order-id">#{order.id}</span>
                      <span className="order-status" style={{ background: statusInfo.bg, color: statusInfo.text }}>
                        {statusInfo.label}
                      </span>
                      <span className="order-items-preview">
                        {order.items?.map((i: any) => i.product?.name).join(', ')}
                      </span>
                    </div>
                    <span className="order-total">${order.total?.toFixed(2)}</span>
                  </div>
                );
              })
            )}
          </section>
        )}

        {perfilTab === 'contactos' && (
          <section>
            <h2 style={{ marginBottom: '1rem' }}>Contacto</h2>
            <p style={{ color: 'var(--text-sec)' }}>Para soporte, escríbenos a <strong>soporte@gastrocontrol.com</strong></p>
          </section>
        )}

        {perfilTab === 'terminos' && (
          <section>
            <h2 style={{ marginBottom: '1rem' }}>Terminos legales</h2>
            <p style={{ color: 'var(--text-sec)', lineHeight: 1.7 }}>
              Al usar esta plataforma aceptas los términos de uso y la política de privacidad de GastroControl.
            </p>
          </section>
        )}
      </main>
    </div>
  );
}
