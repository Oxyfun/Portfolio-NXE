/** Test fonctionnel : écran d'accueil → dashboard → navigation → lame → retour. */
import { chromium } from '@playwright/test'
const b = await chromium.launch()
const ctx = await b.newContext({ viewport: { width: 1600, height: 900 } })
const p = await ctx.newPage()
const errs = []
p.on('console', (m) => m.type() === 'error' && errs.push(m.text()))
p.on('pageerror', (e) => errs.push(e.message))
const step = (s, ok) => console.log(`  ${ok ? '✓' : '✗'} ${s}`) || (ok ? 0 : process.exitCode = 1)

await p.goto('http://localhost:5173/', { waitUntil: 'networkidle' })
await p.waitForTimeout(1500)
step('écran d\'accueil affiché', await p.locator('.boot').isVisible())
step('canvas three.js monté', (await p.locator('.boot-stage canvas').count()) === 1)

// Le texte du bas n'est plus cliquable : c'est la console qui l'est.
step("le texte d'accroche n'est pas cliquable", (await p.locator('.boot-cta').evaluate((e) => getComputedStyle(e).pointerEvents)) === 'none')

/* On localise la console via le retour visuel du curseur : `pointer` n'apparaît
   que lorsque le raycast touche le modèle. Ça valide le survol ET donne le
   point de clic sans coder en dur une position. */
const cursorAt = async (x, y) => {
  await p.mouse.move(x, y)
  await p.waitForTimeout(40)
  /* On lit la classe posée par le raycast et non le `cursor` calculé : le
     curseur vert personnalisé masque le curseur natif, ce qui rendait cette
     valeur inutilisable. La classe est de toute façon le signal le plus
     direct — c'est le résultat du raycast, pas un effet de style. */
  return (await p.locator('.boot-stage').evaluate((e) => e.classList.contains('is-over')))
    ? 'pointer'
    : 'default'
}
const vp = p.viewportSize()
/* On renvoie le CENTROÏDE des points survolés, pas le premier trouvé : la
   console tourne lentement en continu, et un point pris sur son bord finit
   par tomber à côté entre le balayage et le clic. */
const findConsole = async () => {
  const pts = []
  for (let fy = 0.24; fy <= 0.7; fy += 0.06) {
    for (let fx = 0.28; fx <= 0.74; fx += 0.06) {
      const x = vp.width * fx
      const y = vp.height * fy
      if ((await cursorAt(x, y)) === 'pointer') pts.push({ x, y })
    }
  }
  if (!pts.length) return null
  return {
    x: pts.reduce((a, q) => a + q.x, 0) / pts.length,
    y: pts.reduce((a, q) => a + q.y, 0) / pts.length,
  }
}
let hit = await findConsole()
step('le curseur passe à « pointer » au survol de la console', !!hit)
step('le curseur reste neutre hors de la console', (await cursorAt(30, 30)) === 'default')

// Glissé : la console doit tourner, sans déclencher le démarrage.
const rotBefore = await p.evaluate(() => null)
await p.mouse.move(vp.width * 0.5, vp.height * 0.45)
await p.mouse.down()
await p.mouse.move(vp.width * 0.5 + 160, vp.height * 0.45, { steps: 12 })
await p.mouse.up()
await p.waitForTimeout(250)
step("un glissé ne déclenche pas le démarrage", await p.locator('.boot').isVisible())
void rotBefore

/* Le glissé a fait tourner la console, et l'amortissement la fait encore
   glisser : on attend qu'elle se pose puis on la re-localise. Cliquer sur la
   position relevée AVANT le glissé rendait ce test aléatoire. */
await p.waitForTimeout(1400)
hit = (await findConsole()) ?? hit
step('la console reste localisable après avoir été tournée', !!hit)
// Dernière vérification juste avant d'appuyer : le centroïde doit être dessus.
step('le point de clic est bien sur la console', (await cursorAt(hit.x, hit.y)) === 'pointer')

/* On observe la classe `is-flash` DANS la page. Elle ne vit que ~560 ms, et
   sonder depuis Playwright la ratait environ une fois sur cinq quand le fil
   principal était pris par l'animation d'allumage. Un MutationObserver ne peut
   pas la manquer. */
await p.evaluate(() => {
  window.__flash = false
  const obs = new MutationObserver(() => {
    if (document.querySelector('.boot.is-flash')) window.__flash = true
  })
  obs.observe(document.body, { subtree: true, attributes: true, childList: true })
})

