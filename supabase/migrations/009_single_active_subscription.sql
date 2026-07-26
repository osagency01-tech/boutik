-- ============================================================
--  BOUTIK — Un seul abonnement actif par boutique
--
--  Le webhook de paiement (app/api/webhooks/paiement/route.ts)
--  desactive maintenant l'abonnement actif precedent avant d'en
--  inserer un nouveau (une boutique qui change d'offre ne doit
--  jamais avoir deux abonnements "active" en meme temps). Cet index
--  partiel rend cet etat impossible cote base aussi, meme en cas de
--  bug futur cote application.
-- ============================================================

create unique index if not exists subs_one_active_per_shop
  on subscriptions (shop_id)
  where status = 'active';
