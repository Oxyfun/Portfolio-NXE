/**
 * Barre de défilement dessinée par nous.
 *
 * Deux raisons de ne pas garder celle du navigateur :
 *
 *  1. Le curseur vert disparaît dessus. Dans Blink, `cursor` ne s'applique pas
 *     au chrome d'une barre native — même `cursor: none !important` est ignoré,
 *     et la flèche système reprend la main. Notre curseur continue bien de la
 *     suivre (vérifié : opacité 1, position à jour), mais l'autre se dessine
 *     par-dessus.
 *  2. Une barre Windows au milieu d'un dashboard de 2008, ça se voit.
 *
 * Elle reste tirable à la souris : masquer la barre native sans la remplacer
 * aurait retiré une façon légitime de faire défiler.
 */

import { useCallback, useEffect, useRef, useState } from "react";

/** Ce qu'il faut pour dessiner le curseur de défilement, en fractions. */
interface Etat {
  /** Hauteur du pouce, de 0 à 1. `null` : rien à faire défiler. */
  taille: number | null;
  /** Position du haut du pouce, de 0 à 1. */
  position: number;
}

export function Defilement({ cible }: { cible: React.RefObject<HTMLElement | null> }) {
  const [etat, setEtat] = useState<Etat>({ taille: null, position: 0 });
  const piste = useRef<HTMLDivElement>(null);
  const drag = useRef({ actif: false, depart: 0, scrollDepart: 0 });

  const relire = useCallback(() => {
    const el = cible.current;
    if (!el) return;
    const debord = el.scrollHeight - el.clientHeight;
    if (debord <= 1) {
      setEtat({ taille: null, position: 0 });
      return;
    }
    /* Un pouce plus court que 12 % devient impossible à viser : on le borne, et
       on répartit la course sur ce qui reste. */
    const taille = Math.max(0.12, el.clientHeight / el.scrollHeight);
    setEtat({ taille, position: (el.scrollTop / debord) * (1 - taille) });
  }, [cible]);

  /* La piste se superpose au contenu : sans réserve, le pouce passait sur le
     bouton vert de la ligne sélectionnée. On ne réserve QUE si la barre est
     affichée, sinon la mise en page bougerait à chaque changement de tuile. */
  useEffect(() => {
    const el = cible.current;
    if (!el) return;
    el.style.paddingRight = etat.taille === null ? "" : "2.2vh";
    return () => {
      el.style.paddingRight = "";
    };
  }, [cible, etat.taille]);

  useEffect(() => {
    const el = cible.current;
    if (!el) return;
    relire();
    el.addEventListener("scroll", relire, { passive: true });
    /* Le contenu peut changer sans que rien ne défile — changement de tuile,
       arrivée d'une police. `ResizeObserver` couvre les deux. */
    const ro = new ResizeObserver(relire);
    ro.observe(el);
    for (const enfant of Array.from(el.children)) ro.observe(enfant);
    return () => {
      el.removeEventListener("scroll", relire);
      ro.disconnect();
    };
  }, [cible, relire]);

  // Tirer le pouce.
  useEffect(() => {
    if (etat.taille === null) return;
    const onMove = (e: PointerEvent) => {
      const el = cible.current;
      const p = piste.current;
      if (!drag.current.actif || !el || !p) return;
      const course = p.clientHeight * (1 - (etat.taille ?? 0));
      if (course <= 0) return;
      const debord = el.scrollHeight - el.clientHeight;
      el.scrollTop =
        drag.current.scrollDepart + ((e.clientY - drag.current.depart) / course) * debord;
    };
    const onUp = () => {
      drag.current.actif = false;
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("pointerup", onUp);
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
    };
  }, [cible, etat.taille]);

  if (etat.taille === null) return null;

  return (
    <div className="defil" ref={piste} aria-hidden>
      <div
        className="defil-pouce"
        style={{ height: `${etat.taille * 100}%`, top: `${etat.position * 100}%` }}
        onPointerDown={(e) => {
          const el = cible.current;
          if (!el) return;
          e.preventDefault();
          drag.current = { actif: true, depart: e.clientY, scrollDepart: el.scrollTop };
        }}
      />
    </div>
  );
}
