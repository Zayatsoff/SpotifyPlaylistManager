import { Moon } from "lucide-react";
import React, { useState, useEffect } from "react";
import CustomTooltip from "@/components/ui/CustomTooltip";

const ThemeToggler: React.FC = () => {
  // Set default theme to 'dark' if not found in localStorage
  const [theme, setTheme] = useState<"light" | "dark">(() => {
    const savedTheme = localStorage.getItem("theme");
    return savedTheme ? (savedTheme as "light" | "dark") : "dark";
  });

  const toggleTheme = () => {
    setTheme((currentTheme) => (currentTheme === "light" ? "dark" : "light"));
  };

  useEffect(() => {
    // Apply the theme to the document
    document.documentElement.setAttribute("data-theme", theme);
    // Save the current theme to localStorage
    localStorage.setItem("theme", theme);
  }, [theme]);

  return (
    <div className="h-5 flex items-center ">
      <CustomTooltip
        children={
          <div
            onClick={toggleTheme}
            className=" text-foreground rounded-full hover:bg-primary/30 w-8 h-8 flex items-center justify-center"
          >
            <Moon className="w-5 " />
          </div>
        }
        description={"Change theme"}
        time={400}
      />
    </div>
  );
};

export default ThemeToggler;
