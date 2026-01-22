"use client";

import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { motion, HTMLMotionProps } from "framer-motion";
import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";

const buttonVariants = cva(
    "inline-flex items-center justify-center gap-2 whitespace-nowrap font-bold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-green focus-visible:ring-offset-2 focus-visible:ring-offset-stadium-dark disabled:pointer-events-none disabled:opacity-50",
    {
        variants: {
            variant: {
                primary:
                    "bg-accent-green text-black hover:brightness-110 active:scale-[0.98]",
                secondary:
                    "bg-stadium-elevated text-text-primary border border-border-strong hover:bg-stadium-hover hover:border-text-muted active:scale-[0.98]",
                ghost:
                    "bg-transparent text-text-primary hover:bg-white/10 active:scale-[0.98]",
                gold:
                    "bg-accent-gold text-black hover:brightness-110 active:scale-[0.98]",
                destructive:
                    "bg-accent-red text-white hover:brightness-110 active:scale-[0.98]",
                outline:
                    "bg-transparent border-2 border-accent-green text-accent-green hover:bg-accent-green/10 active:scale-[0.98]",
                link:
                    "bg-transparent text-accent-green underline-offset-4 hover:underline",
            },
            size: {
                sm: "h-9 px-3 text-sm rounded-lg",
                md: "h-11 px-5 text-sm rounded-xl min-h-[44px]",
                lg: "h-14 px-8 text-base rounded-xl min-h-[56px]",
                icon: "h-11 w-11 rounded-xl",
            },
        },
        defaultVariants: {
            variant: "primary",
            size: "md",
        },
    }
);

export interface ButtonProps
    extends Omit<HTMLMotionProps<"button">, "children">,
    VariantProps<typeof buttonVariants> {
    isLoading?: boolean;
    leftIcon?: React.ReactNode;
    rightIcon?: React.ReactNode;
    children?: React.ReactNode;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
    (
        {
            className,
            variant,
            size,
            isLoading = false,
            leftIcon,
            rightIcon,
            children,
            disabled,
            ...props
        },
        ref
    ) => {
        return (
            <motion.button
                ref={ref}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className={cn(buttonVariants({ variant, size, className }))}
                disabled={disabled || isLoading}
                {...props}
            >
                {isLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                    leftIcon
                )}
                {children}
                {!isLoading && rightIcon}
            </motion.button>
        );
    }
);
Button.displayName = "Button";

export { Button, buttonVariants };
