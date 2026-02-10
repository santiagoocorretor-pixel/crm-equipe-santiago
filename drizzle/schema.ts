import { 
  int, 
  mysqlEnum, 
  mysqlTable, 
  text, 
  timestamp, 
  varchar,
  decimal,
  boolean,
  datetime
} from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 */
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * Etapas do funil de vendas (customizáveis)
 */
export const funnelStages = mysqlTable("funnel_stages", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().references(() => users.id),
  name: varchar("name", { length: 100 }).notNull(),
  order: int("order").notNull(),
  color: varchar("color", { length: 7 }).default("#3B82F6").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type FunnelStage = typeof funnelStages.$inferSelect;
export type InsertFunnelStage = typeof funnelStages.$inferInsert;

/**
 * Leads - contatos em processo de vendas
 */
export const leads = mysqlTable("leads", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().references(() => users.id),
  name: varchar("name", { length: 255 }).notNull(),
  email: varchar("email", { length: 320 }),
  phone: varchar("phone", { length: 20 }),
  company: varchar("company", { length: 255 }),
  position: varchar("position", { length: 255 }),
  origin: varchar("origin", { length: 100 }), // Website, Referência, LinkedIn, etc
  source: varchar("source", { length: 100 }), // Fonte do lead (Imobiliária, Indicado, etc)
  property: varchar("property", { length: 255 }), // Imóvel associado
  estimatedValue: varchar("estimatedValue", { length: 20 }),
  funnelStageId: int("funnelStageId").notNull().references(() => funnelStages.id),
  assignedTo: int("assignedTo").references(() => users.id),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastContactedAt: timestamp("lastContactedAt"),
});

export type Lead = typeof leads.$inferSelect;


/**
 * Histórico de interações com leads
 */
export const interactions = mysqlTable("interactions", {
  id: int("id").autoincrement().primaryKey(),
  leadId: int("leadId").notNull().references(() => leads.id),
  userId: int("userId").notNull().references(() => users.id),
  type: mysqlEnum("type", ["email", "phone_call", "meeting", "whatsapp", "linkedin", "note"]).notNull(),
  subject: varchar("subject", { length: 255 }),
  description: text("description"),
  duration: int("duration"), // em minutos, para chamadas
  result: varchar("result", { length: 100 }), // sucesso, sem resposta, agendado, etc
  scheduledFor: datetime("scheduledFor"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Interaction = typeof interactions.$inferSelect;
export type InsertInteraction = typeof interactions.$inferInsert;

export type InsertLead = Omit<typeof leads.$inferInsert, 'estimatedValue'> & { estimatedValue?: string | number | null };

/**
 * Cadência de contatos - sequências programadas
 */
export const cadences = mysqlTable("cadences", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().references(() => users.id),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  isActive: boolean("isActive").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Cadence = typeof cadences.$inferSelect;
export type InsertCadence = typeof cadences.$inferInsert;

/**
 * Etapas individuais de uma cadência
 */
export const cadenceSteps = mysqlTable("cadence_steps", {
  id: int("id").autoincrement().primaryKey(),
  cadenceId: int("cadenceId").notNull().references(() => cadences.id),
  stepNumber: int("stepNumber").notNull(),
  type: mysqlEnum("type", ["email", "phone_call", "whatsapp", "linkedin"]).notNull(),
  delayDays: int("delayDays").notNull(), // dias após o passo anterior
  subject: varchar("subject", { length: 255 }),
  content: text("content"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type CadenceStep = typeof cadenceSteps.$inferSelect;
export type InsertCadenceStep = typeof cadenceSteps.$inferInsert;

/**
 * Cadência aplicada a leads
 */
export const leadCadences = mysqlTable("lead_cadences", {
  id: int("id").autoincrement().primaryKey(),
  leadId: int("leadId").notNull().references(() => leads.id),
  cadenceId: int("cadenceId").notNull().references(() => cadences.id),
  startedAt: timestamp("startedAt").defaultNow().notNull(),
  completedAt: timestamp("completedAt"),
  currentStep: int("currentStep").default(0).notNull(),
  isActive: boolean("isActive").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type LeadCadence = typeof leadCadences.$inferSelect;
export type InsertLeadCadence = typeof leadCadences.$inferInsert;

/**
 * Tarefas vinculadas a leads
 */
export const tasks = mysqlTable("tasks", {
  id: int("id").autoincrement().primaryKey(),
  leadId: int("leadId").notNull().references(() => leads.id),
  userId: int("userId").notNull().references(() => users.id),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  dueDate: datetime("dueDate"),
  reminderTime: datetime("reminderTime"),
  status: mysqlEnum("status", ["pending", "completed", "cancelled"]).default("pending").notNull(),
  priority: mysqlEnum("priority", ["low", "medium", "high"]).default("medium").notNull(),
  hasAlert: boolean("hasAlert").default(false).notNull(),
  alertSent: boolean("alertSent").default(false).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  completedAt: timestamp("completedAt"),
});

export type Task = typeof tasks.$inferSelect;
export type InsertTask = typeof tasks.$inferInsert;

/**
 * Métricas e histórico de conversões
 */
export const conversionMetrics = mysqlTable("conversion_metrics", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().references(() => users.id),
  fromStageId: int("fromStageId").notNull().references(() => funnelStages.id),
  toStageId: int("toStageId").notNull().references(() => funnelStages.id),
  leadId: int("leadId").notNull().references(() => leads.id),
  conversionDate: timestamp("conversionDate").defaultNow().notNull(),
  daysInStage: int("daysInStage"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type ConversionMetric = typeof conversionMetrics.$inferSelect;
export type InsertConversionMetric = typeof conversionMetrics.$inferInsert;
