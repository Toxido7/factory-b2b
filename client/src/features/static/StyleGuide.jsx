import Button from "../../components/Button.jsx";
import EmptyState from "../../components/EmptyState.jsx";
import ErrorState from "../../components/ErrorState.jsx";
import Skeleton from "../../components/Skeleton.jsx";

const colors = [
  ["navy", "bg-navy"],
  ["accent", "bg-accent"],
  ["surface", "bg-surface"],
  ["line", "bg-line"],
  ["muted", "bg-muted"],
];

export default function StyleGuide() {
  return (
    <div className="mx-auto max-w-7xl space-y-12 px-8 py-12">
      <h1 className="text-4xl font-bold">Style guide</h1>

      <section>
        <h2 className="mb-4 text-xl font-semibold">Colors</h2>
        <div className="flex gap-4">
          {colors.map(([name, cls]) => (
            <div key={name} className="text-sm">
              <div
                className={`h-16 w-24 rounded-2xl border border-line ${cls}`}
              />
              {name}
            </div>
          ))}
        </div>
      </section>

      <section>
        <h2 className="mb-4 text-xl font-semibold">Buttons</h2>
        <div className="flex gap-4">
          <Button>Browse products</Button>
          <Button variant="ghost">Create a business account</Button>
        </div>
      </section>

      <section>
        <h2 className="mb-4 text-xl font-semibold">Input</h2>
        <input
          placeholder="Search products"
          className="min-h-12 w-80 rounded-full border border-line bg-surface px-5 outline-none focus:border-navy"
        />
      </section>

      <section>
        <h2 className="mb-4 text-xl font-semibold">States</h2>
        <div className="space-y-4">
          <Skeleton className="h-6 w-40" />
          <Skeleton className="h-12 w-64" />
          <Skeleton className="h-24 w-full" />
          <EmptyState />
          <ErrorState onRetry={() => {}} />
        </div>
      </section>

      <section>
        <h2 className="mb-4 text-xl font-semibold">Badges</h2>
        <div className="flex gap-3">
          <span className="rounded-full bg-accent px-3 py-1 text-xs font-bold">
            -10%
          </span>
          <span className="rounded-full bg-navy px-3 py-1 text-xs font-bold text-white">
            New
          </span>
          <span className="rounded-md bg-surface px-3 py-1 text-xs text-muted">
            Min. 10 units
          </span>
        </div>
      </section>

      <section>
        <h2 className="mb-4 text-xl font-semibold">Card</h2>
        <div className="w-64 rounded-3xl border border-line p-6 transition duration-200 hover:-translate-y-1 hover:shadow-xl">
          <p className="text-xs text-muted">Category name</p>
          <p className="font-semibold">Product name</p>
          <p className="mt-2 text-xl font-bold">00.00 TND</p>
        </div>
      </section>
    </div>
  );
}
