import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../store';
import { AppView, UserRole, OrderStatus, Tailor, PaymentStatus, Material, Look, Appointment } from '../types';
import { Button, Input, Card, Badge, StarRating, NotificationToast } from './UI';
import { searchTailorsNearby, analyzeBodyMeasurement, getSmartSizingAdvice, generateStylePreview, getChatSuggestions, generateRunwayVideo, analyzeFabric } from '../services/gemini';
import { INITIAL_MEASUREMENTS, MOCK_TAILORS } from '../constants';
import { GoogleGenAI, LiveServerMessage, Modality, Blob } from '@google/genai';

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
    const { navigate } = useApp();
    const [file, setFile] = useState<File | null>(null);
    const [preview, setPreview] = useState<string | null>(null);
    const [analysis, setAnalysis] = useState<any>(null);
    const [loading, setLoading] = useState(false);

    const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        if(e.target.files && e.target.files[0]) {
            setFile(e.target.files[0]);
            setPreview(URL.createObjectURL(e.target.files[0]));
            setAnalysis(null);
        }
    };

    const handleAnalyze = async () => {
        if(!file) return;
        setLoading(true);
        try {
            const result = await analyzeFabric(file);
            setAnalysis(result);
        } catch (e) {
            console.error(e);
            alert("Failed to analyze fabric. Try another image.");
        }
        setLoading(false);
    };

    return (
        <div className="max-w-5xl mx-auto space-y-8">
            <div className="text-center">
                <h2 className="text-4xl font-bold font-serif mb-4">Fabric Intelligence</h2>
                <p className="text-gray-500 max-w-xl mx-auto">Upload a photo of your fabric. Our AI will identify the material, weave, and pattern, and recommend the perfect garment styles for it.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Upload Section */}
                <div className="space-y-6">
                    <Card className={`h-96 flex flex-col items-center justify-center border-2 border-dashed transition-all ${preview ? 'border-indigo-500 bg-white' : 'border-gray-300 bg-gray-50 hover:bg-gray-100'}`}>
                        <div className="relative w-full h-full flex flex-col items-center justify-center p-4">
                            {preview ? (
                                <img src={preview} alt="Fabric" className="w-full h-full object-contain rounded-lg" />
                            ) : (
                                <>
                                    <i className="fas fa-layer-group text-5xl text-gray-300 mb-4"></i>
                                    <p className="text-gray-500 font-medium">Drop your fabric image here</p>
                                    <p className="text-xs text-gray-400 mt-2">Supports JPG, PNG</p>
                                </>
                            )}
                            <input type="file" accept="image/*" onChange={handleUpload} className="absolute inset-0 opacity-0 cursor-pointer" />
                        </div>
                    </Card>
                    <Button onClick={handleAnalyze} disabled={!file || loading} className="w-full py-4 text-lg shadow-xl">
                        {loading ? <><i className="fas fa-spinner fa-spin"></i> Analyzing Texture...</> : 'Analyze Fabric'}
                    </Button>
                </div>

                {/* Results Section */}
                <div className="space-y-6">
                    {analysis ? (
                        <div className="animate-fade-in-down space-y-6">
                            <Card className="border-l-4 border-indigo-600">
                                <h3 className="text-2xl font-bold mb-4 font-serif">{analysis.material} <span className="text-lg font-sans font-normal text-gray-500">({analysis.weave})</span></h3>
                                <div className="flex flex-wrap gap-2 mb-4">
                                    <Badge type="info">{analysis.pattern}</Badge>
                                    {analysis.colors?.map((c: string) => <Badge key={c} type="neutral">{c}</Badge>)}
                                </div>
                                <div className="bg-gray-50 p-4 rounded-lg">
                                    <p className="text-xs font-bold text-gray-500 uppercase mb-2">Care Instructions</p>
                                    <p className="text-sm text-gray-700">{analysis.careInstructions}</p>
                                </div>
                            </Card>

                            <div>
                                <h3 className="text-xl font-bold mb-4">Recommended Styles</h3>
                                <div className="space-y-4">
                                    {analysis.recommendedStyles?.map((style: any, i: number) => (
                                        <Card key={i} className="flex justify-between items-center hover:shadow-md transition-shadow cursor-pointer" onClick={() => navigate(AppView.CUSTOMER_DASHBOARD)}>
                                            <div>
                                                <h4 className="font-bold text-lg">{style.name}</h4>
                                                <p className="text-sm text-gray-500">{style.description}</p>
                                            </div>
                                            <div className="bg-indigo-50 w-10 h-10 rounded-full flex items-center justify-center text-indigo-600">
                                                <i className="fas fa-chevron-right"></i>
                                            </div>
                                        </Card>
                                    ))}
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="h-full flex flex-col items-center justify-center text-gray-400 border-2 border-dashed border-gray-200 rounded-xl bg-gray-50/50 p-8 text-center">
                            <i className="fas fa-magic text-4xl mb-4 text-gray-300"></i>
                            <p>AI Analysis results will appear here.</p>
                            <p className="text-xs mt-2 max-w-xs">We analyze weave density, pattern complexity, and drape to suggest the best tailored outcomes.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

// --- Virtual Fitting Room View ---
export const VirtualFittingView = () => {
    const { user, saveLook, navigate, tailorInventory } = useApp();
    const [modelImage, setModelImage] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [garmentType, setGarmentType] = useState('Suit');
    const [description, setDescription] = useState('');
    const [selectedFabric, setSelectedFabric] = useState<Material | null>(null);
    const [generating, setGenerating] = useState(false);
    const [generatedImage, setGeneratedImage] = useState<string | null>(null);
    const [generatedVideo, setGeneratedVideo] = useState<string | null>(null);
    const [makingVideo, setMakingVideo] = useState(false);

    // Combine global mock inventory for demo purposes
    const allFabrics = MOCK_TAILORS.flatMap(t => t.inventory || []);
    // Remove duplicates by ID
    const uniqueFabrics = Array.from(new Map(allFabrics.map(f => [f.id, f])).values());

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setModelImage(e.target.files[0]);
            setPreviewUrl(URL.createObjectURL(e.target.files[0]));
            setGeneratedImage(null);
            setGeneratedVideo(null);
        }
    };

    const handleGenerate = async () => {
        if (!modelImage || !selectedFabric) return;
        setGenerating(true);
        setGeneratedVideo(null);
        try {
            const prompt = `A highly detailed, photorealistic image of the person in the provided photo wearing a custom-tailored ${garmentType}. 
            The garment is made of ${selectedFabric.color} ${selectedFabric.name} fabric with a ${selectedFabric.type} texture.
            ${description ? `Additional details: ${description}.` : ''}
            Ensure the fit is perfect and tailored. Lighting should be professional fashion studio lighting.`;
            
            const result = await generateStylePreview(modelImage, prompt, selectedFabric.name, selectedFabric.color);
            if (result) {
                setGeneratedImage(result);
            }
        } catch (e) {
            console.error("Generation failed", e);
            alert("Failed to generate image. Please try again.");
        }
        setGenerating(false);
    };

    const handleRunway = async () => {
        if (!generatedImage) return;
        
        if ((window as any).aistudio && (window as any).aistudio.hasSelectedApiKey) {
            const hasKey = await (window as any).aistudio.hasSelectedApiKey();
            if (!hasKey) {
                try {
                    const success = await (window as any).aistudio.openSelectKey();
                    if (!success) return; 
                } catch (e) {
                    console.error("API Key selection failed", e);
                    alert("Please select a paid API Key to use Veo Video Generation.");
                    return;
                }
            }
        }

        setMakingVideo(true);
        try {
            const videoUrl = await generateRunwayVideo(generatedImage);
            if (videoUrl) {
                setGeneratedVideo(videoUrl);
            }
        } catch (e) {
            console.error("Video failed", e);
            alert("Could not generate runway video. Please try again later.");
        }
        setMakingVideo(false);
    };

    const handleSave = () => {
        if (generatedImage && user) {
            saveLook({
                id: `look-${Date.now()}`,
                imageUrl: generatedImage,
                date: new Date().toISOString().split('T')[0],
                description: `${garmentType} in ${selectedFabric?.name}`,
                fabricName: selectedFabric?.name
            });
        }
    };

    return (
        <div className="max-w-6xl mx-auto h-[calc(100vh-100px)] flex flex-col md:flex-row gap-6">
            <div className="w-full md:w-1/3 flex flex-col gap-4 overflow-y-auto pr-2">
                <Card className="flex-shrink-0">
                    <h3 className="font-bold text-lg mb-4">1. Choose Your Model</h3>
                    <div className="relative border-2 border-dashed border-gray-300 rounded-xl h-48 bg-gray-50 flex items-center justify-center overflow-hidden group cursor-pointer">
                        <input type="file" accept="image/*" onChange={handleImageUpload} className="absolute inset-0 opacity-0 cursor-pointer z-10" />
                        {previewUrl ? (
                            <img src={previewUrl} alt="Model" className="w-full h-full object-cover" />
                        ) : (
                            <div className="text-center text-gray-400">
                                <i className="fas fa-camera text-3xl mb-2"></i>
                                <p className="text-sm">Upload full body photo</p>
                            </div>
                        )}
                    </div>
                </Card>

                <Card className="flex-shrink-0">
                    <h3 className="font-bold text-lg mb-4">2. Design Garment</h3>
                    <div className="space-y-4">
                        <div className="flex flex-col gap-1">
                            <label className="text-xs font-bold text-gray-500 uppercase">Garment Type</label>
                            <select 
                                value={garmentType} 
                                onChange={(e) => setGarmentType(e.target.value)}
                                className="w-full p-2 border border-gray-300 rounded-lg bg-white outline-none focus:ring-2 focus:ring-indigo-500"
                            >
                                {['Bespoke Suit', 'Evening Gown', 'Tuxedo', 'Summer Dress', 'Blazer & Chinos', 'Traditional Wear', 'Overcoat'].map(opt => (
                                    <option key={opt} value={opt}>{opt}</option>
                                ))}
                            </select>
                        </div>
                        <Input 
                            label="Specific Details (Optional)" 
                            placeholder="e.g. wide lapels, pearl buttons, knee length" 
                            value={description}
                            onChange={(e: any) => setDescription(e.target.value)}
                        />
                    </div>
                </Card>

                <Card className="flex-grow flex flex-col">
                    <h3 className="font-bold text-lg mb-4">3. Select Fabric</h3>
                    <div className="grid grid-cols-2 gap-2 overflow-y-auto max-h-64 pr-1">
                        {uniqueFabrics.map(fab => (
                            <div 
                                key={fab.id} 
                                onClick={() => setSelectedFabric(fab)}
                                className={`border rounded p-2 cursor-pointer transition-all flex flex-col gap-2 ${selectedFabric?.id === fab.id ? 'border-indigo-600 bg-indigo-50 ring-1 ring-indigo-600' : 'border-gray-200 hover:border-gray-300'}`}
                            >
                                <img src={fab.image} alt={fab.name} className="w-full h-16 object-cover rounded bg-gray-200" />
                                <div>
                                    <p className="text-xs font-bold truncate">{fab.name}</p>
                                    <p className="text-[10px] text-gray-500">{fab.color} • {fab.type}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </Card>
                
                <Button 
                    onClick={handleGenerate} 
                    disabled={generating || !modelImage || !selectedFabric} 
                    className="w-full py-4 shadow-xl"
                >
                    {generating ? <><i className="fas fa-spinner fa-spin"></i> Sewing...</> : <><i className="fas fa-magic"></i> Try On Now</>}
                </Button>
            </div>

            <div className="flex-1 bg-gray-900 rounded-2xl relative overflow-hidden flex items-center justify-center shadow-2xl">
                {generatedVideo ? (
                    <video src={generatedVideo} autoPlay loop controls className="w-full h-full object-contain bg-black" />
                ) : generatedImage ? (
                    <img src={generatedImage} alt="Generated Fit" className="w-full h-full object-contain" />
                ) : (
                    <div className="text-center text-gray-600">
                        {previewUrl ? (
                            <div className="relative">
                                <img src={previewUrl} alt="Base" className="max-h-[600px] opacity-20" />
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <p className="text-gray-400 bg-black/50 px-4 py-2 rounded">Ready to visualize</p>
                                </div>
                            </div>
                        ) : (
                            <>
                                <i className="fas fa-tshirt text-6xl mb-4 opacity-20"></i>
                                <p className="text-gray-500">Virtual Mirror</p>
                            </>
                        )}
                    </div>
                )}

                {generatedImage && (
                    <div className="absolute bottom-0 left-0 w-full p-6 bg-gradient-to-t from-black/80 to-transparent flex justify-between items-end">
                        <div className="text-white">
                            <h3 className="font-bold text-xl">{garmentType}</h3>
                            <p className="text-sm opacity-80">{selectedFabric?.name}</p>
                        </div>
                        <div className="flex gap-3">
                            {!generatedVideo && (
                                <Button 
                                    onClick={handleRunway} 
                                    disabled={makingVideo}
                                    className="bg-purple-600 hover:bg-purple-700 border-none text-white"
                                >
                                    {makingVideo ? <i className="fas fa-spinner fa-spin"></i> : <><i className="fas fa-video mr-2"></i> Runway Walk (Veo)</>}
                                </Button>
                            )}
                            <Button variant="secondary" onClick={() => { setGeneratedImage(null); setGeneratedVideo(null); }}>Clear</Button>
                            <Button onClick={handleSave} className="bg-white text-gray-900 hover:bg-gray-100 border-none">
                                <i className="fas fa-heart text-red-500 mr-2"></i> Save Look
                            </Button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

// --- Customer Dashboard ---
export const CustomerDashboard = () => {
  const { selectTailor, user, appointments, tailors, navigate } = useApp();
  const [search, setSearch] = useState('');
  const [location, setLocation] = useState<{lat: number, lng: number} | null>(null);
  const [loading, setLoading] = useState(false);
  const [groundingResults, setGroundingResults] = useState<any[]>([]);

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
        console.warn("Location not available, using default");
    }
    setLoading(true);
    if (location && search) {
        const results = await searchTailorsNearby(search, location.lat, location.lng);
        setGroundingResults(results.grounding || []);
    }
    setTimeout(() => setLoading(false), 800);
  };

  const filteredTailors = tailors.filter(t => 
    t.name.toLowerCase().includes(search.toLowerCase()) || 
    t.specialties.some(s => s.toLowerCase().includes(search.toLowerCase()))
  );

  const myAppointments = appointments.filter(a => a.customerId === user?.id);

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="col-span-2 bg-gray-900 text-white p-8 rounded-2xl relative overflow-hidden flex flex-col justify-center">
            <div className="relative z-10 max-w-2xl">
                <h2 className="text-3xl font-bold font-serif mb-2">Welcome back, {user?.name}</h2>
                <p className="text-gray-400 mb-6">Ready to find your next perfect fit?</p>
                
                <div className="flex gap-2">
                    <input 
                        type="text" 
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Search for suits, dresses, alterations..." 
                        className="flex-1 px-4 py-3 rounded-lg text-gray-900 outline-none text-gray-800"
                        onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                    />
                    <Button onClick={handleSearch} variant="accent" className="px-8">
                        {loading ? <i className="fas fa-spinner fa-spin"></i> : <i className="fas fa-search"></i>}
                    </Button>
                </div>
            </div>
            <div className="absolute right-0 top-0 h-full w-1/3 bg-gradient-to-l from-indigo-900 to-transparent opacity-50"></div>
          </div>

          <div className="flex flex-col gap-4">
            <div className="bg-gradient-to-br from-indigo-600 to-indigo-800 text-white rounded-2xl p-6 relative overflow-hidden flex-1">
                <div className="relative z-10">
                    <div className="flex justify-between items-start mb-4">
                        <h3 className="font-bold text-lg"><i className="fas fa-crown text-yellow-300 mr-2"></i> Tailor Rewards</h3>
                        <span className="bg-white/20 px-2 py-1 rounded text-xs">Gold Member</span>
                    </div>
                    <div className="text-4xl font-bold mb-2">{user?.loyaltyPoints || 0}</div>
                    <p className="text-indigo-200 text-sm mb-4">Points Available</p>
                    <div className="w-full bg-indigo-900/30 h-1.5 rounded-full overflow-hidden">
                        <div className="bg-yellow-400 h-full w-3/4"></div>
                    </div>
                    <p className="text-[10px] text-indigo-200 mt-2">50 points until next reward</p>
                </div>
                <div className="absolute -bottom-4 -right-4 text-9xl text-white opacity-10 rotate-12">
                    <i className="fas fa-gem"></i>
                </div>
            </div>
            
            <div className="grid grid-cols-3 gap-2">
                <button 
                    onClick={() => navigate(AppView.LIVE_STYLIST)}
                    className="bg-white border border-indigo-200 rounded-xl p-2 flex flex-col items-center justify-center hover:shadow-lg transition-all group text-center"
                >
                    <div className="w-8 h-8 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center mb-1">
                        <i className="fas fa-microphone-alt"></i>
                    </div>
                    <p className="font-bold text-gray-900 text-[10px]">Stylist</p>
                </button>
                <button 
                    onClick={() => navigate(AppView.VIRTUAL_FITTING)}
                    className="bg-white border border-indigo-200 rounded-xl p-2 flex flex-col items-center justify-center hover:shadow-lg transition-all group text-center"
                >
                    <div className="w-8 h-8 rounded-full bg-purple-50 text-purple-600 flex items-center justify-center mb-1">
                        <i className="fas fa-tshirt"></i>
                    </div>
                    <p className="font-bold text-gray-900 text-[10px]">Fitting</p>
                </button>
                <button 
                    onClick={() => navigate(AppView.FABRIC_SCANNER)}
                    className="bg-white border border-indigo-200 rounded-xl p-2 flex flex-col items-center justify-center hover:shadow-lg transition-all group text-center"
                >
                    <div className="w-8 h-8 rounded-full bg-pink-50 text-pink-600 flex items-center justify-center mb-1">
                        <i className="fas fa-search-plus"></i>
                    </div>
                    <p className="font-bold text-gray-900 text-[10px]">Scanner</p>
                </button>
            </div>
          </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
         <div className="lg:col-span-2 space-y-8">
             {groundingResults.length > 0 && (
                <div className="mb-8">
                    <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                        <i className="fab fa-google text-blue-500"></i> Places near you
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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

         <div className="space-y-6">
            <Card>
                <h3 className="font-bold mb-4">Upcoming Appointments</h3>
                {myAppointments.length > 0 ? (
                    <div className="space-y-3">
                        {myAppointments.map(apt => (
                            <div key={apt.id} className="flex gap-3 items-start p-3 bg-gray-50 rounded-lg border border-gray-100">
                                <div className="bg-indigo-100 text-indigo-600 w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 font-bold">
                                    {apt.date.split('-')[2]}
                                </div>
                                <div>
                                    <p className="font-bold text-sm">{apt.type}</p>
                                    <p className="text-xs text-gray-500">with {apt.tailorName}</p>
                                    <p className="text-xs font-medium text-gray-700 mt-1"><i className="fas fa-clock"></i> {apt.time}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <p className="text-sm text-gray-400 italic">No upcoming sessions.</p>
                )}
            </Card>
         </div>
      </div>
    </div>
  );
};

// --- Tailor Details View ---
export const TailorDetails = () => {
  const { activeTailor, openChat, navigate, selectMaterial, createDraftOrder, addReview, user } = useApp();
  const [activeTab, setActiveTab] = useState('portfolio');
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');

  if (!activeTailor) return null;

  const handleCreateOrder = (material: Material) => {
    selectMaterial(material);
    createDraftOrder({
        tailorId: activeTailor.id,
        tailorName: activeTailor.businessName,
        service: 'Custom Order',
        amount: activeTailor.pricing.base + material.pricePerMeter * 3, // Approx 3 meters
        materialId: material.id,
        materialName: material.name
    });
  };

  return (
    <div className="max-w-5xl mx-auto">
        <div className="flex flex-col md:flex-row gap-8 mb-8">
            <div className="w-full md:w-1/3">
                <img src={activeTailor.image} alt={activeTailor.name} className="w-full rounded-2xl shadow-lg mb-4" />
                <div className="flex gap-2 mb-4">
                     <Button onClick={() => navigate(AppView.APPOINTMENTS)} className="flex-1">Book Now</Button>
                     <Button onClick={() => openChat(activeTailor.id, activeTailor.businessName)} variant="secondary" className="flex-1">Message</Button>
                </div>
            </div>
            <div className="flex-1">
                <h1 className="text-4xl font-bold font-serif mb-2">{activeTailor.businessName}</h1>
                <p className="text-lg text-gray-600 mb-4">{activeTailor.name}</p>
                
                <div className="flex items-center gap-4 mb-6">
                    <div className="flex items-center gap-1 text-yellow-500">
                        <i className="fas fa-star"></i>
                        <span className="font-bold text-gray-900">{activeTailor.rating}</span>
                        <span className="text-gray-400 text-sm">({activeTailor.reviews} reviews)</span>
                    </div>
                    <span className="text-gray-300">|</span>
                    <span className="text-gray-600"><i className="fas fa-map-marker-alt mr-1"></i> {activeTailor.location}</span>
                </div>

                <div className="flex flex-wrap gap-2 mb-8">
                    {activeTailor.specialties.map(s => <Badge key={s} type="neutral">{s}</Badge>)}
                </div>

                <div className="border-b border-gray-200 mb-6">
                    {['portfolio', 'materials', 'reviews'].map(tab => (
                        <button 
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`px-6 py-3 font-medium capitalize border-b-2 transition-colors ${activeTab === tab ? 'border-gray-900 text-gray-900' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                        >
                            {tab}
                        </button>
                    ))}
                </div>

                {activeTab === 'portfolio' && (
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        {activeTailor.portfolio.map((img, i) => (
                            <img key={i} src={img} alt="Portfolio" className="w-full h-48 object-cover rounded-lg hover:opacity-90 transition-opacity cursor-pointer" />
                        ))}
                    </div>
                )}

                {activeTab === 'materials' && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {activeTailor.inventory && activeTailor.inventory.length > 0 ? activeTailor.inventory.map(mat => (
                            <div key={mat.id} className="flex gap-4 p-4 border border-gray-200 rounded-lg hover:border-indigo-200 hover:shadow-md transition-all">
                                <img src={mat.image} alt={mat.name} className="w-16 h-16 object-cover rounded bg-gray-100" />
                                <div className="flex-1">
                                    <h4 className="font-bold">{mat.name}</h4>
                                    <p className="text-sm text-gray-500">{mat.type} • {mat.color}</p>
                                    <div className="flex justify-between items-center mt-2">
                                        <span className="font-bold text-indigo-600">${mat.pricePerMeter}/m</span>
                                        <button onClick={() => handleCreateOrder(mat)} className="text-xs bg-gray-900 text-white px-3 py-1 rounded hover:bg-gray-700">Select</button>
                                    </div>
                                </div>
                            </div>
                        )) : (
                            <p className="text-gray-500 italic">No materials listed currently.</p>
                        )}
                    </div>
                )}

                {activeTab === 'reviews' && (
                    <div className="space-y-6">
                        {user && user.role === UserRole.CUSTOMER && (
                             <div className="bg-gray-50 p-4 rounded-lg mb-6">
                                 <h4 className="font-bold mb-2">Write a Review</h4>
                                 <div className="mb-2"><StarRating rating={reviewRating} setRating={setReviewRating} /></div>
                                 <textarea 
                                    className="w-full p-2 border border-gray-300 rounded mb-2 text-sm" 
                                    placeholder="Share your experience..."
                                    value={reviewComment}
                                    onChange={(e) => setReviewComment(e.target.value)}
                                 ></textarea>
                                 <Button onClick={() => { addReview(activeTailor.id, reviewRating, reviewComment); setReviewComment(''); }} className="text-xs py-1.5">Submit</Button>
                             </div>
                        )}
                        {activeTailor.reviewsList && activeTailor.reviewsList.length > 0 ? activeTailor.reviewsList.map(review => (
                            <div key={review.id} className="border-b border-gray-100 pb-4">
                                <div className="flex justify-between mb-1">
                                    <span className="font-bold">{review.customerName}</span>
                                    <span className="text-xs text-gray-400">{review.date}</span>
                                </div>
                                <StarRating rating={review.rating} readOnly />
                                <p className="text-gray-600 mt-2 text-sm">{review.comment}</p>
                            </div>
                        )) : <p className="text-gray-500 italic">No reviews yet.</p>}
                    </div>
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
                    <div className="grid grid-cols-2 gap-6">
                         {Object.keys(measurements).map(key => (
                             <Input 
                                key={key} 
                                label={`${key.charAt(0).toUpperCase() + key.slice(1)} (cm)`} 
                                value={measurements[key]} 
                                onChange={(e: any) => setMeasurements({...measurements, [key]: Number(e.target.value)})} 
                                type="number" 
                             />
                         ))}
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
    const { orders, releaseEscrow, user } = useApp();
    
    // Filter orders if customer
    const myOrders = user?.role === UserRole.CUSTOMER 
        ? orders.filter(o => !o.customerName || o.customerName === user.name || true) // Simplified: showing all for demo or filtering by mock user logic
        : orders;

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <h2 className="text-3xl font-bold font-serif mb-6">Order History</h2>
            {myOrders.map(order => (
                <Card key={order.id} className="flex flex-col md:flex-row gap-6">
                    <img src={order.thumbnail} alt="Order" className="w-full md:w-32 h-32 object-cover rounded-lg bg-gray-100" />
                    <div className="flex-1">
                        <div className="flex justify-between items-start mb-2">
                            <div>
                                <h3 className="font-bold text-lg">{order.service}</h3>
                                <p className="text-gray-500 text-sm">{order.tailorName}</p>
                            </div>
                            <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                                order.status === OrderStatus.COMPLETED ? 'bg-green-100 text-green-700' : 'bg-indigo-100 text-indigo-700'
                            }`}>
                                {order.status}
                            </span>
                        </div>
                        
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 my-4 text-sm">
                            <div>
                                <p className="text-gray-500">Date</p>
                                <p className="font-medium">{order.date}</p>
                            </div>
                            <div>
                                <p className="text-gray-500">Total</p>
                                <p className="font-medium">${order.amount}</p>
                            </div>
                             <div>
                                <p className="text-gray-500">Payment</p>
                                <p className={`font-medium ${order.paymentStatus === PaymentStatus.RELEASED ? 'text-green-600' : 'text-orange-600'}`}>
                                    {order.paymentStatus.replace(/_/g, ' ')}
                                </p>
                            </div>
                        </div>

                        {order.rider && (
                            <div className="bg-gray-50 p-3 rounded-lg flex items-center gap-3 mb-4 border border-gray-200">
                                <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-sm text-indigo-600">
                                    <i className="fas fa-motorcycle"></i>
                                </div>
                                <div>
                                    <p className="text-xs font-bold text-gray-500 uppercase">Delivery Partner</p>
                                    <p className="text-sm font-bold">{order.rider.name} • {order.rider.vehicle}</p>
                                </div>
                                <a href={`tel:${order.rider.phone}`} className="ml-auto w-8 h-8 flex items-center justify-center bg-green-100 text-green-600 rounded-full hover:bg-green-200">
                                    <i className="fas fa-phone"></i>
                                </a>
                            </div>
                        )}
                        
                        <div className="flex justify-end gap-3">
                            <Button variant="secondary" className="text-xs">Invoice</Button>
                            {order.status === OrderStatus.READY_FOR_FITTING && (
                                <Button className="text-xs">Schedule Fitting</Button>
                            )}
                            {order.paymentStatus === PaymentStatus.HELD_IN_ESCROW && user?.role === UserRole.CUSTOMER && (
                                <Button onClick={() => releaseEscrow(order.id)} className="text-xs bg-green-600 hover:bg-green-700 text-white border-none">Release Payment</Button>
                            )}
                        </div>
                    </div>
                </Card>
            ))}
        </div>
    );
};

// --- Tailor Dashboard ---
export const TailorDashboard = () => {
    const { user, orders, updateOrderStatus, tailorInventory, addInventoryItem, updatePortfolio, simulateOrderProgress } = useApp();
    const [activeTab, setActiveTab] = useState('orders');
    const [newMat, setNewMat] = useState<Partial<Material>>({});
    const [portfolioUrl, setPortfolioUrl] = useState('');

    if (!user || user.role !== UserRole.TAILOR) return null;

    const myOrders = orders.filter(o => o.tailorId === user.id);

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
                        <p className="text-3xl font-bold text-gray-900">4.9</p>
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
                            <div className="flex gap-2 mb-6 p-4 bg-gray-50 rounded-lg">
                                <Input placeholder="Item Name" value={newMat.name || ''} onChange={(e: any) => setNewMat({...newMat, name: e.target.value})} className="flex-1" />
                                <Input placeholder="Type" value={newMat.type || ''} onChange={(e: any) => setNewMat({...newMat, type: e.target.value})} className="w-32" />
                                <Input placeholder="Price/m" type="number" value={newMat.pricePerMeter || ''} onChange={(e: any) => setNewMat({...newMat, pricePerMeter: Number(e.target.value)})} className="w-24" />
                                <Button onClick={() => { addInventoryItem(newMat); setNewMat({}); }}>Add</Button>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                                {tailorInventory.map(item => (
                                    <div key={item.id} className="border border-gray-200 p-4 rounded-lg flex items-center gap-3">
                                        <div className="w-12 h-12 bg-gray-200 rounded"></div>
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
                                 {/* In a real app, we would map the user's real portfolio here. Using mock for visual structure. */}
                                 {[1,2,3].map(i => (
                                     <div key={i} className="h-40 bg-gray-100 rounded-lg relative group">
                                         <button className="absolute top-2 right-2 bg-white p-1 rounded-full shadow text-red-500 opacity-0 group-hover:opacity-100 transition-opacity">
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

// --- Chat View ---
export const ChatView = () => {
    const { chats, activeChatId, openChat, user, sendMessage } = useApp();
    const [input, setInput] = useState('');
    const [suggestions, setSuggestions] = useState<string[]>([]);
    
    const activeChat = chats.find(c => c.id === activeChatId);
    const messagesEndRef = useRef<null | HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
        if (activeChat && activeChat.messages.length > 0 && user) {
            const lastMsg = activeChat.messages[activeChat.messages.length - 1];
            if (lastMsg.senderId !== user.id) {
                 getChatSuggestions(lastMsg.text, user.role).then(setSuggestions);
            } else {
                setSuggestions([]);
            }
        }
    }, [activeChat, user]);

    const handleSend = (text: string = input) => {
        if (!text.trim()) return;
        sendMessage(text);
        setInput('');
        setSuggestions([]);
    };

    if (!user) return null;

    return (
        <div className="h-[calc(100vh-140px)] flex gap-6 bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="w-1/3 border-r border-gray-100 flex flex-col">
                <div className="p-4 border-b border-gray-100 font-bold text-lg">Messages</div>
                <div className="flex-1 overflow-y-auto">
                    {chats.map(chat => {
                        const otherId = chat.participants.find(p => p !== user.id) || '';
                        const name = chat.participantNames[otherId] || 'User';
                        return (
                            <div 
                                key={chat.id} 
                                onClick={() => openChat(otherId, name)}
                                className={`p-4 border-b border-gray-50 cursor-pointer hover:bg-gray-50 transition-colors ${activeChatId === chat.id ? 'bg-indigo-50 border-l-4 border-indigo-500' : ''}`}
                            >
                                <div className="flex justify-between mb-1">
                                    <span className="font-bold">{name}</span>
                                    <span className="text-xs text-gray-400">10:00</span>
                                </div>
                                <p className="text-sm text-gray-500 truncate">{chat.lastMessage || 'Start conversation'}</p>
                            </div>
                        );
                    })}
                </div>
            </div>
            
            <div className="flex-1 flex flex-col bg-gray-50">
                {activeChat ? (
                    <>
                        <div className="p-4 bg-white border-b border-gray-100 shadow-sm flex justify-between items-center">
                            <span className="font-bold">{activeChat.participantNames[activeChat.participants.find(p => p !== user.id) || '']}</span>
                            <i className="fas fa-ellipsis-h text-gray-400 cursor-pointer"></i>
                        </div>
                        
                        <div className="flex-1 overflow-y-auto p-4 space-y-4">
                            {activeChat.messages.map(msg => (
                                <div key={msg.id} className={`flex ${msg.senderId === user.id ? 'justify-end' : 'justify-start'}`}>
                                    <div className={`max-w-[70%] p-3 rounded-2xl text-sm ${msg.senderId === user.id ? 'bg-indigo-600 text-white rounded-br-none' : 'bg-white text-gray-800 shadow-sm rounded-bl-none'}`}>
                                        {msg.text}
                                    </div>
                                </div>
                            ))}
                            <div ref={messagesEndRef} />
                        </div>

                        <div className="p-4">
                            {suggestions.length > 0 && (
                                <div className="flex gap-2 mb-3 overflow-x-auto pb-2">
                                    {suggestions.map((s, i) => (
                                        <button 
                                            key={i} 
                                            onClick={() => handleSend(s)}
                                            className="whitespace-nowrap bg-indigo-100 text-indigo-700 px-3 py-1 rounded-full text-xs hover:bg-indigo-200 transition-colors"
                                        >
                                            <i className="fas fa-magic mr-1"></i> {s}
                                        </button>
                                    ))}
                                </div>
                            )}
                            <div className="flex gap-2 bg-white p-2 rounded-xl border border-gray-200 shadow-sm">
                                <input 
                                    className="flex-1 outline-none px-2"
                                    placeholder="Type a message..."
                                    value={input}
                                    onChange={(e) => setInput(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                                />
                                <button onClick={() => handleSend()} className="w-10 h-10 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 flex items-center justify-center">
                                    <i className="fas fa-paper-plane"></i>
                                </button>
                            </div>
                        </div>
                    </>
                ) : (
                    <div className="flex-1 flex flex-col items-center justify-center text-gray-400">
                        <i className="fas fa-comments text-5xl mb-4 text-gray-300"></i>
                        <p>Select a conversation to start chatting</p>
                    </div>
                )}
            </div>
        </div>
    );
};

// --- Payment View ---
export const PaymentView = () => {
    const { draftOrder, completeOrder, user } = useApp();
    const [method, setMethod] = useState('card');

    if (!draftOrder) return null;

    return (
        <div className="max-w-md mx-auto mt-8">
             <Card>
                 <h2 className="text-xl font-bold mb-6">Checkout</h2>
                 
                 <div className="space-y-4 mb-6">
                     <div className="flex justify-between text-sm">
                         <span className="text-gray-600">Service</span>
                         <span className="font-medium">{draftOrder.service}</span>
                     </div>
                     <div className="flex justify-between text-sm">
                         <span className="text-gray-600">Material</span>
                         <span className="font-medium">{draftOrder.materialName}</span>
                     </div>
                     <div className="border-t border-gray-100 pt-4 flex justify-between text-lg font-bold">
                         <span>Total</span>
                         <span>${draftOrder.amount}</span>
                     </div>
                 </div>

                 <div className="space-y-3 mb-8">
                     <label className={`flex items-center gap-3 p-4 border rounded-lg cursor-pointer ${method === 'card' ? 'border-indigo-500 bg-indigo-50' : 'border-gray-200'}`}>
                         <input type="radio" name="pay" checked={method === 'card'} onChange={() => setMethod('card')} />
                         <i className="fas fa-credit-card text-gray-500"></i>
                         <span className="font-medium">Credit Card</span>
                     </label>
                     <label className={`flex items-center gap-3 p-4 border rounded-lg cursor-pointer ${method === 'points' ? 'border-indigo-500 bg-indigo-50' : 'border-gray-200'}`}>
                         <input type="radio" name="pay" checked={method === 'points'} onChange={() => setMethod('points')} />
                         <i className="fas fa-crown text-yellow-500"></i>
                         <span className="font-medium">Redeem Points ({user?.loyaltyPoints})</span>
                     </label>
                 </div>

                 <Button onClick={() => completeOrder(method === 'points' ? 100 : 0)} className="w-full py-3">
                     Secure Payment <i className="fas fa-lock ml-2 text-xs"></i>
                 </Button>
                 <p className="text-xs text-center text-gray-400 mt-4">Funds are held in escrow until you approve the work.</p>
             </Card>
        </div>
    );
};

// --- Appointment View ---
export const AppointmentView = () => {
    const { activeTailor, bookAppointment } = useApp();
    const [date, setDate] = useState('');
    const [time, setTime] = useState('');
    const [type, setType] = useState('MEASUREMENT');

    if (!activeTailor) return null;

    return (
        <div className="max-w-lg mx-auto mt-10">
            <Card>
                <div className="text-center mb-6">
                    <img src={activeTailor.image} alt="Tailor" className="w-16 h-16 rounded-full mx-auto mb-2 bg-gray-200 object-cover" />
                    <h2 className="text-xl font-bold">Book Appointment</h2>
                    <p className="text-gray-500">{activeTailor.businessName}</p>
                </div>

                <div className="space-y-4 mb-6">
                    <Input label="Date" type="date" value={date} onChange={(e: any) => setDate(e.target.value)} />
                    <Input label="Time" type="time" value={time} onChange={(e: any) => setTime(e.target.value)} />
                    <div className="flex flex-col gap-1.5">
                        <label className="text-sm font-semibold text-gray-700">Type</label>
                        <select 
                            value={type} 
                            onChange={(e) => setType(e.target.value)}
                            className="w-full px-4 py-2.5 rounded-lg border border-gray-700 bg-gray-800 text-white"
                        >
                            <option value="MEASUREMENT">Measurement Session</option>
                            <option value="FITTING">First Fitting</option>
                            <option value="CONSULTATION">Style Consultation</option>
                        </select>
                    </div>
                </div>

                <Button onClick={() => bookAppointment({ date, time, type: type as any })} className="w-full">
                    Confirm Booking
                </Button>
            </Card>
        </div>
    );
};

// --- Live Stylist View ---
export const LiveStylistView = () => {
    const [connected, setConnected] = useState(false);
    const [volume, setVolume] = useState(0);
    const [logs, setLogs] = useState<string[]>([]);
    const audioContextRef = useRef<AudioContext | null>(null);
    const mediaStreamRef = useRef<MediaStream | null>(null);
    const processorRef = useRef<ScriptProcessorNode | null>(null);
    const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
    
    // Playback state
    const nextStartTimeRef = useRef<number>(0);
    const outputAudioContextRef = useRef<AudioContext | null>(null);

    const log = (msg: string) => setLogs(prev => [...prev, msg]);

    // Audio Helpers
    const createBlob = (data: Float32Array): Blob => {
        const l = data.length;
        const int16 = new Int16Array(l);
        for (let i = 0; i < l; i++) {
            int16[i] = data[i] * 32768;
        }
        let binary = '';
        const len = int16.buffer.byteLength;
        const bytes = new Uint8Array(int16.buffer);
        for (let i = 0; i < len; i++) {
            binary += String.fromCharCode(bytes[i]);
        }
        return {
            data: btoa(binary),
            mimeType: 'audio/pcm;rate=16000',
        };
    };

    const decode = (base64: string) => {
        const binaryString = atob(base64);
        const len = binaryString.length;
        const bytes = new Uint8Array(len);
        for (let i = 0; i < len; i++) {
            bytes[i] = binaryString.charCodeAt(i);
        }
        return bytes;
    };

    const decodeAudioData = async (data: Uint8Array, ctx: AudioContext) => {
        const dataInt16 = new Int16Array(data.buffer);
        const frameCount = dataInt16.length; 
        const buffer = ctx.createBuffer(1, frameCount, 24000);
        const channelData = buffer.getChannelData(0);
        for (let i = 0; i < frameCount; i++) {
            channelData[i] = dataInt16[i] / 32768.0;
        }
        return buffer;
    };

    const handleConnect = async () => {
        if (connected) return;
        
        try {
            log("Initializing...");
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
            
            // Setup Audio Contexts
            const inputCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
            audioContextRef.current = inputCtx;
            
            const outputCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
            outputAudioContextRef.current = outputCtx;
            const outputNode = outputCtx.createGain();
            outputNode.connect(outputCtx.destination);
            
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            mediaStreamRef.current = stream;

            const sessionPromise = ai.live.connect({
                model: 'gemini-2.5-flash-native-audio-preview-09-2025',
                callbacks: {
                    onopen: () => {
                        log("Connected to Stylist AI");
                        setConnected(true);
                        
                        // Setup input stream
                        const source = inputCtx.createMediaStreamSource(stream);
                        sourceRef.current = source;
                        
                        const processor = inputCtx.createScriptProcessor(4096, 1, 1);
                        processorRef.current = processor;
                        
                        processor.onaudioprocess = (e) => {
                            const inputData = e.inputBuffer.getChannelData(0);
                            // Visualizer simple
                            let sum = 0;
                            for(let i=0; i<inputData.length; i++) sum += Math.abs(inputData[i]);
                            setVolume(sum / inputData.length * 100);

                            const pcmBlob = createBlob(inputData);
                            sessionPromise.then(session => session.sendRealtimeInput({ media: pcmBlob }));
                        };
                        
                        source.connect(processor);
                        processor.connect(inputCtx.destination);
                    },
                    onmessage: async (msg: LiveServerMessage) => {
                        const audioData = msg.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
                        if (audioData && outputAudioContextRef.current) {
                            const ctx = outputAudioContextRef.current;
                            nextStartTimeRef.current = Math.max(nextStartTimeRef.current, ctx.currentTime);
                            
                            const audioBuffer = await decodeAudioData(decode(audioData), ctx);
                            const source = ctx.createBufferSource();
                            source.buffer = audioBuffer;
                            source.connect(outputNode);
                            source.start(nextStartTimeRef.current);
                            nextStartTimeRef.current += audioBuffer.duration;
                        }
                    },
                    onclose: () => {
                        log("Session closed");
                        setConnected(false);
                    },
                    onerror: (e) => {
                        log("Error: " + JSON.stringify(e));
                    }
                },
                config: {
                    responseModalities: [Modality.AUDIO],
                    speechConfig: {
                        voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } }
                    },
                    systemInstruction: {
                        parts: [{ text: "You are an expert fashion stylist. Give brief, high-energy advice about suits, fabrics, and trends. Be concise." }]
                    }
                }
            });

        } catch (e) {
            console.error(e);
            log("Connection failed");
        }
    };

    const handleDisconnect = () => {
        if (mediaStreamRef.current) {
            mediaStreamRef.current.getTracks().forEach(track => track.stop());
        }
        if (processorRef.current) {
            processorRef.current.disconnect();
        }
        if (sourceRef.current) {
            sourceRef.current.disconnect();
        }
        if (audioContextRef.current) {
            audioContextRef.current.close();
        }
        if (outputAudioContextRef.current) {
            outputAudioContextRef.current.close();
        }
        setConnected(false);
        log("Disconnected");
        // Reload page to clear socket state cleanly as session.close isn't exposed directly in this pattern easily without ref
        window.location.reload(); 
    };

    return (
        <div className="flex flex-col items-center justify-center h-[calc(100vh-100px)] max-w-2xl mx-auto text-center">
            <div className={`w-40 h-40 rounded-full flex items-center justify-center mb-8 transition-all duration-300 ${connected ? 'bg-indigo-100 shadow-[0_0_50px_rgba(79,70,229,0.3)]' : 'bg-gray-100'}`}>
                <div 
                    className={`w-32 h-32 rounded-full flex items-center justify-center transition-all ${connected ? 'bg-indigo-600 text-white animate-pulse' : 'bg-gray-300 text-gray-500'}`}
                    style={connected ? { transform: `scale(${1 + volume/20})` } : {}}
                >
                    <i className={`fas ${connected ? 'fa-microphone' : 'fa-microphone-slash'} text-4xl`}></i>
                </div>
            </div>

            <h2 className="text-3xl font-bold font-serif mb-4">AI Fashion Consultant</h2>
            <p className="text-gray-500 mb-8 max-w-md">
                Talk to our real-time AI stylist for advice on fabrics, cuts, and the latest trends. 
                Experience seamless voice conversation.
            </p>

            {!connected ? (
                <Button onClick={handleConnect} className="px-10 py-4 text-lg rounded-full shadow-xl">
                    <i className="fas fa-play mr-2"></i> Start Conversation
                </Button>
            ) : (
                <Button onClick={handleDisconnect} variant="outline" className="px-10 py-4 text-lg rounded-full border-red-200 text-red-500 hover:bg-red-50 hover:text-red-600">
                    <i className="fas fa-stop mr-2"></i> End Session
                </Button>
            )}
            
            <div className="mt-8 text-xs text-gray-400 font-mono h-20 overflow-hidden w-full max-w-sm">
                {logs.slice(-3).map((l, i) => <div key={i}>{l}</div>)}
            </div>
        </div>
    );
};
