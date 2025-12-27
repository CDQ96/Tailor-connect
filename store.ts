import React, { createContext, useContext, useState, ReactNode } from 'react';
import { User, UserRole, AppView, Order, Tailor, OrderStatus, Chat, Material, Appointment, Review, PaymentStatus, MeasurementProfile, Look } from './types';
import { MOCK_ORDERS, MOCK_CHATS, MOCK_TAILORS, INITIAL_MEASUREMENTS } from './constants';

interface AppState {
  user: User | null;
  view: AppView;
  activeTailor: Tailor | null;
  tailors: Tailor[];
  selectedMaterial: Material | null;
  orders: Order[];
  appointments: Appointment[];
  notifications: string[];
  chats: Chat[];
  activeChatId: string | null;
  draftOrder: Partial<Order> | null;
  tailorInventory: Material[];
  
  // Actions
  login: (role: UserRole, name: string) => void;
  logout: () => void;
  navigate: (view: AppView) => void;
  selectTailor: (tailor: Tailor) => void;
  selectMaterial: (material: Material | null) => void;
  createDraftOrder: (order: Partial<Order>) => void;
  completeOrder: (usedPoints?: number) => void;
  addOrder: (order: Order) => void;
  updateOrderStatus: (orderId: string, status: OrderStatus) => void;
  simulateOrderProgress: (orderId: string) => void;
  addNotification: (msg: string) => void;
  sendMessage: (text: string) => void;
  openChat: (participantId: string, participantName: string) => void;
  closeActiveChat: () => void;
  bookAppointment: (apt: Partial<Appointment>) => void;
  addInventoryItem: (item: Partial<Material>) => void;
  addReview: (tailorId: string, rating: number, comment: string) => void;
  releaseEscrow: (orderId: string) => void;
  updatePortfolio: (action: 'add' | 'remove', imageUrl: string) => void;
  
  // Profile Actions
  addAddress: (address: string) => void;
  removeAddress: (address: string) => void;
  saveMeasurementProfile: (name: string, values: any) => void;
  deleteMeasurementProfile: (id: string) => void;
  saveLook: (look: Look) => void;
  deleteLook: (id: string) => void;
}

const AppContext = createContext<AppState | undefined>(undefined);

