import { count, gte, lte, and, eq, sql } from "drizzle-orm"
import { db } from "../db"
import { goalCompletions, goals} from "../db/schema"
import type { CreateGoalCompletionRequest } from "../interfaces/goals.interface"
import dayjs from "dayjs"

export const createGoalCompletion = async ( {goalId,}: CreateGoalCompletionRequest) =>{
    const firstDayOfWeek = dayjs().startOf('week').toDate()
    const lastDayOfWeek = dayjs().endOf('week').toDate()

    const goalCompletionCounts = db.$with('goals_completion_counts').as(
        db.select({
            goalId: goalCompletions.goalId,
            completionCount: count(goalCompletions.id).as('completionCount'),
        })
        .from(goalCompletions)
        .where(and(
            gte(goalCompletions.createdAt, firstDayOfWeek),
            lte(goalCompletions.createdAt, lastDayOfWeek),
            eq(goalCompletions.goalId, goalId)
        ))
        .groupBy(goalCompletions.goalId)
    )

    const result = await db
    .with(goalCompletionCounts)
    .select({
        desiredWeeklyFrequency: goals.desiredWeeklyFrequency,
        //Coalesce é a logica dizendo caso não exista aplique o default number 0 com mapWith
        completionCount: sql`
        COALESCE(${goalCompletionCounts.completionCount}, 0)
        `.mapWith(Number)
    })
    .from(goals)
    .leftJoin(goalCompletionCounts, eq(goalCompletionCounts.goalId, goals.id))
    .where(eq(goals.id, goalId))
    .limit(1)


    const {completionCount,desiredWeeklyFrequency} = result[0]

    if ( completionCount >= desiredWeeklyFrequency){
        throw new Error('Goal already completed this week!')
    }
    const insertResult = await db
    .insert(goalCompletions)
    .values({
        goalId
    }).returning()

    const goalCompletion = insertResult[0]

    return {
       goalCompletion
    }
}