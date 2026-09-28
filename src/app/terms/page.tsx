import { Metadata } from "next";
import { Breadcrumb } from "@/components/layout/Breadcrumb";

export const metadata: Metadata = {
  title: "Terms of Service — UtilityHub",
  description: "Terms and conditions for using UtilityHub's local-first tools and utilities.",
};

export default function TermsPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8 space-y-10">
      <Breadcrumb items={[{ label: "Terms of Service" }]} />

      <div className="space-y-4 pb-6 border-b border-slate-200 dark:border-slate-800">
        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white">
          Terms of Service
        </h1>
        <p className="text-base text-slate-600 dark:text-slate-400">
          Last updated: September 2026
        </p>
      </div>

      <div className="space-y-6 text-slate-700 dark:text-slate-300 text-sm sm:text-base leading-relaxed">
        <section className="space-y-2">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">1. Acceptance of Terms</h2>
          <p>
            By accessing and using UtilityHub, you agree to comply with and be bound by these Terms of Service. If you do not agree to these terms, please do not use the application.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">2. Open-Source Software License</h2>
          <p>
            UtilityHub is free and open-source software provided under the terms of the MIT License. You are free to inspect, fork, modify, and redistribute the application in compliance with the license terms.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">3. Local File Processing & Responsibility</h2>
          <p>
            Because UtilityHub executes all file transformations client-side inside your own browser session, you retain sole ownership and responsibility for the files and contents you process using this platform. We make no claim of ownership over your data.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">4. Disclaimer of Warranties</h2>
          <p>
            The software is provided &quot;AS IS&quot;, without warranty of any kind, express or implied, including but not limited to the warranties of merchantability, fitness for a particular purpose, and non-infringement. Always verify critical document transformations.
          </p>
        </section>
      </div>
    </div>
  );
}
