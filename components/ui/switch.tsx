import React from "react";
import { cn } from "@/lib/utils";

type Props = {
  checked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
  disabled?: boolean;
  className?: string;
};

export function Switch({
  checked,
  onCheckedChange,
  disabled,
  className,
}: Props): React.JSX.Element {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={() => onCheckedChange?.(!checked)}
      className={cn(
        "relative inline-flex h-6 w-11 items-center rounded-full border border-slate-700 transition-colors",
        checked ? "bg-blue-600" : "bg-slate-800",
        disabled && "opacity-50",
        className
      )}
    >
      <span
        className={cn(
          "inline-block h-5 w-5 transform rounded-full bg-white transition-transform",
          checked ? "translate-x-5" : "translate-x-1"
        )}
      />
    </button>
  );
}
