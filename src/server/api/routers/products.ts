import type { ProductCategory } from "@prisma/client";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import {
	createTRPCRouter,
	facilityProcedure,
	protectedProcedure,
} from "~/server/api/trpc";
import { getCurrentUser, isPlatformAdmin } from "~/server/utils/utils";

// ============================================================
// INPUT SCHEMAS
// ============================================================

const createProductSchema = z.object({
	category: z.enum([
		"COACHING_SESSION",
		"CALENDAR_EVENT",
		"COACHING_SLOT",
		"CREDIT_PACK",
	]),
	name: z.string().min(1).max(200).trim(),
	description: z.string().max(2000).trim().optional(),
	priceInCents: z.number().int().min(0),
	currency: z.string().length(3).default("usd"),
});

const getProductsSchema = z.object({
	category: z
		.enum([
			"COACHING_SESSION",
			"CALENDAR_EVENT",
			"COACHING_SLOT",
			"CREDIT_PACK",
		])
		.optional(),
	includeInactive: z.boolean().optional().default(false),
});

const updateProductSchema = z.object({
	productId: z.string(),
	name: z.string().min(1).max(200).trim().optional(),
	description: z.string().max(2000).trim().nullable().optional(),
	priceInCents: z.number().int().min(0).optional(),
	isActive: z.boolean().optional(),
});

const deleteProductSchema = z.object({
	productId: z.string(),
});

// ============================================================
// ROUTER
// ============================================================

export const productsRouter = createTRPCRouter({
	createProduct: facilityProcedure
		.input(createProductSchema)
		.mutation(async ({ ctx, input }) => {
			const product = await ctx.db.product.create({
				data: {
					clubShortName: ctx.user.clubShortName,
					category: input.category as ProductCategory,
					name: input.name,
					description: input.description,
					priceInCents: input.priceInCents,
					currency: input.currency,
					createdByUserId: ctx.user.userId,
				},
			});

			return product;
		}),

	getProducts: protectedProcedure
		.input(getProductsSchema)
		.query(async ({ ctx, input }) => {
			const user = await getCurrentUser(ctx);

			const products = await ctx.db.product.findMany({
				where: {
					clubShortName: user.clubShortName,
					...(input.includeInactive ? {} : { isActive: true }),
					...(input.category && {
						category: input.category as ProductCategory,
					}),
				},
				include: {
					createdByUser: {
						select: {
							firstName: true,
							lastName: true,
						},
					},
					_count: {
						select: {
							calendarEvents: true,
							registrations: true,
						},
					},
				},
				orderBy: {
					createdAt: "desc",
				},
			});

			return {
				products: products.map((p) => ({
					productId: p.productId,
					category: p.category,
					name: p.name,
					description: p.description,
					priceInCents: p.priceInCents,
					currency: p.currency,
					polarProductId: p.polarProductId,
					polarPriceId: p.polarPriceId,
					isActive: p.isActive,
					createdByUser: p.createdByUser,
					_count: p._count,
					createdAt: p.createdAt,
				})),
			};
		}),

	updateProduct: facilityProcedure
		.input(updateProductSchema)
		.mutation(async ({ ctx, input }) => {
			const { productId, ...data } = input;

			const existing = await ctx.db.product.findUnique({
				where: { productId },
			});

			if (!existing) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Product not found",
				});
			}

			if (
				ctx.user.clubShortName !== existing.clubShortName &&
				!isPlatformAdmin(ctx.user)
			) {
				throw new TRPCError({
					code: "FORBIDDEN",
					message: "You can only access your own club's products",
				});
			}

			const updated = await ctx.db.product.update({
				where: { productId },
				data,
			});

			return updated;
		}),

	deleteProduct: facilityProcedure
		.input(deleteProductSchema)
		.mutation(async ({ ctx, input }) => {
			const { productId } = input;

			const existing = await ctx.db.product.findUnique({
				where: { productId },
				include: {
					_count: {
						select: {
							calendarEvents: true,
							registrations: true,
						},
					},
				},
			});

			if (!existing) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Product not found",
				});
			}

			if (
				ctx.user.clubShortName !== existing.clubShortName &&
				!isPlatformAdmin(ctx.user)
			) {
				throw new TRPCError({
					code: "FORBIDDEN",
					message: "You can only access your own club's products",
				});
			}

			if (existing._count.calendarEvents > 0) {
				throw new TRPCError({
					code: "BAD_REQUEST",
					message:
						"Cannot delete product that is linked to calendar events. Try marking as inactive instead",
				});
			}

			if (existing._count.registrations > 0) {
				throw new TRPCError({
					code: "BAD_REQUEST",
					message:
						"Cannot delete product that has registrations. Try marking as inactive instead",
				});
			}

			await ctx.db.product.update({
				where: { productId },
				data: { isActive: false },
			});

			return { success: true };
		}),
});
