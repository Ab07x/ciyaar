"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { AlertCircle, CheckCircle2, Eye, EyeOff } from "lucide-react";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    label?: string;
    error?: string;
    success?: string;
    hint?: string;
    leftIcon?: React.ReactNode;
    rightIcon?: React.ReactNode;
    isPassword?: boolean;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
    (
        {
            className,
            type,
            label,
            error,
            success,
            hint,
            leftIcon,
            rightIcon,
            isPassword,
            disabled,
            ...props
        },
        ref
    ) => {
        const [showPassword, setShowPassword] = React.useState(false);
        const [isFocused, setIsFocused] = React.useState(false);

        const inputType = isPassword ? (showPassword ? "text" : "password") : type;

        const hasValidation = error || success;
        const statusColor = error
            ? "border-accent-red focus:ring-accent-red/30"
            : success
                ? "border-accent-green focus:ring-accent-green/30"
                : "border-border-strong focus:ring-accent-green/30";

        return (
            <div className="w-full">
                {label && (
                    <label className="block text-sm font-semibold text-text-primary mb-2">
                        {label}
                    </label>
                )}
                <div className="relative">
                    {leftIcon && (
                        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted">
                            {leftIcon}
                        </div>
                    )}
                    <motion.input
                        ref={ref}
                        type={inputType}
                        disabled={disabled}
                        onFocus={() => setIsFocused(true)}
                        onBlur={() => setIsFocused(false)}
                        className={cn(
                            "w-full h-12 px-4 bg-stadium-elevated text-text-primary placeholder:text-text-muted rounded-xl border transition-all duration-200",
                            "focus:outline-none focus:ring-2 focus:border-transparent",
                            statusColor,
                            leftIcon && "pl-10",
                            (rightIcon || isPassword || hasValidation) && "pr-10",
                            disabled && "opacity-50 cursor-not-allowed",
                            className
                        )}
                        {...props}
                    />
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
                        {isPassword && (
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="text-text-muted hover:text-text-primary transition-colors"
                            >
                                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                            </button>
                        )}
                        {error && <AlertCircle size={18} className="text-accent-red" />}
                        {success && !error && <CheckCircle2 size={18} className="text-accent-green" />}
                        {rightIcon && !hasValidation && !isPassword && rightIcon}
                    </div>
                </div>
                {(error || success || hint) && (
                    <motion.p
                        initial={{ opacity: 0, y: -5 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={cn(
                            "mt-2 text-sm",
                            error
                                ? "text-accent-red"
                                : success
                                    ? "text-accent-green"
                                    : "text-text-muted"
                        )}
                    >
                        {error || success || hint}
                    </motion.p>
                )}
            </div>
        );
    }
);
Input.displayName = "Input";

export { Input };
