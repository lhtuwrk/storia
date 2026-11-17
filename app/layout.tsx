import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import "@/styles/global.css";

export const metadata: Metadata = {
  title: {
    default: "tho. handmade — Những điều nhỏ được làm bằng tay",
    template: "%s · tho. handmade",
  },
  description: "Showroom những món đồ len móc tay của tho. handmade. Mỗi sản phẩm được làm thủ công với sự dịu dàng và chăm chút.",
  applicationName: "tho. handmade",
  icons: { icon: "/assets/flower-mark.svg" },
};

export const viewport: Viewport = {
  themeColor: "#F3EEE8",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="vi">
      <body>{children}</body>
    </html>
  );
}
