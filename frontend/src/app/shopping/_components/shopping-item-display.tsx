import { ShoppingItem } from "@prisma/client";

const linkRegex = /https?:\/\/[^\s]+\.[^\s]+/g;

export default function ShoppingItemDisplay({ item }: { item: ShoppingItem }) {
  const links = item.name.matchAll(linkRegex);
  const text = `${item.name
    .replace(linkRegex, "")
    .replace(/\s{2,}/g, " ")
    .trim()}`;

  return (
    <div className="flex w-full flex-col break-all">
      <span className="text-lg">{text}</span>
      <div className="flex flex-col gap-1">
        {[...links].map((link) => (
          <a
            key={link[0]}
            className="text-xs text-blue-500 underline visited:text-purple-500 hover:text-blue-700 md:text-sm"
            href={link[0]}
            target="_blank"
          >
            {link[0]}
          </a>
        ))}
      </div>
    </div>
  );
}
