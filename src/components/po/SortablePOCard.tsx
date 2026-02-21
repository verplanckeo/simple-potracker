import { type FC, type CSSProperties, useState, useRef, useEffect } from "react";
import {
  Box,
  Card,
  CardContent,
  Chip,
  Divider,
  IconButton,
  ListItemIcon,
  ListItemText,
  Menu,
  MenuItem,
  Stack,
  Typography,
} from "@mui/material";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import EditIcon from "@mui/icons-material/Edit";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import DeleteIcon from "@mui/icons-material/Delete";
import PaidIcon from "@mui/icons-material/PriceCheck";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

import type { PO, POComputed, POStatus } from "../../types/index";
import { eur, formatDateRange } from "../../utils/helpers";
import { SortHandle } from "../dnd/SortHandle";

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

interface SortablePOCardProps {
  po: PO;
  trainingName: string;
  customerName: string;
  producerNames: string[];
  computed: POComputed;
  dragDisabled?: boolean;
  onEdit: () => void;
  onDelete: () => void;
  onDuplicate: () => void;
  onMarkPaid: () => void;
}

export const SortablePOCard: FC<SortablePOCardProps> = ({
  po,
  trainingName,
  customerName,
  producerNames,
  computed,
  dragDisabled,
  onEdit,
  onDelete,
  onDuplicate,
  onMarkPaid,
}) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: po.id,
    disabled: !!dragDisabled,
  });

  const cardRef = useRef<HTMLDivElement>(null);
  const [menuAnchor, setMenuAnchor] = useState<HTMLElement | null>(null);
  const [celebrating, setCelebrating] = useState(false);
  const prevStatus = useRef(po.status);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | undefined;
    if (prevStatus.current !== "paid" && po.status === "paid") {
      setCelebrating(true);
      timer = setTimeout(() => setCelebrating(false), 1200);
    }
    prevStatus.current = po.status;
    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [po.status]);

  const style: CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.65 : 1,
  };

  const setRefs = (node: HTMLDivElement | null): void => {
    setNodeRef(node);
    (cardRef as React.MutableRefObject<HTMLDivElement | null>).current = node;
  };

  return (
    <Card
      ref={setRefs}
      style={style}
      variant="outlined"
      sx={{
        mb: 1,
        ...(celebrating
          ? {
              animation: "celebratePulse 0.4s ease-in-out 2",
              "@keyframes celebratePulse": {
                "0%, 100%": { backgroundColor: "transparent" },
                "50%": { backgroundColor: "rgba(76, 175, 80, 0.12)" },
              },
            }
          : {}),
      }}
    >
      <CardContent sx={{ p: 1.5, "&:last-child": { pb: 1.5 } }}>
        {/* Row 1: drag handle + PO # + status + menu */}
        <Stack direction="row" alignItems="center" spacing={0.5}>
          <SortHandle
            {...(listeners ? { listeners } : {})}
            attributes={attributes}
            disabled={!!dragDisabled}
          />
          <Typography variant="subtitle2" sx={{ fontWeight: 700, flex: 1, minWidth: 0 }} noWrap>
            {po.poNumber || "(no PO #)"}
          </Typography>
          <Chip
            size="small"
            label={STATUS_LABEL[po.status] ?? "Draft"}
            color={STATUS_CHIP_COLOR[po.status] ?? "default"}
          />
          <IconButton size="small" onClick={(e) => setMenuAnchor(e.currentTarget)}>
            <MoreVertIcon fontSize="small" />
          </IconButton>
        </Stack>

        {/* Row 2: training + customer */}
        <Stack direction="row" spacing={1} sx={{ mt: 0.75, pl: 4.5 }}>
          <Typography variant="body2" color="text.secondary" sx={{ flex: 1, minWidth: 0 }} noWrap>
            {trainingName}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ flex: 1, minWidth: 0 }} noWrap>
            {customerName}
          </Typography>
        </Stack>

        <Divider sx={{ my: 0.75, ml: 4.5 }} />

        {/* Row 3: meta + money */}
        <Stack direction="row" alignItems="center" sx={{ pl: 4.5 }}>
          <Box sx={{ flex: 1 }}>
            <Typography variant="caption" color="text.secondary">
              {computed.sessionCount} session{computed.sessionCount !== 1 ? "s" : ""}
              {producerNames.length > 0 && ` · ${producerNames.join(", ")}`}
            </Typography>
            {(computed.startDate || computed.endDate) && (
              <Typography variant="caption" color="text.secondary" display="block">
                {formatDateRange(computed.startDate, computed.endDate)}
              </Typography>
            )}
          </Box>
          <Stack alignItems="flex-end" sx={{ flexShrink: 0 }}>
            <Typography variant="body2" sx={{ fontWeight: 700 }}>
              {eur.format(computed.price)}
            </Typography>
            <Typography variant="caption" color="success.main" sx={{ fontWeight: 600 }}>
              {eur.format(computed.profit)} profit
            </Typography>
          </Stack>
        </Stack>
      </CardContent>

      {/* Actions menu */}
      <Menu
        anchorEl={menuAnchor}
        open={!!menuAnchor}
        onClose={() => setMenuAnchor(null)}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
        transformOrigin={{ vertical: "top", horizontal: "right" }}
      >
        {po.status !== "paid" && (
          <MenuItem
            onClick={() => {
              setMenuAnchor(null);
              onMarkPaid();
            }}
          >
            <ListItemIcon>
              <PaidIcon fontSize="small" color="success" />
            </ListItemIcon>
            <ListItemText>Mark as paid</ListItemText>
          </MenuItem>
        )}
        <MenuItem
          onClick={() => {
            setMenuAnchor(null);
            onEdit();
          }}
        >
          <ListItemIcon>
            <EditIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Edit</ListItemText>
        </MenuItem>
        <MenuItem
          onClick={() => {
            setMenuAnchor(null);
            onDuplicate();
          }}
        >
          <ListItemIcon>
            <ContentCopyIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Duplicate (+7 days)</ListItemText>
        </MenuItem>
        <Divider />
        <MenuItem
          onClick={() => {
            setMenuAnchor(null);
            onDelete();
          }}
        >
          <ListItemIcon>
            <DeleteIcon fontSize="small" color="error" />
          </ListItemIcon>
          <ListItemText sx={{ color: "error.main" }}>Delete</ListItemText>
        </MenuItem>
      </Menu>
    </Card>
  );
};
