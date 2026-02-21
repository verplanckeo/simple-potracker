import type { FC } from "react";
import {
  Box,
  FormControl,
  IconButton,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  Typography,
} from "@mui/material";
import ArrowUpwardIcon from "@mui/icons-material/ArrowUpward";
import ArrowDownwardIcon from "@mui/icons-material/ArrowDownward";
import {
  DndContext,
  type DragEndEvent,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";

import type { PO, Producer, POComputed, ID } from "../../types/index";
import type { PoSortKey, SortDir } from "../../hooks/usePoSort";
import { safeName } from "../../utils/helpers";
import { SortablePOCard } from "./SortablePOCard";

const SORT_OPTIONS: { key: PoSortKey; label: string }[] = [
  { key: "poNumber", label: "PO #" },
  { key: "status", label: "Status" },
  { key: "training", label: "Training" },
  { key: "customer", label: "Customer" },
  { key: "price", label: "Price" },
  { key: "profit", label: "Profit" },
  { key: "sessionCount", label: "Sessions" },
  { key: "startDate", label: "Start date" },
];

interface POMobileListProps {
  sorted: PO[];
  allPoIds: string[];
  producers: Producer[];
  computedByPoId: Map<ID, POComputed>;
  trainingById: Map<ID, { name: string }>;
  customerById: Map<ID, { name: string }>;
  sortKey: PoSortKey | null;
  sortDir: SortDir;
  onSetSort: (key: PoSortKey | null, dir?: SortDir) => void;
  isSorting: boolean;
  onDragEnd: (e: DragEndEvent) => void;
  onEdit: (po: PO) => void;
  onDelete: (id: ID) => void;
  onMarkPaid: (id: ID) => void;
  onDuplicate: (po: PO) => void;
}

export const POMobileList: FC<POMobileListProps> = ({
  sorted,
  allPoIds,
  producers,
  computedByPoId,
  trainingById,
  customerById,
  sortKey,
  sortDir,
  onSetSort,
  isSorting,
  onDragEnd,
  onEdit,
  onDelete,
  onMarkPaid,
  onDuplicate,
}) => {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  return (
    <Box>
      {/* Sort controls */}
      <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1.5 }}>
        <FormControl size="small" sx={{ minWidth: 130, flex: 1 }}>
          <InputLabel id="mobile-sort-label">Sort by</InputLabel>
          <Select
            labelId="mobile-sort-label"
            label="Sort by"
            value={sortKey ?? ""}
            onChange={(e) => {
              const val = e.target.value as PoSortKey | "";
              if (val === "") {
                onSetSort(null);
              } else {
                onSetSort(val, sortDir);
              }
            }}
          >
            <MenuItem value="">
              <em>Manual order</em>
            </MenuItem>
            {SORT_OPTIONS.map((o) => (
              <MenuItem key={o.key} value={o.key}>
                {o.label}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        {isSorting && (
          <IconButton
            size="small"
            onClick={() => onSetSort(sortKey, sortDir === "asc" ? "desc" : "asc")}
            sx={{ border: 1, borderColor: "divider" }}
          >
            {sortDir === "asc" ? (
              <ArrowUpwardIcon fontSize="small" />
            ) : (
              <ArrowDownwardIcon fontSize="small" />
            )}
          </IconButton>
        )}
      </Stack>

      {isSorting && (
        <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: "block" }}>
          Drag reorder disabled while sorting.
        </Typography>
      )}

      {/* Card list */}
      {sorted.length === 0 ? (
        <Typography variant="body2" color="text.secondary" sx={{ py: 4, textAlign: "center" }}>
          No POs match your filters.
        </Typography>
      ) : (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
          <SortableContext items={allPoIds} strategy={verticalListSortingStrategy}>
            {sorted.map((po) => {
              const c = computedByPoId.get(po.id) ?? {
                sessionCount: 0,
                startDate: "",
                endDate: "",
                price: 0,
                profit: 0,
                producerIds: [] as ID[],
              };
              const producerNameList = c.producerIds
                .map((id) => producers.find((p) => p.id === id)?.name ?? "(missing)")
                .sort((a, b) => a.localeCompare(b));

              return (
                <SortablePOCard
                  key={po.id}
                  po={po}
                  trainingName={safeName(trainingById, po.trainingId)}
                  customerName={safeName(customerById, po.customerId)}
                  producerNames={producerNameList}
                  computed={c}
                  dragDisabled={isSorting}
                  onEdit={() => onEdit(po)}
                  onDelete={() => onDelete(po.id)}
                  onMarkPaid={() => onMarkPaid(po.id)}
                  onDuplicate={() => onDuplicate(po)}
                />
              );
            })}
          </SortableContext>
        </DndContext>
      )}
    </Box>
  );
};
