import { z } from 'zod';

import { detectBrand } from '@/components/payment-badge';

// One place for every form's rules, so screens only deal with layout.

const digits = (value: string) => value.replace(/\D/g, '');

export const phoneSchema = z.object({
  phone: z
    .string()
    .refine((v) => digits(v).length >= 7, 'Enter a valid phone number.')
    .refine((v) => digits(v).length <= 11, 'That number is too long.'),
});
export type PhoneForm = z.infer<typeof phoneSchema>;

export const emailSchema = z.object({
  email: z.string().trim().min(1, 'Email is required.').pipe(z.email({ error: 'Enter a valid email.' })),
});
export type EmailForm = z.infer<typeof emailSchema>;

export const passwordSchema = z.object({
  password: z.string().min(1, 'Password is required.'),
});
export type PasswordForm = z.infer<typeof passwordSchema>;

export const codeSchema = z.object({
  code: z.string().regex(/^\d{4}$/, 'Enter the 4-digit code.'),
});
export type CodeForm = z.infer<typeof codeSchema>;

/** "DD/MM/YYYY" → Date, or null if it isn't a real date. */
export function parseBirthday(value: string) {
  const match = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(value);
  if (!match) return null;
  const [, d, m, y] = match.map(Number);
  const date = new Date(y, m - 1, d);
  return date.getFullYear() === y && date.getMonth() === m - 1 && date.getDate() === d ? date : null;
}

function ageOn(birthday: Date, today = new Date()) {
  let age = today.getFullYear() - birthday.getFullYear();
  const beforeBirthday =
    today.getMonth() < birthday.getMonth() ||
    (today.getMonth() === birthday.getMonth() && today.getDate() < birthday.getDate());
  if (beforeBirthday) age -= 1;
  return age;
}

const newPassword = z
  .string()
  .min(8, 'Use at least 8 characters.')
  .regex(/[0-9!@#$%^&*]/, 'Include a number or symbol.');

export const signupSchema = z.object({
  firstName: z.string().trim().min(1, 'First name is required.').max(40),
  lastName: z.string().trim().min(1, 'Last name is required.').max(40),
  birthday: z
    .string()
    .min(1, 'Birthday is required.')
    .refine((v) => parseBirthday(v) !== null, 'Enter a real date as DD/MM/YYYY.')
    .refine((v) => {
      const date = parseBirthday(v);
      return !date || ageOn(date) >= 18;
    }, 'You need to be at least 18 to sign up.')
    .refine((v) => {
      const date = parseBirthday(v);
      return !date || ageOn(date) <= 120;
    }, 'Check the year.'),
  email: emailSchema.shape.email,
  // Only asked for when signing up with email; phone sign-ups verify with a code instead.
  password: z.string().optional(),
  marketingOptOut: z.boolean(),
});
export type SignupForm = z.infer<typeof signupSchema>;

export const signupWithPasswordSchema = signupSchema.extend({ password: newPassword });

function expiryIsValid(value: string) {
  const [mm, yy] = value.split(' / ').map(Number);
  if (!mm || mm > 12 || !yy || String(yy).length !== 2) return false;
  const now = new Date();
  const year = 2000 + yy;
  return year > now.getFullYear() || (year === now.getFullYear() && mm >= now.getMonth() + 1);
}

export const cardSchema = z
  .object({
    number: z.string().refine((v) => digits(v).length >= 15 && digits(v).length <= 19, 'Check your card number.'),
    expiry: z.string().refine(expiryIsValid, 'Check the expiration date.'),
    cvv: z.string(),
    zip: z.string().max(10),
  })
  .superRefine((card, ctx) => {
    const length = detectBrand(card.number) === 'amex' ? 4 : 3;
    if (card.cvv.length !== length) ctx.addIssue({ code: 'custom', path: ['cvv'], message: `CVV is ${length} digits.` });
  });
export type CardForm = z.infer<typeof cardSchema>;

const count = (min: number) => z.number().int().min(min).max(16);

export const guestsSchema = z
  .object({ adults: count(1), children: count(0), infants: count(0), pets: count(0) })
  .refine((g) => g.adults + g.children <= 16, { message: 'This place allows up to 16 guests.', path: ['children'] });
export type GuestsForm = z.infer<typeof guestsSchema>;

export const shareSchema = z.object({
  emails: z
    .array(z.object({ value: z.string().trim() }))
    .superRefine((emails, ctx) => {
      emails.forEach((email, index) => {
        if (email.value && !z.email().safeParse(email.value).success) {
          ctx.addIssue({ code: 'custom', path: [index, 'value'], message: 'Enter a valid email.' });
        }
      });
      if (!emails.some((e) => e.value)) ctx.addIssue({ code: 'custom', path: [0, 'value'], message: 'Add at least one email.' });
    }),
});
export type ShareForm = z.infer<typeof shareSchema>;
