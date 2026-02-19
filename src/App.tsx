import { JSX, useState } from "react";
import {
  Alert,
  AppBar,
  Avatar,
  Badge,
  Box,
  Button,
  Chip,
  Divider,
  FormControlLabel,
  IconButton,
  ListItemIcon,
  Menu,
  MenuItem,
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
import LogoutIcon from "@mui/icons-material/Logout";
import FileDownloadIcon from "@mui/icons-material/FileDownload";
import FileUploadIcon from "@mui/icons-material/FileUpload";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { useMsal } from "@azure/msal-react";
import { Toaster } from "sonner";

import type { StoreV1, ViewKey } from "./types/index";
import { todayISO } from "./utils/helpers";
import { useDraftStore } from "./hooks/useDraftStore";
import { POsOverview } from "./components/po/POsOverview";
import { SimpleEntityManager } from "./components/SimpleEntityManager";
import { ProducersManager } from "./components/ProducersManager";

export default function App(): JSX.Element {
  const { draft, setDraft, dirty, save, discard, autoSave, setAutoSave, saveStatus } = useDraftStore();
  const { instance, accounts } = useMsal();
  const [view, setView] = useState<ViewKey>("pos");
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);

  const activeAccount = accounts[0];
  const userName = activeAccount?.name ?? activeAccount?.username ?? "User";
  const userInitial = userName.charAt(0).toUpperCase();

  function handleLogout(): void {
    setAnchorEl(null);
    void instance.logoutRedirect();
  }

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
        <Toolbar sx={{ gap: 1, px: { xs: 1, sm: 2 } }}>
          <Stack direction="row" spacing={0.5} alignItems="center" sx={{ flex: 1, minWidth: 0 }}>
            <ReceiptLongIcon />
            <Typography variant="h6" sx={{ lineHeight: 1.15, display: { xs: "none", sm: "block" } }}>
              PO Tracker
            </Typography>
            {autoSave ? (
              saveStatus === "saving" ? (
                <Chip
                  icon={<CloudSyncIcon />}
                  label="Saving..."
                  size="small"
                  variant="outlined"
                  sx={{ ml: 0.5 }}
                />
              ) : saveStatus === "saved" ? (
                <Chip
                  icon={<CloudDoneIcon />}
                  label="Saved"
                  color="success"
                  size="small"
                  variant="outlined"
                  sx={{ ml: 0.5 }}
                />
              ) : dirty ? (
                <Chip label="Editing..." size="small" variant="outlined" sx={{ ml: 0.5 }} />
              ) : (
                <Tooltip title="All changes saved">
                  <Chip
                    icon={<CloudDoneIcon />}
                    label="Saved"
                    color="success"
                    size="small"
                    variant="outlined"
                    sx={{ ml: 0.5 }}
                  />
                </Tooltip>
              )
            ) : dirty ? (
              <Chip label="Unsaved" color="warning" size="small" variant="outlined" sx={{ ml: 0.5 }} />
            ) : (
              <Tooltip title="All changes saved">
                <Chip label="Saved" color="success" size="small" variant="outlined" sx={{ ml: 0.5 }} />
              </Tooltip>
            )}
          </Stack>

          <Stack direction="row" spacing={0.5} alignItems="center">
            {!autoSave && (
              <>
                <Badge color="warning" variant="dot" invisible={!dirty}>
                  <Tooltip title="Save">
                    <span>
                      <IconButton color="primary" disabled={!dirty} onClick={onSave} size="small" sx={{ display: { sm: "none" } }}>
                        <SaveIcon />
                      </IconButton>
                    </span>
                  </Tooltip>
                  <Button variant="contained" startIcon={<SaveIcon />} disabled={!dirty} onClick={onSave} sx={{ display: { xs: "none", sm: "inline-flex" } }}>
                    Save
                  </Button>
                </Badge>
                <Tooltip title="Discard">
                  <span>
                    <IconButton disabled={!dirty} onClick={onDiscard} size="small" sx={{ display: { sm: "none" } }}>
                      <UndoIcon />
                    </IconButton>
                  </span>
                </Tooltip>
                <Button variant="text" startIcon={<UndoIcon />} disabled={!dirty} onClick={onDiscard} sx={{ display: { xs: "none", sm: "inline-flex" } }}>
                  Discard
                </Button>
              </>
            )}

            <Tooltip title={userName}>
              <IconButton onClick={(e) => setAnchorEl(e.currentTarget)} size="small" sx={{ ml: 1 }}>
                <Avatar sx={{ width: 32, height: 32, fontSize: 14, bgcolor: "primary.main" }}>
                  {userInitial}
                </Avatar>
              </IconButton>
            </Tooltip>
            <Menu
              anchorEl={anchorEl}
              open={Boolean(anchorEl)}
              onClose={() => setAnchorEl(null)}
              anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
              transformOrigin={{ vertical: "top", horizontal: "right" }}
            >
              <MenuItem disabled>
                <Typography variant="body2" color="text.secondary">
                  {activeAccount?.username ?? ""}
                </Typography>
              </MenuItem>
              <Divider />
              <MenuItem onClick={() => { setAnchorEl(null); exportJson(); }}>
                <ListItemIcon><FileDownloadIcon fontSize="small" /></ListItemIcon>
                Export
              </MenuItem>
              <MenuItem component="label">
                <ListItemIcon><FileUploadIcon fontSize="small" /></ListItemIcon>
                Import
                <input
                  hidden
                  type="file"
                  accept="application/json"
                  onChange={(e) => {
                    const f = (e.target as HTMLInputElement).files?.[0];
                    if (f) importJson(f);
                    (e.target as HTMLInputElement).value = "";
                    setAnchorEl(null);
                  }}
                />
              </MenuItem>
              <Divider />
              <MenuItem disableRipple sx={{ "&:hover": { bgcolor: "transparent" } }}>
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
                  label={<Typography variant="body2">Auto save</Typography>}
                />
              </MenuItem>
              <Divider />
              <MenuItem onClick={handleLogout}>
                <ListItemIcon><LogoutIcon fontSize="small" /></ListItemIcon>
                Sign out
              </MenuItem>
            </Menu>
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
          autoSave={autoSave}
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
      <Toaster position="bottom-right" richColors closeButton />
    </Box>
    </LocalizationProvider>
  );
}
