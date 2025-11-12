"use client";
import NavBar from "@/components/nav-bar";
import { Inter } from "next/font/google";
import type { FC, ReactNode } from "react";
import "./globals.css";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

const inter = Inter({ subsets: ["latin"] });

interface LayoutProps {
  children: ReactNode;
}
const queryClient = new QueryClient();

const RootLayout: FC<LayoutProps> = ({ children }) => {
  return (
    <html lang="en">
      <body className={`${inter.className} text-color-3 min-h-screen`}>
        <NavBar />
        <main className="flex flex-col items-center min-h-screen">
          <QueryClientProvider client={queryClient}>
            {children}
          </QueryClientProvider>
        </main>
      </body>
    </html>
  );
};

export default RootLayout;
