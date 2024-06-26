import { ShoppingItem } from "@prisma/client";

const linkRegex = /https?:\/\/[^\s]+\.[^\s]+/g;

export default function ShoppingItemDisplay({
  item,
  index,
}: {
  item: ShoppingItem;
  index: number;
}) {
  const links = item.name.matchAll(linkRegex);
  const text = `${item.name
    .replace(linkRegex, "")
    .replace(/\s{2,}/g, " ")
    .trim()}`;

  return (
    <div className="flex flex-col w-full p-2 gap-4">
      {index > 0 && <hr />}
      <span className="text-lg">{text}</span>
      <div className="flex flex-col">
        {[...links].map((link) => (
          <a
            key={link[0]}
            className="text-lg text-blue-500 underline hover:text-blue-700 visited:text-purple-500"
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
