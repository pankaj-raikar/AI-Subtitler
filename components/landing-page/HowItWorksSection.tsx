
import { Button } from "@/components/ui/button";
import { 
  Upload, 
  Zap, 
  Share2
} from "lucide-react";

const steps = [
  {
    icon: <Upload className="h-12 w-12 text-primary" />,
    title: "Upload Video",
    description: "Drag-and-drop MP4, MOV, AVI, or paste a YouTube/Vimeo link.",
    color: "from-primary/20 to-primary/5" // Use theme primary
  },
  {
    icon: <Zap className="h-12 w-12 text-accent" />,
    title: "AI Magic",
    description: "Watch our AI process audio/video and generate subtitles in minutes.",
    color: "from-accent/20 to-accent/5" // Use theme accent
  },
  {
    icon: <Share2 className="h-12 w-12 text-primary" />,
    title: "Download & Share",
    description: "Export subtitles or share directly to social media/platforms.",
    color: "from-primary/20 to-primary/5" // Use theme primary again
  }
];

const HowItWorksSection = () => {
  return (
    <section id="how-it-works" className="py-24 bg-secondary/30">
      <div className="container px-4 sm:px-6 lg:px-8 mx-auto">
        <div className="max-w-3xl mx-auto text-center mb-16">
          <div className="inline-block px-3 py-1 mb-4 rounded-full bg-primary/10 text-primary text-sm font-medium">
            🔍 Simple Process
          </div>
          <h2 className="text-3xl md:text-4xl font-bold mb-6">
            How It Works
          </h2>
          <p className="text-xl text-muted-foreground">
            Three simple steps to perfect subtitles in minutes, not hours.
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
          {steps.map((step, index) => (
            <div key={index} className="relative">
              {index < steps.length - 1 && (
                <div className="hidden md:block absolute top-1/4 right-0 h-0.5 w-full bg-gradient-to-r from-muted to-transparent z-0 -mr-4">
                </div>
              )}
              
              <div className="feature-card h-full relative z-10">
                <div className={`mb-6 p-4 rounded-full w-fit bg-gradient-to-b ${step.color}`}>
                  {step.icon}
                </div>
                <h3 className="text-xl font-bold mb-3">
                  {index + 1}. {step.title}
                </h3>
                <p className="text-muted-foreground">{step.description}</p>
              </div>
            </div>
          ))}
        </div>
        
        <div className="text-center">
          <Button size="lg">Try It Now</Button>
        </div>
      </div>
    </section>
  );
};

export default HowItWorksSection;
