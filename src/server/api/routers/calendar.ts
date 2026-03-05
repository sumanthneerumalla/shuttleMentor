import { EventType, PrismaClient, RegistrationStatus, type User } from "@prisma/client";
import { RRule } from "rrule";
import { z } from "zod";
import {
	createTRPCRouter,
	facilityProcedure,
	protectedProcedure,
	publicProcedure,
} from "~/server/api/trpc";
import { TRPCError } from "@trpc/server";
import { getCurrentUser, isAdmin, isSameClub } from "~/server/utils/utils";
import { validateDateRange } from "~/server/utils/dateUtils";

// ============================================================
// SHARED HELPERS
// ============================================================

/**
 * Helper to verify the current user belongs to the specified club
 * Used by read procedures to scope data to the user's club
 */
function requireSameClub(user: User, clubShortName: string): void {
	if (!isSameClub(user, { clubShortName }) && !isAdmin(user)) {
		throw new TRPCError({
			code: "FORBIDDEN",
			message: "You can only access your own club's calendar",
		});
	}
}

/**
 * Checks for blocking event conflicts on a resource for a given time range.
 * Returns the conflicting events (non-recurring only — recurring conflicts are
 * handled client-side via rrule expansion; server-side recurring expansion is
 * reserved for the dedicated checkConflicts query procedure).
 */
async function checkResourceConflicts({
	db,
	resourceId,
	start,
	end,
	excludeEventId,
}: {
	db: PrismaClient;
	resourceId: string;
	start: Date;
	end: Date;
	excludeEventId?: string;
}): Promise<Array<{ eventId: string; title: string; start: Date; end: Date }>> {
	return db.calendarEvent.findMany({
		where: {
			resourceId,
			isDeleted: false,
			isBlocking: true,
			rrule: null,
			eventId: excludeEventId ? { not: excludeEventId } : undefined,
			start: { lt: end },
			end: { gt: start },
		},
		select: {
			eventId: true,
			title: true,
			start: true,
			end: true,
		},
	});
}

/**
 * Default colors from globals.css design tokens.
 * Used when resource/event has no color set.
 */
const DEFAULT_COLOR = "#4F46E5"; // --primary: rgb(79 70 229)
const DEFAULT_BG_COLOR = "#EFF6FF"; // --accent: rgb(239 246 255)

// ============================================================
// INPUT SCHEMAS
// ============================================================

const dayOfWeekEnum = z.enum([
	"monday",
	"tuesday",
	"wednesday",
	"thursday",
	"friday",
	"saturday",
	"sunday",
]);

const businessHoursSchema = z.object({
	daysOfWeek: z.array(dayOfWeekEnum).min(1),
	startTime: z.number().int().min(0).max(23),
	endTime: z.number().int().min(0).max(23),
});

const hexColorRegex = /^#[0-9a-fA-F]{6}$/;

// ============================================================
// RESOURCE TYPE PROCEDURES
// ============================================================

const createResourceTypeSchema = z.object({
	name: z.string().min(1).max(100).trim(),
	color: z.string().regex(hexColorRegex).optional(),
	backgroundColor: z.string().regex(hexColorRegex).optional(),
});

const getResourceTypesSchema = z.object({});

const updateResourceTypeSchema = z.object({
	resourceTypeId: z.string(),
	name: z.string().min(1).max(100).trim().optional(),
	color: z.string().regex(hexColorRegex).nullable().optional(),
	backgroundColor: z.string().regex(hexColorRegex).nullable().optional(),
});

const deleteResourceTypeSchema = z.object({
	resourceTypeId: z.string(),
});

// ============================================================
// RESOURCE PROCEDURES
// ============================================================

const createResourceSchema = z.object({
	resourceTypeId: z.string(),
	title: z.string().min(1).max(200).trim(),
	description: z.string().max(1000).trim().optional(),
	color: z.string().regex(hexColorRegex).optional(),
	backgroundColor: z.string().regex(hexColorRegex).optional(),
	position: z.number().int().min(0).optional(),
	businessHours: z.array(businessHoursSchema).optional(),
});

