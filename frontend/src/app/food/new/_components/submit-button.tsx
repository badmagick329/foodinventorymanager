export default function SubmitButton({ isPending }: { isPending: boolean }) {
  return (
    <button
      className="btn btn-outline btn-info w-24"
      type="submit"
      disabled={isPending}
    >
      {isPending ? "Submitting" : "Submit"}
    </button>
  );
}
