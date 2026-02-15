import type { FC } from "react";
import { Box, Paper, Stack, Typography } from "@mui/material";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import { useDroppable } from "@dnd-kit/core";

interface DuplicateZoneProps {
  id: string;
  label: string;
  helper?: string;
}

export const DuplicateZone: FC<DuplicateZoneProps> = ({ id, label, helper }) => {
  const { setNodeRef, isOver } = useDroppable({ id });

  return (
    <Paper
      ref={setNodeRef}
      variant="outlined"
      sx={{
        p: 1.5,
        borderStyle: "dashed",
        borderWidth: 2,
        opacity: 0.95,
        ...(isOver
          ? {
              transform: "scale(1.01)",
              boxShadow: "0 6px 16px rgba(0,0,0,0.12)",
            }
          : null),
      }}
    >
      <Stack direction={{ xs: "column", sm: "row" }} spacing={1} alignItems={{ sm: "center" }}>
        <ContentCopyIcon fontSize="small" />
        <Box>
          <Typography variant="subtitle2">{label}</Typography>
          {helper ? (
            <Typography variant="caption" color="text.secondary">
              {helper}
            </Typography>
          ) : null}
        </Box>
      </Stack>
    </Paper>
  );
};
