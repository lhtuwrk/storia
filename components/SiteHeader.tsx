"use client";

import Link from "next/link";
import { useState } from "react";

const sections = [
  { id: "products", label: "Sản phẩm" },
  { id: "story", label: "Câu chuyện" },
  { id: "contact", label: "Liên hệ" },
];

export default function SiteHeader({ onShowroom = false }: { onShowroom?: boolean }) {
  const [open, setOpen] = useState(false);
  const closeMenu = () => setOpen(false);
  const logo = <img className="brand-logo" src="/assets/logo-horizontal.svg" alt="tho. handmade" />;

  return (
    <header className="site-header">
      <div className="container header-inner">
        {onShowroom ? (
          <a href="#top" onClick={closeMenu} aria-label="tho. handmade - Trang chủ">{logo}</a>
        ) : (
          <Link href="/" aria-label="tho. handmade - Trang chủ">{logo}</Link>
        )}
        <nav className={`header-nav ${open ? "open" : ""}`} aria-label="Điều hướng chính">
          {sections.map(({ id, label }) => onShowroom ? (
            <a key={id} href={`#${id}`} onClick={closeMenu}>{label}</a>
          ) : (
            <Link key={id} href={`/#${id}`} onClick={closeMenu}>{label}</Link>
          ))}
        </nav>
        <button
          className="mobile-menu"
          type="button"
          aria-label={open ? "Đóng menu" : "Mở menu"}
          aria-expanded={open}
          onClick={() => setOpen((value) => !value)}
        >
          {open ? "×" : "☰"}
        </button>
      </div>
    </header>
  );
}
