import { z } from "zod";

export const taskCreateSchema = z.object({
    title: z
        .string()
        .min(1, "Task title is required")
        .max(100, "Task title must be less than 100 characters"),

    description: z
        .string()
        .max(500, "Description must be less than 500 characters")
        .optional(),

    assignee_id: z.preprocess(
        (value) => value === "" ? undefined : value,
        z.coerce.number().int().positive(
            "Assignee ID must be greater than 0, or leave it blank"
        ).optional()
    ),

    status: z.enum(["todo", "in_progress", "done"]),

    priority: z.enum(["low", "medium", "high"]),

    due_date: z.preprocess(
        (value) => value === "" ? undefined : value,
        z.string().optional()
    )
});
export const taskUpdateSchema = z.object({
    title: z
        .string()
        .min(1, "Task title is required")
        .max(100, "Task title must be less than 100 characters"),

    description: z
        .string()
        .max(500, "Description must be less than 500 characters")
        .optional(),

    assignee_id: z.preprocess(
        (value) => value === "" ? null : value,
        z.union([
            z.null(),
            z.coerce
                .number()
                .int()
                .positive("Assignee ID must be greater than 0")
        ]).optional()
    ),

    status: z.enum(["todo", "in_progress", "done"]),

    priority: z.enum(["low", "medium", "high"]),

    due_date: z.preprocess(
        (value) => value === "" ? null : value,
        z.string().nullable().optional()
    )
});