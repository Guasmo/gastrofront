'use client';

import { Banknote, Building2, UtensilsCrossed } from 'lucide-react';
import { CartItem } from '../../services/orderService';

interface CartModalProps {
  cart: CartItem[];
  total: number;
  customerName: string;
  observations: string;
  selectedPayment: 'EFECTIVO' | 'TRANSFERENCIA' | null;
  onClose: () => void;
  onUpdateQuantity: (productId: number, delta: number) => void;
  onRemoveItem: (index: number) => void;
  onCustomerNameChange: (name: string) => void;
  onObservationsChange: (text: string) => void;
  onPaymentChange: (method: 'EFECTIVO' | 'TRANSFERENCIA') => void;
  onSubmit: () => void;
}

const renderProductImage = (imageUrl: string | undefined, size = 48) => {
  if (!imageUrl) {
    return <UtensilsCrossed size={size * 0.45} strokeWidth={1.5} style={{ color: '#aaa' }} />;
  }
  if (imageUrl.startsWith('http') || imageUrl.startsWith('/') || imageUrl.startsWith('data:')) {
    return <img src={imageUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />;
  }
  // Otherwise, it's likely an emoji string
  return <span style={{ fontSize: `${size * 0.5}px` }}>{imageUrl}</span>;
};

export default function CartModal({
  cart, total, customerName, observations, selectedPayment,
  onClose, onUpdateQuantity, onRemoveItem,
  onCustomerNameChange, onObservationsChange, onPaymentChange, onSubmit,
}: CartModalProps) {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="cart-modal modal-sheet" onClick={e => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}>X</button>
        <h2 className="cart-modal-title">Tu Pedido</h2>
        {cart.length === 0 ? (
          <p className="cart-empty">Tu carrito esta vacio</p>
        ) : (
          <>
            <div className="cart-items">
              {cart.map((item, idx) => {
                const itemSubtotal = (item.product.price + item.selectedExtras.reduce((acc: number, extra: any) => acc + (extra.price * extra.qty), 0)) * item.quantity;
                return (
                  <div key={idx} className="cart-item-row">
                    <div className="cart-item-img">
                      {renderProductImage(item.product.imageUrl)}
                    </div>
                    <div className="cart-item-info">
                      <strong>{item.product.name}</strong>
                      {item.selectedExtras?.filter((e: any) => e.qty > 0).map((e: any, ei: number) => (
                        <span key={ei} className="cart-item-extra">+ {e.qty}x {e.name} (+${(e.price * e.qty).toFixed(2)})</span>
                      ))}
                    </div>
                    <div className="qty-control qty-small" style={{ flexShrink: 0, margin: '0 0.5rem' }}>
                      <button onClick={() => onUpdateQuantity(item.product.id, -1)}>-</button>
                      <span>{item.quantity}</span>
                      <button onClick={() => onUpdateQuantity(item.product.id, 1)}>+</button>
                    </div>
                    <span className="cart-item-sub">${itemSubtotal.toFixed(2)}</span>
                    <button className="cart-item-remove" onClick={() => onRemoveItem(idx)}>×</button>
                  </div>
                );
              })}
            </div>

            <div className="cart-total-row">
              <span>Total</span>
              <strong>${total.toFixed(2)}</strong>
            </div>

            <input
              className="cart-name-input"
              placeholder="Tu nombre o número de mesa"
              value={customerName}
              onChange={e => onCustomerNameChange(e.target.value)}
            />

            <textarea
              className="cart-observations"
              placeholder="Observaciones: alergias, peticiones especiales, etc."
              value={observations}
              onChange={e => onObservationsChange(e.target.value)}
              rows={2}
              style={{ width: '100%', padding: '0.65rem 0.85rem', borderRadius: '10px', border: '1px solid var(--border)', fontSize: '0.85rem', fontFamily: 'inherit', resize: 'vertical', background: '#fafafa', color: 'var(--text)', outline: 'none', boxSizing: 'border-box' }}
            />

            <div className="pay-methods">
              <button onClick={() => onPaymentChange('EFECTIVO')} className={`pay-btn ${selectedPayment === 'EFECTIVO' ? 'selected' : ''}`}>
                <Banknote size={16} strokeWidth={2} /> Efectivo
              </button>
              <button onClick={() => onPaymentChange('TRANSFERENCIA')} className={`pay-btn ${selectedPayment === 'TRANSFERENCIA' ? 'selected' : ''}`}>
                <Building2 size={16} strokeWidth={2} /> Transferencia
              </button>
            </div>

            <button className="btn btn-primary cart-submit" onClick={onSubmit} style={{ width: '100%', padding: '0.875rem', marginTop: '1rem' }}>
              Confirmar Pedido
            </button>
          </>
        )}
      </div>
    </div>
  );
}
