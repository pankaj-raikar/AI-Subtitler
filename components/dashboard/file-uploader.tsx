"use client"

import { useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import { type FileRejection, useDropzone } from "react-dropzone"
import { FileAudio, Upload, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { toast } from "@/hooks/use-toast"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"

interface FileUploaderProps {
  onSuccess?: () => void
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
]

export function FileUploader({ onSuccess }: FileUploaderProps) {
  const [file, setFile] = useState<File | null>(null)
  const [language, setLanguage] = useState("en")
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState(0)
  const router = useRouter()

  const onDrop = useCallback((acceptedFiles: File[], rejectedFiles: FileRejection[]) => {
    if (rejectedFiles.length > 0) {
      const errors = rejectedFiles[0].errors.map((e) => e.message).join(", ")
      toast({
        title: "File upload failed",
        description: errors,
        variant: "destructive",
      })
      return
    }

    if (acceptedFiles.length > 0) {
      setFile(acceptedFiles[0])
    }
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    maxFiles: 1,
    maxSize: 2 * 1024 * 1024 * 1024, // 2GB
    accept: {
      "video/mp4": [".mp4"],
      "video/x-msvideo": [".avi"],
      "audio/wav": [".wav"],
      "audio/mpeg": [".mp3"],
    },
  })

  const handleUpload = async () => {
    if (!file) return

    setUploading(true)
    setProgress(0)

    // Simulate progress
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 95) {
          clearInterval(interval)
          return prev
        }
        return prev + 5
      })
    }, 500)

    try {
      const formData = new FormData()
      formData.append("file", file)
      formData.append("language", language)

      const response = await fetch("/api/v1/convert", {
        method: "POST",
        body: formData,
      })

      if (!response.ok) {
        throw new Error("Upload failed")
      }

      const data = await response.json()

      clearInterval(interval)
      setProgress(100)

      toast({
        title: "File uploaded successfully",
        description: "Your file is now being processed.",
      })

      if (onSuccess) {
        onSuccess()
      }

      router.refresh()
    } catch (error) {
      clearInterval(interval)
      toast({
        title: "Upload failed",
        description: error instanceof Error ? error.message : "An unknown error occurred",
        variant: "destructive",
      })
    } finally {
      setUploading(false)
    }
  }

  const resetFile = () => {
    setFile(null)
    setProgress(0)
  }

  return (
    <div className="space-y-4">
      {!file ? (
        <div
          {...getRootProps()}
          className={`border-2 border-dashed rounded-lg p-4 sm:p-6 text-center cursor-pointer transition-colors ${
            isDragActive ? "border-primary bg-primary/10" : "border-border"
          }`}
        >
          <input {...getInputProps()} />
          <div className="flex flex-col items-center justify-center space-y-2">
            <Upload className="h-8 w-8 text-muted-foreground" />
            <p className="text-sm font-medium">{isDragActive ? "Drop the file here" : "Tap to select a file"}</p>
            <p className="text-xs text-muted-foreground">MP4, AVI, WAV, MP3 (max 2GB)</p>
          </div>
        </div>
      ) : (
        <div className="border rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <FileAudio className="h-8 w-8 text-primary" />
              <div className="space-y-1">
                <p className="text-sm font-medium truncate max-w-[180px] sm:max-w-[200px]">{file.name}</p>
                <p className="text-xs text-muted-foreground">{(file.size / (1024 * 1024)).toFixed(2)} MB</p>
              </div>
            </div>
            <Button variant="ghost" size="icon" onClick={resetFile} disabled={uploading}>
              <X className="h-4 w-4" />
            </Button>
          </div>
          {uploading && (
            <div className="mt-4 space-y-2">
              <Progress value={progress} className="h-2" />
              <p className="text-xs text-right text-muted-foreground">{progress}%</p>
            </div>
          )}
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="language">Audio Language</Label>
        <Select value={language} onValueChange={setLanguage} disabled={uploading}>
          <SelectTrigger id="language" className="w-full">
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
        <p className="text-xs text-muted-foreground">Select the primary language spoken in the audio</p>
      </div>

      <div className="flex justify-end">
        <Button onClick={handleUpload} disabled={!file || uploading} className="w-full">
          {uploading ? "Uploading..." : "Start Processing"}
        </Button>
      </div>
    </div>
  )
}

