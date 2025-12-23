import { useMemo, useState } from "react";
import { Button, Card, Input, SectionTitle } from "./ui";

function identity(n: number) {
  return Array.from({ length: n }, (_, i) =>
    Array.from({ length: n }, (_, j) => (i === j ? 1 : 0))
  );
}

export default function CorrMatrix({
  assetNames,
  corr,
  onChange,
}: {
  assetNames: string[];
  corr: number[][] | null;
  onChange: (next: number[][] | null) => void;
}) {
  const n = assetNames.length;
  const [edit, setEdit] = useState(false);

  const mat = useMemo(() => {
    if (!corr || corr.length !== n) return identity(n);
    return corr;
  }, [corr, n]);

  const setCell = (i: number, j: number, v: number) => {
    const next = mat.map((r) => [...r]);
    next[i][j] = v;
    next[j][i] = v;
    next[i][i] = 1;
    next[j][j] = 1;
    onChange(next);
  };

  return (
    <Card className="bg-white/5">
      <div className="flex items-center justify-between">
        <SectionTitle
          title="Correlation"
          subtitle="Auto = identity (uncorrelated). Edit for realism."
        />
        <div className="flex gap-2">
          <Button
            onClick={() => {
              onChange(null);
              setEdit(false);
            }}
          >
            Auto
          </Button>
          <Button
            onClick={() => {
              onChange(identity(n));
              setEdit(true);
            }}
          >
            Edit
          </Button>
        </div>
      </div>

      {edit && (
        <div className="mt-2 overflow-auto">
          <div className="min-w-[520px]">
            <div
              className="grid"
              style={{ gridTemplateColumns: `140px repeat(${n}, 1fr)` }}
            >
              <div />
              {assetNames.map((nm, j) => (
                <div
                  key={j}
                  className="truncate px-2 py-1 text-xs text-zinc-400"
                >
                  {nm}
                </div>
              ))}

              {assetNames.map((rowName, i) => (
                <>
                  <div
                    key={`r-${i}`}
                    className="truncate px-2 py-2 text-xs text-zinc-400"
                  >
                    {rowName}
                  </div>
                  {assetNames.map((_, j) => (
                    <div key={`${i}-${j}`} className="px-1 py-1">
                      <Input
                        disabled={i === j}
                        type="number"
                        step="0.05"
                        value={mat[i][j]}
                        onChange={(e) => setCell(i, j, Number(e.target.value))}
                      />
                    </div>
                  ))}
                </>
              ))}
            </div>
          </div>
        </div>
      )}
    </Card>
  );
}
