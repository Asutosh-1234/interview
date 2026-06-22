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
    className: "w-full px-4 py-3 bg-slate-950/60 dark:bg-black/40 border border-slate-850 dark:border-slate-800/80 rounded-lg focus:outline-none focus:border-slate-100 text-slate-100 transition-all duration-200 cursor-pointer appearance-none text-sm"
  };

  if (value !== undefined) {
    selectProps.value = value;
  }

  if (onChange) {
    selectProps.onChange = (e: React.ChangeEvent<HTMLSelectElement>) => onChange(e.target.value);
  }

  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">
        {label}
      </label>
      <div className="relative">
        <select {...selectProps}>
          {options.map((opt) => (
            <option key={opt.value} value={opt.value} className="bg-slate-950 text-slate-100">
              {opt.label}
            </option>
          ))}
        </select>
        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-slate-400">
          <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
            <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/>
          </svg>
        </div>
      </div>
    </div>
  );
};
