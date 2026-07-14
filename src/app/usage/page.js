import Link from "next/link";

import { UsageDashboard } from "@/components/usage-dashboard";

export const dynamic = "force-dynamic";

export default function UsagePage() {
  return (
    <main className="page-shell usage-page-shell">
      <div className="site-nav">
        <Link className="brand" href="/" style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <img src="/logo/image.png" alt="KLMCP" style={{ height: "48px", width: "auto" }} />
          <div className="brand-copy">
            <span>KLMCP</span>
            <span className="small">Usage analytics</span>
          </div>
        </Link>
        <Link className="button-tertiary-text" href="/">
          Home
        </Link>
      </div>

      <UsageDashboard />
    </main>
  );
}
