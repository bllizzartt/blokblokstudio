/**
 * Funnel layout — no Navbar, no Footer.
 * Pages in the (funnel) route group get this clean layout.
 */
export default function FunnelLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <main>{children}</main>;
}
