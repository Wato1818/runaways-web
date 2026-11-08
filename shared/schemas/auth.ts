import * as z from 'zod'

export const loginSchema = z.object({
  username: z.string().min(4).max(50),
  password: z.string().min(8).max(100)
})

export const signupSchema = z.object({
  username: z.string().min(4).max(50),
  password: z.string().min(8).max(100)
})
