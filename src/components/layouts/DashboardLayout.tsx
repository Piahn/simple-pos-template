import {
  BarChart3,
  Grid3X3,
  Package,
  ShoppingCart,
  Sun,
  Moon,
} from "lucide-react"; // Tambahkan Moon untuk ikon tema
import React, { useEffect, type ReactNode, useState } from "react";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarSeparator,
} from "@/components/ui/sidebar";
import { useRouter } from "next/router";
import Link from "next/link";
import { useTheme } from "next-themes";
import { Button } from "../ui/button"; // Pastikan path ini benar
import { SignOutButton } from "@clerk/nextjs";

// Dashboard header component
interface DashboardHeaderProps {
  children: ReactNode;
  className?: string;
}

export const DashboardHeader = ({
  children,
  className = "",
}: DashboardHeaderProps) => {
  return <header className={`mb-6 space-y-2 ${className}`}>{children}</header>;
};

// Dashboard title component
interface DashboardTitleProps {
  children: ReactNode;
  className?: string;
}

export const DashboardTitle = ({
  children,
  className = "",
}: DashboardTitleProps) => {
  return (
    <h1 className={`text-2xl font-bold tracking-tight ${className}`}>
      {children}
    </h1>
  );
};

// Dashboard description component
interface DashboardDescriptionProps {
  children: ReactNode;
  className?: string;
}

export const DashboardDescription = ({
  children,
  className = "",
}: DashboardDescriptionProps) => {
  return <p className={`text-muted-foreground ${className}`}>{children}</p>;
};

// Main dashboard layout component
interface DashboardLayoutProps {
  children: ReactNode;
}

export const DashboardLayout = ({ children }: DashboardLayoutProps) => {
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false); // State untuk melacak apakah komponen sudah di-mount

  // useEffect ini akan berjalan hanya sekali di sisi klien setelah komponen di-mount
  useEffect(() => {
    setMounted(true);
  }, []);

  // useEffect ini untuk menyimpan tema ke localStorage, sudah benar
  useEffect(() => {
    if (theme && mounted) {
      // Pastikan mounted sebelum mengakses localStorage
      localStorage.setItem("theme", theme);
    }
  }, [theme, mounted]);

  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark");
  };

  // Jangan render UI yang bergantung tema sampai komponen di-mount
  // Ini mencegah mismatch antara server dan client render awal
  const renderThemeToggleButton = () => {
    if (!mounted) {
      // Saat belum mounted (SSR atau render awal client sebelum useEffect jalan),
      // render placeholder atau tombol dengan teks/ikon default yang konsisten.
      // Bisa juga return null jika tidak ingin menampilkan apa-apa.
      // Untuk konsistensi, kita bisa merender tombol dengan ikon saja tanpa teks dinamis.
      return (
        <Button variant="ghost" size="icon" disabled>
          <Sun className="h-[1.2rem] w-[1.2rem] scale-100 rotate-0 transition-all dark:scale-0 dark:-rotate-90" />
          <Moon className="absolute h-[1.2rem] w-[1.2rem] scale-0 rotate-90 transition-all dark:scale-100 dark:rotate-0" />
          <span className="sr-only">Toggle theme (loading)</span>
        </Button>
      );
    }

    // Setelah mounted, render tombol dengan teks/ikon yang sesuai dengan tema saat ini
    return (
      <Button
        variant="ghost"
        onClick={toggleTheme}
        aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
      >
        {theme === "dark" ? (
          <>
            <Moon className="mr-2 h-4 w-4" /> Dark Mode
          </>
        ) : (
          <>
            <Sun className="mr-2 h-4 w-4" /> Light Mode
          </>
        )}
      </Button>
    );
  };

  return (
    <SidebarProvider defaultOpen={true}>
      <div className="flex h-screen w-full">
        <Sidebar>
          <SidebarHeader className="p-4">
            <h2 className="text-xl font-bold">Simple POS</h2>
          </SidebarHeader>
          <SidebarContent className="px-4">
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  tooltip="Create Order"
                  isActive={
                    router.pathname === "/dashboard" ||
                    router.pathname.startsWith("/dashboard/")
                  }
                >
                  <Link href="/dashboard">
                    <ShoppingCart className="mr-2 h-4 w-4" />
                    Create Order
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>

            <SidebarSeparator className="my-2" />

            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  tooltip="Category Management"
                  isActive={router.pathname.startsWith("/categories")}
                >
                  <Link href="/categories">
                    <Grid3X3 className="mr-2 h-4 w-4" />
                    Category Management
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>

              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  tooltip="Product Management"
                  isActive={router.pathname.startsWith("/products")}
                >
                  <Link href="/products">
                    <Package className="mr-2 h-4 w-4" />
                    Product Management
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>

              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  tooltip="Sales Dashboard"
                  isActive={router.pathname.startsWith("/sales")}
                >
                  <Link href="/sales">
                    <BarChart3 className="mr-2 h-4 w-4" />
                    Sales Dashboard
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarContent>
          <SidebarFooter className="space-y-2 p-4">
            <div className="flex items-center justify-between">
              {renderThemeToggleButton()}
            </div>
            <div className="hover:bg-muted flex items-center justify-between space-x-2 rounded-md p-2 px-2 transition-colors duration-200 ease-in-out">
              <SignOutButton redirectUrl="/" />
            </div>
            <p className="text-muted-foreground pt-2 text-center text-xs">
              Simple POS v1.0
            </p>
          </SidebarFooter>
        </Sidebar>

        <main className="relative flex-1 overflow-auto p-6">{children}</main>
      </div>
    </SidebarProvider>
  );
};
