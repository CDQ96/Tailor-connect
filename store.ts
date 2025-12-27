import React, { createContext, useContext, useState, ReactNode } from 'react';
import { User, UserRole, AppView, Order, Tailor } from './types';
import { MOCK_ORDERS } from './constants';

interface AppState {
  user: User | null;
  view: AppView;
  activeTailor: Tailor | null;
  orders: Order[];
  notifications: string[];
  
  // Actions
  login: (role: UserRole, name: string) => void;
  logout: () => void;
  navigate: (view: AppView) => void;
  selectTailor: (tailor: Tailor) => void;
  addOrder: (order: Order) => void;
  addNotification: (msg: string) => void;
}

const AppContext = createContext<AppState | undefined>(undefined);

export const AppProvider = ({ children }: { children?: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [view, setView] = useState<AppView>(AppView.LANDING);
  const [activeTailor, setActiveTailor] = useState<Tailor | null>(null);
  const [orders, setOrders] = useState<Order[]>(MOCK_ORDERS);
  const [notifications, setNotifications] = useState<string[]>([]);

  const login = (role: UserRole, name: string) => {
    setUser({
      id: 'u1',
      name: name,
      email: `${name.toLowerCase().replace(' ', '.')}@example.com`,
      role: role,
      avatar: `https://ui-avatars.com/api/?name=${name}&background=random`
    });
    setView(role === UserRole.TAILOR ? AppView.TAILOR_DASHBOARD : AppView.CUSTOMER_DASHBOARD);
  };

  const logout = () => {
    setUser(null);
    setView(AppView.LANDING);
  };

  const navigate = (newView: AppView) => setView(newView);
  
  const selectTailor = (tailor: Tailor) => {
    setActiveTailor(tailor);
    navigate(AppView.TAILOR_DETAILS);
  };

  const addOrder = (order: Order) => {
    setOrders([order, ...orders]);
  };

  const addNotification = (msg: string) => {
    setNotifications(prev => [msg, ...prev]);
    // Auto remove after 3s
    setTimeout(() => {
        setNotifications(prev => prev.filter(n => n !== msg));
    }, 5000);
  };

  return React.createElement(
    AppContext.Provider,
    {
      value: { 
        user, view, activeTailor, orders, notifications, 
        login, logout, navigate, selectTailor, addOrder, addNotification 
      }
    },
    children
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error("useApp must be used within AppProvider");
  return context;
};