"use client";

import { useState, useRef, useEffect } from "react";
import { ChevronLeft, ChevronRight, Calendar } from "lucide-react";

const DAYS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];
const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

function toDateStr(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function parseDateStr(s: string): Date {
  const [y, m, d] = s.split("-").map(Number);
  return new Date(y, m - 1, d);
}

function isSameDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

interface CalendarDatePickerProps {
  value: string;
  onChange: (dateStr: string) => void;
  label?: string;
  required?: boolean;
  minDate?: string;
}

export default function CalendarDatePicker({
  value,
  onChange,
  label,
  required,
  minDate,
}: CalendarDatePickerProps) {
  const today = new Date();
  const selected = value ? parseDateStr(value) : today;
  const [open, setOpen] = useState(false);
  const [viewMonth, setViewMonth] = useState(selected.getMonth());
  const [viewYear, setViewYear] = useState(selected.getFullYear());
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (value) {
      const d = parseDateStr(value);
      setViewMonth(d.getMonth());
      setViewYear(d.getFullYear());
    }
  }, [value]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  function selectDate(day: number) {
    const picked = new Date(viewYear, viewMonth, day);
    if (minDate && picked < parseDateStr(minDate)) return;
    onChange(toDateStr(picked));
    setOpen(false);
  }

  function prevMonth() {
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear(viewYear - 1);
    } else {
      setViewMonth(viewMonth - 1);
    }
  }

  function nextMonth() {
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear(viewYear + 1);
    } else {
      setViewMonth(viewMonth + 1);
    }
  }

  function goToToday() {
    setViewMonth(today.getMonth());
    setViewYear(today.getFullYear());
    onChange(toDateStr(today));
    setOpen(false);
  }

  const daysInMonth = getDaysInMonth(viewYear, viewMonth);
  const firstDayOfWeek = new Date(viewYear, viewMonth, 1).getDay();
  const minDateObj = minDate ? parseDateStr(minDate) : null;

  return (
    <div ref={containerRef} className="relative">
      {label && (
        <label className="field-label">
          {label}{required && " *"}
        </label>
      )}
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="input flex items-center gap-2 text-left hover:border-faint"
      >
        <Calendar className="w-4 h-4 text-mute shrink-0" />
        <span className={`flex-1 ${value ? "text-ink" : "text-faint"}`}>
          {value
            ? selected.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", year: "numeric" })
            : "Select date..."
          }
        </span>
        <ChevronLeft
          className={`w-3.5 h-3.5 text-mute transition-transform ${open ? "rotate-[-90deg]" : "rotate-90"}`}
        />
      </button>

      {open && (
        <div className="popover absolute z-50 mt-2 w-full p-4">
          {/* Header */}
          <div className="flex items-center justify-between mb-3">
            <button
              type="button"
              onClick={prevMonth}
              className="p-1.5 rounded-sm text-mute hover:text-ink hover:bg-hairline-soft transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <div className="flex items-center gap-2">
              <select
                value={viewMonth}
                onChange={(e) => setViewMonth(Number(e.target.value))}
                className="bg-elevated border border-hairline rounded-sm px-2 py-1 text-xs font-medium text-ink focus:outline-none focus:border-link"
              >
                {MONTHS.map((m, i) => (
                  <option key={i} value={i}>{m}</option>
                ))}
              </select>
              <select
                value={viewYear}
                onChange={(e) => setViewYear(Number(e.target.value))}
                className="bg-elevated border border-hairline rounded-sm px-2 py-1 text-xs font-medium text-ink focus:outline-none focus:border-link w-[70px]"
              >
                {Array.from({ length: 21 }, (_, i) => today.getFullYear() - 5 + i).map((y) => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
            </div>
            <button
              type="button"
              onClick={nextMonth}
              className="p-1.5 rounded-sm text-mute hover:text-ink hover:bg-hairline-soft transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Day names */}
          <div className="grid grid-cols-7 gap-1 mb-1">
            {DAYS.map((d) => (
              <div key={d} className="text-center text-[10px] font-medium text-mute uppercase py-1 font-mono">
                {d}
              </div>
            ))}
          </div>

          {/* Calendar grid */}
          <div className="grid grid-cols-7 gap-1">
            {Array.from({ length: firstDayOfWeek }).map((_, i) => (
              <div key={`empty-${i}`} />
            ))}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1;
              const dateObj = new Date(viewYear, viewMonth, day);
              const isToday = isSameDay(dateObj, today);
              const isSelected = value && toDateStr(dateObj) === value;
              const isPast = !!minDateObj && dateObj < minDateObj;

              return (
                <button
                  key={day}
                  type="button"
                  disabled={isPast}
                  onClick={() => selectDate(day)}
                  className={`
                    relative w-full aspect-square rounded-sm flex items-center justify-center text-xs transition-colors
                    ${isPast ? "text-faint cursor-not-allowed" : "cursor-pointer"}
                    ${isSelected
                      ? "bg-primary text-on-primary font-medium"
                      : isToday
                        ? "text-link font-medium ring-1 ring-link/40"
                        : "text-body hover:bg-hairline-soft hover:text-ink"
                    }
                  `}
                >
                  {day}
                </button>
              );
            })}
          </div>

          {/* Today button */}
          <div className="mt-3 pt-3 border-t border-hairline flex justify-center">
            <button
              type="button"
              onClick={goToToday}
              className="text-xs font-medium text-link hover:text-link-deep transition-colors"
            >
              Today
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
