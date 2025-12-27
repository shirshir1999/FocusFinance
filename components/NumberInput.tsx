
import React from 'react';

interface NumberInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange' | 'value'> {
  value: number | string;
  onChange: (value: string) => void; 
  className?: string;
}

const NumberInput: React.FC<NumberInputProps> = ({ value, onChange, className, onFocus, onBlur, ...props }) => {
  
  const getDisplayValue = (val: string | number) => {
      if (val === '' || val === undefined || val === null) return '';
      const strVal = val.toString();
      if (strVal.endsWith('.')) return strVal;
      if (strVal === '-') return strVal;
      
      const num = Number(strVal);
      if (isNaN(num)) return '';
      return num.toLocaleString();
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/,/g, ''); 
    
    if (raw === '') {
        onChange('');
        return;
    }

    if (!/^-?\d*\.?\d*$/.test(raw)) {
        return; 
    }

    let cleanRaw = raw;
    if (cleanRaw.length > 1 && cleanRaw.startsWith('0') && !cleanRaw.startsWith('0.')) {
        cleanRaw = cleanRaw.replace(/^0+/, '');
    }
    
    onChange(cleanRaw);
  };

  const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
      // Auto-select text on click for easy overwrite
      e.target.select();
      if (onFocus) onFocus(e);
  };

  return (
    <input
      type="text"
      inputMode="decimal"
      value={getDisplayValue(value)}
      onChange={handleChange}
      onFocus={handleFocus}
      onBlur={onBlur}
      className={className}
      {...props}
    />
  );
};

export default NumberInput;
