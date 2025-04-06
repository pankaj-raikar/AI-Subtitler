"use client";

import { useState, useCallback } from "react"; // Added useCallback
import { useRouter } from "next/navigation"; // Import useRouter
import {
  FileText,
  CheckCircle,
  Clock,
  AlertCircle,
  Upload,
} from "lucide-react";
import { UserButton } from "@clerk/clerk-react";
import Sidebar from "@/components/dashboard/Sidebar";
import StatCard from "@/components/dashboard/StatCard";
import TabNavigation from "@/components/dashboard/TabNavigation";
import JobsList from "@/components/dashboard/JobsList";
import UploadDialog from "@/components/dashboard/UploadDialog";
import { useToast } from "@/hooks/use-toast";

const tabs = ["All Jobs", "Processing", "Completed", "Failed"];

interface DashboardClientProps {
  initialJobs: any[]; // Replace 'any' with your job type if available
}

export default function DashboardClient({ initialJobs }: DashboardClientProps) {
  const [activeTab, setActiveTab] = useState("All Jobs");
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false);
  // Use initialJobs for the initial state, router.refresh() will update data later
  const [jobsList, setJobsList] = useState(initialJobs);
  const { toast } = useToast();
  const router = useRouter(); // Get router instance

  // Calculate stats based on the current jobsList state
  // Add null checks in case job properties are missing
  const completedJobs = jobsList.filter((job) => job?.status === "completed").length;
  const processingJobs = jobsList.filter(
    (job) => job?.status === "processing" || job?.status === "pending"
  ).length;
  const failedJobs = jobsList.filter((job) => job?.status === "failed").length;

  

  // Handler called by UploadDialog when upload *starts*
  const handleUploadStarted = useCallback((file: File, language: string) => {
    // Optional: Show an initial toast notification
    toast({
      title: "Upload Initiated",
      description: `Uploading ${file.name}...`,
    });
    // No direct state updates here. router.refresh() in UploadDialog handles list update.
  }, [toast]);

  // Handler for deleting a job
  const handleDeleteJob = useCallback(async (jobId: string) => {
    // Optional: Add confirmation dialog here

    try {
      const response = await fetch(`/api/v1/jobs/${jobId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Failed to delete job with status: ${response.status}`);
      }

      toast({
        title: "Job Deleted",
        description: `Job ${jobId} has been successfully deleted. Refreshing list...`,
      });

      // Refresh data after successful deletion
      router.refresh();

    } catch (err) {
      console.error("Delete error:", err);
      toast({
        title: "Deletion Failed",
        description: err instanceof Error ? err.message : "An unknown error occurred during deletion",
        variant: "destructive",
      });
      // Optionally refresh even on failure
      // router.refresh();
    }
  }, [router, toast]); // Add dependencies

  // Common UserButton appearance config
  const userButtonAppearance = {
    elements: {
      userButtonAvatarBox: "w-8 h-8",
      userButtonPopoverCard:
        "border border-border bg-background shadow-md rounded-lg",
      userButtonPopoverFooter: "border-t border-border",
      userButtonPopoverActions: "p-3",
    },
  };

  // Note: We are still passing initialJobs to JobsList.
  // router.refresh() should trigger a re-render with fresh data from the server component.
  // If JobsList needs to update *optimistically* or based on client-side state changes
  // after the initial load, further state management adjustments might be needed.
  return (
    <div className="flex flex-col min-h-screen bg-background">
      <Sidebar />

      <header className="fixed top-0 left-0 right-0 h-12 bg-background border-b border-border z-10 px-4 md:px-8 md:left-64">
        <div className="flex items-center justify-between h-full">
          <h1 className="text-lg font-bold">Ai Subtitler</h1>
          <div className="hidden md:block">
            <h1 className="text-lg font-bold">Dashboard</h1>
          </div>
          <UserButton appearance={userButtonAppearance} />
        </div>
      </header>

      <main className="flex-1 p-6 md:p-8 w-full md:pl-72 mt-12 space-y-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6">
            <div className="mt-2">
              <h1 className="text-xl sm:text-2xl font-bold md:hidden">
                Dashboard
              </h1>
              <p className="text-sm text-muted-foreground">
                Manage your subtitle generation jobs.
              </p>
            </div>
            <nav className="flex items-center w-full sm:w-auto">
              <button
                onClick={() => setIsUploadDialogOpen(true)}
                className="flex items-center justify-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 w-full sm:w-auto"
              >
                <Upload size={18} />
                <span>Upload File</span>
              </button>
            </nav>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <StatCard
              title="Total Jobs"
              value={jobsList.length} // Display length of current list
              description="Total subtitle generation jobs"
              icon={FileText}
              iconColor="text-foreground"
            />
            <StatCard
              title="Completed"
              value={completedJobs}
              description="Successfully completed jobs"
              icon={CheckCircle}
              iconColor="text-green-500"
            />
            <StatCard
              title="Processing"
              value={processingJobs}
              description="Jobs currently in progress"
              icon={Clock}
              iconColor="text-blue-500"
            />
            <StatCard
              title="Failed"
              value={failedJobs}
              description="Jobs that failed to process"
              icon={AlertCircle}
              iconColor="text-red-500"
            />
          </div>

          <TabNavigation
            tabs={tabs}
            activeTab={activeTab}
            onTabChange={setActiveTab}
          />

          <JobsList
            statusFilter={activeTab}
            onDeleteJob={handleDeleteJob} // Pass the correct delete handler
          />
        </div>
      </main>

      <UploadDialog
        isOpen={isUploadDialogOpen}
        onClose={() => setIsUploadDialogOpen(false)}
        onUpload={handleUploadStarted} // Pass the correct upload handler
      />
    </div>
  );
}
