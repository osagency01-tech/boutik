"use client";

import { Reveal } from "@/components/motion";
import { WhatsAppIcon } from "@/components/phone-icon";
import { ErrorScreen, SkeletonList } from "@/components/states";
import * as api from "@/lib/api";
import { useStore } from "@/lib/store";
import type { DbMessage } from "@/lib/supabase";
import { AnimatePresence, motion } from "framer-motion";
import { Clock, Inbox, Mail, MailOpen, Phone, Trash2 } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

/* Messages de démonstration : l'écran doit être lisible sans backend. */
const DEMO: DbMessage[] = [
  {
    id: "1",
    shop_id: "demo",
    sender_name: "Aïcha Koné",
    sender_phone: "+225 07 09 11 22 33",
    sender_email: null,
    subject: "Disponibilité",
    body: "Bonjour, est-ce que la robe « Ama » existe en taille 42 ? Merci d'avance.",
    read_at: null,
    created_at: new Date(Date.now() - 3600e3).toISOString(),
  },
  {
    id: "2",
    shop_id: "demo",
    sender_name: "Moussa Diarra",
    sender_phone: "+225 05 44 55 66 77",
    sender_email: null,
    subject: null,
    body: "Bonsoir, vous livrez à Bouaké ? Et sous combien de jours ?",
    read_at: new Date(Date.now() - 7200e3).toISOString(),
    created_at: new Date(Date.now() - 86400e3).toISOString(),
  },
];

const timeAgo = (iso: string) => {
  const min = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  if (min < 1) return "à l'instant";
  if (min < 60) return `il y a ${min} min`;
  const h = Math.floor(min / 60);
  if (h < 24) return `il y a ${h} h`;
  const d = Math.floor(h / 24);
  return d === 1 ? "hier" : `il y a ${d} jours`;
};

