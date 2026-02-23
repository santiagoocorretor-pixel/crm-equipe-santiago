import { eq, and, desc, asc, gte, lte, like, inArray } from "drizzle-orm";
import { drizzle } from "drizzle-orm/better-sqlite3";
import Database from "better-sqlite3";
import { 
  InsertUser, 
  users,
  leads,
  funnelStages,
  interactions,
  cadences,
  cadenceSteps,
  leadCadences,
  tasks,
  conversionMetrics,
  notifications,
  brokers,
  Lead,
  FunnelStage,
  Interaction,
  Cadence,
  CadenceStep,
  LeadCadence,
  Task,
  ConversionMetric,
  Notification,
  InsertNotification,
  Broker,
  InsertBroker
} from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db) {
    try {
      const dbUrl = process.env.DATABASE_URL || "file:./data/crm.db";
      const dbPath = dbUrl.replace(/^file:\/+/, "/").replace(/^file:/, "./");
      const sqlite = new Database(dbPath);
      sqlite.pragma("journal_mode = WAL");
      _db = drizzle(sqlite);
      console.log("[Database] Connected to SQLite:", dbPath);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

// ============ FUNNEL STAGES ============

export async function getOrCreateDefaultFunnelStages(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const existing = await db
    .select()
    .from(funnelStages)
    .where(eq(funnelStages.userId, userId))
    .orderBy(asc(funnelStages.order));

  if (existing.length > 0) return existing;

  const defaultStages = [
    { name: "Prospecção", order: 1, color: "#3B82F6" },
    { name: "Qualificação", order: 2, color: "#8B5CF6" },
    { name: "Visita", order: 3, color: "#06B6D4" },
    { name: "Proposta", order: 4, color: "#EC4899" },
    { name: "Negociação", order: 5, color: "#F59E0B" },
    { name: "Fechamento", order: 6, color: "#10B981" },
    { name: "Perdido", order: 7, color: "#6B7280" },
  ];

  const created = await db
    .insert(funnelStages)
    .values(defaultStages.map(s => ({ ...s, userId })));

  return db
    .select()
    .from(funnelStages)
    .where(eq(funnelStages.userId, userId))
    .orderBy(asc(funnelStages.order));
}

export async function getFunnelStages(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return db
    .select()
    .from(funnelStages)
    .where(eq(funnelStages.userId, userId))
    .orderBy(asc(funnelStages.order));
}

export async function createFunnelStage(userId: number, name: string, color: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Get the highest order number
  const existing = await db
    .select()
    .from(funnelStages)
    .where(eq(funnelStages.userId, userId))
    .orderBy(desc(funnelStages.order))
    .limit(1);

  const nextOrder = existing.length > 0 ? existing[0].order + 1 : 0;

  await db
    .insert(funnelStages)
    .values({
      userId,
      name,
      color,
      order: nextOrder,
    });

  // Return the newly created stage
  const created = await db
    .select()
    .from(funnelStages)
    .where(and(eq(funnelStages.userId, userId), eq(funnelStages.name, name)))
    .orderBy(desc(funnelStages.createdAt))
    .limit(1);

  return created[0] || null;
}

export async function updateFunnelStage(id: number, userId: number, name: string, color: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db
    .update(funnelStages)
    .set({ name, color })
    .where(and(eq(funnelStages.id, id), eq(funnelStages.userId, userId)));

  return db
    .select()
    .from(funnelStages)
    .where(eq(funnelStages.id, id))
    .limit(1);
}

export async function deleteFunnelStage(id: number, userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Check if there are leads in this stage
  const leadsInStage = await db
    .select()
    .from(leads)
    .where(eq(leads.funnelStageId, id))
    .limit(1);

  if (leadsInStage.length > 0) {
    throw new Error("Não é possível deletar uma etapa que contém leads. Mova os leads para outra etapa primeiro.");
  }

  await db
    .delete(funnelStages)
    .where(and(eq(funnelStages.id, id), eq(funnelStages.userId, userId)));

  return { success: true };
}

export async function reorderFunnelStages(userId: number, stages: Array<{ id: number; order: number }>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  for (const stage of stages) {
    await db
      .update(funnelStages)
      .set({ order: stage.order })
      .where(and(eq(funnelStages.id, stage.id), eq(funnelStages.userId, userId)));
  }

  return getFunnelStages(userId);
}

// ============ LEADS ============

export async function createLead(data: {
  userId: number;
  name: string;
  email?: string;
  phone?: string;
  company?: string;
  position?: string;
  origin?: string;
  source?: string;
  property?: string;
  estimatedValue?: string | number;
  funnelStageId: number;
  assignedTo?: number;
  notes?: string;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const leadData = {
    ...data,
    estimatedValue: data.estimatedValue ? String(data.estimatedValue) : undefined,
  };
  return db.insert(leads).values([leadData])
}

export async function updateLead(id: number, data: Partial<Lead>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return db.update(leads).set({ ...data, updatedAt: new Date() }).where(eq(leads.id, id));
}

export async function getLead(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.select().from(leads).where(eq(leads.id, id));
  return result[0];
}

export async function getLeadsByUser(userId: number, filters?: {
  stageId?: number;
  origin?: string;
  assignedTo?: number;
  search?: string;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const conditions = [eq(leads.userId, userId)];

  if (filters?.stageId) {
    conditions.push(eq(leads.funnelStageId, filters.stageId));
  }
  if (filters?.origin) {
    conditions.push(eq(leads.origin, filters.origin));
  }
  if (filters?.assignedTo) {
    conditions.push(eq(leads.assignedTo, filters.assignedTo));
  }
  if (filters?.search) {
    conditions.push(like(leads.name, `%${filters.search}%`));
  }

  return db
    .select()
    .from(leads)
    .where(and(...conditions))
    .orderBy(desc(leads.createdAt));
}

export async function deleteLead(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return db.delete(leads).where(eq(leads.id, id));
}

// ============ INTERACTIONS ============

export async function createInteraction(data: {
  leadId: number;
  userId: number;
  type: "email" | "phone_call" | "meeting" | "whatsapp" | "linkedin" | "note";
  subject?: string;
  description?: string;
  duration?: number;
  result?: string;
  scheduledFor?: Date;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return db.insert(interactions).values(data);
}

export async function getLeadInteractions(leadId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return db
    .select()
    .from(interactions)
    .where(eq(interactions.leadId, leadId))
    .orderBy(desc(interactions.createdAt));
}

export async function getInteractionsByLead(leadId: number) {
  return getLeadInteractions(leadId);
}

// ============ CADENCES ============

export async function createCadence(data: {
  userId: number;
  name: string;
  description?: string;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return db.insert(cadences).values(data);
}

export async function getCadencesByUser(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return db
    .select()
    .from(cadences)
    .where(eq(cadences.userId, userId))
    .orderBy(desc(cadences.createdAt));
}

export async function getCadence(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.select().from(cadences).where(eq(cadences.id, id));
  return result[0];
}

export async function updateCadence(id: number, data: Partial<Cadence>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return db.update(cadences).set({ ...data, updatedAt: new Date() }).where(eq(cadences.id, id));
}

// ============ CADENCE STEPS ============

export async function createCadenceStep(data: {
  cadenceId: number;
  stepNumber: number;
  type: "email" | "phone_call" | "whatsapp" | "linkedin";
  delayDays: number;
  subject?: string;
  content?: string;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return db.insert(cadenceSteps).values(data);
}

export async function getCadenceSteps(cadenceId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return db
    .select()
    .from(cadenceSteps)
    .where(eq(cadenceSteps.cadenceId, cadenceId))
    .orderBy(asc(cadenceSteps.stepNumber));
}

// ============ LEAD CADENCES ============

export async function assignCadenceToLead(data: {
  leadId: number;
  cadenceId: number;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return db.insert(leadCadences).values(data);
}

export async function getLeadCadences(leadId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return db
    .select()
    .from(leadCadences)
    .where(eq(leadCadences.leadId, leadId));
}

export async function updateLeadCadence(id: number, data: Partial<LeadCadence>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return db.update(leadCadences).set({ ...data, updatedAt: new Date() }).where(eq(leadCadences.id, id));
}

// ============ TASKS ============

export async function createTask(data: {
  leadId: number;
  userId: number;
  title: string;
  description?: string;
  dueDate?: Date;
  reminderTime?: Date;
  priority?: "low" | "medium" | "high";
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return db.insert(tasks).values(data);
}

export async function getLeadTasks(leadId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return db
    .select()
    .from(tasks)
    .where(eq(tasks.leadId, leadId))
    .orderBy(desc(tasks.dueDate));
}

export async function getUserTasks(userId: number, status?: "pending" | "completed" | "cancelled") {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const conditions = [eq(tasks.userId, userId)];

  if (status) {
    conditions.push(eq(tasks.status, status));
  }

  return db
    .select()
    .from(tasks)
    .where(and(...conditions))
    .orderBy(asc(tasks.dueDate));
}

export async function updateTask(id: number, data: Partial<Task>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return db.update(tasks).set({ ...data, updatedAt: new Date() }).where(eq(tasks.id, id));
}

// ============ CONVERSION METRICS ============

export async function recordConversion(data: {
  userId: number;
  fromStageId: number;
  toStageId: number;
  leadId: number;
  daysInStage?: number;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return db.insert(conversionMetrics).values(data);
}

export async function getConversionMetrics(userId: number, fromDate?: Date, toDate?: Date) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const conditions = [eq(conversionMetrics.userId, userId)];

  if (fromDate) {
    conditions.push(gte(conversionMetrics.conversionDate, fromDate));
  }
  if (toDate) {
    conditions.push(lte(conversionMetrics.conversionDate, toDate));
  }

  return db
    .select()
    .from(conversionMetrics)
    .where(and(...conditions))
    .orderBy(desc(conversionMetrics.conversionDate));
}


// ============ NOTIFICATIONS ============

export async function createNotification(data: InsertNotification) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return db.insert(notifications).values(data);
}

export async function getNotificationsByUser(userId: number, unreadOnly = false) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const conditions = [eq(notifications.userId, userId)];
  if (unreadOnly) {
    conditions.push(eq(notifications.isRead, false));
  }

  return db
    .select()
    .from(notifications)
    .where(and(...conditions))
    .orderBy(desc(notifications.createdAt))
    .limit(50);
}

export async function markNotificationAsRead(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return db
    .update(notifications)
    .set({ isRead: true, readAt: new Date() })
    .where(eq(notifications.id, id));
}

export async function markAllNotificationsAsRead(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return db
    .update(notifications)
    .set({ isRead: true, readAt: new Date() })
    .where(and(eq(notifications.userId, userId), eq(notifications.isRead, false)));
}

export async function getUnreadNotificationCount(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db
    .select({ count: notifications.id })
    .from(notifications)
    .where(and(eq(notifications.userId, userId), eq(notifications.isRead, false)));

  return result.length > 0 ? result.length : 0;
}


// ============ BROKERS (CORRETORES) ============

export async function createBroker(userId: number, data: InsertBroker) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(brokers).values({
    ...data,
    userId,
  });

  return result;
}

export async function getBrokersByUser(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return await db
    .select()
    .from(brokers)
    .where(eq(brokers.userId, userId))
    .orderBy(desc(brokers.createdAt));
}

export async function getBrokerById(id: number, userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db
    .select()
    .from(brokers)
    .where(and(eq(brokers.id, id), eq(brokers.userId, userId)))
    .limit(1);

  return result.length > 0 ? result[0] : null;
}

export async function updateBroker(id: number, userId: number, data: Partial<InsertBroker>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return await db
    .update(brokers)
    .set(data)
    .where(and(eq(brokers.id, id), eq(brokers.userId, userId)));
}

export async function deleteBroker(id: number, userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db
    .delete(brokers)
    .where(and(eq(brokers.id, id), eq(brokers.userId, userId)));

  return { success: true };
}

export async function getBrokerStats(brokerId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Total de leads atribuídos ao corretor
  const totalLeads = await db
    .select({ count: leads.id })
    .from(leads)
    .where(eq(leads.assignedTo, brokerId));

  // Leads por etapa do funil
  const leadsByStage = await db
    .select({
      stageId: funnelStages.id,
      stageName: funnelStages.name,
      count: leads.id,
    })
    .from(leads)
    .innerJoin(funnelStages, eq(leads.funnelStageId, funnelStages.id))
    .where(eq(leads.assignedTo, brokerId));

  return {
    totalLeads: totalLeads.length > 0 ? totalLeads[0].count : 0,
    leadsByStage,
  };
}