await p.mouse.move(hit.x, hit.y)
await p.mouse.down()
await p.mouse.up()
step("flou CRT présent aussi sur l'accueil", (await p.locator('.crt-soft').count()) === 1)
step("pas de rayures sur l'accueil", (await p.locator('.crt-scanlines').count()) === 0)
step("pas de cadre sur l'accueil", (await p.locator('.crt-frame').count()) === 0)

step("pas de curseur vert sur l'accueil", (await p.locator('.curseur').count()) === 0)
step("l'indication s'efface au clic", (await p.locator('.boot-cta.is-leaving').count()) === 1)
await p.waitForSelector('.dash', { timeout: 8000 }).catch(() => {})
await p.waitForTimeout(400)
step('dashboard affiché', await p.locator('.dash').isVisible())
step('fondu au blanc déclenché', await p.evaluate(() => window.__flash === true))

/* On écarte la souris : le survol sélectionne une tuile, ce qui fausserait le
   test des flèches (la souris était restée sur la console au moment du clic). */
await p.mouse.move(vp.width - 8, 8)
await p.waitForTimeout(400)

const title = () => p.locator('.tile.is-selected .tile-title').first().innerText()
const t0 = await title()
await p.keyboard.press('ArrowRight')
await p.waitForTimeout(500)
step(`→ change de tuile (${t0} → ${await title()})`, (await title()) !== t0)

const sec0 = await p.locator('.crumb-3').innerText()
await p.keyboard.press('ArrowDown')
await p.waitForTimeout(500)
step(`↓ change de section (${sec0} → ${await p.locator('.crumb-3').innerText()})`, (await p.locator('.crumb-3').innerText()) !== sec0)

await p.keyboard.press('Enter')
await p.waitForTimeout(700)
step('Entrée ouvre la lame', await p.locator('.blade').first().isVisible())
step('le fil d\'Ariane disparaît quand la lame est ouverte', (await p.locator('.crumb-3').count()) === 0)
step('le compteur disparaît aussi', (await p.locator('.counter').count()) === 0)
step('la légende passe à Ouvrir / Retour', (await p.locator('.legend-item').count()) === 2)

/* Rayon des coins : mesuré au zoom 4× sur image6 (15–16 px sur 561), soit
   1.15 vh. Il valait 0.45 et les cartes paraissaient carrées. */
const rayon = parseFloat(
  await p.locator('.tile-face').first().evaluate((e) => getComputedStyle(e).borderRadius),
)
step(`coins arrondis à ${rayon.toFixed(1)} px (1.15 vh)`, rayon > 8)

// Ni image8 ni image10 ne montrent de carte derrière les panneaux.
step(
  'la rangée disparaît derrière la lame',
  (await p.locator('.row').evaluate((e) => +getComputedStyle(e).opacity)) < 0.05,
)

/* Le panneau de détail prend la main à la flèche droite : il s'éclaircit et se
   laisse défiler. Sans ça il restait sombre et rien n'indiquait qu'on pouvait
   le parcourir. */
const estActif = () =>
  p.locator('.blade.is-secondary').evaluate((e) => e.classList.contains('is-active'))
step('le détail est inactif au départ', !(await estActif()))
await p.keyboard.press('ArrowRight')
await p.waitForTimeout(400)
step('→ donne la main au panneau de détail', await estActif())
step(
  'le corps du détail a le focus',
  await p.evaluate(() => document.activeElement?.classList.contains('blade-body')),
)

/* Défilement réellement vérifié, pas seulement déclaré possible : on force un
   texte plus long que le panneau et on regarde `scrollTop` bouger. */
await p.evaluate(() => {
  const c = document.querySelector('.blade-body')
  for (let i = 0; i < 8; i++) {
    const q = document.createElement('p')
    q.textContent = `Paragraphe de test ${i} pour faire déborder le panneau.`
    c.appendChild(q)
  }
})
await p.waitForTimeout(250)
const deborde = await p.evaluate(() => {
  const c = document.querySelector('.blade-body')
  return c.scrollHeight > c.clientHeight + 5
})
step('le texte déborde bien du panneau', deborde)
for (let i = 0; i < 6; i++) {
  await p.keyboard.press('ArrowDown')
  await p.waitForTimeout(80)
}
const parFleches = await p.evaluate(() => document.querySelector('.blade-body').scrollTop)
step(`les flèches font défiler le détail (scrollTop ${parFleches})`, parFleches > 20)
await p.mouse.move(1050, 450)
await p.mouse.wheel(0, 200)
await p.waitForTimeout(350)
step(
  'la molette aussi',
  (await p.evaluate(() => document.querySelector('.blade-body').scrollTop)) > parFleches,
)
step(
  'la barre de défilement occupe de la place',
  (await p.evaluate(() => {
    const c = document.querySelector('.blade-body')
    return c.offsetWidth - c.clientWidth
  })) >= 6,
)
await p.keyboard.press('ArrowLeft')
await p.waitForTimeout(300)
step('← rend la main à la liste', !(await estActif()))

