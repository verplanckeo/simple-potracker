import { FC, useState } from "react";
import {
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  type SelectChangeEvent,
} from "@mui/material";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import dayjs, { type Dayjs } from "dayjs";

interface DatePreset {
  key: string;
  label: string;
  range: () => { from: string; to: string };
}

const DATE_PRESETS: DatePreset[] = [
  {
    key: "last-month",
    label: "Last month",
    range: () => {
      const start = dayjs().subtract(1, "month").startOf("month");
      return {
        from: start.format("YYYY-MM-DD"),
        to: start.endOf("month").format("YYYY-MM-DD"),
      };
    },
  },
  {
    key: "q1",
    label: "Q1",
    range: () => {
      const y = dayjs().year();
      return { from: `${y}-01-01`, to: `${y}-03-31` };
    },
  },
  {
    key: "q2",
    label: "Q2",
    range: () => {
      const y = dayjs().year();
      return { from: `${y}-04-01`, to: `${y}-06-30` };
    },
  },
  {
    key: "q3",
    label: "Q3",
    range: () => {
      const y = dayjs().year();
      return { from: `${y}-07-01`, to: `${y}-09-30` };
    },
  },
  {
    key: "q4",
    label: "Q4",
    range: () => {
      const y = dayjs().year();
      return { from: `${y}-10-01`, to: `${y}-12-31` };
    },
  },
  {
    key: "this-year",
    label: "This year",
    range: () => {
      const y = dayjs().year();
      return { from: `${y}-01-01`, to: `${y}-12-31` };
    },
  },
  {
    key: "last-year",
    label: "Last year",
    range: () => {
      const y = dayjs().year() - 1;
      return { from: `${y}-01-01`, to: `${y}-12-31` };
    },
  },
];

interface DateRangeFilterProps {
  dateFrom: string;
  dateTo: string;
  onDateFromChange: (value: string) => void;
  onDateToChange: (value: string) => void;
}

export const DateRangeFilter: FC<DateRangeFilterProps> = ({
  dateFrom,
  dateTo,
  onDateFromChange,
  onDateToChange,
}) => {
  const [selectedPreset, setSelectedPreset] = useState("");

  function handlePresetChange(e: SelectChangeEvent<string>): void {
    const key = e.target.value;
    setSelectedPreset(key);

    if (!key) {
      onDateFromChange("");
      onDateToChange("");
      return;
    }

    const preset = DATE_PRESETS.find((p) => p.key === key);
    if (preset) {
      const { from, to } = preset.range();
      onDateFromChange(from);
      onDateToChange(to);
    }
  }

  function handleFromChange(value: Dayjs | null): void {
    const iso = value?.isValid() ? value.format("YYYY-MM-DD") : "";
    onDateFromChange(iso);
    setSelectedPreset("");
  }

  function handleToChange(value: Dayjs | null): void {
    const iso = value?.isValid() ? value.format("YYYY-MM-DD") : "";
    onDateToChange(iso);
    setSelectedPreset("");
  }

  return (
    <Stack direction="row" spacing={1} alignItems="center">
      <FormControl size="small" sx={{ minWidth: 160 }}>
        <InputLabel id="date-preset-label">Period</InputLabel>
        <Select
          labelId="date-preset-label"
          label="Period"
          value={selectedPreset}
          onChange={handlePresetChange}
        >
          <MenuItem value="">
            <em>All dates</em>
          </MenuItem>
          {DATE_PRESETS.map((p) => (
            <MenuItem key={p.key} value={p.key}>
              {p.label}
            </MenuItem>
          ))}
        </Select>
      </FormControl>
      <DatePicker
        label="From"
        value={dateFrom ? dayjs(dateFrom) : null}
        onChange={handleFromChange}
        slotProps={{ textField: { size: "small", sx: { minWidth: 150 } } }}
      />
      <DatePicker
        label="To"
        value={dateTo ? dayjs(dateTo) : null}
        onChange={handleToChange}
        slotProps={{ textField: { size: "small", sx: { minWidth: 150 } } }}
      />
    </Stack>
  );
};
