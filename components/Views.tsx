import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../store';
import { AppView, UserRole, OrderStatus, Tailor } from '../types';
import { MOCK_TAILORS } from '../constants';
import { Button, Input, Card, Badge } from './UI';
import { searchTailorsNearby, analyzeBodyMeasurement, getSmartSizingAdvice } from '../services/gemini';

// --- Landing View ---
export const LandingView = () => {
  const { navigate } = useApp();
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6 max-w-3xl leading-tight">
        Bespoke Tailoring,<br/> <span className="text-indigo-600">Delivered to You.</span>
      </h1>
      <p className="text-xl text-gray-600 mb-10 max-w-2xl">
        Connect with expert local artisans. Get perfectly fitted clothes with AI-powered sizing and seamless delivery.
      </p>
      <div className="flex gap-4">
        <Button onClick={() => navigate(AppView.AUTH)} className="text-lg px-8 py-4">Find a Tailor</Button>
        <Button onClick={() => navigate(AppView.AUTH)} variant="secondary" className="text-lg px-8 py-4">Become a Partner</Button>
      </div>
      
      <div className="mt-20 grid grid-cols-1 md:grid-cols-3 gap-8 w-full">
        {[
            { icon: 'fa-ruler-combined', title: 'AI Measurements', text: 'Get measured instantly using your camera.' },
            { icon: 'fa-map-marker-alt', title: 'Local Experts', text: 'Find top-rated tailors in your neighborhood.' },
            { icon: 'fa-shipping-fast', title: 'Secure Delivery', text: 'Track your materials and finished garments.' }
        ].map((feat, i) => (
            <Card key={i} className="flex flex-col items-center text-center">
                <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center text-xl mb-4">
                    <i className={`fas ${feat.icon}`}></i>
                </div>
                <h3 className="text-lg font-bold mb-2">{feat.title}</h3>
                <p className="text-gray-500">{feat.text}</p>
            </Card>
        ))}
      </div>
    </div>
  );
};

// --- Auth View ---
export const AuthView = () => {
  const { login } = useApp();
  const [isRegister, setIsRegister] = useState(false);
  const [role, setRole] = useState<UserRole>(UserRole.CUSTOMER);
  const [name, setName] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if(name) login(role, name);
  };

  return (
    <div className="max-w-md mx-auto mt-10">
      <Card>
        <div className="text-center mb-8">
            <h2 className="text-2xl font-bold">{isRegister ? 'Create Account' : 'Welcome Back'}</h2>
            <p className="text-gray-500 text-sm mt-1">Access your dashboard</p>
        </div>
        
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <Input label="Full Name" value={name} onChange={(e: any) => setName(e.target.value)} placeholder="John Doe" />
          <Input label="Email Address" type="email" placeholder="john@example.com" />
          <Input label="Password" type="password" placeholder="••••••••" />
          
          <div className="flex gap-4 my-2">
            <label className={`flex-1 p-3 border rounded-lg cursor-pointer text-center transition-all ${role === UserRole.CUSTOMER ? 'bg-indigo-50 border-indigo-500 text-indigo-700' : 'border-gray-200'}`}>
                <input type="radio" className="hidden" name="role" checked={role === UserRole.CUSTOMER} onChange={() => setRole(UserRole.CUSTOMER)} />
                <i className="fas fa-user mr-2"></i> Customer
            </label>
            <label className={`flex-1 p-3 border rounded-lg cursor-pointer text-center transition-all ${role === UserRole.TAILOR ? 'bg-indigo-50 border-indigo-500 text-indigo-700' : 'border-gray-200'}`}>
                <input type="radio" className="hidden" name="role" checked={role === UserRole.TAILOR} onChange={() => setRole(UserRole.TAILOR)} />
                <i className="fas fa-cut mr-2"></i> Tailor
            </label>
          </div>

          <Button type="submit" className="w-full mt-2">{isRegister ? 'Sign Up' : 'Log In'}</Button>
        </form>
        
        <div className="mt-6 text-center text-sm text-gray-500">
            {isRegister ? 'Already have an account? ' : "Don't have an account? "}
            <button onClick={() => setIsRegister(!isRegister)} className="text-indigo-600 font-semibold hover:underline">
                {isRegister ? 'Log In' : 'Sign Up'}
            </button>
        </div>
      </Card>
    </div>
  );
};

