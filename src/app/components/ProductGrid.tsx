'use client';

import { UtensilsCrossed } from 'lucide-react';
import { Product } from '../../services/productService';

interface ProductGridProps {
  products: Product[];
  activeCategory: string | null;
  loading?: boolean;
  onProductClick: (product: Product) => void;
  onQuickAdd: (product: Product) => void;
}

const PlateIcon = () => (
  <UtensilsCrossed size={40} strokeWidth={1.2} style={{ color: '#ccc' }} />
);

function ProductCardSkeleton() {
  return (
    <div className="product-row-card product-row-card--skeleton">
      <div className="skeleton-img" />
      <div className="skeleton-info">
        <div className="skeleton-line skeleton-price" />
        <div className="skeleton-line skeleton-title" />
        <div className="skeleton-line skeleton-desc" />
        <div className="skeleton-line skeleton-desc skeleton-desc--short" />
        <div className="skeleton-btn" />
      </div>
    </div>
  );
}

export default function ProductGrid({ products, activeCategory, loading = false, onProductClick, onQuickAdd }: ProductGridProps) {
  if (loading) {
    return (
      <>
        {activeCategory && <h2 className="section-title skeleton-title-text">&nbsp;</h2>}
        <div className="product-grid">
          {Array.from({ length: 6 }).map((_, i) => (
            <ProductCardSkeleton key={i} />
          ))}
        </div>
      </>
    );
  }

  if (products.length === 0) {
    return (
      <div className="empty-category">
        <span className="empty-icon"><UtensilsCrossed size={52} strokeWidth={1} /></span>
        <h3>No hay productos en esta categoria</h3>
        <p>Prueba seleccionando otra categoria</p>
      </div>
    );
  }

  return (
    <>
      {activeCategory && <h2 className="section-title">{activeCategory.toUpperCase()}</h2>}
      <div className="product-grid">
        {products.map((product, i) => (
          <div
            key={product.id}
            className="product-row-card product-row-card--animate"
            style={{ animationDelay: `${i * 40}ms` }}
            onClick={() => onProductClick(product)}
          >
            <div className="product-row-img">
              {product.imageUrl && product.imageUrl.startsWith('http') ? (
                <img src={product.imageUrl} alt={product.name} />
              ) : (
                <span className="product-row-emoji"><PlateIcon /></span>
              )}
            </div>
            <div className="product-row-info">
              <span className="product-row-price">${product.price.toFixed(2)}</span>
              <h3 className="product-row-name">{product.name}</h3>
              {product.description && <p className="product-row-desc">{product.description}</p>}
              {product.category && <span className="product-row-cat">{product.category.name}</span>}
              <button
                className="product-row-add"
                onClick={(e) => { e.stopPropagation(); onProductClick(product); }}
              >
                Agregar
              </button>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
