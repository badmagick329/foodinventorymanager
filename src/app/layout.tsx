import "./globals.css";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import NavBar from "@/components/NavBar";
import type { ReactNode, FC } from "react";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Food Inventory Manager",
  description: "Food Inventory Manager",
};

interface LayoutProps {
  children: ReactNode;
  modal: ReactNode;
}

const RootLayout: FC<LayoutProps> = ({ children, modal }) => {
  return (
    <html lang="en" data-theme="dark" suppressHydrationWarning>
      <body className={`${inter.className} bg-slate-950 min-h-screen`}>
        <NavBar />
        <main className="flex flex-col items-center">
          {children}
          {modal}
        </main>
      </body>
    </html>
  );
};

export default RootLayout;
