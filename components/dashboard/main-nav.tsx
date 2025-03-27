import Link from "next/link"
import { FileAudio, Home } from "lucide-react"

export function MainNav() {
  return (
    <div className="flex gap-4 md:gap-6">
      <Link href="/" className="flex items-center space-x-2">
        <FileAudio className="h-6 w-6" />
        <span className="hidden font-bold sm:inline-block">Subtitle Generator</span>
      </Link>
      <nav className="flex gap-4">
        <Link href="/" className="flex items-center text-sm font-medium text-muted-foreground">
          <Home className="mr-1 h-4 w-4" />
          <span className="hidden sm:inline">Dashboard</span>
        </Link>
      </nav>
    </div>
  )
}

