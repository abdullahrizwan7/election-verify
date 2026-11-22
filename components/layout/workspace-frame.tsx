import { Suspense } from "react";
import { WorkspaceDock } from "@/components/layout/workspace-dock";

/** Wraps reviewer and admin pages: the dark dock on the left, content beside it. */
export function WorkspaceFrame({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Suspense fallback={null}>
        <WorkspaceDock />
      </Suspense>
      <div className="md:pl-[84px]">{children}</div>
    </>
  );
}
