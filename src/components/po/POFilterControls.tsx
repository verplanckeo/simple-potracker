import type { FC } from "react";
import {
  Box,
  Checkbox,
  Chip,
  FormControl,
  InputLabel,
  ListItemText,
  MenuItem,
  Select,
  Stack,
  TextField,
} from "@mui/material";

import type { ID, POStatus, Customer, Training } from "../../types/index";
import { PO_STATUSES } from "../../types/index";
import { DateRangeFilter } from "./DateRangeFilter";

export interface POFilterValues {
  query: string;
  customerFilter: ID[];
  trainingFilter: ID[];
  statusFilter: POStatus[];
  dateFrom: string;
  dateTo: string;
}

interface POFilterControlsProps {
  values: POFilterValues;
  onChange: (next: POFilterValues) => void;
  customers: Customer[];
  trainings: Training[];
  layout?: "row" | "column";
}

export const POFilterControls: FC<POFilterControlsProps> = ({
  values,
  onChange,
  customers,
  trainings,
  layout = "row",
}) => {
  const sortedCustomers = [...customers].sort((a, b) => a.name.localeCompare(b.name));
  const sortedTrainings = [...trainings].sort((a, b) => a.name.localeCompare(b.name));
  const customerMap = new Map(customers.map((c) => [c.id, c.name]));
  const trainingMap = new Map(trainings.map((t) => [t.id, t.name]));

  const isColumn = layout === "column";

  return (
    <Stack
      direction={isColumn ? "column" : "row"}
      spacing={1}
      sx={{ flexWrap: isColumn ? undefined : "wrap", rowGap: 1 }}
    >
      <TextField
        size="small"
        label="Search PO #, training, customer"
        value={values.query}
        onChange={(e) => onChange({ ...values, query: e.target.value })}
        sx={{ minWidth: 140, flex: isColumn ? undefined : "0 1 auto" }}
        fullWidth={isColumn}
      />

      {/* Customer multi-select */}
      <FormControl size="small" sx={{ minWidth: 150 }} fullWidth={isColumn}>
        <InputLabel id="filter-customer">Customer</InputLabel>
        <Select
          labelId="filter-customer"
          label="Customer"
          multiple
          value={values.customerFilter}
          onChange={(e) => {
            const val = e.target.value;
            onChange({
              ...values,
              customerFilter: (typeof val === "string" ? val.split(",") : val) as ID[],
            });
          }}
          renderValue={(selected) => (
            <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5 }}>
              {selected.map((id) => (
                <Chip key={id} label={customerMap.get(id) ?? id} size="small" />
              ))}
            </Box>
          )}
        >
          {sortedCustomers.map((c) => (
            <MenuItem key={c.id} value={c.id}>
              <Checkbox checked={values.customerFilter.includes(c.id)} size="small" />
              <ListItemText primary={c.name} />
            </MenuItem>
          ))}
        </Select>
      </FormControl>

      {/* Training multi-select */}
      <FormControl size="small" sx={{ minWidth: 150 }} fullWidth={isColumn}>
        <InputLabel id="filter-training">Training</InputLabel>
        <Select
          labelId="filter-training"
          label="Training"
          multiple
          value={values.trainingFilter}
          onChange={(e) => {
            const val = e.target.value;
            onChange({
              ...values,
              trainingFilter: (typeof val === "string" ? val.split(",") : val) as ID[],
            });
          }}
          renderValue={(selected) => (
            <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5 }}>
              {selected.map((id) => (
                <Chip key={id} label={trainingMap.get(id) ?? id} size="small" />
              ))}
            </Box>
          )}
        >
          {sortedTrainings.map((t) => (
            <MenuItem key={t.id} value={t.id}>
              <Checkbox checked={values.trainingFilter.includes(t.id)} size="small" />
              <ListItemText primary={t.name} />
            </MenuItem>
          ))}
        </Select>
      </FormControl>

      {/* Status multi-select */}
      <FormControl size="small" sx={{ minWidth: 120 }} fullWidth={isColumn}>
        <InputLabel id="filter-status">Status</InputLabel>
        <Select
          labelId="filter-status"
          label="Status"
          multiple
          value={values.statusFilter}
          onChange={(e) => {
            const val = e.target.value;
            onChange({
              ...values,
              statusFilter: (typeof val === "string" ? val.split(",") : val) as POStatus[],
            });
          }}
          renderValue={(selected) => (
            <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5 }}>
              {selected.map((s) => (
                <Chip
                  key={s}
                  label={PO_STATUSES.find((ps) => ps.value === s)?.label ?? s}
                  size="small"
                />
              ))}
            </Box>
          )}
        >
          {PO_STATUSES.map((s) => (
            <MenuItem key={s.value} value={s.value}>
              <Checkbox checked={values.statusFilter.includes(s.value)} size="small" />
              <ListItemText primary={s.label} />
            </MenuItem>
          ))}
        </Select>
      </FormControl>

      <DateRangeFilter
        dateFrom={values.dateFrom}
        dateTo={values.dateTo}
        onDateFromChange={(v) => onChange({ ...values, dateFrom: v })}
        onDateToChange={(v) => onChange({ ...values, dateTo: v })}
      />
    </Stack>
  );
};
