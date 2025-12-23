import type { StressTest } from "../engine/types";
import { Button, Card, Input, SectionTitle } from "./ui";

export default function StressTests({
  stressTests,
  onChange,
}: {
  stressTests: StressTest[];
  onChange: (next: StressTest[]) => void;
}) {
  const update = (id: string, patch: Partial<StressTest>) => {
    onChange(stressTests.map((s) => (s.id === id ? { ...s, ...patch } : s)));
  };

  const add = () => {
    onChange([
      ...stressTests,
      {
        id: crypto.randomUUID(),
        label: "Stress: -2% returns, 1.5x vol",
        returnHaircut: 0.02,
        volMultiplier: 1.5,
      },
    ]);
  };

  const remove = (id: string) =>
    onChange(stressTests.filter((s) => s.id !== id));

  return (
    <Card className="bg-white/5">
      <div className="flex items-center justify-between">
        <SectionTitle
          title="Stress Tests"
          subtitle="Return haircut (absolute) + volatility multiplier"
        />
        <Button onClick={add}>+ Add</Button>
      </div>

      <div className="mt-2 space-y-2">
        {stressTests.map((s) => (
          <div key={s.id} className="grid grid-cols-12 items-center gap-2">
            <Input
              className="col-span-6"
              value={s.label}
              onChange={(e) => update(s.id, { label: e.target.value })}
            />
            <Input
              className="col-span-2"
              type="number"
              step="0.01"
              value={s.returnHaircut}
              onChange={(e) =>
                update(s.id, { returnHaircut: Number(e.target.value) })
              }
            />
            <Input
              className="col-span-2"
              type="number"
              step="0.1"
              value={s.volMultiplier}
              onChange={(e) =>
                update(s.id, { volMultiplier: Number(e.target.value) })
              }
            />
            <div className="col-span-2 flex justify-end">
              <Button variant="danger" onClick={() => remove(s.id)}>
                Delete
              </Button>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}
