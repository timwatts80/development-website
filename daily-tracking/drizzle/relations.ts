import { relations } from "drizzle-orm/relations";
import { taskGroups, tasks, taskCompletions } from "./schema";

export const tasksRelations = relations(tasks, ({one, many}) => ({
	taskGroup: one(taskGroups, {
		fields: [tasks.groupId],
		references: [taskGroups.id]
	}),
	taskCompletions: many(taskCompletions),
}));

export const taskGroupsRelations = relations(taskGroups, ({many}) => ({
	tasks: many(tasks),
}));

export const taskCompletionsRelations = relations(taskCompletions, ({one}) => ({
	task: one(tasks, {
		fields: [taskCompletions.taskId],
		references: [tasks.id]
	}),
}));