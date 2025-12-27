import { Order, OrderStatus, Tailor, UserRole } from './types';

export const MOCK_TAILORS: Tailor[] = [
  {
    id: 't1',
    name: 'Elena Rossi',
    businessName: 'Rossi Couture',
    specialties: ['Wedding Dresses', 'Evening Gowns', 'Alterations'],
    rating: 4.9,
    reviews: 124,
    location: '12 Fashion Ave, Downtown',
    distance: '1.2 km',
    image: 'https://picsum.photos/400/400?random=1',
    portfolio: [
      'https://picsum.photos/300/400?random=10',
      'https://picsum.photos/300/400?random=11',
      'https://picsum.photos/300/400?random=12'
    ],
    pricing: { base: 150, currency: '$' },
    materialsAvailable: true
  },
  {
    id: 't2',
    name: 'Marcus Thorne',
    businessName: 'Thorne Bespoke Suits',
    specialties: ['Men\'s Suits', 'Tuxedos', 'Shirts'],
    rating: 4.8,
    reviews: 89,
    location: '45 Savile Row, West End',
    distance: '3.5 km',
    image: 'https://picsum.photos/400/400?random=2',
    portfolio: [
      'https://picsum.photos/300/400?random=20',
      'https://picsum.photos/300/400?random=21'
    ],
    pricing: { base: 300, currency: '$' },
    materialsAvailable: true
  },
  {
    id: 't3',
    name: 'Sarah Jenkins',
    businessName: 'Quick Stitch & Hem',
    specialties: ['Alterations', 'Repairs', 'Casual Wear'],
    rating: 4.5,
    reviews: 210,
    location: '88 Market St',
    distance: '0.8 km',
    image: 'https://picsum.photos/400/400?random=3',
    portfolio: [
      'https://picsum.photos/300/400?random=30'
    ],
    pricing: { base: 20, currency: '$' },
    materialsAvailable: false
  }
];

export const MOCK_ORDERS: Order[] = [
  {
    id: 'ord-001',
    tailorId: 't1',
    tailorName: 'Rossi Couture',
    service: 'Custom Evening Gown',
    status: OrderStatus.IN_PROGRESS,
    date: '2023-10-15',
    amount: 450,
    thumbnail: 'https://picsum.photos/100/100?random=10'
  },
  {
    id: 'ord-002',
    tailorId: 't2',
    tailorName: 'Thorne Bespoke Suits',
    service: 'Charcoal Grey Suit',
    status: OrderStatus.READY_FOR_FITTING,
    date: '2023-10-01',
    amount: 850,
    thumbnail: 'https://picsum.photos/100/100?random=20'
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