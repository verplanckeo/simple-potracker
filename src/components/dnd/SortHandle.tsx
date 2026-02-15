import type { FC } from "react";
import { IconButton, Tooltip } from "@mui/material";
import DragIndicatorIcon from "@mui/icons-material/DragIndicator";
import type { SyntheticListenerMap } from "@dnd-kit/core/dist/hooks/utilities/index.js";
import type { DraggableAttributes } from "@dnd-kit/core";

interface SortHandleProps {
  listeners?: SyntheticListenerMap;
  attributes?: DraggableAttributes;
  disabled?: boolean;
}

export const SortHandle: FC<SortHandleProps> = ({ listeners, attributes, disabled }) => {
  return (
    <Tooltip title={disabled ? "" : "Drag to reorder"}>
      <span>
        <IconButton
          size="small"
          sx={{ cursor: disabled ? "not-allowed" : "grab" }}
          {...(!disabled ? listeners : {})}
          {...(!disabled ? attributes : {})}
          disabled={!!disabled}
        >
          <DragIndicatorIcon fontSize="small" />
        </IconButton>
      </span>
    </Tooltip>
  );
};
