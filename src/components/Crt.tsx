/**
 * Habillage « vieille télé ». Trois calques, tous en `position: fixed` et
 * `pointer-events: none`, posés APRÈS le contenu pour le recouvrir.
 *
 * `CrtSoftness` (le flou) est actif partout, y compris sur l'écran d'accueil.
 * `CrtOverlay` (rayures colorées + cadre arrondi) n'est monté que sur le
 * dashboard : sur l'accueil on ne veut que le flou.
 */

export function CrtSoftness() {
  return <div className="crt-soft" aria-hidden />
}

export function CrtOverlay() {
  return (
    <>
      <div className="crt-scanlines" aria-hidden />
      <div className="crt-frame" aria-hidden />
    </>
  )
}
