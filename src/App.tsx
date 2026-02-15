import { JSX, useState } from "react";
import {
  Alert,
  AppBar,
  Badge,
  Box,
  Button,
  Chip,
  FormControlLabel,
  Snackbar,
  Stack,
  Switch,
  Tab,
  Tabs,
  Toolbar,
  Tooltip,
  Typography,
} from "@mui/material";
import SaveIcon from "@mui/icons-material/Save";
import UndoIcon from "@mui/icons-material/Undo";
import CloudDoneIcon from "@mui/icons-material/CloudDone";
import CloudSyncIcon from "@mui/icons-material/CloudSync";
import ReceiptLongIcon from "@mui/icons-material/ReceiptLong";
import SchoolIcon from "@mui/icons-material/School";
import BusinessIcon from "@mui/icons-material/Business";
import PeopleIcon from "@mui/icons-material/People";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";

import type { StoreV1, ViewKey } from "./types/index";
import { todayISO } from "./utils/helpers";
import { useDraftStore } from "./hooks/useDraftStore";
import { POsOverview } from "./components/po/POsOverview";
import { SimpleEntityManager } from "./components/SimpleEntityManager";
import { ProducersManager } from "./components/ProducersManager";

export default function App(): JSX.Element {
  const { draft, setDraft, dirty, save, discard, autoSave, setAutoSave, saveStatus } = useDraftStore();
  const [view, setView] = useState<ViewKey>("pos");

  const [toast, setToast] = useState<{
    open: boolean;
    msg: string;
    severity: "success" | "info" | "warning" | "error";
  }>({ open: false, msg: "", severity: "info" });

  function notify(msg: string, severity: "success" | "info" | "warning" | "error" = "info"): void {
    setToast({ open: true, msg, severity });
  }

  function onSave(): void {
    save();
    notify("Saved to local storage", "success");
  }

  function onDiscard(): void {
    discard();
    notify("Draft discarded", "info");
  }

  function exportJson(): void {
    const blob = new Blob([JSON.stringify(draft, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `po-tracker-export-${todayISO()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    notify("Exported JSON", "success");
  }

  function importJson(file: File): void {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed: unknown = JSON.parse(String(reader.result));
        if (
          !parsed ||
          typeof parsed !== "object" ||
          (parsed as Record<string, unknown>)["version"] !== 1
        ) {
          throw new Error("Unsupported format/version");
        }
        setDraft(parsed as StoreV1);
        notify("Imported into draft (remember to Save)", "success");
      } catch (e: unknown) {
        const message = e instanceof Error ? e.message : "invalid file";
        notify(`Import failed: ${message}`, "error");
      }
    };
    reader.readAsText(file);
  }

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
    <Box sx={{ minHeight: "100vh", bgcolor: "background.default" }}>
      <AppBar position="sticky" color="default" elevation={0} sx={{ borderBottom: "1px solid", borderColor: "divider" }}>
        <Toolbar>
          <Stack direction="row" spacing={1} alignItems="center" sx={{ flex: 1, minWidth: 0 }}>
            <ReceiptLongIcon />
            <Box sx={{ minWidth: 0 }}>
              <Typography variant="h6" sx={{ lineHeight: 1.15 }}>
                PO Tracker
              </Typography>
            </Box>
            {autoSave ? (
              saveStatus === "saving" ? (
                <Chip
                  icon={<CloudSyncIcon />}
                  label="Saving..."
                  size="small"
                  variant="outlined"
                  sx={{ ml: 1 }}
                />
              ) : saveStatus === "saved" ? (
                <Chip
                  icon={<CloudDoneIcon />}
                  label="Saved"
                  color="success"
                  size="small"
                  variant="outlined"
                  sx={{ ml: 1 }}
                />
              ) : dirty ? (
                <Chip label="Editing..." size="small" variant="outlined" sx={{ ml: 1 }} />
              ) : (
                <Chip
                  icon={<CloudDoneIcon />}
                  label="All changes saved"
                  color="success"
                  size="small"
                  variant="outlined"
                  sx={{ ml: 1 }}
                />
              )
            ) : dirty ? (
              <Chip label="Unsaved changes" color="warning" size="small" variant="outlined" sx={{ ml: 1 }} />
            ) : (
              <Chip label="All changes saved" color="success" size="small" variant="outlined" sx={{ ml: 1 }} />
            )}
          </Stack>

          <Stack direction="row" spacing={1} alignItems="center">
            <FormControlLabel
              control={
                <Switch
                  size="small"
                  checked={autoSave}
                  onChange={(_e, checked) => {
                    setAutoSave(checked);
                    if (checked && dirty) save();
                  }}
                />
              }
              label={<Typography variant="caption">Auto save</Typography>}
              sx={{ mr: 0.5 }}
            />
            <Tooltip title="Export JSON">
              <Button variant="outlined" onClick={exportJson} sx={{ display: { xs: "none", md: "inline-flex" } }}>
                Export
              </Button>
            </Tooltip>

            <Button
              component="label"
              variant="outlined"
              sx={{ display: { xs: "none", md: "inline-flex" } }}
            >
              Import
              <input
                hidden
                type="file"
                accept="application/json"
                onChange={(e) => {
                  const f = (e.target as HTMLInputElement).files?.[0];
                  if (f) importJson(f);
                  (e.target as HTMLInputElement).value = "";
                }}
              />
            </Button>

            {!autoSave && (
              <>
                <Badge color="warning" variant="dot" invisible={!dirty}>
                  <Button variant="contained" startIcon={<SaveIcon />} disabled={!dirty} onClick={onSave}>
                    Save
                  </Button>
                </Badge>
                <Button variant="text" startIcon={<UndoIcon />} disabled={!dirty} onClick={onDiscard}>
                  Discard
                </Button>
              </>
            )}
          </Stack>
        </Toolbar>

        <Tabs
          value={view}
          onChange={(_e, v: ViewKey) => setView(v)}
          variant="scrollable"
          scrollButtons="auto"
          sx={{ px: 2 }}
        >
          <Tab value="pos" label="POs" icon={<ReceiptLongIcon />} iconPosition="start" />
          <Tab value="trainings" label="Trainings" icon={<SchoolIcon />} iconPosition="start" />
          <Tab value="customers" label="Customers" icon={<BusinessIcon />} iconPosition="start" />
          <Tab value="producers" label="Producers" icon={<PeopleIcon />} iconPosition="start" />
        </Tabs>
      </AppBar>

      {view === "pos" ? (
        <POsOverview
          store={draft}
          onChange={(next) => setDraft(next)}
          onToast={notify}
        />
      ) : null}

      {view === "trainings" ? (
        <SimpleEntityManager
          title="Trainings"
          icon={<SchoolIcon />}
          rows={draft.trainings}
          onChange={(next) => setDraft((s) => ({ ...s, trainings: typeof next === "function" ? next(s.trainings) : next }))}
        />
      ) : null}

      {view === "customers" ? (
        <SimpleEntityManager
          title="Customers"
          icon={<BusinessIcon />}
          rows={draft.customers}
          onChange={(next) => setDraft((s) => ({ ...s, customers: typeof next === "function" ? next(s.customers) : next }))}
        />
      ) : null}

      {view === "producers" ? (
        <ProducersManager
          rows={draft.producers}
          onChange={(next) => setDraft((s) => ({ ...s, producers: typeof next === "function" ? next(s.producers) : next }))}
        />
      ) : null}

      <Snackbar
        open={toast.open}
        autoHideDuration={3000}
        onClose={() => setToast((t) => ({ ...t, open: false }))}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert
          onClose={() => setToast((t) => ({ ...t, open: false }))}
          severity={toast.severity}
          sx={{ width: "100%" }}
        >
          {toast.msg}
        </Alert>
      </Snackbar>
    </Box>
    </LocalizationProvider>
  );
}
