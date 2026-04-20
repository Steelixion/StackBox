import { z } from 'zod';

/**
 * Zod Schema for robust Trader validation at runtime.
 */
export const SupplyItemSchema = z.object({
  product: z.string().min(1, "Product name required"),
  qty: z.number().nonnegative(),
  unit: z.string().min(1, "Unit required"),
});

export const TraderSchema = z.object({
  id: z.string().min(1, "ID required"),
  companyName: z.string().min(2, "Company name must be at least 2 characters"),
  email: z.string().email("Invalid email format"),
  phone: z.string().min(5, "Invalid phone format"),
  status: z.enum(["Active", "Idle"]),
  address: z.string().optional(),
  totalValue: z.string().optional(),
  supplies: z.array(SupplyItemSchema),
  lastAuditDate: z.string().optional(),
});

export type Trader = z.infer<typeof TraderSchema>;
export type SupplyItem = z.infer<typeof SupplyItemSchema>;

/**
 * Existing Bundle Schema for reference
 */
export const BundleSchema = z.object({
  name: z.string().min(3, "Name must be at least 3 characters"),
  projectedMargin: z.string().regex(/^\+\d+%$/, "Margin must be in format +XX%"),
  components: z.array(z.string()).min(1, "At least one component required"),
});