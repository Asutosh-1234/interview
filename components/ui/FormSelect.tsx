import React from "react";

interface Option {
  value: string;
  label: string;
}

interface FormSelectProps {
  label: string;
  value?: string;
  onChange?: (value: any) => void;
  options: Option[];
  className?: string;
  name?: string;
  defaultValue?: string;
}

export const FormSelect: React.FC<FormSelectProps> = ({
  label,
  value,
  onChange,
  options,
  className = "",
  name,
  defaultValue,
}) => {
  const selectProps: any = {
    name,
    defaultValue,
    className: "w-full px-4 py-3 bg-slate-950/60 border border-slate-800/80 rounded-xl focus:outline-none focus:border-violet-500 text-slate-100 transition-all duration-200 cursor-pointer appearance-none"
  };

  if (value !== undefined) {
    selectProps.value = value;
  }

  if (onChange) {
    selectProps.onChange = (e: React.ChangeEvent<HTMLSelectElement>) => onChange(e.target.value);
  }

  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
        {label}
      </label>
      <select {...selectProps}>
        {options.map((opt) => (
          <option key={opt.value} value={opt.value} className="bg-slate-950 text-slate-100">
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  );
};
