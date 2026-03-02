"use client";

import { motion } from "framer-motion";
import { CalendarPlus, UserPlus, CheckCircle, BarChart2 } from "lucide-react";

const STEPS = [
  {
    icon: CalendarPlus,
    step: "01",
    title: "Create an event",
    description:
      "Fill in the details manually, or just type a description and let AI parse it for you.",
  },
  {
    icon: UserPlus,
    step: "02",
    title: "Invite attendees",
    description:
      "Send email invitations directly from the app. Recipients get a link to RSVP.",
  },
  {
    icon: CheckCircle,
    step: "03",
    title: "Collect RSVPs",
    description:
      "Track who's attending, maybe, or declining in real time from your dashboard.",
  },
  {
    icon: BarChart2,
    step: "04",
    title: "Stay on track",
    description:
      "Conflict alerts prevent double-booking. AI suggests ideal time slots when you need flexibility.",
  },
];

export function HowItWorks() {
  return (
    <section className="py-20">
      <div className="container mx-auto max-w-5xl px-4">
        <div className="text-center mb-14">
          <h2 className="text-3xl font-bold tracking-tight">How it works</h2>
          <p className="mt-2 text-muted-foreground">Four steps from idea to scheduled event.</p>
        </div>

        <div className="relative grid md:grid-cols-4 gap-8">
          {/* Connector line */}
          <div className="hidden md:block absolute top-8 left-[12.5%] right-[12.5%] h-px bg-border" />

          {STEPS.map(({ icon: Icon, step, title, description }, i) => (
            <motion.div
              key={step}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.12, duration: 0.5 }}
              viewport={{ once: true }}
              className="relative flex flex-col items-center text-center gap-3"
            >
              <div className="relative z-10 flex size-16 items-center justify-center rounded-full bg-primary/10 border-2 border-primary/30">
                <Icon className="size-6 text-primary" />
              </div>
              <span className="text-xs font-bold text-primary/60 tracking-widest">{step}</span>
              <h3 className="font-semibold text-sm">{title}</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">{description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
