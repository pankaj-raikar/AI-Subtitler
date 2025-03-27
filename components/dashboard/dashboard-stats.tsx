import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { FileCheck, FileX, Loader2, Files } from "lucide-react"

interface DashboardStatsProps {
  totalJobs: number
  completedJobs: number
  processingJobs: number
  failedJobs: number
}

export function DashboardStats({ totalJobs, completedJobs, processingJobs, failedJobs }: DashboardStatsProps) {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Jobs</CardTitle>
          <Files className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{totalJobs}</div>
          <p className="text-xs text-muted-foreground">Total subtitle generation jobs</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Completed</CardTitle>
          <FileCheck className="h-4 w-4 text-green-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{completedJobs}</div>
          <p className="text-xs text-muted-foreground">Successfully completed jobs</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Processing</CardTitle>
          <Loader2 className="h-4 w-4 text-blue-500 animate-spin" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{processingJobs}</div>
          <p className="text-xs text-muted-foreground">Jobs currently in progress</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Failed</CardTitle>
          <FileX className="h-4 w-4 text-destructive" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{failedJobs}</div>
          <p className="text-xs text-muted-foreground">Jobs that failed to process</p>
        </CardContent>
      </Card>
    </div>
  )
}

