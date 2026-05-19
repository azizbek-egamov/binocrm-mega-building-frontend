"use client";

import { useEffect, useState, useRef } from "react";

/**
 * Adaptive Sticky Header Component
 * - Shows full header at top of page
 * - Compresses as user scrolls down (hide subtitle, reduce padding)
 * - Auto-hides background when scrolled past header
 * - Smooth transitions
 * - Responsive and mobile-friendly
 */
// eslint-disable-next-line react-refresh/only-export-components
export const useAdaptiveHeader = () => {
  const [headerState, setHeaderState] = useState("expanded");
  const [isVisible, setIsVisible] = useState(true);
  const lastScrollYRef = useRef(0);
  const headerRef = useRef(null);

  useEffect(() => {
    let ticking = false;

    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          const currentScrollY = window.scrollY;
          const scrollDelta = currentScrollY - lastScrollYRef.current;

          // Determine header state based on scroll position and direction
          if (currentScrollY < 60) {
            // Very top of page - fully expanded
            setHeaderState("expanded");
            setIsVisible(true);
          } else if (currentScrollY < 120 && scrollDelta > 0) {
            // Scrolling down past 60px - start collapsing
            setHeaderState("collapsed");
            setIsVisible(true);
          } else if (currentScrollY > 120 && scrollDelta > 0) {
            // Scrolling down past 120px - hide header
            setHeaderState("hidden");
            setIsVisible(false);
          } else if (scrollDelta < 0) {
            // Scrolling up - always show header
            setHeaderState(currentScrollY < 60 ? "expanded" : "collapsed");
            setIsVisible(true);
          }

          lastScrollYRef.current = currentScrollY;
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return { headerState, isVisible, headerRef };
};

/**
 * PageHeader Component - Adaptive Sticky Header
 * Props:
 * - icon: JSX element for the icon
 * - title: Main heading text
 * - subtitle: Optional subheading
 * - actions: Optional JSX for right-side actions
 * - headerState: 'expanded' | 'collapsed' | 'hidden'
 * - isVisible: boolean
 */
export const AdaptivePageHeader = ({
  icon,
  title,
  subtitle,
  actions,
  headerState = "expanded",
  isVisible = true,
}) => {
  const getHeaderClasses = () => {
    let classes = "adaptive-page-header";
    if (headerState === "expanded") classes += " state-expanded";
    else if (headerState === "collapsed") classes += " state-collapsed";
    else if (headerState === "hidden") classes += " state-hidden";

    if (!isVisible) classes += " is-hidden";

    return classes;
  };

  return (
    <div className={getHeaderClasses()}>
      {/* Background overlay that fades */}
      <div className="header-background" />

      {/* Header content */}
      <div className="header-content">
        <div className="header-left">
          {icon && <div className="icon-box">{icon}</div>}
          <div className="header-text">
            <h1 className="header-title">{title}</h1>
            {subtitle && <p className="header-subtitle">{subtitle}</p>}
          </div>
        </div>

        {actions && <div className="header-actions">{actions}</div>}
      </div>

      {/* Bottom border that fades */}
      <div className="header-divider" />
    </div>
  );
};
