"use client"
import { Button } from "@/components/ui/button";
import { ArrowRight, Globe, Sparkles } from "lucide-react";
import { useState, useEffect } from "react";

const CtaSection = () => {
  const [isVisible, setIsVisible] = useState(false);
  
  useEffect(() => {
    const handleScroll = () => {
      const ctaSection = document.getElementById("cta");
      if (ctaSection) {
        const rect = ctaSection.getBoundingClientRect();
        const isInView = rect.top < window.innerHeight * 0.8;
        setIsVisible(isInView);
      }
    };
    
    window.addEventListener("scroll", handleScroll, { passive: true });
    
    // Initial check
    setTimeout(handleScroll, 100);
    
    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);
  
  return (
    <section id="cta" className="py-24 relative">
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-accent/5 rounded-full blur-3xl animate-pulse" style={{ animationDelay: "1s" }}></div>
      </div>
      
      <div className="container px-4 sm:px-6 lg:px-8 mx-auto">
        <div className={`max-w-5xl mx-auto rounded-2xl bg-gradient-to-br from-primary/20 via-secondary to-background p-0.5 transition-all duration-1000 transform ${
          isVisible ? "opacity-100 scale-100" : "opacity-0 scale-95"
        }`}>
          <div className="relative overflow-hidden bg-background rounded-xl p-8 md:p-12 lg:p-16 text-center">
            <div className="animate-float-rotate absolute -top-10 -left-10 w-20 h-20 bg-primary/10 rounded-full blur-xl"></div>
            <div className="animate-float-rotate absolute -bottom-10 -right-10 w-20 h-20 bg-accent/10 rounded-full blur-xl" style={{ animationDelay: "1s" }}></div>
            
            <div className={`inline-flex items-center justify-center p-3 rounded-full bg-primary/10 mb-8 transition-all duration-500 delay-300 transform ${
              isVisible ? "opacity-100 scale-100" : "opacity-0 scale-90"
            }`}>
              <Sparkles className="h-8 w-8 text-primary animate-pulse" />
            </div>
            
            <h2 className={`text-3xl md:text-4xl font-bold mb-6 transition-all duration-700 delay-500 transform ${
              isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"
            }`}>
              ✨ Try AI-Subtitler Free Today!
            </h2>
            
            <p className={`text-xl text-muted-foreground mb-8 max-w-2xl mx-auto transition-all duration-700 delay-700 transform ${
              isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"
            }`}>
              No credit card needed. Generate your first subtitle in seconds and experience the power of AI.
            </p>
            
            <div className={`flex flex-col sm:flex-row justify-center gap-4 mb-8 transition-all duration-700 delay-900 transform ${
              isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"
            }`}>
              <Button size="lg" className="gap-2 bg-gradient-to-r from-primary to-accent hover:opacity-90">
                Get Started for Free <ArrowRight className="h-4 w-4 btn-icon" />
              </Button>
              <Button size="lg" variant="outline" className="group">
                <span>50% Off First Month</span>
                <span className="ml-2 text-accent group-hover:text-primary transition-colors">🎁</span>
              </Button>
            </div>
            
            <p className={`text-sm text-muted-foreground transition-all duration-700 delay-1000 ${
              isVisible ? "opacity-100" : "opacity-0"
            }`}>
              Join 10,000+ content creators already using AI-Subtitler
            </p>
            
            {/* Animated particles */}
            <div className="absolute top-1/4 left-1/4 w-2 h-2 rounded-full bg-primary/50 animate-ping" style={{ animationDuration: "3s" }}></div>
            <div className="absolute top-3/4 right-1/4 w-2 h-2 rounded-full bg-accent/50 animate-ping" style={{ animationDuration: "4s", animationDelay: "1s" }}></div>
            <div className="absolute top-1/2 right-1/3 w-2 h-2 rounded-full bg-primary/50 animate-ping" style={{ animationDuration: "5s", animationDelay: "2s" }}></div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default CtaSection;
