import { Suspense } from "react";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { getUserJobs } from "@/lib/db";
import DashboardClient from "@/app/dashboard/dashboard-client";

export default async function DashboardPage() {
  const { userId } = await auth();

  if (!userId) {
    redirect("/sign-in");
  }

  // Get user's jobs for stats
  const initialJobs = await getUserJobs(userId, { limit: 100, offset: 0 });

  return (
    <Suspense fallback={<div>Loading...</div>}>
      <DashboardClient initialJobs={initialJobs} />
    </Suspense>
  );
}

