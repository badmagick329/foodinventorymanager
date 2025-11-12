import Image from "next/image";
import CatRunning from "../../public/images/cat-running.gif";

export default function LoadingCat() {
  return (
    <div className="flex flex-col h-full justify-center py-48">
      <Image
        src={CatRunning}
        alt="Cat running"
        width={200}
        height={200}
        unoptimized
        className="rounded-full"
      />
    </div>
  );
}
