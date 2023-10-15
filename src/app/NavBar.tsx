import { GiFoodTruck } from 'react-icons/gi';
import Link from 'next/link';

export default function NavBar() {
  return (
    <nav className="flex space-x-6 border-b mb-5 px-5 h-20 items-center bg-black">
      <Link className="text-6xl" href="/"><GiFoodTruck /></Link>
      <ul className='flex pl-4 space-x-6 items-center'>
        <li>
          <Link href="/food/new">New Food</Link>
        </li>
        <li>
          Another Link
        </li>
      </ul>
    </nav>
  );
}