// --- Customer Dashboard ---
export const CustomerDashboard = () => {
  const { selectTailor } = useApp();
  const [search, setSearch] = useState('');
  const [location, setLocation] = useState<{lat: number, lng: number} | null>(null);
  const [loading, setLoading] = useState(false);
  const [groundingResults, setGroundingResults] = useState<any[]>([]);

  // Get location on mount
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        (err) => console.log("Loc error", err)
      );
    }
  }, []);

  const handleSearch = async () => {
    if (!location) {
        // Fallback for demo if geolocation blocked
        console.warn("Location not available, using default");
        // Don't return, just don't do real map search or mock it
    }
    setLoading(true);
    // Simulate API delay or fetch real map data
    if (location && search) {
        const results = await searchTailorsNearby(search, location.lat, location.lng);
        setGroundingResults(results.grounding || []);
    }
    setTimeout(() => setLoading(false), 800);
  };

  const filteredTailors = MOCK_TAILORS.filter(t => 
    t.name.toLowerCase().includes(search.toLowerCase()) || 
    t.specialties.some(s => s.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="space-y-8">
      <div className="bg-gray-900 text-white p-8 rounded-2xl relative overflow-hidden">
        <div className="relative z-10 max-w-2xl">
            <h2 className="text-3xl font-bold font-serif mb-4">Find Your Perfect Fit</h2>
            <div className="flex gap-2">
                <input 
                    type="text" 
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search for suits, dresses, alterations..." 
                    className="flex-1 px-4 py-3 rounded-lg text-gray-900 outline-none"
                    onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                />
                <Button onClick={handleSearch} variant="accent" className="px-8">
                    {loading ? <i className="fas fa-spinner fa-spin"></i> : <i className="fas fa-search"></i>}
                </Button>
            </div>
            {location && <p className="text-xs text-gray-400 mt-2"><i className="fas fa-map-marker-alt"></i> Using your current location</p>}
        </div>
        <div className="absolute right-0 top-0 h-full w-1/3 bg-gradient-to-l from-indigo-900 to-transparent opacity-50"></div>
      </div>

      {groundingResults.length > 0 && (
         <div className="mb-8">
            <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                <i className="fab fa-google text-blue-500"></i> Places near you
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {groundingResults.map((place: any, idx) => (
                    place.maps && (
                        <a href={place.maps.uri} target="_blank" rel="noreferrer" key={idx} className="block group">
                            <Card className="h-full hover:border-indigo-200 transition-colors">
                                <h4 className="font-bold group-hover:text-indigo-600 truncate">{place.maps.title}</h4>
                                <p className="text-xs text-gray-500 mt-1">View on Maps <i className="fas fa-external-link-alt ml-1"></i></p>
                            </Card>
                        </a>
                    )
                ))}
            </div>
         </div>
      )}

      <div>
        <h3 className="text-xl font-bold mb-6">Top Rated Tailors</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredTailors.map(tailor => (
                <Card key={tailor.id} className="p-0 overflow-hidden hover:shadow-lg transition-all group">
                    <div className="h-48 overflow-hidden relative">
                        <img src={tailor.image} alt={tailor.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                        <div className="absolute top-3 right-3 bg-white px-2 py-1 rounded text-xs font-bold shadow">
                            <i className="fas fa-star text-yellow-400"></i> {tailor.rating}
                        </div>
                    </div>
                    <div className="p-5">
                        <div className="flex justify-between items-start mb-2">
                            <div>
                                <h4 className="text-lg font-bold">{tailor.businessName}</h4>
                                <p className="text-sm text-gray-500"><i className="fas fa-map-pin mr-1"></i> {tailor.location} ({tailor.distance})</p>
                            </div>
                        </div>
                        <div className="flex flex-wrap gap-2 mb-4">
                            {tailor.specialties.map(s => <span key={s} className="text-xs bg-gray-100 px-2 py-1 rounded text-gray-600">{s}</span>)}
                        </div>
                        <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100">
                             <div className="text-sm font-medium">Starts at {tailor.pricing.currency}{tailor.pricing.base}</div>
                             <Button onClick={() => selectTailor(tailor)} variant="outline" className="text-sm py-1.5 px-4">View Profile</Button>
                        </div>
                    </div>
                </Card>
            ))}
        </div>
      </div>
    </div>
  );
};

