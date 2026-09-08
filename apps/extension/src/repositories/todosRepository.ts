import { happyTabDb } from "@/db/happyTabDb";
import type { CreateTodoInput, ReorderTodosInput, Todo, UpdateTodoInput } from "@/types/todos";

const nowIso = () => new Date().toISOString();

const createId = () => crypto.randomUUID();

const getActiveTodos = async () =>
  (await happyTabDb.todos.toArray()).filter((todo) => todo.deleted_at === undefined);

const getNextTodoSortOrder = async () => {
  const todos = await getActiveTodos();
  return todos.reduce((max, todo) => Math.max(max, todo.sort_order), -1) + 1;
};

export const listTodos = async (): Promise<Todo[]> => {
  const todos = await getActiveTodos();
  return todos.sort((a, b) => a.sort_order - b.sort_order);
};

export const getTodo = async (todoId: string): Promise<Todo | undefined> => {
  const todo = await happyTabDb.todos.get(todoId);
  return todo?.deleted_at ? undefined : todo;
};

export const createTodo = async (input: CreateTodoInput): Promise<Todo> => {
  const title = input.title.trim();

  if (!title) {
    throw new Error("Todo title is required.");
  }

  const timestamp = nowIso();
  const todo: Todo = {
    id: createId(),
    title,
    completed: false,
    sort_order: await getNextTodoSortOrder(),
    created_at: timestamp,
    updated_at: timestamp
  };

  await happyTabDb.todos.add(todo);
  return todo;
};

export const updateTodo = async (input: UpdateTodoInput): Promise<void> => {
  const title = input.title.trim();

  if (!title) {
    throw new Error("Todo title is required.");
  }

  await happyTabDb.todos.update(input.id, {
    title,
    updated_at: nowIso()
  });
};

export const toggleTodo = async (todoId: string, completed: boolean): Promise<void> => {
  const timestamp = nowIso();

  await happyTabDb.todos.update(todoId, {
    completed,
    completed_at: completed ? timestamp : undefined,
    updated_at: timestamp
  });
};

export const softDeleteTodo = async (todoId: string): Promise<void> => {
  const timestamp = nowIso();

  await happyTabDb.todos.update(todoId, {
    deleted_at: timestamp,
    updated_at: timestamp
  });
};

export const reorderTodos = async (input: ReorderTodosInput): Promise<void> => {
  const timestamp = nowIso();

  await happyTabDb.transaction("rw", happyTabDb.todos, async () => {
    await Promise.all(
      input.todo_ids.map((todoId, index) =>
        happyTabDb.todos.update(todoId, {
          sort_order: index,
          updated_at: timestamp
        })
      )
    );
  });
};
