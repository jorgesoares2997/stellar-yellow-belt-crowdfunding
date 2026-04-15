"use client";

import { motion } from "framer-motion";
import { ReactNode } from "react";

interface GlassButtonProps {
  children: ReactNode;
  onClick?: () => void;
  variant?: "primary" | "glass" | "outline";
  className?: string;
  disabled?: boolean;
}

export function GlassButton({
  children,
  onClick,
  variant = "primary",
  className = "",
  disabled = false,
}: GlassButtonProps) {
  const base =
    "relative inline-flex items-center justify-center gap-2 font-mono text-xs uppercase tracking-[0.08em] leading-none overflow-hidden transition-colors duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring";

  const variants = {
    primary:
      "bg-foreground text-background hover:bg-foreground/90 px-8 py-4",
    glass:
      "backdrop-blur-xl bg-foreground/10 border border-foreground/20 text-foreground hover:bg-foreground/20 px-8 py-4",
    outline:
      "border border-border text-foreground hover:bg-foreground hover:text-background px-8 py-4",
  };

  return (
    <motion.button
      className={`${base} ${variants[variant]} ${className}`}
      onClick={onClick}
      disabled={disabled}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      transition={{ type: "spring", stiffness: 400, damping: 25 }}
    >
      <motion.span
        className="absolute inset-0 bg-foreground/5"
        initial={{ x: "-100%" }}
        whileHover={{ x: "100%" }}
        transition={{ duration: 0.6, ease: "easeInOut" }}
      />
      <span className="relative z-10 flex items-center gap-2">{children}</span>
    </motion.button>
  );
}
