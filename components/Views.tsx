import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../store';
import { AppView, UserRole, OrderStatus, Tailor, PaymentStatus, Material, Look, Appointment, GroundingChunk } from '../types';
import { Button, Input, Card, Badge, StarRating, NotificationToast } from './UI';
import { searchTailorsNearby, analyzeBodyMeasurement, getSmartSizingAdvice, generateStylePreview, getChatSuggestions, generateRunwayVideo, analyzeFabric } from '../services/gemini';
import { INITIAL_MEASUREMENTS, MOCK_TAILORS } from '../constants';
import { GoogleGenAI, LiveServerMessage, Modality, Blob } from '@google/genai';

// --- Helpers for Live API ---
function createBlob(data: Float32Array): Blob {
  const l = data.length;
  const int16 = new Int16Array(l);
  for (let i = 0; i < l; i++) {
    int16[i] = data[i] * 32768;
  }
  return {
    data: encode(new Uint8Array(int16.buffer)),
    mimeType: 'audio/pcm;rate=16000',
  };
}

function encode(bytes: Uint8Array) {
  let binary = '';
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

function decode(base64: string) {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

async function decodeAudioData(
  data: Uint8Array,
  ctx: AudioContext,
  sampleRate: number,
  numChannels: number,
): Promise<AudioBuffer> {
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) {
      channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
  }
  return buffer;
}

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
  const { login, addNotification } = useApp();
  const [isRegister, setIsRegister] = useState(false);
  const [role, setRole] = useState<UserRole>(UserRole.CUSTOMER);
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isRegister && password !== confirmPassword) {
        addNotification("Passwords do not match!");
        return;
    }
    if (name && password) login(role, name);
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
          
          <Input 
            label="Password" 
            type={showPassword ? "text" : "password"} 
            value={password} 
            onChange={(e: any) => setPassword(e.target.value)}
            placeholder="••••••••"
            icon={
                <i className={`fas ${showPassword ? 'fa-eye-slash' : 'fa-eye'}`} onClick={() => setShowPassword(!showPassword)}></i>
            }
          />

          {isRegister && (
             <Input 
                label="Confirm Password" 
                type={showPassword ? "text" : "password"} 
                value={confirmPassword} 
                onChange={(e: any) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
             />
          )}
          
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
            <button type="button" onClick={() => setIsRegister(!isRegister)} className="text-indigo-600 font-semibold hover:underline">
                {isRegister ? 'Log In' : 'Sign Up'}
            </button>
        </div>
      </Card>
    </div>
  );
};

