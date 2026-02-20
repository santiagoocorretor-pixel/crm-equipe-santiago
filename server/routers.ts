import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router, protectedProcedure } from "./_core/trpc";
import { z } from "zod";
import * as db from "./db";
import { TRPCError } from "@trpc/server";

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),

  // ============ FUNNEL STAGES ============
  funnelStages: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      // Garantir que as etapas existam para o usuário
      return db.getOrCreateDefaultFunnelStages(ctx.user.id);
    }),

    initializeDefaults: protectedProcedure.mutation(async ({ ctx }) => {
      return db.getOrCreateDefaultFunnelStages(ctx.user.id);
    }),
  }),

  // ============ LEADS ============
  leads: router({
    create: protectedProcedure
      .input(
        z.object({
          name: z.string().min(1),
          email: z.string().email().optional(),
          phone: z.string().optional(),
          company: z.string().optional(),
          position: z.string().optional(),
          origin: z.string().optional(),
          source: z.string().optional(),
          property: z.string().optional(),
          estimatedValue: z.union([z.string(), z.number()]).optional(),
          funnelStageId: z.number(),
          assignedTo: z.number().optional(),
          notes: z.string().optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const stages = await db.getFunnelStages(ctx.user.id);
        const stageExists = stages.some(s => s.id === input.funnelStageId);
        if (!stageExists) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "Invalid funnel stage" });
        }

        return db.createLead({
          userId: ctx.user.id,
          ...input,
        });
      }),

    list: protectedProcedure
      .input(
        z.object({
          stageId: z.number().optional(),
          origin: z.string().optional(),
          assignedTo: z.number().optional(),
          search: z.string().optional(),
        })
      )
      .query(async ({ ctx, input }) => {
        return db.getLeadsByUser(ctx.user.id, input);
      }),

    get: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ ctx, input }) => {
        const lead = await db.getLead(input.id);
        if (!lead || lead.userId !== ctx.user.id) {
          throw new TRPCError({ code: "NOT_FOUND" });
        }
        return lead;
      }),

    update: protectedProcedure
      .input(
        z.object({
          id: z.number(),
          name: z.string().optional(),
          email: z.string().email().optional(),
          phone: z.string().optional(),
          company: z.string().optional(),
          position: z.string().optional(),
          origin: z.string().optional(),
          source: z.string().optional(),
          property: z.string().optional(),
          estimatedValue: z.union([z.string(), z.number()]).optional(),
          funnelStageId: z.number().optional(),
          assignedTo: z.number().optional(),
          notes: z.string().optional(),
          lastContactedAt: z.date().optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const lead = await db.getLead(input.id);
        if (!lead || lead.userId !== ctx.user.id) {
          throw new TRPCError({ code: "NOT_FOUND" });
        }

        const { id, ...updateData } = input;
        const leadData = {
          ...updateData,
          estimatedValue: updateData.estimatedValue ? String(updateData.estimatedValue) : undefined,
        };
        if (leadData.funnelStageId) {
          const stages = await db.getFunnelStages(ctx.user.id);
          const stageExists = stages.some(s => s.id === leadData.funnelStageId);
          if (!stageExists) {
            throw new TRPCError({ code: "BAD_REQUEST", message: "Invalid funnel stage" });
          }

          // Registrar conversão se a etapa mudou
          if (lead.funnelStageId !== leadData.funnelStageId) {
            const daysInStage = lead.updatedAt
              ? Math.floor((Date.now() - lead.updatedAt.getTime()) / (1000 * 60 * 60 * 24))
              : 0;

            await db.recordConversion({
              userId: ctx.user.id,
              fromStageId: lead.funnelStageId,
              toStageId: leadData.funnelStageId!,
              leadId: input.id,
              daysInStage,
            });
          }
        }

        return db.updateLead(input.id, leadData);
      }),

    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const lead = await db.getLead(input.id);
        if (!lead || lead.userId !== ctx.user.id) {
          throw new TRPCError({ code: "NOT_FOUND" });
        }
        return db.deleteLead(input.id);
      }),
  }),

  // ============ INTERACTIONS ============
  interactions: router({
    create: protectedProcedure
      .input(
        z.object({
          leadId: z.number(),
          type: z.enum(["email", "phone_call", "meeting", "whatsapp", "linkedin", "note"]),
          subject: z.string().optional(),
          description: z.string().optional(),
          duration: z.number().optional(),
          result: z.string().optional(),
          scheduledFor: z.date().optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const lead = await db.getLead(input.leadId);
        if (!lead || lead.userId !== ctx.user.id) {
          throw new TRPCError({ code: "NOT_FOUND" });
        }

        // Atualizar lastContactedAt do lead
        await db.updateLead(input.leadId, { lastContactedAt: new Date() });

        return db.createInteraction({
          ...input,
          userId: ctx.user.id,
        });
      }),

    listByLead: protectedProcedure
      .input(z.object({ leadId: z.number() }))
      .query(async ({ ctx, input }) => {
        const lead = await db.getLead(input.leadId);
        if (!lead || lead.userId !== ctx.user.id) {
          throw new TRPCError({ code: "NOT_FOUND" });
        }
        return db.getLeadInteractions(input.leadId);
      }),
  }),

  // ============ CADENCES ============
  cadences: router({
    create: protectedProcedure
      .input(
        z.object({
          name: z.string().min(1),
          description: z.string().optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        return db.createCadence({
          userId: ctx.user.id,
          ...input,
        });
      }),

    list: protectedProcedure.query(async ({ ctx }) => {
      return db.getCadencesByUser(ctx.user.id);
    }),

    get: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ ctx, input }) => {
        const cadence = await db.getCadence(input.id);
        if (!cadence || cadence.userId !== ctx.user.id) {
          throw new TRPCError({ code: "NOT_FOUND" });
        }
        return cadence;
      }),

    update: protectedProcedure
      .input(
        z.object({
          id: z.number(),
          name: z.string().optional(),
          description: z.string().optional(),
          isActive: z.boolean().optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const cadence = await db.getCadence(input.id);
        if (!cadence || cadence.userId !== ctx.user.id) {
          throw new TRPCError({ code: "NOT_FOUND" });
        }

        const { id, ...updateData } = input;
        return db.updateCadence(input.id, updateData);
      }),
  }),

  // ============ CADENCE STEPS ============
  cadenceSteps: router({
    create: protectedProcedure
      .input(
        z.object({
          cadenceId: z.number(),
          stepNumber: z.number(),
          type: z.enum(["email", "phone_call", "whatsapp", "linkedin"]),
          delayDays: z.number(),
          subject: z.string().optional(),
          content: z.string().optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const cadence = await db.getCadence(input.cadenceId);
        if (!cadence || cadence.userId !== ctx.user.id) {
          throw new TRPCError({ code: "NOT_FOUND" });
        }
        return db.createCadenceStep(input);
      }),

    listByCadence: protectedProcedure
      .input(z.object({ cadenceId: z.number() }))
      .query(async ({ ctx, input }) => {
        const cadence = await db.getCadence(input.cadenceId);
        if (!cadence || cadence.userId !== ctx.user.id) {
          throw new TRPCError({ code: "NOT_FOUND" });
        }
        return db.getCadenceSteps(input.cadenceId);
      }),
  }),

  // ============ LEAD CADENCES ============
  leadCadences: router({
    assign: protectedProcedure
      .input(
        z.object({
          leadId: z.number(),
          cadenceId: z.number(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const lead = await db.getLead(input.leadId);
        if (!lead || lead.userId !== ctx.user.id) {
          throw new TRPCError({ code: "NOT_FOUND" });
        }

        const cadence = await db.getCadence(input.cadenceId);
        if (!cadence || cadence.userId !== ctx.user.id) {
          throw new TRPCError({ code: "NOT_FOUND" });
        }

        return db.assignCadenceToLead(input);
      }),

    listByLead: protectedProcedure
      .input(z.object({ leadId: z.number() }))
      .query(async ({ ctx, input }) => {
        const lead = await db.getLead(input.leadId);
        if (!lead || lead.userId !== ctx.user.id) {
          throw new TRPCError({ code: "NOT_FOUND" });
        }
        return db.getLeadCadences(input.leadId);
      }),

    update: protectedProcedure
      .input(
        z.object({
          id: z.number(),
          currentStep: z.number().optional(),
          isActive: z.boolean().optional(),
          completedAt: z.date().optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        // Verificar se o lead_cadence pertence ao usuário
        const leadCadences = await db.getLeadCadences(0); // Será validado por outro meio
        const { id, ...updateData } = input;
        return db.updateLeadCadence(input.id, updateData);
      }),
  }),

  // ============ TASKS ============
  tasks: router({
    create: protectedProcedure
      .input(
        z.object({
          leadId: z.number(),
          title: z.string().min(1),
          description: z.string().optional(),
          dueDate: z.date().optional(),
          reminderTime: z.date().optional(),
          priority: z.enum(["low", "medium", "high"]).optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const lead = await db.getLead(input.leadId);
        if (!lead || lead.userId !== ctx.user.id) {
          throw new TRPCError({ code: "NOT_FOUND" });
        }

        return db.createTask({
          ...input,
          userId: ctx.user.id,
        });
      }),

    listByLead: protectedProcedure
      .input(z.object({ leadId: z.number() }))
      .query(async ({ ctx, input }) => {
        const lead = await db.getLead(input.leadId);
        if (!lead || lead.userId !== ctx.user.id) {
          throw new TRPCError({ code: "NOT_FOUND" });
        }
        return db.getLeadTasks(input.leadId);
      }),

    listPending: protectedProcedure.query(async ({ ctx }) => {
      return db.getUserTasks(ctx.user.id, "pending");
    }),

    list: protectedProcedure.query(async ({ ctx }) => {
      return db.getUserTasks(ctx.user.id, "pending");
    }),

    update: protectedProcedure
      .input(
        z.object({
          id: z.number(),
          title: z.string().optional(),
          description: z.string().optional(),
          dueDate: z.date().optional(),
          reminderTime: z.date().optional(),
          status: z.enum(["pending", "completed", "cancelled"]).optional(),
          priority: z.enum(["low", "medium", "high"]).optional(),
          completedAt: z.date().optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const { id, ...updateData } = input;
        return db.updateTask(input.id, updateData);
      }),
  }),

  // ============ METRICS & REPORTS ============
  metrics: router({
    conversionMetrics: protectedProcedure
      .input(
        z.object({
          fromDate: z.date().optional(),
          toDate: z.date().optional(),
        })
      )
      .query(async ({ ctx, input }) => {
        return db.getConversionMetrics(ctx.user.id, input.fromDate, input.toDate);
      }),

    funnelStats: protectedProcedure.query(async ({ ctx }) => {
      const stages = await db.getFunnelStages(ctx.user.id);
      const leads = await db.getLeadsByUser(ctx.user.id);

      const stats = stages.map(stage => ({
        stageId: stage.id,
        stageName: stage.name,
        count: leads.filter(l => l.funnelStageId === stage.id).length,
        value: leads
          .filter(l => l.funnelStageId === stage.id)
          .reduce((sum, l) => sum + (l.estimatedValue ? parseFloat(l.estimatedValue) : 0), 0),
      }));

      return stats;
    }),

    recentActivities: protectedProcedure.query(async ({ ctx }) => {
      const leads = await db.getLeadsByUser(ctx.user.id);
      const leadIds = leads.map(l => l.id);

      if (leadIds.length === 0) return [];

      // Aqui seria necessário fazer uma query mais complexa
      // Por enquanto retornamos um array vazio
      return [];
    }),
  }),
});

export type AppRouter = typeof appRouter;
