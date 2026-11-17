"use client";

import Link from "next/link";
import { useState } from "react";

export default function SiteHeader() {
  const [open, setOpen] = useState(false);
  return (
    <header className="site-header">
      <div className="container header-inner">
        <Link href="/" aria-label="tho. handmade - Trang chủ">
          <img className="brand-logo" src="/assets/logo-horizontal.svg" alt="tho. handmade" />
        </Link>
        <nav className={`header-nav ${open ? "open" : ""}`} aria-label="Điều hướng chính">
          <Link href="/#products" onClick={() => setOpen(false)}>Sản phẩm</Link>
          <Link href="/#story" onClick={() => setOpen(false)}>Câu chuyện</Link>
          <Link href="/#contact" onClick={() => setOpen(false)}>Liên hệ</Link>
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
