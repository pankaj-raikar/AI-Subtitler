"use client"
import { Button } from "@/components/ui/button";
import { Globe, Menu } from "lucide-react";
import { useState } from "react";
import Link from "next/link";
const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center">
            <a href="#" className="flex items-center">
              <Globe className="h-6 w-6 text-primary mr-2" />
              <span className="font-bold text-xl">AI-Subtitler</span>
            </a>
          </div>
          
          <nav className="hidden md:flex items-center space-x-8">
            <a href="#features" className="text-sm font-medium hover:text-primary transition-colors">
              Features
            </a>
            <a href="#how-it-works" className="text-sm font-medium hover:text-primary transition-colors">
              How It Works
            </a>
            <a href="#use-cases" className="text-sm font-medium hover:text-primary transition-colors">
              Use Cases
            </a>
            <a href="#testimonials" className="text-sm font-medium hover:text-primary transition-colors">
              Testimonials
            </a>
            <a href="#faq" className="text-sm font-medium hover:text-primary transition-colors">
              FAQ
            </a>
          </nav>
          
          <div className="hidden md:flex items-center space-x-4">
            <Link href="/sign-in">
              <Button variant="outline" size="sm">
                Log in
              </Button>
            </Link>
            <Link href="/sign-up">
              <Button size="sm">
                Get Started Free
              </Button>
            </Link>
          </div>
          
          <div className="md:hidden">
            <button
              type="button"
              className="inline-flex items-center justify-center p-2 rounded-md text-foreground focus:outline-none"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              <Menu className="h-6 w-6" />
            </button>
          </div>
        </div>
      </div>
      
      {isMenuOpen && (
        <div className="md:hidden">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3 bg-secondary/90 backdrop-blur-md">
            <a href="#features" className="block px-3 py-2 rounded-md text-base font-medium hover:bg-muted">
              Features
            </a>
            <a href="#how-it-works" className="block px-3 py-2 rounded-md text-base font-medium hover:bg-muted">
              How It Works
            </a>
            <a href="#use-cases" className="block px-3 py-2 rounded-md text-base font-medium hover:bg-muted">
              Use Cases
            </a>
            <a href="#testimonials" className="block px-3 py-2 rounded-md text-base font-medium hover:bg-muted">
              Testimonials
            </a>
            <a href="#faq" className="block px-3 py-2 rounded-md text-base font-medium hover:bg-muted">
              FAQ
            </a>
            <div className="pt-4 flex flex-col space-y-2">
              <Link href="/sign-in">
                <Button variant="outline" className="w-full">
                  Log in
                </Button>
              </Link>
              <Link href="/sign-up">
              <Button className="w-full">
                  Get Started Free
                </Button>
              </Link>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};

export default Navbar;
