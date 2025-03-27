"use client"

import { useState } from "react"
import { Upload } from "lucide-react"
import { Button } from "@/components/ui/button"
import { FileUploader } from "@/components/dashboard/file-uploader"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"

export function UploadButton() {
  const [open, setOpen] = useState(false)

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Upload className="mr-2 h-4 w-4" />
          Upload File
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Upload Media File</DialogTitle>
          <DialogDescription>
            Upload a video or audio file to generate subtitles. Supported formats: MP4, AVI, WAV, MP3.
          </DialogDescription>
        </DialogHeader>
        <FileUploader onSuccess={() => setOpen(false)} />
      </DialogContent>
    </Dialog>
  )
}

