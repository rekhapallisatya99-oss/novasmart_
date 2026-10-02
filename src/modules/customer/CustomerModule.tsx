import { useState, useEffect } from 'react';
import {
  Search, MapPin, Star, ShoppingCart, Plus, Minus, Trash2,
  Store as StoreIcon, Package, ArrowLeft, ArrowRight, CheckCircle,
  Clock, AlertTriangle, XCircle, Truck, ShoppingBag, ChevronRight,
  Zap, X,
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { placeOrder } from '@/lib/api';
import {
  formatCurrency, formatDate, formatDateTime, timeAgo,
  freshnessLabel, freshnessColor, freshnessHours,
  orderStatusLabel, orderStatusColor, categoryLabel, categoryColor,
  reliabilityColor, reliabilityBg, reliabilityLabel,
} from '@/lib/utils';
import { ProgressBar } from '@/components/Charts';
import type { Store, InventoryItem, Order } from '@/types';
import type { CartItem } from '@/lib/api';

type CustomerView = 'browse' | 'store' | 'cart' | 'checkout' | 'confirmation' | 'orders';

export function CustomerModule() {
  const [view, setView] = useState<CustomerView>('browse');
  const [stores, setStores] = useState<Store[]>([]);
  const [selectedStore, setSelectedStore] = useState<Store | null>(null);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [lastOrder, setLastOrder] = useState<{ number: string; store: string } | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchStores() {
      setLoading(true);
      const { data, error } = await supabase
        .from('stores')
        .select('*')
        .eq('is_active', true)
        .order('reliability_score', { ascending: false });

      if (!error && data) {
        setStores(data as Store[]);
      }
      setLoading(false);
    }
    fetchStores();
  }, []);

  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);
  const cartTotal = cart.reduce((sum, item) => sum + item.unit_price * item.quantity, 0);

  const addToCart = (item: InventoryItem) => {
    if (!selectedStore) return;
    const existing = cart.find(c => c.product_id === item.product_id);
    if (existing) {
      setCart(cart.map(c =>
        c.product_id === item.product_id ? { ...c, quantity: c.quantity + 1 } : c
      ));
    } else {
      setCart([...cart, {
        product_id: item.product_id,
        product_name: item.product?.name || 'Unknown',
        store_id: selectedStore.id,
        store_name: selectedStore.name,
        unit_price: item.selling_price || 0,
        quantity: 1,
        mrp: item.product?.mrp || 0,
        brand: item.product?.brand || null,
        unit: item.product?.unit || null,
      }]);
    }
  };

  const updateCartQty = (productId: string, delta: number) => {
    setCart(cart.map(item => {
      if (item.product_id === productId) {
        const newQty = item.quantity + delta;
        return newQty <= 0 ? null as any : { ...item, quantity: newQty };
      }
      return item;
    }).filter(Boolean) as CartItem[]);
  };

  const removeFromCart = (productId: string) => {
    setCart(cart.filter(c => c.product_id !== productId));
  };

  const selectStore = async (store: Store) => {
    setSelectedStore(store);
    setLoading(true);
    const { data, error } = await supabase
      .from('inventory')
      .select(`*, product:products(*)`)
      .eq('store_id', store.id)
      .order('freshness_status', { ascending: true })
      .order('stock_quantity', { ascending: false });

    if (!error && data) {
      setInventory(data as unknown as InventoryItem[]);
    }
    setLoading(false);
    setView('store');
  };

  const handleOrderPlaced = (orderNumber: string) => {
    setLastOrder({ number: orderNumber, store: selectedStore?.name || '' });
    setCart([]);
    setView('confirmation');
  };

  const loadOrders = async () => {
    const { data, error } = await supabase
      .from('orders')
      .select(`*, store:stores(*), order_items(*)`)
      .order('created_at', { ascending: false })
      .limit(20);

    if (!error && data) {
      setOrders(data as Order[]);
    }
  };

  if (loading && view === 'browse') {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="w-8 h-8 border-2 border-teal-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Customer header with cart */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          {view !== 'browse' && (
            <button
              onClick={() => setView('browse')}
              className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
          )}
          <h2 className="text-xl font-bold text-slate-900">
            {view === 'browse' && 'Browse Stores'}
            {view === 'store' && selectedStore?.name}
            {view === 'cart' && 'Your Cart'}
            {view === 'checkout' && 'Checkout'}
            {view === 'confirmation' && 'Order Confirmed'}
            {view === 'orders' && 'Your Orders'}
          </h2>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              loadOrders();
              setView('orders');
            }}
            className={`inline-flex items-center gap-2 px-3 py-2 text-xs font-medium rounded-lg transition-colors ${
              view === 'orders' ? 'bg-teal-600 text-white' : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <ShoppingBag className="w-4 h-4" />
            Orders
          </button>
          <button
            onClick={() => setView('cart')}
            className={`relative inline-flex items-center gap-2 px-3 py-2 text-xs font-medium rounded-lg transition-colors ${
              view === 'cart' ? 'bg-teal-600 text-white' : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <ShoppingCart className="w-4 h-4" />
            Cart
            {cartCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                {cartCount}
              </span>
            )}
          </button>
        </div>
      </div>

      {view === 'browse' && (
        <StoreBrowse stores={stores} onSelect={selectStore} />
      )}

      {view === 'store' && selectedStore && (
        <StoreView
          store={selectedStore}
          inventory={inventory}
          loading={loading}
          cart={cart}
          onAddToCart={addToCart}
          onUpdateQty={updateCartQty}
          onGoToCart={() => setView('cart')}
        />
      )}

      {view === 'cart' && (
        <CartView
          cart={cart}
          onUpdateQty={updateCartQty}
          onRemove={removeFromCart}
          onCheckout={() => setView('checkout')}
          cartTotal={cartTotal}
        />
      )}

      {view === 'checkout' && (
        <CheckoutView
          cart={cart}
          cartTotal={cartTotal}
          storeName={selectedStore?.name || ''}
          onPlaceOrder={handleOrderPlaced}
          onBack={() => setView('cart')}
        />
      )}

      {view === 'confirmation' && lastOrder && (
        <ConfirmationView
          orderNumber={lastOrder.number}
          storeName={lastOrder.store}
          onContinue={() => setView('browse')}
          onTrackOrders={() => {
            loadOrders();
            setView('orders');
          }}
        />
      )}

      {view === 'orders' && (
        <OrdersView orders={orders} />
      )}
    </div>
  );
}

