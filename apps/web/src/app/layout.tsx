import type { Metadata } from "next";
import "./globals.css";
import { Header } from "../shared/components/layout/Header";
import { Footer } from "../shared/components/layout/Footer";
import { QueryProvider } from "../shared/providers/QueryProvider";

export const metadata: Metadata = {
  title: "Tally — Every opinion counts",
  description: "A clearer way to take the public pulse.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    // globals.css opts into smooth scrolling. Next 16 no longer resets that
    // during navigation unless asked, which would make every route change
    // smooth-scroll to the top.
    <html lang="en" data-scroll-behavior="smooth">
      <body className="min-h-screen bg-[#fbfaf5] text-[#17231f] antialiased">
        <QueryProvider>
          <Header />
          {children}
          <Footer />
        </QueryProvider>
      </body>
    </html>
  );
}
