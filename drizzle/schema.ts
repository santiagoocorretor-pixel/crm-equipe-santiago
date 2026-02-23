import { 
  integer, 
  sqliteTable, 
  text, 
  real,
  primaryKey,
} from "drizzle-orm/sqlite-core";

/**
 * Core user table backing auth flow.
 */
export const users = sqliteTable("users", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  openId: text("openId").notNull().unique(),
  name: text("name"),
  email: text("email").unique(),
  password: text("password"), // Hash da senha para autenticação local
  loginMethod: text("loginMethod").default("local"),
  role: text("role", { enum: ["user", "admin"] }).default("user").notNull(),
  createdAt: integer("createdAt", { mode: "timestamp" }).notNull(),
  updatedAt: integer("updatedAt", { mode: "timestamp" }).notNull(),
  lastSignedIn: integer("lastSignedIn", { mode: "timestamp" }).notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * Etapas do funil de vendas (customizáveis)
 */
export const funnelStages = sqliteTable("funnel_stages", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: integer("userId").notNull().references(() => users.id),
  name: text("name").notNull(),
  order: integer("order").notNull(),
  color: text("color").default("#3B82F6").notNull(),
  createdAt: integer("createdAt", { mode: "timestamp" }).notNull(),
  updatedAt: integer("updatedAt", { mode: "timestamp" }).notNull(),
});

export type FunnelStage = typeof funnelStages.$inferSelect;
export type InsertFunnelStage = typeof funnelStages.$inferInsert;

/**
 * Leads - contatos em processo de vendas
 */
export const leads = sqliteTable("leads", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: integer("userId").notNull().references(() => users.id),
  name: text("name").notNull(),
  email: text("email"),
  phone: text("phone"),
  company: text("company"),
  position: text("position"),
  origin: text("origin"), // Website, Referência, LinkedIn, etc
  source: text("source"), // Fonte do lead (Imobiliária, Indicado, etc)
  property: text("property"), // Imóvel associado
  estimatedValue: text("estimatedValue"),
  funnelStageId: integer("funnelStageId").notNull().references(() => funnelStages.id),
  assignedTo: integer("assignedTo").references(() => users.id),
  notes: text("notes"),
  createdAt: integer("createdAt", { mode: "timestamp" }).notNull(),
  updatedAt: integer("updatedAt", { mode: "timestamp" }).notNull(),
  lastContactedAt: integer("lastContactedAt", { mode: "timestamp" }),
});

export type Lead = typeof leads.$inferSelect;


/**
 * Histórico de interações com leads
 */
export const interactions = sqliteTable("interactions", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  leadId: integer("leadId").notNull().references(() => leads.id),
  userId: integer("userId").notNull().references(() => users.id),
  type: text("type", { enum: ["email", "phone_call", "meeting", "whatsapp", "linkedin", "note"] }).notNull(),
  subject: text("subject"),
  description: text("description"),
  duration: integer("duration"), // em minutos, para chamadas
  result: text("result"), // sucesso, sem resposta, agendado, etc
  scheduledFor: integer("scheduledFor", { mode: "timestamp" }),
  createdAt: integer("createdAt", { mode: "timestamp" }).notNull(),
  updatedAt: integer("updatedAt", { mode: "timestamp" }).notNull(),
});

export type Interaction = typeof interactions.$inferSelect;
export type InsertInteraction = typeof interactions.$inferInsert;

export type InsertLead = Omit<typeof leads.$inferInsert, 'estimatedValue'> & { estimatedValue?: string | number | null };

/**
 * Cadência de contatos - sequências programadas
 */
export const cadences = sqliteTable("cadences", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: integer("userId").notNull().references(() => users.id),
  name: text("name").notNull(),
  description: text("description"),
  isActive: integer("isActive", { mode: "boolean" }).default(true).notNull(),
  createdAt: integer("createdAt", { mode: "timestamp" }).notNull(),
  updatedAt: integer("updatedAt", { mode: "timestamp" }).notNull(),
});

export type Cadence = typeof cadences.$inferSelect;
export type InsertCadence = typeof cadences.$inferInsert;

/**
 * Etapas individuais de uma cadência
 */
export const cadenceSteps = sqliteTable("cadence_steps", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  cadenceId: integer("cadenceId").notNull().references(() => cadences.id),
  stepNumber: integer("stepNumber").notNull(),
  type: text("type", { enum: ["email", "phone_call", "whatsapp", "linkedin"] }).notNull(),
  delayDays: integer("delayDays").notNull(), // dias após o passo anterior
  subject: text("subject"),
  content: text("content"),
  createdAt: integer("createdAt", { mode: "timestamp" }).notNull(),
  updatedAt: integer("updatedAt", { mode: "timestamp" }).notNull(),
});

