import Link from "next/link";
import { Logo } from "../brand/Logo";

export function Footer() {
  return (
    <footer className="border-t border-[#dfe1da] bg-white">
      <div className="mx-auto flex max-w-7xl flex-col gap-8 px-5 py-10 sm:flex-row sm:items-center sm:justify-between lg:px-8">
        <div>
          <Logo />
          <p className="mt-3 text-sm text-[#7a827d]">A better way to know what people think.</p>
        </div>
        <div className="flex flex-wrap gap-x-7 gap-y-3 text-sm font-bold text-[#5e6862]">
          <Link href="/polls" className="hover:text-[#ff654f]">Explore</Link>
          <Link href="/#how-it-works" className="hover:text-[#ff654f]">Methodology</Link>
          {/* Privacy and contact pages do not exist yet, so these are not links. */}
          <span className="text-[#969c98]">Privacy</span>
          <span className="text-[#969c98]">Contact</span>
        </div>
        <p className="text-xs font-semibold text-[#969c98]">© 2025 Tally, Inc.</p>
      </div>
    </footer>
  );
}
