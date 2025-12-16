import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'text';
  fullWidth?: boolean;
}

export const Button: React.FC<ButtonProps> = ({ 
  children, 
  variant = 'primary', 
  fullWidth = false, 
  className = '', 
  ...props 
}) => {
  const baseStyles = "font-medium transition-all duration-300 py-3 px-8 rounded-full text-base flex items-center justify-center gap-2 active:scale-95";
  
  const variants = {
    primary: "bg-terracotta text-white hover:bg-[#c26d53] shadow-soft hover:shadow-soft-hover",
    secondary: "bg-soft-sage text-earth-brown hover:bg-[#b3c99a]",
    outline: "bg-transparent border border-earth-brown text-earth-brown hover:bg-earth-brown hover:text-white",
    text: "bg-transparent text-earth-brown hover:bg-black/5 px-4",
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