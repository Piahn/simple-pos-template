import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { ProductFormSchema } from "@/forms/product";
import { uploadFileToSignedUrl } from "@/lib/supabase";
import { Bucket } from "@/server/bucket";
import { api } from "@/utils/api";
import { useState, type ChangeEvent } from "react";
import { useFormContext } from "react-hook-form";

type ProductFormProps = {
  onSubmit: (values: ProductFormSchema) => void;
  onChangeImageUrl: (imageUrl: string) => void;
};

export const ProductForm = ({
  onSubmit,
  onChangeImageUrl,
}: ProductFormProps) => {
  const form = useFormContext<ProductFormSchema>();

  const { data: categories } = api.category.getCategories.useQuery();

  const { mutateAsync: createImageSignedUrl } =
    api.product.createProductImageUploadSignedUrl.useMutation();

  const imageChangeHandler = async (e: ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;

    if (files && files?.length > 0) {
      const file = files[0];

      if (!file) return;

      const { path, token } = await createImageSignedUrl();

      const imageUrl = await uploadFileToSignedUrl({
        bucket: Bucket.ProductImages,
        file,
        path,
        token,
      });

      onChangeImageUrl(imageUrl);
    }
  };

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
      <FormField
        control={form.control}
        name="name"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Product Name</FormLabel>
            <FormControl>
              <Input {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="price"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Price</FormLabel>
            <FormControl>
              <Input type="number" {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="categoryId"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Category</FormLabel>
            <FormControl>
              <Select
                value={field.value}
                onValueChange={(value) => {
                  field.onChange(value);
                }}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Category" />
                </SelectTrigger>

                <SelectContent>
                  {categories?.map((category) => {
                    return (
                      <SelectItem key={category.id} value={category.id}>
                        {category.name}
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <div className="space-y-1">
        <Label>Product Image</Label>

        <Input onChange={imageChangeHandler} type="file" accept="image/*" />
      </div>
    </form>
  );
};
