"use client";

import { AdminDashboard } from "@/features/admin/components/admin-dashboard";
import { RoleGuard } from "@/features/auth/components/role-guard";

export default function AdminPage() {
  return <RoleGuard<{ name: string }> role="admin">{() => <AdminDashboard />}</RoleGuard>;
}
