import { type FC, useState, useMemo } from "react";
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
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

import type { Producer, ID } from "../types/index.ts";
import { uid, eur, clampNonNegative, parseNumber } from "../utils/helpers";

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

  function upsert(entity: Producer): void {
    const name = entity.name.trim();
    if (!name) return;

    const sanitized: Producer = {
      ...entity,
      name,
      rate: clampNonNegative(entity.rate),
      markup: clampNonNegative(entity.markup),
    };

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
              setEditing({ id: uid("pr"), name: "", rate: 0, markup: 0 });
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
                  <TableCell>{row.name}</TableCell>
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

      <Dialog open={open} onClose={() => setOpen(false)} fullWidth maxWidth="sm">
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
            <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
              <TextField
                label="Rate (EUR per unit)"
                value={String(editing?.rate ?? 0)}
                onChange={(e) =>
                  setEditing((p) => (p ? { ...p, rate: parseNumber(e.target.value) } : p))
                }
                inputProps={{ inputMode: "decimal" }}
                fullWidth
              />
              <TextField
                label="Markup (EUR per unit)"
                value={String(editing?.markup ?? 0)}
                onChange={(e) =>
                  setEditing((p) => (p ? { ...p, markup: parseNumber(e.target.value) } : p))
                }
                inputProps={{ inputMode: "decimal" }}
                fullWidth
              />
            </Stack>
            <Paper variant="outlined" sx={{ p: 1.5 }}>
              <Typography variant="subtitle2">Gross wage charged to customer</Typography>
              <Typography variant="h6">
                {eur.format(clampNonNegative(editing?.rate ?? 0) + clampNonNegative(editing?.markup ?? 0))}
                <Typography component="span" variant="body2" color="text.secondary">
                  {" "}
                  per unit
                </Typography>
              </Typography>
            </Paper>
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
