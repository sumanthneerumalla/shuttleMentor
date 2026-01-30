export const CLUB_LANDING_SHORTNAMES = ["cba"] as const;

export function normalizePathname(pathname: string): string {
  return pathname.endsWith("/") && pathname !== "/" ? pathname.slice(0, -1) : pathname;
}

export function pathnameToTopLevelSegment(pathname: string): string {
  const normalized = normalizePathname(pathname);
  return normalized.startsWith("/") ? normalized.slice(1) : normalized;
}

export function isClubLandingShortUrlPathname(pathname: string): boolean {
  const topLevel = pathnameToTopLevelSegment(pathname);
  return CLUB_LANDING_SHORTNAMES.includes(topLevel as (typeof CLUB_LANDING_SHORTNAMES)[number]);
}

export function getClubShortnameFromShortUrlPathname(pathname: string): string | null {
  const topLevel = pathnameToTopLevelSegment(pathname);
  return isClubLandingShortUrlPathname(pathname) ? topLevel : null;
}

export function isClubLandingInternalPathname(pathname: string): boolean {
  const normalized = normalizePathname(pathname);

  if (!normalized.startsWith("/club/")) {
    return false;
  }

  const clubShortname = normalized.slice("/club/".length);
  return CLUB_LANDING_SHORTNAMES.includes(clubShortname as (typeof CLUB_LANDING_SHORTNAMES)[number]);
}
