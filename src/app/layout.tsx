import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";
import { Navbar } from "@/components/layout/Navbar";

export const metadata: Metadata = {
  title: "Learning-Time | ระบบจัดตารางการเรียนการสอนอัตโนมัติอัจฉริยะ",
  description: "ระบบจัดตารางการเรียนการสอนอัตโนมัติ สอศ. วิทยาลัยเทคนิคระยอง รองรับการแข่งขันทักษะ AI ระดับภาค",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="th">
      <body className="bg-slate-50 text-slate-900 antialiased min-h-screen flex flex-col font-sans">
        <AuthProvider>
          <Navbar />
          <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">
            {children}
          </main>
          <footer className="bg-white border-t border-slate-200 py-4 text-center text-xs text-slate-500">
            © 2026 Learning-Time System | แผนกเทคโนโลยีสารสนเทศและการสื่อสาร วิทยาลัยเทคนิคระยอง (สอศ.)
          </footer>
        </AuthProvider>
      </body>
    </html>
  );
}