// --- Tailor Details & Booking ---
export const TailorDetails = () => {
    const { activeTailor, navigate, addNotification } = useApp();
    
    if (!activeTailor) return <div>Loading...</div>;

    const handleBook = () => {
        // In real app, this would create a draft order
        navigate(AppView.MEASUREMENT);
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-8">
                <Card className="p-0 overflow-hidden">
                    <img src={activeTailor.image} alt="Cover" className="w-full h-64 object-cover" />
                    <div className="p-8">
                        <div className="flex justify-between items-start">
                             <div>
                                <h1 className="text-3xl font-bold font-serif mb-2">{activeTailor.businessName}</h1>
                                <p className="text-lg text-gray-600 mb-4">Run by {activeTailor.name}</p>
                                <div className="flex items-center gap-4 text-sm text-gray-500">
                                    <span><i className="fas fa-star text-yellow-400"></i> {activeTailor.rating} ({activeTailor.reviews} reviews)</span>
                                    <span><i className="fas fa-map-marker-alt"></i> {activeTailor.location}</span>
                                </div>
                             </div>
                             <Badge type="success">Verified Partner</Badge>
                        </div>
                    </div>
                </Card>

                <div>
                    <h3 className="text-xl font-bold mb-4">Portfolio</h3>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        {activeTailor.portfolio.map((img, i) => (
                            <img key={i} src={img} alt="Portfolio" className="rounded-lg hover:opacity-90 cursor-pointer h-48 w-full object-cover" />
                        ))}
                    </div>
                </div>
            </div>

            <div className="space-y-6">
                <Card className="sticky top-24">
                    <h3 className="text-xl font-bold mb-6">Book Service</h3>
                    
                    <div className="space-y-4 mb-6">
                        <div className="p-3 border border-indigo-200 bg-indigo-50 rounded-lg cursor-pointer flex justify-between items-center">
                            <span className="font-medium">Custom Tailoring</span>
                            <span className="font-bold text-indigo-700">From ${activeTailor.pricing.base}</span>
                        </div>
                        <div className="p-3 border border-gray-200 rounded-lg cursor-pointer flex justify-between items-center opacity-60 hover:opacity-100">
                            <span className="font-medium">Alterations</span>
                            <span className="font-bold text-gray-700">From $20</span>
                        </div>
                    </div>

                    <div className="mb-6">
                        <h4 className="font-semibold mb-2 text-sm">Materials</h4>
                        <label className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                            <input type="radio" name="material" defaultChecked />
                            I will provide my own fabric
                        </label>
                        {activeTailor.materialsAvailable && (
                            <label className="flex items-center gap-2 text-sm text-gray-600">
                                <input type="radio" name="material" />
                                Buy fabric from tailor
                            </label>
                        )}
                    </div>

                    <Button onClick={handleBook} className="w-full py-3">Continue to Measurements</Button>
                    <p className="text-xs text-center text-gray-400 mt-4">Secure payment held in escrow until completion.</p>
                </Card>
            </div>
        </div>
    );
};