// --- Profile View ---
export const ProfileView = () => {
    const { user, addAddress, removeAddress, deleteMeasurementProfile, deleteLook } = useApp();
    const [activeTab, setActiveTab] = useState<'info' | 'addresses' | 'measurements' | 'lookbook'>('info');
    const [newAddress, setNewAddress] = useState('');
    const [showAddAddress, setShowAddAddress] = useState(false);
    const [language, setLanguage] = useState('en');

    if (!user) return null;

    const handleAddAddress = () => {
        if (newAddress.trim()) {
            addAddress(newAddress);
            setNewAddress('');
            setShowAddAddress(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <h2 className="text-3xl font-bold font-serif">Profile Settings</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                {/* Sidebar */}
                <Card className="h-fit md:col-span-1 p-4">
                    <div className="flex flex-col items-center mb-6">
                        <img src={user.avatar} alt="Profile" className="w-20 h-20 rounded-full bg-gray-200 mb-2" />
                        <h3 className="font-bold text-lg">{user.name}</h3>
                        <p className="text-sm text-gray-500">{user.role}</p>
                    </div>
                    <div className="space-y-1">
                         {['info', 'addresses', 'measurements', 'lookbook'].map(tab => (
                             <button 
                                key={tab}
                                onClick={() => setActiveTab(tab as any)}
                                className={`w-full text-left px-4 py-2 rounded capitalize ${activeTab === tab ? 'bg-gray-900 text-white font-bold' : 'text-gray-600 hover:bg-gray-100'}`}
                             >
                                 {tab}
                             </button>
                         ))}
                    </div>
                </Card>

                {/* Content Area */}
                <div className="md:col-span-3 space-y-6">
                    {activeTab === 'info' && (
                        <Card>
                            <h3 className="text-xl font-bold mb-6">Personal Information</h3>
                            <div className="grid grid-cols-1 gap-4 max-w-lg">
                                <Input label="Full Name" value={user.name} readOnly className="opacity-75" />
                                <Input label="Email Address" value={user.email} readOnly className="opacity-75" />
                                <div className="flex flex-col gap-1.5">
                                    <label className="text-sm font-semibold text-gray-700">Language</label>
                                    <select 
                                        value={language} 
                                        onChange={(e) => setLanguage(e.target.value)}
                                        className="w-full px-4 py-2.5 rounded-lg border border-gray-700 bg-gray-800 text-white outline-none"
                                    >
                                        <option value="en">English (US)</option>
                                        <option value="es">Español</option>
                                        <option value="fr">Français</option>
                                        <option value="de">Deutsch</option>
                                    </select>
                                </div>
                                <div className="mt-4 p-4 bg-indigo-50 border border-indigo-100 rounded-lg flex items-center justify-between">
                                     <div>
                                         <p className="text-sm text-indigo-900 font-bold">Loyalty Points</p>
                                         <p className="text-2xl font-bold text-indigo-700">{user.loyaltyPoints || 0}</p>
                                     </div>
                                     <i className="fas fa-crown text-3xl text-yellow-400"></i>
                                </div>
                            </div>
                        </Card>
                    )}

                    {activeTab === 'addresses' && (
                        <Card>
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="text-xl font-bold">Address Book</h3>
                                <Button onClick={() => setShowAddAddress(true)} variant="secondary" className="text-xs px-3 py-1.5"><i className="fas fa-plus mr-1"></i> Add</Button>
                            </div>

                            {showAddAddress && (
                                <div className="mb-6 p-4 bg-gray-50 border border-gray-200 rounded-lg animate-fade-in-down">
                                    <Input label="New Address" placeholder="Street, City, Zip" value={newAddress} onChange={(e: any) => setNewAddress(e.target.value)} className="mb-3" />
                                    <div className="flex gap-2 justify-end">
                                        <Button variant="secondary" onClick={() => setShowAddAddress(false)} className="text-xs">Cancel</Button>
                                        <Button onClick={handleAddAddress} className="text-xs">Save Address</Button>
                                    </div>
                                </div>
                            )}

                            <div className="space-y-3">
                                {user.addresses && user.addresses.length > 0 ? user.addresses.map((addr, i) => (
                                    <div key={i} className="flex justify-between items-center p-4 border border-gray-100 rounded-lg hover:bg-gray-50">
                                        <div className="flex items-center gap-3">
                                            <i className="fas fa-map-marker-alt text-gray-400"></i>
                                            <span className="font-medium">{addr}</span>
                                        </div>
                                        <button onClick={() => removeAddress(addr)} className="text-red-500 hover:text-red-700 p-2"><i className="fas fa-trash"></i></button>
                                    </div>
                                )) : (
                                    <p className="text-gray-500 italic text-center py-8">No addresses saved.</p>
                                )}
                            </div>
                        </Card>
                    )}

                    {activeTab === 'measurements' && (
                         <Card>
                            <h3 className="text-xl font-bold mb-6">Measurement Locker</h3>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                {user.savedMeasurements && user.savedMeasurements.length > 0 ? user.savedMeasurements.map(profile => (
                                    <div key={profile.id} className="border border-gray-200 rounded-xl p-4 hover:shadow-md transition-shadow relative group">
                                         <div className="flex justify-between items-start mb-2">
                                             <h4 className="font-bold text-lg">{profile.name}</h4>
                                             <span className="text-xs text-gray-400">{profile.date}</span>
                                         </div>
                                         <div className="space-y-1 text-sm text-gray-600 mb-4">
                                             <div className="flex justify-between"><span>Chest:</span> <span>{profile.values.chest || '-'} cm</span></div>
                                             <div className="flex justify-between"><span>Waist:</span> <span>{profile.values.waist || '-'} cm</span></div>
                                             <div className="flex justify-between"><span>Hips:</span> <span>{profile.values.hips || '-'} cm</span></div>
                                         </div>
                                         <button 
                                            onClick={() => deleteMeasurementProfile(profile.id)}
                                            className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 text-red-500 hover:bg-red-50 p-2 rounded transition-all"
                                         >
                                             <i className="fas fa-trash"></i>
                                         </button>
                                    </div>
                                )) : (
                                    <div className="col-span-full text-center py-10 text-gray-400 border-2 border-dashed border-gray-100 rounded-xl">
                                        <i className="fas fa-ruler-combined text-4xl mb-3"></i>
                                        <p>No saved profiles.</p>
                                        <p className="text-xs">Take an AI measurement to save one.</p>
                                    </div>
                                )}
                            </div>
                         </Card>
                    )}

                    {activeTab === 'lookbook' && (
                        <Card>
                            <h3 className="text-xl font-bold mb-6">Lookbook</h3>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                {user.lookbook && user.lookbook.length > 0 ? user.lookbook.map(look => (
                                    <div key={look.id} className="group relative rounded-lg overflow-hidden h-64 border border-gray-100 shadow-sm">
                                        <img src={look.imageUrl} alt={look.description} className="w-full h-full object-cover" />
                                        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-4 text-white">
                                            <p className="font-bold text-sm mb-1 line-clamp-2">{look.description}</p>
                                            <p className="text-xs opacity-75 mb-3">{look.fabricName}</p>
                                            <button 
                                                onClick={() => deleteLook(look.id)}
                                                className="bg-white/20 hover:bg-white/30 text-white text-xs py-1 px-3 rounded backdrop-blur-sm self-start"
                                            >
                                                Remove
                                            </button>
                                        </div>
                                    </div>
                                )) : (
                                    <div className="col-span-full text-center py-10 text-gray-400 border-2 border-dashed border-gray-100 rounded-xl">
                                        <i className="fas fa-tshirt text-4xl mb-3"></i>
                                        <p>Your lookbook is empty.</p>
                                        <p className="text-xs">Visit the Fitting Room to create styles.</p>
                                    </div>
                                )}
                            </div>
                        </Card>
                    )}
                </div>
            </div>
        </div>
    );
};

// --- Fabric Scanner View ---
export const FabricScannerView = () => {
    const { addInventoryItem } = useApp();
    const [file, setFile] = useState<File | null>(null);
    const [preview, setPreview] = useState<string | null>(null);
    const [analysis, setAnalysis] = useState<any>(null);
    const [loading, setLoading] = useState(false);

    const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const f = e.target.files[0];
            setFile(f);
            setPreview(URL.createObjectURL(f));
            setAnalysis(null);
        }
    };

    const analyze = async () => {
        if (!file) return;
        setLoading(true);
        try {
            const res = await analyzeFabric(file);
            setAnalysis(res);
        } catch (error) {
            console.error(error);
        }
        setLoading(false);
    };

    return (
        <div className="max-w-4xl mx-auto space-y-8">
            <h2 className="text-3xl font-bold font-serif text-center">AI Fabric Scanner</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-4">
                    <div className="border-2 border-dashed border-gray-300 rounded-xl h-80 flex items-center justify-center bg-gray-50 relative overflow-hidden">
                         {preview ? (
                             <img src={preview} alt="Fabric" className="w-full h-full object-cover" />
                         ) : (
                             <div className="text-center text-gray-400">
                                 <i className="fas fa-camera text-4xl mb-2"></i>
                                 <p>Upload fabric swatch</p>
                             </div>
                         )}
                         <input type="file" onChange={handleFile} accept="image/*" className="absolute inset-0 opacity-0 cursor-pointer" />
                    </div>
                    <Button onClick={analyze} disabled={!file || loading} className="w-full">
                        {loading ? 'Analyzing...' : 'Scan Fabric'}
                    </Button>
                </div>

                <div className="space-y-4">
                    {analysis ? (
                        <Card className="h-full">
                            <div className="flex justify-between items-start mb-4">
                                <div>
                                    <h3 className="text-2xl font-bold capitalize">{analysis.material}</h3>
                                    <p className="text-gray-500">{analysis.weave} • {analysis.pattern}</p>
                                </div>
                                <Button 
                                    variant="secondary" 
                                    className="text-xs" 
                                    onClick={() => addInventoryItem({
                                        name: `${analysis.material} ${analysis.pattern !== 'Solid' ? analysis.pattern : ''}`,
                                        type: analysis.material,
                                        color: analysis.colors?.[0],
                                        image: preview || ''
                                    })}
                                >
                                    Add to Inventory
                                </Button>
                            </div>
                            
                            <div className="space-y-4">
                                <div>
                                    <h4 className="font-bold text-sm text-gray-700">Colors</h4>
                                    <div className="flex gap-2 mt-1">
                                        {analysis.colors?.map((c: string, i: number) => (
                                            <Badge key={i} type="neutral">{c}</Badge>
                                        ))}
                                    </div>
                                </div>
                                
                                <div>
                                    <h4 className="font-bold text-sm text-gray-700">Care Instructions</h4>
                                    <p className="text-sm text-gray-600 mt-1">{analysis.careInstructions}</p>
                                </div>

                                <div>
                                    <h4 className="font-bold text-sm text-gray-700">Recommended Styles</h4>
                                    <ul className="mt-2 space-y-2">
                                        {analysis.recommendedStyles?.map((style: any, i: number) => (
                                            <li key={i} className="text-sm p-2 bg-indigo-50 rounded text-indigo-900">
                                                <strong>{style.name}:</strong> {style.description}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            </div>
                        </Card>
                    ) : (
                        <div className="h-full flex items-center justify-center border border-gray-100 rounded-xl bg-gray-50 text-gray-400">
                            <p>Analysis results will appear here.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

// --- Virtual Fitting View ---
export const VirtualFittingView = () => {
    const { saveLook } = useApp();
    const [file, setFile] = useState<File | null>(null);
    const [preview, setPreview] = useState<string | null>(null);
    const [garment, setGarment] = useState('Evening Gown');
    const [material, setMaterial] = useState('Silk');
    const [color, setColor] = useState('Red');
    const [generatedImage, setGeneratedImage] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [videoUrl, setVideoUrl] = useState<string | null>(null);
    const [generatingVideo, setGeneratingVideo] = useState(false);

    const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setFile(e.target.files[0]);
            setPreview(URL.createObjectURL(e.target.files[0]));
        }
    };

    const handleGenerate = async () => {
        if (!file) return;
        setLoading(true);
        setVideoUrl(null);
        try {
            const res = await generateStylePreview(file, garment, material, color);
            setGeneratedImage(res);
        } catch (err) {
            console.error(err);
        }
        setLoading(false);
    };

    const handleGenerateVideo = async () => {
        if (!generatedImage) return;
        setGeneratingVideo(true);
        try {
            const url = await generateRunwayVideo(generatedImage);
            setVideoUrl(url);
        } catch (err) {
            console.error(err);
        }
        setGeneratingVideo(false);
    };

    return (
        <div className="max-w-5xl mx-auto">
            <h2 className="text-3xl font-bold font-serif text-center mb-8">Virtual Fitting Room</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {/* Controls */}
                <div className="md:col-span-1 space-y-6">
                    <Card>
                        <h3 className="font-bold mb-4">Configuration</h3>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-semibold mb-2">1. Upload Photo</label>
                                <div className="border border-gray-300 rounded-lg p-2 text-center relative bg-gray-50 hover:bg-white cursor-pointer transition-colors">
                                    <span className="text-sm text-gray-500">{file ? file.name : "Choose File..."}</span>
                                    <input type="file" onChange={handleFile} accept="image/*" className="absolute inset-0 opacity-0 cursor-pointer" />
                                </div>
                            </div>
                            <Input label="2. Garment Type" value={garment} onChange={(e: any) => setGarment(e.target.value)} />
                            <Input label="3. Material" value={material} onChange={(e: any) => setMaterial(e.target.value)} />
                            <Input label="4. Color" value={color} onChange={(e: any) => setColor(e.target.value)} />
                            
                            <Button onClick={handleGenerate} disabled={!file || loading} className="w-full">
                                {loading ? 'Generating...' : 'Try On'}
                            </Button>
                        </div>
                    </Card>
                </div>

                {/* Preview Area */}
                <div className="md:col-span-2 space-y-6">
                    <div className="grid grid-cols-2 gap-4 h-96">
                        <div className="border rounded-xl overflow-hidden bg-gray-100 flex items-center justify-center">
                            {preview ? (
                                <img src={preview} alt="Original" className="w-full h-full object-cover" />
                            ) : (
                                <p className="text-gray-400">Original</p>
                            )}
                        </div>
                        <div className="border rounded-xl overflow-hidden bg-gray-900 flex items-center justify-center relative">
                            {loading ? (
                                <div className="text-white text-center">
                                    <i className="fas fa-magic fa-spin text-3xl mb-2"></i>
                                    <p>AI Designing...</p>
                                </div>
                            ) : generatedImage ? (
                                <img src={generatedImage} alt="Generated" className="w-full h-full object-cover" />
                            ) : (
                                <p className="text-gray-600">Preview</p>
                            )}
                        </div>
                    </div>

                    {generatedImage && (
                        <div className="flex gap-4 justify-center">
                            <Button 
                                onClick={() => saveLook({
                                    id: `look-${Date.now()}`,
                                    imageUrl: generatedImage,
                                    date: new Date().toISOString().split('T')[0],
                                    description: `${color} ${garment}`,
                                    fabricName: material
                                })}
                                variant="secondary"
                            >
                                <i className="fas fa-heart mr-2"></i> Save Look
                            </Button>
                            <Button onClick={handleGenerateVideo} disabled={generatingVideo} variant="accent">
                                {generatingVideo ? <i className="fas fa-spinner fa-spin"></i> : <><i className="fas fa-video mr-2"></i> Runway Video</>}
                            </Button>
                        </div>
                    )}

                    {videoUrl && (
                        <Card className="mt-4">
                            <h3 className="font-bold mb-2">Runway Preview</h3>
                            <video src={videoUrl} controls autoPlay loop className="w-full rounded-lg" />
                        </Card>
                    )}
                </div>
            </div>
        </div>
    );
};

// --- Tailor Dashboard ---
export const TailorDashboard = () => {
    const { user, orders, updateOrderStatus, tailorInventory, addInventoryItem, updatePortfolio, simulateOrderProgress, tailors } = useApp();
    const [activeTab, setActiveTab] = useState('orders');
    const [newMat, setNewMat] = useState<Partial<Material>>({});
    const [portfolioUrl, setPortfolioUrl] = useState('');
    const [uploadingMat, setUploadingMat] = useState(false);

    if (!user || user.role !== UserRole.TAILOR) return null;

    // Fix: Access portfolio via the tailors list instead of user object
    const currentTailor = tailors.find(t => t.id === user.id);
    const myOrders = orders.filter(o => o.tailorId === user.id);

    const handleAutoFill = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if(e.target.files && e.target.files[0]) {
            setUploadingMat(true);
            try {
                const file = e.target.files[0];
                const analysis = await analyzeFabric(file);
                
                // Map AI result to our Material structure
                setNewMat({
                    name: `${analysis.material} ${analysis.pattern !== 'Solid' ? analysis.pattern : ''}`,
                    type: analysis.material,
                    color: analysis.colors?.[0] || 'Multi',
                    image: URL.createObjectURL(file)
                });
            } catch (err) {
                console.error("Auto-fill failed");
            }
            setUploadingMat(false);
        }
    };

    return (
        <div className="space-y-6">
            <h2 className="text-3xl font-bold font-serif">Studio Dashboard</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                 <Card className="bg-gray-900 text-white border-none">
                     <p className="text-gray-400 text-sm">Total Revenue</p>
                     <p className="text-3xl font-bold">${(user.balance?.available || 0).toFixed(2)}</p>
                     <p className="text-xs text-green-400 mt-2">+$450.00 pending</p>
                 </Card>
                 <Card>
                     <p className="text-gray-500 text-sm">Active Orders</p>
                     <p className="text-3xl font-bold text-gray-900">{myOrders.filter(o => o.status !== OrderStatus.COMPLETED).length}</p>
                 </Card>
                 <Card>
                     <p className="text-gray-500 text-sm">Rating</p>
                     <div className="flex items-center gap-2">
                        <p className="text-3xl font-bold text-gray-900">{currentTailor?.rating || 0}</p>
                        <i className="fas fa-star text-yellow-400"></i>
                     </div>
                 </Card>
                 <Card>
                     <p className="text-gray-500 text-sm">Inventory Alert</p>
                     <p className="text-3xl font-bold text-red-500">2</p>
                     <p className="text-xs text-gray-400 mt-2">Items low stock</p>
                 </Card>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="flex border-b border-gray-200">
                    {['orders', 'inventory', 'portfolio'].map(tab => (
                        <button 
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`px-6 py-4 font-medium capitalize border-b-2 transition-colors ${activeTab === tab ? 'border-gray-900 text-gray-900 bg-gray-50' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                        >
                            {tab}
                        </button>
                    ))}
                </div>
                
                <div className="p-6">
                    {activeTab === 'orders' && (
                        <div className="space-y-4">
                            {myOrders.map(order => (
                                <div key={order.id} className="flex flex-col md:flex-row justify-between items-center p-4 border border-gray-100 rounded-lg hover:bg-gray-50">
                                    <div className="flex items-center gap-4 w-full md:w-auto">
                                        <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600 font-bold">
                                            {order.customerName?.charAt(0)}
                                        </div>
                                        <div>
                                            <h4 className="font-bold">{order.service}</h4>
                                            <p className="text-sm text-gray-500">{order.customerName} • {order.date}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-4 mt-4 md:mt-0 w-full md:w-auto">
                                         <span className={`px-3 py-1 rounded text-xs font-bold bg-gray-200`}>{order.status}</span>
                                         <select 
                                            value={order.status}
                                            onChange={(e) => updateOrderStatus(order.id, e.target.value as OrderStatus)}
                                            className="text-sm border border-gray-300 rounded p-1"
                                         >
                                             {Object.values(OrderStatus).map(s => <option key={s} value={s}>{s}</option>)}
                                         </select>
                                         <Button onClick={() => simulateOrderProgress(order.id)} variant="secondary" className="text-xs px-2"><i className="fas fa-play"></i> Sim</Button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {activeTab === 'inventory' && (
                        <div>
                            <div className="flex flex-col md:flex-row gap-4 mb-6 p-6 bg-gray-50 rounded-xl border border-gray-100">
                                <div className="w-full md:w-32 flex-shrink-0 flex flex-col gap-2">
                                    <div className="h-32 w-full bg-white border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center relative overflow-hidden group">
                                        {newMat.image ? (
                                            <img src={newMat.image} alt="Preview" className="w-full h-full object-cover" />
                                        ) : (
                                            <div className="text-center text-gray-400">
                                                {uploadingMat ? <i className="fas fa-spinner fa-spin text-2xl"></i> : <i className="fas fa-camera text-2xl"></i>}
                                                <p className="text-[10px] mt-1">Auto-Fill</p>
                                            </div>
                                        )}
                                        <input type="file" onChange={handleAutoFill} accept="image/*" className="absolute inset-0 opacity-0 cursor-pointer" />
                                    </div>
                                </div>
                                <div className="flex-1 grid grid-cols-2 md:grid-cols-4 gap-4 items-end">
                                    <Input placeholder="Item Name" value={newMat.name || ''} onChange={(e: any) => setNewMat({...newMat, name: e.target.value})} label="Name" />
                                    <Input placeholder="Type (e.g. Wool)" value={newMat.type || ''} onChange={(e: any) => setNewMat({...newMat, type: e.target.value})} label="Type" />
                                    <Input placeholder="Color" value={newMat.color || ''} onChange={(e: any) => setNewMat({...newMat, color: e.target.value})} label="Color" />
                                    <Input placeholder="Price/m" type="number" value={newMat.pricePerMeter || ''} onChange={(e: any) => setNewMat({...newMat, pricePerMeter: Number(e.target.value)})} label="Price ($)" />
                                </div>
                                <div className="flex items-end">
                                    <Button onClick={() => { addInventoryItem(newMat); setNewMat({}); }} className="h-[46px] w-full">Add Item</Button>
                                </div>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                                {tailorInventory.map(item => (
                                    <div key={item.id} className="border border-gray-200 p-4 rounded-lg flex items-center gap-3">
                                        <img src={item.image} alt={item.name} className="w-12 h-12 bg-gray-200 rounded object-cover" />
                                        <div>
                                            <p className="font-bold">{item.name}</p>
                                            <p className="text-xs text-gray-500">{item.type} • ${item.pricePerMeter}/m</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {activeTab === 'portfolio' && (
                        <div>
                             <div className="flex gap-2 mb-6">
                                <Input placeholder="Image URL" value={portfolioUrl} onChange={(e: any) => setPortfolioUrl(e.target.value)} className="flex-1" />
                                <Button onClick={() => { updatePortfolio('add', portfolioUrl); setPortfolioUrl(''); }}>Add Image</Button>
                            </div>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                 <div className="h-40 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center text-gray-400">
                                     <i className="fas fa-plus text-2xl"></i>
                                 </div>
                                 {currentTailor?.portfolio?.map((img, i) => (
                                     <div key={i} className="relative group">
                                         <img src={img} alt="Portfolio" className="w-full h-40 object-cover rounded-lg" />
                                         <button 
                                            onClick={() => updatePortfolio('remove', img)}
                                            className="absolute top-2 right-2 bg-white p-1 rounded-full shadow text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                                         >
                                             <i className="fas fa-trash"></i>
                                         </button>
                                     </div>
                                 ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

// --- Customer Dashboard ---
export const CustomerDashboard = () => {
    const { tailors, selectTailor } = useApp();
    const [searchTerm, setSearchTerm] = useState('');
    const [searchResults, setSearchResults] = useState<Tailor[]>(tailors);
    const [mapResults, setMapResults] = useState<GroundingChunk[]>([]);
    const [isSearching, setIsSearching] = useState(false);

    const handleSearch = async () => {
        setIsSearching(true);
        // Mock lat/lng for "Downtown"
        const result = await searchTailorsNearby(searchTerm, 40.7128, -74.0060);
        setMapResults(result.grounding || []);
        
        // Simple local filter + potentially AI suggestions
        const filtered = tailors.filter(t => 
            t.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
            t.specialties.some(s => s.toLowerCase().includes(searchTerm.toLowerCase()))
        );
        setSearchResults(filtered);
        setIsSearching(false);
    };

    return (
        <div className="space-y-8">
            <div className="bg-gray-900 rounded-2xl p-8 md:p-12 text-white relative overflow-hidden">
                <div className="relative z-10 max-w-2xl">
                    <h2 className="text-3xl font-bold font-serif mb-4">Find Your Perfect Fit</h2>
                    <div className="flex gap-2 bg-white p-2 rounded-lg">
                        <input 
                            type="text" 
                            placeholder="What do you need? (e.g. Wedding dress alteration)" 
                            className="flex-1 px-4 text-gray-900 outline-none"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                        />
                        <Button onClick={handleSearch} disabled={isSearching}>
                            {isSearching ? <i className="fas fa-spinner fa-spin"></i> : 'Search'}
                        </Button>
                    </div>
                </div>
                <div className="absolute right-0 top-0 h-full w-1/3 bg-gradient-to-l from-indigo-900 to-transparent opacity-50"></div>
            </div>

            {mapResults.length > 0 && (
                <div className="mb-8">
                    <h3 className="font-bold text-lg mb-4">Found on Google Maps</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {mapResults.map((chunk, i) => (
                            <a key={i} href={chunk.maps?.uri} target="_blank" rel="noreferrer" className="block p-4 bg-white border border-gray-200 rounded-lg hover:shadow-md transition-shadow">
                                <div className="font-bold text-indigo-600 mb-1">{chunk.maps?.title}</div>
                                <div className="text-xs text-gray-500">View on Maps <i className="fas fa-external-link-alt ml-1"></i></div>
                            </a>
                        ))}
                    </div>
                </div>
            )}

            <div>
                <h3 className="font-bold text-xl mb-6">Top Rated Tailors</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {searchResults.map(tailor => (
                        <div key={tailor.id} className="bg-white rounded-xl border border-gray-100 overflow-hidden shadow-sm hover:shadow-md transition-shadow cursor-pointer" onClick={() => selectTailor(tailor)}>
                            <div className="h-48 bg-gray-200 relative">
                                <img src={tailor.image} alt={tailor.name} className="w-full h-full object-cover" />
                                <div className="absolute top-4 right-4 bg-white px-2 py-1 rounded shadow text-sm font-bold flex items-center gap-1">
                                    <i className="fas fa-star text-yellow-400"></i> {tailor.rating}
                                </div>
                            </div>
                            <div className="p-6">
                                <h4 className="font-bold text-lg mb-1">{tailor.businessName}</h4>
                                <p className="text-gray-500 text-sm mb-4"><i className="fas fa-map-marker-alt mr-1"></i> {tailor.location} ({tailor.distance})</p>
                                <div className="flex flex-wrap gap-2 mb-4">
                                    {tailor.specialties.slice(0, 3).map((s, i) => (
                                        <Badge key={i} type="neutral">{s}</Badge>
                                    ))}
                                </div>
                                <div className="flex justify-between items-center border-t border-gray-100 pt-4">
                                    <span className="text-sm text-gray-500">Starts at <b>{tailor.pricing.currency}{tailor.pricing.base}</b></span>
                                    <span className="text-indigo-600 font-medium text-sm">View Profile <i className="fas fa-arrow-right ml-1"></i></span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

// --- Tailor Details View ---
export const TailorDetails = () => {
    const { activeTailor, openChat, bookAppointment, navigate, createDraftOrder, selectMaterial } = useApp();
    const [activeTab, setActiveTab] = useState<'portfolio' | 'reviews'>('portfolio');

    if (!activeTailor) return null;

    const handleStartOrder = () => {
        // Simple flow: auto-select first service
        navigate(AppView.MEASUREMENT); // Or flow directly to order creation
    };

    return (
        <div className="max-w-5xl mx-auto space-y-8">
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 md:p-8 flex flex-col md:flex-row gap-8">
                <img src={activeTailor.image} alt={activeTailor.name} className="w-32 h-32 md:w-48 md:h-48 rounded-xl object-cover bg-gray-200" />
                <div className="flex-1">
                    <div className="flex justify-between items-start">
                        <div>
                            <h2 className="text-3xl font-bold font-serif mb-2">{activeTailor.businessName}</h2>
                            <p className="text-gray-600 mb-4">{activeTailor.name} • {activeTailor.location}</p>
                        </div>
                        <div className="flex flex-col items-end gap-1">
                            <div className="flex items-center gap-1 text-yellow-400 text-xl">
                                <span className="font-bold text-gray-900 mr-1">{activeTailor.rating}</span>
                                {[...Array(5)].map((_, i) => (
                                    <i key={i} className={`fas fa-star ${i < Math.floor(activeTailor.rating) ? '' : 'text-gray-300'}`}></i>
                                ))}
                            </div>
                            <span className="text-sm text-gray-400">{activeTailor.reviews} reviews</span>
                        </div>
                    </div>

                    <div className="flex gap-2 mb-6">
                        {activeTailor.specialties.map((s, i) => <Badge key={i} type="neutral">{s}</Badge>)}
                    </div>

                    <div className="flex flex-wrap gap-4">
                        <Button onClick={() => openChat(activeTailor.id, activeTailor.businessName)}><i className="fas fa-comment mr-2"></i> Message</Button>
                        <Button variant="secondary" onClick={() => bookAppointment({})}><i className="fas fa-calendar mr-2"></i> Book Appointment</Button>
                        <Button variant="accent" onClick={handleStartOrder}>Start Custom Order</Button>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="md:col-span-2 space-y-6">
                    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
                         <div className="flex border-b border-gray-200">
                            <button 
                                onClick={() => setActiveTab('portfolio')} 
                                className={`flex-1 py-4 font-medium ${activeTab === 'portfolio' ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-gray-500'}`}
                            >
                                Portfolio
                            </button>
                            <button 
                                onClick={() => setActiveTab('reviews')} 
                                className={`flex-1 py-4 font-medium ${activeTab === 'reviews' ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-gray-500'}`}
                            >
                                Reviews
                            </button>
                        </div>
                        <div className="p-6">
                            {activeTab === 'portfolio' ? (
                                <div className="grid grid-cols-2 gap-4">
                                    {activeTailor.portfolio.map((img, i) => (
                                        <img key={i} src={img} alt="Portfolio" className="rounded-lg w-full h-48 object-cover hover:opacity-90 transition-opacity cursor-pointer" />
                                    ))}
                                </div>
                            ) : (
                                <div className="space-y-6">
                                    {activeTailor.reviewsList?.map(review => (
                                        <div key={review.id} className="border-b border-gray-100 last:border-0 pb-6 last:pb-0">
                                            <div className="flex justify-between mb-2">
                                                <span className="font-bold">{review.customerName}</span>
                                                <span className="text-xs text-gray-400">{review.date}</span>
                                            </div>
                                            <div className="flex text-yellow-400 text-xs mb-2">
                                                {[...Array(5)].map((_, i) => <i key={i} className={`fas fa-star ${i < review.rating ? '' : 'text-gray-200'}`}></i>)}
                                            </div>
                                            <p className="text-gray-600 text-sm">{review.comment}</p>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                <div className="space-y-6">
                    <Card>
                        <h3 className="font-bold mb-4">Pricing & Services</h3>
                        <div className="space-y-3 text-sm">
                            <div className="flex justify-between">
                                <span>Consultation</span>
                                <span className="font-bold">Free</span>
                            </div>
                            <div className="flex justify-between">
                                <span>Hemming</span>
                                <span className="font-bold">$20+</span>
                            </div>
                            <div className="flex justify-between">
                                <span>Custom Dress</span>
                                <span className="font-bold">$150+</span>
                            </div>
                            <div className="flex justify-between">
                                <span>Suit Alteration</span>
                                <span className="font-bold">$45+</span>
                            </div>
                        </div>
                    </Card>

                    {activeTailor.materialsAvailable && (
                        <Card>
                            <h3 className="font-bold mb-4">Available Fabrics</h3>
                            <div className="grid grid-cols-3 gap-2">
                                {activeTailor.inventory?.map(mat => (
                                    <div 
                                        key={mat.id} 
                                        className="aspect-square rounded-lg bg-gray-100 relative group cursor-pointer overflow-hidden"
                                        onClick={() => { selectMaterial(mat); createDraftOrder({ tailorId: activeTailor.id, tailorName: activeTailor.businessName, amount: 200, service: 'Custom Order', materialName: mat.name }); }}
                                    >
                                        <img src={mat.image} alt={mat.name} className="w-full h-full object-cover" />
                                        <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-white text-xs text-center p-1">
                                            Select
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </Card>
                    )}
                </div>
            </div>
        </div>
    );
};

// --- Measurement View ---
export const MeasurementView = () => {
    const { user, saveMeasurementProfile } = useApp();
    const [mode, setMode] = useState<'ai' | 'manual'>('ai');
    const [file, setFile] = useState<File | null>(null);
    const [height, setHeight] = useState('175');
    const [weight, setWeight] = useState('70');
    const [loading, setLoading] = useState(false);
    const [measurements, setMeasurements] = useState<any>(INITIAL_MEASUREMENTS);
    const [preview, setPreview] = useState<string | null>(null);
    const [profileName, setProfileName] = useState('My Fit');
    const [sizingAdvice, setSizingAdvice] = useState('');
    const [activeGuide, setActiveGuide] = useState<string | null>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setFile(e.target.files[0]);
            setPreview(URL.createObjectURL(e.target.files[0]));
        }
    };

    const handleAnalyze = async () => {
        if (!file) return;
        setLoading(true);
        try {
            const result = await analyzeBodyMeasurement(file, height, weight);
            setMeasurements(prev => ({ ...prev, ...result }));
            
            const advice = await getSmartSizingAdvice({ height: Number(height), weight: Number(weight), gender: 'neutral' });
            setSizingAdvice(advice);
            
        } catch (e) {
            alert("Analysis failed. Please try again.");
        }
        setLoading(false);
    };

    const handleSave = () => {
        saveMeasurementProfile(profileName, { ...measurements, height: Number(height), weight: Number(weight) });
    };

    const measurementGuides: Record<string, string> = {
        neck: "Measure around the middle of your neck, keeping the tape loose enough for two fingers.",
        chest: "Measure around the fullest part of your chest, keeping the tape horizontal.",
        waist: "Measure around your natural waistline, just above your hips.",
        hips: "Measure around the fullest part of your hips.",
        inseam: "Measure from the crotch seam to the bottom of the leg.",
        sleeve: "Measure from the shoulder seam to the wrist.",
        shoulder: "Measure from one shoulder tip to the other across the back."
    };

    return (
        <div className="max-w-3xl mx-auto">
            <h2 className="text-3xl font-bold font-serif mb-6 text-center">Measurement Studio</h2>
            
            <div className="flex justify-center gap-4 mb-8">
                <button onClick={() => setMode('ai')} className={`px-6 py-2 rounded-full font-bold transition-all ${mode === 'ai' ? 'bg-indigo-600 text-white shadow-lg' : 'bg-white text-gray-600 hover:bg-gray-100'}`}>
                    <i className="fas fa-robot mr-2"></i> AI Auto-Measure
                </button>
                <button onClick={() => setMode('manual')} className={`px-6 py-2 rounded-full font-bold transition-all ${mode === 'manual' ? 'bg-indigo-600 text-white shadow-lg' : 'bg-white text-gray-600 hover:bg-gray-100'}`}>
                    <i className="fas fa-pencil-alt mr-2"></i> Manual Input
                </button>
            </div>

            <Card className="mb-8">
                {mode === 'ai' ? (
                    <div className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-4">
                                <div className="border-2 border-dashed border-gray-300 rounded-xl h-64 flex flex-col items-center justify-center bg-gray-50 relative overflow-hidden">
                                    {preview ? (
                                        <img src={preview} alt="Preview" className="w-full h-full object-contain" />
                                    ) : (
                                        <div className="text-center p-4">
                                            <i className="fas fa-camera text-4xl text-gray-300 mb-2"></i>
                                            <p className="text-gray-500 text-sm">Upload full body photo</p>
                                        </div>
                                    )}
                                    <input type="file" onChange={handleFileChange} className="absolute inset-0 opacity-0 cursor-pointer" accept="image/*" />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <Input label="Height (cm)" value={height} onChange={(e: any) => setHeight(e.target.value)} type="number" />
                                    <Input label="Weight (kg)" value={weight} onChange={(e: any) => setWeight(e.target.value)} type="number" />
                                </div>
                                <Button onClick={handleAnalyze} disabled={!file || loading} className="w-full">
                                    {loading ? <i className="fas fa-spinner fa-spin"></i> : 'Analyze Now'}
                                </Button>
                            </div>
                            
                            <div className="bg-gray-50 p-6 rounded-xl border border-gray-200">
                                <h3 className="font-bold text-gray-900 mb-4">Results</h3>
                                {sizingAdvice && (
                                    <div className="mb-4 p-3 bg-indigo-50 text-indigo-800 text-sm rounded border border-indigo-100">
                                        <i className="fas fa-info-circle mr-2"></i> {sizingAdvice}
                                    </div>
                                )}
                                <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                                    {Object.entries(measurements).map(([key, val]) => (
                                        typeof val === 'number' && (
                                            <div key={key} className="flex justify-between py-2 border-b border-gray-200">
                                                <span className="capitalize text-gray-600">{key}</span>
                                                <span className="font-bold">{val} cm</span>
                                            </div>
                                        )
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="flex flex-col md:flex-row gap-6">
                        <div className="grid grid-cols-2 gap-6 flex-1">
                             {Object.keys(measurements).map(key => (
                                 <div key={key} onFocus={() => setActiveGuide(key)}>
                                     <Input 
                                        label={`${key.charAt(0).toUpperCase() + key.slice(1)} (cm)`} 
                                        value={measurements[key]} 
                                        onChange={(e: any) => setMeasurements({...measurements, [key]: Number(e.target.value)})} 
                                        type="number" 
                                     />
                                 </div>
                             ))}
                        </div>
                        <div className="w-full md:w-1/3 bg-indigo-50 p-4 rounded-xl h-fit border border-indigo-100">
                            <h4 className="font-bold text-indigo-900 mb-2">
                                <i className="fas fa-info-circle mr-2"></i> How to Measure
                            </h4>
                            {activeGuide ? (
                                <div className="animate-fade-in-down">
                                    <p className="font-bold capitalize text-sm mb-1">{activeGuide}</p>
                                    <p className="text-sm text-indigo-800">{measurementGuides[activeGuide]}</p>
                                </div>
                            ) : (
                                <p className="text-sm text-indigo-800 italic">Click on a field to see instructions.</p>
                            )}
                        </div>
                    </div>
                )}
            </Card>

            <div className="flex gap-4 items-end">
                <div className="flex-1">
                    <Input label="Profile Name" value={profileName} onChange={(e: any) => setProfileName(e.target.value)} />
                </div>
                <Button onClick={handleSave} className="mb-1.5">Save to Profile</Button>
            </div>
        </div>
    );
};

// --- Tracking View ---
export const TrackingView = () => {
    const { orders, user, releaseEscrow } = useApp();
    if (!user) return null;
    
    // Filter orders for the customer
    const myOrders = orders.filter(o => o.customerName === user.name || o.tailorId === user.id); // Simple match for now

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <h2 className="text-3xl font-bold font-serif mb-6">Order Tracking</h2>
            {myOrders.length === 0 ? (
                <div className="text-center py-20 bg-gray-50 rounded-xl">
                    <i className="fas fa-box-open text-4xl text-gray-300 mb-4"></i>
                    <p className="text-gray-500">No active orders found.</p>
                </div>
            ) : (
                <div className="space-y-6">
                    {myOrders.map(order => (
                        <Card key={order.id} className="overflow-hidden">
                            <div className="flex flex-col md:flex-row gap-6">
                                <img src={order.thumbnail} alt="Item" className="w-full md:w-32 h-32 object-cover rounded-lg bg-gray-100" />
                                <div className="flex-1">
                                    <div className="flex justify-between items-start mb-2">
                                        <div>
                                            <h3 className="font-bold text-lg">{order.service}</h3>
                                            <p className="text-sm text-gray-500">Order #{order.id} • {order.tailorName}</p>
                                        </div>
                                        <Badge type={order.status === OrderStatus.COMPLETED ? 'success' : 'info'}>{order.status}</Badge>
                                    </div>
                                    
                                    <div className="relative pt-6 pb-2">
                                        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                                            <div 
                                                className="h-full bg-indigo-600 transition-all duration-500" 
                                                style={{ width: 
                                                    order.status === OrderStatus.PENDING ? '10%' :
                                                    order.status === OrderStatus.MEASUREMENT_SCHEDULED ? '30%' :
                                                    order.status === OrderStatus.IN_PROGRESS ? '50%' :
                                                    order.status === OrderStatus.READY_FOR_FITTING ? '70%' :
                                                    order.status === OrderStatus.OUT_FOR_DELIVERY ? '90%' : '100%'
                                                }}
                                            ></div>
                                        </div>
                                    </div>

                                    {order.rider && (
                                        <div className="mt-4 p-3 bg-blue-50 border border-blue-100 rounded-lg flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 bg-blue-200 rounded-full flex items-center justify-center text-blue-800">
                                                    <i className="fas fa-motorcycle"></i>
                                                </div>
                                                <div>
                                                    <p className="font-bold text-sm text-blue-900">{order.rider.name}</p>
                                                    <p className="text-xs text-blue-700">{order.rider.vehicle}</p>
                                                </div>
                                            </div>
                                            <a href={`tel:${order.rider.phone}`} className="w-8 h-8 rounded-full bg-white flex items-center justify-center text-blue-600 shadow-sm">
                                                <i className="fas fa-phone"></i>
                                            </a>
                                        </div>
                                    )}

                                    <div className="mt-4 flex justify-end gap-2">
                                        {user.role === UserRole.CUSTOMER && (order.status === OrderStatus.COMPLETED || order.status === OrderStatus.READY_FOR_FITTING) && order.paymentStatus !== PaymentStatus.RELEASED && (
                                             <Button onClick={() => releaseEscrow(order.id)} className="text-xs bg-green-600 hover:bg-green-700">Release Payment</Button>
                                        )}
                                        <Button variant="outline" className="text-xs">View Details</Button>
                                    </div>
                                </div>
                            </div>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
};

// --- Chat View ---
export const ChatView = () => {
    const { chats, activeChatId, openChat, sendMessage, user, closeActiveChat } = useApp();
    const [msgText, setMsgText] = useState('');
    const [suggestions, setSuggestions] = useState<string[]>([]);

    const activeChat = chats.find(c => c.id === activeChatId);
    
    useEffect(() => {
        if (activeChat && activeChat.messages.length > 0) {
            const lastMsg = activeChat.messages[activeChat.messages.length - 1];
            if (lastMsg.senderId !== user?.id) {
                getChatSuggestions(lastMsg.text, user?.role || 'CUSTOMER').then(setSuggestions);
            } else {
                setSuggestions([]);
            }
        }
    }, [activeChat, user]);

    if (!user) return null;

    return (
        <div className="h-[calc(100vh-140px)] flex gap-6">
            <div className={`w-full md:w-1/3 bg-white border border-gray-200 rounded-xl flex flex-col ${activeChatId ? 'hidden md:flex' : 'flex'}`}>
                <div className="p-4 border-b border-gray-100 font-bold text-lg">Messages</div>
                <div className="flex-1 overflow-y-auto">
                    {chats.map(chat => {
                        const otherId = chat.participants.find(p => p !== user.id) || '';
                        const name = chat.participantNames[otherId];
                        return (
                            <div 
                                key={chat.id} 
                                onClick={() => openChat(otherId, name)}
                                className={`p-4 border-b border-gray-100 hover:bg-gray-50 cursor-pointer ${activeChatId === chat.id ? 'bg-indigo-50' : ''}`}
                            >
                                <div className="flex justify-between mb-1">
                                    <span className="font-bold">{name}</span>
                                    {chat.unreadCount > 0 && <span className="w-2 h-2 bg-red-500 rounded-full"></span>}
                                </div>
                                <p className="text-sm text-gray-500 truncate">{chat.lastMessage}</p>
                            </div>
                        );
                    })}
                    {chats.length === 0 && <div className="p-8 text-center text-gray-400">No messages yet.</div>}
                </div>
            </div>

            <div className={`w-full md:w-2/3 bg-white border border-gray-200 rounded-xl flex flex-col ${!activeChatId ? 'hidden md:flex' : 'flex'}`}>
                {activeChat ? (
                    <>
                        <div className="p-4 border-b border-gray-100 flex justify-between items-center">
                            <div className="flex items-center gap-3">
                                <button onClick={closeActiveChat} className="md:hidden text-gray-500"><i className="fas fa-arrow-left"></i></button>
                                <span className="font-bold">{activeChat.participantNames[activeChat.participants.find(p => p !== user.id) || '']}</span>
                            </div>
                            <i className="fas fa-ellipsis-v text-gray-400"></i>
                        </div>
                        
                        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
                            {activeChat.messages.map(m => (
                                <div key={m.id} className={`flex ${m.senderId === user.id ? 'justify-end' : 'justify-start'}`}>
                                    <div className={`max-w-[70%] p-3 rounded-lg ${m.senderId === user.id ? 'bg-indigo-600 text-white rounded-br-none' : 'bg-white border border-gray-200 rounded-bl-none'}`}>
                                        <p>{m.text}</p>
                                        <p className={`text-[10px] mt-1 text-right ${m.senderId === user.id ? 'text-indigo-200' : 'text-gray-400'}`}>{new Date(m.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</p>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="p-4 border-t border-gray-100">
                             {suggestions.length > 0 && (
                                <div className="flex gap-2 overflow-x-auto pb-2 mb-2 no-scrollbar">
                                    {suggestions.map((s, i) => (
                                        <button key={i} onClick={() => { setMsgText(s); }} className="whitespace-nowrap px-3 py-1 bg-indigo-50 text-indigo-700 text-xs rounded-full border border-indigo-100 hover:bg-indigo-100">
                                            {s}
                                        </button>
                                    ))}
                                </div>
                             )}
                             <div className="flex gap-2">
                                <input 
                                    className="flex-1 border border-gray-300 rounded-lg px-4 outline-none focus:border-indigo-500"
                                    value={msgText}
                                    onChange={(e) => setMsgText(e.target.value)}
                                    placeholder="Type a message..."
                                    onKeyDown={(e) => e.key === 'Enter' && (sendMessage(msgText), setMsgText(''))}
                                />
                                <Button onClick={() => { sendMessage(msgText); setMsgText(''); }}><i className="fas fa-paper-plane"></i></Button>
                             </div>
                        </div>
                    </>
                ) : (
                    <div className="flex-1 flex flex-col items-center justify-center text-gray-400">
                        <i className="far fa-comments text-6xl mb-4"></i>
                        <p>Select a chat to start messaging</p>
                    </div>
                )}
            </div>
        </div>
    );
};

// --- Payment View ---
export const PaymentView = () => {
    const { draftOrder, completeOrder, user } = useApp();
    const [usePoints, setUsePoints] = useState(false);

    if (!draftOrder) return <div className="text-center py-20">No pending order.</div>;

    const discount = usePoints && user?.loyaltyPoints ? Math.min(user.loyaltyPoints / 10, 50) : 0;
    const finalAmount = (draftOrder.amount || 0) - discount;

    return (
        <div className="max-w-xl mx-auto">
             <Card>
                 <h2 className="text-2xl font-bold font-serif mb-6">Secure Checkout</h2>
                 
                 <div className="space-y-4 mb-8">
                     <div className="flex gap-4 p-4 bg-gray-50 rounded-lg">
                         <div className="w-16 h-16 bg-gray-200 rounded"></div>
                         <div>
                             <p className="font-bold">{draftOrder.service}</p>
                             <p className="text-sm text-gray-500">{draftOrder.tailorName}</p>
                             <p className="text-sm text-indigo-600 font-medium">{draftOrder.materialName}</p>
                         </div>
                     </div>
                     
                     <div className="border-t border-gray-100 pt-4 space-y-2">
                         <div className="flex justify-between"><span>Subtotal</span><span>${draftOrder.amount}</span></div>
                         <div className="flex justify-between"><span>Platform Fee</span><span>$5.00</span></div>
                         {usePoints && <div className="flex justify-between text-green-600"><span>Loyalty Discount</span><span>-${discount.toFixed(2)}</span></div>}
                         <div className="flex justify-between font-bold text-lg pt-2 border-t"><span>Total</span><span>${(finalAmount + 5).toFixed(2)}</span></div>
                     </div>
                 </div>

                 <div className="mb-6">
                    <label className="flex items-center gap-2 p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                        <input type="checkbox" checked={usePoints} onChange={(e) => setUsePoints(e.target.checked)} />
                        <span>Redeem {user?.loyaltyPoints} points for discount</span>
                    </label>
                 </div>

                 <Button onClick={() => completeOrder(usePoints ? discount * 10 : 0)} className="w-full h-12 text-lg">
                     Pay & Confirm Order
                 </Button>
                 
                 <p className="text-center text-xs text-gray-400 mt-4">
                     <i className="fas fa-lock mr-1"></i> Payments are held in escrow until order completion.
                 </p>
             </Card>
        </div>
    );
};

// --- Appointment View ---
export const AppointmentView = () => {
    const { appointments } = useApp();
    
    return (
        <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold font-serif mb-6">My Appointments</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {appointments.map(apt => (
                    <Card key={apt.id} className="flex flex-col gap-2">
                        <div className="flex justify-between items-start">
                            <h3 className="font-bold text-lg">{apt.tailorName}</h3>
                            <Badge>{apt.status}</Badge>
                        </div>
                        <p className="text-gray-600"><i className="far fa-calendar mr-2"></i> {apt.date} at {apt.time}</p>
                        <p className="text-gray-600"><i className="fas fa-tag mr-2"></i> {apt.type}</p>
                        <div className="mt-2 flex gap-2">
                            <Button variant="outline" className="text-xs flex-1">Reschedule</Button>
                            <Button variant="outline" className="text-xs flex-1 text-red-600 border-red-200 hover:bg-red-50">Cancel</Button>
                        </div>
                    </Card>
                ))}
                {appointments.length === 0 && <p className="text-gray-500">No upcoming appointments.</p>}
            </div>
        </div>
    );
};

// --- Live Stylist View ---
export const LiveStylistView = () => {
  const [connected, setConnected] = useState(false);
  const [loading, setLoading] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [log, setLog] = useState<string[]>([]);
  const activeSourceRef = useRef<AudioBufferSourceNode | null>(null);

  const addLog = (msg: string) => setLog(prev => [msg, ...prev.slice(0, 4)]);

  const connect = async () => {
    setLoading(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
      let nextStartTime = 0;
      const inputAudioContext = new (window.AudioContext || (window as any).webkitAudioContext)({sampleRate: 16000});
      const outputAudioContext = new (window.AudioContext || (window as any).webkitAudioContext)({sampleRate: 24000});
      const outputNode = outputAudioContext.createGain();
      outputNode.connect(outputAudioContext.destination);
      
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      const sessionPromise = ai.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-09-2025',
        callbacks: {
          onopen: () => {
            addLog("Connected to Stylist");
            setConnected(true);
            setLoading(false);
            
            // Audio In
            const source = inputAudioContext.createMediaStreamSource(stream);
            const scriptProcessor = inputAudioContext.createScriptProcessor(4096, 1, 1);
            scriptProcessor.onaudioprocess = (e) => {
              const inputData = e.inputBuffer.getChannelData(0);
              const pcmBlob = createBlob(inputData);
              sessionPromise.then(session => session.sendRealtimeInput({ media: pcmBlob }));
            };
            source.connect(scriptProcessor);
            scriptProcessor.connect(inputAudioContext.destination);
          },
          onmessage: async (message: LiveServerMessage) => {
             const base64Audio = message.serverContent?.modelTurn?.parts[0]?.inlineData?.data;
             if (base64Audio) {
                 nextStartTime = Math.max(nextStartTime, outputAudioContext.currentTime);
                 const audioBuffer = await decodeAudioData(
                     decode(base64Audio),
                     outputAudioContext,
                     24000,
                     1
                 );
                 const source = outputAudioContext.createBufferSource();
                 source.buffer = audioBuffer;
                 source.connect(outputNode);
                 source.start(nextStartTime);
                 nextStartTime += audioBuffer.duration;
                 activeSourceRef.current = source;
             }
          },
          onclose: () => {
             addLog("Disconnected");
             setConnected(false);
          },
          onerror: (e) => {
             console.error(e);
             addLog("Error occurred");
          }
        },
        config: {
          responseModalities: [Modality.AUDIO],
          systemInstruction: "You are an expert fashion stylist. Help the user choose an outfit, give advice on color matching, and be friendly and professional."
        }
      });
      
    } catch (e) {
       console.error(e);
       setLoading(false);
       addLog("Failed to connect");
    }
  };

  return (
    <div className="max-w-2xl mx-auto text-center space-y-8 py-10">
        <h2 className="text-3xl font-bold font-serif">Live Personal Stylist</h2>
        <p className="text-gray-600">Get real-time fashion advice. Connect to speak with our AI stylist.</p>
        
        <div className="relative w-64 h-64 mx-auto bg-indigo-50 rounded-full flex items-center justify-center border-4 border-indigo-100 shadow-xl overflow-hidden">
             {connected ? (
                 <div className="absolute inset-0 bg-indigo-500 opacity-10 animate-pulse"></div>
             ) : null}
             <i className={`fas fa-microphone text-5xl ${connected ? 'text-indigo-600' : 'text-gray-300'}`}></i>
        </div>

        <div className="space-y-4">
             {!connected ? (
                 <Button onClick={connect} disabled={loading} className="px-10 py-4 text-xl">
                    {loading ? <i className="fas fa-spinner fa-spin"></i> : 'Start Session'}
                 </Button>
             ) : (
                 <Button onClick={() => window.location.reload()} variant="outline" className="px-10 py-4 text-xl border-red-200 text-red-600 hover:bg-red-50">
                    End Session
                 </Button>
             )}
        </div>

        <div className="h-24 overflow-hidden text-sm text-gray-400">
            {log.map((l, i) => <p key={i}>{l}</p>)}
        </div>
    </div>
  );
};