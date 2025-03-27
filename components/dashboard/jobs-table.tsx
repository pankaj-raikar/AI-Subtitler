"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Download, FileAudio, Loader2, MoreHorizontal, Trash2, XCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Progress } from "@/components/ui/progress"
import { toast } from "@/hooks/use-toast"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useMediaQuery } from "@/hooks/use-media-query"

type JobStatus = "pending" | "processing" | "completed" | "failed"

interface Job {
  id: string
  fileName: string
  status: JobStatus
  progress: number
  language: string
  createdAt: string
  downloadUrl: string | null
  error: string | null
}

interface JobsTableProps {
  statusFilter?: string
}

export function JobsTable({ statusFilter }: JobsTableProps) {
  const [jobs, setJobs] = useState<Job[]>([])
  const [filteredJobs, setFilteredJobs] = useState<Job[]>([])
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const isMobile = useMediaQuery("(max-width: 768px)")

  useEffect(() => {
    const fetchJobs = async () => {
      try {
        const response = await fetch("/api/v1/jobs")
        if (!response.ok) throw new Error("Failed to fetch jobs")
        const data = await response.json()
        setJobs(data.jobs)
      } catch (error) {
        toast({
          title: "Error fetching jobs",
          description: "Please try again later",
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }

    fetchJobs()

    // Poll for updates every 5 seconds
    const interval = setInterval(fetchJobs, 5000)
    return () => clearInterval(interval)
  }, [])

  // Filter jobs based on status
  useEffect(() => {
    if (statusFilter && statusFilter !== "all") {
      setFilteredJobs(
        jobs.filter((job) => {
          if (statusFilter === "processing") {
            return job.status === "processing" || job.status === "pending"
          }
          return job.status === statusFilter
        }),
      )
    } else {
      setFilteredJobs(jobs)
    }
  }, [jobs, statusFilter])

  const deleteJob = async (id: string) => {
    try {
      const response = await fetch(`/api/v1/jobs/${id}`, {
        method: "DELETE",
      })

      if (!response.ok) throw new Error("Failed to delete job")

      setJobs(jobs.filter((job) => job.id !== id))
      toast({
        title: "Job deleted",
        description: "The job has been removed from your history",
      })
      router.refresh()
    } catch (error) {
      toast({
        title: "Error deleting job",
        description: "Please try again later",
        variant: "destructive",
      })
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString()
  }

  const getStatusIcon = (status: JobStatus, progress: number) => {
    switch (status) {
      case "pending":
        return <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
      case "processing":
        return <Loader2 className="h-4 w-4 animate-spin text-primary" />
      case "completed":
        return <Download className="h-4 w-4 text-green-500" />
      case "failed":
        return <XCircle className="h-4 w-4 text-destructive" />
      default:
        return null
    }
  }

  const getLanguageLabel = (code: string) => {
    const languages: Record<string, string> = {
      en: "English",
      es: "Spanish",
      fr: "French",
      de: "German",
      it: "Italian",
      pt: "Portuguese",
      ru: "Russian",
      ja: "Japanese",
      ko: "Korean",
      zh: "Chinese",
      ar: "Arabic",
      hi: "Hindi",
      bn: "Bengali",
      ur: "Urdu",
    }
    return languages[code] || code
  }

  const handleDownload = async (url: string, filename: string) => {
    try {
      const response = await fetch(url)
      const blob = await response.blob()
      const downloadUrl = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = downloadUrl
      link.download = filename
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(downloadUrl)
    } catch (error) {
      toast({
        title: "Error downloading file",
        description: "Please try again later",
        variant: "destructive",
      })
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (filteredJobs.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-8 text-center">
        <FileAudio className="h-10 w-10 text-muted-foreground" />
        <h3 className="mt-4 text-lg font-semibold">No jobs found</h3>
        <p className="mt-2 text-sm text-muted-foreground">
          {statusFilter ? `No ${statusFilter} jobs found.` : "Upload a file to start generating subtitles."}
        </p>
      </div>
    )
  }

  // Mobile view
  if (isMobile) {
    return (
      <div className="space-y-4">
        {filteredJobs.map((job) => (
          <Card key={job.id} className="overflow-hidden">
            <CardHeader className="p-4">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base truncate max-w-[200px]">{job.fileName}</CardTitle>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon">
                      <MoreHorizontal className="h-4 w-4" />
                      <span className="sr-only">Open menu</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    {job.status === "completed" && (
                      <DropdownMenuItem onClick={() => handleDownload(job.downloadUrl || "#", `${job.fileName.replace(/\.[^/.]+$/, "")}.srt`)}>
                        <Download className="mr-2 h-4 w-4" />
                        Download SRT
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuItem onClick={() => deleteJob(job.id)}>
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </CardHeader>
            <CardContent className="p-4 pt-0 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {getStatusIcon(job.status, job.progress)}
                  <span className="capitalize">{job.status}</span>
                </div>
                <Badge variant="outline">{getLanguageLabel(job.language || "en")}</Badge>
              </div>

              {job.status === "processing" && (
                <div className="space-y-1">
                  <Progress value={job.progress} className="h-2" />
                  <p className="text-xs text-right text-muted-foreground">{job.progress}%</p>
                </div>
              )}

              <p className="text-xs text-muted-foreground">Created: {formatDate(job.createdAt)}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  // Desktop view
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>File Name</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Language</TableHead>
          <TableHead>Progress</TableHead>
          <TableHead>Created</TableHead>
          <TableHead className="text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {filteredJobs.map((job) => (
          <TableRow key={job.id}>
            <TableCell className="font-medium">{job.fileName}</TableCell>
            <TableCell>
              <div className="flex items-center gap-2">
                {getStatusIcon(job.status, job.progress)}
                <span className="capitalize">{job.status}</span>
              </div>
            </TableCell>
            <TableCell>
              <Badge variant="outline">{getLanguageLabel(job.language || "en")}</Badge>
            </TableCell>
            <TableCell>
              {job.status === "processing" ? (
                <div className="w-[100px]">
                  <Progress value={job.progress} className="h-2" />
                </div>
              ) : job.status === "completed" ? (
                "100%"
              ) : job.status === "failed" ? (
                <span className="text-destructive">Failed</span>
              ) : (
                "Pending"
              )}
            </TableCell>
            <TableCell>{formatDate(job.createdAt)}</TableCell>
            <TableCell className="text-right">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <MoreHorizontal className="h-4 w-4" />
                    <span className="sr-only">Open menu</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {job.status === "completed" && (
                    <DropdownMenuItem onClick={() => handleDownload(job.downloadUrl || "#", `${job.fileName.replace(/\.[^/.]+$/, "")}.srt`)}>
                      <Download className="mr-2 h-4 w-4" />
                      Download SRT
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuItem onClick={() => deleteJob(job.id)}>
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}

