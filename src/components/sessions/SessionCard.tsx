import type { FC, CSSProperties } from "react";
import {
  Chip,
  FormControl,
  IconButton,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import DeleteIcon from "@mui/icons-material/Delete";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

import type { Session, Producer, ID } from "../../types/index.ts";
import { eur, clampNonNegative, parseNumber } from "../../utils/helpers";
import { SortHandle } from "../dnd/SortHandle";

interface SessionCardProps {
  session: Session;
  producerById: Map<ID, Producer>;
  onChange: (next: Session) => void;
  onRemove: () => void;
  onDuplicate: () => void;
  disableDnd?: boolean;
}

export const SessionCard: FC<SessionCardProps> = ({
  session,
  producerById,
  onChange,
  onRemove,
  onDuplicate,
  disableDnd,
}) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: session.id,
  });

  const style: CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.75 : 1,
  };

  const producer = session.producerId ? producerById.get(session.producerId) : undefined;
  const units = clampNonNegative(session.units ?? 0);
  const price = producer ? units * (producer.rate + producer.markup) : 0;
  const profit = producer ? units * producer.markup : 0;

  return (
    <Paper ref={setNodeRef} style={style} variant="outlined" sx={{ p: 1.5 }}>
      <Stack spacing={1.25}>
        <Stack direction="row" spacing={1} alignItems="center" justifyContent="space-between">
          <Stack direction="row" spacing={1} alignItems="center">
            <SortHandle listeners={listeners} attributes={attributes} disabled={disableDnd} />
            <Typography variant="subtitle2">Session</Typography>
            {session.date ? (
              <Chip size="small" label={session.date} variant="outlined" />
            ) : (
              <Chip size="small" label="No date" color="warning" variant="outlined" />
            )}
          </Stack>

          <Stack direction="row" spacing={0.5}>
            <Tooltip title="Duplicate (copies inputs)">
              <IconButton size="small" onClick={onDuplicate}>
                <ContentCopyIcon fontSize="small" />
              </IconButton>
            </Tooltip>
            <Tooltip title="Remove">
              <IconButton size="small" onClick={onRemove}>
                <DeleteIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </Stack>
        </Stack>

        <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5}>
          <TextField
            label="Date"
            type="date"
            value={session.date}
            onChange={(e) => onChange({ ...session, date: e.target.value })}
            InputLabelProps={{ shrink: true }}
            fullWidth
          />

          <FormControl fullWidth>
            <InputLabel id={`producer-${session.id}`}>Producer</InputLabel>
            <Select
              labelId={`producer-${session.id}`}
              label="Producer"
              value={session.producerId}
              onChange={(e) => onChange({ ...session, producerId: e.target.value as ID | "" })}
            >
              <MenuItem value="">
                <em>{"\u2014"}</em>
              </MenuItem>
              {Array.from(producerById.values())
                .sort((a, b) => a.name.localeCompare(b.name))
                .map((p) => (
                  <MenuItem key={p.id} value={p.id}>
                    {p.name} · {eur.format(p.rate + p.markup)}/unit
                  </MenuItem>
                ))}
            </Select>
          </FormControl>

          <TextField
            label="Units"
            value={String(session.units)}
            onChange={(e) => onChange({ ...session, units: parseNumber(e.target.value) })}
            inputProps={{ inputMode: "decimal" }}
            fullWidth
          />
        </Stack>

        <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5} alignItems={{ sm: "center" }}>
          <TextField
            label="Note (optional)"
            value={session.note ?? ""}
            onChange={(e) => onChange({ ...session, note: e.target.value })}
            fullWidth
          />
          <Paper variant="outlined" sx={{ p: 1.25, minWidth: { sm: 240 } }}>
            <Typography variant="caption" color="text.secondary">
              Pricing
            </Typography>
            <Typography variant="subtitle2">
              Price: <strong>{eur.format(price)}</strong>
            </Typography>
            <Typography variant="subtitle2">
              Profit: <strong>{eur.format(profit)}</strong>
            </Typography>
          </Paper>
        </Stack>
      </Stack>
    </Paper>
  );
};
