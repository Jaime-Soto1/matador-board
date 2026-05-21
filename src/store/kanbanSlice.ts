import { arrayMove } from "@dnd-kit/sortable";
import { PayloadAction, createSlice } from "@reduxjs/toolkit";
import { getParentIdOfTask } from "../util/kanbanUtils";

export type Task = {
  id: string;
  content: string;
  description?: string;
  tags?: string[];
};

export type Column = {
  id: string;
  title: string;
  tasks: Task[];
  color?: string;
};

export type Board = {
  columns: Column[];
};

const initialState: Board = {
  columns: [],
};

const kanbanSlice = createSlice({
  name: "kanban-slice",
  initialState,
  reducers: {
    setBoard: (state, action: PayloadAction<Board>) => {
      const board = action.payload;
      if (Array.isArray(board.columns)) {
        state.columns = board.columns.map((col: any) => ({
          ...col,
          title: col.title || col.name || "Untitled Column",
          color: col.color || "#1E293B",
          tasks: Array.isArray(col.tasks) ? col.tasks : [],
        }));
      }
    },

    addColumn: (state, action: PayloadAction<any>) => {
      const col = action.payload;
      state.columns.push({
        ...col,
        id: col.id?.toString() ?? crypto.randomUUID(),
        title: col.title || col.name || `Column ${state.columns.length + 1}`,
        tasks: col.tasks || [],
        color: col.color || "#1E293B",
      });
    },

    changeColumnColor: (
      state,
      action: PayloadAction<{ columnId: string; color: string }>
    ) => {
      const { columnId, color } = action.payload;
      const col = state.columns.find((col) => col.id === columnId);
      if (col) col.color = color;
    },

    deleteColumn: (state, action: PayloadAction<string>) => {
      state.columns = state.columns.filter((col) => col.id !== action.payload);
    },

    // ✅ NEW: Accepts actual task from DB and assigns it to the correct column
    addTaskToColumnById: (
      state,
      action: PayloadAction<{ columnId: string; task: Task }>
    ) => {
      const { columnId, task } = action.payload;
      const col = state.columns.find((col) => col.id === columnId);
      if (col) {
        col.tasks.push(task);
      }
    },

    deleteTaskById: (state, action: PayloadAction<string>) => {
      state.columns.forEach((col) => {
        col.tasks = col.tasks.filter((task) => task.id !== action.payload);
      });
    },

    moveColumns: (
      state,
      action: PayloadAction<{ from: number; to: number }>
    ) => {
      state.columns = arrayMove(state.columns, action.payload.from, action.payload.to);
    },

    swapItems: (
      state,
      action: PayloadAction<{ fromId: string; toId: string; parentId: string }>
    ) => {
      const col = state.columns.find((col) => col.id === action.payload.parentId);
      if (!col) return;
      const fromIndex = col.tasks.findIndex((t) => t.id === action.payload.fromId);
      const toIndex = col.tasks.findIndex((t) => t.id === action.payload.toId);
      col.tasks = arrayMove(col.tasks, fromIndex, toIndex);
    },

    moveTaskToColumn: (
      state,
      action: PayloadAction<{ taskId: string; columnId: string }>
    ) => {
      const { taskId, columnId } = action.payload;
      const fromId = getParentIdOfTask(state.columns, taskId);
      const fromCol = state.columns.find((col) => col.id === fromId);
      const toCol = state.columns.find((col) => col.id === columnId);
      if (!fromCol || !toCol) return;
      const task = fromCol.tasks.find((t) => t.id === taskId);
      if (!task) return;
      fromCol.tasks = fromCol.tasks.filter((t) => t.id !== taskId);
      toCol.tasks.push(task);
    },

    renameColumn: (
      state,
      action: PayloadAction<{ columnId: string; newTitle: string }>
    ) => {
      const col = state.columns.find((col) => col.id === action.payload.columnId);
      if (col) col.title = action.payload.newTitle;
    },

    renameTask: (
      state,
      action: PayloadAction<{ taskId: string; newContent: string }>
    ) => {
      const colId = getParentIdOfTask(state.columns, action.payload.taskId);
      const col = state.columns.find((c) => c.id === colId);
      const task = col?.tasks.find((t) => t.id === action.payload.taskId);
      if (task) task.content = action.payload.newContent;
    },

    updateTaskDescription: (
      state,
      action: PayloadAction<{ taskId: string; newDescription: string }>
    ) => {
      const colId = getParentIdOfTask(state.columns, action.payload.taskId);
      const col = state.columns.find((c) => c.id === colId);
      const task = col?.tasks.find((t) => t.id === action.payload.taskId);
      if (task) task.description = action.payload.newDescription;
    },

    addTaskTag: (
      state,
      action: PayloadAction<{ taskId: string; tag: string }>
    ) => {
      const colId = getParentIdOfTask(state.columns, action.payload.taskId);
      const task = state.columns
        .find((c) => c.id === colId)
        ?.tasks.find((t) => t.id === action.payload.taskId);
      if (task && !task.tags?.includes(action.payload.tag)) {
        task.tags?.push(action.payload.tag);
      }
    },

    removeTaskTag: (
      state,
      action: PayloadAction<{ taskId: string; tag: string }>
    ) => {
      const colId = getParentIdOfTask(state.columns, action.payload.taskId);
      const task = state.columns
        .find((c) => c.id === colId)
        ?.tasks.find((t) => t.id === action.payload.taskId);
      if (task?.tags) {
        task.tags = task.tags.filter((t) => t !== action.payload.tag);
      }
    },
  },
});

export const kanbanActions = kanbanSlice.actions;
export default kanbanSlice;
