import React, { useState } from 'react';
import { useApp } from '../store';
import { AppView } from '../types';

export const Layout = ({ children }: { children?: React.ReactNode }) => {
  const { user, logout, navigate, notifications, chats } = useApp();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  
  // Calculate total unread messages
  const unreadCount = chats.reduce((acc, chat) => acc + (chat.unreadCount || 0), 0);

  const handleNav = (view: AppView) => {
      navigate(view);
      setIsMenuOpen(false);
  };

  const handleLogout = () => {
      logout();
      setIsMenuOpen(false);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Navigation */}
      <nav className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            {/* Logo */}
            <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate(user ? AppView.CUSTOMER_DASHBOARD : AppView.LANDING)}>
              <div className="bg-gray-900 text-white w-8 h-8 rounded-lg flex items-center justify-center font-bold font-serif">T</div>
              <span className="text-xl font-bold font-serif tracking-tight text-gray-900">TailorConnect</span>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center gap-6">
              {user ? (
                <>
                  <button onClick={() => navigate(AppView.CUSTOMER_DASHBOARD)} className="text-gray-600 hover:text-gray-900 font-medium">Find Tailors</button>
                  <button onClick={() => navigate(AppView.VIRTUAL_FITTING)} className="text-gray-600 hover:text-gray-900 font-medium">Fitting Room</button>
                  <button onClick={() => navigate(AppView.TRACKING)} className="text-gray-600 hover:text-gray-900 font-medium">Orders</button>
                  <button onClick={() => navigate(AppView.CHAT)} className="text-gray-600 hover:text-gray-900 font-medium relative">
                    Messages
                    {unreadCount > 0 && <span className="absolute -top-1 -right-2 bg-red-500 text-white text-[10px] w-4 h-4 rounded-full flex items-center justify-center">{unreadCount}</span>}
                  </button>
                  <div className="flex items-center gap-3 pl-4 border-l border-gray-200">
                    <img 
                        src={user.avatar} 
                        alt="Profile" 
                        className="w-8 h-8 rounded-full bg-gray-200 cursor-pointer hover:ring-2 hover:ring-indigo-500"
                        onClick={() => navigate(AppView.PROFILE)}
                    />
                    <div className="flex flex-col items-start">
                        <button onClick={() => navigate(AppView.PROFILE)} className="text-sm font-medium hover:text-indigo-600">{user.name}</button>
                        <button onClick={logout} className="text-xs text-red-600 hover:text-red-700">Sign Out</button>
                    </div>
                  </div>
                </>
              ) : (
                <div className="flex gap-4">
                   <button onClick={() => navigate(AppView.AUTH)} className="text-gray-900 font-medium hover:text-gray-700">Log In</button>
                   <button onClick={() => navigate(AppView.AUTH)} className="bg-gray-900 text-white px-4 py-2 rounded-lg hover:bg-gray-800 transition-colors">Sign Up</button>
                </div>
              )}
            </div>

            {/* Mobile Menu Button */}
            <div className="md:hidden flex items-center">
                <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="text-gray-900 p-2 focus:outline-none">
                    <i className={`fas ${isMenuOpen ? 'fa-times' : 'fa-bars'} text-xl`}></i>
                </button>
            </div>
          </div>
        </div>

        {/* Mobile Dropdown Menu */}
        {isMenuOpen && (
            <div className="md:hidden bg-white border-t border-gray-100 shadow-xl absolute w-full left-0 z-50">
                <div className="px-4 py-6 space-y-4 flex flex-col">
                    {user ? (
                        <>
                            <div 
                                className="flex items-center gap-3 pb-4 border-b border-gray-100 cursor-pointer"
                                onClick={() => handleNav(AppView.PROFILE)}
                            >
                                <img src={user.avatar} alt="Profile" className="w-10 h-10 rounded-full bg-gray-200" />
                                <div>
                                    <p className="font-bold text-gray-900">{user.name}</p>
                                    <p className="text-xs text-gray-500">{user.role}</p>
                                </div>
                            </div>
                            <button onClick={() => handleNav(AppView.CUSTOMER_DASHBOARD)} className="text-left text-gray-700 font-medium py-2">
                                <i className="fas fa-search mr-3 text-gray-400"></i> Find Tailors
                            </button>
                            <button onClick={() => handleNav(AppView.VIRTUAL_FITTING)} className="text-left text-gray-700 font-medium py-2">
                                <i className="fas fa-tshirt mr-3 text-gray-400"></i> Fitting Room
                            </button>
                            <button onClick={() => handleNav(AppView.TRACKING)} className="text-left text-gray-700 font-medium py-2">
                                <i className="fas fa-box mr-3 text-gray-400"></i> Orders
                            </button>
                            <button onClick={() => handleNav(AppView.CHAT)} className="text-left text-gray-700 font-medium py-2 flex justify-between items-center">
                                <span><i className="fas fa-comment mr-3 text-gray-400"></i> Messages</span>
                                {unreadCount > 0 && <span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">{unreadCount}</span>}
                            </button>
                            <button onClick={handleLogout} className="text-left text-red-600 font-medium py-2 border-t border-gray-100 mt-2 pt-4">
                                Sign Out
                            </button>
                        </>
                    ) : (
                        <div className="flex flex-col gap-3">
                            <button onClick={() => handleNav(AppView.AUTH)} className="w-full py-3 border border-gray-200 rounded-lg font-bold">Log In</button>
                            <button onClick={() => handleNav(AppView.AUTH)} className="w-full py-3 bg-gray-900 text-white rounded-lg font-bold">Sign Up</button>
                        </div>
                    )}
                </div>
            </div>
        )}
      </nav>

      {/* Notifications */}
      <div className="fixed top-20 right-4 z-50 flex flex-col gap-2 pointer-events-none">
        {notifications.map((msg, i) => (
             <div key={i} className="bg-gray-900 text-white px-6 py-3 rounded-lg shadow-2xl animate-fade-in-down flex items-center gap-3 pointer-events-auto">
                <i className="fas fa-bell text-yellow-400"></i>
                {msg}
            </div>
        ))}
      </div>

      {/* Main Content */}
      <main className="flex-grow max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
        {children}
      </main>
      
      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 py-12 mt-12">
        <div className="max-w-7xl mx-auto px-4 text-center text-gray-500">
            <p className="font-serif text-lg text-gray-900 mb-2">TailorConnect</p>
            <p>&copy; 2023 TailorConnect. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};