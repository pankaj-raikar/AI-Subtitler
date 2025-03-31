'use client'; // Ensure this directive is present

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation"; // Assuming Next.js router
import { useMediaQuery } from "@/hooks/use-media-query"; // Assuming custom hook
import { useToast } from "@/hooks/use-toast"; // Use the hook from the original file
import { Loader2, Download, XCircle, MoreHorizontal, CheckCircle, Clock, AlertCircle, Trash } from "lucide-react"; // Import original icons
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils"; // Import cn utility
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from "@/components/ui/context-menu"; // Import context menu
import FormattedDate from "./FormattedDate"; // Import FormattedDate

// Define types based on the provided new code structure
type JobStatus = "pending" | "processing" | "completed" | "failed";

interface Job {
  id: string;
  fileName: string;
  status: JobStatus;
  progress: number;
  language: string;
  createdAt: string;
  downloadUrl: string | null;
  error: string | null;
}

// Use the props interface name from the original file if preferred, but keep the structure from the new code
interface JobsListProps { // Renamed back from JobsTableProps
  statusFilter?: string; // Make statusFilter optional
}

export default function JobsList({ statusFilter }: JobsListProps) { // Renamed component back
  const [jobs, setJobs] = useState<Job[]>([]);
  const [filteredJobs, setFilteredJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const isMobile = useMediaQuery("(max-width: 768px)");
  const { toast } = useToast(); // Use the hook as in the original file

  // Fetch jobs effect (from new code)
  useEffect(() => {
    const fetchJobs = async () => {
      try {
        const response = await fetch("/api/v1/jobs");
        if (!response.ok) throw new Error("Failed to fetch jobs");
        const data = await response.json();
        setJobs(data.jobs);

      } catch (error) {
        toast({
          title: "Error fetching jobs",
          description: "Please try again later",
          variant: "destructive",
        });
      } finally {
        if (loading) setLoading(false);
      }
    };

    fetchJobs();
    const interval = setInterval(fetchJobs, 5000);
    return () => clearInterval(interval);
  }, [loading, toast]); // Added toast dependency

  // Filter jobs effect (from new code)
  useEffect(() => {
    let currentStatusFilter = statusFilter?.toLowerCase(); // Use lowercase for comparison
    if (currentStatusFilter && currentStatusFilter !== "all jobs") { // Match original "All Jobs" tab name
       setFilteredJobs(
         jobs.filter((job) => {
           if (currentStatusFilter === "processing") {
             // Include 'pending' in 'processing' filter
             return job.status === "processing" || job.status === "pending";
           }
           // Handle potential mismatch like "completed" vs "complete" if needed
           return job.status === (currentStatusFilter as JobStatus);
         })
       );
     } else {
       setFilteredJobs(jobs);
     }
  }, [jobs, statusFilter]);

  // Delete job function (adapted from new code, using original toast message)
  const deleteJob = async (id: string, filename: string) => { // Added filename for toast
    try {
      const response = await fetch(`/api/v1/jobs/${id}`, {
        method: "DELETE",
      });
      if (!response.ok) throw new Error("Failed to delete job");

      setJobs((prevJobs) => prevJobs.filter((job) => job.id !== id));
      toast({
        title: "Job deleted",
        description: `"${filename}" has been removed`, // Original toast message
      });
      // router.refresh(); // Optional: depends if server state needs refresh
    } catch (error) {
      toast({
        title: "Error deleting job",
        description: "Please try again later.",
        variant: "destructive",
      });
    }
  };

  // Format date function (using original FormattedDate component)
  // const formatDate = (dateString: string) => {
  //   return new Date(dateString).toLocaleString();
  // };
  // No need for formatDate function if using FormattedDate component

  // Get language label function (from new code)
  const getLanguageLabel = (code: string) => {
    const languages: Record<string, string> = {
      en: "English", es: "Spanish", fr: "French", de: "German", it: "Italian",
      pt: "Portuguese", ru: "Russian", ja: "Japanese", ko: "Korean", zh: "Chinese",
      ar: "Arabic", hi: "Hindi", bn: "Bengali", ur: "Urdu",
    };
    return languages[code] || code.toUpperCase();
  };

  // Handle download function (adapted from new code, using original toast message)
  const handleDownload = async (url: string | null, filename: string) => {
    if (!url) {
        toast({ title: "Download unavailable", description: "No download link found.", variant: "destructive" });
        return;
    }
    try {
      const response = await fetch(url);
      if (!response.ok) throw new Error(`Failed to fetch file: ${response.statusText}`);
      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = filename.includes('.') ? filename : `${filename}.srt`; // Add .srt if no extension
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(downloadUrl);
      toast({ // Use original toast message structure
        title: "Download started",
        description: `Downloading subtitles for ${filename}`,
      });
    } catch (error: any) {
      toast({
        title: "Error downloading file",
        description: error.message || "Please try again later.",
        variant: "destructive",
      });
    }
  };

  // Loading state UI (from new code)
  if (loading) {
    return (
      <div className="flex justify-center items-center p-8 h-40">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Determine active tab title based on statusFilter (similar to original logic)
  const activeTabTitle = !statusFilter || statusFilter.toLowerCase() === 'all jobs'
    ? "All Jobs"
    : statusFilter.charAt(0).toUpperCase() + statusFilter.slice(1);

  // Main component render (using original structure with new data/logic)
  return (
    <div className="card-dashboard mt-6">
      <div className="mb-4">
        <h2 className="text-xl font-bold">{activeTabTitle}</h2>
        <p className="text-sm text-muted-foreground">
          {activeTabTitle === "All Jobs"
            ? "View all your subtitle generation jobs."
            : `View your ${activeTabTitle.toLowerCase()} subtitle generation jobs.`}
        </p>
      </div>

      <div className="overflow-x-auto">
        {/* Header row from original */}
        <div className="job-item font-medium text-xs uppercase text-muted-foreground">
          <div className="col-span-4 md:col-span-4">File Name</div>
          <div className="col-span-2 md:col-span-2 text-center">Status</div>
          <div className="col-span-2 md:col-span-2 text-center">Language</div>
          <div className="col-span-1 md:col-span-1 text-center">Progress</div>
          <div className="col-span-2 md:col-span-2 text-center">Created</div>
          <div className="col-span-1 md:col-span-1 text-center">Actions</div>
        </div>

        {filteredJobs.map((job) => (
          <ContextMenu key={job.id}>
            <ContextMenuTrigger>
              {/* Job item row structure from original */}
              <div className="job-item">
                <div className="col-span-4 md:col-span-4 truncate">
                  {job.fileName}
                  {job.error && (
                    <span
                      className="ml-1 text-xs text-destructive"
                      title={job.error}
                    >
                      {" "}
                      (Error)
                    </span>
                  )}
                </div>
                <div className="col-span-2 md:col-span-2 flex justify-center">
                  {/* Use original StatusBadge component */}
                  <StatusBadge status={job.status} />
                </div>
                <div className="col-span-2 md:col-span-2 text-center">
                  <span className="bg-secondary px-2 py-1 rounded text-xs">
                    {getLanguageLabel(job.language)}{" "}
                    {/* Use new language label function */}
                  </span>
                </div>
                <div className="col-span-1 md:col-span-1 text-center">
                  {/* Display progress for all statuses */}
                  {job.progress}%
                </div>
                <div className="col-span-2 md:col-span-2 text-center text-muted-foreground text-xs">
                  {/* Use original FormattedDate component */}
                  <FormattedDate dateString={job.createdAt} />
                </div>
                <div className="col-span-1 md:col-span-1 flex justify-center space-x-1">
                  {/* Use original Download button */}
                  {job.status === "completed" && job.downloadUrl && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() =>
                        handleDownload(
                          job.downloadUrl || "#",
                          `${job.fileName.replace(/\.[^/.]+$/, "")}.srt`
                        )
                      }
                      title="Download SRT"
                    >
                      <Download size={16} />
                    </Button>
                  )}
                  {/* Use original Delete button */}
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-destructive hover:text-destructive"
                    onClick={() => deleteJob(job.id, job.fileName)}
                    title="Delete job"
                  >
                    <Trash size={16} />
                  </Button>
                </div>
              </div>
            </ContextMenuTrigger>
            {/* Context Menu from original, adapted for new logic */}
            <ContextMenuContent>
              {job.status === "completed" && job.downloadUrl && (
                <ContextMenuItem
                  onClick={() =>
                    handleDownload(
                      job.downloadUrl || "#",
                      `${job.fileName.replace(/\.[^/.]+$/, "")}.srt`
                    )
                  }
                  className="flex gap-2 items-center"
                >
                  <Download size={16} />
                  <span>Download SRT</span>
                </ContextMenuItem>
              )}
              <ContextMenuItem
                onClick={() => deleteJob(job.id, job.fileName)}
                className="flex gap-2 items-center text-destructive"
              >
                <Trash size={16} />
                <span>Delete</span>
              </ContextMenuItem>
            </ContextMenuContent>
          </ContextMenu>
        ))}

        {/* Empty state from original */}
        {filteredJobs.length === 0 && (
          <div className="py-12 text-center text-muted-foreground">
            No jobs found
            {statusFilter && statusFilter !== "all jobs"
              ? ` for status: ${statusFilter}`
              : ""}
            .
          </div>
        )}
      </div>
    </div>
  );
}

// StatusBadge component from original file (ensure types match)
function StatusBadge({ status }: { status: JobStatus }) { // Use JobStatus type
  const getStatusColors = () => {
    switch (status) {
      case "completed":
        return {
          bg: "bg-green-100 dark:bg-green-900/20",
          text: "text-green-700 dark:text-green-400",
          icon: <CheckCircle className="h-3.5 w-3.5 mr-1" />
        };
      case "processing": // Covers 'processing' and 'pending' from new logic filter perspective
      case "pending":
        return {
          bg: "bg-blue-100 dark:bg-blue-900/20",
          text: "text-blue-700 dark:text-blue-400",
          // Show clock for pending/processing
          icon: <Clock className="h-3.5 w-3.5 mr-1" />
        };
      case "failed":
        return {
          bg: "bg-red-100 dark:bg-red-900/20",
          text: "text-red-700 dark:text-red-400",
          icon: <AlertCircle className="h-3.5 w-3.5 mr-1" />
        };
      default: // Should not happen with JobStatus type, but good practice
        return {
          bg: "bg-gray-100 dark:bg-gray-800",
          text: "text-gray-700 dark:text-gray-400",
          icon: null
        };
    }
  };

  const { bg, text, icon } = getStatusColors();

  return (
    <span
      className={cn(
        "inline-flex items-center px-2 py-1 rounded text-xs capitalize",
        bg,
        text
      )}
    >
      {icon}
      {status}
    </span>
  );
}
