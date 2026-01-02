/** @knipignore */
export const runtime = "nodejs";

export default function NotFound() {
  return (
    <section className="p-8">
      <h1 className="text-2xl font-bold">Article not found</h1>
      <p className="opacity-80">The insight you’re looking for doesn’t exist.</p>
    </section>
  );
}