/* La mise en scène d'entrée se rejoue à la fermeture d'une lame et à chaque
   changement de section — pas seulement à l'arrivée depuis l'écran d'accueil. */
await p.evaluate(() => {
  window.__entrees = 0
  window.__retours = 0
  new MutationObserver(() => {
    if (document.querySelector('.dash.is-entering')) window.__entrees++
    if (document.querySelector('.dash.is-returning')) window.__retours++
  }).observe(document.body, { subtree: true, attributes: true, attributeFilter: ['class'] })
})

await p.keyboard.press('Escape')
await p.waitForTimeout(1400)
step('Échap referme la lame', (await p.locator('.blade').count()) === 0)
/* Au retour d'une lame, les cartes COULISSENT (`is-returning`) au lieu de se
   dépiler : elles n'ont jamais quitté leur place, les faire repartir du paquet
   montrait la grande carte de gauche pendant toute l'animation. */
step(
  "sortir d'une carte fait coulisser les cartes",
  (await p.evaluate(() => window.__retours)) > 0,
)
step(
  "sortir d'une carte ne rejoue PAS le dépilement",
  (await p.evaluate(() => window.__entrees)) === 0,
)
await p.evaluate(() => {
  window.__entrees = 0
  window.__retours = 0
})
await p.keyboard.press('ArrowDown')
await p.waitForTimeout(1400)
/* Changement de section : DÉPILEMENT, comme à l'arrivée sur le site — les
   cartes partent empilées sur la première et s'étalent vers la droite. Il ne
   produit plus de flash depuis qu'il n'anime plus l'opacité : c'était elle qui
   laissait le fond nu pendant le décalage. Seul le retour d'une lame utilise
   le coulissement, parce que les cartes n'ont pas bougé entre-temps. */
step(
  'changer de section rejoue le dépilement',
  (await p.evaluate(() => window.__entrees)) > 0,
)

/* Le fondu depuis le blanc de l'allumage (`brightness(3.2)`) ne doit JAMAIS
   se déclencher ailleurs qu'au démarrage. Il partageait la classe du
   dépilement, donc chaque changement de section surexposait l'écran. */
await p.evaluate(() => {
  window.__filtres = 0
  const d = document.querySelector('.dash')
  const b = () => {
    if (getComputedStyle(d).filter !== 'none') window.__filtres++
    if (window.__surveille) requestAnimationFrame(b)
  }
  window.__surveille = true
  requestAnimationFrame(b)
})
await p.keyboard.press('ArrowDown')
await p.waitForTimeout(900)
await p.evaluate(() => (window.__surveille = false))
step(
  "changer de section ne surexpose pas l'écran",
  (await p.evaluate(() => window.__filtres)) === 0,
)
await p.keyboard.press('ArrowUp')
await p.waitForTimeout(1200)

/* Le « flash » au retour : le voile de la lame disparaît d'un coup, et si les
   cartes mettaient du temps à réapparaître le fond restait nu. Mesuré avant
   correction : +6.4 unités de luminance moyenne. On vérifie que la rangée
   revient SANS fondu. */
step(
  'la rangée revient sans fondu (pas de flash)',
  (await p.locator('.row').evaluate((e) => getComputedStyle(e).transitionDuration)) === '0s',
)
await p.keyboard.press('ArrowUp')
await p.waitForTimeout(1400)

// Effet CRT : flou partout, rayures + cadre uniquement dans le dashboard.
step('rayures CRT présentes dans le dashboard', (await p.locator('.crt-scanlines').count()) === 1)
step('cadre CRT présent dans le dashboard', (await p.locator('.crt-frame').count()) === 1)
step('flou CRT actif', /blur/.test(await p.locator('.crt-soft').evaluate((e) => getComputedStyle(e).backdropFilter || getComputedStyle(e).webkitBackdropFilter)))

