import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { format } from 'date-fns';

export interface Trade {
  id: string;
  userId: string;
  amount: number;
  note?: string;
  date: Date;
  createdAt: Date;
}

export interface Capital {
  id: string;
  amountBirr: number;
  amountUsd: number;
  exchangeRate: number;
  createdAt: Date;
}

export interface User {
  id: string;
  telegramId: string;
  name: string;
  role: 'trader' | 'partner';
}

interface TradeStore {
  user: User | null;
  trades: Trade[];
  capital: Capital | null;
  isLoading: boolean;
  error: string | null;
  
  // User actions
  setUser: (user: User | null) => void;
  
  // Trade actions
  fetchTrades: () => Promise<void>;
  addTrade: (trade: Omit<Trade, 'id' | 'userId' | 'createdAt'>) => Promise<void>;
  
  // Capital actions
  fetchCapital: () => Promise<void>;
  updateCapital: (capital: Omit<Capital, 'id' | 'createdAt'>) => Promise<void>;
  
  // UI state
  setLoading: (isLoading: boolean) => void;
  setError: (error: string | null) => void;
  
  // Dashboard calculations
  getMonthlyProfit: (month: Date) => number;
  getTotalProfit: () => number;
  getTradesByMonth: (month: Date) => Trade[];
}

export const useTradeStore = create<TradeStore>()(
  persist(
    (set, get) => ({
      user: null,
      trades: [],
      capital: null,
      isLoading: false,
      error: null,
      
      // User actions
      setUser: (user) => set({ user }),
      
      // Trade actions
      fetchTrades: async () => {
        set({ isLoading: true, error: null });
        try {
          const response = await fetch('/api/trades');
          if (!response.ok) throw new Error('Failed to fetch trades');
          
          const data = await response.json();
          set({ trades: data.trades });
        } catch (error) {
          set({ error: error instanceof Error ? error.message : 'An unknown error occurred' });
        } finally {
          set({ isLoading: false });
        }
      },
      
      addTrade: async (trade) => {
        set({ isLoading: true, error: null });
        try {
          const response = await fetch('/api/trades', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(trade),
          });
          
          if (!response.ok) throw new Error('Failed to add trade');
          
          const data = await response.json();
          set((state) => ({ trades: [...state.trades, data.trade] }));
        } catch (error) {
          set({ error: error instanceof Error ? error.message : 'An unknown error occurred' });
        } finally {
          set({ isLoading: false });
        }
      },
      
      // Capital actions
      fetchCapital: async () => {
        set({ isLoading: true, error: null });
        try {
          const response = await fetch('/api/capital');
          if (!response.ok) throw new Error('Failed to fetch capital');
          
          const data = await response.json();
          set({ capital: data.capital });
        } catch (error) {
          set({ error: error instanceof Error ? error.message : 'An unknown error occurred' });
        } finally {
          set({ isLoading: false });
        }
      },
      
      updateCapital: async (capital) => {
        set({ isLoading: true, error: null });
        try {
          const response = await fetch('/api/capital', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(capital),
          });
          
          if (!response.ok) throw new Error('Failed to update capital');
          
          const data = await response.json();
          set({ capital: data.capital });
        } catch (error) {
          set({ error: error instanceof Error ? error.message : 'An unknown error occurred' });
        } finally {
          set({ isLoading: false });
        }
      },
      
      // UI state
      setLoading: (isLoading) => set({ isLoading }),
      setError: (error) => set({ error }),
      
      // Dashboard calculations
      getMonthlyProfit: (month) => {
        const startOfMonth = new Date(month.getFullYear(), month.getMonth(), 1);
        const endOfMonth = new Date(month.getFullYear(), month.getMonth() + 1, 0);
        
        return get().trades
          .filter(trade => {
            const tradeDate = new Date(trade.date);
            return tradeDate >= startOfMonth && tradeDate <= endOfMonth;
          })
          .reduce((sum, trade) => sum + trade.amount, 0);
      },
      
      getTotalProfit: () => {
        return get().trades.reduce((sum, trade) => sum + trade.amount, 0);
      },
      
      getTradesByMonth: (month) => {
        const startOfMonth = new Date(month.getFullYear(), month.getMonth(), 1);
        const endOfMonth = new Date(month.getFullYear(), month.getMonth() + 1, 0);
        
        return get().trades.filter(trade => {
          const tradeDate = new Date(trade.date);
          return tradeDate >= startOfMonth && tradeDate <= endOfMonth;
        });
      },
    }),
    {
      name: 'trade-store',
      storage: createJSONStorage(() => localStorage),
    }
  )
);