function StoreBrowse({ stores, onSelect }: { stores: Store[]; onSelect: (s: Store) => void }) {
  const [search, setSearch] = useState('');
  const [cityFilter, setCityFilter] = useState('all');
  const [catFilter, setCatFilter] = useState('all');

  const filtered = stores.filter(s =>
    (cityFilter === 'all' || s.city === cityFilter) &&
    (catFilter === 'all' || s.category === catFilter) &&
    (search === '' || s.name.toLowerCase().includes(search.toLowerCase()) || s.area.toLowerCase().includes(search.toLowerCase()) || s.city.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Search and filters */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search stores or areas..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input-field pl-9"
          />
        </div>
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        {['all', 'Mumbai', 'Delhi', 'Bengaluru'].map(c => (
          <button
            key={c}
            onClick={() => setCityFilter(c)}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
              cityFilter === c ? 'bg-slate-700 text-white' : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            {c === 'all' ? 'All Cities' : c}
          </button>
        ))}
        <span className="w-px h-5 bg-slate-200 mx-1" />
        {['all', 'grocery', 'pharmacy', 'bakery', 'stationery', 'other'].map(c => (
          <button
            key={c}
            onClick={() => setCatFilter(c)}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors capitalize ${
              catFilter === c ? 'bg-teal-600 text-white' : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            {c === 'all' ? 'All Types' : c}
          </button>
        ))}
      </div>

      {/* Store cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((store) => (
          <button
            key={store.id}
            onClick={() => onSelect(store)}
            className="card p-5 text-left hover:shadow-md hover:border-slate-300 transition-all group"
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-11 h-11 rounded-xl bg-teal-50 flex items-center justify-center flex-shrink-0">
                  <StoreIcon className="w-5 h-5 text-teal-600" />
                </div>
                <div className="min-w-0">
                  <h4 className="font-semibold text-slate-900 text-sm truncate">{store.name}</h4>
                  <p className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
                    <MapPin className="w-3 h-3" /> {store.area}, {store.city}
                  </p>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-slate-500 group-hover:translate-x-0.5 transition-all flex-shrink-0" />
            </div>

            <div className="flex items-center gap-2 flex-wrap mb-3">
              <span className={`badge ${categoryColor(store.category)}`}>{categoryLabel(store.category)}</span>
              <span className="text-xs text-slate-500 flex items-center gap-1">
                <Star className="w-3 h-3 text-amber-400" fill="currentColor" /> {store.rating.toFixed(1)}
              </span>
              <span className="text-xs text-slate-500">{store.total_orders} orders</span>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs text-slate-500 flex items-center gap-1">
                  <Zap className="w-3 h-3" /> Reliability
                </span>
                <span className={`text-xs font-semibold ${reliabilityColor(store.reliability_score)}`}>
                  {reliabilityLabel(store.reliability_score)}
                </span>
              </div>
              <ProgressBar value={store.reliability_score} max={100} color={reliabilityBg(store.reliability_score)} />
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

function StoreView({ store, inventory, loading, cart, onAddToCart, onUpdateQty, onGoToCart }: any) {
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState<'freshness' | 'price' | 'name'>('freshness');

  const filtered = inventory.filter((item: InventoryItem) =>
    search === '' || item.product?.name.toLowerCase().includes(search.toLowerCase()) ||
    item.product?.brand?.toLowerCase().includes(search.toLowerCase())
  );

  const sorted = [...filtered].sort((a: InventoryItem, b: InventoryItem) => {
    if (sortBy === 'name') return (a.product?.name || '').localeCompare(b.product?.name || '');
    if (sortBy === 'price') return (a.selling_price || 0) - (b.selling_price || 0);
    // freshness: critical first, then stale, then fresh
    const order = { critical: 0, stale: 1, fresh: 2 };
    return order[a.freshness_status] - order[b.freshness_status];
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-48">
        <div className="w-8 h-8 border-2 border-teal-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Store info banner */}
      <div className="card p-4 bg-gradient-to-r from-teal-50 to-cyan-50/50 border-teal-100">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-teal-100 flex items-center justify-center">
              <StoreIcon className="w-6 h-6 text-teal-600" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900">{store.name}</h3>
              <p className="text-xs text-slate-500 flex items-center gap-1">
                <MapPin className="w-3 h-3" /> {store.area}, {store.city}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-center">
              <p className="text-xs text-slate-500">Rating</p>
              <p className="text-sm font-bold text-slate-900">{store.rating.toFixed(1)} ★</p>
            </div>
            <div className="text-center">
              <p className="text-xs text-slate-500">Reliability</p>
              <p className={`text-sm font-bold ${reliabilityColor(store.reliability_score)}`}>
                {reliabilityLabel(store.reliability_score)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Search and sort */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search products..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input-field pl-9"
          />
        </div>
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as any)}
          className="input-field w-auto"
        >
          <option value="freshness">Sort: Freshness</option>
          <option value="price">Sort: Price</option>
          <option value="name">Sort: Name</option>
        </select>
        {cart.length > 0 && (
          <button onClick={onGoToCart} className="btn-primary">
            <ShoppingCart className="w-4 h-4" />
            View Cart
          </button>
        )}
      </div>

      {/* Products grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {sorted.map((item: InventoryItem) => {
          const cartItem = cart.find((c: CartItem) => c.product_id === item.product_id);
          const hoursAgo = freshnessHours(item.last_updated_at);
          const isLowFreshness = item.freshness_status !== 'fresh';
          const discount = item.product?.mrp && item.selling_price
            ? Math.round(((item.product.mrp - item.selling_price) / item.product.mrp) * 100)
            : 0;

          return (
            <div key={item.id} className="card p-4 hover:shadow-md transition-shadow">
              {/* Freshness indicator */}
              <div className="flex items-start justify-between mb-2">
                <span className={`badge ${freshnessColor(item.freshness_status)}`}>
                  {freshnessLabel(item.freshness_status)}
                </span>
                {discount > 0 && (
                  <span className="text-xs font-bold text-emerald-600">{discount}% OFF</span>
                )}
              </div>

              {/* Product info */}
              <div className="mb-3">
                <h4 className="font-medium text-slate-900 text-sm leading-snug">{item.product?.name}</h4>
                <p className="text-xs text-slate-400 mt-0.5">{item.product?.brand} • {item.product?.unit}</p>
              </div>

              {/* Freshness detail */}
              {isLowFreshness && (
                <div className="flex items-center gap-1.5 text-xs mb-3">
                  <Clock className="w-3 h-3 text-slate-400" />
                  <span className="text-slate-400">Updated {hoursAgo}h ago</span>
                </div>
              )}
              {!isLowFreshness && (
                <div className="flex items-center gap-1.5 text-xs mb-3">
                  <CheckCircle className="w-3 h-3 text-emerald-500" />
                  <span className="text-emerald-600">Stock verified recently</span>
                </div>
              )}

              {/* Price */}
              <div className="flex items-center gap-2 mb-3">
                <span className="text-lg font-bold text-slate-900">{formatCurrency(item.selling_price || 0)}</span>
                {discount > 0 && (
                  <span className="text-xs text-slate-400 line-through">{formatCurrency(item.product?.mrp || 0)}</span>
                )}
              </div>

              {/* Stock warning */}
              {item.stock_quantity === 0 && (
                <div className="flex items-center gap-1.5 text-xs text-red-600 mb-2">
                  <XCircle className="w-3.5 h-3.5" />
                  Out of stock
                </div>
              )}
              {item.stock_quantity > 0 && item.stock_quantity < 5 && (
                <div className="flex items-center gap-1.5 text-xs text-amber-600 mb-2">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  Only {item.stock_quantity} left
                </div>
              )}

              {/* Add to cart */}
              {item.stock_quantity > 0 ? (
                cartItem ? (
                  <div className="flex items-center justify-between bg-teal-50 rounded-lg p-1">
                    <button
                      onClick={() => onUpdateQty(item.product_id, -1)}
                      className="w-8 h-8 rounded-lg bg-white border border-teal-200 flex items-center justify-center text-teal-600 hover:bg-teal-50"
                    >
                      <Minus className="w-4 h-4" />
                    </button>
                    <span className="text-sm font-bold text-teal-700">{cartItem.quantity}</span>
                    <button
                      onClick={() => onAddToCart(item)}
                      className="w-8 h-8 rounded-lg bg-white border border-teal-200 flex items-center justify-center text-teal-600 hover:bg-teal-50"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <button onClick={() => onAddToCart(item)} className="btn-primary w-full text-xs">
                    <Plus className="w-3.5 h-3.5" />
                    Add to Cart
                  </button>
                )
              ) : (
                <button disabled className="btn-secondary w-full text-xs opacity-50 cursor-not-allowed">
                  Unavailable
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function CartView({ cart, onUpdateQty, onRemove, onCheckout, cartTotal }: any) {
  if (cart.length === 0) {
    return (
      <div className="card p-12 text-center animate-fade-in">
        <ShoppingCart className="w-12 h-12 text-slate-300 mx-auto mb-3" />
        <h3 className="text-lg font-semibold text-slate-700">Your cart is empty</h3>
        <p className="text-sm text-slate-400 mt-1">Browse stores and add products to get started</p>
      </div>
    );
  }

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="card p-5">
        <div className="space-y-3">
          {cart.map((item: CartItem) => (
            <div key={item.product_id} className="flex items-center gap-4 py-3 border-b border-slate-100 last:border-0">
              <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center flex-shrink-0">
                <Package className="w-5 h-5 text-slate-400" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-900 truncate">{item.product_name}</p>
                <p className="text-xs text-slate-400">{item.brand} • {item.unit}</p>
              </div>
              <div className="flex items-center gap-2 bg-slate-50 rounded-lg p-1">
                <button onClick={() => onUpdateQty(item.product_id, -1)} className="w-7 h-7 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-slate-600 hover:bg-slate-50">
                  <Minus className="w-3.5 h-3.5" />
                </button>
                <span className="text-sm font-semibold text-slate-900 w-6 text-center">{item.quantity}</span>
                <button onClick={() => onUpdateQty(item.product_id, 1)} className="w-7 h-7 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-slate-600 hover:bg-slate-50">
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>
              <span className="text-sm font-semibold text-slate-900 w-20 text-right">{formatCurrency(item.unit_price * item.quantity)}</span>
              <button onClick={() => onRemove(item.product_id)} className="text-slate-300 hover:text-red-500 transition-colors">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      </div>

      <div className="card p-5">
        <div className="flex items-center justify-between mb-4">
          <span className="text-sm text-slate-600">Total Amount</span>
          <span className="text-2xl font-bold text-slate-900">{formatCurrency(cartTotal)}</span>
        </div>
        <button onClick={onCheckout} className="btn-primary w-full">
          Proceed to Checkout
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

function CheckoutView({ cart, cartTotal, storeName, onPlaceOrder, onBack }: any) {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [payment, setPayment] = useState('upi');
  const [placing, setPlacing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handlePlace = async () => {
    if (!name.trim() || !phone.trim() || !address.trim()) {
      setError('Please fill in all fields');
      return;
    }
    setPlacing(true);
    setError(null);
    const result = await placeOrder(cart, name, phone, address, payment);
    setPlacing(false);
    if (result.success && result.orderNumber) {
      onPlaceOrder(result.orderNumber);
    } else {
      setError(result.error || 'Failed to place order');
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-5 animate-fade-in">
      <div className="card p-5">
        <h3 className="section-title mb-4">Delivery Details</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1.5">Full Name</label>
            <input type="text" value={name} onChange={(e) => setName(e.target.value)} className="input-field" placeholder="Enter your name" />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1.5">Phone Number</label>
            <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} className="input-field" placeholder="+91 XXXXXXXXXX" />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1.5">Delivery Address</label>
            <textarea value={address} onChange={(e) => setAddress(e.target.value)} className="input-field" rows={3} placeholder="Flat / House no, Building, Street, Area" />
          </div>
        </div>
      </div>

      <div className="card p-5">
        <h3 className="section-title mb-4">Payment Method</h3>
        <div className="grid grid-cols-2 gap-3">
          {[
            { id: 'upi', label: 'UPI' },
            { id: 'card', label: 'Card' },
            { id: 'wallet', label: 'Wallet' },
            { id: 'cod', label: 'Cash on Delivery' },
          ].map(p => (
            <button
              key={p.id}
              onClick={() => setPayment(p.id)}
              className={`px-4 py-3 text-sm font-medium rounded-lg border transition-colors ${
                payment === p.id ? 'border-teal-500 bg-teal-50 text-teal-700' : 'border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      <div className="card p-5">
        <h3 className="section-title mb-4">Order Summary</h3>
        <div className="space-y-2">
          {cart.map((item: CartItem) => (
            <div key={item.product_id} className="flex items-center justify-between text-sm">
              <span className="text-slate-600">{item.quantity}× {item.product_name}</span>
              <span className="font-medium text-slate-900">{formatCurrency(item.unit_price * item.quantity)}</span>
            </div>
          ))}
          <div className="border-t border-slate-200 pt-2 mt-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-slate-700">Total</span>
              <span className="text-xl font-bold text-slate-900">{formatCurrency(cartTotal)}</span>
            </div>
          </div>
        </div>
      </div>

      {error && (
        <div className="card p-3 border-red-200 bg-red-50/50">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      <div className="flex items-center gap-3">
        <button onClick={onBack} className="btn-secondary flex-1">Back to Cart</button>
        <button onClick={handlePlace} disabled={placing} className="btn-primary flex-1">
          {placing ? 'Placing Order...' : 'Place Order'}
        </button>
      </div>
    </div>
  );
}

function ConfirmationView({ orderNumber, storeName, onContinue, onTrackOrders }: any) {
  return (
    <div className="max-w-md mx-auto text-center py-12 animate-slide-up">
      <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-4">
        <CheckCircle className="w-8 h-8 text-emerald-600" />
      </div>
      <h2 className="text-2xl font-bold text-slate-900">Order Placed!</h2>
      <p className="text-sm text-slate-500 mt-2">Your order has been sent to {storeName} for fulfilment</p>

      <div className="card p-5 mt-6 text-left">
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm text-slate-600">Order Number</span>
          <span className="text-sm font-bold text-slate-900 font-mono">{orderNumber}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-sm text-slate-600">Status</span>
          <span className="badge text-blue-700 bg-blue-50 border-blue-200">Pending</span>
        </div>
      </div>

      <div className="flex items-center gap-3 mt-6">
        <button onClick={onContinue} className="btn-secondary flex-1">Continue Shopping</button>
        <button onClick={onTrackOrders} className="btn-primary flex-1">Track Orders</button>
      </div>
    </div>
  );
}

function OrdersView({ orders }: { orders: Order[] }) {
  if (orders.length === 0) {
    return (
      <div className="card p-12 text-center animate-fade-in">
        <ShoppingBag className="w-12 h-12 text-slate-300 mx-auto mb-3" />
        <h3 className="text-lg font-semibold text-slate-700">No orders yet</h3>
        <p className="text-sm text-slate-400 mt-1">Place your first order to see it here</p>
      </div>
    );
  }

  const statusSteps = ['pending', 'confirmed', 'picking', 'packed', 'out_for_delivery', 'delivered'];

  return (
    <div className="space-y-3 animate-fade-in">
      {orders.map((order) => {
        const isCancelled = order.status === 'cancelled';
        const currentStepIndex = isCancelled ? -1 : statusSteps.indexOf(order.status);
        const hasSubstitution = order.has_substitution;

        return (
          <div key={order.id} className="card p-5">
            <div className="flex items-start justify-between mb-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-slate-900">{order.order_number}</span>
                  <span className={`badge ${orderStatusColor(order.status)}`}>{orderStatusLabel(order.status)}</span>
                  {hasSubstitution && (
                    <span className="badge text-amber-700 bg-amber-50 border-amber-200" title="This order may have item substitutions">
                      <AlertTriangle className="w-3 h-3" />
                      Substitution
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-400 mt-1">{order.store?.name} • {formatDateTime(order.created_at)}</p>
              </div>
              <div className="text-right">
                <p className="text-lg font-bold text-slate-900">{formatCurrency(order.total_amount)}</p>
                <p className="text-xs text-slate-400">{order.items_count} items</p>
              </div>
            </div>

            {/* Order items preview */}
            {order.order_items && order.order_items.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mb-4">
                {order.order_items.slice(0, 6).map((item, i) => (
                  <span key={i} className="text-xs px-2 py-1 rounded bg-slate-50 text-slate-600 border border-slate-100">
                    {item.quantity}× {item.product_name}
                    {item.substitution_status !== 'none' && (
                      <span className={`ml-1 ${item.substitution_status === 'out_of_stock' ? 'text-red-600' : 'text-amber-600'}`}>
                        ({item.substitution_status === 'out_of_stock' ? 'unavailable' : 'substituted'})
                      </span>
                    )}
                  </span>
                ))}
              </div>
            )}

            {/* Progress tracker for active orders */}
            {!isCancelled && order.status !== 'delivered' && (
              <div className="flex items-center gap-1 mt-4">
                {statusSteps.map((step, i) => (
                  <div key={step} className="flex items-center flex-1 last:flex-none">
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold transition-all ${
                      i <= currentStepIndex ? 'bg-teal-500 text-white' : 'bg-slate-100 text-slate-300'
                    }`}>
                      {i + 1}
                    </div>
                    {i < statusSteps.length - 1 && (
                      <div className={`flex-1 h-1 mx-1 rounded-full transition-all ${
                        i < currentStepIndex ? 'bg-teal-500' : 'bg-slate-100'
                      }`} />
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Cancelled notice */}
            {isCancelled && (
              <div className="flex items-center gap-2 mt-3 text-sm text-red-600 bg-red-50/50 rounded-lg p-3">
                <XCircle className="w-4 h-4" />
                <span>{order.cancellation_reason || 'Order was cancelled'}</span>
              </div>
            )}

            {/* Delivered notice */}
            {order.status === 'delivered' && (
              <div className="flex items-center gap-2 mt-3 text-sm text-emerald-600 bg-emerald-50/50 rounded-lg p-3">
                <CheckCircle className="w-4 h-4" />
                <span>Delivered {order.delivery_time_minutes ? `in ${order.delivery_time_minutes} min` : ''}</span>
              </div>
            )}

            {/* Delivery info */}
            {order.delivery_address && (
              <div className="flex items-center gap-2 mt-3 text-xs text-slate-400">
                <MapPin className="w-3 h-3" />
                <span>{order.delivery_address}</span>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
