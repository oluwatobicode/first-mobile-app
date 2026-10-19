import { z } from 'zod';

export const WISHLIST_NAME_MAX = 50;

export const wishlistNameSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, 'Give your wishlist a name.')
    .max(WISHLIST_NAME_MAX, `Keep it to ${WISHLIST_NAME_MAX} characters or fewer.`),
});
export type WishlistNameForm = z.infer<typeof wishlistNameSchema>;
