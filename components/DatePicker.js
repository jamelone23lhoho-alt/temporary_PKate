'use client';
import { useEffect, useRef } from 'react';

export default function DatePicker({ value, onChange, placeholder }) {
  const inputRef = useRef(null);
  const fpRef = useRef(null);

  useEffect(() => {
    if (!inputRef.current || typeof window === 'undefined' || !window.flatpickr) return;
    if (fpRef.current) fpRef.current.destroy();

    fpRef.current = window.flatpickr(inputRef.current, {
      dateFormat: 'd/m/Y',
      defaultDate: value || null,
      allowInput: false,
      clickOpens: true,
      disableMobile: true,
      onChange: (selectedDates) => {
        if (selectedDates.length > 0) {
          const d = selectedDates[0];
          const iso = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
          onChange(iso);
        }
      },
    });

    return () => { if (fpRef.current) fpRef.current.destroy(); };
  }, []);

  useEffect(() => {
    if (fpRef.current && value) {
      fpRef.current.setDate(value, false);
    } else if (fpRef.current && !value) {
      fpRef.current.clear();
    }
  }, [value]);

  const displayVal = () => {
    if (!value) return '';
    const parts = value.split('-');
    if (parts.length === 3) return `${parts[2]}/${parts[1]}/${parts[0]}`;
    return value;
  };

  return (
    <input
      ref={inputRef}
      readOnly
      value={displayVal()}
      placeholder={placeholder || 'dd/mm/yyyy'}
      className="w-full px-3.5 py-2.5 rounded-lg text-sm outline-none transition-all cursor-pointer"
      style={{ border: '1.5px solid var(--border)', background: 'white' }}
    />
  );
}
