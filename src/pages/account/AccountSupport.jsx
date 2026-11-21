import React, { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Inbox, Loader2, Mail, MessageCircle, Phone, Send } from "lucide-react";
import { toast } from "sonner";
import { EmptyState, Panel } from "@/components/dashboard/ui.jsx";
import { formatDate } from "@/lib/hotel/pricing.js";
import { sendSupportMessage, useHotelState } from "@/lib/hotel/store.jsx";

export default function AccountSupport() {
  const state = useHotelState();
  const email = state.session?.email || "";
  const msgs = state.messages.filter(
    (m) => m.email?.toLowerCase().trim() === email.toLowerCase().trim()
  );
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const settings = state.settings;

  function submit(e) {
    e.preventDefault();
    if (!subject.trim() || subject.trim().length < 3) {
      toast.error("Please enter a subject (at least 3 characters).");
      return;
    }
    if (!message.trim() || message.trim().length < 5) {
      toast.error("Please enter your message (at least 5 characters).");
      return;
    }

    setBusy(true);
    setTimeout(() => {
      sendSupportMessage(email, subject.trim(), message.trim());
      setSubject("");
      setMessage("");
      setBusy(false);
      toast.success("Message transmitted directly to reception!");
    }, 500);
  }

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <Panel
        title="Contact Reception Desk"
        subtitle="Our 24-hour reception desk is here to assist with any requests."
        className="lg:col-span-2"
      >
        <form onSubmit={submit} className="space-y-4 text-xs">
          <div className="space-y-1.5">
            <label className="text-gold font-medium uppercase tracking-wide">Subject</label>
            <input
              required
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="e.g. Airport transfer, early check-in, extra pillows"
              className="w-full rounded-xl border border-gold/30 bg-navy-deep px-4 py-2.5 text-sm text-navy-foreground focus:border-gold focus:outline-none"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-gold font-medium uppercase tracking-wide">Message</label>
            <textarea
              required
              rows={5}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Please describe how our team can help make your stay exceptional..."
              className="w-full rounded-xl border border-gold/30 bg-navy-deep px-4 py-2.5 text-sm text-navy-foreground focus:border-gold focus:outline-none"
            />
          </div>

          <button
            type="submit"
            disabled={busy}
            className="inline-flex items-center gap-2 rounded-full bg-gold-gradient px-7 py-3 text-xs font-semibold uppercase tracking-wider text-gold-foreground shadow-gold disabled:opacity-50 hover:brightness-110 transition"
          >
            {busy ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
            {busy ? "Sending…" : "Send Message"}
          </button>
        </form>

        <div className="mt-8 border-t border-gold/15 pt-6">
          <p className="text-xs font-semibold tracking-widest text-gold uppercase">Your Message History</p>
          {msgs.length === 0 ? (
            <EmptyState
              icon={Inbox}
              title="No messages yet"
              text="Messages you send to reception will be cataloged here."
            />
          ) : (
            <ul className="mt-4 space-y-3">
              <AnimatePresence initial={false}>
                {msgs.map((m) => (
                  <motion.li
                    key={m.id}
                    layout
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="rounded-xl border border-gold/15 bg-navy-deep/60 p-4"
                  >
                    <div className="flex justify-between items-center gap-3">
                      <p className="font-semibold text-sm text-navy-foreground">{m.subject}</p>
                      <span className="text-[11px] text-navy-foreground/50">{formatDate(m.createdAt)}</span>
                    </div>
                    <p className="mt-2 text-xs text-navy-foreground/75 leading-relaxed">{m.message}</p>
                    <p className="mt-2 text-[11px] font-medium text-emerald-400">✓ Delivered to Reception Desk</p>
                  </motion.li>
                ))}
              </AnimatePresence>
            </ul>
          )}
        </div>
      </Panel>

      <Panel title="Direct Assistance">
        <div className="space-y-3">
          {[
            {
              icon: Phone,
              label: "Front Desk Hotline",
              value: settings?.phone || "+91 94294 88388",
              href: `tel:${(settings?.phone || "").replace(/\s/g, "")}`,
            },
            {
              icon: Mail,
              label: "Guest Email",
              value: settings?.email || "hotelmeri@gmail.com",
              href: `mailto:${settings?.email || "hotelmeri@gmail.com"}`,
            },
            {
              icon: MessageCircle,
              label: "WhatsApp Concierge",
              value: "Chat on WhatsApp",
              href: `https://wa.me/${settings?.whatsapp || "919429488388"}`,
            },
          ].map((c) => (
            <a
              key={c.label}
              href={c.href}
              target={c.icon === MessageCircle ? "_blank" : undefined}
              rel="noreferrer"
              className="flex items-center gap-3 rounded-xl border border-gold/15 bg-navy-deep/40 p-3.5 transition hover:border-gold hover:bg-white/5"
            >
              <span className="grid size-10 place-items-center rounded-full bg-navy text-gold">
                <c.icon className="size-4" />
              </span>
              <div>
                <span className="block text-[11px] uppercase tracking-wider text-navy-foreground/50">
                  {c.label}
                </span>
                <span className="text-xs font-semibold text-navy-foreground">{c.value}</span>
              </div>
            </a>
          ))}
        </div>
      </Panel>
    </div>
  );
}
