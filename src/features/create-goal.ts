import { db } from "../db"
import { goals } from "../db/schema"
import type { CreateGoalRequest } from "../interfaces/goals.interface"

export const createGoal = async ({title, desiredWeeklyFrequency}: CreateGoalRequest) =>{
    const result = await db.insert(goals).values({
        title,
        desiredWeeklyFrequency,
    }).returning()

    const goal = result[0]

    return {
        goal,
    }
}