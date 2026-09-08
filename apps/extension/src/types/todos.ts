export interface TodoItem {
  id: string;
  title: string;
  completed: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
  completed_at?: string;
  deleted_at?: string;
}

export type Todo = TodoItem;

export interface CreateTodoInput {
  title: string;
}

export interface UpdateTodoInput {
  id: string;
  title: string;
}

export interface ReorderTodosInput {
  todo_ids: string[];
}