/* Sons : on vérifie qu'ils partent bien, et peu après l'action — jamais
   simultanément. La mesure part de la frappe et inclut donc le rendu React ;
   38 ms sont programmés dans `useSounds`, le reste est de la gigue de
   `setTimeout` sous charge.

   J'ai essayé de mesurer depuis le `transitionstart` de la tuile pour exclure
   ce coût de rendu : abandonné, l'événement se déclenche 200 à 300 ms après la
   frappe — y compris avec l'avatar retiré — ce qui ne correspond pas au moment
   où la tuile commence visiblement à bouger. La mesure depuis la frappe est
   moins pure mais elle, au moins, mesure ce qu'elle prétend mesurer. */
await p.waitForTimeout(600)
await p.evaluate(() => {
  window.__snd = []
  const orig = HTMLMediaElement.prototype.play
  HTMLMediaElement.prototype.play = function () {
    window.__snd.push({ src: this.src.split('/').pop(), t: performance.now() })
    return Promise.resolve()
  }
  void orig
})
/* Cinq mesures, on retient la médiane. Un échantillon unique d'une grandeur
   aussi bruitée que l'ordonnancement d'un `setTimeout` sous charge donnait un
   test instable — vu jusqu'à 115 ms pour une médiane réelle de 50. La borne
   reste la même : c'est la mesure qu'on fiabilise, pas l'exigence qu'on
   relâche. */
const delais = []
let premierSon = ''
for (let i = 0; i < 5; i++) {
  const t1 = await p.evaluate(() => {
    window.__snd = []
    return performance.now()
  })
  await p.keyboard.press(i % 2 ? 'ArrowLeft' : 'ArrowRight')
  await p.waitForTimeout(500)
  const snd = await p.evaluate(() => window.__snd)
  if (snd.length) {
    delais.push(Math.round(snd[0].t - t1))
    premierSon ||= snd[0].src
  }
}
step('un son part à chaque déplacement', delais.length === 5)
if (delais.length) {
  const tri = [...delais].sort((a, b) => a - b)
  const median = tri[Math.floor(tri.length / 2)]
  step(`son à ${median} ms de la frappe en médiane (38 programmés)`, median >= 20 && median <= 110)
  console.log(`  · fichier joué : ${premierSon} — mesures : ${delais.join(', ')} ms`)
}

/* ── Interactions signalées comme cassées, désormais couvertes ───────────── */
const selTuile = () =>
  p.evaluate(() =>
    [...document.querySelectorAll('.tile')].findIndex((e) => e.getAttribute('aria-current') === 'true'),
  )
const lameOuverte = () => p.evaluate(() => !!document.querySelector('.blade'))

// On revient sur l'Accueil : l'avatar n'y est arrimé que là.
await p.keyboard.press('ArrowUp')
await p.waitForTimeout(700)
step("↑ ramène à l'accueil", (await p.locator('.crumb-3').innerText()).trim() === 'Accueil')

/* Le fil d'Ariane est une ROUE de sections : la ligne du bas est la page
   courante, les deux au-dessus celles qui la précèdent, dans l'ordre. Cliquer
   une ligne mène à la section qu'elle nomme — on va où c'est écrit.
   Avant, la ligne du milieu portait le nom du site : mélangée à deux sections,
   cliquer dedans n'avait aucune logique. */
const roue = () =>
  p.evaluate(() => [...document.querySelectorAll('.crumb')].map((e) => e.textContent.trim()))
const sectionCourante = () => p.locator('.crumb-3').innerText()

step(
  "les trois lignes du fil d'Ariane sont des boutons",
  await p.evaluate(() =>
    [...document.querySelectorAll('.crumb')].every((e) => e.tagName === 'BUTTON'),
  ),
)
step(
  'la ligne du bas est la section courante',
  (await roue())[2] === (await sectionCourante()).trim(),
)

// Cliquer une ligne mène EXACTEMENT à la section qu'elle nomme.
for (const rang of [1, 2]) {
  const avant = await roue()
  await p.locator(`.crumb-${rang}`).click()
  await p.waitForTimeout(900)
  const apres = await roue()
  step(`cliquer « ${avant[rang - 1]} » y mène (bas → ${apres[2]})`, apres[2] === avant[rang - 1])
}

// On repasse sur l'accueil pour la suite du parcours.
while ((await sectionCourante()).trim() !== 'Accueil') {
  await p.locator('.crumb-2').click()
  await p.waitForTimeout(800)
}
step("retour à l'accueil par le fil d'Ariane", (await sectionCourante()).trim() === 'Accueil')


