"use client";

import { Eye, EyeOff } from "lucide-react";
import { ReactNode, useState, InputHTMLAttributes } from "react";

// Estendemos as propriedades nativas do HTMLInputElement
interface Props extends InputHTMLAttributes<HTMLInputElement> {
  classNameDiv?: string;
  classNameInput?: string;
  icon?: ReactNode;
}

export default function InputField({
  type = "text",
  classNameDiv = "",
  classNameInput = "",
  icon,
  placeholder,
  ...props
}: Props) {
  const [showPassword, setShowPassword] = useState(false);

  const currentInputType = type === "password" && showPassword ? "text" : type;

  return (
    <div
      className={`flex w-full border border-stone-400/50 rounded-xl py-3 px-3 gap-2 items-center ${classNameDiv}`}
    >
      {icon && <div className="flex items-center justify-center">{icon}</div>}

      <input
        placeholder={placeholder}
        type={currentInputType}
        className={`outline-none w-full bg-transparent ${classNameInput}`}
        {...props}
      />

      {type === "password" && (
        <button
          type="button"
          onClick={() => setShowPassword(!showPassword)}
          className="text-stone-400 hover:text-stone-600 transition-colors focus:outline-none"
        >
          {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
        </button>
      )}
    </div>
  );
}
