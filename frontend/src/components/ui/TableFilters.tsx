"use client";

interface TableFiltersProps {
  searchTerm: string;
  onSearchChange: (v: string) => void;
  fromDate: string;
  onFromDateChange: (v: string) => void;
  toDate: string;
  onToDateChange: (v: string) => void;
  onClear: () => void;
  searchPlaceholder?: string;
  hasActiveFilters: boolean;
}

export default function TableFilters({
  searchTerm,
  onSearchChange,
  fromDate,
  onFromDateChange,
  toDate,
  onToDateChange,
  onClear,
  searchPlaceholder = "Search…",
  hasActiveFilters,
}: TableFiltersProps) {
  const inputBase =
    "h-10 px-3 py-2 bg-fill-subtle/50 border border-border-default rounded-lg text-sm text-text-secondary placeholder:text-text-phantom focus:outline-none focus:border-accent/50";

  return (
    <div className="flex items-center gap-3 w-full mb-4">
      {/* Search input */}
      <div className="relative flex-1 min-w-0">
        <svg
          className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-phantom pointer-events-none"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={1.5}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"
          />
        </svg>
        <input
          type="text"
          placeholder={searchPlaceholder}
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          className={`${inputBase} pl-9 w-full`}
        />
      </div>

      {/* Date range: From + To */}
      <input
        type="date"
        value={fromDate}
        onChange={(e) => onFromDateChange(e.target.value)}
        placeholder="From date"
        className={`${inputBase} w-40 flex-shrink-0`}
        style={{ colorScheme: "dark" }}
      />
      <input
        type="date"
        value={toDate}
        onChange={(e) => onToDateChange(e.target.value)}
        placeholder="To date"
        className={`${inputBase} w-40 flex-shrink-0`}
        style={{ colorScheme: "dark" }}
      />

      {/* Clear button */}
      {hasActiveFilters && (
        <button
          onClick={onClear}
          className="h-10 px-3 text-sm text-text-muted hover:text-text-primary whitespace-nowrap flex-shrink-0 flex items-center gap-1.5"
        >
          <svg
            className="w-3.5 h-3.5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
          Clear
        </button>
      )}
    </div>
  );
}
