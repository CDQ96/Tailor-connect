import { Order, OrderStatus, Tailor, UserRole, Chat, Material, Review, PaymentStatus } from './types';

const COMMON_MATERIALS: Material[] = [
  {
    id: 'mat-001',
    name: 'Italian Merino Wool',
    type: 'Wool',
    color: 'Navy Blue',
    pricePerMeter: 45,
    image: 'https://images.unsplash.com/photo-1621252179027-94459d27d3ee?auto=format&fit=crop&w=150&q=80',
    inStock: true
  },
  {
    id: 'mat-002',
    name: 'Charcoal Worsted',
    type: 'Wool Blend',
    color: 'Charcoal',
    pricePerMeter: 38,
    image: 'https://images.unsplash.com/photo-1596356453261-0d265ae2520a?auto=format&fit=crop&w=150&q=80',
    inStock: true
  },
  {
    id: 'mat-003',
    name: 'Pure Silk Charmeuse',
    type: 'Silk',
    color: 'Emerald Green',
    pricePerMeter: 65,
    image: 'https://images.unsplash.com/photo-1616606103915-dea7be788566?auto=format&fit=crop&w=150&q=80',
    inStock: true
  },
  {
    id: 'mat-004',
    name: 'Egyptian Cotton',
    type: 'Cotton',
    color: 'Crisp White',
    pricePerMeter: 25,
    image: 'https://images.unsplash.com/photo-1598532163257-ae3c6b2524b6?auto=format&fit=crop&w=150&q=80',
    inStock: true
  }
];

const MOCK_REVIEWS: Review[] = [
    { id: 'r1', customerId: 'u2', customerName: 'Sarah M.', rating: 5, comment: 'Absolutely stunning work! The fit is perfect.', date: '2023-09-15' },
    { id: 'r2', customerId: 'u3', customerName: 'David K.', rating: 4, comment: 'Great quality materials, took a bit longer than expected but worth it.', date: '2023-09-10' },
    { id: 'r3', customerId: 'u4', customerName: 'Emily R.', rating: 5, comment: 'Elena is a magician with fabric. Highly recommended for wedding alterations.', date: '2023-08-22' }
];

export const MOCK_TAILORS: Tailor[] = [
  {
    id: 't1',
    name: 'Elena Rossi',
    businessName: 'Rossi Couture',
    specialties: ['Wedding Dresses', 'Evening Gowns', 'Alterations'],
    rating: 4.9,
    reviews: 124,
    reviewsList: MOCK_REVIEWS,
    location: '12 Fashion Ave, Downtown',
    distance: '1.2 km',
    image: 'https://picsum.photos/400/400?random=1',
    portfolio: [
      'https://picsum.photos/300/400?random=10',
      'https://picsum.photos/300/400?random=11',
      'https://picsum.photos/300/400?random=12'
    ],
    pricing: { base: 150, currency: '$' },
    materialsAvailable: true,
    inventory: [COMMON_MATERIALS[2], COMMON_MATERIALS[3]]
  },
  {
    id: 't2',
    name: 'Marcus Thorne',
    businessName: 'Thorne Bespoke Suits',
    specialties: ['Men\'s Suits', 'Tuxedos', 'Shirts'],
    rating: 4.8,
    reviews: 89,
    reviewsList: [MOCK_REVIEWS[1]],
    location: '45 Savile Row, West End',
    distance: '3.5 km',
    image: 'https://picsum.photos/400/400?random=2',
    portfolio: [
      'https://picsum.photos/300/400?random=20',
      'https://picsum.photos/300/400?random=21'
    ],
    pricing: { base: 300, currency: '$' },
    materialsAvailable: true,
    inventory: [COMMON_MATERIALS[0], COMMON_MATERIALS[1], COMMON_MATERIALS[3]]
  },
  {
    id: 't3',
    name: 'Sarah Jenkins',
    businessName: 'Quick Stitch & Hem',
    specialties: ['Alterations', 'Repairs', 'Casual Wear'],
    rating: 4.5,
    reviews: 210,
    reviewsList: [],
    location: '88 Market St',
    distance: '0.8 km',
    image: 'https://picsum.photos/400/400?random=3',
    portfolio: [
      'https://picsum.photos/300/400?random=30'
    ],
    pricing: { base: 20, currency: '$' },
    materialsAvailable: false,
    inventory: []
  }
];

export const MOCK_ORDERS: Order[] = [
  {
    id: 'ord-001',
    tailorId: 't1',
    tailorName: 'Rossi Couture',
    service: 'Custom Evening Gown',
    status: OrderStatus.IN_PROGRESS,
    paymentStatus: PaymentStatus.HELD_IN_ESCROW,
    date: '2023-10-15',
    amount: 450,
    thumbnail: 'https://picsum.photos/100/100?random=10',
    customerName: 'Alice Freeman',
    measurements: {
        height: 170,
        bust: 90,
        waist: 70,
        hips: 95
    },
    materialName: 'Pure Silk Charmeuse'
  },
  {
    id: 'ord-002',
    tailorId: 't2',
    tailorName: 'Thorne Bespoke Suits',
    service: 'Charcoal Grey Suit',
    status: OrderStatus.READY_FOR_FITTING,
    paymentStatus: PaymentStatus.HELD_IN_ESCROW,
    date: '2023-10-01',
    amount: 850,
    thumbnail: 'https://picsum.photos/100/100?random=20',
    customerName: 'James Bond',
    measurements: {
        height: 185,
        chest: 100,
        waist: 85,
        inseam: 82,
        shoulder: 45
    },
    materialName: 'Italian Merino Wool'
  },
  {
    id: 'ord-003',
    tailorId: 't1',
    tailorName: 'Rossi Couture',
    service: 'Summer Dress Alteration',
    status: OrderStatus.PENDING,
    paymentStatus: PaymentStatus.UNPAID,
    date: '2023-10-20',
    amount: 45,
    thumbnail: 'https://picsum.photos/100/100?random=30',
    customerName: 'Sophie Turner',
    measurements: {
        height: 165,
        waist: 68
    }
  }
];

export const INITIAL_MEASUREMENTS = {
  neck: 0,
  chest: 0,
  waist: 0,
  hips: 0,
  inseam: 0,
  sleeve: 0,
  shoulder: 0
};

export const MOCK_CHATS: Chat[] = [
  {
    id: 'c1',
    participants: ['t1', 'u1'], // Tailor 1 and Customer 1
    participantNames: { 't1': 'Rossi Couture', 'u1': 'Me' },
    unreadCount: 1,
    lastMessage: 'When can I come for the fitting?',
    messages: [
      { id: 'm1', senderId: 't1', text: 'Hello! Thanks for your order. I have reviewed your measurements.', timestamp: '2023-10-16T09:00:00Z' },
      { id: 'm2', senderId: 'u1', text: 'Great! Do you need any other details?', timestamp: '2023-10-16T09:05:00Z' },
      { id: 'm3', senderId: 't1', text: 'No, everything looks good. We can schedule a fitting next week.', timestamp: '2023-10-16T09:10:00Z' },
      { id: 'm4', senderId: 'u1', text: 'When can I come for the fitting?', timestamp: '2023-10-16T09:15:00Z' }
    ]
  }
];