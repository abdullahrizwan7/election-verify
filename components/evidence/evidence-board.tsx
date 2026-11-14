"use client";

import { useMemo } from "react";
import {
  Background,
  Controls,
  Handle,
  Position,
  ReactFlow,
  type Edge,
  type Node,
  type NodeProps,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { useTheme } from "next-themes";
import { cn } from "@/lib/utils";
import { EVIDENCE_KINDS } from "@/lib/labels";
import type { Claim, Evidence, Stance } from "@/lib/types";

/**
 * An "investigation board": the submission in the middle, its claims around it,
 * and every piece of evidence on the outer ring, linked by colored lines
 * (green supports, red contradicts, grey neutral). Drag, zoom, and click a card
 * to jump to that evidence in the list below.
 */

const STANCE_COLOR: Record<Stance, string> = {
  SUPPORTS: "#10b981",
  REFUTES: "#ef4444",
  NEUTRAL: "#94a3b8",
};

// Edges connect node centres, so the handles sit invisibly in the middle.
const centre = { top: "50%", left: "50%", opacity: 0, pointerEvents: "none" as const };
const Handles = () => (
  <>
    <Handle type="target" position={Position.Top} style={centre} />
    <Handle type="source" position={Position.Bottom} style={centre} />
  </>
);

type RootData = { title: string };
type ClaimData = { index: number; text: string };
type EvidenceData = { kind: string; title: string; stance: Stance | null };

function RootNode({ data }: NodeProps<Node<RootData>>) {
  return (
    <div className="w-56 rounded-2xl border border-glow/60 bg-card p-3 text-center shadow-[0_0_40px_-8px] shadow-glow/60 backdrop-blur-xl">
      <Handles />
      <p className="text-[10px] font-semibold tracking-widest text-glow uppercase">Submission</p>
      <p className="mt-1 line-clamp-3 text-xs font-medium">{data.title}</p>
    </div>
  );
}

function ClaimNode({ data }: NodeProps<Node<ClaimData>>) {
  return (
    <div className="w-48 rounded-xl border border-glow-2/50 bg-card p-2.5 shadow-[0_0_24px_-10px] shadow-glow-2/70 backdrop-blur-xl">
      <Handles />
      <p className="text-[10px] font-semibold tracking-widest text-glow-2 uppercase">Claim {data.index}</p>
      <p className="mt-0.5 line-clamp-3 text-[11px] leading-snug">{data.text}</p>
    </div>
  );
}

function EvidenceNode({ data }: NodeProps<Node<EvidenceData>>) {
  const color = data.stance ? STANCE_COLOR[data.stance] : STANCE_COLOR.NEUTRAL;
  return (
    <div
      className="w-44 cursor-pointer rounded-xl border bg-card p-2.5 backdrop-blur-xl transition hover:scale-[1.03]"
      style={{ borderColor: `${color}99`, boxShadow: `0 0 20px -10px ${color}` }}
    >
      <Handles />
      <p className="flex items-center gap-1.5 text-[9px] font-semibold tracking-wider text-muted-foreground uppercase">
        <span className="size-1.5 shrink-0 rounded-full" style={{ background: color }} />
        {data.kind}
      </p>
      <p className="mt-0.5 line-clamp-2 text-[11px] leading-snug">{data.title}</p>
    </div>
  );
}

const nodeTypes = { root: RootNode, claim: ClaimNode, evidence: EvidenceNode };

function onRing(radius: number, index: number, count: number, offset = -Math.PI / 2) {
  const angle = offset + (index / Math.max(count, 1)) * Math.PI * 2;
  return { x: Math.cos(angle) * radius, y: Math.sin(angle) * radius, angle };
}

export function EvidenceBoard({
  title,
  claims,
  evidence,
  className,
}: {
  title: string;
  claims: Claim[];
  evidence: Evidence[];
  className?: string;
}) {
  const { resolvedTheme } = useTheme();

  const { nodes, edges } = useMemo(() => {
    const nodes: Node[] = [{ id: "root", type: "root", position: { x: -112, y: -40 }, data: { title } }];
    const edges: Edge[] = [];

    // Claims on the inner ring.
    const claimAngle = new Map<string, number>();
    claims.forEach((claim, i) => {
      const { x, y, angle } = onRing(210, i, claims.length);
      claimAngle.set(claim.id, angle);
      nodes.push({ id: claim.id, type: "claim", position: { x: x - 96, y: y - 32 }, data: { index: i + 1, text: claim.text } });
      edges.push({ id: `root-${claim.id}`, source: "root", target: claim.id, type: "straight", style: { stroke: "var(--glow-2)", strokeOpacity: 0.5, strokeWidth: 1.5 } });
    });

    // Evidence on the outer ring, ordered so each item sits near its claim.
    const ordered = [...evidence].sort(
      (a, b) => (claimAngle.get(a.claimId ?? "") ?? Math.PI * 2) - (claimAngle.get(b.claimId ?? "") ?? Math.PI * 2),
    );
    ordered.forEach((item, i) => {
      const { x, y } = onRing(Math.max(380, ordered.length * 52), i, ordered.length, -Math.PI / 2 - 0.25);
      nodes.push({
        id: item.id,
        type: "evidence",
        position: { x: x - 88, y: y - 28 },
        data: { kind: EVIDENCE_KINDS[item.kind], title: item.title, stance: item.stance },
      });
      const color = item.stance ? STANCE_COLOR[item.stance] : STANCE_COLOR.NEUTRAL;
      const parent = item.claimId && claimAngle.has(item.claimId) ? item.claimId : "root";
      edges.push({
        id: `${parent}-${item.id}`,
        source: parent,
        target: item.id,
        type: "straight",
        animated: item.stance === "SUPPORTS" || item.stance === "REFUTES",
        style: { stroke: color, strokeWidth: 1.75, strokeOpacity: 0.85, strokeDasharray: item.stance && item.stance !== "NEUTRAL" ? undefined : "4 4" },
      });
    });

    return { nodes, edges };
  }, [title, claims, evidence]);

  function jumpTo(id: string) {
    const target = document.getElementById(`evidence-${id}`);
    if (!target) return;
    target.scrollIntoView({ behavior: "smooth", block: "center" });
    target.animate([{ boxShadow: "0 0 0 3px var(--glow)" }, { boxShadow: "0 0 0 0 transparent" }], { duration: 1600 });
  }

  return (
    <div className={cn("relative h-[380px] overflow-hidden rounded-xl border bg-background/40 md:h-[540px]", className)}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        colorMode={resolvedTheme === "light" ? "light" : "dark"}
        fitView
        fitViewOptions={{ padding: 0.08, maxZoom: 1.1 }}
        minZoom={0.3}
        maxZoom={1.8}
        nodesConnectable={false}
        proOptions={{ hideAttribution: true }}
        onNodeClick={(_, node) => node.type === "evidence" && jumpTo(node.id)}
        style={{ background: "transparent" }}
      >
        <Background gap={22} size={1} />
        <Controls showInteractive={false} position="bottom-right" />
      </ReactFlow>
      <div className="pointer-events-none absolute top-3 left-3 flex gap-3 rounded-lg border bg-card/80 px-2.5 py-1.5 text-[11px] backdrop-blur">
        {(Object.keys(STANCE_COLOR) as Stance[]).map((stance) => (
          <span key={stance} className="flex items-center gap-1.5">
            <span className="h-0.5 w-4 rounded-full" style={{ background: STANCE_COLOR[stance] }} />
            {stance === "SUPPORTS" ? "Supports" : stance === "REFUTES" ? "Contradicts" : "Neutral"}
          </span>
        ))}
      </div>
    </div>
  );
}
