import { z } from "zod";

export const projectSchema = z.object({
    name: z
        .string()
        .min(1, "Project name is required")
        .max(100, "Project name must be less than 100 characters"),

    description: z
        .string()
        .max(500, "Description must be less than 500 characters")
        .optional(),
});

export const projectUpdateSchema = z.object({
    name: z
        .string()
        .min(1, "Project name is required")
        .max(100, "Project name must be less than 100 characters"),

    description: z
        .string()
        .max(500, "Description must be less than 500 characters")
        .optional(),
});