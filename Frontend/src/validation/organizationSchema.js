import { z } from "zod"

export const createOrgSchema = z.object({
    name : z.string().min(3 , "Username must be at least 3 characters")
})