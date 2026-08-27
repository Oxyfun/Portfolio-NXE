/**
 * Habillage du dashboard : fond, en-tête (fil d'Ariane), bloc profil,
 * pied de page (compteur + légende A/B), orbe Guide.
 */

import { useEffect, useState } from 'react'
import { firstAvailable } from '../lib/assets'
import { profile, siteName } from '../data/content'

export function Background() {
  return (
    <>
      <div className="bg-sky" aria-hidden />
      <div className="bg-floor" aria-hidden />
      <div className="bg-vignette" aria-hidden />
    </>
  )
}

/**
 * En-tête. Le NXE affiche un fil d'Ariane qui défile : section précédente,
 * nom du site, section courante — la ligne du bas est toujours celle où l'on
 * se trouve (SPEC § 3). `animKey` change à chaque section : les trois lignes
 * rejouent leur remontée.
 */
export function Header({
  previous,
  current,
  hidden,
}: {
  previous: string
  current: string
  hidden?: boolean
}) {
  // image3 et image5 : quand une lame est ouverte, le fil d'Ariane disparaît.
  if (hidden) return null
  return (
    <header className="header" key={current}>
      <span className="crumb crumb-1 is-entering">{previous}</span>
      <span className="crumb crumb-2 is-entering">{siteName}</span>
      <h1 className="crumb crumb-3 is-entering">{current}</h1>
    </header>
  )
}

export function Profile() {
  const [gscore, setGscore] = useState<string | null>(null)
  const [avatar, setAvatar] = useState<string | null>(null)

  useEffect(() => {
    let alive = true
    firstAvailable('/nxe/GScore.png').then((r) => alive && setGscore(r))
    firstAvailable(profile.avatar, '/nxe/AvatarShadow.png').then((r) => alive && setAvatar(r))
    return () => {
      alive = false
    }
  }, [])

  return (
    <div className="profile">
      <div className="profile-text">
        <span className="profile-tag">{profile.gamertag}</span>
        <span className="profile-score">
          {profile.score}
          {gscore ? <img src={gscore} alt="" /> : <span aria-hidden>G</span>}
        </span>
      </div>
      {avatar ? (
        <img className="profile-avatar" src={avatar} alt="" draggable={false} />
      ) : (
        <div className="profile-avatar" aria-hidden />
      )}
    </div>
  )
}

/** Pastille A ou B : PNG d'origine, sinon sphère CSS. */
function LegendDot({ button }: { button: 'a' | 'b' }) {
  const [src, setSrc] = useState<string | null | undefined>(undefined)
  useEffect(() => {
    let alive = true
    firstAvailable(button === 'a' ? '/nxe/Legend_A.png' : '/nxe/Legend_B.png').then(
      (r) => alive && setSrc(r),
    )
    return () => {
      alive = false
    }
  }, [button])

  if (src) return <img src={src} alt="" draggable={false} />
  return (
    <span className={`legend-dot is-${button}`} aria-hidden>
      {button.toUpperCase()}
    </span>
  )
}

/**
 * Légende A/B du pied de page.
 *
 * C'étaient des `<span>` : décoratifs, donc « Sélectionner » ne faisait rien et
 * le clic traversait jusqu'au voile de la lame — ce qui la fermait. D'où
 * l'impression que « Ouvrir » et « Retour » faisaient la même chose : les deux
 * ne faisaient que fermer. Ce sont maintenant de vrais boutons câblés à leur
 * action, focusables au clavier et actionnables à Entrée comme à Espace.
 */
export function Footer({
  index,
  total,
  actions,
  showCounter = true,
}: {
  index: number
  total: number
  actions: { a: { label: string; onPress(): void }; b?: { label: string; onPress(): void } }
  showCounter?: boolean
}) {
  return (
    <div className="footer">
      {/* Le compteur disparaît quand une lame est ouverte, comme sur image5. */}
      {showCounter && (
        <div className="counter">
          {index + 1} sur {total}
        </div>
      )}
      <div className="legend">
        <button type="button" className="legend-item" onClick={actions.a.onPress}>
          <LegendDot button="a" />
          {actions.a.label}
        </button>
        {actions.b && (
          <button type="button" className="legend-item" onClick={actions.b.onPress}>
            <LegendDot button="b" />
            {actions.b.label}
          </button>
        )}
      </div>
    </div>
  )
}

export function GuideOrb() {
  const [src, setSrc] = useState<string | null>(null)
  useEffect(() => {
    let alive = true
    firstAvailable('/nxe/Legend_Menu.png').then((r) => alive && setSrc(r))
    return () => {
      alive = false
    }
  }, [])
  if (!src) return null
  return (
    <div className="guide-orb" aria-hidden>
      {/* La flaque : l'orbe repose sur une eau immobile où tombe une goutte, et
          l'onde s'écarte en ellipses (le sol est vu en perspective). Quatre
          anneaux décalés d'un quart de cycle suffisent à ce que l'émission
          paraisse continue. */}
      <div className="guide-ripple">
        <span style={{ animationDelay: '0s' }} />
        <span style={{ animationDelay: '-2.2s' }} />
        <span style={{ animationDelay: '-4.4s' }} />
        <span style={{ animationDelay: '-6.6s' }} />
      </div>
      <img src={src} alt="" draggable={false} />
    </div>
  )
}
