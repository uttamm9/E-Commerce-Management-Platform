import React from 'react';

const Input = ({
  label,
  name,
  type = 'text',
  value,
  onChange,
  placeholder = '',
  error = '',
  required = false,
  disabled = false,
  className = '',
  helperText = '',
  icon: Icon,
  ...props
}) => {
  return (
    <div className={`w-full ${className}`}>
      {label && (
        <label
          htmlFor={name}
          className="block text-sm font-medium text-gray-700 mb-1"
        >
          {label} {required && <span className="text-rose-500">*</span>}
        </label>
      )}
      <div className="relative rounded-md shadow-sm">
        {Icon && (
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
            <Icon className="h-5 w-5" />
          </div>
        )}
        <input
          id={name}
          name={name}
          type={type}
          value={value}
          onChange={onChange}
          disabled={disabled}
          placeholder={placeholder}
          required={required}
          className={`block w-full rounded-lg border py-2 ${
            Icon ? 'pl-10' : 'pl-3'
          } pr-3 text-gray-900 placeholder-gray-400 text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-offset-0 disabled:bg-gray-100 disabled:cursor-not-allowed ${
            error
              ? 'border-rose-300 focus:border-rose-500 focus:ring-rose-200'
              : 'border-gray-300 focus:border-indigo-500 focus:ring-indigo-200'
          }`}
          {...props}
        />
      </div>
      {error && <p className="mt-1 text-xs text-rose-600">{error}</p>}
      {!error && helperText && (
        <p className="mt-1 text-xs text-gray-500">{helperText}</p>
      )}
    </div>
  );
};

export default Input;
