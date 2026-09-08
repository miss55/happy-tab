import { happyTabDb } from "@/db/happyTabDb";
import type { CreateUsageStatInput, UpdateUsageStatInput, UsageStat } from "@/types/usageStats";

const nowIso = () => new Date().toISOString();

const createId = () => crypto.randomUUID();

export const listUsageStats = async (): Promise<UsageStat[]> => {
  const usageStats = (await happyTabDb.usage_stats.toArray()).filter((stat) => stat.deleted_at === undefined);
  return usageStats.sort((a, b) => a.updated_at.localeCompare(b.updated_at));
};

export const getUsageStat = async (usageStatId: string): Promise<UsageStat | undefined> => {
  const usageStat = await happyTabDb.usage_stats.get(usageStatId);
  return usageStat?.deleted_at ? undefined : usageStat;
};

export const getUsageStatByTarget = async (
  targetType: UsageStat["target_type"],
  targetId: string
): Promise<UsageStat | undefined> => {
  const usageStat = await happyTabDb.usage_stats
    .where("target_id")
    .equals(targetId)
    .and((stat) => stat.target_type === targetType && stat.deleted_at === undefined)
    .first();

  return usageStat;
};

export const createUsageStat = async (input: CreateUsageStatInput): Promise<UsageStat> => {
  const timestamp = nowIso();
  const usageStat: UsageStat = {
    id: createId(),
    target_type: input.target_type,
    target_id: input.target_id,
    open_count: 0,
    created_at: timestamp,
    updated_at: timestamp
  };

  await happyTabDb.usage_stats.add(usageStat);
  return usageStat;
};

export const updateUsageStat = async (input: UpdateUsageStatInput): Promise<void> => {
  await happyTabDb.usage_stats.update(input.id, {
    open_count: input.open_count,
    last_opened_at: input.last_opened_at,
    updated_at: nowIso()
  });
};

export const incrementUsageStat = async (
  targetType: UsageStat["target_type"],
  targetId: string
): Promise<UsageStat> => {
  const existing = await getUsageStatByTarget(targetType, targetId);
  const timestamp = nowIso();

  if (!existing) {
    const usageStat = await createUsageStat({ target_type: targetType, target_id: targetId });
    await updateUsageStat({
      id: usageStat.id,
      open_count: 1,
      last_opened_at: timestamp
    });
    return {
      ...usageStat,
      open_count: 1,
      last_opened_at: timestamp,
      updated_at: timestamp
    };
  }

  await updateUsageStat({
    id: existing.id,
    open_count: existing.open_count + 1,
    last_opened_at: timestamp
  });

  return {
    ...existing,
    open_count: existing.open_count + 1,
    last_opened_at: timestamp,
    updated_at: timestamp
  };
};

export const softDeleteUsageStat = async (usageStatId: string): Promise<void> => {
  const timestamp = nowIso();

  await happyTabDb.usage_stats.update(usageStatId, {
    deleted_at: timestamp,
    updated_at: timestamp
  });
};
