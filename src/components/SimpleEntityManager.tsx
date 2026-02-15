import { type FC, type ReactNode, useState, useMemo } from "react";
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

import type { SimpleEntity, ID } from "../types/index";
import { uid } from "../utils/helpers";

interface SimpleEntityManagerProps {
  title: string;
  icon: ReactNode;
  rows: SimpleEntity[];
  onChange: (next: SimpleEntity[] | ((prev: SimpleEntity[]) => SimpleEntity[])) => void;
}

export const SimpleEntityManager: FC<SimpleEntityManagerProps> = ({
  title,
  icon,
  rows,
  onChange,
}) => {
  const [query, setQuery] = useState("");
  const [editing, setEditing] = useState<SimpleEntity | null>(null);
  const [open, setOpen] = useState(false);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((r) => r.name.toLowerCase().includes(q));
  }, [query, rows]);

  function upsert(entity: SimpleEntity): void {
    const name = entity.name.trim();
    if (!name) return;

    onChange((prev) => {
      const existingIndex = prev.findIndex((p) => p.id === entity.id);
      if (existingIndex >= 0) {
        const next = [...prev];
        next[existingIndex] = { ...entity, name };
        return next;
      }
      return [{ ...entity, name }, ...prev];
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
          {icon}
          <Typography variant="h6">{title}</Typography>
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
              setEditing({ id: uid("e"), name: "" });
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
              <TableCell width={56} />
              <TableCell>Name</TableCell>
              <TableCell align="right" width={160}>
                Actions
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={3}>
                  <Typography variant="body2" color="text.secondary">
                    No items.
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((row) => (
                <TableRow key={row.id} hover>
                  <TableCell />
                  <TableCell>{row.name}</TableCell>
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
        <DialogTitle>{editing?.name ? "Edit" : "New"}</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Name"
            fullWidth
            value={editing?.name ?? ""}
            onChange={(e) => setEditing((p) => (p ? { ...p, name: e.target.value } : p))}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                if (editing) {
                  upsert(editing);
                  setOpen(false);
                }
              }
            }}
          />
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
