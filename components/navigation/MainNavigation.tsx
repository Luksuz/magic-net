"use client";

import { useEffect, useState } from "react";
import NavigationDrawer from "./NavigationDrawer";

export default function MainNavigation() {
  const [isOpen, setIsOpen] = useState(false);

  // Trigger zone logic
  useEffect(() => {
    const trigger = document.createElement("div");
    trigger.className = "fixed left-0 z-30 flex items-center justify-center cursor-pointer";
    trigger.style.top = "40vh";
    trigger.style.height = "30vh";
    trigger.style.width = "5vw"; // Make it smaller
    trigger.style.background = "linear-gradient(to left, rgba(200,200,200,0.5), rgba(200,200,200,0))"; // Light gray gradient
    trigger.style.borderTopRightRadius = "8px";
    trigger.style.borderBottomRightRadius = "8px";
    trigger.style.transition = "width 0.3s ease";

    const triggerText = document.createElement("span");
    triggerText.textContent = "Navigacija";
    triggerText.style.writingMode = "vertical-rl";
    triggerText.style.transform = "rotate(180deg)";
    triggerText.style.whiteSpace = "nowrap";
    triggerText.style.color = "#333"; // Dark gray text
    triggerText.style.fontSize = "20px";
    triggerText.style.fontWeight = "500";
    triggerText.style.padding = "10px 0";

    trigger.appendChild(triggerText);

    trigger.addEventListener("mouseenter", () => {
      setIsOpen(true);
      trigger.style.width = "6vw"; // Slightly expand on hover
    });
    trigger.addEventListener("mouseleave", () => {
        // The drawer itself has onMouseLeave to close, so we don't strictly need to setIsOpen(false) here
        // unless we want the trigger to shrink back immediately even if mouse moves to drawer.
        // For now, let's just shrink it back.
        trigger.style.width = "5vw";
    });
    
    document.body.appendChild(trigger);

    return () => {
      if (document.body.contains(trigger)) {
        document.body.removeChild(trigger);
      }
    };
  }, []);

  return (
    <>
      <NavigationDrawer isOpen={isOpen} onClose={() => setIsOpen(false)} />
      {/* Dev visualization — remove in production */}
      {/* <div className="fixed top-[35vh] left-0 w-[10vw] h-[30vh] border border-dashed border-primary/20 pointer-events-none z-20 opacity-30 md:flex hidden" /> */}
    </>
  );
}
