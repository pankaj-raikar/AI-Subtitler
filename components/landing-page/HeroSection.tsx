"use client"
import { Button } from "@/components/ui/button";
import { Check, ArrowRight, Play } from "lucide-react";
import { useEffect, useState } from "react";
import Link from "next/link";
const HeroSection = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [typingText, setTypingText] = useState("");
  const [typingIndex, setTypingIndex] = useState(0);
  const fullText = "Subtitles So Accurate, They’re Studio-Quality.";
  
  useEffect(() => {
    // Trigger animations after component mounts
    setIsVisible(true);
    
    // Typing animation effect
    if (typingIndex < fullText.length) {
      const timeout = setTimeout(() => {
        setTypingText(prev => prev + fullText[typingIndex]);
        setTypingIndex(prev => prev + 1);
      }, 100);
      
      return () => clearTimeout(timeout);
    }
  }, [typingIndex]);

  return (
    <section className="pt-24 pb-10 relative overflow-hidden">
      {/* Simple gradient background */}
      <div className="absolute inset-0 hero-gradient z-0"></div>
      
      <div className="container px-4 sm:px-6 lg:px-8 mx-auto relative z-10">
        <div 
          className={`max-w-4xl mx-auto text-center transition-all duration-700 ${
            isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"
          }`}
        >
          <div className="inline-block px-3 py-1 mb-4 rounded-full bg-secondary text-sm font-medium animate-pulse">
            🚀 AI-Powered Subtitle Generator
          </div>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-4 leading-tight">
            <span className="gradient-text">{typingText}</span>
            <span className={`inline-block ml-1 ${typingIndex < fullText.length ? "animate-pulse" : "opacity-0"}`}>|</span>
          </h1>
          <p className="text-xl text-muted-foreground mb-8">
            Save time, enhance accessibility, and reach a global audience—no manual transcription required.
          </p>
          
          <div className="flex flex-col sm:flex-row justify-center gap-4 mb-8">
            <Link href="/sign-up">
            <Button size="lg" className="gap-2 hover:scale-105 transition-transform duration-300 bg-gradient-to-r from-primary to-accent">
              Get Started Free <ArrowRight className="h-4 w-4" />
            </Button>
            </Link>
            <Button 
              size="lg" 
              variant="outline" 
              className="hover:scale-105 transition-transform duration-300 group"
            >
              <Play className="h-4 w-4 mr-2 group-hover:text-primary transition-colors" />
              Watch Demo
            </Button>
          </div>
          
          <div className="flex flex-wrap justify-center gap-x-8 gap-y-2 text-sm text-muted-foreground">
            <div className="flex items-center">
              <Check className="h-4 w-4 text-primary mr-2" />
              <span>No credit card required</span>
            </div>
            <div className="flex items-center">
              <Check className="h-4 w-4 text-primary mr-2" />
              <span>100+ languages supported</span>
            </div>
            <div className="flex items-center">
              <Check className="h-4 w-4 text-primary mr-2" />
              <span>99% accuracy</span>
            </div>
          </div>
        </div>
        
        
      </div>
    </section>
  );
};

export default HeroSection;
