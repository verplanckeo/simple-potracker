import { type FC, useState, useMemo } from "react";
import {
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  IconButton,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import CloseIcon from "@mui/icons-material/Close";
import PeopleIcon from "@mui/icons-material/People";

import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import dayjs from "dayjs";

import type { Producer, RateEntry, ID } from "../types/index";
import { uid, eur, clampNonNegative, parseNumber, todayISO, nowISO, currentRate } from "../utils/helpers";

interface ProducersManagerProps {
  rows: Producer[];
  onChange: (next: Producer[] | ((prev: Producer[]) => Producer[])) => void;
}

export const ProducersManager: FC<ProducersManagerProps> = ({ rows, onChange }) => {
  const [query, setQuery] = useState("");
  const [editing, setEditing] = useState<Producer | null>(null);
  const [open, setOpen] = useState(false);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((r) => r.name.toLowerCase().includes(q));
  }, [query, rows]);

  function deriveTopLevel(producer: Producer): Producer {
    const sorted = [...producer.rateHistory].sort((a, b) => b.effectiveFrom.localeCompare(a.effectiveFrom));
    const latest = sorted[0];
    return {
      ...producer,
      rate: latest ? clampNonNegative(latest.rate) : 0,
      markup: latest ? clampNonNegative(latest.markup) : 0,
      rateHistory: producer.rateHistory.map((e) => ({
        ...e,
        rate: clampNonNegative(e.rate),
        markup: clampNonNegative(e.markup),
      })),
    };
  }

  function upsert(entity: Producer): void {
    const name = entity.name.trim();
    if (!name) return;

    const sanitized = deriveTopLevel({ ...entity, name });

    onChange((prev) => {
      const i = prev.findIndex((p) => p.id === entity.id);
      if (i >= 0) {
        const next = [...prev];
        next[i] = sanitized;
        return next;
      }
      return [sanitized, ...prev];
    });
  }

  function remove(id: ID): void {
    onChange(rows.filter((r) => r.id !== id));
  }

  function updateRateEntry(entryId: ID, patch: Partial<RateEntry>): void {
    setEditing((p) => {
      if (!p) return p;
      return {
        ...p,
        rateHistory: p.rateHistory.map((e) =>
          e.id === entryId ? { ...e, ...patch, lastModified: nowISO() } : e,
        ),
      };
    });
  }

  function addRateEntry(): void {
    setEditing((p) => {
      if (!p) return p;
      const latest = currentRate(p.rateHistory);
      const entry: RateEntry = {
        id: uid("re"),
        rate: latest?.rate ?? 0,
        markup: latest?.markup ?? 0,
        effectiveFrom: todayISO(),
        lastModified: nowISO(),
      };
      return { ...p, rateHistory: [...p.rateHistory, entry] };
    });
  }

  function removeRateEntry(entryId: ID): void {
    setEditing((p) => {
      if (!p) return p;
      return { ...p, rateHistory: p.rateHistory.filter((e) => e.id !== entryId) };
    });
  }

  const sortedHistory = useMemo(() => {
    if (!editing) return [];
    return [...editing.rateHistory].sort((a, b) => b.effectiveFrom.localeCompare(a.effectiveFrom));
  }, [editing]);

  const latestEntry = sortedHistory[0];

  return (
    <Box sx={{ p: 2 }}>
      <Stack
        direction={{ xs: "column", sm: "row" }}
        spacing={1.5}
        alignItems={{ sm: "center" }}
        justifyContent="space-between"
        sx={{ mb: 2 }}
      >
        <Stack direction="row" spacing={1} alignItems="center">
          <PeopleIcon />
          <Typography variant="h6">Producers</Typography>
        </Stack>

        <Stack direction={{ xs: "column", sm: "row" }} spacing={1} alignItems={{ sm: "center" }}>
          <TextField
            size="small"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            label="Search"
          />
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => {
              setEditing({
                id: uid("pr"),
                name: "",
                rate: 0,
                markup: 0,
                rateHistory: [{
                  id: uid("re"),
                  rate: 0,
                  markup: 0,
                  effectiveFrom: todayISO(),
                  lastModified: nowISO(),
                }],
              });
              setOpen(true);
            }}
          >
            New
          </Button>
        </Stack>
      </Stack>

      <TableContainer component={Paper} variant="outlined">
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Name</TableCell>
              <TableCell align="right">Rate</TableCell>
              <TableCell align="right">Markup</TableCell>
              <TableCell align="right">Gross charged</TableCell>
              <TableCell align="right" width={160}>
                Actions
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5}>
                  <Typography variant="body2" color="text.secondary">
                    No producers.
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((row) => (
                <TableRow key={row.id} hover>
                  <TableCell>
                    <Stack direction="row" spacing={1} alignItems="center">
                      <span>{row.name}</span>
                      {row.rateHistory.length > 1 && (
                        <Chip size="small" label={`${row.rateHistory.length} rates`} variant="outlined" />
                      )}
                    </Stack>
                  </TableCell>
                  <TableCell align="right">{eur.format(row.rate)}</TableCell>
                  <TableCell align="right">{eur.format(row.markup)}</TableCell>
                  <TableCell align="right">{eur.format(row.rate + row.markup)}</TableCell>
                  <TableCell align="right">
                    <Tooltip title="Edit">
                      <IconButton
                        size="small"
                        onClick={() => {
                          setEditing(row);
                          setOpen(true);
                        }}
                      >
                        <EditIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Delete">
                      <IconButton size="small" onClick={() => remove(row.id)}>
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={open} onClose={() => setOpen(false)} fullWidth maxWidth="md">
        <DialogTitle>{editing?.name ? "Edit producer" : "New producer"}</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField
              autoFocus
              label="Name"
              value={editing?.name ?? ""}
              onChange={(e) => setEditing((p) => (p ? { ...p, name: e.target.value } : p))}
              fullWidth
            />

            <Paper variant="outlined" sx={{ p: 1.5 }}>
              <Typography variant="subtitle2">Current rate (from latest history entry)</Typography>
              <Typography variant="h6">
                {eur.format(clampNonNegative(latestEntry?.rate ?? 0) + clampNonNegative(latestEntry?.markup ?? 0))}
                <Typography component="span" variant="body2" color="text.secondary">
                  {" "}per unit
                  {latestEntry && (
                    <> (rate {eur.format(latestEntry.rate)} + markup {eur.format(latestEntry.markup)})</>
                  )}
                </Typography>
              </Typography>
            </Paper>

            <Divider />

            <Stack direction="row" spacing={1} alignItems="center" justifyContent="space-between">
              <Typography variant="subtitle2">Rate History</Typography>
              <Button size="small" startIcon={<AddIcon />} onClick={addRateEntry}>
                Add rate entry
              </Button>
            </Stack>

            <TableContainer component={Paper} variant="outlined">
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Effective from</TableCell>
                    <TableCell>Rate (EUR)</TableCell>
                    <TableCell>Markup (EUR)</TableCell>
                    <TableCell>Gross</TableCell>
                    <TableCell>Last modified</TableCell>
                    <TableCell width={60} />
                  </TableRow>
                </TableHead>
                <TableBody>
                  {sortedHistory.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6}>
                        <Typography variant="body2" color="text.secondary">
                          No rate entries. Add one to set a rate.
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ) : (
                    sortedHistory.map((entry) => (
                      <TableRow key={entry.id}>
                        <TableCell>
                          <DatePicker
                            value={entry.effectiveFrom ? dayjs(entry.effectiveFrom) : null}
                            onChange={(v) => {
                              const iso = v?.isValid() ? v.format("YYYY-MM-DD") : "";
                              updateRateEntry(entry.id, { effectiveFrom: iso });
                            }}
                            slotProps={{ textField: { size: "small", sx: { minWidth: 150 } } }}
                          />
                        </TableCell>
                        <TableCell>
                          <TextField
                            size="small"
                            value={String(entry.rate)}
                            onChange={(e) => updateRateEntry(entry.id, { rate: parseNumber(e.target.value) })}
                            inputProps={{ inputMode: "decimal" }}
                            sx={{ width: 100 }}
                          />
                        </TableCell>
                        <TableCell>
                          <TextField
                            size="small"
                            value={String(entry.markup)}
                            onChange={(e) => updateRateEntry(entry.id, { markup: parseNumber(e.target.value) })}
                            inputProps={{ inputMode: "decimal" }}
                            sx={{ width: 100 }}
                          />
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">
                            {eur.format(clampNonNegative(entry.rate) + clampNonNegative(entry.markup))}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="caption" color="text.secondary">
                            {new Date(entry.lastModified).toLocaleString()}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Tooltip title={sortedHistory.length <= 1 ? "Cannot remove last entry" : "Remove"}>
                            <span>
                              <IconButton
                                size="small"
                                onClick={() => removeRateEntry(entry.id)}
                                disabled={sortedHistory.length <= 1}
                              >
                                <DeleteIcon fontSize="small" />
                              </IconButton>
                            </span>
                          </Tooltip>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)} startIcon={<CloseIcon />}>
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={() => {
              if (!editing) return;
              upsert(editing);
              setOpen(false);
            }}
            disabled={!editing?.name.trim()}
          >
            Apply to draft
          </Button>
        </DialogActions>
      </Dialog>

      <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: "block" }}>
        Changes here are kept as a draft until you click "Save" in the top bar.
      </Typography>
    </Box>
  );
};
