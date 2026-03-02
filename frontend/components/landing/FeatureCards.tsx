"use client";

import { motion } from "framer-motion";
import { AlertTriangle, Mail, Sparkles, Clock4 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

const FEATURES = [
  {
    icon: AlertTriangle,
    color: "text-amber-500 bg-amber-500/10",
    title: "Conflict Detection",
    description:
      "Instantly spot scheduling overlaps before they happen. Skip or override with one click.",
  },
  {
    icon: Mail,
    color: "text-sky-500 bg-sky-500/10",
    title: "Invitations & RSVP",
    description:
      "Invite attendees by email and track their RSVP status — attending, maybe, or declined — in real time.",
  },
  {
    icon: Sparkles,
    color: "text-violet-500 bg-violet-500/10",
    title: "AI Event Parsing",
    description:
      'Type "Lunch with Sarah next Friday at 1 PM" and let AI fill in all the event fields for you.',
  },
  {
    icon: Clock4,
    color: "text-emerald-500 bg-emerald-500/10",
    title: "Smart Time Suggestions",
    description:
      "Describe your perfect meeting and get AI-generated time-slot recommendations that fit your calendar.",
  },
] as const;

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.12 } },
};

const item = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" as const } },
};

export function FeatureCards() {
  return (
    <section className="py-20 bg-muted/20">
      <div className="container mx-auto max-w-6xl px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold tracking-tight">Everything you need</h2>
          <p className="mt-2 text-muted-foreground max-w-xl mx-auto">
            A full-featured scheduling platform — minus the complexity.
          </p>
        </div>

        <motion.div
          variants={container}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.2 }}
          className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5"
        >
          {FEATURES.map(({ icon: Icon, color, title, description }) => (
            <motion.div key={title} variants={item}>
              <Card className="h-full hover:shadow-md transition-shadow border-border/60">
                <CardContent className="pt-6 space-y-3">
                  <div className={`inline-flex rounded-xl p-2.5 ${color}`}>
                    <Icon className="size-5" />
                  </div>
                  <h3 className="font-semibold text-base">{title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {description}
                  </p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
