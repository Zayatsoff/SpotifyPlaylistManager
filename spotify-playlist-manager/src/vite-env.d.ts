/// <reference types="vite/client" />
/// <reference types="vite-plugin-svgr/client" />
declare module "*.svg" {
  import React from "react";
  const SVG: React.FC<React.SVGProps<SVGSVGElement> & { title?: string }>;
  export default SVG;
}
