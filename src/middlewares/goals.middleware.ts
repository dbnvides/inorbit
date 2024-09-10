import z from 'zod'
import type { CreateGoalRequest } from '../interfaces/goals.interface'

export const verifyIntegredBody = (request: CreateGoalRequest) =>{
    const createGoalSchema = z.object({
        title: z.string(),
        desiredWeeklyFrequency: z.number().int().min(1).max(7)
    })

    const body = createGoalSchema.parse(request)

    return {body}

}