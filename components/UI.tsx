import React from 'react';

export const Button = ({ children, onClick, variant = 'primary', className = '', disabled = false }: any) => {
  const baseStyle = "px-6 py-2.5 rounded-lg font-medium transition-all duration-200 flex items-center justify-center gap-2";
  const variants = {
    primary: "bg-gray-900 text-white hover:bg-gray-800 shadow-lg hover:shadow-xl",
    secondary: "bg-white text-gray-900 border border-gray-200 hover:bg-gray-50 shadow-sm",
    accent: "bg-indigo-600 text-white hover:bg-indigo-700 shadow-md",
    outline: "border-2 border-gray-900 text-gray-900 hover:bg-gray-900 hover:text-white"
  };

  return (
    <button 
      onClick={onClick} 
      disabled={disabled}
      className={`${baseStyle} ${variants[variant as keyof typeof variants]} ${className} ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
    >
      {children}
    </button>
  );
};

export const Input = ({ label, type = "text", value, onChange, placeholder, className = '', icon }: any) => (
  <div className={`flex flex-col gap-1.5 ${className}`}>
    {label && <label className="text-sm font-semibold text-gray-700">{label}</label>}
    <div className="relative">
      <input
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className="w-full px-4 py-2.5 rounded-lg border border-gray-700 bg-gray-800 text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all placeholder-gray-400"
      />
      {icon && (
        <div className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 cursor-pointer hover:text-gray-200">
          {icon}
        </div>
      )}
    </div>
  </div>
);

export const Card = ({ children, className = '' }: any) => (
  <div className={`bg-white rounded-xl shadow-sm border border-gray-100 p-6 ${className}`}>
    {children}
  </div>
);

export const Badge = ({ children, type = 'neutral' }: any) => {
  const styles = {
    neutral: 'bg-gray-100 text-gray-800',
    success: 'bg-green-100 text-green-800',
    warning: 'bg-yellow-100 text-yellow-800',
    info: 'bg-blue-100 text-blue-800'
  };
  return (
    <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${styles[type as keyof typeof styles]}`}>
      {children}
    </span>
  );
};

export const NotificationToast = ({ message }: { message: string }) => (
  <div className="fixed top-4 right-4 bg-gray-900 text-white px-6 py-3 rounded-lg shadow-2xl z-50 animate-fade-in-down flex items-center gap-3">
    <i className="fas fa-bell text-yellow-400"></i>
    {message}
  </div>
);

export const StarRating = ({ rating, setRating, readOnly = false }: { rating: number, setRating?: (r: number) => void, readOnly?: boolean }) => {
    return (
        <div className="flex gap-1">
            {[1, 2, 3, 4, 5].map((star) => (
                <i 
                    key={star}
                    className={`fas fa-star text-lg ${star <= rating ? 'text-yellow-400' : 'text-gray-300'} ${!readOnly ? 'cursor-pointer hover:scale-110 transition-transform' : ''}`}
                    onClick={() => !readOnly && setRating && setRating(star)}
                ></i>
            ))}
        </div>
    );
};