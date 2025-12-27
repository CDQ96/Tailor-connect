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
  TRACKING = 'TRACKING'
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar?: string;
}

export interface Tailor {
  id: string;
  name: string;
  businessName: string;
  specialties: string[];
  rating: number;
  reviews: number;
  location: string;
  distance?: string;
  image: string;
  portfolio: string[];
  pricing: {
    base: number;
    currency: string;
  };
  materialsAvailable: boolean;
}

export interface MeasurementProfile {
  id: string;
  name: string;
  height: number;
  weight: number;
  neck?: number;
  chest?: number;
  waist?: number;
  hips?: number;
  inseam?: number;
  sleeve?: number;
  notes?: string;
}

export interface Order {
  id: string;
  tailorId: string;
  tailorName: string;
  service: string;
  status: OrderStatus;
  date: string;
  amount: number;
  thumbnail: string;
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