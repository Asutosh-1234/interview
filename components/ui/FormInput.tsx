import React from "react";

interface FormInputProps {
  label: string;
  type?: string;
  value?: string | number;
  onChange?: (value: any) => void;
  placeholder?: string;
  required?: boolean;
  min?: number;
  max?: number;
  className?: string;
  name?: string;
  defaultValue?: string | number;
}

export const FormInput: React.FC<FormInputProps> = ({
  label,
  type = "text",
  value,
  onChange,
  placeholder = "",
  required = false,
  min,
  max,
  className = "",
  name,
  defaultValue,
}) => {
  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
        {label} {required && "*"}
      </label>
      <input
        type={type}
        name={name}
        defaultValue={defaultValue}
        value={value}
        onChange={onChange ? (e) => {
          if (type === "number") {
            onChange(e.target.value === "" ? "" : Number(e.target.value));
          } else {
            onChange(e.target.value);
          }
        } : undefined}
        placeholder={placeholder}
        required={required}
        min={min}
        max={max}
        className="w-full px-4 py-3 bg-slate-950/60 border border-slate-800/80 rounded-xl focus:outline-none focus:border-violet-500 text-slate-100 placeholder-slate-600 transition-all duration-200"
      />
    </div>
  );
};
