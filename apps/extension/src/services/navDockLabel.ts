const cleanTitle = (title: string) => title.replace(/[（(][^）)]*[）)]/g, " ").replace(/\s+/g, " ").trim();

const titlePieces = (title: string) =>
  cleanTitle(title)
    .split(/\s*[|·•]\s*|\s+[-–—:：]\s+|[-–—](?=[A-Za-z0-9])/u)
    .map((piece) => piece.trim())
    .filter(Boolean);

const genericNames = new Set(["welcome", "home", "untitled", "new", "document", "page", "index", "欢迎", "首页", "官方"]);

const isShortName = (value: string) => {
  const chars = [...value];

  if (chars.length < 2 || chars.length > 12 || /\s/u.test(value)) {
    return false;
  }

  const cjkCount = chars.filter((char) => /[\u3400-\u9fff]/u.test(char)).length;
  return cjkCount === 0 || (cjkCount === chars.length && chars.length <= 4);
};

const hostLabel = (url?: string) => {
  if (!url) {
    return "";
  }

  try {
    const name = new URL(url).hostname.replace(/^www\./i, "").split(".")[0] ?? "";
    return isShortName(name) ? name : [...name].slice(0, 8).join("");
  } catch {
    return "";
  }
};

const candidatesFor = (title: string) =>
  titlePieces(title).flatMap((piece) => {
    const withoutNoise = piece
      .replace(/[-–—][A-Za-z0-9.]{2,}$/u, "")
      .replace(/(官网|官方网站|官方|首页)$/u, "")
      .trim();
    const firstWord = (withoutNoise || piece).split(/\s+/u)[0] ?? "";
    return [withoutNoise, firstWord];
  });

export const navDockLabel = (title: string, url?: string): string => {
  // Short user-facing names can mix scripts or contain spaces.
  const shortTitle = title.trim();
  if ([...shortTitle].length >= 2 && [...shortTitle].length <= 12 &&
      !/[|·•（()）]|\s[-–—:：]\s/u.test(shortTitle) &&
      !/(官网|官方网站|官方|首页)$/u.test(shortTitle) &&
      !genericNames.has(shortTitle.toLowerCase())) return shortTitle;

  for (const candidate of candidatesFor(title)) {
    if (isShortName(candidate) && !genericNames.has(candidate.toLowerCase())) {
      return candidate;
    }
  }

  const host = hostLabel(url);

  if (host) {
    return host;
  }

  const fallback = candidatesFor(title)[0] || cleanTitle(title);
  const cjkLead = /^[\u3400-\u9fff]{2,4}/u.exec(fallback);

  if (cjkLead) {
    return cjkLead[0];
  }

  return [...(fallback.split(/\s+/u)[0] || fallback)].slice(0, 8).join("");
};
