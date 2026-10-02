import { supabase } from '@/lib/supabase';
import type { InventoryItem, OrderItem } from '@/types';

export interface CartItem {
  product_id: string;
  product_name: string;
  store_id: string;
  store_name: string;
  unit_price: number;
  quantity: number;
  mrp: number;
  brand: string | null;
  unit: string | null;
}

export async function placeOrder(
  cart: CartItem[],
  customerName: string,
  customerPhone: string,
  deliveryAddress: string,
  paymentMethod: string
): Promise<{ success: boolean; orderNumber?: string; error?: string }> {
  if (cart.length === 0) {
    return { success: false, error: 'Cart is empty' };
  }

  const storeId = cart[0].store_id;
  const orderNumber = 'NC' + Math.floor(1000000 + Math.random() * 8999999).toString();
  const totalAmount = cart.reduce((sum, item) => sum + item.unit_price * item.quantity, 0);

  // Check inventory for potential issues
  const { data: inventory } = await supabase
    .from('inventory')
    .select('id, product_id, stock_quantity, freshness_status')
    .eq('store_id', storeId)
    .in('product_id', cart.map(c => c.product_id));

  const invMap = new Map<string, { stock: number; freshness: string }>();
  inventory?.forEach(inv => {
    invMap.set(inv.product_id, { stock: inv.stock_quantity, freshness: inv.freshness_status });
  });

  // Determine if order has reliability issues
  let hasSubstitution = false;
  const orderItems: Omit<OrderItem, 'id' | 'order_id'>[] = cart.map(item => {
    const inv = invMap.get(item.product_id);
    let substitutionStatus: 'none' | 'substituted' | 'out_of_stock' = 'none';

    if (inv && (inv.stock < item.quantity || inv.freshness === 'critical')) {
      if (inv.stock === 0 || inv.freshness === 'critical') {
        substitutionStatus = 'out_of_stock';
        hasSubstitution = true;
      } else if (inv.freshness === 'stale') {
        substitutionStatus = 'substituted';
        hasSubstitution = true;
      }
    }

    return {
      product_id: item.product_id,
      product_name: item.product_name,
      quantity: item.quantity,
      unit_price: item.unit_price,
      line_total: item.unit_price * item.quantity,
      substitution_status: substitutionStatus,
      substituted_with: substitutionStatus === 'substituted' ? 'Similar product may be substituted' : null,
    };
  });

  const { data: order, error } = await supabase
    .from('orders')
    .insert({
      order_number: orderNumber,
      customer_name: customerName,
      customer_phone: customerPhone,
      store_id: storeId,
      status: 'pending',
      total_amount: totalAmount,
      items_count: cart.length,
      delivery_address: deliveryAddress,
      payment_method: paymentMethod,
      has_substitution: hasSubstitution,
      reliability_impact: hasSubstitution,
    })
    .select()
    .single();

  if (error || !order) {
    return { success: false, error: error?.message || 'Failed to create order' };
  }

  const itemsToInsert = orderItems.map(item => ({
    ...item,
    order_id: order.id,
  }));

  const { error: itemsError } = await supabase.from('order_items').insert(itemsToInsert);

  if (itemsError) {
    return { success: false, error: 'Order created but items failed to save' };
  }

  return { success: true, orderNumber };
}

export async function updateOrderStatus(
  orderId: string,
  status: string
): Promise<{ success: boolean; error?: string }> {
  const updateData: Record<string, unknown> = { status };

  if (status === 'confirmed') updateData.confirmed_at = new Date().toISOString();
  if (status === 'delivered') {
    updateData.delivered_at = new Date().toISOString();
    updateData.delivery_time_minutes = Math.floor(Math.random() * 30 + 25);
  }
  if (status === 'cancelled') {
    updateData.cancelled_at = new Date().toISOString();
    updateData.cancellation_reason = 'Cancelled by store manager';
  }

  const { error } = await supabase.from('orders').update(updateData).eq('id', orderId);

  if (error) return { success: false, error: error.message };
  return { success: true };
}

export async function updateInventoryFreshness(
  inventoryId: string,
  newStock: number,
  newPrice?: number
): Promise<{ success: boolean; error?: string }> {
  const now = new Date().toISOString();
  const freshness = 'fresh';

  const updateData: Record<string, unknown> = {
    stock_quantity: newStock,
    is_available: newStock > 0,
    last_updated_at: now,
    freshness_status: freshness,
  };

  if (newPrice !== undefined) updateData.selling_price = newPrice;

  const { error } = await supabase
    .from('inventory')
    .update(updateData)
    .eq('id', inventoryId);

  if (error) return { success: false, error: error.message };
  return { success: true };
}

export async function updateTicketStatus(
  ticketId: string,
  status: string
): Promise<{ success: boolean; error?: string }> {
  const updateData: Record<string, unknown> = { status };
  if (status === 'resolved' || status === 'closed') {
    updateData.resolved_at = new Date().toISOString();
  }

  const { error } = await supabase.from('support_tickets').update(updateData).eq('id', ticketId);

  if (error) return { success: false, error: error.message };
  return { success: true };
}

export async function batchRefreshInventory(storeId: string): Promise<{ success: boolean; refreshed: number }> {
  const now = new Date().toISOString();

  const { data, error } = await supabase
    .from('inventory')
    .update({
      last_updated_at: now,
      freshness_status: 'fresh',
    })
    .eq('store_id', storeId)
    .neq('freshness_status', 'fresh')
    .select('id');

  if (error) return { success: false, refreshed: 0 };
  return { success: true, refreshed: data?.length || 0 };
}

export async function getInventoryByStore(storeId: string): Promise<InventoryItem[]> {
  const { data, error } = await supabase
    .from('inventory')
    .select(`
      *,
      product:products(*)
    `)
    .eq('store_id', storeId)
    .order('freshness_status', { ascending: false });

  if (error || !data) return [];
  return data as unknown as InventoryItem[];
}
