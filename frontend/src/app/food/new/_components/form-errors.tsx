export default function FormErrors({ errors }: { errors: string[] }) {
  return (
    <ul className="text-red-500">
      {errors.map((error) => (
        <li key={error}>{error}</li>
      ))}
    </ul>
  );
}
