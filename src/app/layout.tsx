import type { Metadata } from "next";

/**
 * Bare root layout shared by the site and the embedded Studio.
 * Site styles and fonts live in (site)/layout.tsx so they never leak into /studio.
 */
export const metadata: Metadata = {
  title: "W.I.L.L.I.A.M.S Beats",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
