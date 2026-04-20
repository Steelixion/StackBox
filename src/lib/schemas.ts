import { z } from 'zod';

export const BundleSchema = z.object({
    name: z.string().min(3, "Name must be at least 3 characters"),
    projectedMargin: z.string().regex(/^\+\d+%$/, "Margin must be in format +XX%"),
    components: z.array(z.string()).min(1, "At least one component required"),
});