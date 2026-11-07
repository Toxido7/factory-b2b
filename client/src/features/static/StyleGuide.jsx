import Button from "../../components/Button.jsx";
import EmptyState from "../../components/EmptyState.jsx";
import ErrorState from "../../components/ErrorState.jsx";
import Skeleton from "../../components/Skeleton.jsx";
import CountUp from "../../components/motion/CountUp.jsx";
import Reveal from "../../components/motion/Reveal.jsx";
import { Stagger, StaggerItem } from "../../components/motion/Stagger.jsx";

const colors = [
  ["ink", "bg-ink"],
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
          className="min-h-12 w-80 rounded-full border border-line bg-surface px-5 outline-none focus:border-ink"
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
          <span className="rounded-full bg-ink px-3 py-1 text-xs font-bold text-white">
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

      <section>
        <h2 className="mb-4 text-xl font-semibold">Motion</h2>
        <Reveal className="rounded-3xl border border-line bg-white p-6">
          <p className="font-semibold">Reveal card</p>
          <p className="mt-2 text-muted">Appears once as it enters the viewport.</p>
        </Reveal>
        <Stagger className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {["First", "Second", "Third", "Fourth"].map((label) => (
            <StaggerItem key={label} className="rounded-3xl border border-line bg-surface p-6">
              <p className="font-semibold">{label}</p>
            </StaggerItem>
          ))}
        </Stagger>
        <div className="mt-6 flex flex-wrap gap-8 text-3xl font-bold text-ink">
          <CountUp value={1280} />
          <CountUp value={33.3} decimals={1} suffix=" %" />
          <CountUp value={42} />
        </div>
      </section>
    </div>
  );
}
