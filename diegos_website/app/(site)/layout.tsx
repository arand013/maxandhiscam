import { Nav } from "@/components/Nav";
import { Footer } from "@/components/Footer";
import { Reveal } from "@/components/Reveal";
import { getSite } from "@/lib/content";

export default function SiteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const site = getSite();
  return (
    <>
      <Reveal />
      <Nav site={site} />
      <main className="flex-1">{children}</main>
      <Footer site={site} />
    </>
  );
}
