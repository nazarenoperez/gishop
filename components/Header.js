"use client";
import Link from "next/link";

const SearchIcon = () => (
  <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor"
    strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <circle cx="11" cy="11" r="7" />
    <path d="m20 20-3.5-3.5" />
  </svg>
);

const UserIcon = () => (
  <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor"
    strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <circle cx="12" cy="8" r="4" />
    <path d="M4 21c0-4 3.6-7 8-7s8 3 8 7" />
  </svg>
);

// items: [{ key, label, active, onClick }]  → menú del catálogo (botones)
// sin items: enlaces simples Catálogo / Admin (usado en el admin)
export default function Header({ current, items, onSearch, below, children }) {
  return (
    <div className="topbar">
      <header className="site-header">
        <Link href="/" className="logo">GI<span>SHOP</span></Link>

        <nav className="site-nav" aria-label="Principal">
          {items ? (
            items.map(it => (
              <button
                key={it.key}
                type="button"
                className={"nav-item" + (it.active ? " active" : "")}
                onClick={it.onClick}
              >
                {it.label}
              </button>
            ))
          ) : (
            <>
              <Link href="/" className={"nav-item" + (current === "catalogo" ? " active" : "")}>Catálogo</Link>
              <Link href="/admin" className={"nav-item" + (current === "admin" ? " active" : "")}>Admin</Link>
            </>
          )}
        </nav>

        <div className="header-actions">
          {onSearch && (
            <button type="button" className="icon-btn" onClick={onSearch} aria-label="Buscar">
              <SearchIcon />
            </button>
          )}
          {current !== "admin" && (
            <Link href="/admin" className="icon-btn" aria-label="Administración">
              <UserIcon />
            </Link>
          )}
          {children}
        </div>
      </header>
      {below}
    </div>
  );
}
