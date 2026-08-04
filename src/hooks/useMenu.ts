'use client';

import { useState, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import toast from 'react-hot-toast';
import { API_URL, WS_URL } from '../lib/config';
import { isLoggedIn, getRole, getUserName } from '../lib/auth';
import { fetchProducts, fetchCategories, Product } from '../services/productService';
import { fetchMyOrders, submitOrder, CartItem } from '../services/orderService';

export function useMenu() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [customerName, setCustomerName] = useState('');
  const [selectedPayment, setSelectedPayment] = useState<'EFECTIVO' | 'TRANSFERENCIA' | null>(null);
  const [myOrders, setMyOrders] = useState<any[]>([]);
  const [showCart, setShowCart] = useState(false);
  const [view, setView] = useState<'menu' | 'perfil'>('menu');
  const [perfilTab, setPerfilTab] = useState<'pedidos' | 'contactos' | 'terminos'>('pedidos');

  const [showDetail, setShowDetail] = useState<Product | null>(null);
  const [detailQty, setDetailQty] = useState(1);
  const [detailExtras, setDetailExtras] = useState<{ name: string; price: number; qty: number }[]>([]);

  const [observations, setObservations] = useState('');
  const [lastOrder, setLastOrder] = useState<any>(null);
  const [showTicket, setShowTicket] = useState(false);

  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [logged, setLogged] = useState(false);
  const [role, setRole] = useState<string | null>(null);
  const [userName, setUserName] = useState<string | null>(null);
  const [hydrated, setHydrated] = useState(false);

  const socketRef = useRef<any>(null);
  const catScrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setHydrated(true);
    setLogged(isLoggedIn());
    setRole(getRole());
    setUserName(getUserName());
  }, []);

  useEffect(() => {
    fetchProducts().then(data => { setProducts(data); setLoadingProducts(false); }).catch(() => { setLoadingProducts(false); });
    fetchCategories().then(setCategories).catch(() => {});

    socketRef.current = io(WS_URL, { transports: ['websocket', 'polling'] });
    socketRef.current.on('order_status_updated', (data: any) => {
      setMyOrders(prev => prev.map(o => o.id === data.id ? { ...o, ...data } : o));
      if (data.status === 'READY') toast.success(`Tu pedido #${data.id} esta listo!`, { icon: '🔔', duration: 6000 });
    });
    return () => { socketRef.current?.disconnect(); };
  }, []);

  useEffect(() => {
    if (logged && userName) {
      const token = localStorage.getItem('token');
      if (token) {
        fetchMyOrders(token)
          .then((data: any[]) => {
            const mine = data.filter(o => o.customerName === userName);
            setMyOrders(mine);
          })
          .catch(() => {});
      }
    }
  }, [logged, userName]);

  const openDetail = (product: Product) => {
    setDetailQty(1);
    const extras = (product.recipes || []).map((r: any) => ({
      name: r.inventoryItem?.name || 'Ingrediente',
      price: r.inventoryItem?.extraPrice || 0,
      qty: 0,
    }));
    setDetailExtras(extras);
    setShowDetail(product);
  };

  const updateExtraQty = (index: number, delta: number) => {
    setDetailExtras(prev => prev.map((e, i) => i === index ? { ...e, qty: Math.max(0, e.qty + delta) } : e));
  };

  const getDetailTotal = () => {
    if (!showDetail) return 0;
    const base = showDetail.price * detailQty;
    const extras = detailExtras.reduce((sum, e) => sum + e.price * e.qty * detailQty, 0);
    return base + extras;
  };

  const addToCartFromDetail = (product: Product) => {
    if (!logged) { setShowDetail(null); setShowAuthModal(true); return; }
    const selectedExtras = detailExtras.filter(e => e.qty > 0).map(e => ({ name: e.name, price: e.price, qty: e.qty }));
    const notes = selectedExtras.map(e => `${e.name} x${e.qty}`).join(', ');
    setCart(prev => [...prev, { product, quantity: detailQty, notes, selectedExtras }]);
    setShowDetail(null);
    toast.success(`${product.name} x${detailQty} agregado`, { icon: '✓', duration: 1500, style: { background: '#10b981', color: '#fff' } });
  };

  const quickAdd = (product: Product) => {
    if (!logged) { setShowAuthModal(true); return; }
    setCart(prev => [...prev, { product, quantity: 1, notes: '', selectedExtras: [] }]);
    toast.success(`${product.name} agregado`, { icon: '✓', duration: 1500, style: { background: '#10b981', color: '#fff' } });
  };

  const updateQuantity = (productId: number, delta: number) => {
    setCart(prev => prev.map(i => {
      if (i.product.id !== productId) return i;
      return { ...i, quantity: Math.max(0, i.quantity + delta) };
    }).filter(i => i.quantity > 0));
  };

  const removeCartItem = (index: number) => {
    setCart(prev => prev.filter((_, i) => i !== index));
  };

  const getTotal = () => cart.reduce((sum, i) => {
    const base = i.product.price * i.quantity;
    const extras = i.selectedExtras.reduce((s, e) => s + e.price * e.qty * i.quantity, 0);
    return sum + base + extras;
  }, 0);
  const cartCount = cart.reduce((s, i) => s + i.quantity, 0);
  const displayProducts = activeCategory ? products.filter(p => p.category?.name === activeCategory) : products;

  const handleSubmitOrder = async () => {
    if (!customerName.trim()) { toast.error('Ingresa tu nombre'); return; }
    if (cart.length === 0) { toast.error('El carrito esta vacio'); return; }
    try {
      const token = localStorage.getItem('token');
      const order = await submitOrder({
        customerName: customerName.trim(),
        total: getTotal(),
        observations: observations.trim(),
        items: cart.map(i => ({ productId: i.product.id, quantity: i.quantity, price: i.product.price, notes: i.notes })),
        paymentMethod: selectedPayment,
      }, token);
      setMyOrders(prev => [order, ...prev]);
      setCart([]);
      setShowCart(false);
      setCustomerName('');
      setSelectedPayment(null);
      setObservations('');
      setLastOrder(order);
      setShowTicket(true);
    } catch { toast.error('Error al enviar pedido'); }
  };

  const getStatusColor = (s: string) => {
    switch (s) {
      case 'PENDING': return { bg: '#fef3c7', text: '#92400e', label: 'Pendiente' };
      case 'PREPARING': return { bg: '#dbeafe', text: '#1e40af', label: 'Preparando' };
      case 'READY': return { bg: '#d1fae5', text: '#065f46', label: 'Listo!' };
      default: return { bg: '#f3f4f6', text: '#374151', label: s };
    }
  };

  const catScroll = (dir: number) => {
    if (catScrollRef.current) catScrollRef.current.scrollBy({ left: dir * 200, behavior: 'smooth' });
  };

  return {
    // state
    products, cart, categories, activeCategory, customerName, selectedPayment,
    myOrders, showCart, view, perfilTab, loadingProducts,
    showDetail, detailQty, detailExtras,
    showAuthModal, authMode, showLogoutModal,
    logged, role, userName, hydrated,
    observations, lastOrder, showTicket,
    catScrollRef, displayProducts, cartCount,
    // setters
    setActiveCategory, setCustomerName, setSelectedPayment,
    setShowCart, setView, setPerfilTab,
    setShowDetail, setDetailQty,
    setShowAuthModal, setAuthMode, setShowLogoutModal,
    setLogged, setRole, setUserName,
    setObservations, setShowTicket,
    // actions
    openDetail, updateExtraQty, getDetailTotal,
    addToCartFromDetail, quickAdd, updateQuantity,
    removeCartItem, getTotal, handleSubmitOrder,
    getStatusColor, catScroll,
  };
}
