"use client";

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import toast, { Toaster } from 'react-hot-toast';
import { Camera, Trash2, UtensilsCrossed, Leaf } from 'lucide-react';
import ProtectedRoute from '../../components/ProtectedRoute';
import ConfirmModal from '../components/ConfirmModal';
import { API_URL } from '../../lib/config';
import { authFetch } from '../../lib/auth';

export default function ProductosPage() {
  const [activeTab, setActiveTab] = useState<'productos' | 'ingredientes'>('productos');
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [inventory, setInventory] = useState<any[]>([]);
  
  // Product Form
  const [newProduct, setNewProduct] = useState({ name: '', price: '', categoryId: '', description: '' });
  const [recipes, setRecipes] = useState<{ inventoryItemId: number; quantity: number }[]>([]);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>('');
  const [uploading, setUploading] = useState(false);
  const [uploadingId, setUploadingId] = useState<number | null>(null);
  
  // Ingredient Form
  const [newIngredient, setNewIngredient] = useState({ name: '', unit: '', minimumStock: '', extraPrice: '' });

  // Confirm modal
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmData, setConfirmData] = useState<{ title: string; message: string; danger: boolean; onConfirm: () => void }>({ title: '', message: '', danger: false, onConfirm: () => {} });

  const openConfirm = (title: string, message: string, danger: boolean, onConfirm: () => void) => {
    setConfirmData({ title, message, danger, onConfirm });
    setConfirmOpen(true);
  };

  const fileInputRef = useRef<HTMLInputElement>(null);
  const catalogFileRefs = useRef<Map<number, HTMLInputElement>>(new Map());

  const loadData = () => {
    authFetch(`${API_URL}/products`).then(r => r.json()).then(setProducts).catch(() => { });
    authFetch(`${API_URL}/categories`).then(r => r.json()).then(setCategories).catch(() => { });
    authFetch(`${API_URL}/inventory`).then(r => r.json()).then(setInventory).catch(() => { });
  };

  useEffect(() => { loadData(); }, []);

  // --- PRODUCTOS TAB LOGIC ---
  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageFile(file);
    const reader = new FileReader();
    reader.onload = (ev) => setImagePreview(ev.target?.result as string);
    reader.readAsDataURL(file);
  };

  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProduct.name.trim()) { toast.error('Ingresa un nombre'); return; }
    if (!newProduct.price || parseFloat(newProduct.price) <= 0) { toast.error('Ingresa un precio valido'); return; }

    setUploading(true);
    try {
      const body: any = {
        name: newProduct.name.trim(),
        price: parseFloat(newProduct.price),
        description: newProduct.description.trim(),
        imageUrl: '',
        categoryId: parseInt(newProduct.categoryId) || undefined,
      };
      if (recipes.length > 0) {
        body.recipes = recipes.filter(r => r.inventoryItemId > 0 && r.quantity > 0);
      }

      const res = await authFetch(`${API_URL}/products`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (!res.ok) throw new Error('Error al crear producto');
      const product = await res.json();

      if (imageFile) {
        const formData = new FormData();
        formData.append('image', imageFile);
        const token = localStorage.getItem('token');
        await fetch(`${API_URL}/upload/product-image/${product.id}`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
          body: formData,
        });
      }

      toast.success('Producto agregado');
      setNewProduct({ name: '', price: '', categoryId: '', description: '' });
      setRecipes([]);
      setImageFile(null);
      setImagePreview('');
      if (fileInputRef.current) fileInputRef.current.value = '';
      loadData();
    } catch {
      toast.error('Error al agregar producto');
    } finally {
      setUploading(false);
    }
  };

  const handleCatalogImageUpload = async (productId: number, file: File) => {
    setUploadingId(productId);
    try {
      const formData = new FormData();
      formData.append('image', file);
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/upload/product-image/${productId}`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });
      if (!res.ok) throw new Error('Upload failed');
      toast.success('Imagen actualizada');
      loadData();
    } catch {
      toast.error('Error al subir imagen');
    } finally {
      setUploadingId(null);
    }
  };

  const deleteProduct = async (id: number) => {
    openConfirm('Eliminar producto', 'Eliminar este producto del catalogo?', true, async () => {
      try {
        const res = await authFetch(`${API_URL}/products/${id}`, { method: 'DELETE' });
        const data = await res.json();
        toast.success(data.message || 'Producto eliminado');
        loadData();
      } catch {
        toast.error('Error al eliminar producto');
      }
    });
  };

  const addRecipeRow = () => setRecipes([...recipes, { inventoryItemId: 0, quantity: 0 }]);
  const updateRecipe = (i: number, field: string, value: any) => {
    const u = [...recipes];
    u[i] = { ...u[i], [field]: field === 'quantity' ? parseFloat(value) || 0 : parseInt(value) || 0 };
    setRecipes(u);
  };
  const removeRecipe = (i: number) => setRecipes(recipes.filter((_, idx) => idx !== i));

  // --- INGREDIENTES TAB LOGIC ---
  const handleAddIngredient = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newIngredient.name.trim() || !newIngredient.unit.trim()) { toast.error('Datos incompletos'); return; }
    
    try {
      const body = {
        name: newIngredient.name.trim(),
        unit: newIngredient.unit.trim(),
        minimumStock: parseFloat(newIngredient.minimumStock) || 0,
        extraPrice: parseFloat(newIngredient.extraPrice) || 0,
      };

      const res = await authFetch(`${API_URL}/inventory`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (!res.ok) throw new Error();
      toast.success('Ingrediente agregado');
      setNewIngredient({ name: '', unit: '', minimumStock: '', extraPrice: '' });
      loadData();
    } catch {
      toast.error('Error al agregar ingrediente');
    }
  };

  const deleteIngredient = async (id: number) => {
    openConfirm('Eliminar ingrediente', 'Eliminar este ingrediente?', true, async () => {
      try {
        await authFetch(`${API_URL}/inventory/${id}`, { method: 'DELETE' });
        toast.success('Ingrediente eliminado');
        loadData();
      } catch {
        toast.error('Error al eliminar ingrediente');
      }
    });
  };

  const displayProducts = activeCategory 
    ? products.filter(p => p.category?.name === activeCategory) 
    : products;

  return (
    <ProtectedRoute allowedRoles={['ADMIN']}>
      <main className="container">
        <Toaster position="top-center" />
        <ConfirmModal
          open={confirmOpen}
          title={confirmData.title}
          message={confirmData.message}
          danger={confirmData.danger}
          confirmLabel="Aceptar"
          cancelLabel="Cancelar"
          onConfirm={() => { confirmData.onConfirm(); setConfirmOpen(false); }}
          onCancel={() => setConfirmOpen(false)}
        />
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <h1>Gestion de Menu</h1>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <Link href="/admin" className="btn btn-secondary">Panel Admin</Link>
            <Link href="/menu-items" className="btn btn-secondary">Volver</Link>
          </div>
        </div>

        {/* TAB NAVIGATION — segmented pill control */}
        <div className="admin-tab-bar">
          <button
            onClick={() => setActiveTab('productos')}
            className={`admin-tab-btn${activeTab === 'productos' ? ' admin-tab-btn--active' : ''}`}
          >
            <UtensilsCrossed size={16} strokeWidth={2} /> Productos
          </button>
          <button
            onClick={() => setActiveTab('ingredientes')}
            className={`admin-tab-btn${activeTab === 'ingredientes' ? ' admin-tab-btn--active' : ''}`}
          >
            <Leaf size={16} strokeWidth={2} /> Ingredientes
          </button>
        </div>

        {activeTab === 'productos' && (
          <div style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap', alignItems: 'flex-start' }}>
            {/* FORMULARIO PRODUCTOS */}
            <div className="card" style={{ padding: '2rem', flex: '1 1 420px' }}>
              <h2 style={{ borderBottom: '2px solid var(--primary-color)', paddingBottom: '0.5rem', marginBottom: '1.5rem' }}>Agregar Producto</h2>
              <form onSubmit={handleAddProduct} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>Foto del producto:</label>
                  <div onClick={() => fileInputRef.current?.click()} style={{ border: '2px dashed var(--border-color)', borderRadius: '12px', padding: imagePreview ? '0' : '2rem', textAlign: 'center', cursor: 'pointer', background: imagePreview ? 'transparent' : '#f9fafb', minHeight: '160px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {imagePreview ? (
                      <img src={imagePreview} alt="Preview" style={{ width: '100%', height: '200px', objectFit: 'cover', borderRadius: '10px' }} />
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
                        <Camera size={36} strokeWidth={1.2} style={{ color: '#9ca3af' }} />
                        <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>Haz click para subir una foto</span>
                      </div>
                    )}
                  </div>
                  <input ref={fileInputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleImageSelect} />
                </div>

                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>Nombre:</label>
                  <input type="text" value={newProduct.name} onChange={e => setNewProduct({ ...newProduct, name: e.target.value })} required placeholder="Ej: Hamburguesa Clasica" style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border-color)', background: '#f9fafb', color: 'var(--text-primary)', boxSizing: 'border-box' }} />
                </div>

                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>Descripcion:</label>
                  <input type="text" value={newProduct.description} onChange={e => setNewProduct({ ...newProduct, description: e.target.value })} placeholder="Ej: Deliciosa hamburguesa con..." style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border-color)', background: '#f9fafb', color: 'var(--text-primary)', boxSizing: 'border-box' }} />
                </div>

                <div style={{ display: 'flex', gap: '1rem' }}>
                  <div style={{ flex: 1 }}>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>Precio ($):</label>
                    <input type="number" step="0.01" min="0" value={newProduct.price} onChange={e => setNewProduct({ ...newProduct, price: e.target.value })} required placeholder="0.00" style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border-color)', background: '#f9fafb', color: 'var(--text-primary)', boxSizing: 'border-box' }} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>Categoria:</label>
                    <select value={newProduct.categoryId} onChange={e => setNewProduct({ ...newProduct, categoryId: e.target.value })} style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border-color)', background: '#f9fafb', color: 'var(--text-primary)', boxSizing: 'border-box' }}>
                      <option value="">Sin categoria</option>
                      {categories.map(cat => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
                    </select>
                  </div>
                </div>

                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                    <label style={{ fontWeight: 'bold' }}>Recetas (Ingredientes):</label>
                    <button type="button" onClick={addRecipeRow} className="btn btn-secondary" style={{ padding: '0.3rem 0.8rem', fontSize: '0.8rem' }}>+ Agregar</button>
                  </div>
                  {recipes.map((recipe, i) => (
                    <div key={i} style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem', alignItems: 'center' }}>
                      <select value={recipe.inventoryItemId} onChange={e => updateRecipe(i, 'inventoryItemId', e.target.value)} style={{ flex: 2, padding: '0.5rem', borderRadius: '6px', border: '1px solid var(--border-color)', background: '#f9fafb' }}>
                        <option value={0}>Ingrediente...</option>
                        {inventory.map(item => <option key={item.id} value={item.id}>{item.name} ({item.unit})</option>)}
                      </select>
                      <input type="number" step="0.01" placeholder="Cantidad" value={recipe.quantity || ''} onChange={e => updateRecipe(i, 'quantity', e.target.value)} style={{ flex: 1, padding: '0.5rem', borderRadius: '6px', border: '1px solid var(--border-color)', background: '#f9fafb' }} />
                      <button type="button" onClick={() => removeRecipe(i)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444', fontSize: '1.2rem' }}>X</button>
                    </div>
                  ))}
                </div>

                <button type="submit" disabled={uploading} className="btn btn-primary" style={{ padding: '0.875rem', fontSize: '1rem', opacity: uploading ? 0.6 : 1 }}>
                  {uploading ? 'Guardando...' : 'Guardar Producto'}
                </button>
              </form>
            </div>

            {/* CATALOGO PRODUCTOS */}
            <div className="card" style={{ padding: '2rem', flex: '2 1 420px' }}>
              <h2 style={{ borderBottom: '2px solid var(--primary-color)', paddingBottom: '0.5rem', marginBottom: '1.5rem' }}>Catálogo actual</h2>
              
              {/* CATEGORY TABS */}
              <div className="cat-tabs" style={{ marginBottom: '1.5rem', overflowX: 'auto', display: 'flex', gap: '0.5rem', paddingBottom: '0.5rem' }}>
                <button className={`cat-tab ${!activeCategory ? 'active' : ''}`} onClick={() => setActiveCategory(null)}>TODO</button>
                {categories.map(c => (
                  <button key={c.id} className={`cat-tab ${activeCategory === c.name ? 'active' : ''}`} onClick={() => setActiveCategory(c.name)}>{c.name.toUpperCase()}</button>
                ))}
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1rem' }}>
                {displayProducts.map(product => (
                  <div key={product.id} style={{ background: '#fff', border: '1px solid var(--border-color)', borderRadius: '12px', overflow: 'hidden', position: 'relative', transition: 'all 0.2s' }}>
                    <button onClick={() => deleteProduct(product.id)} style={{ position: 'absolute', top: '8px', right: '8px', background: 'rgba(239,68,68,0.9)', border: 'none', cursor: 'pointer', fontSize: '0.7rem', color: '#fff', borderRadius: '50%', width: '26px', height: '26px', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2, fontWeight: 'bold' }} title="Eliminar producto">X</button>

                    <div onClick={() => catalogFileRefs.current.get(product.id)?.click()} style={{ cursor: 'pointer', position: 'relative', height: '140px', background: '#f3f4f6', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                      {product.imageUrl && product.imageUrl.startsWith('http') ? (
                        <img src={product.imageUrl} alt={product.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      ) : (
                        <UtensilsCrossed size={42} strokeWidth={1} style={{ color: '#d1d5db' }} />
                      )}
                      {uploadingId === product.id && <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '0.8rem' }}>Subiendo...</div>}
                    </div>

                    <input ref={el => { if (el) catalogFileRefs.current.set(product.id, el); }} type="file" accept="image/*" style={{ display: 'none' }} onChange={e => { const f = e.target.files?.[0]; if (f) handleCatalogImageUpload(product.id, f); }} />

                    <div style={{ padding: '0.75rem' }}>
                      <strong style={{ display: 'block', fontSize: '0.9rem', marginBottom: '0.2rem' }}>{product.name}</strong>
                      {product.description && <p style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', margin: '0 0 0.2rem 0', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{product.description}</p>}
                      <p style={{ color: 'var(--primary-color)', fontWeight: 'bold', margin: '0.4rem 0 0', fontSize: '1.05rem' }}>${product.price.toFixed(2)}</p>
                    </div>
                  </div>
                ))}
                {displayProducts.length === 0 && <p style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '2rem', color: 'var(--text-secondary)' }}>No hay productos.</p>}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'ingredientes' && (
          <div style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap', alignItems: 'flex-start' }}>
            <div className="card" style={{ padding: '2rem', flex: '1 1 350px' }}>
              <h2 style={{ borderBottom: '2px solid var(--primary-color)', paddingBottom: '0.5rem', marginBottom: '1.5rem' }}>Agregar Ingrediente</h2>
              <form onSubmit={handleAddIngredient} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>Nombre:</label>
                  <input type="text" value={newIngredient.name} onChange={e => setNewIngredient({ ...newIngredient, name: e.target.value })} required placeholder="Ej: Queso Cheddar" style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border-color)', boxSizing: 'border-box' }} />
                </div>
                <div style={{ display: 'flex', gap: '1rem' }}>
                  <div style={{ flex: 1 }}>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>Unidad:</label>
                    <input type="text" value={newIngredient.unit} onChange={e => setNewIngredient({ ...newIngredient, unit: e.target.value })} required placeholder="Ej: gr, litros" style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border-color)', boxSizing: 'border-box' }} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>Stock Minimo:</label>
                    <input type="number" step="0.01" min="0" value={newIngredient.minimumStock} onChange={e => setNewIngredient({ ...newIngredient, minimumStock: e.target.value })} placeholder="0.00" style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border-color)', boxSizing: 'border-box' }} />
                  </div>
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>Costo Extra ($):</label>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>Se cobrara esto al cliente si lo pide como un extra.</p>
                  <input type="number" step="0.01" min="0" value={newIngredient.extraPrice} onChange={e => setNewIngredient({ ...newIngredient, extraPrice: e.target.value })} placeholder="0.00" style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border-color)', boxSizing: 'border-box' }} />
                </div>
                <button type="submit" className="btn btn-primary" style={{ padding: '0.875rem', fontSize: '1rem' }}>Guardar Ingrediente</button>
              </form>
            </div>

            <div className="card" style={{ padding: '2rem', flex: '2 1 420px' }}>
              <h2 style={{ borderBottom: '2px solid var(--primary-color)', paddingBottom: '0.5rem', marginBottom: '1.5rem' }}>Lista de Ingredientes</h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {inventory.map(item => (
                  <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f9fafb', padding: '1rem', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                    <div>
                      <strong style={{ display: 'block', fontSize: '1.1rem' }}>{item.name}</strong>
                      <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '0.2rem', display: 'flex', gap: '1rem' }}>
                        <span>Unidad: <strong>{item.unit}</strong></span>
                        <span>Stock: <strong>{item.quantity}</strong></span>
                        <span style={{ color: item.extraPrice > 0 ? '#10b981' : 'inherit' }}>Extra: <strong>${(item.extraPrice || 0).toFixed(2)}</strong></span>
                      </div>
                    </div>
                    <button onClick={() => deleteIngredient(item.id)} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', display: 'flex', alignItems: 'center' }} title="Eliminar"><Trash2 size={16} strokeWidth={2} /></button>
                  </div>
                ))}
                {inventory.length === 0 && <p style={{ textAlign: 'center', color: 'var(--text-secondary)' }}>No hay ingredientes registrados.</p>}
              </div>
            </div>
          </div>
        )}
      </main>
    </ProtectedRoute>
  );
}
