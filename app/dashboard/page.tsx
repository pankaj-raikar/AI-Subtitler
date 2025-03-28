import { auth } from "@clerk/nextjs/server"
import { redirect } from "next/navigation"
import { DashboardHeader } from "@/components/dashboard/dashboard-header"
import { DashboardShell } from "@/components/dashboard/dashboard-shell"
import { JobsTable } from "@/components/dashboard/jobs-table"
import { UploadButton } from "@/components/dashboard/upload-button"
import { DashboardStats } from "@/components/dashboard/dashboard-stats"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { getUserJobs } from "@/lib/db"

export default async function DashboardPage() {
  const { userId } = await auth()

  if (!userId) {
    redirect("/sign-in")
  }

  // Get user's jobs for stats
  const jobs = await getUserJobs(userId, { limit: 100, offset: 0 })

  // Calculate stats
  const totalJobs = jobs.length
  const completedJobs = jobs.filter((job) => job.status === "completed").length
  const processingJobs = jobs.filter((job) => job.status === "processing" || job.status === "pending").length
  const failedJobs = jobs.filter((job) => job.status === "failed").length

  return (
    <DashboardShell>
      <DashboardHeader heading="Dashboard" text="Manage your subtitle generation jobs.">
        <UploadButton />
      </DashboardHeader>

      <div className="grid gap-6">
        <DashboardStats
          totalJobs={totalJobs}
          completedJobs={completedJobs}
          processingJobs={processingJobs}
          failedJobs={failedJobs}
        />

        <Tabs defaultValue="all" className="w-full">
          <TabsList className="grid grid-cols-4 md:w-auto w-full">
            <TabsTrigger value="all">All Jobs</TabsTrigger>
            <TabsTrigger value="processing">Processing</TabsTrigger>
            <TabsTrigger value="completed">Completed</TabsTrigger>
            <TabsTrigger value="failed">Failed</TabsTrigger>
          </TabsList>
          <TabsContent value="all">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle>All Jobs</CardTitle>
                <CardDescription>View all your subtitle generation jobs.</CardDescription>
              </CardHeader>
              <CardContent>
                <JobsTable />
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="processing">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle>Processing Jobs</CardTitle>
                <CardDescription>Jobs that are currently being processed.</CardDescription>
              </CardHeader>
              <CardContent>
                <JobsTable statusFilter="processing" />
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="completed">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle>Completed Jobs</CardTitle>
                <CardDescription>Jobs that have been successfully completed.</CardDescription>
              </CardHeader>
              <CardContent>
                <JobsTable statusFilter="completed" />
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="failed">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle>Failed Jobs</CardTitle>
                <CardDescription>Jobs that failed during processing.</CardDescription>
              </CardHeader>
              <CardContent>
                <JobsTable statusFilter="failed" />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardShell>
  )
}
