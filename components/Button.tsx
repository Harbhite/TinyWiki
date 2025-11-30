import React from 'react';

/**
 * Props for the Button component.
 * Extends standard HTML button attributes.
 */
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  /** The visual style variant of the button. Defaults to 'primary'. */
  variant?: 'primary' | 'secondary' | 'outline';
  /** Whether the button should take up the full width of its container. Defaults to false. */
  fullWidth?: boolean;
}

/**
 * A reusable button component with various styles and behaviors.
 *
 * @param props - The props for the button.
 * @param props.children - The content to display inside the button.
 * @param props.variant - The style variant ('primary', 'secondary', 'outline').
 * @param props.fullWidth - If true, the button expands to fill the container width.
 * @param props.className - Additional CSS classes to apply.
 * @returns A styled HTML button element.
 */
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
