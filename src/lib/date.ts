// Small date-display helper. Content dates (`datePublished`) are authored as
// plain "YYYY-MM-DD" strings and coerced to Date via z.coerce.date() in
// content.config.ts, which parses them as UTC midnight. Formatting with the
// runtime's LOCAL timezone (the default for toLocaleDateString/Intl without an
// explicit timeZone) can therefore roll the displayed date back a day for
// anyone building or viewing west of UTC — so this always formats in UTC to
// match the authored calendar date exactly, regardless of build/viewer TZ.
export function formatDate(date: Date): string {
  return new Intl.DateTimeFormat('en-US', { dateStyle: 'long', timeZone: 'UTC' }).format(date);
}
