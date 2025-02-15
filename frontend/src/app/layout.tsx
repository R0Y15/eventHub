import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from '@/components/ui/toaster';
import { ServerLoader } from "@/components/ui/server-loader";
import { useServerStatus } from "@/hooks/useServerStatus";
import { Suspense } from "react";
import dynamic from "next/dynamic";

const inter = Inter({ 
  subsets: ["latin"],
  display: 'swap',
});

export const metadata: Metadata = {
  title: "SwissMote - Event Management System",
  description: "A real-time event management platform",
};

function RootLayoutContent({ children }: { children: React.ReactNode }) {
  const { isLoading, error } = useServerStatus();

  return (
    <html lang="en">
      <body className={`${inter.className} min-h-screen bg-background antialiased`}>
        {isLoading && <ServerLoader error={error} />}
        {children}
        <Toaster />
      </body>
    </html>
  );
}

// Since useServerStatus is a hook, we need to wrap the content in a Client Component
const RootLayoutWithClientContent = dynamic(
  () => Promise.resolve(RootLayoutContent),
  { ssr: false }
);

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <RootLayoutWithClientContent>{children}</RootLayoutWithClientContent>;
}
