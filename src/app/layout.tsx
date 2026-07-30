import type { Metadata, Viewport } from "next";
import { Inter, Playfair_Display, JetBrains_Mono, Heebo } from "next/font/google";
import "./globals.css";
import { GlobalThemeProvider } from "@/context/GlobalThemeContext";
import { Navbar } from "@/components/Navbar";

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" });
const heebo = Heebo({ subsets: ["hebrew", "latin"], variable: "--font-hebrew" });
const playfair = Playfair_Display({ subsets: ["latin"], variable: "--font-serif" });
const jetbrains = JetBrains_Mono({ subsets: ["latin"], variable: "--font-mono" });

export const metadata: Metadata = {
  title: "ח.סבן | SabanOS 2.0 - קטלוג פרימיום לחומרי בניין",
  description: "הקטלוג הדיגיטלי המוביל לחומרי בניין בישראל. כולל ייעוץ AI טכני, אנציקלופדיית חומרים וחוויית משתמש יוקרתית.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "ח.סבן",
  },
  formatDetection: {
    telephone: false,
  },
};

export const viewport: Viewport = {
  themeColor: "#c5a059",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="he" dir="rtl" suppressHydrationWarning>
      <body className={`${inter.variable} ${heebo.variable} ${playfair.variable} ${jetbrains.variable} font-sans antialiased`}>
        <GlobalThemeProvider>
          {children}
        </GlobalThemeProvider>
      </body>
    </html>
  );
}
