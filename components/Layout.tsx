import React from 'react';
import { useApp } from '../store';
import { AppView } from '../types';

export const Layout = ({ children }: { children?: React.ReactNode }) => {
  const { user, logout, navigate, notifications } = useApp();

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Navigation */}
      <nav className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate(user ? AppView.CUSTOMER_DASHBOARD : AppView.LANDING)}>
              <div className="bg-gray-900 text-white w-8 h-8 rounded-lg flex items-center justify-center font-bold font-serif">S</div>
              <span className="text-xl font-bold font-serif tracking-tight text-gray-900">StitchConnect</span>
            </div>

            <div className="flex items-center gap-6">
              {user ? (
                <>
                  <button onClick={() => navigate(AppView.CUSTOMER_DASHBOARD)} className="text-gray-600 hover:text-gray-900 font-medium">Find Tailors</button>
                  <button onClick={() => navigate(AppView.TRACKING)} className="text-gray-600 hover:text-gray-900 font-medium">Orders</button>
                  <div className="flex items-center gap-3 pl-4 border-l border-gray-200">
                    <img src={user.avatar} alt="Profile" className="w-8 h-8 rounded-full bg-gray-200" />
                    <button onClick={logout} className="text-sm text-red-600 hover:text-red-700 font-medium">Sign Out</button>
                  </div>
                </>
              ) : (
                <div className="flex gap-4">
                   <button onClick={() => navigate(AppView.AUTH)} className="text-gray-900 font-medium hover:text-gray-700">Log In</button>
                   <button onClick={() => navigate(AppView.AUTH)} className="bg-gray-900 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-800">Get Started</button>
                </div>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>

      {/* Notifications */}
      {notifications.map((msg, idx) => (
        <div key={idx} className="fixed bottom-4 right-4 z-50">
             <div className="bg-gray-900 text-white px-4 py-3 rounded-lg shadow-lg flex items-center gap-3">
                 <i className="fas fa-info-circle"></i>
                 {msg}
             </div>
        </div>
      ))}
    </div>
  );
};