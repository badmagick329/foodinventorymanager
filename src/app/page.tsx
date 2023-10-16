import Link from "next/link";
import FoodList from "@/components/FoodList";

export default function Home() {
  return (
    <>
      <Link href="/test">Click me</Link>
      <FoodList />
    </>
  );
}
