import { ShoppingItem } from "@prisma/client";

const linkRegex = /https?:\/\/[^\s]+\.[^\s]+/g;

export default function ShoppingItemDisplay({ item }: { item: ShoppingItem }) {
  const links = item.name.matchAll(linkRegex);
  const text = item.name
    .replace(linkRegex, "")
    .replace(/\s{2,}/g, " ")
    .trim();

  return (
    <div className="flex flex-col w-full p-2 space-y-2">
      <span className="text-xl">{text}</span>
      <div className="flex flex-col space-y-2">
        {[...links].map((link) => (
          <a
            key={link[0]}
            className="text-blue-500 underline"
            href={link[0]}
            target="_blank"
            rel="noreferrer"
          >
            {link[0]}
          </a>
        ))}
      </div>
    </div>
  );
}
