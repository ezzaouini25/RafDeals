import { cn } from '@/lib/utils';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  icon?: React.ReactNode;
}

export default function Input({ label, error, icon, className, ...props }: InputProps) {
  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-medium text-navy mb-1.5">
          {label}
        </label>
      )}
      <div className="relative">
        {icon && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-text flex items-center justify-center">
            {icon}
          </div>
        )}
        <input
          className={cn(
            'w-full h-12 px-4 text-sm border rounded-input bg-white text-navy placeholder:text-gray-text/60 transition-all',
            'focus:outline-none focus:border-navy focus:ring-2 focus:ring-navy/10',
            error ? 'border-error focus:border-error focus:ring-error/10' : 'border-border-gray',
            icon && 'pl-10',
            className
          )}
          {...props}
        />
      </div>
      {error && (
        <p className="mt-1.5 text-sm text-error">{error}</p>
      )}
    </div>
  );
}
