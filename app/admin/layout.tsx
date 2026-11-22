import { WorkspaceFrame } from "@/components/layout/workspace-frame";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <WorkspaceFrame>{children}</WorkspaceFrame>;
}
