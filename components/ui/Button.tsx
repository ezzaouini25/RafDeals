import Link from 'next/link';
import { cn } from '@/lib/utils';

interface ButtonProps {
  variant?: 'primary' | 'secondary' | 'outline' | 'black' | 'white' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  href?: string;
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  type?: 'button' | 'submit';
  disabled?: boolean;
}

const variants = {
  primary: 'bg-yellow text-navy hover:bg-yellow-hover border-transparent',
  secondary: 'bg-navy text-white hover:bg-navy/90 border-transparent',
  outline: 'border-2 border-navy text-navy hover:bg-navy hover:text-white',
  black: 'bg-[#1a1a1a] text-white hover:bg-white hover:text-[#1a1a1a] hover:border-[#1a1a1a] border border-transparent',
  white: 'bg-white text-[#1a1a1a] border-border-gray hover:bg-[#1a1a1a] hover:text-white border',
  ghost: 'text-navy hover:bg-light-gray border-transparent',
};

const sizes = {
  sm: 'px-4 py-2 text-sm rounded-btn',
  md: 'px-6 py-2.5 text-sm rounded-btn',
  lg: 'px-8 py-3 text-base rounded-btn font-semibold',
};

export default function Button({
  variant = 'primary',
  size = 'md',
  href,
  children,
  className,
  type = 'button',
  disabled,
  onClick,
  ...props
}: ButtonProps) {
  const classes = cn(
    'inline-flex items-center justify-center font-medium transition-all duration-200 active:scale-[0.98] border focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed',
    variants[variant],
    sizes[size],
    className
  );

  if (href) {
    return (
      <Link href={href} className={classes}>
        {children}
      </Link>
    );
  }

  return (
    <button type={type} className={classes} onClick={onClick} disabled={disabled} {...props}>
      {children}
    </button>
  );
}
