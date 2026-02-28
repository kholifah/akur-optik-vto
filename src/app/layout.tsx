import "./globals.css";
import type { ReactNode } from "react";
import StoreProvider from "@/store";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import FloatingTryOnButton from "@/components/tryon/FloatingTryOnButton";

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body suppressHydrationWarning>
        <StoreProvider>
          <Header />
          <main>{children}</main>
          <Footer />
          <FloatingTryOnButton />
        </StoreProvider>
      </body>
    </html>
  );
}
