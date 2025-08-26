"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

interface ShineBorderProps extends React.HTMLAttributes<HTMLDivElement> {
  borderWidth?: number;
  duration?: number;
  shineColor?: string | string[];
}

export function ShineBorder({
  borderWidth = 2,
  duration = 8,
  shineColor = "#000000",
  className,
  style,
  ...props
}: ShineBorderProps) {
  return (
    <div
      style={
        {
          "--border-width": `${borderWidth}px`,
          "--duration": `${duration}s`,
          background: `linear-gradient(
            90deg,
            ${Array.isArray(shineColor) ? shineColor.join(",") : shineColor}
          )`,
          backgroundSize: "300% 300%",
          padding: "var(--border-width)",
          animation: `shine var(--duration) linear infinite`,
          ...style,
        } as React.CSSProperties
      }
      className={cn(
        "absolute inset-0 rounded-[inherit] pointer-events-none will-change-[background-position]",
        className
      )}
      {...props}
    />
  );
}
