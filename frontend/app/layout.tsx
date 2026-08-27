import type { Metadata } from "next";
import { DM_Sans, Space_Grotesk } from "next/font/google";
import { Providers } from "@/components/providers";
import "./globals.css";

const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-dm-sans",
});

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-space-grotesk",
});

function safeSiteUrl() {
  const raw = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
  try {
    return new URL(raw);
  } catch {
    return new URL("http://localhost:3000");
  }
}

export const metadata: Metadata = {
  metadataBase: safeSiteUrl(),
  title: {
    default: "CPS Academy — Modern Learning Platform",
    template: "%s | CPS Academy",
  },
  description:
    "CPS Academy is a modern SaaS learning platform for courses, quizzes, and progress tracking.",
  icons: {
    icon: [{ url: "/favicon.png", type: "image/png" }, { url: "/logo.png", type: "image/png" }],
    apple: "/logo.png",
    shortcut: "/favicon.png",
  },
  openGraph: {
    title: "CPS Academy",
    description: "Learn. Build. Level up with CPS Academy.",
    siteName: "CPS Academy",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${dmSans.variable} ${spaceGrotesk.variable} min-h-screen font-sans antialiased`}
      >
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
