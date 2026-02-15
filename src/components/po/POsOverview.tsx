import { type FC, useState, useMemo } from "react";
import {
  Box,
  Button,
  Chip,
  FormControl,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
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

import type { StoreV1, PO, ID, POStatus } from "../../types/index";
import { PO_STATUSES } from "../../types/index";
import { uid, addDaysISO, eur, computePO, safeName } from "../../utils/helpers";

import { SortablePOTableRow } from "./SortablePOTableRow";
import { POEditorDrawer } from "./POEditorDrawer";
import { DateRangeFilter } from "./DateRangeFilter";
import { DuplicateZone } from "../dnd/DuplicateZone";

interface POsOverviewProps {
  store: StoreV1;
  onChange: (next: StoreV1) => void;
  onToast: (msg: string, severity?: "success" | "info" | "warning" | "error") => void;
}

export const POsOverview: FC<POsOverviewProps> = ({ store, onChange, onToast }) => {
  const [query, setQuery] = useState("");
  const [customerFilter, setCustomerFilter] = useState<ID | "">("");
  const [trainingFilter, setTrainingFilter] = useState<ID | "">("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [statusFilter, setStatusFilter] = useState<POStatus | "">("");

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerMode, setDrawerMode] = useState<"new" | "edit">("new");
  const [editingPo, setEditingPo] = useState<PO | null>(null);

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

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return store.pos.filter((po) => {
      if (customerFilter && po.customerId !== customerFilter) return false;
      if (trainingFilter && po.trainingId !== trainingFilter) return false;
      if (statusFilter && po.status !== statusFilter) return false;
      if (dateFrom || dateTo) {
        const c = computedByPoId.get(po.id);
        const poStart = c?.startDate ?? "";
        const poEnd = c?.endDate ?? "";
        if (!poStart && !poEnd) return false;
        if (dateFrom && poEnd && poEnd < dateFrom) return false;
        if (dateTo && poStart && poStart > dateTo) return false;
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
  }, [store.pos, query, customerFilter, trainingFilter, statusFilter, dateFrom, dateTo, trainingById, customerById, computedByPoId]);

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
    const activeId = String(e.active.id);
    const overId = e.over?.id ? String(e.over.id) : null;
    if (!overId) return;

    if (overId === "po-duplicate-zone") {
      const source = store.pos.find((p) => p.id === activeId);
      if (!source) return;
      onChange({ ...store, pos: [duplicatePo(source), ...store.pos] });
      onToast("PO duplicated in draft (+7 days)", "success");
      return;
    }

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

  return (
    <Box sx={{ p: 2 }}>
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
              Drag rows to reorder. Drop onto the duplicate zone to clone quickly.
            </Typography>
          </Box>
        </Stack>

        <Stack direction={{ xs: "column", sm: "row" }} spacing={1} alignItems={{ sm: "center" }}>
          <TextField size="small" label="Search" value={query} onChange={(e) => setQuery(e.target.value)} />
          <FormControl size="small" sx={{ minWidth: 180 }}>
            <InputLabel id="customer-filter">Customer</InputLabel>
            <Select
              labelId="customer-filter"
              label="Customer"
              value={customerFilter}
              onChange={(e) => setCustomerFilter(e.target.value as ID | "")}
            >
              <MenuItem value="">
                <em>All</em>
              </MenuItem>
              {store.customers
                .slice()
                .sort((a, b) => a.name.localeCompare(b.name))
                .map((c) => (
                  <MenuItem key={c.id} value={c.id}>
                    {c.name}
                  </MenuItem>
                ))}
            </Select>
          </FormControl>
          <FormControl size="small" sx={{ minWidth: 180 }}>
            <InputLabel id="training-filter">Training</InputLabel>
            <Select
              labelId="training-filter"
              label="Training"
              value={trainingFilter}
              onChange={(e) => setTrainingFilter(e.target.value as ID | "")}
            >
              <MenuItem value="">
                <em>All</em>
              </MenuItem>
              {store.trainings
                .slice()
                .sort((a, b) => a.name.localeCompare(b.name))
                .map((t) => (
                  <MenuItem key={t.id} value={t.id}>
                    {t.name}
                  </MenuItem>
                ))}
            </Select>
          </FormControl>
          <FormControl size="small" sx={{ minWidth: 140 }}>
            <InputLabel id="status-filter">Status</InputLabel>
            <Select
              labelId="status-filter"
              label="Status"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as POStatus | "")}
            >
              <MenuItem value="">
                <em>All</em>
              </MenuItem>
              {PO_STATUSES.map((s) => (
                <MenuItem key={s.value} value={s.value}>
                  {s.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <DateRangeFilter
            dateFrom={dateFrom}
            dateTo={dateTo}
            onDateFromChange={setDateFrom}
            onDateToChange={setDateTo}
          />
          <Button variant="contained" startIcon={<AddIcon />} onClick={openNew}>
            New PO
          </Button>
        </Stack>
      </Stack>

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

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
        <SortableContext items={store.pos.map((p) => p.id)} strategy={verticalListSortingStrategy}>
          <TableContainer component={Paper} variant="outlined">
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell width={56} />
                  <TableCell>PO #</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Training</TableCell>
                  <TableCell>Customer</TableCell>
                  <TableCell>Producer(s)</TableCell>
                  <TableCell>Sessions</TableCell>
                  <TableCell align="right">Price</TableCell>
                  <TableCell align="right">Profit</TableCell>
                  <TableCell align="right" width={200}>
                    Actions
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filtered.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={10}>
                      <Typography variant="body2" color="text.secondary">
                        No POs match your filters.
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  filtered.map((po) => {
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

          <Box sx={{ mt: 1.5 }}>
            <DuplicateZone
              id="po-duplicate-zone"
              label="Drop a PO here to create a copy"
              helper="We'll copy all inputs and shift all session dates by +7 days."
            />
          </Box>
        </SortableContext>
      </DndContext>

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
              onToast("PO added to draft", "success");
            } else {
              onChange({ ...store, pos: store.pos.map((p) => (p.id === po.id ? po : p)) });
              onToast("PO updated in draft", "success");
            }
          }}
        />
      ) : null}

      <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: "block" }}>
        All changes are local drafts until you hit "Save" in the top bar.
      </Typography>
    </Box>
  );
};
