import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { SAMPLE_CHAINAGE_CSV } from "@/lib/rams/csv-import";
import { useRams } from "@/lib/rams/store";

export function ChainageImportPanel() {
  const roads = useRams((s) => s.roads);
  const importChainageCsv = useRams((s) => s.importChainageCsv);
  const [text, setText] = useState("");
  const [roadId, setRoadId] = useState<string>("auto");

  function onFile(file: File | null) {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setText(String(reader.result ?? ""));
    };
    reader.readAsText(file);
  }

  function apply() {
    const res = importChainageCsv(text, roadId === "auto" ? undefined : roadId);
    if (res.ok) toast.success(res.message);
    else toast.error(res.message);
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Import chainage GPS</CardTitle>
        <CardDescription>
          CSV with columns <code className="text-xs">chainage_km, lat, lng</code> (optional{" "}
          <code className="text-xs">road_code</code>). Replaces corridor alignment and refreshes
          section polylines for the full road centreline.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        <div className="flex flex-wrap gap-2">
          <Label className="sr-only" htmlFor="gps-file">
            CSV file
          </Label>
          <InputFile id="gps-file" onChange={onFile} />
          <Button type="button" variant="outline" size="sm" onClick={() => setText(SAMPLE_CHAINAGE_CSV)}>
            Load A1 sample
          </Button>
        </div>
        <div>
          <Label htmlFor="target-road">Target corridor</Label>
          <Select value={roadId} onValueChange={setRoadId}>
            <SelectTrigger id="target-road" className="mt-1">
              <SelectValue placeholder="Auto-match" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="auto">Auto-match by span / road_code</SelectItem>
              {roads.map((r) => (
                <SelectItem key={r.id} value={r.id}>
                  {r.code} — {r.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={"chainage_km,lat,lng,road_code\n0,8.905,38.762,A1\n..."}
          className="min-h-32 font-mono text-xs"
        />
        <Button type="button" onClick={apply} disabled={text.trim().length < 10}>
          Apply GPS to network
        </Button>
      </CardContent>
    </Card>
  );
}

function InputFile({
  id,
  onChange,
}: {
  id: string;
  onChange: (f: File | null) => void;
}) {
  return (
    <input
      id={id}
      type="file"
      accept=".csv,text/csv,text/plain"
      className="block max-w-full text-sm text-muted file:mr-3 file:rounded-md file:border-0 file:bg-primary file:px-3 file:py-2 file:text-sm file:font-medium file:text-primary-fg"
      onChange={(e) => onChange(e.target.files?.[0] ?? null)}
    />
  );
}
