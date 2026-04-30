import { useState, useRef, useEffect } from 'react';

/**
 * SearchableSelect – drop-in replacement for <select> with live search filter.
 *
 * Props:
 *  value        – current selected value (string/number)
 *  onChange     – (value) => void   (receives the value string, like a native select)
 *  options      – [{ value, label }]
 *  placeholder  – placeholder text when nothing selected
 *  required     – bool
 *  className    – extra classes for the trigger button
 *  disabled     – bool
 */
export default function SearchableSelect({
  value,
  onChange,
  options = [],
  placeholder = 'Select…',
  required = false,
  className = '',
  disabled = false,
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const ref = useRef(null);
  const inputRef = useRef(null);

  const selected = options.find(o => String(o.value) === String(value));

  const filtered = search
    ? options.filter(o => o.label.toLowerCase().includes(search.toLowerCase()))
    : options;

  // Close on outside click
  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) {
        setOpen(false);
        setSearch('');
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Focus search input when dropdown opens
  useEffect(() => {
    if (open && inputRef.current) inputRef.current.focus();
  }, [open]);

  const handleSelect = (optValue) => {
    onChange(optValue);
    setOpen(false);
    setSearch('');
  };

  return (
    <div ref={ref} className={`relative ${className}`}>
      {/* Hidden native input for form required validation */}
      {required && (
        <input
          tabIndex={-1}
          value={value ?? ''}
          required
          readOnly
          style={{ opacity: 0, position: 'absolute', height: 0, width: 0, pointerEvents: 'none' }}
        />
      )}

      {/* Trigger */}
      <button
        type="button"
        disabled={disabled}
        onClick={() => !disabled && setOpen(o => !o)}
        className={`input w-full text-left flex items-center justify-between gap-2 ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
      >
        <span className={selected ? '' : 'text-slate-400 dark:text-slate-500'}>
          {selected ? selected.label : placeholder}
        </span>
        <svg className={`w-4 h-4 flex-shrink-0 text-slate-400 transition-transform ${open ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Dropdown */}
      {open && (
        <div className="absolute z-50 mt-1 w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-lg">
          {/* Search */}
          <div className="p-2 border-b border-slate-100 dark:border-slate-700">
            <div className="relative">
              <svg className="absolute left-2 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
              </svg>
              <input
                ref={inputRef}
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search…"
                className="w-full pl-7 pr-3 py-1.5 text-sm bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-md outline-none focus:ring-1 focus:ring-blue-500 text-slate-800 dark:text-slate-100 placeholder-slate-400"
              />
            </div>
          </div>

          {/* Options list */}
          <ul className="max-h-52 overflow-y-auto py-1">
            {filtered.length === 0 ? (
              <li className="px-3 py-2 text-sm text-slate-400 dark:text-slate-500">No results</li>
            ) : (
              filtered.map(o => (
                <li
                  key={o.value}
                  onMouseDown={() => handleSelect(o.value)}
                  className={`px-3 py-2 text-sm cursor-pointer hover:bg-blue-50 dark:hover:bg-slate-700 ${
                    String(o.value) === String(value)
                      ? 'bg-blue-100 dark:bg-slate-700 text-blue-700 dark:text-blue-400 font-medium'
                      : 'text-slate-800 dark:text-slate-200'
                  }`}
                >
                  {o.label}
                </li>
              ))
            )}
          </ul>
        </div>
      )}
    </div>
  );
}
