import Link from "next/link";
import { fullName } from "@/lib/contacts";
import { formatDue, isOverdue, type Task } from "@/lib/tasks";
import { setTaskDone } from "./actions";

/** List of tasks with a complete/reopen toggle on each row. */
export function TaskList({ tasks, showContact = true }: { tasks: Task[]; showContact?: boolean }) {
  return (
    <ul className="divide-y divide-zinc-200">
      {tasks.map((task) => {
        const done = !!task.completed_at;
        const overdue = isOverdue(task);
        return (
          <li key={task.id} className="flex items-start gap-3 py-3">
            <form action={setTaskDone}>
              <input type="hidden" name="id" value={task.id} />
              <input type="hidden" name="done" value={done ? "0" : "1"} />
              <button
                aria-label={done ? `Reopen "${task.title}"` : `Mark "${task.title}" complete`}
                className={`mt-0.5 flex size-5 items-center justify-center rounded border text-xs ${
                  done ? "border-green-600 bg-green-600 text-white" : "border-zinc-400 bg-white hover:border-accent"
                }`}
              >
                {done ? "✓" : ""}
              </button>
            </form>
            <div className="min-w-0 flex-1">
              <p className={done ? "text-zinc-500 line-through" : "font-medium"}>{task.title}</p>
              <p className="text-sm text-zinc-600">
                {task.due_at && (
                  <span className={overdue ? "font-medium text-red-700" : undefined}>
                    {overdue ? "Overdue: " : "Due "}
                    {formatDue(task.due_at)}
                  </span>
                )}
                {task.due_at && showContact && task.contacts && " · "}
                {showContact && task.contacts && (
                  <Link href={`/contacts/${task.contact_id}`} className="text-accent hover:underline">
                    {fullName(task.contacts)}
                  </Link>
                )}
              </p>
              {task.notes && <p className="mt-1 whitespace-pre-wrap text-sm text-zinc-600">{task.notes}</p>}
            </div>
          </li>
        );
      })}
    </ul>
  );
}
