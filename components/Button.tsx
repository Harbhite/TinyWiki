import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline';
  fullWidth?: boolean;
}

export const Button: React.FC<ButtonProps> = ({ 
  children, 
  variant = 'primary', 
  fullWidth = false, 
  className = '', 
  ...props 
}) => {
  const baseStyles = "font-bold text-black border-2 border-black transition-all active:translate-x-[2px] active:translate-y-[2px] active:shadow-none py-3 px-6 rounded-lg text-lg flex items-center justify-center gap-2";
  
  const variants = {
    primary: "bg-tiny-purple shadow-hard hover:bg-violet-300",
    secondary: "bg-tiny-yellow shadow-hard hover:bg-yellow-100",
    outline: "bg-white shadow-hard hover:bg-gray-50",
  };

  const widthClass = fullWidth ? "w-full" : "";

  return (
    <button 
      className={`${baseStyles} ${variants[variant]} ${widthClass} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};