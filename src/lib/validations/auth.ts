import { z } from "zod";

export const signUpSchema = z.object({
  name: z
    .string()
    .trim()
    .min(3, "Name must be at least 3 characters"),

  email: z
    .email("Please enter a valid email")
    .trim(),

  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(100),
});

export type SignUpInput = z.infer<typeof signUpSchema>

export const signInSchema = z.object({
  email: z
    .email("Please enter a valid email")
    .trim(),

  password: z
    .string()
    .min(1, "Password is required"),
});

export type SignInInput = z.infer<typeof signInSchema>