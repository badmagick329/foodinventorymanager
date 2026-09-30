import {
  FOOD_FORM_URL,
  HISTORY_URL,
  MANAGE_URL,
  RECEIPT_IMPORT_URL,
  SHOPPING_LIST_URL,
} from "@/lib/urls";
import Link from "next/link";
import { AiOutlinePlus } from "react-icons/ai";
import { FaCartPlus } from "react-icons/fa";
import { GiFoodTruck } from "react-icons/gi";
import { PiNoteFill } from "react-icons/pi";
import { MdHistory, MdSettings } from "react-icons/md";

const NAV_LINKS = [
  { href: FOOD_FORM_URL, label: "New", Icon: AiOutlinePlus },
  { href: SHOPPING_LIST_URL, label: "List", Icon: FaCartPlus },
  { href: RECEIPT_IMPORT_URL, label: "Receipt", Icon: PiNoteFill },
  { href: HISTORY_URL, label: "History", Icon: MdHistory },
  { href: MANAGE_URL, label: "Manage", Icon: MdSettings },
];

export default function NavBar() {
  return (
    <nav className="sticky top-0 z-20 mb-5 flex h-20 items-center gap-2 border-b bg-black px-2 text-foreground">
      <Link
        className="shrink-0 text-4xl hover:text-primary md:text-6xl"
        href="/"
        aria-label="Home"
      >
        <GiFoodTruck />
      </Link>
      {/* Labels only fit from sm up; below that the links are icon-only so the bar never widens the page. */}
      <ul className="flex min-w-0 items-center gap-5 pl-2 sm:gap-6 sm:pl-4">
        {NAV_LINKS.map(({ href, label, Icon }) => (
          <li key={href}>
            <Link
              className="flex items-center gap-2 text-2xl hover:text-primary sm:text-base md:text-xl"
              href={href}
              aria-label={label}
              title={label}
            >
              <span className="hidden sm:inline">{label}</span>
              <Icon />
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
