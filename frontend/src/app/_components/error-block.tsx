export default function ErrorBlock({ error }: { error: Error }) {
  console.error(error);
  return <span className="text-4xl">Could not fetch data 😥</span>;
}
