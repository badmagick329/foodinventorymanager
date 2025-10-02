import NavBar from "@/components/nav-bar";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import type { FC, ReactNode } from "react";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Food Inventory Manager",
  description: "Food Inventory Manager",
};

interface LayoutProps {
  children: ReactNode;
}

const RootLayout: FC<LayoutProps> = ({ children }) => {
  return (
    <html lang="en" data-theme="night" suppressHydrationWarning>
      <body
        className={`${inter.className} text-color-3 min-h-screen gradiant-radial`}
      >
        <NavBar />
        <main className="flex flex-col items-center min-h-screen">
          {children}
        </main>
      </body>
    </html>
  );
};

export default RootLayout;