const getResourcesSchema = z.object({});

const updateResourceSchema = z.object({
	resourceId: z.string(),
	title: z.string().min(1).max(200).trim().optional(),
	description: z.string().max(1000).trim().nullable().optional(),
	resourceTypeId: z.string().optional(),
	color: z.string().regex(hexColorRegex).nullable().optional(),
	backgroundColor: z.string().regex(hexColorRegex).nullable().optional(),
	position: z.number().int().min(0).optional(),
	isActive: z.boolean().optional(),
});

const updateResourceBusinessHoursSchema = z
	.object({
		resourceId: z.string(),
		businessHours: z.array(businessHoursSchema),
	})
	.refine(
		(data) =>
			data.businessHours.every((bh) => bh.startTime < bh.endTime),
		{ message: "startTime must be less than endTime" },
	);

const deleteResourceSchema = z.object({
	resourceId: z.string(),
});

// ============================================================
// EVENT PROCEDURES
// ============================================================

const createEventSchema = z.object({
	resourceId: z.string().optional(),
	resourceIds: z.array(z.string()).optional(),
	title: z.string().min(1).max(500).trim(),
	description: z.string().max(2000).trim().optional(),
	start: z.date(),
	end: z.date(),
	allDay: z.boolean().optional(),
	color: z.string().regex(hexColorRegex).optional(),
	backgroundColor: z.string().regex(hexColorRegex).optional(),
	rrule: z.string().max(500).optional(),
	eventType: z.enum(["BLOCK", "BOOKABLE", "COACHING_SLOT"]).default("BLOCK"),
	isPublic: z.boolean().default(false),
	maxParticipants: z.number().int().positive().optional(),
	registrationType: z.enum(["PER_INSTANCE", "PER_SERIES"]).optional(),
	productId: z.string().optional(),
});

const getEventsSchema = z.object({
	startDate: z.date(),
	endDate: z.date(),
});

const updateEventSchema = z.object({
	eventId: z.string(),
	title: z.string().min(1).max(500).trim().optional(),
	description: z.string().max(2000).trim().nullable().optional(),
	resourceId: z.string().nullable().optional(),
	start: z.date().optional(),
	end: z.date().optional(),
	allDay: z.boolean().optional(),
	color: z.string().regex(hexColorRegex).nullable().optional(),
	backgroundColor: z.string().regex(hexColorRegex).nullable().optional(),
	rrule: z.string().max(500).nullable().optional(),
	exdates: z.array(z.date()).optional(),
	productId: z.string().nullable().optional(),
});

const getEventByIdSchema = z.object({
	eventId: z.string(),
});

const updateEventDetailsSchema = z.object({
	eventId: z.string(),
	description: z.string().max(2000).trim().nullable().optional(),
	isPublic: z.boolean().optional(),
	maxParticipants: z.number().int().positive().nullable().optional(),
	registrationType: z.enum(["PER_INSTANCE", "PER_SERIES"]).nullable().optional(),
});

const deleteEventSchema = z.object({
	eventId: z.string(),
});

const checkConflictsSchema = z.object({
	resourceId: z.string(),
	start: z.date(),
	end: z.date(),
	excludeEventId: z.string().optional(),
});

// ============================================================
// PUBLIC PROCEDURES (Phase 2.5+)
// ============================================================

const getPublicEventsSchema = z.object({
	clubShortName: z.string(),
	startDate: z.date(),
	endDate: z.date(),
});

const getPublicResourcesSchema = z.object({
	clubShortName: z.string(),
});

// ============================================================
// ROUTER
// ============================================================

