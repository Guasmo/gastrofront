"use client";

import { Toaster } from 'react-hot-toast';
import { useMenu } from '../hooks/useMenu';
import AppHeader from './components/AppHeader';
import ProductGrid from './components/ProductGrid';
import ProductDetailModal from './components/ProductDetailModal';
import CartModal from './components/CartModal';
import TicketModal from './components/TicketModal';
import AuthModal from './components/auth-modal';
import LogoutModal from './components/logout-modal';
import PerfilSection from './components/PerfilSection';

export default function Home() {
  const {
    categories, activeCategory, logged, role, userName, hydrated,
    view, perfilTab, myOrders, loadingProducts,
    showCart, showDetail, detailQty, detailExtras,
    showAuthModal, authMode, showLogoutModal,
    cart, customerName, selectedPayment,
    observations, lastOrder, showTicket,
    displayProducts, cartCount,
    catScrollRef,
    // setters
    setActiveCategory, setView, setPerfilTab,
    setShowCart, setShowDetail, setDetailQty,
    setShowAuthModal, setAuthMode, setShowLogoutModal,
    setCustomerName, setSelectedPayment,
    setObservations, setShowTicket,
    // actions
    openDetail, updateExtraQty, getDetailTotal,
    addToCartFromDetail, quickAdd, updateQuantity,
    removeCartItem, getTotal, handleSubmitOrder,
    getStatusColor, catScroll,
  } = useMenu();

  if (!hydrated) {
    return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}><p>Cargando...</p></div>;
  }

  return (
    <div className="app-root">
      <Toaster position="top-center" />

      <AppHeader
        logged={logged}
        role={role}
        view={view}
        cartCount={cartCount}
        onToggleView={() => setView(view === 'perfil' ? 'menu' : 'perfil')}
        onShowCart={() => setShowCart(true)}
        onShowLogin={() => { setAuthMode('login'); setShowAuthModal(true); }}
        onShowRegister={() => { setAuthMode('register'); setShowAuthModal(true); }}
        onShowLogout={() => setShowLogoutModal(true)}
      />

      {view === 'menu' && (
        <>
          <div className="cat-tabs-wrapper">
            <button className="cat-arrow" onClick={() => catScroll(-1)}>&lsaquo;</button>
            <div className="cat-tabs" ref={catScrollRef}>
              <button className={`cat-tab ${!activeCategory ? 'active' : ''}`} onClick={() => setActiveCategory(null)}>TODO</button>
              {categories.map(c => (
                <button key={c.id} className={`cat-tab ${activeCategory === c.name ? 'active' : ''}`} onClick={() => setActiveCategory(c.name)}>{c.name.toUpperCase()}</button>
              ))}
            </div>
            <button className="cat-arrow" onClick={() => catScroll(1)}>&rsaquo;</button>
          </div>

          <main className="app-main" key={activeCategory ?? 'all'}>
            <ProductGrid
              products={displayProducts}
              activeCategory={activeCategory}
              loading={loadingProducts}
              onProductClick={openDetail}
              onQuickAdd={quickAdd}
            />
          </main>
        </>
      )}

      {view === 'perfil' && (
        <PerfilSection
          userName={userName}
          role={role}
          perfilTab={perfilTab}
          myOrders={myOrders}
          onTabChange={setPerfilTab}
          onGoToMenu={() => setView('menu')}
          getStatusColor={getStatusColor}
        />
      )}

      {showDetail && (
        <ProductDetailModal
          product={showDetail}
          qty={detailQty}
          extras={detailExtras}
          total={getDetailTotal()}
          onClose={() => setShowDetail(null)}
          onQtyChange={(delta) => setDetailQty(q => Math.max(1, q + delta))}
          onExtraQtyChange={updateExtraQty}
          onAddToCart={addToCartFromDetail}
        />
      )}

      {showCart && (
        <CartModal
          cart={cart}
          total={getTotal()}
          customerName={customerName}
          observations={observations}
          selectedPayment={selectedPayment}
          onClose={() => setShowCart(false)}
          onUpdateQuantity={updateQuantity}
          onRemoveItem={removeCartItem}
          onCustomerNameChange={setCustomerName}
          onObservationsChange={setObservations}
          onPaymentChange={setSelectedPayment}
          onSubmit={handleSubmitOrder}
        />
      )}

      {showAuthModal && (
        <AuthModal
          mode={authMode}
          onClose={() => setShowAuthModal(false)}
          onModeChange={setAuthMode}
          onSuccess={() => {}}
        />
      )}

      {showLogoutModal && (
        <LogoutModal onClose={() => setShowLogoutModal(false)} />
      )}

      {showTicket && lastOrder && (
        <TicketModal order={lastOrder} onClose={() => setShowTicket(false)} />
      )}
    </div>
  );
}
