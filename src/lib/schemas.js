import { z } from "zod";

export const onboardingSchema = z.object({
  erpUsername: z.string().min(1),
  erpPassword: z.string().min(1),
  lmsUsername: z.string().min(1),
  lmsPassword: z.string().min(1),
  academicYear: z.string().min(1),
  semester: z.enum(["odd", "even"]),
});

export const mcpUserContextSchema = onboardingSchema.extend({
  issuedAt: z.number(),
  expiresAt: z.number(),
});
