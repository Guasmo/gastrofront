'use client';

import { Product } from '../../services/productService';

interface ProductDetailModalProps {
  product: Product;
  qty: number;
  extras: { name: string; price: number; qty: number }[];
  total: number;
  onClose: () => void;
  onQtyChange: (delta: number) => void;
  onExtraQtyChange: (index: number, delta: number) => void;
  onAddToCart: (product: Product) => void;
}

export default function ProductDetailModal({
  product, qty, extras, total,
  onClose, onQtyChange, onExtraQtyChange, onAddToCart,
}: ProductDetailModalProps) {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="detail-modal modal-sheet" onClick={e => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}>X</button>
        <div className="detail-content">
          <div className="detail-img">
            {product.imageUrl && product.imageUrl.startsWith('http') ? (
              <img src={product.imageUrl} alt={product.name} />
            ) : (
              <span className="detail-emoji">{product.imageUrl || '🍽️'}</span>
            )}
          </div>
          <div className="detail-info">
            <span className="detail-price">${product.price.toFixed(2)}</span>
            <h2 className="detail-name">{product.name}</h2>
            {product.description && <p className="detail-desc">{product.description}</p>}

            {extras.length > 0 && (
              <div className="detail-extras">
                <h4 className="extras-title">Elige ingredientes</h4>
                <p className="extras-sub">Agrega mas de lo que quieras</p>
                {extras.map((extra, i) => (
                  <div key={i} className="extra-row">
                    <div className="extra-info">
                      <span className="extra-name">{extra.name}</span>
                      {extra.price > 0 && <span className="extra-price">+${extra.price.toFixed(2)}</span>}
                    </div>
                    <div className="extra-controls">
                      <button onClick={() => onExtraQtyChange(i, -1)} disabled={extra.qty === 0}>-</button>
                      <span>{extra.qty}</span>
                      <button onClick={() => onExtraQtyChange(i, 1)}>+</button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="detail-bottom">
              <div className="qty-control">
                <button onClick={() => onQtyChange(-1)}>-</button>
                <span>{qty}</span>
                <button onClick={() => onQtyChange(1)}>+</button>
              </div>
              <button className="detail-add-btn" onClick={() => onAddToCart(product)}>
                Agregar ${total.toFixed(2)}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