// --- Measurement View with AI ---
export const MeasurementView = () => {
    const { navigate, addNotification, addOrder, activeTailor } = useApp();
    const [mode, setMode] = useState<'manual' | 'ai'>('ai');
    const [image, setImage] = useState<File | null>(null);
    const [preview, setPreview] = useState<string>('');
    const [loading, setLoading] = useState(false);
    const [stats, setStats] = useState({ height: '', weight: '' });
    const [measurements, setMeasurements] = useState<any>({
        neck: '', chest: '', waist: '', hips: '', inseam: '', sleeve: '', shoulder: ''
    });

    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            setImage(file);
            setPreview(URL.createObjectURL(file));
        }
    };

    const runAnalysis = async () => {
        if (!image || !stats.height || !stats.weight) {
            addNotification("Please provide photo, height and weight.");
            return;
        }
        setLoading(true);
        try {
            const results = await analyzeBodyMeasurement(image, stats.height, stats.weight);
            if(results) {
                setMeasurements({ ...measurements, ...results });
                addNotification("AI Analysis Complete! Please verify measurements.");
            }
        } catch (e) {
            addNotification("Failed to analyze image. Please try again or use manual mode.");
        }
        setLoading(false);
    };

    const confirmOrder = () => {
        if(!activeTailor) return;
        
        const newOrder: any = {
            id: `ord-${Date.now()}`,
            tailorId: activeTailor.id,
            tailorName: activeTailor.businessName,
            service: 'Custom Order',
            status: OrderStatus.PENDING,
            date: new Date().toISOString().split('T')[0],
            amount: activeTailor.pricing.base,
            thumbnail: activeTailor.portfolio[0]
        };
        addOrder(newOrder);
        addNotification("Order placed successfully!");
        navigate(AppView.TRACKING);
    };

    return (
        <div className="max-w-4xl mx-auto">
            <div className="mb-8 text-center">
                <h2 className="text-3xl font-bold font-serif mb-2">Measurements</h2>
                <p className="text-gray-500">Choose how you want to provide your measurements</p>
            </div>

            <div className="flex justify-center gap-4 mb-8">
                <Button onClick={() => setMode('ai')} variant={mode === 'ai' ? 'primary' : 'secondary'}>
                    <i className="fas fa-magic mr-2"></i> AI Assistant
                </Button>
                <Button onClick={() => setMode('manual')} variant={mode === 'manual' ? 'primary' : 'secondary'}>
                    <i className="fas fa-ruler mr-2"></i> Manual Input
                </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {mode === 'ai' && (
                    <Card className="flex flex-col items-center justify-center text-center p-8 border-dashed border-2 border-indigo-100 bg-indigo-50/30">
                        {preview ? (
                            <div className="relative w-full h-64 mb-4">
                                <img src={preview} alt="Upload" className="w-full h-full object-contain rounded-lg" />
                                <button onClick={() => {setImage(null); setPreview('');}} className="absolute top-2 right-2 bg-white rounded-full p-2 shadow hover:bg-red-50 text-red-500">
                                    <i className="fas fa-trash"></i>
                                </button>
                            </div>
                        ) : (
                            <div onClick={() => fileInputRef.current?.click()} className="cursor-pointer py-12 w-full">
                                <div className="w-16 h-16 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center text-2xl mb-4 mx-auto">
                                    <i className="fas fa-camera"></i>
                                </div>
                                <h4 className="font-bold text-gray-900">Upload Full Body Photo</h4>
                                <p className="text-sm text-gray-500 mt-2">Stand straight against a plain wall.</p>
                                <input type="file" ref={fileInputRef} onChange={handleImageUpload} className="hidden" accept="image/*" />
                            </div>
                        )}
                        
                        <div className="grid grid-cols-2 gap-4 w-full mt-4">
                            <Input label="Height (cm)" type="number" value={stats.height} onChange={(e: any) => setStats({...stats, height: e.target.value})} placeholder="175" />
                            <Input label="Weight (kg)" type="number" value={stats.weight} onChange={(e: any) => setStats({...stats, weight: e.target.value})} placeholder="70" />
                        </div>

                        <Button onClick={runAnalysis} disabled={loading || !image} className="w-full mt-6" variant="accent">
                            {loading ? 'Analyzing...' : 'Generate Measurements'}
                        </Button>
                    </Card>
                )}
                {mode === 'manual' && (
                    <Card className="flex flex-col items-center justify-center text-center p-8 bg-gray-50">
                        <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mb-4">
                            <i className="fas fa-video text-gray-500 text-xl"></i>
                        </div>
                        <h4 className="font-bold text-gray-900 mb-2">Video Call with Tailor</h4>
                        <p className="text-sm text-gray-600 mb-6">Schedule a 15-min session where the tailor guides you.</p>
                        <Button variant="outline" className="w-full">Schedule Session</Button>
                    </Card>
                )}

                <Card>
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="font-bold text-lg">Your Measurements</h3>
                        <span className="text-xs text-gray-400">In centimeters (cm)</span>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        {Object.keys(measurements).map(key => (
                            <div key={key}>
                                <label className="text-xs font-semibold text-gray-600 uppercase mb-1 block">{key}</label>
                                <input 
                                    type="number" 
                                    value={measurements[key]} 
                                    onChange={(e) => setMeasurements({...measurements, [key]: Number(e.target.value)})}
                                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-1 focus:ring-indigo-500 outline-none" 
                                />
                            </div>
                        ))}
                    </div>
                    <div className="mt-8 pt-6 border-t border-gray-100">
                        <Button onClick={confirmOrder} className="w-full text-lg font-semibold py-3">
                            Confirm & Pay
                        </Button>
                    </div>
                </Card>
            </div>
        </div>
    );
};

// --- Tracking View ---
export const TrackingView = () => {
    const { orders } = useApp();

    return (
        <div className="max-w-3xl mx-auto">
            <h2 className="text-2xl font-bold font-serif mb-8">Your Orders</h2>
            
            <div className="space-y-6">
                {orders.map(order => (
                    <Card key={order.id} className="hover:shadow-md transition-shadow">
                        <div className="flex gap-6">
                            <img src={order.thumbnail} alt="Item" className="w-24 h-24 object-cover rounded-lg bg-gray-100" />
                            <div className="flex-1">
                                <div className="flex justify-between items-start mb-2">
                                    <div>
                                        <h3 className="font-bold text-lg">{order.service}</h3>
                                        <p className="text-sm text-gray-500">by {order.tailorName}</p>
                                    </div>
                                    <Badge type={order.status === OrderStatus.COMPLETED ? 'success' : 'info'}>{order.status}</Badge>
                                </div>
                                
                                <div className="mt-4 relative pt-4">
                                    <div className="absolute top-0 left-0 w-full h-1 bg-gray-100 rounded-full overflow-hidden">
                                        <div 
                                            className="h-full bg-indigo-600 rounded-full" 
                                            style={{width: order.status === OrderStatus.COMPLETED ? '100%' : '60%'}}
                                        ></div>
                                    </div>
                                    <div className="flex justify-between text-xs text-gray-400 mt-2">
                                        <span>Ordered</span>
                                        <span>Processing</span>
                                        <span>Delivery</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </Card>
                ))}
            </div>
        </div>
    );
};