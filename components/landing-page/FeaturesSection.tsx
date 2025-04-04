
import { 
  Globe, 
  Check, 
  Download, 
  Paintbrush, 
  FileText
} from "lucide-react";

const features = [
  {
    icon: <FileText className="h-10 w-10 text-primary feature-icon" />,
    title: "Auto-Generate Subtitles in 1 Click",
    description: "Upload any video, and let AI transcribe, time-sync, and generate subtitles instantly."
  },
  {
    icon: <Globe className="h-10 w-10 text-primary feature-icon" />,
    title: "100+ Languages Supported",
    description: "From English to Mandarin, Swahili to French—break language barriers effortlessly."
  },
  {
    icon: <Check className="h-10 w-10 text-primary feature-icon" />,
    title: "99% Accuracy with Context-Aware AI",
    description: "Advanced NLP ensures perfect punctuation, speaker detection, and slang understanding."
  },
  {
    icon: <Download className="h-10 w-10 text-primary feature-icon" />,
    title: "Export Anywhere",
    description: "Download SRT, VTT, TXT files, or burn subtitles directly into your video."
  },
  {
    icon: <Paintbrush className="h-10 w-10 text-primary feature-icon" />,
    title: "Edit & Customize",
    description: "Adjust fonts, colors, timing, and positioning to match your brand or style."
  },
];

const FeaturesSection = () => {
  return (
    <section id="features" className="py-10 relative">
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-10 -right-10 w-40 h-40 bg-primary/5 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-accent/5 rounded-full blur-3xl"></div>
      </div>
      
      <div className="container px-4 sm:px-6 lg:px-8 mx-auto relative">
        <div className="max-w-3xl mx-auto text-center mb-12">
          <div className="inline-block px-3 py-1 mb-4 rounded-full bg-primary/10 text-primary text-sm font-medium">
            ✨ Key Features
          </div>
          <h2 className="text-3xl md:text-4xl font-bold mb-6">
            Everything You Need for Perfect Subtitles
          </h2>
          <p className="text-xl text-muted-foreground">
            Powerful AI technology that makes subtitle generation simple, accurate, and fast.
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <div 
              key={index} 
              className="feature-card"
            >
              <div className="mb-6">{feature.icon}</div>
              <h3 className="text-xl font-bold mb-3">{feature.title}</h3>
              <p className="text-muted-foreground">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection;