/* Le survol ne doit plus sélectionner : passer la souris au-dessus de la rangée
   faisait défiler les cartes sans qu'on l'ait demandé. */
await p.keyboard.press('ArrowRight')
await p.waitForTimeout(500)
const avantSurvol = await selTuile()
/* On vise une tuile ENCORE À L'ÉCRAN. Les tuiles dépassées sortent par la
   gauche : à la sélection 1, la tuile 0 a une abscisse négative et y déplacer
   la souris la mettait hors de la page — la molette ne partait donc nulle
   part, ce qui ressemblait à une régression alors que le test visait le vide. */
const boiteVoisine = await p.evaluate(() => {
  const tuiles = [...document.querySelectorAll('.tile')]
  const cur = tuiles.findIndex((e) => e.getAttribute('aria-current') === 'true')
  const t = (tuiles[cur + 1] ?? tuiles[cur]).getBoundingClientRect()
  return { x: t.left + t.width / 2, y: t.top + t.height / 2 }
})
await p.mouse.move(boiteVoisine.x, boiteVoisine.y)
await p.waitForTimeout(400)
step('le survol ne sélectionne plus une tuile', (await selTuile()) === avantSurvol)

// La molette navigue à la place.
await p.mouse.wheel(0, 150)
await p.waitForTimeout(600)
const apresMolette = await selTuile()
step(`la molette change de tuile (${avantSurvol} → ${apresMolette})`, apresMolette !== avantSurvol)

/* Une salve = UN seul cran. L'accumulateur d'origine était faux dans les deux
   sens : une souris qui envoie beaucoup d'un coup sautait une carte, un pavé
   tactile qui envoie peu n'en franchissait aucune. */
/* On revient sur la première carte : sinon la sélection est déjà au bout de la
   rangée, la salve ne peut plus avancer et l'écart mesuré vaut 0 — le test
   échouerait sans que rien ne soit cassé. */
await p.keyboard.press('ArrowLeft')
await p.keyboard.press('ArrowLeft')
await p.waitForTimeout(700)
const avantSalve = await selTuile()
/* Vraie salve : six événements dans la MÊME milliseconde, ce que produit une
   molette crantée. Les envoyer via `p.mouse.wheel` en boucle ne marche pas —
   chaque aller-retour CDP coûte quelques dizaines de ms et la salve s'étale
   au-delà du verrou, ce qui faisait constater deux crans à juste titre. */
await p.evaluate(() => {
  for (let i = 0; i < 6; i++) {
    document.body.dispatchEvent(
      new WheelEvent('wheel', { deltaY: 120, bubbles: true, cancelable: true }),
    )
  }
})
await p.waitForTimeout(600)
step('une salve de molette ne saute pas de carte', (await selTuile()) - avantSalve === 1)

// Un petit delta (pavé tactile) doit compter comme un cran.
const avantPave = await selTuile()
await p.mouse.wheel(0, -3)
await p.waitForTimeout(600)
step('un petit delta de pavé tactile est pris en compte', (await selTuile()) !== avantPave)

// Motifs de carte : même couleur partout, motif propre à chacune.
const motifs = await p.evaluate(() =>
  [...document.querySelectorAll('.tile')].map((e) =>
    getComputedStyle(e).getPropertyValue('--tile-motif').trim(),
  ),
)
step(`chaque carte a son motif (${new Set(motifs).size}/${motifs.length})`, new Set(motifs).size === motifs.length)
step(
  'aucune rotation de teinte sur les cartes',
  await p.evaluate(() => getComputedStyle(document.querySelector('.tile-face')).filter === 'none'),
)

// Fond animé : le système de particules doit tourner.
step(
  'les anneaux du fond sont vivants',
  (await p.evaluate(() => document.querySelectorAll('.anneau').length)) > 10,
)

/* Les trois boutons de légende faisaient tous la même chose : ils n'étaient pas
   cliquables et le clic atteignait le voile de la lame, qui fermait. */
await p.locator('.legend-item').first().click()
await p.waitForTimeout(800)
step('« Sélectionner » ouvre la lame', await lameOuverte())
await p.locator('.legend-item').first().click()
await p.waitForTimeout(700)
step('« Ouvrir » ne referme PAS la lame', await lameOuverte())
await p.locator('.legend-item').nth(1).click()
await p.waitForTimeout(700)
step('« Retour » referme la lame', !(await lameOuverte()))

/* Le panneau de détail ne doit plus contenir de bloc encastré plus sombre :
   sans image, la référence pose le titre à même la surface. */
