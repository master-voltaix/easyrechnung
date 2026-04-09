"use client";

import { useState } from "react";
import { format, startOfMonth, endOfMonth, startOfYear, endOfYear } from "date-fns";
import { de } from "date-fns/locale";
import { Calendar as CalendarIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";

export interface DateRange {
  from: Date;
  to: Date;
}

interface DateRangeSelectorProps {
  onDateRangeChange: (range: DateRange) => void;
  selectedRange: DateRange;
}

type PresetRange = "today" | "last7" | "last30" | "last90" | "currentMonth" | "currentYear" | "yearToDate";

export function DateRangeSelector({ onDateRangeChange, selectedRange }: DateRangeSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [activePreset, setActivePreset] = useState<PresetRange | null>(null);
  const [localRange, setLocalRange] = useState<DateRange>(selectedRange);
  const [selectingFrom, setSelectingFrom] = useState(true);

  const getPresetRange = (preset: PresetRange): DateRange => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    switch (preset) {
      case "today":
        return { from: today, to: today };
      case "last7": {
        const from = new Date(today);
        from.setDate(from.getDate() - 6);
        return { from, to: today };
      }
      case "last30": {
        const from = new Date(today);
        from.setDate(from.getDate() - 29);
        return { from, to: today };
      }
      case "last90": {
        const from = new Date(today);
        from.setDate(from.getDate() - 89);
        return { from, to: today };
      }
      case "currentMonth":
        return { from: startOfMonth(today), to: endOfMonth(today) };
      case "currentYear":
        return { from: startOfYear(today), to: endOfYear(today) };
      case "yearToDate":
        return { from: startOfYear(today), to: today };
    }
  };

  const handlePresetClick = (preset: PresetRange) => {
    const range = getPresetRange(preset);
    setLocalRange(range);
    setActivePreset(preset);
    onDateRangeChange(range);
    setIsOpen(false);
  };

  const handleDateSelect = (date: Date) => {
    if (selectingFrom) {
      setLocalRange({ from: date, to: date });
      setSelectingFrom(false);
      setActivePreset(null);
    } else {
      if (date >= localRange.from) {
        setLocalRange({ from: localRange.from, to: date });
        onDateRangeChange({ from: localRange.from, to: date });
        setIsOpen(false);
      } else {
        setLocalRange({ from: date, to: localRange.from });
        onDateRangeChange({ from: date, to: localRange.from });
        setIsOpen(false);
      }
      setSelectingFrom(true);
    }
  };

  const formatDateRange = () => {
    const fromStr = format(localRange.from, "d. MMM yyyy", { locale: de });
    const toStr = format(localRange.to, "d. MMM yyyy", { locale: de });
    if (fromStr === toStr) return fromStr;
    return `${fromStr} – ${toStr}`;
  };

  const presetGroups: { label: string; presets: PresetRange[] }[] = [
    {
      label: "Schnellauswahl",
      presets: ["today", "last7", "last30", "last90"],
    },
    {
      label: "Zeiträume",
      presets: ["currentMonth", "currentYear", "yearToDate"],
    },
  ];

  const presetLabels: { [key in PresetRange]: string } = {
    today: "Heute",
    last7: "Letzte 7 Tage",
    last30: "Letzte 30 Tage",
    last90: "Letzte 90 Tage",
    currentMonth: "Aktueller Monat",
    currentYear: "Aktuelles Jahr",
    yearToDate: "Jahr bis heute",
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            "w-full sm:w-auto justify-start text-left font-normal",
            !selectedRange && "text-muted-foreground"
          )}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {formatDateRange()}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <div className="flex">
          {/* Presets */}
          <div className="flex flex-col gap-3 border-r p-3 min-w-[170px]">
            {presetGroups.map((group) => (
              <div key={group.label}>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide px-2 mb-1">{group.label}</p>
                {group.presets.map((preset) => (
                  <Button
                    key={preset}
                    variant={activePreset === preset ? "default" : "ghost"}
                    size="sm"
                    className="w-full justify-start text-sm"
                    onClick={() => handlePresetClick(preset)}
                  >
                    {presetLabels[preset]}
                  </Button>
                ))}
              </div>
            ))}
          </div>

          {/* Calendar */}
          <div className="p-3">
            <p className="text-xs text-muted-foreground mb-2 text-center">
              {selectingFrom ? "Startdatum wählen" : "Enddatum wählen"}
            </p>
            <Calendar
              mode="single"
              selected={selectingFrom ? localRange.from : localRange.to}
              onSelect={(date) => date && handleDateSelect(date)}
              disabled={(date) => {
                if (selectingFrom) return false;
                return date < localRange.from;
              }}
              locale={de}
              initialFocus
            />
            {!selectingFrom && (
              <div className="mt-2 p-2 bg-muted rounded text-xs text-center">
                <p>Von: <strong>{format(localRange.from, "d. MMM yyyy", { locale: de })}</strong></p>
                <p>Bis: <strong>{format(localRange.to, "d. MMM yyyy", { locale: de })}</strong></p>
              </div>
            )}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
