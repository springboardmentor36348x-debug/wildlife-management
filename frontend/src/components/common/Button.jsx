import React from "react";

const variants = {
  primary: "bg-moss-600 text-white hover:bg-moss-500",
  outline: "bg-transparent text-moss-600 border border-moss-600 hover:bg-moss-100",
  ghost: "bg-transparent text-bark hover:bg-sand-200",
};

export default function Button({
  children,
  variant = "primary",
  type = "button",
  fullWidth = false,
  disabled = false,
  onClick,
  className = "",
}) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`
        px-5 py-2.5 rounded-lg text-sm font-medium transition-colors
        disabled:opacity-50 disabled:cursor-not-allowed
        ${fullWidth ? "w-full" : ""}
        ${variants[variant]}
        ${className}
      `}
    >
      {children}
    </button>
  );
}