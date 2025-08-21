import { pgTable, foreignKey, uuid, text, boolean, timestamp, integer } from "drizzle-orm/pg-core"
import { sql } from "drizzle-orm"



export const tasks = pgTable("tasks", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	groupId: uuid("group_id").notNull(),
	text: text().notNull(),
	type: text().notNull(),
	completed: boolean().default(false).notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.groupId],
			foreignColumns: [taskGroups.id],
			name: "tasks_group_id_task_groups_id_fk"
		}).onDelete("cascade"),
]);

export const taskCompletions = pgTable("task_completions", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	taskId: uuid("task_id").notNull(),
	completedDate: timestamp("completed_date", { mode: 'string' }).notNull(),
	completed: boolean().default(true).notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.taskId],
			foreignColumns: [tasks.id],
			name: "task_completions_task_id_tasks_id_fk"
		}).onDelete("cascade"),
]);

export const taskGroups = pgTable("task_groups", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	name: text().notNull(),
	color: text().notNull(),
	duration: integer().notNull(),
	startDate: timestamp("start_date", { mode: 'string' }).notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
});
