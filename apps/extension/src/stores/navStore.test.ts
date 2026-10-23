import { createPinia, setActivePinia } from "pinia";
import { watch } from "vue";
import { beforeEach, describe, expect, it, vi } from "vitest";
import * as repository from "@/repositories/navShortcutsRepository";
import { useNavStore } from "@/stores/navStore";
import type { NavShortcut } from "@/types/navShortcuts";

vi.mock("@/repositories/navShortcutsRepository", () => ({
  createNavShortcut: vi.fn(),
  listNavShortcuts: vi.fn(),
  reorderNavShortcuts: vi.fn(),
  restoreNavShortcut: vi.fn(),
  softDeleteNavShortcut: vi.fn(),
  updateNavShortcut: vi.fn()
}));

const shortcut = (id: string): NavShortcut => ({
  id,
  title: id,
  url: `https://${id}.example/`,
  sort_order: 0,
  created_at: "2026-01-01T00:00:00.000Z",
  updated_at: "2026-01-01T00:00:00.000Z"
});

describe("navStore loading state", () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    vi.resetAllMocks();
    vi.mocked(repository.listNavShortcuts).mockResolvedValue([]);
  });

  it("shows loading during an explicit load, including an empty dock", async () => {
    const store = useNavStore();
    let finish!: (items: NavShortcut[]) => void;
    vi.mocked(repository.listNavShortcuts).mockReturnValue(new Promise((resolve) => { finish = resolve; }));

    const loading = store.loadShortcuts();
    expect(store.isLoading).toBe(true);
    finish([]);
    await loading;
    expect(store.isLoading).toBe(false);
    expect(store.shortcuts).toEqual([]);
  });

  it.each(["add", "edit", "remove", "restore", "sort"] as const)(
    "refreshes after %s without flashing the workspace loading bar",
    async (operation) => {
      const store = useNavStore();
      const first = shortcut("first");
      const second = shortcut("second");
      store.shortcuts = operation === "add" || operation === "restore" ? [] : [first, second];
      const expected = operation === "remove" ? [] : [second, first];
      vi.mocked(repository.createNavShortcut).mockResolvedValue(first);

      let finish!: (items: NavShortcut[]) => void;
      const readStarted = new Promise<void>((resolveRead) => {
        vi.mocked(repository.listNavShortcuts).mockImplementation(() => {
          resolveRead();
          return new Promise((resolve) => { finish = resolve; });
        });
      });
      const loadingStates: boolean[] = [];
      const stop = watch(() => store.isLoading, (loading) => loadingStates.push(loading), { flush: "sync" });
      const pending = operation === "add" ? store.addShortcut({ url: first.url })
        : operation === "edit" ? store.editShortcut({ id: first.id, title: "Edited", url: first.url })
        : operation === "remove" ? store.removeShortcut(first.id)
        : operation === "restore" ? store.restoreShortcut(first.id)
        : store.sortShortcuts([second.id, first.id]);

      await readStarted;
      const loadingWhileReading = store.isLoading;
      finish(expected);
      await pending;
      stop();

      expect(loadingWhileReading).toBe(false);
      expect(loadingStates).toEqual([]);
      expect(store.shortcuts).toEqual(expected);
      expect(store.errorMessage).toBe("");
    }
  );

  it("keeps refreshing silently after the last shortcut is removed", async () => {
    const store = useNavStore();
    const first = shortcut("first");
    store.shortcuts = [first];
    const loadingStates: boolean[] = [];
    const stop = watch(() => store.isLoading, (loading) => loadingStates.push(loading), { flush: "sync" });

    await store.removeShortcut(first.id);
    expect(store.shortcuts).toEqual([]);
    vi.mocked(repository.createNavShortcut).mockResolvedValue(first);
    vi.mocked(repository.listNavShortcuts).mockResolvedValue([first]);
    await store.addShortcut({ url: first.url });
    await store.sortShortcuts([first.id]);
    stop();

    expect(store.shortcuts).toEqual([first]);
    expect(loadingStates).toEqual([]);
  });

  it("rolls a failed reorder back without showing workspace loading", async () => {
    const store = useNavStore();
    const saved = [shortcut("first"), shortcut("second")];
    store.shortcuts = saved;
    vi.mocked(repository.listNavShortcuts).mockResolvedValue(saved);
    vi.mocked(repository.reorderNavShortcuts).mockRejectedValue(new Error("write failed"));
    const loadingStates: boolean[] = [];
    const stop = watch(() => store.isLoading, (loading) => loadingStates.push(loading), { flush: "sync" });

    await expect(store.sortShortcuts(["second", "first"])).rejects.toThrow("write failed");
    stop();

    expect(store.shortcuts).toEqual(saved);
    expect(store.errorMessage).toBe("error.sortNav");
    expect(loadingStates).toEqual([]);
  });

  it("surfaces a background read failure and preserves the current shortcuts", async () => {
    const store = useNavStore();
    const first = shortcut("first");
    store.shortcuts = [first];
    vi.mocked(repository.listNavShortcuts).mockRejectedValue(new Error("read failed"));

    await store.restoreShortcut("second");

    expect(store.shortcuts).toEqual([first]);
    expect(store.errorMessage).toBe("error.loadNav");
    expect(store.isLoading).toBe(false);
  });
});
