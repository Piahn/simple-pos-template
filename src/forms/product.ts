import { z } from "zod";

export const productFormSchema = z.object({
    name: z.string().min(3, "Minimum 3 characters required"),
    price: z.coerce.number({ message: "Price is required" }).min(1000),
    categoryId: z.string({ message: "Category is required" }),
    imageUrl: z.string().url({ message: "Image URL is required" }).optional(),
});

export const UpdateProductFormSchema = z.object({
    id: z.string(),
    name: z.string().min(3).max(3),
    price: z.coerce.number().min(1000),
    categoryId: z.string(),
});

export const updateProductSchema = UpdateProductFormSchema;
export const UpdateProductFormSchemaWithId = UpdateProductFormSchema.omit({ id: true });

export type ProductFormSchema = z.infer<typeof productFormSchema>;
export type UpdateProductSchema = z.infer<typeof updateProductSchema>;
export type UpdateProductSchemaForm = z.infer<typeof UpdateProductFormSchemaWithId>;
