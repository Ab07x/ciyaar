"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { Check, ChevronDown, Search } from "lucide-react";

export interface DropdownOption {
    value: string;
    label: string;
    icon?: React.ReactNode;
    disabled?: boolean;
}

interface DropdownProps {
    options: DropdownOption[];
    value?: string;
    onChange: (value: string) => void;
    placeholder?: string;
    label?: string;
    error?: string;
    searchable?: boolean;
    disabled?: boolean;
    className?: string;
}

export function Dropdown({
    options,
    value,
    onChange,
    placeholder = "Select option",
    label,
    error,
    searchable = false,
    disabled = false,
    className,
}: DropdownProps) {
    const [isOpen, setIsOpen] = React.useState(false);
    const [searchQuery, setSearchQuery] = React.useState("");
    const dropdownRef = React.useRef<HTMLDivElement>(null);
    const inputRef = React.useRef<HTMLInputElement>(null);

    const selectedOption = options.find((opt) => opt.value === value);

    const filteredOptions = searchable
        ? options.filter((opt) =>
            opt.label.toLowerCase().includes(searchQuery.toLowerCase())
        )
        : options;

    // Close on click outside
    React.useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
                setIsOpen(false);
                setSearchQuery("");
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    // Focus search input when opened
    React.useEffect(() => {
        if (isOpen && searchable && inputRef.current) {
            inputRef.current.focus();
        }
    }, [isOpen, searchable]);

    const handleSelect = (optValue: string) => {
        onChange(optValue);
        setIsOpen(false);
        setSearchQuery("");
    };

    return (
        <div ref={dropdownRef} className={cn("relative w-full", className)}>
            {label && (
                <label className="block text-sm font-semibold text-text-primary mb-2">
                    {label}
                </label>
            )}
            <button
                type="button"
                onClick={() => !disabled && setIsOpen(!isOpen)}
                disabled={disabled}
                className={cn(
                    "w-full h-12 px-4 bg-stadium-elevated text-left rounded-xl border transition-all duration-200 flex items-center justify-between gap-2",
                    "focus:outline-none focus:ring-2 focus:ring-accent-green/30 focus:border-transparent",
                    error ? "border-accent-red" : "border-border-strong",
                    disabled && "opacity-50 cursor-not-allowed",
                    isOpen && "ring-2 ring-accent-green/30"
                )}
            >
                <span className={cn(selectedOption ? "text-text-primary" : "text-text-muted")}>
                    {selectedOption ? (
                        <span className="flex items-center gap-2">
                            {selectedOption.icon}
                            {selectedOption.label}
                        </span>
                    ) : (
                        placeholder
                    )}
                </span>
                <motion.span
                    animate={{ rotate: isOpen ? 180 : 0 }}
                    transition={{ duration: 0.2 }}
                >
                    <ChevronDown size={18} className="text-text-muted" />
                </motion.span>
            </button>

            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.15 }}
                        className="absolute z-50 w-full mt-2 bg-stadium-elevated border border-border-strong rounded-xl shadow-xl overflow-hidden"
                    >
                        {searchable && (
                            <div className="p-2 border-b border-border-subtle">
                                <div className="relative">
                                    <Search
                                        size={16}
                                        className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted"
                                    />
                                    <input
                                        ref={inputRef}
                                        type="text"
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        placeholder="Search..."
                                        className="w-full h-10 pl-9 pr-4 bg-stadium-dark text-text-primary placeholder:text-text-muted rounded-lg border border-border-subtle focus:outline-none focus:border-accent-green/50"
                                    />
                                </div>
                            </div>
                        )}
                        <div className="max-h-60 overflow-y-auto py-1">
                            {filteredOptions.length === 0 ? (
                                <div className="px-4 py-3 text-text-muted text-sm text-center">
                                    No options found
                                </div>
                            ) : (
                                filteredOptions.map((option) => (
                                    <motion.button
                                        key={option.value}
                                        type="button"
                                        whileHover={{ backgroundColor: "rgba(255,255,255,0.05)" }}
                                        onClick={() => !option.disabled && handleSelect(option.value)}
                                        disabled={option.disabled}
                                        className={cn(
                                            "w-full px-4 py-3 text-left flex items-center justify-between gap-2 transition-colors",
                                            option.disabled && "opacity-50 cursor-not-allowed",
                                            value === option.value && "bg-accent-green/10 text-accent-green"
                                        )}
                                    >
                                        <span className="flex items-center gap-2">
                                            {option.icon}
                                            {option.label}
                                        </span>
                                        {value === option.value && <Check size={16} />}
                                    </motion.button>
                                ))
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {error && (
                <motion.p
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-2 text-sm text-accent-red"
                >
                    {error}
                </motion.p>
            )}
        </div>
    );
}
