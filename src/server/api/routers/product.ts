import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "../trpc";
import { supabaseAdmin } from "@/server/supabase-admin";
import { Bucket } from "@/server/bucket";
import { TRPCError } from "@trpc/server";

export const ProductRouter = createTRPCRouter({
    getProducts: protectedProcedure.query(async ({ ctx }) => {
        const { db } = ctx;

        const products = await db.product.findMany({
            select: {
                id: true,
                name: true,
                price: true,
                imageUrl: true,
                category: {
                    select: {
                        id: true,
                        name: true,
                    },
                },
            },
        });

        return products;
    }),

    createProduct: protectedProcedure
        .input(
            z.object({
                name: z.string().min(3),
                price: z.number().min(1000),
                categoryId: z.string(),
                // multipart/form-data | JSON
                imageUrl: z.string().url(),
            }),
        )
        .mutation(async ({ ctx, input }) => {
            const { db } = ctx;

            const newProduct = await db.product.create({
                data: {
                    name: input.name,
                    price: input.price,
                    category: {
                        connect: {
                            id: input.categoryId,
                        },
                    },
                    imageUrl: input.imageUrl,
                },
            });

            return newProduct;
        }),

    createProductImageUploadSignedUrl: protectedProcedure.mutation(async () => {
        const { data, error } = await supabaseAdmin.storage
            .from(Bucket.ProductImages)
            .createSignedUploadUrl(`${Date.now()}.jpeg`);

        if (error) {
            throw new TRPCError({
                code: "INTERNAL_SERVER_ERROR",
                message: error.message,
            });
        }
        return data;
    }),

    updateProductById: protectedProcedure
        .input(
            z.object({
                id: z.string(),
                name: z.string().min(3).max(100),
                price: z.coerce.number().min(1000),
                categoryId: z.string(),
                imageUrl: z.string().url(), // URL gambar baru
            }),
        )
        .mutation(async ({ ctx, input }) => {
            const { db } = ctx;
            const { id, name, price, categoryId, imageUrl: newImageUrl } = input;

            // 1. Ambil data produk yang akan diupdate, termasuk imageUrl lama
            const existingProduct = await db.product.findUnique({
                where: { id: id },
                select: { imageUrl: true },
            });

            if (!existingProduct) {
                throw new TRPCError({
                    code: "NOT_FOUND",
                    message: "Produk yang akan diupdate tidak ditemukan.",
                });
            }

            const oldImageUrl = existingProduct.imageUrl;

            // 2. Lakukan update data produk di database
            const updatedProduct = await db.product.update({
                where: {
                    id: id,
                },
                data: {
                    name: name,
                    price: price,
                    categoryId: categoryId,
                    imageUrl: newImageUrl, // Simpan imageUrl yang baru
                },
            });

            if (oldImageUrl && oldImageUrl !== newImageUrl) {
                const bucketName = Bucket.ProductImages; // Ambil dari enum/konstanta Anda
                const urlParts = oldImageUrl.split(`/storage/v1/object/public/${bucketName}/`);

                if (urlParts.length < 2 || !urlParts[1]) {
                    console.warn(`Format imageUrl lama tidak valid atau path tidak dapat diekstrak: ${oldImageUrl}`);
                } else {
                    const oldImagePath = urlParts[1];
                    const { data, error: storageError } = await supabaseAdmin.storage
                        .from(bucketName)
                        .remove([oldImagePath]);

                    if (storageError) {
                        console.error(
                            `Gagal menghapus gambar lama '${oldImagePath}' dari bucket '${bucketName}':`,
                            storageError.message,
                        );
                    } else {
                        console.log(
                            `Gambar lama '${oldImagePath}' berhasil dihapus dari bucket '${bucketName}'.`, data,
                        );
                    }
                }
            }

            return updatedProduct;
        }),

    deleteProductById: protectedProcedure
        .input(
            z.object({
                productId: z.string(),
            }),
        )
        .mutation(async ({ ctx, input }) => {
            const { db } = ctx;
            const { productId } = input;

            const productToDelete = await db.product.findUnique({
                where: { id: productId },
                select: { imageUrl: true },
            });

            if (!productToDelete) {
                throw new TRPCError({
                    code: "NOT_FOUND",
                    message: "Produk tidak ditemukan.",
                });
            }

            const { imageUrl } = productToDelete;
            await db.product.delete({
                where: {
                    id: productId,
                },
            });

            if (imageUrl) {
                const bucketName = Bucket.ProductImages;
                const urlParts = imageUrl.split(`/storage/v1/object/public/${bucketName}/`);

                if (urlParts.length < 2 || !urlParts[1]) {
                    throw new TRPCError({
                        code: "INTERNAL_SERVER_ERROR",
                        message: "URL gambar tidak valid.",
                    });
                } else {
                    const imagePath = urlParts[1];

                    const { data: dataDelete, error: storageError } = await supabaseAdmin.storage
                        .from(bucketName)
                        .remove([imagePath]); // `remove` menerima array dari path

                    if (storageError) {
                        throw new TRPCError({
                            code: "INTERNAL_SERVER_ERROR",
                            message: storageError.message,
                        });
                    }
                    return dataDelete;
                }
            }
        }),
});