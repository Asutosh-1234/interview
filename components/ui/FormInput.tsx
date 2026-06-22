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
  const inputProps: any = {
    type,
    name,
    defaultValue,
    placeholder,
    required,
    min,
    max,
    className: "w-full px-4 py-3 bg-slate-950/60 dark:bg-black/40 border border-slate-850 dark:border-slate-800/80 rounded-lg focus:outline-none focus:border-slate-100 text-slate-100 placeholder-slate-600 transition-all duration-200 text-sm"
  };

  if (value !== undefined) {
    inputProps.value = value;
  }
  
  if (onChange) {
    inputProps.onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (type === "number") {
        onChange(e.target.value === "" ? "" : Number(e.target.value));
      } else {
        onChange(e.target.value);
      }
    };
  }

  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">
        {label} {required && "*"}
      </label>
      <input {...inputProps} />
    </div>
  );
};
