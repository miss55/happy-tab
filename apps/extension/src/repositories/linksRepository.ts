import { tabviaDb } from "@/db/tabviaDb";
import {
  chooseGroupColorIndex,
  formatGroupColorIndex,
  parseGroupColorIndex
} from "@/services/groupHeaderColors";
import type {
  CreateLinkGroupInput,
  CreateLinkInput,
  Link,
  LinkGroup,
  LinkGroupWithLinks,
  ReorderLinkGroupsInput,
  ReorderLinksInput,
  SavedLink,
  UpdateLinkGroupInput,
  UpdateLinkInput
} from "@/types/links";

const DEFAULT_GROUP_NAME = "Saved Links";

const nowIso = () => new Date().toISOString();

const createId = () => crypto.randomUUID();

const normalizeUrl = (url: string) => {
  const trimmed = url.trim();

  if (!trimmed) {
    throw new Error("URL is required.");
  }

  if (/^https?:\/\//i.test(trimmed)) {
    return trimmed;
  }

  return `https://${trimmed}`;
};

const getNextGroupSortOrder = async () => {
  const groups = (await tabviaDb.link_groups.toArray()).filter((group) => group.deleted_at === undefined);
  return groups.reduce((max, group) => Math.max(max, group.sort_order), -1) + 1;
};

const getNextLinkSortOrder = async (groupId: string) => {
  const links = await tabviaDb.links
    .where("group_id")
    .equals(groupId)
    .and((link) => link.deleted_at === undefined)
    .toArray();

  return links.reduce((max, link) => Math.max(max, link.sort_order), -1) + 1;
};

export const listLinkGroupsWithLinks = async (): Promise<LinkGroupWithLinks[]> => {
  const groups = (await tabviaDb.link_groups.toArray()).filter((group) => group.deleted_at === undefined);
  const links = (await tabviaDb.links.toArray()).filter((link) => link.deleted_at === undefined);

  return groups
    .sort((a, b) => a.sort_order - b.sort_order)
    .map((group) => ({
      ...group,
      links: links
        .filter((link) => link.group_id === group.id)
        .sort((a, b) => a.sort_order - b.sort_order)
    }));
};

export const listLinkGroups = async (): Promise<LinkGroup[]> => {
  const groups = (await tabviaDb.link_groups.toArray()).filter((group) => group.deleted_at === undefined);
  return groups.sort((a, b) => a.sort_order - b.sort_order);
};

export const getLinkGroup = async (groupId: string): Promise<LinkGroup | undefined> => {
  const group = await tabviaDb.link_groups.get(groupId);
  return group?.deleted_at ? undefined : group;
};

export const ensureDefaultLinkGroup = async (): Promise<LinkGroup> => {
  const groups = (await tabviaDb.link_groups.toArray()).filter((group) => group.deleted_at === undefined);
  const firstGroup = groups.sort((a, b) => a.sort_order - b.sort_order)[0];

  if (firstGroup) {
    return firstGroup;
  }

  const timestamp = nowIso();
  const group: LinkGroup = {
    id: createId(),
    name: DEFAULT_GROUP_NAME,
    sort_order: 0,
    created_at: timestamp,
    updated_at: timestamp
  };

  await tabviaDb.link_groups.add(group);
  return group;
};

export const createLinkGroup = async (input: CreateLinkGroupInput): Promise<LinkGroup> => {
  const name = input.name.trim();

  if (!name) {
    throw new Error("Group name is required.");
  }

  const timestamp = nowIso();
  const existingGroups = (await tabviaDb.link_groups.toArray())
    .filter((group) => group.deleted_at === undefined)
    .sort((left, right) => left.sort_order - right.sort_order || left.created_at.localeCompare(right.created_at));
  const requestedColor = parseGroupColorIndex(input.color);
  const colorIndex =
    requestedColor ??
    chooseGroupColorIndex(
      existingGroups.flatMap((group) => {
        const index = parseGroupColorIndex(group.color);
        return index === undefined ? [] : [index];
      })
    );
  const group: LinkGroup = {
    id: createId(),
    name,
    description: input.description,
    icon: input.icon,
    color: formatGroupColorIndex(colorIndex),
    sort_order: await getNextGroupSortOrder(),
    created_at: timestamp,
    updated_at: timestamp
  };

  await tabviaDb.link_groups.add(group);
  return group;
};

export const listLinks = async (): Promise<SavedLink[]> => {
  const links = (await tabviaDb.links.toArray()).filter((link) => link.deleted_at === undefined);
  return links.sort((a, b) => a.sort_order - b.sort_order);
};

export const getLink = async (linkId: string): Promise<SavedLink | undefined> => {
  const link = await tabviaDb.links.get(linkId);
  return link?.deleted_at ? undefined : link;
};

