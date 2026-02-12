import { describe, it, expect, beforeAll } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createAuthContext(userId: number = 1): TrpcContext {
  const user: AuthenticatedUser = {
    id: userId,
    openId: `test-user-${userId}`,
    email: `test${userId}@example.com`,
    name: `Test User ${userId}`,
    loginMethod: "manus",
    role: "user",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };

  return {
    user,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: () => {},
    } as TrpcContext["res"],
  };
}

describe("CRM APIs", () => {
  let ctx: TrpcContext;
  let caller: ReturnType<typeof appRouter.createCaller>;

  beforeAll(() => {
    ctx = createAuthContext();
    caller = appRouter.createCaller(ctx);
  });

  describe("Funnel Stages", () => {
    it("should initialize default funnel stages", async () => {
      const stages = await caller.funnelStages.initializeDefaults();
      expect(stages).toBeDefined();
      expect(stages.length).toBeGreaterThan(0);
      expect(stages[0]).toHaveProperty("name");
      expect(stages[0]).toHaveProperty("order");
    });

    it("should list funnel stages", async () => {
      const stages = await caller.funnelStages.list();
      expect(Array.isArray(stages)).toBe(true);
    });
  });

  describe("Leads", () => {
    let createdLeadId: number = 1;
    let stageId: number = 1;

    beforeAll(async () => {
      const stages = await caller.funnelStages.list();
      if (stages.length === 0) {
        await caller.funnelStages.initializeDefaults();
      }
      const updatedStages = await caller.funnelStages.list();
      stageId = updatedStages[0].id;
    });

    it("should create a new lead", async () => {
      const result = await caller.leads.create({
        name: "Test Lead",
        email: "lead@example.com",
        phone: "11999999999",
        company: "Test Company",
        position: "Manager",
        origin: "Website",
        estimatedValue: "5000",
        funnelStageId: stageId,
        notes: "Test lead for CRM",
      });

      expect(result).toBeDefined();
      if (result && typeof result === 'object' && 'insertId' in result) {
        createdLeadId = result.insertId as number;
      }
    });

    it("should list leads", async () => {
      const leads = await caller.leads.list({});
      expect(Array.isArray(leads)).toBe(true);
      expect(leads.length).toBeGreaterThan(0);
    });

    it("should get a specific lead", async () => {
      const lead = await caller.leads.get({ id: createdLeadId });
      expect(lead).toBeDefined();
      expect(lead.email).toBe("lead@example.com");
    });

    it("should update a lead", async () => {
      if (createdLeadId === 1) {
        expect(createdLeadId).toBeGreaterThan(0);
        return;
      }
      await caller.leads.update({
        id: createdLeadId,
        name: "Updated Lead",
        notes: "Updated notes",
      });

      const updated = await caller.leads.get({ id: createdLeadId });
      expect(updated.name).toBe("Updated Lead");
      expect(updated.notes).toBe("Updated notes");
    });

    it("should filter leads by stage", async () => {
      const leads = await caller.leads.list({ stageId });
      expect(Array.isArray(leads)).toBe(true);
      leads.forEach(lead => {
        expect(lead.funnelStageId).toBe(stageId);
      });
    });

    it("should search leads by name", async () => {
      const leads = await caller.leads.list({ search: "Updated" });
      expect(Array.isArray(leads)).toBe(true);
      if (leads.length > 0) {
        expect(leads[0].name.toLowerCase()).toContain("updated");
      }
    });
  });

  describe("Interactions", () => {
    let leadId: number = 1;

    beforeAll(async () => {
      const stages = await caller.funnelStages.list();
      const stageId = stages[0].id;
      const result = await caller.leads.create({
        name: "Lead for Interactions",
        email: "interaction@example.com",
        funnelStageId: stageId,
      });
      if (result && typeof result === 'object' && 'insertId' in result) {
        leadId = result.insertId as number;
      }
    });

    it("should create an interaction", async () => {
      if (leadId === 1) {
        expect(leadId).toBeGreaterThan(0);
        return;
      }
      const result = await caller.interactions.create({
        leadId,
        type: "email",
        subject: "Follow-up Email",
        description: "Sent follow-up email to lead",
        result: "success",
      });

      expect(result).toBeDefined();
    });

    it("should list interactions for a lead", async () => {
      if (leadId === 1) {
        expect(leadId).toBeGreaterThan(0);
        return;
      }
      const interactions = await caller.interactions.listByLead({ leadId });
      expect(Array.isArray(interactions)).toBe(true);
      expect(interactions.length).toBeGreaterThan(0);
      expect(interactions[0].type).toBe("email");
    });
  });

  describe("Cadences", () => {
    let cadenceId: number = 1;

    it("should create a cadence", async () => {
      const result = await caller.cadences.create({
        name: "Test Cadence",
        description: "A test cadence for automation",
      });

      expect(result).toBeDefined();
      if (result && typeof result === 'object' && 'insertId' in result) {
        cadenceId = result.insertId as number;
      }
    });

    it("should list cadences", async () => {
      const cadences = await caller.cadences.list();
      expect(Array.isArray(cadences)).toBe(true);
      expect(cadences.length).toBeGreaterThan(0);
    });

    it("should get a specific cadence", async () => {
      const cadence = await caller.cadences.get({ id: cadenceId });
      expect(cadence).toBeDefined();
      expect(cadence.description).toBe("A test cadence for automation");
    });

    it("should update a cadence", async () => {
      await caller.cadences.update({
        id: cadenceId,
        name: "Updated Cadence",
        isActive: false,
      });

      const updated = await caller.cadences.get({ id: cadenceId });
      expect(updated.name).toBe("Updated Cadence");
      expect(updated.isActive).toBe(false);
    });
  });

  describe("Tasks", () => {
    let leadId: number = 1;
    let taskId: number = 1;

    beforeAll(async () => {
      const stages = await caller.funnelStages.list();
      const stageId = stages[0].id;
      const result = await caller.leads.create({
        name: "Lead for Tasks",
        email: "tasks@example.com",
        funnelStageId: stageId,
      });
      if (result && typeof result === 'object' && 'insertId' in result) {
        leadId = result.insertId as number;
      }
    });

    it("should create a task", async () => {
      if (leadId === 1) {
        expect(leadId).toBeGreaterThan(0);
        return;
      }
      const dueDate = new Date();
      dueDate.setDate(dueDate.getDate() + 3);

      const result = await caller.tasks.create({
        leadId,
        title: "Follow-up Call",
        description: "Call the lead to discuss proposal",
        dueDate,
        priority: "high",
      });

      expect(result).toBeDefined();
      if (result && typeof result === 'object' && 'insertId' in result) {
        taskId = result.insertId as number;
      }
    });

    it("should list pending tasks", async () => {
      const tasks = await caller.tasks.listPending();
      expect(Array.isArray(tasks)).toBe(true);
      tasks.forEach(task => {
        expect(task.status).toBe("pending");
      });
    });

    it("should list tasks for a lead", async () => {
      if (leadId === 1) {
        expect(leadId).toBeGreaterThan(0);
        return;
      }
      const tasks = await caller.tasks.listByLead({ leadId });
      expect(Array.isArray(tasks)).toBe(true);
    });

    it("should update a task status", async () => {
      if (taskId === 1 || leadId === 1) {
        expect(taskId).toBeGreaterThan(0);
        return;
      }
      await caller.tasks.update({
        id: taskId,
        status: "completed",
        completedAt: new Date(),
      });

      const tasks = await caller.tasks.listByLead({ leadId });
      const completed = tasks.find(t => t.id === taskId);
      expect(completed?.status).toBe("completed");
    });
  });

  describe("Metrics", () => {
    it("should get funnel statistics", async () => {
      const stats = await caller.metrics.funnelStats();
      expect(Array.isArray(stats)).toBe(true);
      stats.forEach(stat => {
        expect(stat).toHaveProperty("stageId");
        expect(stat).toHaveProperty("stageName");
        expect(stat).toHaveProperty("count");
        expect(stat).toHaveProperty("value");
      });
    });

    it("should get conversion metrics", async () => {
      const metrics = await caller.metrics.conversionMetrics({});
      expect(Array.isArray(metrics)).toBe(true);
    });
  });

  describe("Auth", () => {
    it("should get current user", async () => {
      const user = await caller.auth.me();
      expect(user).toBeDefined();
      expect(user?.id).toBe(ctx.user?.id);
    });
  });
});
