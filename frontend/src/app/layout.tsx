import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "PSI — Payment Solutions International",
  description:
    "On-ramp, off-ramp liquidity for global solutions in Fiat and Stablecoins. Bridging traditional finance and digital assets.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="bg-[#07080F] text-white antialiased">{children}</body>
    </html>
  );
}
