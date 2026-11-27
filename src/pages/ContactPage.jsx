import React, { useState } from "react";
import { toast } from "sonner";
import { AnimatePresence, motion } from "framer-motion";
import { MapPin, Phone, Mail, Clock, MessageCircle, Send, CheckCircle2 } from "lucide-react";
import { SiteLayout } from "@/components/site/SiteLayout.jsx";
import { PageHero } from "@/components/site/PageHero.jsx";
import { Reveal } from "@/components/site/Reveal.jsx";
import { useHotel, sendSupportMessage } from "@/lib/hotel/store.jsx";
import {
  validatePhoneNumber,
  validateEmail,
  validateName,
  validateText,
  sanitizePhoneInput,
  sanitizeNameInput,
} from "@/lib/hotel/validation.js";
import { IMG } from "@/lib/hotel/images.js";

const EASE = [0.22, 1, 0.36, 1];

export default function ContactPage() {
  const settings = useHotel((s) => s.settings) || {
    address: "No-30, Narmadapuram Rd (Hoshangabad Road), near Satyam Showroom, Nirmal Estate, Koushal Nagar, Misrod, Bhopal, Madhya Pradesh 462047",
    phone: "+91 90394 08329",
    email: "hotelmeri24@gmail.com",
    whatsapp: "919039408329",
    checkInTime: "11:00 AM",
    checkOutTime: "10:00 AM",
  };

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [message, setMessage] = useState("");
  const [errors, setErrors] = useState({});
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  const clearError = (field) => {
    setErrors((prev) => {
      if (!prev[field]) return prev;
      const next = { ...prev };
      delete next[field];
      return next;
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (sending) return;

    const nextErrors = {};
    const nameRes = validateName(name, { label: "Full name" });
    if (!nameRes.valid) nextErrors.name = nameRes.error;

    const emailRes = validateEmail(email);
    if (!emailRes.valid) nextErrors.email = emailRes.error;

    let formattedPhone = "No phone";
    if (phone.trim()) {
      const phoneRes = validatePhoneNumber(phone);
      if (!phoneRes.valid) nextErrors.phone = phoneRes.error;
      else formattedPhone = phoneRes.formatted;
    }

    const msgRes = validateText(message, { label: "Message", min: 5, max: 2000 });
    if (!msgRes.valid) nextErrors.message = msgRes.error;

    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      toast.error(Object.values(nextErrors)[0]);
      return;
    }

    setSending(true);
    setTimeout(() => {
      sendSupportMessage(emailRes.email, `Website enquiry from ${nameRes.value} (${formattedPhone})`, msgRes.value);
      setSending(false);
      setSent(true);
      toast.success("Message sent — our royal concierge team will reply shortly.");
    }, 700);
  };

  const cards = [
    { icon: MapPin, label: "Address", value: settings.address },
    {
      icon: Phone,
      label: "Phone",
      value: settings.phone,
      href: `tel:${settings.phone.replace(/\s/g, "")}`,
    },
    { icon: Mail, label: "Email", value: settings.email, href: `mailto:${settings.email}` },
    {
      icon: Clock,
      label: "Reception",
      value: `Open 24 hours · Check-in ${settings.checkInTime || "12:00 PM"} · Check-out ${settings.checkOutTime || "11:00 AM"}`,
    },
  ];

  return (
    <SiteLayout>
      <PageHero
        image={IMG.lobby}
        eyebrow="Contact"
        title={
          <>
            We'd love to <em className="text-gold">hear from you</em>
          </>
        }
        subtitle="Inquiries, special celebratory arrangements, or group reservations — our reception team is here around the clock."
      />

      <div className="bg-[#FAF7F2] text-[#061830]">
        <section className="mx-auto grid max-w-7xl gap-10 px-6 py-24 lg:grid-cols-5">
          {/* Contact Info Cards */}
          <div className="space-y-4 lg:col-span-2">
            {cards.map((c, i) => (
              <Reveal
                key={c.label}
                variant="flip"
                delay={i * 0.12}
                className="group flex gap-4 rounded-2xl border border-gold/30 bg-white p-6 shadow-card transition-shadow hover:shadow-lift"
              >
                <span className="grid size-12 shrink-0 place-items-center rounded-full bg-gold/10 border border-gold/30 text-gold transition-transform duration-700 [transform-style:preserve-3d] group-hover:[transform:rotateY(360deg)]">
                  <c.icon className="size-5" />
                </span>
                <div>
                  <p className="eyebrow !text-[0.65rem] text-gold font-bold">{c.label}</p>
                  {c.href ? (
                    <a href={c.href} className="mt-1 block text-[#061830] font-semibold hover:text-gold transition text-sm">
                      {c.value}
                    </a>
                  ) : (
                    <p className="mt-1 text-[#061830] font-semibold text-sm leading-relaxed">{c.value}</p>
                  )}
                </div>
              </Reveal>
            ))}

            <a
              href={`https://wa.me/${(settings.whatsapp || "919412288334").replace(/\D/g, "")}`}
              target="_blank"
              rel="noreferrer"
              className="flex w-full items-center justify-center gap-2 rounded-2xl bg-emerald-600 py-4 text-xs font-bold uppercase tracking-wider text-white shadow-md hover:bg-emerald-700 transition"
            >
              <MessageCircle className="size-5" /> Chat on WhatsApp
            </a>
          </div>

          {/* 3D Animated Form */}
          <Reveal
            variant="right"
            className="rounded-2xl p-8 shadow-card lg:col-span-3 md:p-10 border border-gold/30 bg-white text-[#061830]"
          >
            <AnimatePresence mode="wait" initial={false}>
              {sent ? (
                <motion.div
                  key="sent"
                  style={{ transformPerspective: 1400 }}
                  initial={{ rotateY: -90, opacity: 0 }}
                  animate={{ rotateY: 0, opacity: 1 }}
                  exit={{ rotateY: 90, opacity: 0 }}
                  transition={{ duration: 0.55, ease: EASE }}
                  className="flex h-full flex-col items-center justify-center py-16 text-center"
                >
                  <CheckCircle2 className="size-16 text-emerald-600" strokeWidth={1.3} />
                  <h3 className="mt-5 font-display text-4xl font-bold text-[#061830]">Thank you!</h3>
                  <p className="mt-2 text-[#475569] text-sm max-w-sm">
                    Your message has reached our reception desk. We will reach back out promptly.
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setSent(false);
                      setMessage("");
                    }}
                    className="mt-6 rounded-full border border-gold/40 bg-[#FAF7F2] px-6 py-2.5 text-xs font-bold uppercase text-[#061830] hover:bg-gold/15 transition cursor-pointer"
                  >
                    Send another message
                  </button>
                </motion.div>
              ) : (
                <motion.form
                  key="form"
                  noValidate
                  style={{ transformPerspective: 1400 }}
                  initial={{ rotateY: 90, opacity: 0 }}
                  animate={{ rotateY: 0, opacity: 1 }}
                  exit={{ rotateY: -90, opacity: 0 }}
                  transition={{ duration: 0.55, ease: EASE }}
                  onSubmit={handleSubmit}
                  className="grid gap-5 sm:grid-cols-2"
                >
                  <div className="sm:col-span-2">
                    <p className="eyebrow text-gold font-bold">Write to us</p>
                    <h2 className="mt-2 font-display text-4xl font-bold text-[#061830]">Send a Message</h2>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold uppercase tracking-wider text-[#061830]">Full name</label>
                    <input
                      value={name}
                      maxLength={80}
                      onChange={(e) => {
                        setName(sanitizeNameInput(e.target.value));
                        clearError("name");
                      }}
                      placeholder="Your name"
                      className={`w-full rounded-xl border bg-[#FAF7F2] px-4 py-2.5 text-sm text-[#061830] placeholder:text-[#64748b] focus:outline-none ${
                        errors.name ? "border-rose-500 focus:border-rose-500" : "border-gold/30 focus:border-gold"
                      }`}
                    />
                    {errors.name && <p className="text-[11px] font-medium text-rose-600">{errors.name}</p>}
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold uppercase tracking-wider text-[#061830]">Phone (10 digits)</label>
                    <input
                      value={phone}
                      inputMode="numeric"
                      maxLength={10}
                      onChange={(e) => {
                        setPhone(sanitizePhoneInput(e.target.value));
                        clearError("phone");
                      }}
                      type="tel"
                      placeholder="9876543210"
                      className={`w-full rounded-xl border bg-[#FAF7F2] px-4 py-2.5 text-sm text-[#061830] placeholder:text-[#64748b] focus:outline-none ${
                        errors.phone ? "border-rose-500 focus:border-rose-500" : "border-gold/30 focus:border-gold"
                      }`}
                    />
                    {errors.phone && <p className="text-[11px] font-medium text-rose-600">{errors.phone}</p>}
                  </div>

                  <div className="space-y-1.5 sm:col-span-2">
                    <label className="text-xs font-bold uppercase tracking-wider text-[#061830]">Email</label>
                    <input
                      value={email}
                      maxLength={254}
                      onChange={(e) => {
                        setEmail(e.target.value);
                        clearError("email");
                      }}
                      type="email"
                      placeholder="you@example.com"
                      className={`w-full rounded-xl border bg-[#FAF7F2] px-4 py-2.5 text-sm text-[#061830] placeholder:text-[#64748b] focus:outline-none ${
                        errors.email ? "border-rose-500 focus:border-rose-500" : "border-gold/30 focus:border-gold"
                      }`}
                    />
                    {errors.email && <p className="text-[11px] font-medium text-rose-600">{errors.email}</p>}
                  </div>

                  <div className="space-y-1.5 sm:col-span-2">
                    <label className="text-xs font-bold uppercase tracking-wider text-[#061830]">Message</label>
                    <textarea
                      value={message}
                      maxLength={2000}
                      onChange={(e) => {
                        setMessage(e.target.value);
                        clearError("message");
                      }}
                      rows={4}
                      placeholder="How can our royal concierge assist you?"
                      className={`w-full rounded-xl border bg-[#FAF7F2] px-4 py-2.5 text-sm text-[#061830] placeholder:text-[#64748b] focus:outline-none ${
                        errors.message ? "border-rose-500 focus:border-rose-500" : "border-gold/30 focus:border-gold"
                      }`}
                    />
                    {errors.message && <p className="text-[11px] font-medium text-rose-600">{errors.message}</p>}
                  </div>

                  <button
                    type="submit"
                    disabled={sending}
                    className="sm:col-span-2 flex items-center justify-center gap-2 rounded-full bg-gold-gradient py-3.5 text-xs font-bold tracking-wider text-gold-foreground uppercase shadow-gold hover:brightness-110 transition cursor-pointer"
                  >
                    <Send className="size-4" /> {sending ? "Sending…" : "Submit Inquiry"}
                  </button>
                </motion.form>
              )}
            </AnimatePresence>
          </Reveal>
        </section>

        {/* 3D Map Floor Gliding Section */}
        <section className="mx-auto max-w-7xl px-6 pb-28">
          <Reveal
            variant="zoom"
            className="relative grid h-84 place-items-center overflow-hidden rounded-3xl bg-[#061830] text-center text-white perspective-[700px] border border-gold/30 shadow-lift"
          >
            {/* Gold grid laid flat like a city floor, gliding toward you */}
            <div className="map-floor absolute -inset-x-1/2 top-1/4 -bottom-1/2 pointer-events-none" />

            <div className="relative z-10 px-6">
              <motion.div
                style={{ transformPerspective: 600 }}
                initial={{ y: -160, rotateY: 0, opacity: 0 }}
                whileInView={{ y: 0, rotateY: 720, opacity: 1 }}
                viewport={{ once: false }}
                transition={{ duration: 1.4, ease: EASE, delay: 0.3 }}
              >
                <MapPin className="mx-auto size-12 animate-bounce text-gold" />
              </motion.div>
              <h3 className="mt-4 font-display text-3xl font-bold text-white">
                Misrod, Bhopal
              </h3>
              <p className="mt-2 text-sm text-white/80 max-w-md mx-auto">
                No-30, Narmadapuram Rd (Hoshangabad Road), near Satyam Showroom, Nirmal Estate, Koushal Nagar • Open 24 Hours.
              </p>
              <a
                href="https://maps.google.com/?q=Hotel+Meri+Hoshangabad+Road+Misrod+Bhopal+462047"
                target="_blank"
                rel="noreferrer"
                className="mt-5 inline-flex items-center gap-2 rounded-full border border-gold/50 bg-white/10 px-6 py-2.5 text-xs font-semibold uppercase tracking-wider text-champagne hover:bg-gold hover:text-gold-foreground transition shadow-sm"
              >
                Open in Google Maps
              </a>
            </div>
          </Reveal>
        </section>
      </div>
    </SiteLayout>
  );
}