export const AppProvider = ({ children }: { children?: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [view, setView] = useState<AppView>(AppView.LANDING);
  const [tailors, setTailors] = useState<Tailor[]>(MOCK_TAILORS);
  const [activeTailor, setActiveTailor] = useState<Tailor | null>(null);
  const [selectedMaterial, setSelectedMaterial] = useState<Material | null>(null);
  const [orders, setOrders] = useState<Order[]>(MOCK_ORDERS);
  const [notifications, setNotifications] = useState<string[]>([]);
  const [chats, setChats] = useState<Chat[]>(MOCK_CHATS);
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [draftOrder, setDraftOrder] = useState<Partial<Order> | null>(null);
  const [appointments, setAppointments] = useState<Appointment[]>([
    {
        id: 'apt-mock-1',
        tailorId: 't1',
        tailorName: 'Rossi Couture',
        customerId: 'u1',
        customerName: 'Me',
        date: new Date().toISOString().split('T')[0],
        time: '14:00',
        type: 'FITTING',
        status: 'CONFIRMED'
    }
  ]);
  const [tailorInventory, setTailorInventory] = useState<Material[]>(MOCK_TAILORS[0].inventory || []);

  const login = (role: UserRole, name: string) => {
    const userId = role === UserRole.TAILOR ? 't1' : 'u1';
    
    // Simulate wallet for tailor
    const initialBalance = role === UserRole.TAILOR ? { available: 1250.00, pending: 450.00 } : undefined;

    // Mock initial data for customer profile
    const addresses = role === UserRole.CUSTOMER ? ['123 Main St, Apt 4B, New York, NY', 'Work: 450 5th Ave, New York, NY'] : [];
    const savedMeasurements = role === UserRole.CUSTOMER ? [
        { id: 'm1', name: 'My Regular Fit', date: '2023-08-15', values: { ...INITIAL_MEASUREMENTS, height: 175, weight: 70 } }
    ] : [];

    setUser({
      id: userId,
      name: name,
      email: `${name.toLowerCase().replace(' ', '.')}@example.com`,
      role: role,
      avatar: `https://ui-avatars.com/api/?name=${name}&background=random`,
      loyaltyPoints: role === UserRole.CUSTOMER ? 150 : undefined,
      balance: initialBalance,
      addresses,
      savedMeasurements,
      lookbook: [],
      preferences: { language: 'English', notifications: true }
    });
    setView(role === UserRole.TAILOR ? AppView.TAILOR_DASHBOARD : AppView.CUSTOMER_DASHBOARD);
  };

  const logout = () => {
    setUser(null);
    setView(AppView.LANDING);
    setActiveChatId(null);
    setSelectedMaterial(null);
    setDraftOrder(null);
  };

  const navigate = (newView: AppView) => setView(newView);
  
  const selectTailor = (tailor: Tailor) => {
    const currentTailor = tailors.find(t => t.id === tailor.id) || tailor;
    setActiveTailor(currentTailor);
    setSelectedMaterial(null);
    navigate(AppView.TAILOR_DETAILS);
  };

  const selectMaterial = (material: Material | null) => {
    setSelectedMaterial(material);
  };

  const createDraftOrder = (order: Partial<Order>) => {
    setDraftOrder({
        ...order,
        paymentStatus: PaymentStatus.UNPAID
    });
    navigate(AppView.PAYMENT);
  };

  const completeOrder = (usedPoints: number = 0) => {
    if (draftOrder && draftOrder.id) {
        const finalOrder: Order = {
            ...(draftOrder as Order),
            status: OrderStatus.PENDING,
            paymentStatus: PaymentStatus.HELD_IN_ESCROW
        };
        
        setOrders([finalOrder, ...orders]);
        setDraftOrder(null);
        setSelectedMaterial(null);
        
        if(user) {
            const remainingPoints = (user.loyaltyPoints || 0) - usedPoints;
            setUser({
                ...user, 
                loyaltyPoints: remainingPoints + 50
            });
        }
        
        if(user && user.role === UserRole.TAILOR && user.id === finalOrder.tailorId) {
             setUser({
                 ...user,
                 balance: {
                     available: user.balance?.available || 0,
                     pending: (user.balance?.pending || 0) + finalOrder.amount
                 }
             });
        }

        navigate(AppView.TRACKING);
        addNotification(`Order confirmed! ${usedPoints > 0 ? `Redeemed ${usedPoints} points.` : ''} Earned 50 points.`);
    }
  };

  const addOrder = (order: Order) => {
    setOrders([order, ...orders]);
  };

  const updateOrderStatus = (orderId: string, status: OrderStatus) => {
    setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status } : o));
    addNotification(`Order status updated to: ${status}`);
  };

  const simulateOrderProgress = (orderId: string) => {
    const sequence = [
        OrderStatus.PENDING,
        OrderStatus.MEASUREMENT_SCHEDULED,
        OrderStatus.MATERIAL_PICKUP,
        OrderStatus.IN_PROGRESS,
        OrderStatus.READY_FOR_FITTING,
        OrderStatus.OUT_FOR_DELIVERY,
        OrderStatus.COMPLETED
    ];

    let currentIndex = 0;
    
    const interval = setInterval(() => {
        currentIndex++;
        if (currentIndex >= sequence.length) {
            clearInterval(interval);
            return;
        }

        const newStatus = sequence[currentIndex];
        
        setOrders(prev => prev.map(o => {
            if (o.id === orderId) {
                let riderUpdate = {};
                if (newStatus === OrderStatus.MATERIAL_PICKUP || newStatus === OrderStatus.OUT_FOR_DELIVERY) {
                    riderUpdate = { 
                        rider: { name: 'Mike Johnson', vehicle: 'Yamaha NMAX (Lic: 4421)', phone: '+1 234 567 890' } 
                    };
                }
                return { ...o, status: newStatus, ...riderUpdate };
            }
            return o;
        }));
        
        if (newStatus === OrderStatus.MATERIAL_PICKUP) addNotification("Rider assigned for pickup");
        if (newStatus === OrderStatus.OUT_FOR_DELIVERY) addNotification("Order is out for delivery");
        
    }, 2000); 
  };

  const releaseEscrow = (orderId: string) => {
      const order = orders.find(o => o.id === orderId);
      if (!order) return;
      if (order.paymentStatus === PaymentStatus.RELEASED) {
          addNotification("Funds already released.");
          return;
      }

      setOrders(prev => prev.map(o => o.id === orderId ? { ...o, paymentStatus: PaymentStatus.RELEASED } : o));

      if (user && user.role === UserRole.TAILOR && user.id === order.tailorId) {
          setUser({
              ...user,
              balance: {
                  available: (user.balance?.available || 0) + order.amount,
                  pending: Math.max(0, (user.balance?.pending || 0) - order.amount)
              }
          });
      }

      addNotification("Payment released to Tailor's wallet.");
  };

  const bookAppointment = (apt: Partial<Appointment>) => {
    if (!user || !activeTailor) return;
    const newApt: Appointment = {
        id: `apt-${Date.now()}`,
        tailorId: activeTailor.id,
        tailorName: activeTailor.businessName,
        customerId: user.id,
        customerName: user.name,
        date: apt.date || '',
        time: apt.time || '',
        type: apt.type || 'MEASUREMENT',
        status: 'CONFIRMED'
    };
    setAppointments([...appointments, newApt]);
    addNotification("Appointment booked successfully!");
    navigate(AppView.CUSTOMER_DASHBOARD);
  };

  const addNotification = (msg: string) => {
    setNotifications(prev => [msg, ...prev]);
    setTimeout(() => {
        setNotifications(prev => prev.filter(n => n !== msg));
    }, 5000);
  };

  const openChat = (participantId: string, participantName: string) => {
    if (!user) return;
    
    let chat = chats.find(c => c.participants.includes(user.id) && c.participants.includes(participantId));
    
    if (!chat) {
        const newChat: Chat = {
            id: `c-${Date.now()}`,
            participants: [user.id, participantId],
            participantNames: {
                [user.id]: 'Me',
                [participantId]: participantName
            },
            messages: [],
            unreadCount: 0
        };
        setChats(prev => [newChat, ...prev]);
        chat = newChat;
    }
    
    setActiveChatId(chat.id);
    navigate(AppView.CHAT);
  };

  const closeActiveChat = () => {
      setActiveChatId(null);
  };

  const sendMessage = (text: string) => {
    if (!user || !activeChatId || !text.trim()) return;

    const newMessage = {
        id: `m-${Date.now()}`,
        senderId: user.id,
        text: text,
        timestamp: new Date().toISOString()
    };

    setChats(prev => prev.map(c => {
        if (c.id === activeChatId) {
            return {
                ...c,
                messages: [...c.messages, newMessage],
                lastMessage: text
            };
        }
        return c;
    }));
  };

  const addInventoryItem = (item: Partial<Material>) => {
    const newItem: Material = {
        id: `mat-${Date.now()}`,
        name: item.name || 'New Fabric',
        type: item.type || 'Cotton',
        color: item.color || 'White',
        pricePerMeter: item.pricePerMeter || 0,
        image: item.image || 'https://via.placeholder.com/150',
        inStock: true
    };
    setTailorInventory([newItem, ...tailorInventory]);
    addNotification("Material added to inventory.");
  };

  const addReview = (tailorId: string, rating: number, comment: string) => {
      if (!user) return;

      const newReview: Review = {
          id: `r-${Date.now()}`,
          customerId: user.id,
          customerName: user.name,
          rating,
          comment,
          date: new Date().toISOString().split('T')[0]
      };

      setTailors(prev => prev.map(t => {
          if (t.id === tailorId) {
              const reviews = t.reviewsList ? [...t.reviewsList, newReview] : [newReview];
              const totalRating = reviews.reduce((acc, curr) => acc + curr.rating, 0);
              const newAverage = Number((totalRating / reviews.length).toFixed(1));
              return {
                  ...t,
                  reviewsList: reviews,
                  reviews: reviews.length,
                  rating: newAverage
              };
          }
          return t;
      }));
      
      if (activeTailor && activeTailor.id === tailorId) {
          setActiveTailor(prev => {
              if(!prev) return null;
              const reviews = prev.reviewsList ? [...prev.reviewsList, newReview] : [newReview];
              const totalRating = reviews.reduce((acc, curr) => acc + curr.rating, 0);
              const newAverage = Number((totalRating / reviews.length).toFixed(1));
              return { ...prev, reviewsList: reviews, reviews: reviews.length, rating: newAverage };
          });
      }

      addNotification("Thank you! Your review has been submitted.");
  };

  const updatePortfolio = (action: 'add' | 'remove', imageUrl: string) => {
      if (!user || user.role !== UserRole.TAILOR) return;

      setTailors(prev => prev.map(t => {
          if (t.id === user.id) {
              const currentPortfolio = t.portfolio || [];
              let newPortfolio = [...currentPortfolio];
              if (action === 'add') {
                  newPortfolio.push(imageUrl);
              } else {
                  newPortfolio = newPortfolio.filter(img => img !== imageUrl);
              }
              return { ...t, portfolio: newPortfolio };
          }
          return t;
      }));
      addNotification(action === 'add' ? "Image added to portfolio" : "Image removed from portfolio");
  };

  const addAddress = (address: string) => {
      if (!user) return;
      const currentAddresses = user.addresses || [];
      setUser({ ...user, addresses: [...currentAddresses, address] });
      addNotification("Address added successfully.");
  };

  const removeAddress = (address: string) => {
      if (!user) return;
      const currentAddresses = user.addresses || [];
      setUser({ ...user, addresses: currentAddresses.filter(a => a !== address) });
      addNotification("Address removed.");
  };

  const saveMeasurementProfile = (name: string, values: any) => {
      if (!user) return;
      const newProfile: MeasurementProfile = {
          id: `mp-${Date.now()}`,
          name,
          date: new Date().toISOString().split('T')[0],
          values
      };
      const currentProfiles = user.savedMeasurements || [];
      setUser({ ...user, savedMeasurements: [...currentProfiles, newProfile] });
      addNotification("Measurement profile saved!");
  };

  const deleteMeasurementProfile = (id: string) => {
      if (!user) return;
      const currentProfiles = user.savedMeasurements || [];
      setUser({ ...user, savedMeasurements: currentProfiles.filter(p => p.id !== id) });
      addNotification("Measurement profile deleted.");
  };

  const saveLook = (look: Look) => {
      if (!user) return;
      const newLookbook = [look, ...(user.lookbook || [])];
      setUser({ ...user, lookbook: newLookbook });
      addNotification("Look saved to your Lookbook.");
  };

  const deleteLook = (id: string) => {
      if (!user) return;
      const newLookbook = (user.lookbook || []).filter(l => l.id !== id);
      setUser({ ...user, lookbook: newLookbook });
      addNotification("Look deleted.");
  };

  return React.createElement(
    AppContext.Provider,
    {
      value: { 
        user, view, activeTailor, tailors, orders, notifications, chats, activeChatId, selectedMaterial, draftOrder, appointments, tailorInventory,
        login, logout, navigate, selectTailor, selectMaterial, createDraftOrder, completeOrder, addOrder, updateOrderStatus, simulateOrderProgress, addNotification, sendMessage, openChat, closeActiveChat, bookAppointment, addInventoryItem, addReview, releaseEscrow, updatePortfolio,
        addAddress, removeAddress, saveMeasurementProfile, deleteMeasurementProfile, saveLook, deleteLook
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