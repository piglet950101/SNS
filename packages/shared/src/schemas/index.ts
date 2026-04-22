import { z } from 'zod'
import {
  ALLOWED_IMAGE_MIME,
  BUSINESS_TYPES,
  MAX_IMAGES_PER_POST,
} from '../constants'
import { BILLING_INTERVALS, PLANS } from '../pricing'

export const businessTypeSchema = z.enum([
  BUSINESS_TYPES.MAID_CAFE,
  BUSINESS_TYPES.CONCEPT_CAFE,
  BUSINESS_TYPES.RESTAURANT,
  BUSINESS_TYPES.BAR,
  BUSINESS_TYPES.OTHER,
])

export const planSchema = z.enum([PLANS.STARTER, PLANS.STANDARD, PLANS.PRO])
export const intervalSchema = z.enum([BILLING_INTERVALS.MONTH, BILLING_INTERVALS.YEAR])

// ---- Onboarding ------------------------------------------------------------
export const createStoreSchema = z.object({
  name: z.string().trim().min(1, '店舗名を入力してください').max(100),
  businessType: businessTypeSchema,
  area: z.string().trim().min(1, 'エリアを入力してください').max(100),
})
export type CreateStoreInput = z.infer<typeof createStoreSchema>

export const updateStoreSchema = createStoreSchema.partial()

// ---- Signup consent (verified server-side via Clerk webhook + explicit form) -
export const signupConsentSchema = z.object({
  ageVerified: z.literal(true, {
    errorMap: () => ({ message: '18歳以上であることを確認してください' }),
  }),
  antisocialAttested: z.literal(true, {
    errorMap: () => ({ message: '反社会的勢力でないことを表明してください' }),
  }),
  termsAccepted: z.literal(true, {
    errorMap: () => ({ message: '利用規約とプライバシーポリシーに同意してください' }),
  }),
})
export type SignupConsentInput = z.infer<typeof signupConsentSchema>

// ---- Image upload ----------------------------------------------------------
export const uploadUrlSchema = z.object({
  filename: z.string().min(1).max(255),
  contentType: z.enum(ALLOWED_IMAGE_MIME),
})
export type UploadUrlInput = z.infer<typeof uploadUrlSchema>

// ---- Posts -----------------------------------------------------------------
export const generatePostSchema = z.object({
  storeId: z.string().uuid(),
  imageUrls: z
    .array(z.string().url())
    .min(1, '画像を1枚以上選択してください')
    .max(MAX_IMAGES_PER_POST, `画像は最大${MAX_IMAGES_PER_POST}枚までです`),
  hint: z.string().trim().max(500).optional(),
})
export type GeneratePostInput = z.infer<typeof generatePostSchema>

export const updatePostSchema = z.object({
  editedForX: z.string().max(1_000).optional(),
})
export type UpdatePostInput = z.infer<typeof updatePostSchema>

export const historyQuerySchema = z.object({
  cursor: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(50).default(20),
})

// ---- Billing ---------------------------------------------------------------
export const checkoutSchema = z.object({
  plan: planSchema,
  interval: intervalSchema,
})
export type CheckoutInput = z.infer<typeof checkoutSchema>

// ---- Account ---------------------------------------------------------------
export const deleteAccountSchema = z.object({
  confirm: z.literal('DELETE', {
    errorMap: () => ({ message: '確認文字列が一致しません' }),
  }),
})
