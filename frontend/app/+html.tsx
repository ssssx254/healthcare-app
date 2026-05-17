import { ScrollViewStyleReset } from "expo-router/html";
import type { PropsWithChildren } from "react";

/** Preload icon font on web (path set by scripts/copy-web-icon-font.js after export). */
export default function Root({ children }: PropsWithChildren) {
  return (
    <html lang="mn">
      <head>
        <meta charSet="utf-8" />
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        <link rel="preload" href="/assets/fonts/material-community.ttf" as="font" type="font/ttf" crossOrigin="anonymous" />
        <ScrollViewStyleReset />
      </head>
      <body>{children}</body>
    </html>
  );
}
