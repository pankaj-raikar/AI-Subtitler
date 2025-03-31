'use client';

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation"; // Import useRouter
import { type FileRejection, useDropzone } from "react-dropzone";
import { X, Upload, FileAudio } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";

interface UploadDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onUpload: (file: File, language: string) => void; // Prop to notify parent when upload starts
}

// Language options
const LANGUAGES = [
  { value: "en", label: "English" },
  { value: "es", label: "Spanish" },
  { value: "fr", label: "French" },
  { value: "de", label: "German" },
  { value: "it", label: "Italian" },
  { value: "pt", label: "Portuguese" },
  { value: "ru", label: "Russian" },
  { value: "ja", label: "Japanese" },
  { value: "ko", label: "Korean" },
  { value: "zh", label: "Chinese" },
  { value: "ar", label: "Arabic" },
  { value: "hi", label: "Hindi" },
  { value: "bn", label: "Bengali" },
  { value: "ur", label: "Urdu" },
];

export default function UploadDialog({ isOpen, onClose, onUpload }: UploadDialogProps) {
  const [file, setFile] = useState<File | null>(null);
  const [language, setLanguage] = useState("en");
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const { toast } = useToast();
  const router = useRouter(); // Get router instance

  // Resets the state
  const resetState = useCallback(() => {
    setFile(null);
    setLanguage("en");
    setUploading(false);
    setProgress(0);
  }, []);

  // Handles closing the dialog
  const handleClose = () => {
    if (!uploading) {
      resetState();
      onClose();
    }
  };

  // Handles file drop
  const onDrop = useCallback((acceptedFiles: File[], rejectedFiles: FileRejection[]) => {
    if (rejectedFiles.length > 0) {
      const errors = rejectedFiles[0].errors.map((e) => e.message).join(", ");
      toast({ title: "File upload error", description: errors, variant: "destructive" });
      setFile(null);
      return;
    }
    if (acceptedFiles.length > 0) {
      setFile(acceptedFiles[0]);
      setProgress(0);
    }
  }, [toast]);

  // Configure dropzone
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    maxFiles: 1,
    maxSize: 2 * 1024 * 1024 * 1024, // 2GB
    accept: {
      "video/mp4": [".mp4"], "video/x-msvideo": [".avi"],
      "audio/wav": [".wav"], "audio/mpeg": [".mp3"],
    },
    disabled: uploading,
  });

  // Handles the upload using XMLHttpRequest for progress tracking
  const handleUpload = () => {
    if (!file) return;

    setUploading(true);
    setProgress(0);

    // Notify parent component immediately
    onUpload(file, language);

    const xhr = new XMLHttpRequest();
    const formData = new FormData();
    formData.append("file", file);
    formData.append("language", language);

    // Progress event listener
    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable) {
        const percentComplete = Math.round((event.loaded / event.total) * 100);
        setProgress(percentComplete);
      }
    };

    // Success event listener
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        setProgress(100); // Ensure progress hits 100
        toast({ title: "Upload Successful", description: `${file.name} is now being processed.` });
        router.refresh(); // Refresh the page data on success
        setTimeout(() => { // Close after a short delay
          resetState();
          onClose();
        }, 500);
      } else {
        // Handle server-side errors
        let errorMsg = "Upload failed. Please try again.";
        try {
          const errorData = JSON.parse(xhr.responseText);
          errorMsg = errorData.error || errorMsg;
        } catch (e) {
          // Ignore JSON parse error
        }
        toast({ title: "Upload Failed", description: errorMsg, variant: "destructive" });
        setUploading(false); // Allow retry
        setProgress(0);
      }
    };

    // Error event listener
    xhr.onerror = () => {
      toast({ title: "Upload Failed", description: "Network error occurred.", variant: "destructive" });
      setUploading(false);
      setProgress(0);
    };

    // Abort event listener
    xhr.onabort = () => {
      toast({ title: "Upload Aborted", variant: "destructive" });
      setUploading(false);
      setProgress(0);
    };

    // Configure and send the request
    xhr.open("POST", "/api/v1/convert", true);
    // Note: Don't set Content-Type header for FormData, browser does it.
    xhr.send(formData);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex justify-center items-center p-4">
      <div className="bg-card rounded-lg shadow-lg max-w-md w-full overflow-hidden">
        {/* Header */}
        <div className="flex justify-between items-center p-4 border-b border-border">
          <h2 className="text-lg font-semibold">Upload Media File</h2>
          <Button variant="ghost" size="icon" onClick={handleClose} disabled={uploading} className="p-1 rounded-full hover:bg-secondary disabled:opacity-50">
            <X size={20} />
          </Button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4">
          {/* Dropzone / File Info */}
          {!file ? (
            <div
              {...getRootProps()}
              className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
                isDragActive ? "border-primary bg-primary/10" : "border-border hover:border-primary/50"
              } ${uploading ? "cursor-not-allowed opacity-50" : ""}`}
            >
              <input {...getInputProps()} />
              <Upload className="h-10 w-10 mx-auto text-muted-foreground mb-2" />
              <p className="text-sm font-medium">{isDragActive ? "Drop the file here" : "Drag & drop or click to select"}</p>
              <p className="text-xs text-muted-foreground mt-1">MP4, AVI, WAV, MP3 (max 2GB)</p>
            </div>
          ) : (
            <div className="border rounded-lg p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3 overflow-hidden">
                  <FileAudio className="h-6 w-6 text-primary flex-shrink-0" />
                  <div className="space-y-1 overflow-hidden">
                    <p className="text-sm font-medium truncate" title={file.name}>{file.name}</p>
                    <p className="text-xs text-muted-foreground">{(file.size / (1024 * 1024)).toFixed(2)} MB</p>
                  </div>
                </div>
                <Button variant="ghost" size="icon" onClick={() => setFile(null)} disabled={uploading} className="disabled:opacity-50">
                  <X className="h-4 w-4" />
                </Button>
              </div>
              {/* Progress Bar */}
              {uploading && (
                <div className="space-y-1 pt-2">
                  <Progress value={progress} className="h-2 w-full" />
                  <p className="text-xs text-right text-muted-foreground">{progress}%</p>
                </div>
              )}
            </div>
          )}

          {/* Language Selector */}
          <div className="space-y-2">
            <Label htmlFor="language-select">Audio Language</Label>
            <Select value={language} onValueChange={setLanguage} disabled={uploading || !file}>
              <SelectTrigger id="language-select" className="w-full disabled:opacity-50 disabled:cursor-not-allowed">
                <SelectValue placeholder="Select language" />
              </SelectTrigger>
              <SelectContent>
                {LANGUAGES.map((lang) => (
                  <SelectItem key={lang.value} value={lang.value}>
                    {lang.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">Select the primary language spoken in the audio.</p>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-border bg-muted/30">
          <Button
            onClick={handleUpload}
            disabled={!file || uploading}
            className="w-full"
          >
            {uploading ? `Uploading... (${progress}%)` : "Start Processing"}
          </Button>
        </div>
      </div>
    </div>
  );
}