export default function MessagesPage() {
  const { shopId, demoMode, palette } = useStore();
  const [messages, setMessages] = useState<DbMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [openId, setOpenId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(false);
    if (demoMode) {
      setMessages(DEMO);
      setLoading(false);
      return;
    }
    if (!shopId) return;
    try {
      setMessages(await api.fetchMessages(shopId));
    } catch {
      setError(true);
    }
    setLoading(false);
  }, [demoMode, shopId]);

  useEffect(() => {
    load();
  }, [load]);

  /* Ouvrir un message le marque comme lu : le compte à rebours de
     purge (7 jours) démarre à ce moment-là. */
  const open = async (m: DbMessage) => {
    const next = openId === m.id ? null : m.id;
    setOpenId(next);
    if (next && !m.read_at) {
      setMessages((ms) =>
        ms.map((x) => (x.id === m.id ? { ...x, read_at: new Date().toISOString() } : x))
      );
      if (!demoMode) await api.markMessageRead(m.id).catch(() => {});
    }
  };

  const remove = async (id: string) => {
    if (!confirm("Supprimer ce message ?")) return;
    const backup = messages;
    setMessages((ms) => ms.filter((m) => m.id !== id));
    if (!demoMode) await api.deleteMessage(id).catch(() => setMessages(backup));
  };

  if (error) return <ErrorScreen onRetry={load} />;

  const unread = messages.filter((m) => !m.read_at).length;

  return (
    <div>
      <Reveal>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="font-display text-2xl font-extrabold sm:text-3xl">Messages</h1>
            <p className="mt-1 text-sm text-ink/55">
              Les questions de tes clients arrivent ici — pas sur ton WhatsApp.
            </p>
          </div>
          {unread > 0 && (
            <span
              className="chip text-white"
              style={{ backgroundColor: palette.accent }}
            >
              {unread} non lu{unread > 1 ? "s" : ""}
            </span>
          )}
        </div>
      </Reveal>

      <Reveal delay={0.06}>
        <div className="mt-4 flex gap-2.5 rounded-xl bg-cream p-4 text-xs leading-relaxed text-ink/60">
          <Clock size={15} className="mt-px shrink-0 text-ink/40" />
          <span>
            Un message est supprimé automatiquement <strong>7 jours après lecture</strong> (30
            jours s&apos;il n&apos;est jamais ouvert). Réponds au client par WhatsApp ou par
            téléphone si c&apos;est important.
          </span>
        </div>
      </Reveal>

      {loading ? (
        <div className="mt-5">
          <SkeletonList rows={3} />
        </div>
      ) : messages.length === 0 ? (
        <div className="card mt-5 p-12 text-center">
          <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-cream text-ink/35">
            <Inbox size={22} />
          </span>
          <p className="mt-4 font-display text-lg font-bold">Aucun message</p>
          <p className="mx-auto mt-1 max-w-xs text-sm text-ink/55">
            Les questions posées depuis ta page Contact apparaîtront ici.
          </p>
        </div>
      ) : (
        <div className="mt-5 space-y-3">
          <AnimatePresence initial={false}>
            {messages.map((m) => {
              const isOpen = openId === m.id;
              const isUnread = !m.read_at;
              return (
                <motion.div
                  key={m.id}
                  layout
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.97 }}
                  className={`card overflow-hidden ${isUnread ? "ring-1" : ""}`}
                  style={isUnread ? { boxShadow: `0 0 0 1px ${palette.accent}33` } : undefined}
                >
                  <button
                    onClick={() => open(m)}
                    className="flex w-full items-center gap-3 px-5 py-4 text-left"
                  >
                    <span
                      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full"
                      style={{
                        backgroundColor: isUnread ? palette.accent : "#14231B0D",
                        color: isUnread ? "#fff" : "#14231B66",
                      }}
                    >
                      {isUnread ? <Mail size={15} /> : <MailOpen size={15} />}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className={`truncate text-sm ${isUnread ? "font-extrabold" : "font-semibold"}`}>
                        {m.sender_name}
                        {m.subject && (
                          <span className="font-normal text-ink/45"> · {m.subject}</span>
                        )}
                      </p>
                      <p className="truncate text-xs text-ink/50">{m.body}</p>
                    </div>
                    <span className="shrink-0 text-[11px] text-ink/40">
                      {timeAgo(m.created_at)}
                    </span>
                  </button>

                  <AnimatePresence initial={false}>
                    {isOpen && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.28, ease: "easeInOut" }}
                      >
                        <div className="border-t border-ink/5 px-5 py-4">
                          <p className="whitespace-pre-line text-sm leading-relaxed text-ink/75">
                            {m.body}
                          </p>

                          <div className="mt-4 flex flex-wrap items-center gap-2">
                            {m.sender_phone && (
                              <>
                                <a
                                  href={`https://wa.me/${m.sender_phone.replace(/\D/g, "")}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="btn bg-[#25D366] px-4 py-2 text-xs text-white hover:bg-[#1fb958]"
                                >
                                  <WhatsAppIcon className="h-3.5 w-3.5" /> Répondre sur WhatsApp
                                </a>
                                <a
                                  href={`tel:${m.sender_phone.replace(/\s/g, "")}`}
                                  className="btn-ghost btn-sm"
                                >
                                  <Phone size={13} /> Appeler
                                </a>
                              </>
                            )}
                            {m.sender_email && (
                              <a href={`mailto:${m.sender_email}`} className="btn-ghost btn-sm">
                                <Mail size={13} /> Email
                              </a>
                            )}
                            <button
                              onClick={() => remove(m.id)}
                              className="btn-ghost btn-sm ml-auto text-ink/45 hover:text-terra"
                            >
                              <Trash2 size={13} /> Supprimer
                            </button>
                          </div>

                          <p className="mt-3 text-[11px] text-ink/40">
                            De {m.sender_name}
                            {m.sender_phone ? ` · ${m.sender_phone}` : ""} ·{" "}
                            {new Date(m.created_at).toLocaleString("fr-FR", {
                              day: "numeric",
                              month: "short",
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </p>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
