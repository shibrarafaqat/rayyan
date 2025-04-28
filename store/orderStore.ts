import { create } from 'zustand';
import { supabase, Order, Fitoora, Payment } from '@/utils/supabase';

interface OrderState {
  orders: Order[];
  currentOrder: Order | null;
  fitooras: Fitoora[];
  payments: Payment[];
  isLoading: boolean;
  error: string | null;
  
  fetchOrders: () => Promise<void>;
  searchOrderBySerial: (serialNumber: string) => Promise<Order | null>;
  getOrderById: (id: string) => Promise<Order | null>;
  createOrder: (orderData: Partial<Order>) => Promise<{ data: Order | null; error: Error | null }>;
  updateOrderStatus: (id: string, status: Order['status']) => Promise<void>;
  fetchFitoorasByOrderId: (orderId: string) => Promise<void>;
  uploadFitoora: (orderId: string, uri: string) => Promise<{ data: Fitoora | null; error: Error | null }>;
  fetchPaymentsByOrderId: (orderId: string) => Promise<void>;
  addPayment: (payment: Partial<Payment>) => Promise<{ data: Payment | null; error: Error | null }>;
}

export const useOrderStore = create<OrderState>((set, get) => ({
  orders: [],
  currentOrder: null,
  fitooras: [],
  payments: [],
  isLoading: false,
  error: null,

  fetchOrders: async () => {
    set({ isLoading: true, error: null });
    try {
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      set({ orders: data as Order[], isLoading: false });
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false });
    }
  },

  searchOrderBySerial: async (serialNumber: string) => {
    set({ isLoading: true, error: null });
    try {
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .eq('serial_number', serialNumber)
        .single();

      if (error) {
        set({ error: error.message, isLoading: false });
        return null;
      }

      set({ currentOrder: data as Order, isLoading: false });
      return data as Order;
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false });
      return null;
    }
  },

  getOrderById: async (id: string) => {
    set({ isLoading: true, error: null });
    try {
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        set({ error: error.message, isLoading: false });
        return null;
      }

      set({ currentOrder: data as Order, isLoading: false });
      return data as Order;
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false });
      return null;
    }
  },

  createOrder: async (orderData: Partial<Order>) => {
    set({ isLoading: true, error: null });
    try {
      const total = orderData.total_amount || 0;
      const deposit = orderData.deposit_amount || 0;
      const remaining = total - deposit;

      const { data, error } = await supabase
        .from('orders')
        .insert({
          ...orderData,
          remaining_amount: remaining,
          status: 'pending',
        })
        .select()
        .single();

      if (error) throw error;

      const newOrder = data as Order;
      set(state => ({ 
        orders: [newOrder, ...state.orders], 
        isLoading: false 
      }));

      return { data: newOrder, error: null };
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false });
      return { data: null, error: error as Error };
    }
  },

  updateOrderStatus: async (id: string, status: Order['status']) => {
    set({ isLoading: true, error: null });
    try {
      const updateData: Partial<Order> = { status };
      if (status === 'stitched') {
        updateData.completed_at = new Date().toISOString();
      } else if (status === 'delivered') {
        updateData.delivered_at = new Date().toISOString();
      }

      const { error } = await supabase
        .from('orders')
        .update(updateData)
        .eq('id', id);

      if (error) throw error;

      set(state => ({
        orders: state.orders.map(order => 
          order.id === id ? { ...order, ...updateData } : order
        ),
        currentOrder: state.currentOrder?.id === id 
          ? { ...state.currentOrder, ...updateData } 
          : state.currentOrder,
        isLoading: false
      }));
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false });
    }
  },

  uploadFitoora: async (orderId: string, uri: string) => {
    set({ isLoading: true, error: null });
    try {
      // First upload the image to storage
      const fileName = `${orderId}_${new Date().getTime()}.jpg`;
      const filePath = `${fileName}`;
      
      // Fetch the binary data
      const response = await fetch(uri);
      const blob = await response.blob();
      
      // Upload to Supabase Storage
      const { error: uploadError } = await supabase
        .storage
        .from('fitooras')
        .upload(filePath, blob, {
          contentType: 'image/jpeg',
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase
        .storage
        .from('fitooras')
        .getPublicUrl(filePath);

      // Create fitoora record in database
      const { data, error } = await supabase
        .from('fitooras')
        .insert({
          order_id: orderId,
          image_url: publicUrl,
        })
        .select()
        .single();

      if (error) throw error;

      const newFitoora = data as Fitoora;
      set(state => ({ 
        fitooras: [newFitoora, ...state.fitooras], 
        isLoading: false 
      }));

      return { data: newFitoora, error: null };
    } catch (error) {
      console.error('Upload error:', error);
      set({ error: (error as Error).message, isLoading: false });
      return { data: null, error: error as Error };
    }
  },

  fetchFitoorasByOrderId: async (orderId: string) => {
    set({ isLoading: true, error: null });
    try {
      const { data, error } = await supabase
        .from('fitooras')
        .select('*')
        .eq('order_id', orderId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      set({ fitooras: data as Fitoora[], isLoading: false });
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false });
    }
  },

  fetchPaymentsByOrderId: async (orderId: string) => {
    set({ isLoading: true, error: null });
    try {
      const { data, error } = await supabase
        .from('payments')
        .select('*')
        .eq('order_id', orderId)
        .order('payment_date', { ascending: false });

      if (error) throw error;
      set({ payments: data as Payment[], isLoading: false });
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false });
    }
  },

  addPayment: async (payment: Partial<Payment>) => {
    set({ isLoading: true, error: null });
    try {
      const { data, error } = await supabase
        .from('payments')
        .insert({
          ...payment,
          payment_date: payment.payment_date || new Date().toISOString(),
        })
        .select()
        .single();

      if (error) throw error;

      const newPayment = data as Payment;
      set(state => ({ 
        payments: [newPayment, ...state.payments], 
        isLoading: false 
      }));

      const currentOrder = get().currentOrder;
      if (currentOrder) {
        const newRemaining = currentOrder.remaining_amount - (payment.amount || 0);
        
        await supabase
          .from('orders')
          .update({ remaining_amount: newRemaining })
          .eq('id', currentOrder.id);

        set(state => ({
          currentOrder: state.currentOrder 
            ? { ...state.currentOrder, remaining_amount: newRemaining } 
            : null
        }));
      }

      return { data: newPayment, error: null };
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false });
      return { data: null, error: error as Error };
    }
  },
}));