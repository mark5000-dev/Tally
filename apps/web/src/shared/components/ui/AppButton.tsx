import type { ReactNode } from "react";

const VARIANTS = {
  primary:
    "bg-[#17231f] text-white hover:bg-[#ff654f] shadow-[0_4px_0_#08100d] hover:shadow-[0_4px_0_#b93425]",
  outline:
    "border border-[#c9cec5] bg-white text-[#17231f] hover:border-[#17231f] hover:bg-[#f7f6f0]",
  ghost: "text-[#4e5953] hover:bg-[#eeeee7] hover:text-[#17231f]",
  light: "bg-white text-[#17231f] hover:bg-[#fff0ed] shadow-[0_4px_0_#d7d8d0]",
} as const;

export type ButtonVariant = keyof typeof VARIANTS;

/**
 * The shared button skin. Also used for links that must look like a button, so a
 * navigation stays an anchor instead of nesting a button inside an anchor.
 */
export function buttonClasses(variant: ButtonVariant = "primary", className = "") {
  return `inline-flex h-11 items-center justify-center gap-2 rounded-xl px-5 text-sm font-bold transition-all duration-200 active:translate-y-0.5 ${VARIANTS[variant]} ${className}`;
}

export function AppButton({
  children,
  variant = "primary",
  className = "",
  onClick,
  type = "button",
  disabled = false,
}: {
  children: ReactNode;
  variant?: ButtonVariant;
  className?: string;
  onClick?: () => void;
  type?: "button" | "submit";
  disabled?: boolean;
}) {
  return (
    <button
      type={type}
      disabled={disabled}
      className={buttonClasses(variant, className)}
      onClick={onClick}
    >
      {children}
    </button>
  );
}
