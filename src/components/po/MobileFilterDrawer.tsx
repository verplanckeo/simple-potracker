import type { FC } from "react";
import {
  Box,
  Button,
  Drawer,
  Stack,
  Typography,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import ClearAllIcon from "@mui/icons-material/ClearAll";

import type { Customer, Training } from "../../types/index";
import { POFilterControls, type POFilterValues } from "./POFilterControls";

interface MobileFilterDrawerProps {
  open: boolean;
  onClose: () => void;
  values: POFilterValues;
  onChange: (next: POFilterValues) => void;
  onClear: () => void;
  hasActiveFilters: boolean;
  customers: Customer[];
  trainings: Training[];
}

export const MobileFilterDrawer: FC<MobileFilterDrawerProps> = ({
  open,
  onClose,
  values,
  onChange,
  onClear,
  hasActiveFilters,
  customers,
  trainings,
}) => {
  return (
    <Drawer
  anchor="right"
  open={open}
  onClose={onClose}
  PaperProps={{
    sx: {
      width: { xs: "100%", sm: 360 },
      p: 2,
      display: "flex",
      flexDirection: "column",
      height: "100dvh",     // or "100vh"
      overflow: "hidden",   // keep footer visible, only middle scrolls
    },
  }}
>
  <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2, flexShrink: 0 }}>
    <Typography variant="h6">Filters</Typography>
    <Button size="small" startIcon={<CloseIcon />} onClick={onClose}>
      Close
    </Button>
  </Stack>

  <Box sx={{ flex: 1, minHeight: 0, overflowY: "auto" }}>
    <POFilterControls
      values={values}
      onChange={onChange}
      customers={customers}
      trainings={trainings}
      layout="column"
    />
  </Box>

  <Stack direction="column" spacing={1} sx={{ mt: 2, pt: 2, borderTop: 1, borderColor: "divider", flexShrink: 0 }}>
    <Button variant="outlined" startIcon={<ClearAllIcon />} onClick={onClear} disabled={!hasActiveFilters} fullWidth>
      Clear all
    </Button>
    <Button variant="contained" onClick={onClose} fullWidth>
      Done
    </Button>
  </Stack>
</Drawer>
  );
};
