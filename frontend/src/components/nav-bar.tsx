import {
  FOOD_FORM_URL,
  RECEIPT_IMPORT_URL,
  SHOPPING_LIST_URL,
} from "@/lib/urls";
import Link from "next/link";
import { AiOutlinePlus } from "react-icons/ai";
import { FaCartPlus } from "react-icons/fa";
import { GiFoodTruck } from "react-icons/gi";
import { PiNoteFill } from "react-icons/pi";

export default function NavBar() {
  return (
    <nav className="mb-5 flex h-20 items-center space-x-2 border-b bg-black px-2 text-foreground">
      <Link className="text-4xl hover:text-primary md:text-6xl" href="/">
        <GiFoodTruck />
      </Link>
      <ul className="flex items-center space-x-6 pl-4">
        <li>
          <Link className="text-base md:text-xl" href={FOOD_FORM_URL}>
            <span className="flex items-center gap-2 hover:text-primary">
              New <AiOutlinePlus />
            </span>
          </Link>
        </li>
        <li className="text-base md:text-xl">
          <Link className="text-base md:text-xl" href={SHOPPING_LIST_URL}>
            <span className="flex items-center gap-2 hover:text-primary">
              List <FaCartPlus />
            </span>
          </Link>
        </li>
        <li className="text-base md:text-xl">
          <Link className="text-base md:text-xl" href={RECEIPT_IMPORT_URL}>
            <span className="flex items-center gap-2 hover:text-primary">
              Receipt <PiNoteFill />
            </span>
          </Link>
        </li>
      </ul>
    </nav>
  );
}
