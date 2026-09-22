import { useEffect, useState } from "react";
import type { Asset, Defect, Road, Section } from "@/lib/rams/types";

type Props = {
  roads: Road[];
  sections: Section[];
  defects: Defect[];
  assets: Asset[];
  showRoads: boolean;
  showDefects: boolean;
  showAssets: boolean;
  showChainages?: boolean;
  basemap?: "streets" | "satellite";
  onSectionClick?: (sectionId: string, roadId: string) => void;
  height?: number;
};

export function NetworkMap(props: Props) {
  const [Inner, setInner] = useState<null | typeof import("./network-map-inner").NetworkMapInner>(
    null,
  );

  useEffect(() => {
    let live = true;
    import("./network-map-inner").then((m) => {
      if (live) setInner(() => m.NetworkMapInner);
    });
    return () => {
      live = false;
    };
  }, []);

  if (!Inner) {
    return (
      <div
        className="flex items-center justify-center rounded-lg bg-surface-2 text-sm text-muted"
        style={{ height: props.height ?? 520 }}
      >
        Loading map…
      </div>
    );
  }
  return <Inner {...props} />;
}
