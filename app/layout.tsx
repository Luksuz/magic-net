import "@/app/globals.css";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { ThemeProvider } from "@/components/theme-provider";
import { Header } from "@/components/header";
import { DebugWindow } from "@/components/debug-window";
import { AuthProvider } from "./contexts/authContext";
import { createClient } from "@/utils/supabase/server";
import MainNavigation from "@/components/navigation/MainNavigation";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Magic Net - Ugovori",
  description: "Aplikacija za kreiranje ugovora",
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = createClient();
  const {
    data: { user },
  } = await (await supabase).auth.getUser();

  return (
    <html lang="hr" suppressHydrationWarning>
      <head>
        <script
          src="https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js"
          integrity="sha512-GsLlZN/3F2ErC5ifS5QtgpiJtWd43JWSuIgh7mbzZ8zBps+dvLusV+eNQATqgA/HdeKFVgA5v3S/cIrLF7QnIg=="
          crossOrigin="anonymous"
          referrerPolicy="no-referrer"
          async
        ></script>
      </head>
      <body className={`${inter.className} min-h-screen bg-background`}>
        <AuthProvider>
          <ThemeProvider
            attribute="class"
            defaultTheme="light"
            disableTransitionOnChange
          >
            <Header />
            {user && <MainNavigation />}
            <main className="md:ml-0 transition-all duration-300">
              {children}
            </main>
            <DebugWindow />
          </ThemeProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
