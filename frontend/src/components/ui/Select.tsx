"use client";

import { createPortal } from "react-dom";
import { useState, useRef, useEffect, useCallback } from "react";

interface SelectProps {
  options: { value: string; label: string }[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

export default function Select({ options, value, onChange, placeholder, className }: SelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [highlighted, setHighlighted] = useState(-1);
  const [pos, setPos] = useState({ top: 0, left: 0, width: 0 });
  const triggerRef = useRef<HTMLDivElement>(null);

  const selected = options.find((o) => o.value === value);

  const openDropdown = () => {
    if (triggerRef.current) {
      const r = triggerRef.current.getBoundingClientRect();
      setPos({
        top: r.bottom + window.scrollY + 4,
        left: r.left + window.scrollX,
        width: r.width,
      });
    }
    setIsOpen(!isOpen);
    setHighlighted(value ? options.findIndex((o) => o.value === value) : 0);
  };

  const close = useCallback(() => {
    setIsOpen(false);
    setHighlighted(-1);
  }, []);

  // Click outside to close
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: MouseEvent) => {
      if (triggerRef.current && !triggerRef.current.contains(e.target as Node)) {
        close();
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [isOpen, close]);

  // Close on scroll
  useEffect(() => {
    if (!isOpen) return;
    const handler = () => close();
    window.addEventListener("scroll", handler, true);
    return () => window.removeEventListener("scroll", handler, true);
  }, [isOpen, close]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen) {
      if (e.key === "Enter" || e.key === " " || e.key === "ArrowDown") {
        e.preventDefault();
        openDropdown();
      }
      return;
    }

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setHighlighted((h) => (h < options.length - 1 ? h + 1 : 0));
        break;
      case "ArrowUp":
        e.preventDefault();
        setHighlighted((h) => (h > 0 ? h - 1 : options.length - 1));
        break;
      case "Enter":
      case " ":
        e.preventDefault();
        if (highlighted >= 0 && highlighted < options.length) {
          onChange(options[highlighted].value);
        }
        close();
        break;
      case "Escape":
        close();
        break;
    }
  };

  return (
    <div className={className ?? ""}>
      {/* Trigger */}
      <div
        ref={triggerRef}
        role="combobox"
        tabIndex={0}
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        onClick={openDropdown}
        onKeyDown={handleKeyDown}
        className="w-full px-4 py-2.5 bg-fill-subtle/50 border border-border-default rounded-lg text-sm text-text-secondary focus:outline-none focus:border-accent/50 focus:ring-1 focus:ring-accent/20 transition-colors cursor-pointer flex items-center justify-between"
      >
        <span className={selected ? "text-text-secondary" : "text-text-phantom"}>
          {selected ? selected.label : placeholder || "Select…"}
        </span>
        <svg
          className={`w-4 h-4 text-text-muted transition-transform flex-shrink-0 ${isOpen ? "rotate-180" : ""}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={1.5}
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
        </svg>
      </div>

      {/* Dropdown — portaled to document.body to escape parent overflow clipping */}
      {isOpen &&
        typeof window !== "undefined" &&
        createPortal(
          <div
            style={{
              position: "absolute",
              top: pos.top,
              left: pos.left,
              width: pos.width,
              zIndex: 9999,
            }}
            className="bg-surface-1 border border-border-default rounded-lg shadow-xl overflow-hidden"
          >
            {options.map((opt, i) => (
              <div
                key={opt.value}
                role="option"
                aria-selected={opt.value === value}
                onMouseDown={(e) => {
                  e.preventDefault();
                  onChange(opt.value);
                  close();
                }}
                className={`px-4 py-2.5 text-sm cursor-pointer transition-colors ${
                  i === highlighted ? "bg-fill-subtle" : ""
                } ${opt.value === value ? "text-accent font-medium" : "text-text-secondary"}`}
                onMouseEnter={() => setHighlighted(i)}
              >
                {opt.label}
              </div>
            ))}
          </div>,
          document.body
        )}
    </div>
  );
}
