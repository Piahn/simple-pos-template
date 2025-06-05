import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "../trpc";

// ROUTER CATEGORY UTAMA
export const categoryRouter = createTRPCRouter({
    // QUERY: Ambil Semua Kategori
    getCategories: protectedProcedure.query(async ({ ctx }) => {
        const { db } = ctx;

        const category = await db.category.findMany({
            select: {
                id: true,
                name: true,
                // productCount: true,
                _count: {
                    select: {
                        products: true,
                    }
                }
            },
        });

        return category;
    }),

    // MUTATION: Buat Kategori Baru
    createCategory: protectedProcedure
        .input(
            z.object({
                name: z.string().min(3, "Minimum 3 characters required"),
            }),
        )
        .mutation(async ({ ctx, input }) => {
            const { db } = ctx;

            const newCategory = await db.category.create({
                data: {
                    name: input.name,
                },
                select: {
                    id: true,
                    name: true,
                    productCount: true,
                },
            });
            return newCategory;
        }),

    // MUTATION: Hapus Kategori Berdasarkan ID
    deleteCategory: protectedProcedure
        .input(
            z.object({
                id: z.string(),
            }),
        )
        .mutation(async ({ ctx, input }) => {
            const { db } = ctx;

            await db.category.delete({
                where: {
                    id: input.id,
                },
            });
        }),

    // MUTATION: Edit Kategori Berdasarkan ID
    editCategory: protectedProcedure
        .input(
            z.object({
                id: z.string(),
                name: z.string().min(3, "Minimum 3 characters required"),
            }),
        )
        .mutation(async ({ ctx, input }) => {
            const { db } = ctx;

            const updatedCategory = await db.category.update({
                where: {
                    id: input.id,
                },
                data: {
                    name: input.name,
                },
            });
            return updatedCategory;
        }),
});