export const calendarRouter = createTRPCRouter({
	// ============ RESOURCE TYPES ============

	createResourceType: facilityProcedure
		.input(createResourceTypeSchema)
		.mutation(async ({ ctx, input }) => {
			try {
				const resourceType = await ctx.db.clubResourceType.create({
					data: {
						clubShortName: ctx.user.clubShortName,
						name: input.name,
						color: input.color,
						backgroundColor: input.backgroundColor,
					},
				});
				return resourceType;
			} catch (error) {
				// Handle unique constraint violation (duplicate name)
				if (error instanceof Error && error.message.includes("unique")) {
					throw new TRPCError({
						code: "CONFLICT",
						message: "A resource type with this name already exists",
					});
				}
				throw error;
			}
		}),

	getResourceTypes: protectedProcedure
		.input(getResourceTypesSchema)
		.query(async ({ ctx }) => {
			const user = await getCurrentUser(ctx);
			const resourceTypes = await ctx.db.clubResourceType.findMany({
				where: {
					clubShortName: user.clubShortName,
				},
				include: {
					_count: {
						select: { resources: true },
					},
				},
				orderBy: {
					name: "asc",
				},
			});

			return {
				resourceTypes: resourceTypes.map((rt) => ({
					resourceTypeId: rt.resourceTypeId,
					name: rt.name,
					color: rt.color,
					backgroundColor: rt.backgroundColor,
					_count: { resources: rt._count.resources },
				})),
			};
		}),

	updateResourceType: facilityProcedure
		.input(updateResourceTypeSchema)
		.mutation(async ({ ctx, input }) => {
			const { resourceTypeId, ...data } = input;

			// Verify ownership
			const existing = await ctx.db.clubResourceType.findUnique({
				where: { resourceTypeId },
			});

			if (!existing) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Resource type not found",
				});
			}

			requireSameClub(ctx.user, existing.clubShortName);

			try {
				const updated = await ctx.db.clubResourceType.update({
					where: { resourceTypeId },
					data,
				});
				return updated;
			} catch (error) {
				// Handle unique constraint on name change
				if (error instanceof Error && error.message.includes("unique")) {
					throw new TRPCError({
						code: "CONFLICT",
						message: "A resource type with this name already exists",
					});
				}
				throw error;
			}
		}),

	deleteResourceType: facilityProcedure
		.input(deleteResourceTypeSchema)
		.mutation(async ({ ctx, input }) => {
			const { resourceTypeId } = input;

			// Verify ownership
			const existing = await ctx.db.clubResourceType.findUnique({
				where: { resourceTypeId },
				include: {
					_count: { select: { resources: true } },
				},
			});

			if (!existing) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Resource type not found",
				});
			}

			requireSameClub(ctx.user, existing.clubShortName);

			// Check for active resources
			if (existing._count.resources > 0) {
				throw new TRPCError({
					code: "BAD_REQUEST",
					message: "Cannot delete resource type that has active resources",
				});
			}

			await ctx.db.clubResourceType.delete({
				where: { resourceTypeId },
			});

			return { success: true };
		}),

	// ============ RESOURCES ============

	createResource: facilityProcedure
		.input(createResourceSchema)
		.mutation(async ({ ctx, input }) => {
			const { businessHours, resourceTypeId, ...resourceData } = input;

			// Verify resourceType belongs to user's club
			const resourceType = await ctx.db.clubResourceType.findUnique({
				where: { resourceTypeId },
			});

			if (!resourceType) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Resource type not found",
				});
			}

			requireSameClub(ctx.user, resourceType.clubShortName);

			// Auto-assign position if not provided
			let position = input.position;
			if (position === undefined) {
				const maxPosition = await ctx.db.clubResource.aggregate({
					where: { clubShortName: ctx.user.clubShortName },
					_max: { position: true },
				});
				position = (maxPosition._max.position ?? -1) + 1;
			}

			// Create resource with business hours in a transaction
			const resource = await ctx.db.$transaction(async (tx) => {
				const newResource = await tx.clubResource.create({
					data: {
						...resourceData,
						position,
						clubShortName: ctx.user.clubShortName,
						resourceTypeId,
					},
				});

				if (businessHours && businessHours.length > 0) {
					await tx.resourceBusinessHours.createMany({
						data: businessHours.map((bh) => ({
							resourceId: newResource.resourceId,
							daysOfWeek: bh.daysOfWeek,
							startTime: bh.startTime,
							endTime: bh.endTime,
						})),
					});
				}

				return tx.clubResource.findUnique({
					where: { resourceId: newResource.resourceId },
					include: { businessHours: true },
				});
			});

			return resource;
		}),

	getResources: protectedProcedure
		.input(getResourcesSchema)
		.query(async ({ ctx }) => {
			const user = await getCurrentUser(ctx);
			const resources = await ctx.db.clubResource.findMany({
				where: {
					clubShortName: user.clubShortName,
					isActive: true,
				},
				include: {
					resourceType: {
						select: {
							resourceTypeId: true,
							name: true,
						},
					},
					businessHours: true,
				},
				orderBy: {
					position: "asc",
				},
			});

			return {
				resources: resources.map((r) => ({
					resourceId: r.resourceId,
					title: r.title,
					description: r.description,
					color: r.color,
					backgroundColor: r.backgroundColor,
					position: r.position,
					resourceType: r.resourceType,
					businessHours: r.businessHours.map((bh) => ({
						daysOfWeek: bh.daysOfWeek,
						startTime: bh.startTime,
						endTime: bh.endTime,
					})),
				})),
			};
		}),

	updateResource: facilityProcedure
		.input(updateResourceSchema)
		.mutation(async ({ ctx, input }) => {
			const { resourceId, ...data } = input;

			// Verify ownership
			const existing = await ctx.db.clubResource.findUnique({
				where: { resourceId },
			});

			if (!existing) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Resource not found",
				});
			}

			requireSameClub(ctx.user, existing.clubShortName);

			// If resourceTypeId changing, verify new type belongs to same club
			if (data.resourceTypeId) {
				const newType = await ctx.db.clubResourceType.findUnique({
					where: { resourceTypeId: data.resourceTypeId },
				});

				if (!newType || newType.clubShortName !== ctx.user.clubShortName) {
					throw new TRPCError({
						code: "BAD_REQUEST",
						message: "Invalid resource type",
					});
				}
			}

			const updated = await ctx.db.clubResource.update({
				where: { resourceId },
				data,
			});

			return updated;
		}),

	updateResourceBusinessHours: facilityProcedure
		.input(updateResourceBusinessHoursSchema)
		.mutation(async ({ ctx, input }) => {
			const { resourceId, businessHours } = input;

			// Verify ownership
			const existing = await ctx.db.clubResource.findUnique({
				where: { resourceId },
			});

			if (!existing) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Resource not found",
				});
			}

			requireSameClub(ctx.user, existing.clubShortName);

			// Replace-all strategy in transaction
			await ctx.db.$transaction(async (tx) => {
				await tx.resourceBusinessHours.deleteMany({
					where: { resourceId },
				});

				if (businessHours.length > 0) {
					await tx.resourceBusinessHours.createMany({
						data: businessHours.map((bh) => ({
							resourceId,
							daysOfWeek: bh.daysOfWeek,
							startTime: bh.startTime,
							endTime: bh.endTime,
						})),
					});
				}
			});

			return { success: true };
		}),

	deleteResource: facilityProcedure
		.input(deleteResourceSchema)
		.mutation(async ({ ctx, input }) => {
			const { resourceId } = input;

			// Verify ownership
			const existing = await ctx.db.clubResource.findUnique({
				where: { resourceId },
			});

			if (!existing) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Resource not found",
				});
			}

			requireSameClub(ctx.user, existing.clubShortName);

			// Soft deactivate
			await ctx.db.clubResource.update({
				where: { resourceId },
				data: { isActive: false },
			});

			return { success: true };
		}),

	// ============ EVENTS ============

	createEvent: facilityProcedure
		.input(createEventSchema)
		.mutation(async ({ ctx, input }) => {
			const {
				resourceId,
				resourceIds,
				title,
				description,
				start,
				end,
				allDay,
				color,
				backgroundColor,
				rrule,
				eventType,
				isPublic,
				maxParticipants,
				registrationType,
				productId,
			} = input;

			// Validate end > start (unless allDay)
			if (!allDay) {
				try {
					validateDateRange(start, end);
				} catch (error) {
					throw new TRPCError({
						code: "BAD_REQUEST",
						message: "End time must be after start time",
					});
				}
			}

			// Verify resourceId belongs to user's club and is active
			if (resourceId) {
				const resource = await ctx.db.clubResource.findUnique({
					where: { resourceId },
				});

				if (!resource) {
					throw new TRPCError({
						code: "NOT_FOUND",
						message: "Resource not found",
					});
				}

				requireSameClub(ctx.user, resource.clubShortName);

				if (!resource.isActive) {
					throw new TRPCError({
						code: "BAD_REQUEST",
						message: "Resource is not active",
					});
				}
			}

			// Verify all resourceIds belong to user's club and are active
			if (resourceIds && resourceIds.length > 0) {
				const resources = await ctx.db.clubResource.findMany({
					where: {
						resourceId: { in: resourceIds },
					},
				});

				for (const resource of resources) {
					requireSameClub(ctx.user, resource.clubShortName);
					if (!resource.isActive) {
						throw new TRPCError({
							code: "BAD_REQUEST",
							message: `Resource ${resource.title} is not active`,
						});
					}
				}
			}

			// Validate RRULE if provided
			if (rrule) {
				try {
					RRule.fromString(rrule);
				} catch (error) {
					throw new TRPCError({
						code: "BAD_REQUEST",
						message: "Invalid recurrence rule format",
					});
				}
			}

			// Check for conflicts if a resource is assigned
			if (resourceId && !allDay) {
				const conflicts = await checkResourceConflicts({
					db: ctx.db,
					resourceId,
					start,
					end,
				});
				if (conflicts.length > 0) {
					throw new TRPCError({
						code: "CONFLICT",
						message: `Resource is already booked: ${conflicts.map((c) => c.title).join(", ")}`,
					});
				}
			}

			// Pre-generate eventId so uid can be set in a single create call
			const eventId = crypto.randomUUID();
			const uid = `${eventId}@shuttlementor.com`;

			const event = await ctx.db.calendarEvent.create({
				data: {
					eventId,
					clubShortName: ctx.user.clubShortName,
					resourceId,
					resourceIds: resourceIds ?? [],
					title,
					description,
					start,
					end,
					allDay: allDay ?? false,
					color,
					backgroundColor,
					uid,
					rrule,
					eventType,
					isBlocking: true, // Both BLOCK and BOOKABLE are blocking
					isPublic,
					maxParticipants,
					registrationType,
					productId,
					createdByUserId: ctx.user.userId,
				},
			});

			return event;
		}),

	getEvents: protectedProcedure
		.input(getEventsSchema)
		.query(async ({ ctx, input }) => {
			const { startDate, endDate } = input;
			const user = await getCurrentUser(ctx);

			const isStudent = user.userType === "STUDENT";

			const events = await ctx.db.calendarEvent.findMany({
				where: {
					clubShortName: user.clubShortName,
					isDeleted: false,
					...(isStudent && {
						isPublic: true,
						eventType: { in: ["BOOKABLE", "COACHING_SLOT"] },
					}),
					OR: [
						// Non-recurring base events that overlap with view range
						{
							rrule: null,
							parentEventId: null,
							start: { lt: endDate },
							end: { gt: startDate },
						},
						// Recurring base events (client expands via rrule.js)
						{
							rrule: { not: null },
							parentEventId: null,
							start: { lt: endDate },
						},
						// Modified instances whose parent base event overlaps the range
						{
							parentEventId: { not: null },
							start: { lt: endDate },
							end: { gt: startDate },
						},
					],
				},
				include: {
					resource: {
						select: {
							title: true,
							color: true,
						},
					},
					product: {
						select: {
							priceInCents: true,
						},
					},
					createdByUser: {
						select: {
							firstName: true,
						},
					},
					_count: {
						select: {
							registrations: {
								where: { status: RegistrationStatus.CONFIRMED },
							},
						},
					},
				},
			});

			// Filter recurring events: only include if series hasn't expired
			const filteredEvents = events.filter((event) => {
				if (!event.rrule) return true;

				// Parse RRULE to check if series is still active
				try {
					const rule = RRule.fromString(event.rrule);
					const options = rule.origOptions;

					// If no until, or until >= startDate, include it
					if (!options.until) return true;
					return options.until >= startDate;
				} catch {
					return false;
				}
			});

			return {
				events: filteredEvents.map((e) => ({
					eventId: e.eventId,
					resourceId: e.resourceId,
					title: e.title,
					description: e.description,
					start: e.start,
					end: e.end,
					allDay: e.allDay,
					color: e.color,
					backgroundColor: e.backgroundColor,
					uid: e.uid,
					rrule: e.rrule,
					exdates: e.exdates,
					recurrenceId: e.recurrenceId,
					parentEventId: e.parentEventId,
					eventType: e.eventType,
					isBlocking: e.isBlocking,
					isPublic: e.isPublic,
					maxParticipants: e.maxParticipants,
					productId: e.productId,
					product: e.product,
					_count: { registrations: e._count.registrations },
					createdByUserId: e.createdByUserId,
					createdByUser: e.createdByUser,
				})),
			};
		}),

	updateEvent: facilityProcedure
		.input(updateEventSchema)
		.mutation(async ({ ctx, input }) => {
			const { eventId, ...data } = input;

			// Verify ownership and not deleted
			const existing = await ctx.db.calendarEvent.findUnique({
				where: { eventId },
			});

			if (!existing) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Event not found",
				});
			}

			requireSameClub(ctx.user, existing.clubShortName);

			if (existing.isDeleted) {
				throw new TRPCError({
					code: "BAD_REQUEST",
					message: "Cannot update deleted event",
				});
			}

			// If resourceId changing, verify new resource belongs to same club
			if (data.resourceId !== undefined && data.resourceId !== null) {
				const resource = await ctx.db.clubResource.findUnique({
					where: { resourceId: data.resourceId },
				});

				if (!resource) {
					throw new TRPCError({
						code: "NOT_FOUND",
						message: "Resource not found",
					});
				}

				requireSameClub(ctx.user, resource.clubShortName);
			}

			// Validate RRULE if changing
			if (data.rrule !== undefined && data.rrule !== null) {
				try {
					RRule.fromString(data.rrule);
				} catch (error) {
					throw new TRPCError({
						code: "BAD_REQUEST",
						message: "Invalid recurrence rule format",
					});
				}
			}

			// Check for conflicts if resource or time is changing
			const newResourceId = data.resourceId ?? existing.resourceId;
			const newStart = data.start ?? existing.start;
			const newEnd = data.end ?? existing.end;
			const isAllDay = data.allDay ?? existing.allDay;

			if (newResourceId && !isAllDay) {
				const conflicts = await checkResourceConflicts({
					db: ctx.db,
					resourceId: newResourceId,
					start: newStart,
					end: newEnd,
					excludeEventId: eventId,
				});
				if (conflicts.length > 0) {
					throw new TRPCError({
						code: "CONFLICT",
						message: `Resource is already booked: ${conflicts.map((c) => c.title).join(", ")}`,
					});
				}
			}

			const updated = await ctx.db.calendarEvent.update({
				where: { eventId },
				data,
			});

			return updated;
		}),

	deleteEvent: facilityProcedure
		.input(deleteEventSchema)
		.mutation(async ({ ctx, input }) => {
			const { eventId } = input;

			// Verify ownership
			const existing = await ctx.db.calendarEvent.findUnique({
				where: { eventId },
			});

			if (!existing) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Event not found",
				});
			}

			requireSameClub(ctx.user, existing.clubShortName);

			const now = new Date();

			// Soft delete the event
			await ctx.db.calendarEvent.update({
				where: { eventId },
				data: {
					isDeleted: true,
					deletedAt: now,
				},
			});

			// If this is a base recurring event, also soft-delete all modified instances
			if (!existing.parentEventId) {
				await ctx.db.calendarEvent.updateMany({
					where: { parentEventId: eventId },
					data: {
						isDeleted: true,
						deletedAt: now,
					},
				});
			}

			return { success: true };
		}),

	getEventById: protectedProcedure
		.input(getEventByIdSchema)
		.query(async ({ ctx, input }) => {
			const { eventId } = input;
			const user = await getCurrentUser(ctx);

			const event = await ctx.db.calendarEvent.findUnique({
				where: { eventId, isDeleted: false },
				include: {
					resource: { select: { title: true, color: true } },
					product: { select: { productId: true, name: true, priceInCents: true, currency: true } },
					createdByUser: { select: { firstName: true, lastName: true } },
					_count: { select: { registrations: { where: { status: "CONFIRMED" } } } },
				},
			});

			if (!event) {
				throw new TRPCError({ code: "NOT_FOUND", message: "Event not found" });
			}

			requireSameClub(user, event.clubShortName);

			return event;
		}),

	getPublicEventById: publicProcedure
		.input(getEventByIdSchema)
		.query(async ({ ctx, input }) => {
			const { eventId } = input;

			const event = await ctx.db.calendarEvent.findUnique({
				where: { eventId, isDeleted: false },
				include: {
					resource: { select: { title: true, color: true } },
					product: { select: { productId: true, name: true, priceInCents: true, currency: true } },
					createdByUser: { select: { firstName: true, lastName: true } },
					_count: { select: { registrations: { where: { status: "CONFIRMED" } } } },
				},
			});

			if (!event) {
				throw new TRPCError({ code: "NOT_FOUND", message: "Event not found" });
			}

			// Private events are only visible to authenticated members of the same club
			if (!event.isPublic) {
				const clerkUserId = ctx.auth.userId;
				if (!clerkUserId) {
					throw new TRPCError({ code: "UNAUTHORIZED", message: "Sign in to view this event" });
				}
				const viewer = await ctx.db.user.findUnique({ where: { clerkUserId } });
				if (!viewer || viewer.clubShortName !== event.clubShortName) {
					throw new TRPCError({ code: "FORBIDDEN", message: "You do not have access to this event" });
				}
			}

			return event;
		}),

	updateEventDetails: facilityProcedure
		.input(updateEventDetailsSchema)
		.mutation(async ({ ctx, input }) => {
			const { eventId, ...data } = input;

			const existing = await ctx.db.calendarEvent.findUnique({
				where: { eventId, isDeleted: false },
			});

			if (!existing) {
				throw new TRPCError({ code: "NOT_FOUND", message: "Event not found" });
			}

			requireSameClub(ctx.user, existing.clubShortName);

			const updated = await ctx.db.calendarEvent.update({
				where: { eventId },
				data,
			});

			return updated;
		}),

	checkConflicts: protectedProcedure
		.input(checkConflictsSchema)
		.query(async ({ ctx, input }) => {
			const { resourceId, start, end, excludeEventId } = input;
			const user = await getCurrentUser(ctx);

			// Verify resource belongs to user's club
			const resource = await ctx.db.clubResource.findUnique({
				where: { resourceId },
			});

			if (!resource) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Resource not found",
				});
			}

			requireSameClub(user, resource.clubShortName);

			// Find non-recurring, blocking events that overlap
			const nonRecurringConflicts = await ctx.db.calendarEvent.findMany({
				where: {
					resourceId,
					isDeleted: false,
					isBlocking: true,
					rrule: null,
					eventId: excludeEventId ? { not: excludeEventId } : undefined,
					start: { lt: end },
					end: { gt: start },
				},
				select: {
					eventId: true,
					title: true,
					start: true,
					end: true,
				},
			});

			// Find recurring, blocking events and expand them
			const recurringEvents = await ctx.db.calendarEvent.findMany({
				where: {
					resourceId,
					isDeleted: false,
					isBlocking: true,
					rrule: { not: null },
					eventId: excludeEventId ? { not: excludeEventId } : undefined,
				},
			});

			const recurringConflicts: Array<{
				eventId: string;
				title: string;
				start: Date;
				end: Date;
			}> = [];

			for (const event of recurringEvents) {
				if (!event.rrule) continue;

				try {
					const rule = RRule.fromString(event.rrule);
					const duration = event.end.getTime() - event.start.getTime();
					const exdateSet = new Set(
						event.exdates.map((d) => d.toISOString()),
					);

					// Get instances in the conflict range
					const instances = rule.between(start, end, true);

					for (const instanceStart of instances) {
						// Skip exdated instances
						if (exdateSet.has(instanceStart.toISOString())) continue;

						const instanceEnd = new Date(
							instanceStart.getTime() + duration,
						);

						// Check if this instance overlaps with the input range
						if (instanceStart < end && instanceEnd > start) {
							recurringConflicts.push({
								eventId: event.eventId,
								title: event.title,
								start: instanceStart,
								end: instanceEnd,
							});
						}
					}
				} catch {
					// Invalid RRULE, skip
				}
			}

			const allConflicts = [
				...nonRecurringConflicts,
				...recurringConflicts,
			];

			return {
				hasConflicts: allConflicts.length > 0,
				conflicts: allConflicts,
			};
		}),

	// ============ PUBLIC PROCEDURES (Phase 2.5+) ============

	getPublicEvents: publicProcedure
		.input(getPublicEventsSchema)
		.query(async ({ ctx, input }) => {
			const { clubShortName, startDate, endDate } = input;

			const events = await ctx.db.calendarEvent.findMany({
				where: {
					clubShortName,
					isDeleted: false,
					isPublic: true,
					eventType: { in: [EventType.BOOKABLE, EventType.COACHING_SLOT] },
					OR: [
						{
							rrule: null,
							start: { lt: endDate },
							end: { gt: startDate },
						},
						{
							rrule: { not: null },
							start: { lt: endDate },
						},
					],
				},
				include: {
					resource: {
						select: {
							title: true,
							color: true,
						},
					},
					product: {
						select: {
							priceInCents: true,
						},
					},
					createdByUser: {
						select: {
							firstName: true,
						},
					},
					_count: {
						select: {
							registrations: {
								where: { status: RegistrationStatus.CONFIRMED },
							},
						},
					},
				},
			});

			// Filter recurring events
			const filteredEvents = events.filter((event) => {
				if (!event.rrule) return true;
				try {
					const rule = RRule.fromString(event.rrule);
					const options = rule.origOptions;
					if (!options.until) return true;
					return options.until >= startDate;
				} catch {
					return false;
				}
			});

			return {
				events: filteredEvents.map((e) => ({
					eventId: e.eventId,
					resourceId: e.resourceId,
					eventType: e.eventType,
					title: e.title,
					description: e.description,
					start: e.start,
					end: e.end,
					maxParticipants: e.maxParticipants,
					currentRegistrations: e._count.registrations,
					priceInCents: e.product?.priceInCents ?? null,
					productId: e.productId,
					coachName: e.createdByUser?.firstName ?? null,
					rrule: e.rrule,
					uid: e.uid,
				})),
			};
		}),

	getPublicResources: publicProcedure
		.input(getPublicResourcesSchema)
		.query(async ({ ctx, input }) => {
			const { clubShortName } = input;

			const resources = await ctx.db.clubResource.findMany({
				where: {
					clubShortName,
					isActive: true,
				},
				include: {
					businessHours: true,
				},
				orderBy: {
					position: "asc",
				},
			});

			return {
				resources: resources.map((r) => ({
					resourceId: r.resourceId,
					title: r.title,
					description: r.description,
					color: r.color,
					backgroundColor: r.backgroundColor,
					position: r.position,
					businessHours: r.businessHours.map((bh) => ({
						daysOfWeek: bh.daysOfWeek,
						startTime: bh.startTime,
						endTime: bh.endTime,
					})),
				})),
			};
		}),
});