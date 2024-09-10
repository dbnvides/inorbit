import { and, count, eq, gte, lte, sql } from "drizzle-orm"
import { db } from "../db"
import { goalCompletions, goals } from "../db/schema"
import dayjs from "dayjs"

export const getWeekSummary = async () =>{
    const firstDayOfWeek = dayjs().startOf('week').toDate()
    const lastDayOfWeek = dayjs().endOf('week').toDate()

    const goalsCreatedUpToWeek = db.$with('goals_created_up_to_week').as(
        //lower or then equal = lte
        db.select({
            id: goals.id,
            title: goals.title,
            desiredWeeklyFrequency: goals.desiredWeeklyFrequency,
            createdAt: goals.createdAt
        })
        .from(goals)
        .where(lte(goals.createdAt, lastDayOfWeek))
    )


    const goalsCompletionInWeek = db.$with('goals_completion_in_week').as(
        db.select({
            id: goalCompletions.id,
            title: goals.title,
            completedAt: goalCompletions.createdAt,
            completedAtDate: sql`
            DATE(${goalCompletions.createdAt})
            `.as('completedAtDate')
        })
        .from(goalCompletions)
        .innerJoin(goals, eq(goals.id, goalCompletions.goalId))
        .where(and(
            gte(goalCompletions.createdAt, firstDayOfWeek),
            lte(goalCompletions.createdAt, lastDayOfWeek)
        ))   
    )
    
    const goalsCompletedByWeekDay = db.$with('goals_completed_by_week_day').as(
        db
        .select({
            completedAtDate: goalsCompletionInWeek.completedAtDate,
            completions: sql`
            JSON_AGG(
                JSON_BUILD_OBJECT(
                    'id',${goalsCompletionInWeek.id},
                    'title',${goalsCompletionInWeek.title},
                    'completedAt',${goalsCompletionInWeek.completedAt}
                )
            )
            `.as('completions')
        })
        .from(goalsCompletionInWeek)
        .groupBy(goalsCompletionInWeek.completedAtDate)
    )

    const result = await db
    .with(goalsCreatedUpToWeek, goalsCompletedByWeekDay, goalsCompletionInWeek)
    .select({
        completed: sql`(SELECT COUNT (*) FROM ${goalsCompletionInWeek})`.mapWith(Number),
        total: sql`(SELECT SUM(${goalsCreatedUpToWeek.desiredWeeklyFrequency}) FROM ${goalsCreatedUpToWeek})`.mapWith(Number),
        goalsPerDay: sql`
        JSON_OBJECT_AGG(
            ${goalsCompletedByWeekDay.completedAtDate},
            ${goalsCompletedByWeekDay.completions}
        )
        `
    })
    .from(goalsCompletedByWeekDay)

    return{
        summary: result
    }
}