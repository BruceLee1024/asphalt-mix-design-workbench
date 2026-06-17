import React from 'react';
import { cn } from '../../lib/utils';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  title?: React.ReactNode;
  headerRight?: React.ReactNode;
  className?: string;
  children?: React.ReactNode;
}

export function Card({ title, headerRight, className, children, ...props }: CardProps) {
  return (
    <div className={cn("bg-surface border border-border rounded-lg p-6 mb-4 transition-colors hover:border-border2", className)} {...props}>
      {(title || headerRight) && (
        <div className="flex items-center justify-between mb-5">
          {title && (
            <div className="font-mono text-xs font-bold text-amber flex items-center gap-2">
              <div className="w-[3px] h-[14px] bg-amber rounded-sm"></div>
              {title}
            </div>
          )}
          {headerRight}
        </div>
      )}
      {children}
    </div>
  );
}

export function SLabel({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn("font-mono text-[10px] tracking-[4px] uppercase text-amber flex items-center gap-3 mb-5", className)}>
      {children}
      <div className="flex-1 h-[1px] bg-gradient-to-r from-border to-transparent"></div>
    </div>
  );
}

export function InfoBox({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn("flex gap-2.5 bg-surface2 border border-border border-l-4 border-l-amber-dim rounded-r-sm p-3 text-xs text-text3 font-mono leading-relaxed mt-3.5", className)}>
      {children}
    </div>
  );
}

export function FormGroup({ label, hint, children, className }: { label: string; hint?: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <label className="text-[11px] text-text2 font-mono tracking-wide">{label}</label>
      {children}
      {hint && <div className="text-[10px] text-text3 font-mono">{hint}</div>}
    </div>
  );
}

const inputClasses = "bg-app-bg border border-border rounded-sm text-text1 font-mono text-[13px] px-3 py-2 outline-none appearance-none transition-all focus:border-amber focus:ring-2 focus:ring-amber-glow hover:border-border2";

export const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => (
    <input ref={ref} className={cn(inputClasses, className)} {...props} />
  )
);
Input.displayName = "Input";

export const Select = React.forwardRef<HTMLSelectElement, React.SelectHTMLAttributes<HTMLSelectElement>>(
  ({ className, ...props }, ref) => (
    <select ref={ref} className={cn(inputClasses, className)} {...props} />
  )
);
Select.displayName = "Select";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'ghost' | 'ai';
  size?: 'default' | 'sm';
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'default', ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          "inline-flex items-center justify-center gap-2 rounded-sm font-mono font-bold tracking-wide cursor-pointer transition-all whitespace-nowrap border border-transparent",
          size === 'default' ? "px-6 py-2.5 text-xs" : "px-3.5 py-1.5 text-[11px]",
          variant === 'primary' && "bg-amber text-black hover:bg-amber2 hover:shadow-[0_4px_24px_rgba(245,166,35,0.45)] hover:-translate-y-[1px]",
          variant === 'ghost' && "bg-transparent text-text2 border-border hover:text-text1 hover:border-border2 hover:bg-surface2",
          variant === 'ai' && "bg-gradient-to-br from-[#2a1a6b] to-[#4a2a9b] text-[#c8b8ff] border border-[rgba(155,127,255,0.4)] hover:from-[#3a2a7b] hover:to-[#5a3aab] hover:shadow-[0_4px_24px_rgba(155,127,255,0.3)] hover:-translate-y-[1px]",
          className
        )}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";
