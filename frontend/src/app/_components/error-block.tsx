export default function ErrorBlock({ error }: { error: Error }) {
  console.error(error);
  return (
    <div className="flex flex-col items-center gap-2 text-center">
      <span className="text-4xl">Could not fetch data 😥</span>
      <span className="text-muted-foreground">{error.message}</span>
    </div>
  );
}
