export function cx(...s: Array<string | undefined | false>) {
  return s.filter(Boolean).join(" ");
}
