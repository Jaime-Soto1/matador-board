import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useMemo } from "react";
import { FaPlusCircle } from "react-icons/fa";
import { RiDeleteBinLine } from "react-icons/ri";
import useEditable from "../hooks/useEditable";
import { Column, kanbanActions } from "../store/kanbanSlice";
import { useAppDispatch, useAppSelector } from "../util/reduxHooks";
import KanbanTaskItem from "./KanbanTaskItem";
import axios from "axios";

type Props = {
  column: Column;
};

function KanbanColumn({ column }: Props) {
  const dispatch = useAppDispatch();
  const columns = useAppSelector((state) => state.kanban.columns);
  const isLastColumn = columns.length <= 1;

  const { handleBlur, handleKeyDown, isEditable, setIsEditable } = useEditable();
  const { tasks = [], id, title, color } = column;
  const taskIds = useMemo(() => tasks.map((task) => task.id), [tasks]);

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id,
    data: { type: "column", column },
  });

  const style = {
    transition,
    transform: CSS.Translate.toString(transform),
  };

  const resolvedColor = color || "#EF4444";

  // 🗑️ Delete column locally only
  const deleteColumnHandler = () => {
    if (!isLastColumn) {
      dispatch(kanbanActions.deleteColumn(column.id));
    }
  };

  // ➕ Create task in DB and Redux
  const createTaskHandler = async () => {
    try {
      const response = await axios.post("http://localhost:5001/api/tasks", {
        column_id: column.id,
        content: "New Task",
      });

      const newTask = {
        id: response.data.taskId,
        content: "New Task",
      };

      dispatch(kanbanActions.addTaskToColumnById({ columnId: column.id, task: newTask }));
    } catch (err) {
      console.error("❌ Failed to create task:", err);
    }
  };

  // ✏️ Rename column and sync to DB
  const handleInputChange = async (event: React.FormEvent<HTMLInputElement>) => {
    const newTitle = event.currentTarget.value;

    dispatch(kanbanActions.renameColumn({ columnId: id, newTitle }));

    try {
      await axios.patch(`/api/boards/columns/${id}`, {
        newTitle,
      });
    } catch (err) {
      console.error("Failed to rename column:", err);
    }
  };

  return (
    <div
      className={`w-72 min-w-72 flex flex-col rounded-lg shadow-md ${
        isDragging ? "opacity-50" : ""
      } cursor-grab active:cursor-grabbing`}
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
    >
      {/* Header */}
      <div
        onClick={() => setIsEditable(true)}
        onBlur={handleBlur}
        className="px-4 py-3 flex items-center justify-between rounded-t-lg"
        style={{ backgroundColor: resolvedColor, minHeight: "2.5rem" }}
      >
        <div className="cursor-text flex items-center gap-2 w-full">
          {isEditable ? (
            <input
              type="text"
              defaultValue={title}
              onChange={handleInputChange}
              autoFocus
              onKeyDown={handleKeyDown}
              className="font-bold text-md w-full bg-transparent outline-none text-white"
            />
          ) : (
            <span className="font-bold text-md text-white break-words">{title}</span>
          )}
        </div>

        {!isLastColumn && (
          <button
            className="text-white hover:text-zinc-100 transition text-lg"
            onClick={deleteColumnHandler}
          >
            <RiDeleteBinLine />
          </button>
        )}
      </div>

      {/* Tasks + Add Button */}
      <SortableContext items={taskIds} strategy={verticalListSortingStrategy}>
        <div className="p-3 flex flex-col gap-3 bg-zinc-800 rounded-b-lg min-h-[80px]">
          {tasks.length > 0 ? (
            tasks.map((task) => (
              <KanbanTaskItem key={task.id} task={task} parentId={column.id} />
            ))
          ) : (
            <span className="text-gray-400 text-center text-sm italic">
              No tasks available
            </span>
          )}

          <button
            onClick={createTaskHandler}
            className="flex items-center gap-2 py-2 px-3 mt-2 rounded-md border border-transparent hover:border-red-500 text-white transition"
          >
            <FaPlusCircle />
            <span className="text-xs">Add New Task</span>
          </button>
        </div>
      </SortableContext>
    </div>
  );
}

export default KanbanColumn;
