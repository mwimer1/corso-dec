"use client";

import * as React from "react";

/**
 * ReadingProgress - Visual progress indicator for long-form content.
 * Uses Intersection Observer for accurate scroll tracking.
 */
export function ReadingProgress(): React.ReactElement {
  const [progress, setProgress] = React.useState(0);

  React.useEffect(() => {
    // Use Intersection Observer for better performance and accuracy
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            // Calculate progress based on intersection ratio and viewport
            const scrollPercent = Math.min(100, Math.max(0, entry.intersectionRatio * 100));
            setProgress(scrollPercent);
          }
        });
      },
      {
        threshold: [0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1.0],
        rootMargin: '0px 0px -100% 0px' // Observe from top of viewport
      }
    );

    // Observe the main content area
    const mainContent = document.getElementById('main-content');
    if (mainContent) {
      observer.observe(mainContent);
    }

    // Fallback: calculate progress based on scroll position
    const updateProgress = (): void => {
      const scrollTop = window.scrollY;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      const scrollPercent = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;
      setProgress(Math.min(100, Math.max(0, scrollPercent)));
    };

    // Use scroll listener as fallback
    window.addEventListener('scroll', updateProgress, { passive: true });
    updateProgress(); // Initial calculation

    return () => {
      observer.disconnect();
      window.removeEventListener('scroll', updateProgress);
    };
  }, []);

  return (
    <div 
      className="fixed top-0 left-0 right-0 z-50 h-1 bg-border" 
      aria-hidden="true"
      role="progressbar"
      aria-valuenow={Math.round(progress)}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <div
        className="h-full bg-primary transition-all duration-150 ease-out"
        style={{ width: `${progress}%` }}
      />
    </div>
  );
}

