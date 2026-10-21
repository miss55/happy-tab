const cleanTitle = (title: string) => title.replace(/[（(][^）)]*[）)]/g, " ").replace(/\s+/g, " ").trim();

const titlePieces = (title: string) =>
  cleanTitle(title)
    .split(/\s*[|·•]\s*|\s+[-–—:：]\s+|[-–—](?=[A-Za-z0-9\u3400-\u9fff])/u)
    .map((piece) => piece.trim())
    .filter(Boolean);

const genericNames = new Set(["the", "a", "an", "welcome", "home", "untitled", "new", "document", "page", "index", "欢迎", "首页", "官方"]);

const isShortName = (value: string) => {
  const chars = [...value];

  if (chars.length < 2 || chars.length > 12 || /\s/u.test(value)) {
    return false;
  }

  const cjkCount = chars.filter((char) => /[\u3400-\u9fff]/u.test(char)).length;
  return cjkCount === 0 || (cjkCount === chars.length && chars.length <= 4);
};

// Only skip common regional subdomains; product subdomains such as docs stay useful.
const regionalSubdomain = /^(?:cn|en|zh|ja|ko|de|fr|es|us|uk|zh-cn|zh-tw|en-us|en-gb)$/i;
const countryDomainCategory = new Set(["com", "co", "net", "org", "gov", "edu", "ac"]);

const siteHost = (url?: string) => {
  try {
    const parts = new URL(url || "").hostname.replace(/^www\./i, "").split(".");
    const ignoredPrefixes: string[] = [];
    while (parts.length > 2 && regionalSubdomain.test(parts[0]) &&
           !(parts.length === 3 && countryDomainCategory.has(parts[1]))) {
      ignoredPrefixes.push(parts.shift()!);
    }
    const name = parts[0] || "";
    return { name: isShortName(name) ? name : [...name].slice(0, 8).join(""), ignoredPrefixes };
  } catch {
    return { name: "", ignoredPrefixes: [] };
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
  const host = siteHost(url);
  const isGeneric = (value: string) => genericNames.has(value.toLowerCase()) ||
    host.ignoredPrefixes.includes(value.toLowerCase());

  // Short user-facing names can mix scripts or contain spaces.
  const shortTitle = title.trim();
  if ([...shortTitle].length >= 2 && [...shortTitle].length <= 12 &&
      !/[|·•（()）]|\s[-–—:：]\s/u.test(shortTitle) &&
      !/(官网|官方网站|官方|首页)$/u.test(shortTitle) &&
      !isGeneric(shortTitle)) return shortTitle;

  for (const candidate of candidatesFor(title)) {
    if (isShortName(candidate) && !isGeneric(candidate)) {
      return candidate;
    }
  }

  if (host.name) {
    return host.name;
  }

  const fallback = candidatesFor(title)[0] || cleanTitle(title);
  const cjkLead = /^[\u3400-\u9fff]{2,4}/u.exec(fallback);

  if (cjkLead) {
    return cjkLead[0];
  }

  return [...(fallback.split(/\s+/u)[0] || fallback)].slice(0, 8).join("");
};
