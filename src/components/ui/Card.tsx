"use client";

import { clsx } from "clsx";
import { motion } from "framer-motion";
import type { ReactNode } from "react";

interface CardProps {
  children: ReactNode;
  className?: string;
  glow?: boolean;
  delay?: number;
  onClick?: () => void;
}

export function Card({ children, className, glow, delay = 0, onClick }: CardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay }}
      onClick={onClick}
      role={onClick ? "button" : undefined}
      className={clsx(
        "card-premium",
        glow && "glass-red neon-border",
        onClick && "cursor-pointer",
        className
      )}
    >
      {children}
    </motion.div>
  );
}
