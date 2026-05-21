import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { SyntheticEvent, useState } from 'react';
import { RiDeleteBinLine } from 'react-icons/ri';
import useEditable from '../hooks/useEditable';
import { Task, kanbanActions } from '../store/kanbanSlice';
import { useAppDispatch } from '../util/reduxHooks';
import axios from 'axios';

type Props = {
  task: Task;
  parentId?: string;
};

function KanbanTaskItem({ task, parentId }: Props) {
  const dispatch = useAppDispatch();
  const { handleBlur, handleKeyDown, isEditable, setIsEditable } = useEditable();
  const [isDescriptionEditable, setIsDescriptionEditable] = useState(false);
  const [newTag, setNewTag] = useState("");

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: task.id,
    data: {
      type: 'task-item',
      task,
      parentId,
    },
  });

  const style = {
    transition,
    transform: CSS.Translate.toString(transform),
  };

  // 🗑️ DELETE Task
  const deleteTaskHandler = async (event: SyntheticEvent) => {
    event.stopPropagation();
    try {
      await axios.delete(`/api/boards/tasks/${task.id}`);
      dispatch(kanbanActions.deleteTaskById(task.id));
    } catch (err) {
      console.error("Failed to delete task:", err);
    }
  };

  // ✏️ UPDATE Task Title
  const handleContentChange = async (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newContent = event.target.value;
    dispatch(kanbanActions.renameTask({ taskId: task.id, newContent }));

    try {
      await axios.patch(`/api/boards/tasks/${task.id}/title`, {
        title: newContent,
      });
    } catch (err) {
      console.error("Failed to update title:", err);
    }
  };

  // 📝 UPDATE Description
  const handleDescriptionChange = async (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newDescription = event.target.value;
    dispatch(kanbanActions.updateTaskDescription({ taskId: task.id, newDescription }));

    try {
      await axios.patch(`/api/boards/tasks/${task.id}/description`, {
        description: newDescription,
      });
    } catch (err) {
      console.error("Failed to update description:", err);
    }
  };

  const handleTagAdd = () => {
    if (newTag.trim() === '') return;
    dispatch(kanbanActions.addTaskTag({ taskId: task.id, tag: newTag.trim() }));
    setNewTag("");
  };

  const handleTagRemove = (tag: string) => {
    dispatch(kanbanActions.removeTaskTag({ taskId: task.id, tag }));
  };

  return (
    <div
      className={`bg-zinc-800 min-h-20 z-30 rounded-lg p-3 flex flex-col gap-2 group border border-transparent hover:border-red-500 ${
        isDragging ? 'opacity-30' : ''
      }`}
      style={style}
      ref={setNodeRef}
      {...attributes}
      {...listeners}
    >
      {/* Title */}
      <div className="flex items-center justify-between">
        {!isEditable ? (
          <p className="text-sm text-white" onClick={() => setIsEditable(true)}>{task.content}</p>
        ) : (
          <textarea
            className="w-full text-sm outline-none bg-zinc-950 resize-none"
            defaultValue={task.content}
            onChange={handleContentChange}
            onKeyDown={handleKeyDown}
            autoFocus
          />
        )}
        <button onClick={deleteTaskHandler} className="p-2 text-lg text-neutral-500 hover:text-red-500">
          <RiDeleteBinLine />
        </button>
      </div>

      {/* Description */}
      <div className="text-xs text-left text-gray-400">
        {!isDescriptionEditable ? (
          <p onClick={() => setIsDescriptionEditable(true)}>
            {task.description || "Add description..."}
          </p>
        ) : (
          <textarea
            className="w-full text-xs outline-none bg-zinc-950 resize-none"
            defaultValue={task.description}
            onChange={handleDescriptionChange}
            onBlur={() => setIsDescriptionEditable(false)}
            autoFocus
          />
        )}
      </div>

      {/* Tags */}
      <div className="flex flex-wrap gap-2 mt-2">
        {task.tags?.map((tag) => (
          <span
            key={tag}
            className="text-xs bg-red-500 text-white px-2 py-1 rounded-md flex items-center gap-1"
          >
            {tag}
            <button className="text-red-400 hover:text-red-600" onClick={() => handleTagRemove(tag)}>×</button>
          </span>
        ))}
        <input
          type="text"
          className="bg-zinc-800 text-xs px-2 py-1 rounded w-16 text-white outline-none"
          placeholder="Tag..."
          value={newTag}
          onChange={(e) => setNewTag(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleTagAdd()}
        />
      </div>
    </div>
  );
}

export default KanbanTaskItem;
