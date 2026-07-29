'use client';

import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { FiX, FiCheck } from 'react-icons/fi';
import { cn } from '@/lib/utils/cn';

interface WheelDatePickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string; // e.g. "Start date", "End date", "Select Date"
  initialDate?: Date;
  onSelectDate: (date: Date) => void;
}

const MONTH_NAMES = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

const YEARS = Array.from({ length: 16 }, (_, i) => 2020 + i);

export function WheelDatePickerModal({
  isOpen,
  onClose,
  title = 'Start date',
  initialDate = new Date(),
  onSelectDate,
}: WheelDatePickerModalProps) {
  const [mounted, setMounted] = useState(false);
  const [selectedDay, setSelectedDay] = useState(initialDate.getDate());
  const [selectedMonth, setSelectedMonth] = useState(initialDate.getMonth());
  const [selectedYear, setSelectedYear] = useState(initialDate.getFullYear());

  // References for wheel containers
  const dayWheelRef = useRef<HTMLDivElement>(null);
  const monthWheelRef = useRef<HTMLDivElement>(null);
  const yearWheelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (isOpen) {
      setSelectedDay(initialDate.getDate());
      setSelectedMonth(initialDate.getMonth());
      setSelectedYear(initialDate.getFullYear());
    }
  }, [isOpen, initialDate]);

  // Calculate maximum days in current month/year selection
  const daysInMonth = new Date(selectedYear, selectedMonth + 1, 0).getDate();
  const daysList = Array.from({ length: daysInMonth }, (_, i) => i + 1);

  // Clamp selectedDay if month change reduces total days
  useEffect(() => {
    if (selectedDay > daysInMonth) {
      setSelectedDay(daysInMonth);
    }
  }, [selectedMonth, selectedYear, daysInMonth, selectedDay]);

  // Scroll active items into view when modal opens
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        scrollToValue(dayWheelRef, selectedDay - 1);
        scrollToValue(monthWheelRef, selectedMonth);
        scrollToValue(yearWheelRef, YEARS.indexOf(selectedYear));
      }, 50);
    }
  }, [isOpen]);

  const ITEM_HEIGHT = 44; // height of each wheel row

  function scrollToValue(ref: React.RefObject<HTMLDivElement | null>, index: number) {
    if (ref.current && index >= 0) {
      ref.current.scrollTo({
        top: index * ITEM_HEIGHT,
        behavior: 'smooth',
      });
    }
  }

  function handleScroll(
    ref: React.RefObject<HTMLDivElement | null>,
    setter: (val: number) => void,
    valuesArray: number[]
  ) {
    if (!ref.current) return;
    const scrollTop = ref.current.scrollTop;
    const index = Math.round(scrollTop / ITEM_HEIGHT);
    const clampedIndex = Math.max(0, Math.min(index, valuesArray.length - 1));
    setter(valuesArray[clampedIndex]);
  }

  if (!isOpen || !mounted) return null;

  const formattedDateString = `${selectedDay} ${MONTH_NAMES[selectedMonth]} ${selectedYear}`;

  const handleConfirm = () => {
    const finalDate = new Date(selectedYear, selectedMonth, selectedDay);
    onSelectDate(finalDate);
    onClose();
  };

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/75 backdrop-blur-sm animate-fade-in p-0 sm:p-4">
      {/* Modal Container */}
      <div className="w-full max-w-md bg-[#1c1c1e] text-white rounded-t-3xl sm:rounded-3xl border border-white/10 shadow-2xl overflow-hidden animate-slide-up">
        {/* Header Bar matching Image 1 */}
        <div className="flex items-center justify-between px-4 py-3.5 border-b border-white/10">
          <button
            type="button"
            onClick={onClose}
            className="flex items-center justify-center w-9 h-9 rounded-full bg-[#2c2c2e] hover:bg-[#3a3a3c] text-white/80 hover:text-white transition-all"
            aria-label="Close"
          >
            <FiX size={18} />
          </button>

          <h3 className="text-base font-semibold text-white tracking-wide">{title}</h3>

          <button
            type="button"
            onClick={handleConfirm}
            className="flex items-center justify-center w-9 h-9 rounded-full bg-[#007aff] hover:bg-[#0a84ff] text-white font-bold shadow-md transition-all active:scale-95"
            aria-label="Confirm"
          >
            <FiCheck size={18} />
          </button>
        </div>

        {/* Date Display Bar */}
        <div className="px-6 py-3 border-b border-white/5 bg-[#252528]/40">
          <span className="text-sm font-medium text-white/90">{formattedDateString}</span>
        </div>

        {/* 3D Wheel Picker Area */}
        <div className="relative h-60 bg-[#1c1c1e] flex items-center justify-center px-4 select-none overflow-hidden">
          {/* Middle Selection Highlight Overlay Box */}
          <div className="absolute top-1/2 left-4 right-4 -translate-y-1/2 h-11 bg-white/10 rounded-2xl border border-white/15 pointer-events-none z-10" />

          {/* Wheel Gradients Top & Bottom for 3D depth */}
          <div className="absolute top-0 left-0 right-0 h-20 bg-gradient-to-b from-[#1c1c1e] to-transparent pointer-events-none z-20" />
          <div className="absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-[#1c1c1e] to-transparent pointer-events-none z-20" />

          {/* 3 Columns: Day | Month | Year */}
          <div className="grid grid-cols-3 w-full h-full text-center z-0">
            {/* Column 1: Day */}
            <div
              ref={dayWheelRef}
              onScroll={() => handleScroll(dayWheelRef, setSelectedDay, daysList)}
              className="h-full overflow-y-auto scrollbar-none snap-y snap-mandatory py-[98px]"
            >
              {daysList.map((day) => {
                const isSelected = day === selectedDay;
                return (
                  <div
                    key={day}
                    onClick={() => {
                      setSelectedDay(day);
                      scrollToValue(dayWheelRef, day - 1);
                    }}
                    className={cn(
                      'h-[44px] flex items-center justify-center text-lg transition-all duration-150 snap-center cursor-pointer',
                      isSelected ? 'font-bold text-white text-xl' : 'text-white/40 font-normal'
                    )}
                  >
                    {day}
                  </div>
                );
              })}
            </div>

            {/* Column 2: Month */}
            <div
              ref={monthWheelRef}
              onScroll={() =>
                handleScroll(
                  monthWheelRef,
                  setSelectedMonth,
                  MONTH_NAMES.map((_, i) => i)
                )
              }
              className="h-full overflow-y-auto scrollbar-none snap-y snap-mandatory py-[98px]"
            >
              {MONTH_NAMES.map((monthName, idx) => {
                const isSelected = idx === selectedMonth;
                return (
                  <div
                    key={monthName}
                    onClick={() => {
                      setSelectedMonth(idx);
                      scrollToValue(monthWheelRef, idx);
                    }}
                    className={cn(
                      'h-[44px] flex items-center justify-center text-lg transition-all duration-150 snap-center cursor-pointer truncate px-1',
                      isSelected ? 'font-bold text-white text-xl' : 'text-white/40 font-normal'
                    )}
                  >
                    {monthName}
                  </div>
                );
              })}
            </div>

            {/* Column 3: Year */}
            <div
              ref={yearWheelRef}
              onScroll={() => handleScroll(yearWheelRef, setSelectedYear, YEARS)}
              className="h-full overflow-y-auto scrollbar-none snap-y snap-mandatory py-[98px]"
            >
              {YEARS.map((year, idx) => {
                const isSelected = year === selectedYear;
                return (
                  <div
                    key={year}
                    onClick={() => {
                      setSelectedYear(year);
                      scrollToValue(yearWheelRef, idx);
                    }}
                    className={cn(
                      'h-[44px] flex items-center justify-center text-lg transition-all duration-150 snap-center cursor-pointer',
                      isSelected ? 'font-bold text-white text-xl' : 'text-white/40 font-normal'
                    )}
                  >
                    {year}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
