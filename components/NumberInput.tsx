import React, { useState, useEffect } from 'react';

interface NumberInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange'> {
  value: number | string;
  onChange: (value: number) => void;
  className?: string;
}

const NumberInput: React.FC<NumberInputProps> = ({ value, onChange, className, onFocus, onBlur, ...props }) => {
  // Internal state for the display string (with commas)
  const [displayValue, setDisplayValue] = useState('');

  useEffect(() => {
    // When prop value changes externally, update display unless currently editing?
    // For simplicity, we sync on blur or when value changes significantly
    if (value === 0 || value === '0') {
       setDisplayValue('0');
    } else if (value) {
       setDisplayValue(Number(value).toLocaleString());
    } else {
       setDisplayValue('');
    }
  }, [value]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/,/g, '');
    if (raw === '') {
        setDisplayValue('');
        onChange(0);
        return;
    }
    if (!isNaN(Number(raw))) {
        setDisplayValue(raw); // Show raw while typing
        onChange(Number(raw));
    }
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
      const raw = e.target.value.replace(/,/g, '');
      if (raw && !isNaN(Number(raw))) {
          setDisplayValue(Number(raw).toLocaleString());
      }
      if (onBlur) onBlur(e);
  };

  const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
      // Clear if 0 to avoid annoying deletion
      if (displayValue === '0') {
          setDisplayValue('');
      } else {
          // Remove commas for editing
          setDisplayValue(displayValue.replace(/,/g, ''));
      }
      if (onFocus) onFocus(e);
  };

  return (
    <input
      type="text" // Use text to allow commas
      inputMode="decimal"
      value={displayValue}
      onChange={handleChange}
      onBlur={handleBlur}
      onFocus={handleFocus}
      className={className}
      {...props}
    />
  );
};

export default NumberInput;