import { createPinia, setActivePinia } from "pinia";
import { watch } from "vue";
import { beforeEach, describe, expect, it, vi } from "vitest";
import * as repository from "@/repositories/todosRepository";
import { useTodosStore } from "@/stores/todosStore";
import type { Todo } from "@/types/todos";

vi.mock("@/repositories/todosRepository", () => ({
  createTodo: vi.fn(),
  listTodos: vi.fn(),
  reorderTodos: vi.fn(),
  softDeleteTodo: vi.fn(),
  toggleTodo: vi.fn(),
  updateTodo: vi.fn()
}));

const todo: Todo = {
  id: "first",
  title: "First",
  completed: false,
  sort_order: 0,
  created_at: "2026-01-01T00:00:00.000Z",
  updated_at: "2026-01-01T00:00:00.000Z"
};

describe("todosStore loading state", () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    vi.resetAllMocks();
    vi.mocked(repository.createTodo).mockResolvedValue(todo);
    vi.mocked(repository.listTodos).mockResolvedValue([]);
  });

  it("shows initial loading and settles after an empty result or a read failure", async () => {
    const store = useTodosStore();
    const loading = store.loadTodos();
    expect(store.isLoading).toBe(true);
    await loading;
    expect(store.isLoading).toBe(false);
    expect(store.todos).toEqual([]);

    vi.mocked(repository.listTodos).mockRejectedValue(new Error("read failed"));
    await store.loadTodos();
    expect(store.isLoading).toBe(false);
    expect(store.errorMessage).toBe("error.loadTodos");
  });

  it.each(["add", "edit", "complete", "reopen", "delete", "sort"] as const)(
    "refreshes after %s without flashing loading, even for an empty list",
    async (operation) => {
      const store = useTodosStore();
      store.todos = operation === "add" ? [] : [todo];
      const expected = operation === "delete" ? [] : [{ ...todo, completed: operation === "complete" }];
      let finish!: (items: Todo[]) => void;
      const readStarted = new Promise<void>((resolveRead) => {
        vi.mocked(repository.listTodos).mockImplementation(() => {
          resolveRead();
          return new Promise((resolve) => { finish = resolve; });
        });
      });
      const loadingStates: boolean[] = [];
      const stop = watch(() => store.isLoading, (loading) => loadingStates.push(loading), { flush: "sync" });
      const pending = operation === "add" ? store.addTodo(todo.title)
        : operation === "edit" ? store.editTodo(todo.id, "Edited")
        : operation === "delete" ? store.deleteTodo(todo.id)
        : operation === "sort" ? store.sortTodos([todo.id])
        : store.setTodoCompleted(todo.id, operation === "complete");

      await readStarted;
      const loadingWhileReading = store.isLoading;
      finish(expected);
      await pending;
      stop();

      expect(loadingWhileReading).toBe(false);
      expect(loadingStates).toEqual([]);
      expect(store.todos).toEqual(expected);
      expect(store.errorMessage).toBe("");
    }
  );

  it("does not re-enter loading after deleting the final todo and adding another", async () => {
    const store = useTodosStore();
    store.todos = [todo];
    const loadingStates: boolean[] = [];
    const stop = watch(() => store.isLoading, (loading) => loadingStates.push(loading), { flush: "sync" });

    await store.deleteTodo(todo.id);
    expect(store.todos).toEqual([]);
    vi.mocked(repository.listTodos).mockResolvedValue([todo]);
    await store.addTodo(todo.title);
    stop();

    expect(store.todos).toEqual([todo]);
    expect(loadingStates).toEqual([]);
  });

  it("preserves todo state and reports mutation failures", async () => {
    const store = useTodosStore();
    store.todos = [todo];
    vi.mocked(repository.softDeleteTodo).mockRejectedValue(new Error("write failed"));

    await expect(store.deleteTodo(todo.id)).rejects.toThrow("write failed");

    expect(store.todos).toEqual([todo]);
    expect(store.errorMessage).toBe("error.deleteTodo");
    expect(repository.listTodos).not.toHaveBeenCalled();
    expect(store.isLoading).toBe(false);
  });

  it("keeps an empty list stable during post-import and post-sync refreshes", async () => {
    const store = useTodosStore();
    const loadingStates: boolean[] = [];
    const stop = watch(() => store.isLoading, (loading) => loadingStates.push(loading), { flush: "sync" });

    await store.loadTodos({ background: true });
    vi.mocked(repository.listTodos).mockRejectedValue(new Error("read failed"));
    await store.loadTodos({ background: true });
    stop();

    expect(store.todos).toEqual([]);
    expect(loadingStates).toEqual([]);
    expect(store.errorMessage).toBe("error.loadTodos");
  });

  it("does not let a background refresh clear an initial load still in progress", async () => {
    const store = useTodosStore();
    let finish!: (items: Todo[]) => void;
    vi.mocked(repository.listTodos).mockReturnValueOnce(new Promise((resolve) => { finish = resolve; }));
    const initialLoad = store.loadTodos();

    await store.loadTodos({ background: true });
    const loadingAfterRefresh = store.isLoading;
    finish([todo]);
    await initialLoad;

    expect(loadingAfterRefresh).toBe(true);
    expect(store.isLoading).toBe(false);
    expect(store.todos).toEqual([todo]);
  });
});
