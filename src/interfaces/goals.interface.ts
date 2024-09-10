export interface CreateGoalRequest {
    title: string,
    desiredWeeklyFrequency: number
}
export interface CreateGoalCompletionRequest {
    goalId: string
}