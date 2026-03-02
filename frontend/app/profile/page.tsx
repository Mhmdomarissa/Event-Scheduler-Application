"use client";

import { format } from "date-fns";
import { Mail, User, Shield, CalendarDays, CheckCircle } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/features/auth/AuthProvider";
import { LoadingSkeleton } from "@/components/shared/LoadingSkeleton";

export default function ProfilePage() {
  const { user, firebaseUser, loading } = useAuth();

  if (loading) {
    return (
      <AppShell>
        <div className="p-8">
          <LoadingSkeleton variant="page" />
        </div>
      </AppShell>
    );
  }

  const initials = user?.displayName
    ? user.displayName.slice(0, 2).toUpperCase()
    : user?.email?.slice(0, 2).toUpperCase() ?? "?";

  const isAdmin = user?.role === "admin";

  return (
    <AppShell>
      <div className="container mx-auto max-w-2xl px-4 py-8 space-y-6">
        <h1 className="text-3xl font-bold tracking-tight">Profile</h1>

        <Card>
          <CardHeader className="flex flex-row items-center gap-4">
            <Avatar className="size-16">
              <AvatarFallback className="text-xl bg-primary/10 text-primary font-semibold">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div className="space-y-1">
              <CardTitle className="text-xl flex items-center gap-2">
                {user?.displayName || "Unnamed User"}
                {isAdmin && (
                  <Badge variant="default" className="ml-1 gap-1">
                    <Shield className="size-3" /> Admin
                  </Badge>
                )}
              </CardTitle>
              <p className="text-sm text-muted-foreground">{user?.email}</p>
            </div>
          </CardHeader>

          <Separator />

          <CardContent className="pt-6 space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <InfoRow icon={User} label="Display Name" value={user?.displayName ?? "—"} />
              <InfoRow icon={Mail} label="Email" value={user?.email ?? "—"} />
              <InfoRow
                icon={Shield}
                label="Role"
                value={
                  <Badge variant={isAdmin ? "default" : "secondary"} className="capitalize">
                    {user?.role ?? "member"}
                  </Badge>
                }
              />
              <InfoRow
                icon={CheckCircle}
                label="Account Status"
                value={
                  <Badge variant={user?.isActive ? "default" : "destructive"}>
                    {user?.isActive ? "Active" : "Deactivated"}
                  </Badge>
                }
              />
              <InfoRow
                icon={CalendarDays}
                label="Member Since"
                value={user?.createdAt ? format(new Date(user.createdAt), "MMMM d, yyyy") : "—"}
              />
              <InfoRow
                icon={CalendarDays}
                label="Auth Provider"
                value={firebaseUser?.providerData?.[0]?.providerId === "google.com" ? "Google" : "Email / Password"}
              />
            </div>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}

function InfoRow({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="flex items-start gap-3">
      <Icon className="size-4 mt-0.5 text-muted-foreground shrink-0" />
      <div>
        <p className="text-xs text-muted-foreground">{label}</p>
        <div className="text-sm font-medium">{value}</div>
      </div>
    </div>
  );
}