export const createLink = async (input: CreateLinkInput): Promise<Link> => {
  const title = input.title.trim();
  const url = normalizeUrl(input.url);

  if (!input.group_id) {
    throw new Error("Group is required.");
  }

  if (!title) {
    throw new Error("Title is required.");
  }

  const timestamp = nowIso();
  const link: Link = {
    id: createId(),
    group_id: input.group_id,
    title,
    url,
    description: input.description,
    favicon_url: input.favicon_url,
    tags: input.tags,
    sort_order: await getNextLinkSortOrder(input.group_id),
    open_count: 0,
    source: input.source || "manual",
    created_at: timestamp,
    updated_at: timestamp
  };

  await tabviaDb.links.add(link);
  return link;
};

export const updateLinkGroup = async (input: UpdateLinkGroupInput): Promise<void> => {
  const name = input.name.trim();

  if (!name) {
    throw new Error("Group name is required.");
  }

  await tabviaDb.link_groups.update(input.id, {
    name,
    color: formatGroupColorIndex(input.colorIndex),
    updated_at: nowIso()
  });
};

export const assignMissingGroupColors = async (): Promise<void> => {
  const groups = (await tabviaDb.link_groups.toArray())
    .filter((group) => group.deleted_at === undefined)
    .sort((left, right) => left.sort_order - right.sort_order || left.created_at.localeCompare(right.created_at));
  const usedIndexes: number[] = [];
  const missing: LinkGroup[] = [];

  for (const group of groups) {
    const index = parseGroupColorIndex(group.color);
    if (index === undefined) {
      missing.push(group);
    } else {
      usedIndexes.push(index);
    }
  }

  if (missing.length === 0) {
    return;
  }

  const timestamp = nowIso();

  await tabviaDb.transaction("rw", tabviaDb.link_groups, async () => {
    for (const group of missing) {
      const index = chooseGroupColorIndex(usedIndexes);
      usedIndexes.push(index);
      await tabviaDb.link_groups.update(group.id, {
        color: formatGroupColorIndex(index),
        updated_at: timestamp
      });
    }
  });
};

export const softDeleteLinkGroup = async (groupId: string): Promise<void> => {
  const timestamp = nowIso();

  await tabviaDb.transaction("rw", tabviaDb.link_groups, tabviaDb.links, async () => {
    await tabviaDb.link_groups.update(groupId, {
      deleted_at: timestamp,
      updated_at: timestamp
    });

    const links = await tabviaDb.links
      .where("group_id")
      .equals(groupId)
      .and((link) => link.deleted_at === undefined)
      .toArray();

    await Promise.all(
      links.map((link) =>
        tabviaDb.links.update(link.id, {
          deleted_at: timestamp,
          updated_at: timestamp
        })
      )
    );
  });
};

export const updateLink = async (input: UpdateLinkInput): Promise<void> => {
  const title = input.title.trim();
  const url = normalizeUrl(input.url);

  if (!input.group_id) {
    throw new Error("Group is required.");
  }

  if (!title) {
    throw new Error("Title is required.");
  }

  await tabviaDb.links.update(input.id, {
    group_id: input.group_id,
    title,
    url,
    updated_at: nowIso()
  });
};

export const softDeleteLink = async (linkId: string): Promise<void> => {
  const timestamp = nowIso();

  await tabviaDb.links.update(linkId, {
    deleted_at: timestamp,
    updated_at: timestamp
  });
};

export const reorderLinkGroups = async (input: ReorderLinkGroupsInput): Promise<void> => {
  const timestamp = nowIso();

  await tabviaDb.transaction("rw", tabviaDb.link_groups, async () => {
    await Promise.all(
      input.group_ids.map((groupId, index) =>
        tabviaDb.link_groups.update(groupId, {
          sort_order: index,
          updated_at: timestamp
        })
      )
    );
  });
};

export const reorderLinks = async (input: ReorderLinksInput): Promise<void> => {
  const timestamp = nowIso();

  await tabviaDb.transaction("rw", tabviaDb.links, async () => {
    await Promise.all(
      input.groups.flatMap((group) =>
        group.link_ids.map((linkId, index) =>
          tabviaDb.links.update(linkId, {
            group_id: group.group_id,
            sort_order: index,
            updated_at: timestamp
          })
        )
      )
    );
  });
};

export const incrementLinkOpenStats = async (linkId: string) => {
  const link = await tabviaDb.links.get(linkId);

  if (!link) {
    return;
  }

  const timestamp = nowIso();

  await tabviaDb.links.update(linkId, {
    open_count: link.open_count + 1,
    last_opened_at: timestamp,
    updated_at: timestamp
  });
};
