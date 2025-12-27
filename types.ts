export enum UserRole {
  CUSTOMER = 'CUSTOMER',
  TAILOR = 'TAILOR',
  GUEST = 'GUEST'
}

export enum AppView {
  LANDING = 'LANDING',
  AUTH = 'AUTH',
  CUSTOMER_DASHBOARD = 'CUSTOMER_DASHBOARD',
  TAILOR_DASHBOARD = 'TAILOR_DASHBOARD',
  TAILOR_DETAILS = 'TAILOR_DETAILS',
  MEASUREMENT = 'MEASUREMENT',
  ORDER_FLOW = 'ORDER_FLOW',
  TRACKING = 'TRACKING',
  CHAT = 'CHAT',
  PAYMENT = 'PAYMENT',
  APPOINTMENTS = 'APPOINTMENTS',
  PROFILE = 'PROFILE',
  LIVE_STYLIST = 'LIVE_STYLIST',
  VIRTUAL_FITTING = 'VIRTUAL_FITTING',
  FABRIC_SCANNER = 'FABRIC_SCANNER'
}

export interface MeasurementProfile {
  id: string;
  name: string;
  date: string;
  values: {
      neck?: number;
      chest?: number;
      waist?: number;
      hips?: number;
      inseam?: number;
      sleeve?: number;
      shoulder?: number;
      height?: number;
      weight?: number;
      [key: string]: number | undefined;
  };
}

export interface Look {
  id: string;
  imageUrl: string;
  date: string;
  description: string;
  fabricName?: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar?: string;
  loyaltyPoints?: number;
  addresses?: string[];
  savedMeasurements?: MeasurementProfile[];
  lookbook?: Look[];
  preferences?: {
      language: string;
      notifications: boolean;
  };
  // Wallet for tailors
  balance?: {
    available: number;
    pending: number;
  };
}

export interface Material {
  id: string;
  name: string;
  type: string;
  color: string;
  pricePerMeter: number;
  image: string;
  inStock: boolean;
}

export interface Review {
  id: string;
  customerId: string;
  customerName: string;
  rating: number;
  comment: string;
  date: string;
}

export interface Tailor {
  id: string;
  name: string;
  businessName: string;
  specialties: string[];
  rating: number;
  reviews: number; // count
  reviewsList?: Review[]; // Actual review data
  location: string;
  distance?: string;
  image: string;
  portfolio: string[];
  pricing: {
    base: number;
    currency: string;
  };
  materialsAvailable: boolean;
  inventory?: Material[];
  // Wallet simulation for tailors found in search/mock
  balance?: {
      available: number;
      pending: number;
  };
}

export interface OrderPricing {
  service: number;
  material: number;
  delivery: number;
  platform: number;
  discount?: number;
  total: number;
}

export interface Appointment {
  id: string;
  tailorId: string;
  tailorName: string;
  customerId: string;
  customerName: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:MM
  type: 'MEASUREMENT' | 'FITTING' | 'CONSULTATION';
  status: 'CONFIRMED' | 'COMPLETED' | 'CANCELLED';
}

export enum PaymentStatus {
    UNPAID = 'UNPAID',
    HELD_IN_ESCROW = 'HELD_IN_ESCROW',
    RELEASED = 'RELEASED',
    REFUNDED = 'REFUNDED'
}

export interface Order {
  id: string;
  tailorId: string;
  tailorName: string;
  service: string;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  date: string;
  amount: number;
  thumbnail: string;
  customerName?: string;
  measurements?: any;
  materialId?: string;
  materialName?: string;
  pricing?: OrderPricing;
  rider?: {
    name: string;
    vehicle: string;
    phone: string;
  };
}

export enum OrderStatus {
  PENDING = 'Pending Approval',
  MEASUREMENT_SCHEDULED = 'Measurement Scheduled',
  MATERIAL_PICKUP = 'Material Pickup',
  IN_PROGRESS = 'In Progress',
  READY_FOR_FITTING = 'Ready for Fitting',
  OUT_FOR_DELIVERY = 'Out for Delivery',
  COMPLETED = 'Completed'
}

export interface GroundingChunk {
  web?: {
    uri: string;
    title: string;
  };
  maps?: {
    placeId: string;
    title: string;
    uri: string;
  };
}

export interface Message {
  id: string;
  senderId: string;
  text: string;
  timestamp: string;
}

export interface Chat {
  id: string;
  participants: string[]; // User IDs
  participantNames: Record<string, string>; // Map ID to Name for easy display
  messages: Message[];
  lastMessage?: string;
  unreadCount: number;
}