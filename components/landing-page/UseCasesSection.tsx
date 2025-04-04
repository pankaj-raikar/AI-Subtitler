
import { 
  Youtube, 
  GraduationCap, 
  Globe, 
  Mic
} from "lucide-react";

const useCases = [
  {
    icon: <Youtube className="h-10 w-10 text-destructive" />, // Use theme destructive color
    title: "Content Creators",
    description: "Boost SEO and engagement with subtitled YouTube/TikTok videos."
  },
  {
    icon: <GraduationCap className="h-10 w-10 text-primary" />, // Use theme primary color
    title: "Educators",
    description: "Make courses accessible and inclusive for all learners."
  },
  {
    icon: <Globe className="h-10 w-10 text-green-500" />, // Keep green for now, or could use accent
    title: "Global Brands",
    description: "Localize marketing videos for international audiences."
  },
  {
    icon: <Mic className="h-10 w-10 text-purple-500" />, // Keep purple for now, or could use primary/accent
    title: "Podcasters",
    description: "Turn video podcasts into searchable, subtitled content."
  }
];

const UseCasesSection = () => {
  return (
    <section id="use-cases" className="py-24">
      <div className="container px-4 sm:px-6 lg:px-8 mx-auto">
        <div className="max-w-3xl mx-auto text-center mb-16">
          <div className="inline-block px-3 py-1 mb-4 rounded-full bg-primary/10 text-primary text-sm font-medium">
            🎯 Who Uses AI-Subtitler
          </div>
          <h2 className="text-3xl md:text-4xl font-bold mb-6">
            Perfect For All Video Creators
          </h2>
          <p className="text-xl text-muted-foreground">
            Discover how AI-Subtitler helps professionals across different fields.
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {useCases.map((useCase, index) => (
            <div key={index} className="feature-card">
              <div className="mb-6">{useCase.icon}</div>
              <h3 className="text-xl font-bold mb-3">{useCase.title}</h3>
              <p className="text-muted-foreground">{useCase.description}</p>
            </div>
          ))}
        </div>
        
        <div className="mt-16 p-8 rounded-xl bg-secondary/50 border border-border">
          <div className="flex flex-col md:flex-row items-center gap-8">
            <div className="flex-1">
              <h3 className="text-2xl font-bold mb-4">Results You Can Measure</h3>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between mb-2">
                    <span>Viewer Engagement</span>
                    <span className="font-bold text-primary">+80%</span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2">
                    <div className="bg-primary h-2 rounded-full" style={{ width: '80%' }}></div>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between mb-2">
                    <span>Video Retention</span>
                    <span className="font-bold text-primary">+65%</span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2">
                    <div className="bg-primary h-2 rounded-full" style={{ width: '65%' }}></div>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between mb-2">
                    <span>Global Reach</span>
                    <span className="font-bold text-primary">+120%</span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2">
                    <div className="bg-primary h-2 rounded-full" style={{ width: '100%' }}></div>
                  </div>
                </div>
              </div>
            </div>
            <div className="flex-1">
              <div className="rounded-xl overflow-hidden border border-border">
                <div className="bg-secondary px-4 py-2 border-b border-border">
                  <div className="flex space-x-2">
                    {/* Use theme destructive for red, keep yellow/green */}
                    <div className="w-3 h-3 rounded-full bg-destructive"></div>
                    <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                    <div className="w-3 h-3 rounded-full bg-green-500"></div>
                  </div>
                </div>
                <div className="p-4 bg-background">
                  <div className="aspect-video bg-muted rounded-lg flex items-center justify-center">
                    <span className="text-muted-foreground">Video with AI Subtitles</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default UseCasesSection;