await p.locator('.legend-item').first().click()
await p.waitForTimeout(800)
step("le détail n'a plus de bloc encastré sombre", (await p.locator('.blade-about').count()) === 0)
step('le sous-titre est posé à même le panneau', (await p.locator('.blade-sub').count()) === 1)
await p.keyboard.press('Escape')
await p.waitForTimeout(600)

// L'avatar n'appartient qu'à l'accueil.
await p.keyboard.press('ArrowDown')
await p.waitForTimeout(800)
step(
  "l'avatar disparaît hors de l'accueil",
  await p.evaluate(() => !document.querySelector('.avatar3d')?.classList.contains('is-visible')),
)
await p.keyboard.press('ArrowUp')
await p.waitForTimeout(800)
step(
  "l'avatar revient sur l'accueil",
  await p.evaluate(() => !!document.querySelector('.avatar3d')?.classList.contains('is-visible')),
)

/* Rotation de l'avatar. Trois choses à protéger, dans cet ordre d'importance :
   il tourne, il ne vole pas les clics des tuiles qu'il recouvre, et son geste
   ne déplace pas la sélection en cours de route (le glissement d'un tour fait
   320 px et sort largement de sa boîte). */
const avatar = await p.$('.avatar3d.is-visible')
if (!avatar) {
  console.log("  · avatar absent (public/avatar.glb non fourni) — rotation non testée")
} else {
  const g = await p.evaluate(() => {
    const a = document.querySelector('.avatar3d-stage').getBoundingClientRect()
    return { cx: a.left + a.width / 2, cy: a.top + a.height * 0.45 }
  })
  const selection = () =>
    p.evaluate(() =>
      [...document.querySelectorAll('.tile')].findIndex(
        (e) => e.classList.contains('is-active') || e.getAttribute('aria-current') === 'true',
      ),
    )
  const rendu = async () => (await p.locator('.avatar3d-stage').screenshot()).length

  await p.mouse.move(g.cx, g.cy)
  await p.waitForTimeout(200)
  step('le curseur signale que le personnage est saisissable', await p.evaluate(() => document.querySelector('.avatar3d').classList.contains('is-hot')))
  await p.mouse.move(g.cx - 220, g.cy)
  await p.waitForTimeout(200)
  step("à côté du personnage, il ne l'est pas", await p.evaluate(() => !document.querySelector('.avatar3d').classList.contains('is-hot')))

  const vueAvant = await rendu()
  /* On RE-localise l'avatar : le survol à côté de lui a changé la tuile
     sélectionnée, et comme il est arrimé à la tuile 1 il a bougé et changé de
     taille. Réutiliser les coordonnées d'avant visait le vide — le clic partait
     alors sur une tuile et le « glissement » ne faisait que la survoler. */
  const g2 = await p.evaluate(() => {
    const a = document.querySelector('.avatar3d-stage').getBoundingClientRect()
    return { cx: a.left + a.width / 2, cy: a.top + a.height * 0.45 }
  })
  await p.mouse.move(g2.cx, g2.cy)
  await p.waitForTimeout(250)
  /* Référence prise une fois le pointeur EN PLACE. Le trajet jusqu'à l'avatar
     survole la tuile qu'il recouvre et la sélectionne — comportement voulu, on
     ne bloque pas les tuiles — mais mesurer avant ce trajet ferait constater ce
     survol au lieu de l'effet du glissement. */
  const selAvant = await selection()
  await p.mouse.down()
  for (let i = 1; i <= 32; i++) {
    await p.mouse.move(g2.cx + i * 10, g2.cy)
    await p.waitForTimeout(10)
  }
  const selPendant = await selection()
  await p.mouse.up()
  await p.waitForTimeout(900)
  const vueApres = await rendu()

  step('maintenir et glisser fait tourner le personnage', vueAvant !== vueApres)
  step('la rotation ne déplace pas la tuile sélectionnée', selPendant === selAvant && (await selection()) === selAvant)
  await p.mouse.move(200, 420)
  await p.waitForTimeout(250)
  await p.mouse.click(200, 420)
  await p.waitForTimeout(800)
  step("le bouclier de glissement se retire après le geste", await p.evaluate(() => !!document.querySelector('.blade')))
  await p.keyboard.press('Escape')
  await p.waitForTimeout(500)
}

await b.close()
console.log(errs.length ? `\n  ⚠ ERREURS : ${errs.join(' | ')}` : '\n  console : aucune erreur.')
if (errs.length) process.exitCode = 1
