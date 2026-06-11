"use client";

import { useState, useMemo, useEffect } from "react";

export interface UseTableFiltersOptions<T> {
  data: T[];
  searchFields: (keyof T | string)[];
  dateField: keyof T;
}

export interface UseTableFiltersReturn<T> {
  filteredData: T[];
  searchTerm: string;
  setSearchTerm: (v: string) => void;
  fromDate: string;
  setFromDate: (v: string) => void;
  toDate: string;
  setToDate: (v: string) => void;
  clearFilters: () => void;
  hasActiveFilters: boolean;
}

function getNestedValue(obj: any, path: string): any {
  return path.split('.').reduce((acc, key) => acc?.[key], obj);
}

function toDateOnly(iso: string): string {
  return iso.slice(0, 10); // "2024-06-03"
}

function nextDay(dateStr: string): string {
  const d = new Date(dateStr + "T00:00:00Z");
  d.setUTCDate(d.getUTCDate() + 1);
  return d.toISOString().slice(0, 10);
}

export function useTableFilters<T extends Record<string, any>>({
  data,
  searchFields,
  dateField,
}: UseTableFiltersOptions<T>): UseTableFiltersReturn<T> {
  const [searchTerm, setSearchTerm] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const hasActiveFilters = useMemo(
    () => !!(searchTerm || fromDate || toDate),
    [searchTerm, fromDate, toDate],
  );

  const filteredData = useMemo(() => {
    let result = data;

    // Date filter first
    if (fromDate || toDate) {
      result = result.filter((item) => {
        const raw = item[dateField];
        if (!raw) return false;
        const itemDate = toDateOnly(String(raw));
        if (fromDate && itemDate < fromDate) return false;
        if (toDate && itemDate > nextDay(toDate)) return false; // toDate inclusive
        return true;
      });
    }

    // Then search
    if (debouncedSearch) {
      const lower = debouncedSearch.toLowerCase();
      result = result.filter((item) =>
        searchFields.some((field) => {
          const val = getNestedValue(item, String(field));
          if (val == null) return false;
          return String(val).toLowerCase().includes(lower);
        }),
      );
    }

    return result;
  }, [data, searchFields, dateField, fromDate, toDate, debouncedSearch]);

  const clearFilters = () => {
    setSearchTerm("");
    setFromDate("");
    setToDate("");
  };

  return {
    filteredData,
    searchTerm,
    setSearchTerm,
    fromDate,
    setFromDate,
    toDate,
    setToDate,
    clearFilters,
    hasActiveFilters,
  };
}
