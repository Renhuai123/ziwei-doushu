/** Thay placeholder dạng {name} trong chuỗi đã dịch (t() không hỗ trợ nội suy). */
export function formatMessage(
  template: string,
  vars: Record<string, string | number>,
): string {
  return Object.entries(vars).reduce(
    (text, [key, value]) => text.split(`{${key}}`).join(String(value)),
    template,
  );
}
