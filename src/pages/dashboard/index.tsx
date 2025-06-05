import {
  DashboardDescription,
  DashboardHeader,
  DashboardLayout,
  DashboardTitle,
} from "@/components/layouts/DashboardLayout";
import { CategoryFilterCard } from "@/components/shared/category/CategoryFilterCard";
import { CreateOrderSheet } from "@/components/shared/CreateOrderSheet";
import { ProductMenuCard } from "@/components/shared/product/ProductMenuCard";
import { Input } from "@/components/ui/input";
import { CATEGORIES } from "@/data/mock";
import { Search, ShoppingCart } from "lucide-react";
import type { ReactElement } from "react";
import { useEffect, useState } from "react";
import type { NextPageWithLayout } from "../_app";
import { Button } from "@/components/ui/button";
import { api } from "@/utils/api";
import { useCartStore } from "@/store/card";
import { useRouter } from "next/router";
import { UserButton, useUser } from "@clerk/nextjs";

const DashboardPage: NextPageWithLayout = () => {
  const cartStore = useCartStore();
  const router = useRouter();
  const { user } = useUser();

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [orderSheetOpen, setOrderSheetOpen] = useState(false);

  const initialSearchQuery = (router.query.p as string) || "";

  useEffect(() => {
    if (initialSearchQuery) {
      setSearchQuery(initialSearchQuery);
    }
  }, [initialSearchQuery]);

  useEffect(() => {
    if (!router.isReady) return;

    const timeoutId = setTimeout(() => {
      const newQuery = { ...router.query };

      if (searchQuery.trim() === "") {
        delete newQuery.p;
      } else {
        newQuery.p = searchQuery;
      }

      void router.push(
        { pathname: router.pathname, query: newQuery },
        undefined,
        { shallow: true },
      );
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [searchQuery, router, router.isReady]);

  const { data: products } = api.product.getProducts.useQuery({
    categoryId: selectedCategory,
  });

  const { data: categories } = api.category.getCategories.useQuery();

  const totalProducts = categories?.reduce((a, b) => {
    return a + b._count.products;
  }, 0);

  const filteredProducts = products?.filter((product) =>
    product.name.toLowerCase().includes(searchQuery.toLowerCase()),
  );
  // ========= handle Category ======================

  const handleCategoryClick = (categoryId: string) => {
    setSelectedCategory(categoryId);
  };

  const handleAddToCart = (productId: string) => {
    const productToAdd = products?.find((product) => product.id === productId);

    if (!productToAdd) {
      alert("Product Not Found");
      return;
      // kita dari kemarin masih pakai alert, nanti kita ganti pakai toast atau apa gitu penyebutannya saya lupa kalau sempet kata dosennya
    }
    cartStore.addToCart({
      name: productToAdd.name,
      productId: productToAdd.id,
      imageUrl: productToAdd.imageUrl ?? "",
      price: productToAdd.price,
    });
  };

  return (
    <>
      <DashboardHeader>
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <DashboardTitle>Dashboard {cartStore.items.length}</DashboardTitle>
            <DashboardDescription>
              Welcome to your Simple POS system dashboard.
            </DashboardDescription>
          </div>

          <div className="flex items-center justify-between gap-5">
            <div className="flex flex-col gap-1 text-right">
              <span className="text-sm leading-3 font-semibold md:text-base">
                {user?.fullName ?? "Unknown User"}
              </span>
              <span className="text-pinkcustom text-xs md:text-sm">
                {user?.emailAddresses?.[0]?.emailAddress ?? "No email found"}
              </span>
            </div>
            <UserButton />
          </div>

          {!!cartStore.items.length && (
            <Button
              className="animate-in slide-in-from-right"
              onClick={() => setOrderSheetOpen(true)}
            >
              <ShoppingCart /> Cart
            </Button>
          )}
        </div>
      </DashboardHeader>

      <div className="space-y-6">
        <div className="relative">
          <Search className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
          <Input
            placeholder="Search products..."
            className="pl-10"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="flex flex-col gap-2">
          <h2 className="text-2xl font-bold">
            Total price: Rp.{" "}
            {cartStore.items
              .reduce((total, item) => total + item.quantity * item.price, 0)
              .toLocaleString("id-ID")}
          </h2>
          <p className="text-base">
            Order quantity:{" "}
            {cartStore.items.reduce((total, item) => total + item.quantity, 0)}
          </p>
        </div>

        <div className="flex space-x-4 overflow-x-auto pb-2">
          <CategoryFilterCard
            key="all"
            name="All"
            isSelected={selectedCategory === "all"}
            onClick={() => handleCategoryClick("all")}
            productCount={totalProducts ?? 0}
          />

          {categories?.map((category) => (
            <CategoryFilterCard
              key={category.id}
              name={category.name}
              productCount={category._count.products}
              isSelected={selectedCategory === category.id}
              onClick={() => handleCategoryClick(category.id)}
            />
          ))}
        </div>

        <div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {filteredProducts?.map((product) => (
              <ProductMenuCard
                key={product.id}
                productId={product.id}
                name={product.name}
                price={product.price}
                imageUrl={product.imageUrl ?? "https://placehold.co/600x400"}
                onAddToCart={handleAddToCart}
              />
            ))}
          </div>
        </div>
      </div>

      <CreateOrderSheet
        open={orderSheetOpen}
        onOpenChange={setOrderSheetOpen}
      />
    </>
  );
};

DashboardPage.getLayout = (page: ReactElement) => {
  return <DashboardLayout>{page}</DashboardLayout>;
};

export default DashboardPage;
