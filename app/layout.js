import "./globals.css";

export const metadata = {
  title: "GiShop · Indumentaria de Brazilian Jiu-Jitsu",
  description: "Catálogo de kimonos, rushguards y shorts de Brazilian Jiu-Jitsu"
};

export default function RootLayout({ children }) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}
