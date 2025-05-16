"use client";

import { useEffect, useState } from "react";
import NavigationDrawer from "./NavigationDrawer";

export default function MainNavigation() {
  const [isOpen, setIsOpen] = useState(false);

  // Trigger zone logic
  useEffect(() => {
    const trigger = document.createElement("div");
    trigger.className = "fixed left-0 w-[10vw] z-30";
    trigger.style.top = "35vh";
    trigger.style.height = "30vh";
    trigger.addEventListener("mouseenter", () => setIsOpen(true));
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
