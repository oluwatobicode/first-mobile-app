import { z } from 'zod';

import { emailSchema, phoneSchema } from '@/lib/validation';

// Rules for the profile, account and hosting forms.

const name = (label: string) => z.string().trim().min(1, `${label} is required.`).max(40, 'That’s a bit long.');

export const aboutSchema = z.object({
  work: z.string().trim().max(60, 'Keep it under 60 characters.'),
  livesIn: z.string().trim().max(60, 'Keep it under 60 characters.'),
  languages: z.string().trim().max(80, 'Keep it under 80 characters.'),
  bio: z.string().trim().max(300, 'Keep it under 300 characters.'),
});
export type AboutForm = z.infer<typeof aboutSchema>;

export const legalNameSchema = z.object({ firstName: name('First name'), lastName: name('Last name') });
export type LegalNameForm = z.infer<typeof legalNameSchema>;

export const preferredNameSchema = z.object({ preferredName: z.string().trim().max(40, 'That’s a bit long.') });
export type PreferredNameForm = z.infer<typeof preferredNameSchema>;

export { emailSchema, phoneSchema };

export const addressSchema = z.object({
  street: z.string().trim().min(3, 'Enter your street address.'),
  city: z.string().trim().min(2, 'Enter your city.'),
  state: z.string().trim().min(2, 'Enter your state or region.'),
});
export type AddressForm = z.infer<typeof addressSchema>;

export const emergencySchema = z.object({
  contactName: name('Name'),
  relationship: z.string().trim().min(2, 'Tell us how you know them.'),
  contactPhone: phoneSchema.shape.phone,
});
export type EmergencyForm = z.infer<typeof emergencySchema>;

/** 0–4: length, mixed case, number, symbol. */
export function passwordStrength(value: string) {
  if (!value) return 0;
  let score = 0;
  if (value.length >= 8) score++;
  if (/[a-z]/.test(value) && /[A-Z]/.test(value)) score++;
  if (/[0-9]/.test(value)) score++;
  if (/[^A-Za-z0-9]/.test(value) || value.length >= 14) score++;
  return score;
}

export const changePasswordSchema = z
  .object({
    current: z.string().min(1, 'Enter your current password.'),
    next: z
      .string()
      .min(8, 'Use at least 8 characters.')
      .regex(/[0-9!@#$%^&*]/, 'Include a number or symbol.'),
    confirm: z.string().min(1, 'Confirm your new password.'),
  })
  .refine((v) => v.next === v.confirm, { path: ['confirm'], message: 'Passwords don’t match.' })
  .refine((v) => v.next !== v.current, { path: ['next'], message: 'Choose a password you haven’t used here.' });
export type ChangePasswordForm = z.infer<typeof changePasswordSchema>;

export const couponSchema = z.object({
  code: z
    .string()
    .trim()
    .toUpperCase()
    .regex(/^[A-Z0-9]{6,10}$/, 'Codes are 6–10 letters or numbers.'),
});
export type CouponForm = z.input<typeof couponSchema>;

export const payoutSchema = z.object({
  accountNumber: z.string().regex(/^\d{10}$/, 'Nigerian account numbers (NUBAN) are 10 digits.'),
});
export type PayoutForm = z.infer<typeof payoutSchema>;

export const nightlyPriceSchema = z.object({
  price: z
    .string()
    .min(1, 'Enter a price.')
    .refine((v) => Number(v.replace(/\D/g, '')) >= 5000, 'The minimum is ₦5,000 a night.')
    .refine((v) => Number(v.replace(/\D/g, '')) <= 5_000_000, 'The maximum is ₦5,000,000 a night.'),
});
export type NightlyPriceForm = z.infer<typeof nightlyPriceSchema>;
