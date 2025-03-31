
'use client'; // Add 'use client' directive

import { useState, useEffect } from "react";
import Link from "next/link"; // Changed from react-router-dom
import { usePathname } from 'next/navigation'; // Import usePathname
import { Home, FileText, Settings, Menu, X, Moon, Sun, Laptop } from "lucide-react";
import { useTheme } from "next-themes"; // Use the hook from next-themes
import { useIsMobile } from "@/hooks/use-mobile";


export default function Sidebar() {
  const [isOpen, setIsOpen] = useState(false);
  const { theme, setTheme } = useTheme();
  const isMobile = useIsMobile();
  const pathname = usePathname();
  const [isMounted, setIsMounted] = useState(false); // Add mounted state declaration

  // Set mounted state after initial render
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Close sidebar when clicking outside on mobile
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (isMobile && isOpen) {
        const target = event.target as HTMLElement;
        const sidebar = document.getElementById('mobile-sidebar');
        const menuButton = document.getElementById('mobile-menu-button');
        
        if (sidebar && 
            !sidebar.contains(target) && 
            menuButton && 
            !menuButton.contains(target)) {
          setIsOpen(false);
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isMobile, isOpen]);

  // Close sidebar when route changes (using pathname)
  useEffect(() => {
    if (isMobile) {
      setIsOpen(false);
    }
  }, [pathname, isMobile]); // Depend on pathname

  return (
    <>
      {/* Mobile menu button - hide when sidebar is open */}
      <button
        id="mobile-menu-button"
        className={`fixed top-4 left-4 z-40 md:hidden p-2 rounded-md hover:bg-secondary text-foreground ${
          isOpen ? "hidden" : "block"
        }`}
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Toggle menu"
      >
        <Menu size={24} />
      </button>

      {/* Sidebar */}
      <div
        id="mobile-sidebar"
        className={`fixed inset-y-0 left-0 z-30 w-64 bg-card border-r border-border transform transition-transform duration-300 ease-in-out md:translate-x-0 ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between h-16 px-4 border-b border-border">
          <h1 className="text-xl font-bold">SubTitler</h1>
          <button
            className="md:hidden p-2 rounded-md hover:bg-secondary text-foreground"
            onClick={() => setIsOpen(false)}
            aria-label="Close menu"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-4">
          <nav className="space-y-2">
            {/* Use next/link */}
            <Link
              href="/"
              className="flex items-center px-3 py-2 text-sm font-medium rounded-md hover:bg-secondary"
            >
              <Home className="mr-3 h-5 w-5" />
              Dashboard
            </Link>
            <Link
              href="/jobs" // Assuming '/jobs' is the correct Next.js route
              className="flex items-center px-3 py-2 text-sm font-medium rounded-md hover:bg-secondary"
            >
              <FileText className="mr-3 h-5 w-5" />
              Jobs History
            </Link>
            <Link
              href="/settings" // Assuming '/settings' is the correct Next.js route
              className="flex items-center px-3 py-2 text-sm font-medium rounded-md hover:bg-secondary"
            >
              <Settings className="mr-3 h-5 w-5" />
              Settings
            </Link>
          </nav>
        </div>

        <div className="absolute bottom-0 w-full p-4 border-t border-border">
          <div className="flex items-center justify-between">
            <span className="text-sm">Theme</span>
            <div className="flex space-x-1">
              {/* Only apply bg-secondary class if mounted and theme matches */}
              <button
                onClick={() => setTheme("light")}
                className={`p-2 rounded-md ${
                  isMounted && theme === "light" ? "bg-secondary" : ""
                }`}
                aria-label="Light mode"
              >
                <Sun size={18} />
              </button>
              <button
                onClick={() => setTheme("dark")}
                className={`p-2 rounded-md ${
                  isMounted && theme === "dark" ? "bg-secondary" : ""
                }`}
                aria-label="Dark mode"
              >
                <Moon size={18} />
              </button>
              <button
                onClick={() => setTheme("system")}
                className={`p-2 rounded-md ${
                  isMounted && theme === "system" ? "bg-secondary" : ""
                }`}
                aria-label="System mode"
              >
                <Laptop size={18} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile overlay to capture clicks outside the sidebar */}
      {isOpen && (
        <div 
          className="md:hidden fixed inset-0 bg-black bg-opacity-50 z-20"
          onClick={() => setIsOpen(false)}
          aria-hidden="true"
        />
      )}
    </>
  );
}
