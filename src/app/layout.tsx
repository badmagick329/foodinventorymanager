import "./globals.css";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import NavBar from "@/components/NavBar";
import type { ReactNode, FC } from "react";
import { Advent_Pro, Capriola } from "next/font/google";

const capriola = Capriola({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-capriola",
});
const adventPro = Advent_Pro({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-advent-pro",
});

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
    <html lang="en" data-theme="night" suppressHydrationWarning>
      <body
        className={`${capriola.variable} text-color-3 min-h-screen gradiant-radial`}
      >
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
