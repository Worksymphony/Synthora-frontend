import type { Metadata } from "next";
import { Geist, Geist_Mono,Poppins,Inter,Libre_Bodoni } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});
const getPoppins=Poppins({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-poppins",
})
const getLibre_Bodoni=Libre_Bodoni({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--libre_bodoni",
})
const getInter=Inter({
  subsets:["latin"],
  weight:["400", "500", "600", "700"],
  variable:"--font-inter",
})
const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Synthora By WorkSymphony",
  description: "Synthora is a HR tech Platform integrated with Artificial Intelligence to ease out the work flow of talent Aquasition Companys",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${getPoppins.variable} ${getInter.variable} ${getLibre_Bodoni.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