export type CadenceStep = typeof cadenceSteps.$inferSelect;
export type InsertCadenceStep = typeof cadenceSteps.$inferInsert;

/**
 * Cadência aplicada a leads
 */
export const leadCadences = sqliteTable("lead_cadences", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  leadId: integer("leadId").notNull().references(() => leads.id),
  cadenceId: integer("cadenceId").notNull().references(() => cadences.id),
  startedAt: integer("startedAt", { mode: "timestamp" }).notNull(),
  completedAt: integer("completedAt", { mode: "timestamp" }),
  currentStep: integer("currentStep").default(0).notNull(),
  isActive: integer("isActive", { mode: "boolean" }).default(true).notNull(),
  createdAt: integer("createdAt", { mode: "timestamp" }).notNull(),
  updatedAt: integer("updatedAt", { mode: "timestamp" }).notNull(),
});

export type LeadCadence = typeof leadCadences.$inferSelect;
export type InsertLeadCadence = typeof leadCadences.$inferInsert;

/**
 * Tarefas vinculadas a leads
 */
export const tasks = sqliteTable("tasks", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  leadId: integer("leadId").notNull().references(() => leads.id),
  userId: integer("userId").notNull().references(() => users.id),
  title: text("title").notNull(),
  description: text("description"),
  dueDate: integer("dueDate", { mode: "timestamp" }),
  reminderTime: integer("reminderTime", { mode: "timestamp" }),
  status: text("status", { enum: ["pending", "completed", "cancelled"] }).default("pending").notNull(),
  priority: text("priority", { enum: ["low", "medium", "high"] }).default("medium").notNull(),
  hasAlert: integer("hasAlert", { mode: "boolean" }).default(false).notNull(),
  alertSent: integer("alertSent", { mode: "boolean" }).default(false).notNull(),
  createdAt: integer("createdAt", { mode: "timestamp" }).notNull(),
  updatedAt: integer("updatedAt", { mode: "timestamp" }).notNull(),
  completedAt: integer("completedAt", { mode: "timestamp" }),
});

export type Task = typeof tasks.$inferSelect;
export type InsertTask = typeof tasks.$inferInsert;

/**
 * Métricas e histórico de conversões
 */
export const conversionMetrics = sqliteTable("conversion_metrics", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: integer("userId").notNull().references(() => users.id),
  fromStageId: integer("fromStageId").notNull().references(() => funnelStages.id),
  toStageId: integer("toStageId").notNull().references(() => funnelStages.id),
  leadId: integer("leadId").notNull().references(() => leads.id),
  conversionDate: integer("conversionDate", { mode: "timestamp" }).notNull(),
  daysInStage: integer("daysInStage"),
  createdAt: integer("createdAt", { mode: "timestamp" }).notNull(),
});

export type ConversionMetric = typeof conversionMetrics.$inferSelect;
export type InsertConversionMetric = typeof conversionMetrics.$inferInsert;


/**
 * Notificações em tempo real para usuários
 */
export const notifications = sqliteTable("notifications", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: integer("userId").notNull().references(() => users.id),
  type: text("type", { enum: ["lead_moved", "task_due", "new_interaction", "lead_created", "cadence_started"] }).notNull(),
  title: text("title").notNull(),
  message: text("message"),
  relatedLeadId: integer("relatedLeadId").references(() => leads.id),
  relatedTaskId: integer("relatedTaskId").references(() => tasks.id),
  isRead: integer("isRead", { mode: "boolean" }).default(false).notNull(),
  createdAt: integer("createdAt", { mode: "timestamp" }).notNull(),
  readAt: integer("readAt", { mode: "timestamp" }),
});

export type Notification = typeof notifications.$inferSelect;
export type InsertNotification = typeof notifications.$inferInsert;

/**
 * Corretores - profissionais que trabalham com leads
 */
export const brokers = sqliteTable("brokers", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: integer("userId").notNull().references(() => users.id),
  name: text("name").notNull(),
  email: text("email").notNull(),
  phone: text("phone"),
  creci: text("creci"),
  commission: real("commission").default(0.00),
  status: text("status", { enum: ["active", "inactive", "suspended"] }).default("active").notNull(),
  notes: text("notes"),
  createdAt: integer("createdAt", { mode: "timestamp" }).notNull(),
  updatedAt: integer("updatedAt", { mode: "timestamp" }).notNull(),
});

export type Broker = typeof brokers.$inferSelect;
export type InsertBroker = typeof brokers.$inferInsert;
