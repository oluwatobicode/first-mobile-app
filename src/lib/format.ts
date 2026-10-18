// Input formatters used as you type. Each takes the new text (and sometimes the previous value).

export function formatPhone(text: string) {
  return text.replace(/\D/g, '').slice(0, 11).replace(/(\d{4})(?=\d)/g, '$1 ');
}

export function formatCardNumber(text: string) {
  return text.replace(/\D/g, '').slice(0, 19).replace(/(.{4})(?=.)/g, '$1 ');
}

export function formatExpiry(text: string, previous: string) {
  const digits = text.replace(/\D/g, '').slice(0, 4);
  // Let backspace remove the " / " separator naturally.
  if (text.length < previous.length && previous.endsWith(' / ')) return digits.slice(0, 1);
  // Typing 2–9 as the first digit can only mean a single-digit month.
  if (digits.length === 1 && Number(digits) > 1) return `0${digits} / `;
  if (digits.length >= 2) return `${digits.slice(0, 2)} / ${digits.slice(2)}`;
  return digits;
}

/** "14021995" → "14/02/1995" */
export function formatBirthday(text: string, previous: string) {
  const digits = text.replace(/\D/g, '').slice(0, 8);
  const joined = [digits.slice(0, 2), digits.slice(2, 4), digits.slice(4)].filter(Boolean).join('/');
  const deleting = text.length < previous.length;
  // While typing forward, add the slash as soon as the day or month is complete.
  return !deleting && (digits.length === 2 || digits.length === 4) ? `${joined}/` : joined;
}

export const onlyDigits = (max: number) => (text: string) => text.replace(/\D/g, '').slice(0, max);
