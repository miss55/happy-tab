import { defineStore } from "pinia";
import { messageKeyFromError } from "@/i18n";
import type { MessageKey } from "@/i18n/messages";
import {
  createTodo,
  listTodos,
  reorderTodos,
  softDeleteTodo,
  toggleTodo,
  updateTodo
} from "@/repositories/todosRepository";
import type { Todo } from "@/types/todos";

interface TodosState {
  todos: Todo[];
  isLoading: boolean;
  errorMessage: MessageKey | "";
}

export const useTodosStore = defineStore("todos", {
  state: (): TodosState => ({
    todos: [],
    isLoading: false,
    errorMessage: ""
  }),

  getters: {
    activeCount: (state) => state.todos.filter((todo) => !todo.completed).length,
    completedCount: (state) => state.todos.filter((todo) => todo.completed).length
  },

  actions: {
    async loadTodos() {
      this.isLoading = true;
      this.errorMessage = "";

      try {
        this.todos = await listTodos();
      } catch (error) {
        this.errorMessage = messageKeyFromError(error, "error.loadTodos");
      } finally {
        this.isLoading = false;
      }
    },

    async addTodo(title: string) {
      this.errorMessage = "";

      try {
        const todo = await createTodo({ title });
        await this.loadTodos();
        return todo;
      } catch (error) {
        this.errorMessage = messageKeyFromError(error, "error.createTodo");
        throw error;
      }
    },

    async editTodo(todoId: string, title: string) {
      this.errorMessage = "";

      try {
        await updateTodo({ id: todoId, title });
        await this.loadTodos();
      } catch (error) {
        this.errorMessage = messageKeyFromError(error, "error.updateTodo");
        throw error;
      }
    },

    async setTodoCompleted(todoId: string, completed: boolean) {
      this.errorMessage = "";

      try {
        await toggleTodo(todoId, completed);
        await this.loadTodos();
      } catch (error) {
        this.errorMessage = messageKeyFromError(error, "error.updateTodo");
        throw error;
      }
    },

    async deleteTodo(todoId: string) {
      this.errorMessage = "";

      try {
        await softDeleteTodo(todoId);
        await this.loadTodos();
      } catch (error) {
        this.errorMessage = messageKeyFromError(error, "error.deleteTodo");
        throw error;
      }
    },

    async sortTodos(todoIds: string[]) {
      this.errorMessage = "";

      try {
        await reorderTodos({ todo_ids: todoIds });
        await this.loadTodos();
      } catch (error) {
        this.errorMessage = messageKeyFromError(error, "error.sortTodos");
        throw error;
      }
    }
  }
});
