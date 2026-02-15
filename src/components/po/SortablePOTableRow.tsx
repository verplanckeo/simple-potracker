import { type FC, type CSSProperties, useState, useEffect, useRef } from "react";
import {
  Chip,
  IconButton,
  Stack,
  TableCell,
  TableRow,
  Tooltip,
  Typography,
} from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import DeleteIcon from "@mui/icons-material/Delete";
import PaidIcon from "@mui/icons-material/PriceCheck";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

import type { PO, Producer, POComputed, POStatus } from "../../types/index.ts";
import { eur, formatDateRange } from "../../utils/helpers.ts";
import { SortHandle } from "../dnd/SortHandle.tsx";

const STATUS_CHIP_COLOR: Record<POStatus, "default" | "info" | "success"> = {
  draft: "default",
  sent: "info",
  paid: "success",
};

const STATUS_LABEL: Record<POStatus, string> = {
  draft: "Draft",
  sent: "Sent",
  paid: "Paid",
};

interface SortablePOTableRowProps {
  po: PO;
  trainingName: string;
  customerName: string;
  producers: Producer[];
  computed: POComputed;
  onEdit: () => void;
  onDelete: () => void;
  onDuplicate: () => void;
  onMarkPaid: () => void;
}

const CONFETTI_COLORS = ["#4caf50", "#ff9800", "#2196f3", "#e91e63", "#ffeb3b", "#9c27b0"];

function spawnConfetti(container: HTMLElement): void {
  const rect = container.getBoundingClientRect();
  const count = 30;

  for (let i = 0; i < count; i++) {
    const particle = document.createElement("div");
    const color = CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)];
    const size = 4 + Math.random() * 4;
    const startX = rect.width * 0.3 + Math.random() * rect.width * 0.4;
    const startY = rect.height / 2;
    const angle = -Math.PI / 2 + (Math.random() - 0.5) * Math.PI;
    const velocity = 80 + Math.random() * 120;
    const dx = Math.cos(angle) * velocity;
    const dy = Math.sin(angle) * velocity;
    const rotation = Math.random() * 360;

    Object.assign(particle.style, {
      position: "absolute",
      left: `${startX}px`,
      top: `${startY}px`,
      width: `${size}px`,
      height: `${size}px`,
      backgroundColor: color,
      borderRadius: Math.random() > 0.5 ? "50%" : "1px",
      pointerEvents: "none",
      zIndex: "9999",
      transform: `rotate(${rotation}deg)`,
    });

    container.style.position = "relative";
    container.style.overflow = "visible";
    container.appendChild(particle);

    const duration = 700 + Math.random() * 400;
    const start = performance.now();

    function animate(now: number): void {
      const elapsed = now - start;
      const t = Math.min(elapsed / duration, 1);
      const ease = 1 - (1 - t) * (1 - t);
      const x = startX + dx * ease;
      const y = startY + dy * ease + 120 * t * t;
      const opacity = t < 0.7 ? 1 : 1 - (t - 0.7) / 0.3;
      const scale = t < 0.2 ? t / 0.2 : 1;

      particle.style.left = `${x}px`;
      particle.style.top = `${y}px`;
      particle.style.opacity = String(opacity);
      particle.style.transform = `rotate(${rotation + t * 360}deg) scale(${scale})`;

      if (t < 1) {
        requestAnimationFrame(animate);
      } else {
        particle.remove();
      }
    }

    requestAnimationFrame(animate);
  }
}

export const SortablePOTableRow: FC<SortablePOTableRowProps> = ({
  po,
  trainingName,
  customerName,
  producers,
  computed,
  onEdit,
  onDelete,
  onDuplicate,
  onMarkPaid,
}) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: po.id,
  });
  const rowRef = useRef<HTMLTableRowElement>(null);
  const [celebrating, setCelebrating] = useState(false);
  const prevStatus = useRef(po.status);

  useEffect(() => {
    if (prevStatus.current !== "paid" && po.status === "paid" && rowRef.current) {
      setCelebrating(true);
      spawnConfetti(rowRef.current);
      const timer = setTimeout(() => setCelebrating(false), 1200);
      return () => clearTimeout(timer);
    }
    prevStatus.current = po.status;
  }, [po.status]);

  const style: CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.65 : 1,
  };

  const setRefs = (node: HTMLTableRowElement | null): void => {
    setNodeRef(node);
    (rowRef as React.MutableRefObject<HTMLTableRowElement | null>).current = node;
  };

  return (
    <TableRow
      ref={setRefs}
      style={style}
      hover
      sx={celebrating ? {
        animation: "celebratePulse 0.4s ease-in-out 2",
        "@keyframes celebratePulse": {
          "0%, 100%": { backgroundColor: "transparent" },
          "50%": { backgroundColor: "rgba(76, 175, 80, 0.12)" },
        },
      } : undefined}
    >
      <TableCell width={56}>
        <SortHandle listeners={listeners} attributes={attributes} />
      </TableCell>
      <TableCell sx={{ fontWeight: 600 }}>{po.poNumber || "(no PO #)"}</TableCell>
      <TableCell>
        <Chip
          size="small"
          label={STATUS_LABEL[po.status] ?? "Draft"}
          color={STATUS_CHIP_COLOR[po.status] ?? "default"}
        />
      </TableCell>
      <TableCell>{trainingName}</TableCell>
      <TableCell>{customerName}</TableCell>
      <TableCell>
        <Stack direction="row" spacing={0.5} flexWrap="wrap" useFlexGap>
          {computed.producerIds.length === 0 ? (
            <Chip size="small" label={"\u2014"} variant="outlined" />
          ) : (
            computed.producerIds
              .map((id) => producers.find((p) => p.id === id)?.name ?? "(missing)")
              .sort((a, b) => a.localeCompare(b))
              .map((name) => <Chip key={name} size="small" label={name} variant="outlined" />)
          )}
        </Stack>
      </TableCell>
      <TableCell>
        <Typography variant="body2" sx={{ fontWeight: 600 }}>
          {computed.sessionCount}
        </Typography>
        <Typography variant="caption" color="text.secondary">
          {formatDateRange(computed.startDate, computed.endDate)}
        </Typography>
      </TableCell>
      <TableCell align="right">
        <Typography variant="body2" sx={{ fontWeight: 700 }}>
          {eur.format(computed.price)}
        </Typography>
      </TableCell>
      <TableCell align="right">
        <Typography variant="body2" sx={{ fontWeight: 700 }}>
          {eur.format(computed.profit)}
        </Typography>
      </TableCell>
      <TableCell align="right" width={200}>
        {po.status !== "paid" && (
          <Tooltip title="Mark as paid">
            <IconButton size="small" color="success" onClick={onMarkPaid}>
              <PaidIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        )}
        <Tooltip title="Edit">
          <IconButton size="small" onClick={onEdit}>
            <EditIcon fontSize="small" />
          </IconButton>
        </Tooltip>
        <Tooltip title="Duplicate (copies inputs + shifts dates +7 days)">
          <IconButton size="small" onClick={onDuplicate}>
            <ContentCopyIcon fontSize="small" />
          </IconButton>
        </Tooltip>
        <Tooltip title="Delete">
          <IconButton size="small" onClick={onDelete}>
            <DeleteIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      </TableCell>
    </TableRow>
  );
};
