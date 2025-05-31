import {
  DashboardDescription,
  DashboardHeader,
  DashboardLayout,
  DashboardTitle,
} from "@/components/layouts/DashboardLayout";
import type { NextPageWithLayout } from "../_app";
import { useState, type ReactElement } from "react";
import { Button } from "@/components/ui/button";
import { ProductCatalogCard } from "@/components/shared/product/ProductCatalogCard";
import { api } from "@/utils/api";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { ProductForm } from "@/components/shared/product/ProductForm";
import { Form } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { productFormSchema, type ProductFormSchema } from "@/forms/product";
import { zodResolver } from "@hookform/resolvers/zod";
import { Notification } from "@/components/ui/notification";

// 🔧 Tambahkan type ini agar UpdateProductSchema tidak undefined
type UpdateProductSchema = {
  id: string;
  name: string;
  price: number;
  categoryId: string;
  imageUrl?: string;
};

const ProductsPage: NextPageWithLayout = () => {
  const apiUtils = api.useUtils();

  const [notification, setNotification] = useState<{
    message: string;
    type: "success" | "error";
  } | null>(null);

  const showNotification = (message: string, type: "success" | "error") => {
    setNotification({ message, type });
  };

  const [uploadedCreateProductImageUrl, setUploadedCreateProductImageUrl] =
    useState<string | null>(null);
  const [uploadedImageUrl, setUploadedImageUrl] = useState<string | null>(null);

  const [createProductDialogOpen, setCreateProductDialogOpen] = useState(false);

  const [editProduct, setEditProduct] = useState<string | null>(null);
  const [editProductDialogOpen, setEditProductDialogOpen] = useState(false);

  const [deleteProductId, setDeleteProductId] = useState<string | null>(null);
  const [deleteProductDialogOpen, setDeleteProductDialogOpen] = useState(false);

  const { data: products } = api.product.getProducts.useQuery();

  const { mutate: createProduct } = api.product.createProduct.useMutation({
    onSuccess: async () => {
      await apiUtils.product.getProducts.invalidate();
      showNotification("Successfully created new product", "success");
      setCreateProductDialogOpen(false);
    },
  });

  const createProductForm = useForm<ProductFormSchema>({
    resolver: zodResolver(productFormSchema),
  });

  const updateProductForm = useForm<ProductFormSchema>({
    resolver: zodResolver(productFormSchema),
  });

  const handleSubmitCreateProduct = (values: ProductFormSchema) => {
    if (!uploadedCreateProductImageUrl) {
      showNotification("Please upload a product image first", "error");
      return;
    }

    createProduct({
      name: values.name,
      price: values.price,
      categoryId: values.categoryId,
      imageUrl: uploadedCreateProductImageUrl,
    });

    createProductForm.reset();
  };

  const { mutate: updateProduct } = api.product.updateProductById.useMutation({
    onSuccess: async () => {
      await apiUtils.product.getProducts.invalidate();
      showNotification("Successfully updated product", "success");
      setEditProductDialogOpen(false);
    },
  });

  const { mutate: deleteProduct } = api.product.deleteProductById.useMutation({
    onSuccess: async () => {
      await apiUtils.product.getProducts.invalidate();
      showNotification("Successfully deleted product", "success");
      setDeleteProductDialogOpen(false);
    },
  });

  const handleSubmitUpdateProduct = (product: UpdateProductSchema) => {
    setEditProduct(product.id);
    setEditProductDialogOpen(true);
    setUploadedImageUrl(product.imageUrl ?? "");

    updateProductForm.reset({
      name: product.name,
      price: product.price,
      categoryId: product.categoryId,
      imageUrl: product.imageUrl ?? "",
    });
  };

  const handleUpdateProduct = (values: ProductFormSchema) => {
    if (!editProduct) return;
    updateProduct({
      id: editProduct,
      ...values,
      imageUrl: uploadedImageUrl ?? "",
    });
  };

  const handleSubmitDeleteProduct = (productId: string) => {
    setDeleteProductId(productId);
    setDeleteProductDialogOpen(true);
  };

  const handleDeleteProduct = () => {
    if (!deleteProductId) return;
    deleteProduct({ productId: deleteProductId });
  };

  return (
    <>
      <DashboardHeader>
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <DashboardTitle>Product Management</DashboardTitle>
            <DashboardDescription>
              View, add, edit, and delete products in your inventory.
            </DashboardDescription>
          </div>

          {notification && (
            <Notification
              message={notification.message}
              type={notification.type}
              onClose={() => setNotification(null)}
            />
          )}

          <AlertDialog
            open={createProductDialogOpen}
            onOpenChange={setCreateProductDialogOpen}
          >
            <AlertDialogTrigger asChild>
              <Button>Add New Product</Button>
            </AlertDialogTrigger>

            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Create Product</AlertDialogTitle>
              </AlertDialogHeader>

              <Form {...createProductForm}>
                <ProductForm
                  onSubmit={handleSubmitCreateProduct}
                  onChangeImageUrl={(url) =>
                    setUploadedCreateProductImageUrl(url)
                  }
                />
              </Form>

              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <Button
                  onClick={createProductForm.handleSubmit(
                    handleSubmitCreateProduct,
                  )}
                >
                  Create Product
                </Button>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </DashboardHeader>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {products?.map((product) => (
          <ProductCatalogCard
            key={product.id}
            name={product.name}
            price={product.price}
            image={product.imageUrl ?? ""}
            category={product.category.name}
            onEdit={() =>
              handleSubmitUpdateProduct({
                id: product.id,
                name: product.name,
                price: product.price,
                categoryId: product.category.id,
                imageUrl: product.imageUrl ?? "",
              })
            }
            onDelete={() => handleSubmitDeleteProduct(product.id)}
          />
        ))}
      </div>

      {/* ===== Edit Dialog ===== */}
      <AlertDialog
        open={editProductDialogOpen}
        onOpenChange={setEditProductDialogOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Update Product</AlertDialogTitle>
          </AlertDialogHeader>

          <Form {...updateProductForm}>
            <ProductForm
              onSubmit={handleUpdateProduct}
              onChangeImageUrl={(url) => setUploadedImageUrl(url)}
            />
          </Form>

          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <Button
              onClick={updateProductForm.handleSubmit(handleUpdateProduct)}
            >
              Update Product
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* ===== Delete Dialog ===== */}
      <AlertDialog
        open={deleteProductDialogOpen}
        onOpenChange={setDeleteProductDialogOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Are you sure you want to delete this product?
            </AlertDialogTitle>
          </AlertDialogHeader>

          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <Button variant="destructive" onClick={handleDeleteProduct}>
              Delete
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

ProductsPage.getLayout = (page: ReactElement) => {
  return <DashboardLayout>{page}</DashboardLayout>;
};

export default ProductsPage;
