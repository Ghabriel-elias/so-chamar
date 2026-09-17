import { z } from "zod";

import { digitsOnly } from "@/utils/format/phone";

export const customerDetailsSchema = z.object({
  customerName: z
    .string()
    .trim()
    .min(2, "nameShort")
    .max(80, "nameLong"),
  customerPhone: z
    .string()
    .transform(digitsOnly)
    .refine((value) => value.length === 11, "phoneShort"),
  address: z.string().trim().min(6, "addressShort").max(250, "addressLong"),
  problemDescription: z.string().trim().max(500, "problemLong"),
});

export type CustomerDetails = z.infer<typeof customerDetailsSchema>;

export const reviewSchema = z.object({
  rating: z.number().int().min(1, "ratingRequired").max(5),
  comment: z.string().trim().max(500, "commentLong").optional(),
});

export function fieldErrors(error: z.ZodError): Record<string, string> {
  const result: Record<string, string> = {};

  for (const issue of error.issues) {
    const field = String(issue.path[0] ?? "");
    if (field && !result[field]) result[field] = issue.message;
  }

  return result;
}

export const contactSchema = customerDetailsSchema.pick({
  customerName: true,
  customerPhone: true,
});

export const problemSchema = customerDetailsSchema.pick({
  problemDescription: true,
});

const STATES = [
  "AC", "AL", "AM", "AP", "BA", "CE", "DF", "ES", "GO", "MA", "MG", "MS", "MT", "PA",
  "PB", "PE", "PI", "PR", "RJ", "RN", "RO", "RR", "RS", "SC", "SE", "SP", "TO",
];

export const addressPartsSchema = z.object({
  street: z.string().trim().min(3, "streetShort").max(80, "streetLong"),
  number: z.string().trim().min(1, "numberRequired").max(10, "numberLong"),
  complement: z.string().trim().max(40, "complementLong"),
  neighbourhood: z.string().trim().max(50, "neighbourhoodLong"),
  city: z.string().trim().min(2, "cityShort").max(40, "cityLong"),
  state: z
    .string()
    .transform((value) => value.trim().toUpperCase())
    .refine((value) => STATES.includes(value), "stateInvalid"),
});
