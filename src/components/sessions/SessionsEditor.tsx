import type { FC } from "react";
import { Box, Button, Paper, Stack, Typography } from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
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

import type { Session, Producer, ID } from "../../types/index.ts";
import { uid, todayISO, addDaysISO } from "../../utils/helpers";
import { SessionCard } from "./SessionCard";

interface SessionsEditorProps {
  sessions: Session[];
  producerById: Map<ID, Producer>;
  onChange: (next: Session[]) => void;
}

export const SessionsEditor: FC<SessionsEditorProps> = ({ sessions, producerById, onChange }) => {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  function onDragEnd(e: DragEndEvent): void {
    const activeId = String(e.active.id);
    const overId = e.over?.id ? String(e.over.id) : null;

    if (!overId) return;

    if (activeId === overId) return;

    const oldIndex = sessions.findIndex((x) => x.id === activeId);
    const newIndex = sessions.findIndex((x) => x.id === overId);
    if (oldIndex < 0 || newIndex < 0) return;

    onChange(arrayMove(sessions, oldIndex, newIndex));
  }

  return (
    <Box>
      <Stack spacing={1.25}>
        <Stack direction={{ xs: "column", sm: "row" }} spacing={1} alignItems={{ sm: "center" }}>
          <Typography variant="subtitle1" sx={{ flex: 1 }}>
            Sessions
          </Typography>
          <Button
            variant="outlined"
            startIcon={<AddIcon />}
            onClick={() => {
              onChange([
                ...sessions,
                { id: uid("se"), date: todayISO(), producerId: "", units: 1 },
              ]);
            }}
          >
            Add session
          </Button>
        </Stack>

        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
          <SortableContext items={sessions.map((s) => s.id)} strategy={verticalListSortingStrategy}>
            <Stack spacing={1.25}>
              {sessions.length === 0 ? (
                <Paper variant="outlined" sx={{ p: 2 }}>
                  <Typography variant="body2" color="text.secondary">
                    No sessions yet. Add one to set start & finish dates.
                  </Typography>
                </Paper>
              ) : null}

              {sessions.map((s) => (
                <SessionCard
                  key={s.id}
                  session={s}
                  producerById={producerById}
                  onChange={(next) => {
                    onChange(sessions.map((x) => (x.id === s.id ? next : x)));
                  }}
                  onRemove={() => onChange(sessions.filter((x) => x.id !== s.id))}
                  onDuplicate={() => {
                    const duplicated: Session = {
                      ...s,
                      id: uid("se"),
                      date: s.date ? addDaysISO(s.date, 7) : s.date,
                    };
                    onChange([...sessions, duplicated]);
                  }}
                />
              ))}

            </Stack>
          </SortableContext>
        </DndContext>

        <Typography variant="caption" color="text.secondary">
          Tip: Use "Duplicate" when you have a repeating schedule or same producer setup.
        </Typography>
      </Stack>
    </Box>
  );
};
