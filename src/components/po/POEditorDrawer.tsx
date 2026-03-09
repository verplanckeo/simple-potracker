import { type FC, useState, useEffect, useMemo } from "react";
import {
  Box,
  Button,
  Divider,
  Drawer,
  FormControl,
  IconButton,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import SaveIcon from "@mui/icons-material/Save";
import CloseIcon from "@mui/icons-material/Close";
import ReceiptLongIcon from "@mui/icons-material/ReceiptLong";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import TrendingDownIcon from "@mui/icons-material/TrendingDown";
import TrendingFlatIcon from "@mui/icons-material/TrendingFlat";

import type { PO, Training, Customer, Producer, ID, POStatus } from "../../types/index";
import { PO_STATUSES } from "../../types/index";
import { eur, clampNonNegative, computePO, safeName } from "../../utils/helpers";
import { SessionsEditor } from "../sessions/SessionsEditor";

interface POEditorDrawerProps {
  open: boolean;
  onClose: () => void;
  mode: "new" | "edit";
  po: PO;
  trainings: Training[];
  customers: Customer[];
  producers: Producer[];
  existingPoNumbers: Set<string>;
  onApply: (po: PO) => void;
}

export const POEditorDrawer: FC<POEditorDrawerProps> = ({
  open,
  onClose,
  mode,
  po,
  trainings,
  customers,
  producers,
  existingPoNumbers,
  onApply,
}) => {
  const [local, setLocal] = useState<PO>(po);

  useEffect(() => {
    setLocal(po);
  }, [po.id, po]);

  const trainingById = useMemo(
    () => new Map(trainings.map((t) => [t.id, t])),
    [trainings]
  );
  const customerById = useMemo(
    () => new Map(customers.map((c) => [c.id, c])),
    [customers]
  );
  const producerById = useMemo(
    () => new Map(producers.map((p) => [p.id, p])),
    [producers]
  );

  const computed = useMemo(() => computePO(local, producerById), [local, producerById]);

  const trimmedPoNumber = local.poNumber.trim();
  const isDuplicatePoNumber = trimmedPoNumber !== "" && existingPoNumbers.has(trimmedPoNumber);
  const hasCore = trimmedPoNumber && !isDuplicatePoNumber && local.trainingId && local.customerId;

  function apply(): void {
    const sanitized: PO = {
      ...local,
      poNumber: local.poNumber.trim(),
      price: clampNonNegative(local.price ?? 0),
      ...(local.note?.trim() ? { note: local.note.trim() } : {}),
      sessions: local.sessions.map((s) => ({
        ...s,
        hours: clampNonNegative(s.hours ?? 0),
        ...(s.note?.trim() ? { note: s.note.trim() } : {}),
      })),
    };

    onApply(sanitized);
    onClose();
  }

  return (
    <Drawer anchor="right" open={open} onClose={onClose} PaperProps={{ sx: { width: { xs: "100%", md: 720 } } }}>
      <Box sx={{ p: 2, pb: 1 }}>
        <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={1}>
          <Stack direction="row" spacing={1} alignItems="center">
            <ReceiptLongIcon />
            <Box>
              <Typography variant="h6">
                {mode === "new" ? "New PO" : "Edit PO"}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Draft-only changes until you click "Save" in the top bar.
              </Typography>
            </Box>
          </Stack>
          <IconButton onClick={onClose}>
            <CloseIcon />
          </IconButton>
        </Stack>
      </Box>

      <Divider />

      <Box sx={{ p: 2 }}>
        <Stack spacing={2.25}>
          <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
            <TextField
              label="PO number"
              value={local.poNumber}
              onChange={(e) => setLocal((p) => ({ ...p, poNumber: e.target.value }))}
              onFocus={(e) => e.target.select()}
              fullWidth
              error={isDuplicatePoNumber}
              helperText={isDuplicatePoNumber ? "This PO number already exists" : "Unique identifier (e.g., PO-2026-014)"}
            />

            <FormControl fullWidth>
              <InputLabel id="status">Status</InputLabel>
              <Select
                labelId="status"
                label="Status"
                value={local.status ?? "draft"}
                onChange={(e) => setLocal((p) => ({ ...p, status: e.target.value as POStatus }))}
              >
                {PO_STATUSES.map((s) => (
                  <MenuItem key={s.value} value={s.value}>
                    {s.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Stack>

          <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
            <FormControl fullWidth>
              <InputLabel id="training">Training</InputLabel>
              <Select
                labelId="training"
                label="Training"
                value={local.trainingId}
                onChange={(e) => setLocal((p) => ({ ...p, trainingId: e.target.value as ID | "" }))}
              >
                <MenuItem value="">
                  <em>{"\u2014"}</em>
                </MenuItem>
                {trainings
                  .slice()
                  .sort((a, b) => a.name.localeCompare(b.name))
                  .map((t) => (
                    <MenuItem key={t.id} value={t.id}>
                      {t.name}
                    </MenuItem>
                  ))}
              </Select>
            </FormControl>

            <FormControl fullWidth>
              <InputLabel id="customer">Customer</InputLabel>
              <Select
                labelId="customer"
                label="Customer"
                value={local.customerId}
                onChange={(e) => setLocal((p) => ({ ...p, customerId: e.target.value as ID | "" }))}
              >
                <MenuItem value="">
                  <em>{"\u2014"}</em>
                </MenuItem>
                {customers
                  .slice()
                  .sort((a, b) => a.name.localeCompare(b.name))
                  .map((c) => (
                    <MenuItem key={c.id} value={c.id}>
                      {c.name}
                    </MenuItem>
                  ))}
              </Select>
            </FormControl>
          </Stack>

          <TextField
            label="PO price (€)"
            type="number"
            value={local.price ?? 0}
            onChange={(e) => setLocal((p) => ({ ...p, price: Math.max(0, Number(e.target.value) || 0) }))}
            onFocus={(e) => e.target.select()}
            fullWidth
            inputProps={{ min: 0, step: "any" }}
            helperText="Manually entered invoice price for this PO"
          />

          <TextField
            label="PO note (optional)"
            value={local.note ?? ""}
            onChange={(e) => setLocal((p) => ({ ...p, note: e.target.value }))}
            onFocus={(e) => e.target.select()}
            fullWidth
          />

          <Paper variant="outlined" sx={{ p: 2 }}>
            <Stack spacing={1}>
              <Typography variant="subtitle1">Overview</Typography>
              <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
                <Box sx={{ flex: 1 }}>
                  <Typography variant="caption" color="text.secondary">
                    Training
                  </Typography>
                  <Typography variant="body2">{safeName(trainingById, local.trainingId)}</Typography>
                </Box>
                <Box sx={{ flex: 1 }}>
                  <Typography variant="caption" color="text.secondary">
                    Customer
                  </Typography>
                  <Typography variant="body2">{safeName(customerById, local.customerId)}</Typography>
                </Box>
                <Box sx={{ flex: 1 }}>
                  <Typography variant="caption" color="text.secondary">
                    Sessions ({computed.sessionCount})
                  </Typography>
                  {local.sessions.length === 0 ? (
                    <Typography variant="body2">{"\u2014"}</Typography>
                  ) : (
                    <Stack spacing={0.25} sx={{ mt: 0.25 }}>
                      {local.sessions.map((s) => {
                        const p = s.producerId ? producerById.get(s.producerId) : undefined;
                        return (
                          <Typography key={s.id} variant="body2" sx={{ fontSize: "0.8rem" }}>
                            {s.date || "No date"} · {s.hours}h{p ? ` · ${p.name}` : ""}
                          </Typography>
                        );
                      })}
                    </Stack>
                  )}
                </Box>
              </Stack>
              <Divider />
              <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
                <Box sx={{ flex: 1 }}>
                  <Typography variant="caption" color="text.secondary">
                    PO Price
                  </Typography>
                  <Typography variant="h6">{eur.format(local.price ?? 0)}</Typography>
                </Box>
                <Box sx={{ flex: 1 }}>
                  <Typography variant="caption" color="text.secondary">
                    Producer Cost
                  </Typography>
                  <Typography variant="h6">{eur.format(computed.cost)}</Typography>
                </Box>
                <Box sx={{ flex: 1 }}>
                  <Typography variant="caption" color="text.secondary">
                    Profit
                  </Typography>
                  <Stack direction="row" alignItems="center" spacing={0.5}>
                    {computed.profit > 0 && <TrendingUpIcon color="success" />}
                    {computed.profit < 0 && <TrendingDownIcon color="error" />}
                    {computed.profit === 0 && <TrendingFlatIcon color="disabled" />}
                    <Typography
                      variant="h6"
                      color={
                        computed.profit > 0
                          ? "success.main"
                          : computed.profit < 0
                            ? "error.main"
                            : "text.secondary"
                      }
                    >
                      {eur.format(computed.profit)}
                    </Typography>
                  </Stack>
                </Box>
              </Stack>
            </Stack>
          </Paper>

          <SessionsEditor
            sessions={local.sessions}
            producerById={producerById}
            onChange={(next) => setLocal((p) => ({ ...p, sessions: next }))}
          />

          <Stack direction={{ xs: "column", sm: "row" }} spacing={1} justifyContent="flex-end">
            <Button onClick={onClose} startIcon={<CloseIcon />}>
              Cancel
            </Button>
            <Button
              variant="contained"
              onClick={apply}
              disabled={!hasCore}
              startIcon={<SaveIcon />}
            >
              {mode === "new" ? "Add" : "Apply changes"}
            </Button>
          </Stack>
        </Stack>
      </Box>
    </Drawer>
  );
};
