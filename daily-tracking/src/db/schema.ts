import { pgTable, text, timestamp, integer, boolean, uuid } from 'drizzle-orm/pg-core'

// Task Groups table
export const taskGroups = pgTable('task_groups', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  color: text('color').notNull(),
  duration: integer('duration').notNull(),
  startDate: timestamp('start_date').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull()
})

// Tasks table - updated with type field
export const tasks = pgTable('tasks', {
  id: uuid('id').primaryKey().defaultRandom(),
  groupId: uuid('group_id').references(() => taskGroups.id, { onDelete: 'cascade' }).notNull(),
  text: text('text').notNull(),
  type: text('type').notNull().default('task'), // Add the missing type column
  completed: boolean('completed').default(false).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull()
})

// Task completion tracking (for specific dates)
export const taskCompletions = pgTable('task_completions', {
  id: uuid('id').primaryKey().defaultRandom(),
  taskId: uuid('task_id').references(() => tasks.id, { onDelete: 'cascade' }).notNull(),
  completedDate: timestamp('completed_date').notNull(),
  completed: boolean('completed').default(true).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull()
})
