import { Link, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { ArrowLeft, Award, Printer } from "lucide-react";
import { apiGet } from "../lib/api";
import type { Certificate } from "@lms/shared";
import { AppShell } from "../components/AppShell";
import { GlassCard } from "../components/ui/GlassCard";
import { MeshGradient } from "../components/ui/MeshGradient";
import { Button } from "../components/ui/Button";

export function CertificatePage() {
  const { id } = useParams<{ id: string }>();
  const query = useQuery<Certificate>({
    queryKey: ["certificate", id],
    queryFn: () => apiGet<Certificate>(`/certificates/${id}`),
    enabled: !!id,
  });

  const cert = query.data;
  const issued = cert ? new Date(cert.issuedAt).toLocaleDateString(undefined, {
    year: "numeric",
    month: "long",
    day: "numeric",
  }) : "";

  return (
    <div className="relative min-h-screen">
      <MeshGradient />
      <AppShell>
        <div className="flex items-center justify-between gap-3 print:hidden">
          <Link
            to="/dashboard"
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" /> Dashboard
          </Link>
          {cert && (
            <Button variant="outline" onClick={() => window.print()}>
              <Printer className="h-4 w-4" /> Print / Save as PDF
            </Button>
          )}
        </div>

        {query.isLoading && <GlassCard className="mt-6">Loading certificate…</GlassCard>}
        {query.isError && (
          <GlassCard className="mt-6">
            <p className="text-destructive">Couldn't load this certificate.</p>
          </GlassCard>
        )}

        {cert && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mt-8 print:mt-0"
          >
            <div
              id="certificate-sheet"
              className="mx-auto max-w-3xl rounded-[28px] border border-white/40 bg-white px-10 py-16 text-center shadow-glass dark:border-white/10 dark:bg-[hsl(250_25%_13%)] print:border-0 print:shadow-none"
            >
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-primary/15 text-primary">
                <Award className="h-7 w-7" />
              </div>
              <p className="mt-6 text-xs font-medium uppercase tracking-[0.3em] text-primary">
                Certificate of Completion
              </p>
              <p className="mt-8 text-sm text-muted-foreground">This certifies that</p>
              <h1 className="mt-2 font-serif text-5xl font-semibold tracking-tight">
                {cert.userFullName}
              </h1>
              <p className="mt-6 text-sm text-muted-foreground">
                has successfully completed the course
              </p>
              <h2 className="mt-2 font-serif text-3xl font-semibold italic">
                {cert.courseTitle}
              </h2>

              <div className="mt-12 flex items-center justify-between text-xs text-muted-foreground">
                <div className="text-left">
                  <p className="font-medium uppercase tracking-wider">Issued</p>
                  <p className="mt-1 font-serif text-sm text-foreground">{issued}</p>
                </div>
                <div className="text-right">
                  <p className="font-medium uppercase tracking-wider">Verify at</p>
                  <p className="mt-1 font-mono text-[11px] text-foreground">
                    /api/certificates/verify/{cert.slug}
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AppShell>
    </div>
  );
}
