import { GiFoodTruck } from "react-icons/gi";
import Link from "next/link";
import { BsFillPlusSquareFill } from "react-icons/bs";
import { FaCartPlus } from "react-icons/fa";
import { AiOutlinePlus } from "react-icons/ai";

export default function NavBar() {
  return (
    <nav className="flex space-x-2 border-b mb-5 px-2 h-20 items-center bg-black text-color-3">
      <Link className="text-4xl md:text-6xl hover:text-color-1" href="/">
        <GiFoodTruck />
      </Link>
      <ul className="flex pl-4 space-x-6 items-center">
        <li>
          <Link className="text-base md:text-xl" href="/food/new">
            <span className="flex gap-2 items-center hover:text-color-1">
              New <AiOutlinePlus />
            </span>
          </Link>
        </li>
        <li className="text-base md:text-xl">
          <Link className="text-base md:text-xl" href="/food/new">
            <span className="flex gap-2 items-center hover:text-color-1">
              List <FaCartPlus />
            </span>
          </Link>
        </li>
      </ul>
    </nav>
  );
}
