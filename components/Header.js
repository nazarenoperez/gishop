import Link from "next/link";

export default function Header({ current, children }) {
  return (
    <header>
      <Link href="/" className="logo">Gi<span>Shop</span></Link>
      <nav>
        <Link href="/" className={current === "catalogo" ? "active" : ""}>Catálogo</Link>
        <Link href="/admin" className={current === "admin" ? "active" : ""}>Admin</Link>
        {children}
      </nav>
    </header>
  );
}
