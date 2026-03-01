import React from "react";

export function EnhancedMotionBackground({
  variant: _variant,
  colorScheme: _colorScheme,
  intensity: _intensity,
  parallax: _parallax,
  children,
}: {
  variant?: string;
  colorScheme?: string;
  intensity?: string;
  parallax?: boolean;
  children?: React.ReactNode;
}): React.JSX.Element {
  return (
    <div
      className="fixed inset-0 -z-10 pointer-events-none"
      style={{
        background:
          "radial-gradient(ellipse at 50% 0%, oklch(from var(--glow-violet) l c h / 0.18) 0%, transparent 60%)," +
          "radial-gradient(ellipse at 80% 80%, oklch(from var(--glow-magenta) l c h / 0.14) 0%, transparent 50%)," +
          "radial-gradient(ellipse at 20% 70%, oklch(from var(--glow-gold) l c h / 0.12) 0%, transparent 50%)," +
          "linear-gradient(135deg, oklch(from var(--background) l c h / 1) 0%, oklch(from var(--background) l c h / 1) 100%)",
      }}
    >
      {children}
    </div>
  );
}
