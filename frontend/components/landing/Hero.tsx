"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, LayoutDashboard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Hero3D } from "./Hero3D";
import { useAuth } from "@/features/auth/AuthProvider";

export function Hero() {
  const { firebaseUser } = useAuth();

  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-background to-muted/30 pt-20 pb-24">
      {/* Decorative blobs */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-32 -right-32 size-96 rounded-full bg-primary/10 blur-3xl" />
        <div className="absolute -bottom-32 -left-32 size-96 rounded-full bg-violet-500/10 blur-3xl" />
      </div>

      <div className="container mx-auto max-w-6xl px-4 grid lg:grid-cols-2 gap-12 items-center relative z-10">
        {/* Left: copy */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="space-y-6"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1 }}
            className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/5 px-4 py-1.5 text-sm text-primary font-medium"
          >
            ✨ Smart event scheduling with AI
          </motion.div>

          <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight leading-tight">
            Plan events.{" "}
            <span className="text-primary">Invite people.</span>
            <br /> Stay on track.
          </h1>

          <p className="text-lg text-muted-foreground max-w-md">
            Conflict detection, real-time invitations & RSVP, and AI-powered event
            parsing — all in one place. Schedule smarter, not harder.
          </p>

          <div className="flex flex-wrap gap-3 pt-2">
            <Button size="lg" asChild>
              <Link href={firebaseUser ? "/dashboard" : "/signup"}>
                {firebaseUser ? "Go to Dashboard" : "Get Started"}
                <ArrowRight className="ml-2 size-4" />
              </Link>
            </Button>
            {!firebaseUser && (
              <Button size="lg" variant="outline" asChild>
                <Link href="/dashboard">
                  <LayoutDashboard className="mr-2 size-4" />
                  View Dashboard
                </Link>
              </Button>
            )}
          </div>

          <div className="flex items-center gap-6 pt-2 text-sm text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <span className="size-2 rounded-full bg-emerald-500" /> Free to use
            </span>
            <span className="flex items-center gap-1.5">
              <span className="size-2 rounded-full bg-emerald-500" /> No credit card
            </span>
            <span className="flex items-center gap-1.5">
              <span className="size-2 rounded-full bg-emerald-500" /> Open API
            </span>
          </div>
        </motion.div>

        {/* Right: 3D hero */}
        <motion.div
          initial={{ opacity: 0, scale: 0.85 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.25, duration: 0.7, ease: "easeOut" }}
        >
          <Hero3D />
        </motion.div>
      </div>
    </section>
  );
}
