import { type FC, useState, useMemo, useCallback } from "react";
import {
  Badge,
  Box,
  Button,
  Chip,
  IconButton,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TableSortLabel,
  Tooltip,
  Typography,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import FilterListIcon from "@mui/icons-material/FilterList";
import ClearIcon from "@mui/icons-material/Clear";
import ReceiptLongIcon from "@mui/icons-material/ReceiptLong";
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
  arrayMove,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";

import type { StoreV1, PO, ID } from "../../types/index";
import { uid, addDaysISO, eur, computePO, safeName } from "../../utils/helpers";
import { usePoSort, type PoSortKey } from "../../hooks/usePoSort";

import { SortablePOTableRow } from "./SortablePOTableRow";
import { POEditorDrawer } from "./POEditorDrawer";
import { POFilterControls, type POFilterValues } from "./POFilterControls";
import { MobileFilterDrawer } from "./MobileFilterDrawer";
import { POMobileList } from "./POMobileList";

const EMPTY_FILTERS: POFilterValues = {
  query: "",
  customerFilter: [],
  trainingFilter: [],
  statusFilter: [],
  dateFrom: "",
  dateTo: "",
};

interface ColumnDef {
  key: PoSortKey;
  label: string;
  align?: "left" | "right";
  width?: number;
}

const SORTABLE_COLUMNS: ColumnDef[] = [
  { key: "poNumber", label: "PO #" },
  { key: "status", label: "Status" },
  { key: "training", label: "Training" },
  { key: "customer", label: "Customer" },
  { key: "producerCount", label: "Producer(s)" },
  { key: "sessionCount", label: "Sessions" },
  { key: "price", label: "Price", align: "right" },
  { key: "profit", label: "Profit", align: "right" },
];

interface POsOverviewProps {
  store: StoreV1;
  onChange: (next: StoreV1) => void;
  onToast: (msg: string, severity?: "success" | "info" | "warning" | "error") => void;
  autoSave: boolean;
}

export const POsOverview: FC<POsOverviewProps> = ({ store, onChange, onToast, autoSave }) => {
  const theme = useTheme();
  const isDesktop = useMediaQuery(theme.breakpoints.up("md"));

  const [filters, setFilters] = useState<POFilterValues>(EMPTY_FILTERS);
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerMode, setDrawerMode] = useState<"new" | "edit">("new");
  const [editingPo, setEditingPo] = useState<PO | null>(null);

  const hasActiveFilters = useMemo((): boolean => {
    return (
      filters.query.trim() !== "" ||
      filters.customerFilter.length > 0 ||
      filters.trainingFilter.length > 0 ||
      filters.statusFilter.length > 0 ||
      filters.dateFrom !== "" ||
      filters.dateTo !== ""
    );
  }, [filters]);

  const clearFilters = useCallback((): void => {
    setFilters(EMPTY_FILTERS);
  }, []);

  const producerById = useMemo(
    () => new Map(store.producers.map((p) => [p.id, p])),
    [store.producers]
  );
  const trainingById = useMemo(
    () => new Map(store.trainings.map((t) => [t.id, t])),
    [store.trainings]
  );
  const customerById = useMemo(
    () => new Map(store.customers.map((c) => [c.id, c])),
    [store.customers]
  );

  const computedByPoId = useMemo(() => {
    const map = new Map<ID, ReturnType<typeof computePO>>();
    for (const po of store.pos) map.set(po.id, computePO(po, producerById));
    return map;
  }, [store.pos, producerById]);

  const existingPoNumbers = useMemo(() => {
    const set = new Set<string>();
    const excludeId = editingPo?.id ?? "";
    for (const p of store.pos) {
      if (p.id !== excludeId && p.poNumber.trim()) {
        set.add(p.poNumber.trim());
      }
    }
    return set;
  }, [store.pos, editingPo?.id]);

  const trainingNameById = useCallback(
    (id: ID | ""): string => safeName(trainingById, id),
    [trainingById]
  );
  const customerNameById = useCallback(
    (id: ID | ""): string => safeName(customerById, id),
    [customerById]
  );

  const filtered = useMemo(() => {
    const q = filters.query.trim().toLowerCase();
    return store.pos.filter((po) => {
      if (filters.customerFilter.length > 0 && !filters.customerFilter.includes(po.customerId)) return false;
      if (filters.trainingFilter.length > 0 && !filters.trainingFilter.includes(po.trainingId)) return false;
      if (filters.statusFilter.length > 0 && !filters.statusFilter.includes(po.status)) return false;
      if (filters.dateFrom || filters.dateTo) {
        const c = computedByPoId.get(po.id);
        const poStart = c?.startDate ?? "";
        const poEnd = c?.endDate ?? "";
        if (!poStart && !poEnd) return false;
        if (filters.dateFrom && poEnd && poEnd < filters.dateFrom) return false;
        if (filters.dateTo && poStart && poStart > filters.dateTo) return false;
      }
      if (!q) return true;
      const trainingName = trainingById.get(po.trainingId)?.name ?? "";
      const customerName = customerById.get(po.customerId)?.name ?? "";
      return (
        po.poNumber.toLowerCase().includes(q) ||
        trainingName.toLowerCase().includes(q) ||
        customerName.toLowerCase().includes(q)
      );
    });
  }, [store.pos, filters, trainingById, customerById, computedByPoId]);

  const { sortKey, sortDir, sorted, isSorting, toggleSort, setSort, clearSort } = usePoSort({
    filtered,
    computedByPoId,
    trainingNameById,
    customerNameById,
  });

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  function duplicatePo(source: PO): PO {
    const shiftedSessions = source.sessions.map((s) => ({
      ...s,
      id: uid("se"),
      date: s.date ? addDaysISO(s.date, 7) : s.date,
    }));
    return {
      ...source,
      id: uid("po"),
      poNumber: source.poNumber ? `${source.poNumber}-copy` : "",
      sessions: shiftedSessions,
    };
  }

  function onDragEnd(e: DragEndEvent): void {
    if (isSorting) return;

    const activeId = String(e.active.id);
    const overId = e.over?.id ? String(e.over.id) : null;
    if (!overId) return;

    if (activeId === overId) return;

    const oldIndex = store.pos.findIndex((x) => x.id === activeId);
    const newIndex = store.pos.findIndex((x) => x.id === overId);
    if (oldIndex < 0 || newIndex < 0) return;

    onChange({ ...store, pos: arrayMove(store.pos, oldIndex, newIndex) });
  }

  const totals = useMemo(() => {
    let price = 0;
    let profit = 0;
    for (const po of filtered) {
      const c = computedByPoId.get(po.id);
      if (!c) continue;
      price += c.price;
      profit += c.profit;
    }
    return { price, profit };
  }, [filtered, computedByPoId]);

  function openNew(): void {
    setDrawerMode("new");
    setEditingPo({
      id: uid("po"),
      poNumber: "",
      trainingId: "",
      customerId: "",
      status: "draft",
      sessions: [],
    });
    setDrawerOpen(true);
  }

  function openEdit(po: PO): void {
    setDrawerMode("edit");
    setEditingPo(JSON.parse(JSON.stringify(po)) as PO);
    setDrawerOpen(true);
  }

  function removePo(id: ID): void {
    onChange({ ...store, pos: store.pos.filter((p) => p.id !== id) });
  }

  function markPaid(id: ID): void {
    onChange({
      ...store,
      pos: store.pos.map((p) => (p.id === id ? { ...p, status: "paid" as const } : p)),
    });
  }

  const activeFilterCount = useMemo((): number => {
    let count = 0;
    if (filters.query.trim()) count++;
    if (filters.customerFilter.length > 0) count++;
    if (filters.trainingFilter.length > 0) count++;
    if (filters.statusFilter.length > 0) count++;
    if (filters.dateFrom || filters.dateTo) count++;
    return count;
  }, [filters]);

  return (
    <Box sx={{ p: 2 }}>
      {/* Header */}
      <Stack
        direction={{ xs: "column", md: "row" }}
        spacing={1.5}
        alignItems={{ md: "center" }}
        justifyContent="space-between"
        sx={{ mb: 2 }}
      >
        <Stack direction="row" spacing={1} alignItems="center">
          <ReceiptLongIcon />
          <Box>
            <Typography variant="h6">PO overview</Typography>
            <Typography variant="caption" color="text.secondary">
              {isSorting
                ? "Sorted by column. Clear sort to drag-reorder."
                : "Drag rows to reorder."}
            </Typography>
          </Box>
        </Stack>

        <Stack direction="row" spacing={1} alignItems="center">
          {/* Mobile filter button */}
          {!isDesktop && (
            <Badge badgeContent={activeFilterCount} color="primary">
              <Button
                variant="outlined"
                startIcon={<FilterListIcon />}
                onClick={() => setMobileFilterOpen(true)}
                size="small"
              >
                Filters
              </Button>
            </Badge>
          )}

          {isSorting && (
            <Tooltip title="Clear sort to re-enable drag reorder">
              <Button
                variant="outlined"
                size="small"
                startIcon={<ClearIcon />}
                onClick={clearSort}
              >
                Clear sort
              </Button>
            </Tooltip>
          )}

          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={openNew}
            sx={{ alignSelf: { xs: "stretch", md: "center" } }}
          >
            New PO
          </Button>
        </Stack>
      </Stack>

      {/* Desktop filters */}
      {isDesktop && (
        <Box sx={{ mb: 2 }}>
          <Stack direction="row" spacing={1} alignItems="center">
            <Box sx={{ flex: 1 }}>
              <POFilterControls
                values={filters}
                onChange={setFilters}
                customers={store.customers}
                trainings={store.trainings}
                layout="row"
              />
            </Box>
            {hasActiveFilters && (
              <Tooltip title="Clear all filters">
                <IconButton size="small" onClick={clearFilters}>
                  <ClearIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            )}
          </Stack>
        </Box>
      )}

      {/* Totals bar */}
      <Paper variant="outlined" sx={{ p: 1.5, mb: 1.5 }}>
        <Stack direction={{ xs: "column", sm: "row" }} spacing={2} alignItems={{ sm: "center" }}>
          <Typography variant="body2" color="text.secondary" sx={{ flex: 1 }}>
            Showing <strong>{filtered.length}</strong> PO(s)
          </Typography>
          <Stack direction="row" spacing={2}>
            <Chip label={`Total price: ${eur.format(totals.price)}`} variant="outlined" />
            <Chip label={`Total profit: ${eur.format(totals.profit)}`} color="success" variant="outlined" />
          </Stack>
        </Stack>
      </Paper>

      {/* Desktop: Table | Mobile: Card list */}
      {isDesktop ? (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
          <SortableContext items={store.pos.map((p) => p.id)} strategy={verticalListSortingStrategy}>
            <TableContainer component={Paper} variant="outlined">
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell width={56} />
                    {SORTABLE_COLUMNS.map((col) => (
                      <TableCell key={col.key} align={col.align ?? "left"} width={col.width}>
                        <TableSortLabel
                          active={sortKey === col.key}
                          direction={sortKey === col.key ? sortDir : "asc"}
                          onClick={() => toggleSort(col.key)}
                        >
                          {col.label}
                        </TableSortLabel>
                      </TableCell>
                    ))}
                    <TableCell align="right" width={200}>
                      Actions
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {sorted.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={10}>
                        <Typography variant="body2" color="text.secondary">
                          No POs match your filters.
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ) : (
                    sorted.map((po) => {
                      const c = computedByPoId.get(po.id) ?? {
                        sessionCount: 0,
                        startDate: "",
                        endDate: "",
                        price: 0,
                        profit: 0,
                        producerIds: [],
                      };
                      return (
                        <SortablePOTableRow
                          key={po.id}
                          po={po}
                          trainingName={safeName(trainingById, po.trainingId)}
                          customerName={safeName(customerById, po.customerId)}
                          producers={store.producers}
                          computed={c}
                          dragDisabled={isSorting}
                          onEdit={() => openEdit(po)}
                          onDelete={() => removePo(po.id)}
                          onMarkPaid={() => markPaid(po.id)}
                          onDuplicate={() => {
                            onChange({ ...store, pos: [duplicatePo(po), ...store.pos] });
                            onToast("PO duplicated in draft (+7 days)", "success");
                          }}
                        />
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </SortableContext>
        </DndContext>
      ) : (
        <POMobileList
          sorted={sorted}
          allPoIds={store.pos.map((p) => p.id)}
          producers={store.producers}
          computedByPoId={computedByPoId}
          trainingById={trainingById}
          customerById={customerById}
          sortKey={sortKey}
          sortDir={sortDir}
          onSetSort={setSort}
          isSorting={isSorting}
          onDragEnd={onDragEnd}
          onEdit={openEdit}
          onDelete={removePo}
          onMarkPaid={markPaid}
          onDuplicate={(po) => {
            onChange({ ...store, pos: [duplicatePo(po), ...store.pos] });
            onToast("PO duplicated in draft (+7 days)", "success");
          }}
        />
      )}

      {/* Mobile filter drawer */}
      {!isDesktop && (
        <MobileFilterDrawer
          open={mobileFilterOpen}
          onClose={() => setMobileFilterOpen(false)}
          values={filters}
          onChange={setFilters}
          onClear={clearFilters}
          hasActiveFilters={hasActiveFilters}
          customers={store.customers}
          trainings={store.trainings}
        />
      )}

      {/* PO editor drawer */}
      {editingPo ? (
        <POEditorDrawer
          existingPoNumbers={existingPoNumbers}
          open={drawerOpen}
          onClose={() => setDrawerOpen(false)}
          mode={drawerMode}
          po={editingPo}
          trainings={store.trainings}
          customers={store.customers}
          producers={store.producers}
          onApply={(po) => {
            if (drawerMode === "new") {
              onChange({ ...store, pos: [po, ...store.pos] });
              onToast("PO added", "success");
            } else {
              onChange({ ...store, pos: store.pos.map((p) => (p.id === po.id ? po : p)) });
              onToast("PO updated", "success");
            }
          }}
        />
      ) : null}

      <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: "block" }}>
        {autoSave
          ? "All changes are automatically synced to the cloud."
          : 'All changes are local drafts until you hit "Save" in the top bar.'}
      </Typography>
    </Box>
  );
};
