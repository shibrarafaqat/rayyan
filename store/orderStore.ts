import { create } from 'zustand';
import { supabase, Order, Fitoora, Payment } from '@/utils/supabase';

/**
 * Interface defining the state and actions for the order management store.
 * This store handles all order-related operations including creation, updates,
 * and management of fitooras (measurement sheets) and payments.
 */
interface OrderState {
  /** List of all orders */
  orders: Order[];
  /** Currently selected order */
  currentOrder: Order | null;
  /** List of fitooras (measurement sheets) for the current order */
  fitooras: Fitoora[];
  /** List of payments for the current order */
  payments: Payment[];
  /** Loading state indicator */
  isLoading: boolean;
  /** Error message if any operation fails */
  error: string | null;
  
  /** Fetches all orders from the database */
  fetchOrders: () => Promise<void>;
  /** Searches for an order by its serial number */
  searchOrderBySerial: (serialNumber: string) => Promise<Order | null>;
  /** Fetches an order by its ID */
  getOrderById: (id: string) => Promise<Order | null>;
  /** Creates a new order */
  createOrder: (orderData: Partial<Order>) => Promise<{ data: Order | null; error: Error | null }>;
  /** Updates the status of an order */
  updateOrderStatus: (id: string, status: Order['status']) => Promise<void>;
  /** Fetches all fitooras for a specific order */
  fetchFitoorasByOrderId: (orderId: string) => Promise<void>;
  /** Uploads a new fitoora (measurement sheet) for an order */
  uploadFitoora: (orderId: string, uri: string) => Promise<{ data: Fitoora | null; error: Error | null }>;
  /** Fetches all payments for a specific order */
  fetchPaymentsByOrderId: (orderId: string) => Promise<void>;
  /** Adds a new payment to an order */
  addPayment: (payment: Partial<Payment>) => Promise<{ data: Payment | null; error: Error | null }>;
}

/**
 * Zustand store for managing orders and related operations.
 * Provides a centralized state management solution for all order-related functionality.
 */
export const useOrderStore = create<OrderState>((set, get) => ({
  orders: [],
  currentOrder: null,
  fitooras: [],
  payments: [],
  isLoading: false,
  error: null,

  /**
   * Fetches all orders from the database and updates the store state.
   * Orders are sorted by creation date in descending order.
   */
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

  /**
   * Searches for an order by its serial number.
   * Updates the currentOrder state if found.
   * 
   * @param serialNumber - The serial number to search for
   * @returns The found order or null if not found
   */
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

  /**
   * Fetches an order by its ID and updates the currentOrder state.
   * 
   * @param id - The ID of the order to fetch
   * @returns The found order or null if not found
   */
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

  /**
   * Creates a new order in the database.
   * Calculates remaining amount based on total and deposit.
   * 
   * @param orderData - The data for the new order
   * @returns The created order and any error that occurred
   */
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

  /**
   * Updates the status of an order and related timestamps.
   * Updates both the database and local state.
   * 
   * @param id - The ID of the order to update
   * @param status - The new status to set
   */
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

  /**
   * Uploads a fitoora (measurement sheet) image for an order.
   * Handles image compression, validation, and storage.
   * 
   * @param orderId - The ID of the order to attach the fitoora to
   * @param uri - The URI of the image to upload
   * @returns The created fitoora record and any error that occurred
   */
  uploadFitoora: async (orderId: string, uri: string) => {
    set({ isLoading: true, error: null });
    try {
      // Validate file type
      const fileExtension = uri.split('.').pop()?.toLowerCase();
      if (!fileExtension || !['jpg', 'jpeg', 'png'].includes(fileExtension)) {
        throw new Error('Only JPG and PNG images are allowed');
      }

      // First compress the image
      const compressedUri = await compressImage(uri);
      
      // Generate unique filename
      const fileName = `${orderId}_${new Date().getTime()}.jpg`;
      const filePath = `${fileName}`;
      
      // Fetch the binary data
      const response = await fetch(compressedUri);
      const blob = await response.blob();
      
      // Check file size after compression
      if (blob.size > 1000000) { // 1MB limit
        throw new Error('Image is too large after compression. Please try a different image.');
      }

      // Upload to Supabase Storage
      const { error: uploadError } = await supabase
        .storage
        .from('fitooras')
        .upload(filePath, blob, {
          contentType: 'image/jpeg',
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) {
        if (uploadError.message.includes('duplicate')) {
          throw new Error('An image with this name already exists. Please try again.');
        }
        throw uploadError;
      }

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

  /**
   * Fetches all fitooras for a specific order.
   * Updates the fitooras state with the fetched data.
   * 
   * @param orderId - The ID of the order to fetch fitooras for
   */
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

  /**
   * Fetches all payments for a specific order.
   * Updates the payments state with the fetched data.
   * 
   * @param orderId - The ID of the order to fetch payments for
   */
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

  /**
   * Adds a new payment to an order.
   * Updates both the database and local state.
   * Also updates the order's remaining amount.
   * 
   * @param payment - The payment data to add
   * @returns The created payment and any error that occurred
   */
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