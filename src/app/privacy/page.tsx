import { Metadata } from "next";
import { ShieldCheck, Lock, EyeOff, Server, HardDrive } from "lucide-react";
import { Breadcrumb } from "@/components/layout/Breadcrumb";

export const metadata: Metadata = {
  title: "Privacy Policy & Guarantees — UtilityHub",
  description: "Learn how UtilityHub processes your files 100% locally in your browser with zero server uploads.",
};

export default function PrivacyPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8 space-y-10">
      <Breadcrumb items={[{ label: "Privacy Policy" }]} />

      <div className="space-y-4 pb-6 border-b border-slate-200 dark:border-slate-800">
        <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 text-xs font-semibold">
          <ShieldCheck className="h-4 w-4" />
          <span>Local-First Privacy Architecture</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white">
          Privacy Policy & Security Guarantees
        </h1>
        <p className="text-base text-slate-600 dark:text-slate-400 leading-relaxed">
          At UtilityHub, your data privacy is not an afterthought or marketing claim. It is hardcoded into our system architecture.
        </p>
      </div>

      <div className="space-y-8 text-slate-700 dark:text-slate-300 leading-relaxed text-sm sm:text-base">
        <section className="space-y-3">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center space-x-2">
            <Lock className="h-5 w-5 text-emerald-500" />
            <span>1. Client-Side Only Processing</span>
          </h2>
          <p>
            Whenever you drop a PDF, image, archive, or code file into UtilityHub, the processing logic executes entirely within your browser runtime via WebAssembly, HTML5 Canvas, Web Crypto, and Web Workers.
          </p>
          <p className="font-semibold text-slate-900 dark:text-white">
            Your files are never transmitted to our web servers, third-party cloud storage, or external APIs.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center space-x-2">
            <EyeOff className="h-5 w-5 text-blue-500" />
            <span>2. No Tracking of File Contents</span>
          </h2>
          <p>
            We do not log file names, document text, metadata, hashes, or payload structures. Since our servers do not receive your files, it is technically impossible for us to inspect, retain, or monetize your documents.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center space-x-2">
            <HardDrive className="h-5 w-5 text-purple-500" />
            <span>3. Local Storage Policy</span>
          </h2>
          <p>
            We only utilize standard browser `localStorage` for harmless non-identifiable user preferences:
          </p>
          <ul className="list-disc pl-6 space-y-1 text-sm">
            <li>Visual theme preference (light, dark, system)</li>
            <li>Favorited tool identifiers</li>
            <li>Recent tool slugs for quick navigation history</li>
          </ul>
          <p className="text-xs text-slate-500 mt-2">
            You can clear your local tool history at any time with a single click.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center space-x-2">
            <Server className="h-5 w-5 text-amber-500" />
            <span>4. Rare Server-Dependent Utilities</span>
          </h2>
          <p>
            If a future utility technically requires remote network access (such as authoritative DNS query lookups or WHOIS lookups blocked by browser CORS restrictions), it will be explicitly labeled as:
          </p>
          <div className="p-3 rounded-lg bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900 text-amber-900 dark:text-amber-200 text-xs font-semibold">
            &quot;Requires server processing&quot;
          </div>
          <p>
            No client-side tool will ever silently fall back to server processing without your explicit consent.
          </p>
        </section>

        <section className="p-6 rounded-2xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2">
          <h3 className="font-bold text-slate-900 dark:text-white text-base">
            Open-Source Verification
          </h3>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            Because UtilityHub is 100% open-source, you can inspect our source code on GitHub, review all dependencies, build the project yourself, and even host it air-gapped on your private intranet.
          </p>
        </section>
      </div>
    </div>
  );
}
