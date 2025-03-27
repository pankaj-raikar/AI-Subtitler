import Link from "next/link"
import { auth } from "@clerk/nextjs/server"
import { redirect } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { CheckCircle, FileAudio, Headphones, Languages, Zap } from "lucide-react"

export default async function LandingPage() {
  const { userId } = await auth()

  // If user is logged in, redirect to dashboard
  if (userId) {
    redirect("/dashboard")
  }

  return (
    <div className="flex flex-col min-h-screen">
      {/* Hero Section */}
      <header className="bg-gradient-to-r from-primary/90 to-primary px-4 py-16 md:py-24">
        <div className="container mx-auto max-w-6xl">
          <div className="flex flex-col md:flex-row items-center gap-8 md:gap-16">
            <div className="flex-1 text-center md:text-left">
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-4">
                AI-Powered Subtitle Generation
              </h1>
              <p className="text-lg md:text-xl text-white/90 mb-8">
                Transform your videos and audio files into perfectly timed subtitles in seconds with our advanced AI
                technology.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center md:justify-start">
                <Button asChild size="lg" className="bg-white text-primary hover:bg-white/90">
                  <Link href="/sign-up">Get Started Free</Link>
                </Button>
                <Button
                  asChild
                  size="lg"
                  variant="outline"
                  className="bg-transparent text-white border-white hover:bg-white/10"
                >
                  <Link href="#features">Learn More</Link>
                </Button>
              </div>
            </div>
            <div className="flex-1 mt-8 md:mt-0">
              <div className="relative bg-white rounded-lg shadow-xl p-4 max-w-md mx-auto">
                <div className="aspect-video bg-gray-100 rounded-md flex items-center justify-center mb-4">
                  <FileAudio className="h-16 w-16 text-primary/40" />
                </div>
                <div className="space-y-2">
                  <div className="h-4 bg-gray-200 rounded-full w-full"></div>
                  <div className="h-4 bg-gray-200 rounded-full w-3/4"></div>
                  <div className="h-4 bg-gray-200 rounded-full w-5/6"></div>
                  <div className="h-4 bg-gray-200 rounded-full w-2/3"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Features Section */}
      <section id="features" className="py-16 md:py-24 px-4 bg-background">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Powerful Features</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Our platform offers everything you need to create professional subtitles for your content.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <Card>
              <CardHeader>
                <Zap className="h-10 w-10 text-primary mb-2" />
                <CardTitle>Lightning Fast</CardTitle>
                <CardDescription>Generate accurate subtitles in minutes, not hours.</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Our advanced AI processes your media files quickly and efficiently, saving you valuable time.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <Languages className="h-10 w-10 text-primary mb-2" />
                <CardTitle>Multiple Languages</CardTitle>
                <CardDescription>Support for over 14 languages and counting.</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  From English to Hindi, our platform can generate subtitles in many languages to reach a global
                  audience.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <Headphones className="h-10 w-10 text-primary mb-2" />
                <CardTitle>High Accuracy</CardTitle>
                <CardDescription>Precise transcription even with background noise.</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Our AI models are trained to understand different accents and filter out background noise for clear
                  subtitles.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-16 md:py-24 px-4 bg-muted/30">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">How It Works</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Three simple steps to perfect subtitles for your videos and audio files.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="flex flex-col items-center text-center">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                <span className="text-2xl font-bold text-primary">1</span>
              </div>
              <h3 className="text-xl font-semibold mb-2">Upload Your File</h3>
              <p className="text-muted-foreground">Upload your video or audio file in MP4, AVI, WAV, or MP3 format.</p>
            </div>

            <div className="flex flex-col items-center text-center">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                <span className="text-2xl font-bold text-primary">2</span>
              </div>
              <h3 className="text-xl font-semibold mb-2">Select Language</h3>
              <p className="text-muted-foreground">
                Choose the language spoken in your content for accurate transcription.
              </p>
            </div>

            <div className="flex flex-col items-center text-center">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                <span className="text-2xl font-bold text-primary">3</span>
              </div>
              <h3 className="text-xl font-semibold mb-2">Download Subtitles</h3>
              <p className="text-muted-foreground">
                Get your SRT file ready to use with any video editing software or platform.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 md:py-24 px-4 bg-primary text-white">
        <div className="container mx-auto max-w-6xl">
          <div className="flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="max-w-2xl">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">Ready to Get Started?</h2>
              <p className="text-xl text-white/90 mb-4">
                Join thousands of content creators who are saving time with our AI-powered subtitle generation.
              </p>
              <ul className="space-y-2 mb-8">
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-white" />
                  <span>No credit card required</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-white" />
                  <span>Free tier available</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-white" />
                  <span>Cancel anytime</span>
                </li>
              </ul>
            </div>
            <div>
              <Button asChild size="lg" className="bg-white text-primary hover:bg-white/90">
                <Link href="/sign-up">Create Free Account</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-4 border-t">
        <div className="container mx-auto max-w-6xl">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-2">
              <FileAudio className="h-6 w-6 text-primary" />
              <span className="font-bold">Subtitle Generator</span>
            </div>
            <div className="text-sm text-muted-foreground">
              © {new Date().getFullYear()} Subtitle Generator. All rights reserved.
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}

