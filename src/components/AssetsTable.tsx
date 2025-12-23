import type { Asset } from "../engine/types";
import { Button, Card, Input, SectionTitle } from "./ui";

export default function AssetsTable({
  assets,
  onChange,
}: {
  assets: Asset[];
  onChange: (next: Asset[]) => void;
}) {
  const update = (idx: number, patch: Partial<Asset>) => {
    onChange(assets.map((a, i) => (i === idx ? { ...a, ...patch } : a)));
  };

  const add = () => {
    onChange([
      ...assets,
      {
        name: `Asset ${assets.length + 1}`,
        muAnnual: 0.1,
        sigmaAnnual: 0.2,
        weight: 1,
      },
    ]);
  };

  const remove = (idx: number) => onChange(assets.filter((_, i) => i !== idx));

  return (
    <Card className="bg-white/5">
      <div className="flex items-center justify-between">
        <SectionTitle
          title="Assets"
          subtitle="μ/σ are annual; weights auto-normalize"
        />
        <Button onClick={add}>+ Add</Button>
      </div>

      {/* header labels: MAKE THEM READABLE */}
      <div className="mt-2 grid grid-cols-12 gap-2 text-xs text-zinc-600 dark:text-zinc-300">
        <div className="col-span-4">Name</div>
        <div className="col-span-2">μ</div>
        <div className="col-span-2">σ</div>
        <div className="col-span-2">Weight</div>
        <div className="col-span-2" />
      </div>

      <div className="mt-2 space-y-2">
        {assets.map((a, i) => (
          <div key={i} className="grid grid-cols-12 items-center gap-2">
            <Input
              className="col-span-4"
              value={a.name}
              onChange={(e) => update(i, { name: e.target.value })}
            />
            <Input
              className="col-span-2"
              type="number"
              step="0.01"
              value={a.muAnnual}
              onChange={(e) => update(i, { muAnnual: Number(e.target.value) })}
            />
            <Input
              className="col-span-2"
              type="number"
              step="0.01"
              value={a.sigmaAnnual}
              onChange={(e) =>
                update(i, { sigmaAnnual: Number(e.target.value) })
              }
            />
            <Input
              className="col-span-2"
              type="number"
              step="0.01"
              value={a.weight}
              onChange={(e) => update(i, { weight: Number(e.target.value) })}
            />
            <div className="col-span-2 flex justify-end">
              <Button
                variant="danger"
                onClick={() => remove(i)}
                disabled={assets.length <= 1}
              >
                Delete
              </Button>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}
