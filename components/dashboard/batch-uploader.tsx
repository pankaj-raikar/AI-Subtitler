"use client"

import { useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import { type FileRejection, useDropzone } from "react-dropzone"
import { FileAudio, Upload, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { toast } from "@/hooks/use-toast"

export function BatchUploader() {
  const [files, setFiles] = useState<File[]>([])
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState<Record<string, number>>({})
  const router = useRouter()

  const onDrop = useCallback((acceptedFiles: File[], rejectedFiles: FileRejection[]) => {
    if (rejectedFiles.length > 0) {
      const errors = rejectedFiles.map((f) => `${f.file.name}: ${f.errors.map((e) => e.message).join(", ")}`).join("\n")
      toast({
        title: "Some files were rejected",
        description: errors,
        variant: "destructive",
      })
    }

    if (acceptedFiles.length > 0) {
      setFiles((prev) => [...prev, ...acceptedFiles])
    }
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    maxSize: 2 * 1024 * 1024 * 1024, // 2GB
    accept: {
      "video/mp4": [".mp4"],
      "video/x-msvideo": [".avi"],
      "audio/wav": [".wav"],
      "audio/mpeg": [".mp3"],
    },
  })

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index))
  }

  const handleUploadAll = async () => {
    if (files.length === 0) return

    setUploading(true)

    // Initialize progress for each file
    const initialProgress: Record<string, number> = {}
    files.forEach((file) => {
      initialProgress[file.name] = 0
    })
    setProgress(initialProgress)

    try {
      // Upload files in parallel with individual progress tracking
      const uploadPromises = files.map(async (file) => {
        const formData = new FormData()
        formData.append("file", file)

        // Simulate progress updates
        const updateInterval = setInterval(() => {
          setProgress((prev) => ({
            ...prev,
            [file.name]: Math.min(95, (prev[file.name] || 0) + 5),
          }))
        }, 500)

        try {
          const response = await fetch("/api/v1/convert", {
            method: "POST",
            body: formData,
          })

          clearInterval(updateInterval)

          if (!response.ok) {
            throw new Error(`Failed to upload ${file.name}`)
          }

          setProgress((prev) => ({
            ...prev,
            [file.name]: 100,
          }))

          return await response.json()
        } catch (error) {
          clearInterval(updateInterval)
          throw error
        }
      })

      await Promise.all(uploadPromises)

      toast({
        title: "Batch upload complete",
        description: `Successfully uploaded ${files.length} files for processing.`,
      })

      router.refresh()
      setFiles([])
    } catch (error) {
      toast({
        title: "Batch upload failed",
        description: error instanceof Error ? error.message : "An unknown error occurred",
        variant: "destructive",
      })
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="space-y-4">
      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
          isDragActive ? "border-primary bg-primary/10" : "border-border"
        }`}
      >
        <input {...getInputProps()} />
        <div className="flex flex-col items-center justify-center space-y-2">
          <Upload className="h-8 w-8 text-muted-foreground" />
          <p className="text-sm font-medium">
            {isDragActive ? "Drop the files here" : "Drag & drop files here, or click to select"}
          </p>
          <p className="text-xs text-muted-foreground">MP4, AVI, WAV, MP3 (max 2GB)</p>
        </div>
      </div>

      {files.length > 0 && (
        <div className="border rounded-lg p-4">
          <h3 className="font-medium mb-2">Files to upload ({files.length})</h3>
          <div className="space-y-3 max-h-60 overflow-y-auto">
            {files.map((file, index) => (
              <div key={index} className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <FileAudio className="h-6 w-6 text-primary" />
                  <div className="space-y-1">
                    <p className="text-sm font-medium truncate max-w-[200px]">{file.name}</p>
                    <p className="text-xs text-muted-foreground">{(file.size / (1024 * 1024)).toFixed(2)} MB</p>
                  </div>
                </div>
                {uploading ? (
                  <Progress value={progress[file.name] || 0} className="w-24 h-2" />
                ) : (
                  <Button variant="ghost" size="icon" onClick={() => removeFile(index)} disabled={uploading}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="flex justify-end">
        <Button onClick={handleUploadAll} disabled={files.length === 0 || uploading} className="w-full">
          {uploading ? "Uploading..." : `Process ${files.length} Files`}
        </Button>
      </div>
    </div>
  )
}

