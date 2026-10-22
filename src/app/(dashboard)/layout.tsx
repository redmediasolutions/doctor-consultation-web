/** Signed-in staff area (doctor, pharmacy counter, owner). Each page guards its own role. */
export default function DashboardLayout({ children }: LayoutProps<"/">) {
  return <div className="flex min-h-screen flex-col bg-muted/40">{children}</div>;
}
