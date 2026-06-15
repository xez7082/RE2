# ☂️ Resident Evil Card — UMBRELLA CORP. NEST TERMINAL

Carte Lovelace personnalisée pour **Home Assistant**, à l'esthétique *Resident Evil / Umbrella Corporation*.
Un tableau de bord unique, riche et animé (HUD, scanlines, effets biohazard), qui regroupe **toute la maison** :
météo, zones, vidéo-surveillance, serveurs, spa, énergie solaire, santé, plantes, présence et équipements.

Conçue comme un **composant web LitElement autonome** : un seul fichier `.js`, un seul type de carte
(`custom:resident-evil-card`), entièrement configurable via un **éditeur visuel intégré**.

![Météo](https://raw.githubusercontent.com/xez7082/RE2/main/img/meteo.png)

---

## ✨ Points forts

- **Interface unifiée** : un seul tableau de bord pour toute la domotique, organisé en catégories et sous-menus.
- **100 % natif** : météo et widget solaire reconstruits dans la carte (plus de dépendance à des cartes externes, plus d'iframe).
- **Éditeur visuel complet** : ajout/édition des catégories, sous-menus et widgets sans toucher au YAML.
- **Bandeau d'alertes défilant** : regroupe automatiquement les problèmes (chimie spa, capteurs, production, appareils…).
- **Accessibilité** : polices ≥ 12 px, contraste élevé, mode contraste renforcé.
- **Esthétique Umbrella Corp.** : logo animé, cadres à coins coupés, scanlines CRT, mode biohazard, écran de boot, bips sonores.

---

## 📦 Installation

1. Copier `resident-evil-card.js` dans `/config/www/resident_evil/`.
2. Déclarer la ressource dans **Paramètres → Tableaux de bord → ⋮ → Ressources** :
   - URL : `/local/resident_evil/resident-evil-card.js?v=146`
   - Type : **JavaScript Module**
3. Copier le logo et les images utilisées dans `/config/www/` (ex. `Umbrella.png`).
4. Ajouter une carte de type **Manuel** et coller la configuration (voir plus bas).

> **Cache** : à chaque mise à jour du fichier, incrémenter le paramètre `?v=NN` de la ressource et faire
> un rechargement forcé (**Ctrl+Maj+R** sur PC ; vider le cache sur tablette).

---

## 🚀 Démarrage rapide

```yaml
type: custom:resident-evil-card
title: UMBRELLA CORP. NEST TERMINAL
card_height: 650
logo: /local/Umbrella.png
status_entity: binary_sensor.cuve_vide
categories:
  - name: MÉTÉO
    submenus:
      - name: MÉTÉO DU COMPLEXE
        icon: mdi:weather-partly-cloudy
        mode: design
        widgets:
          - type: weather
            widthPct: 100
            heightPx: 560
            noBorder: true
            animated: true
            weather_config:
              weather: weather.ma_station
```

Tout le reste se configure ensuite via l'**éditeur visuel** (icône crayon → Modifier la carte).

---

## 🗂️ Catégories & sous-menus

La carte s'organise en **catégories** (menu principal), chacune contenant des **sous-menus**.
Un sous-menu fonctionne en deux modes :

- **`mode: design`** → affiche des *widgets* (météo, spa, solaire, serveur, santé, etc.).
- **mode liste** (par défaut) → affiche une grille de *capteurs* (`sensors:`), avec filtres par type
  (lumières, prises, ouvertures, températures, sécurité).

---

## 🌤️ Météo (native)

Widget météo complet reconstruit dans la carte, alimenté en direct par `this.hass` (sans iframe ni token) :
conditions, lever/coucher, durée du jour, humidité, UV, pluie, lune, ressenti, **prévisions 7 jours**,
**pollen** (6 essences avec niveau + concentration), qualité de l'air et vigilance.
Le **ciel est animé** (soleil, nuages, pluie, neige, brouillard, étoiles) selon la météo et la position du soleil.

> Option `animated: false` pour un fond fixe (recommandé sur tablettes peu puissantes).

![Météo](https://raw.githubusercontent.com/xez7082/RE2/main/img/meteo.png)

---

## 🏠 Zones du complexe

Vue par étage avec filtres par type d'entité (lumières, prises, ouvertures, températures, sécurité),
tuiles animées et alertes de sécurité.

| Étage | Aperçu |
|-------|--------|
| Étage (1er) | ![Étage](https://raw.githubusercontent.com/xez7082/RE2/main/img/zones-etage.png) |
| Rez-de-chaussée | ![RDC](https://raw.githubusercontent.com/xez7082/RE2/main/img/zones-rdc.png) |
| Sous-sol (laboratoire) | ![Sous-sol](https://raw.githubusercontent.com/xez7082/RE2/main/img/zones-soussol.png) |

---

## 📹 Vidéo-surveillance

Grille de caméras avec chargement par jeton et rafraîchissement automatique.

![Caméra](https://raw.githubusercontent.com/xez7082/RE2/main/img/camera.png)

---

## 🖥️ Serveurs

Widget de supervision (CPU, RAM, disques, uptime, redémarrage) pour Proxmox / Home Assistant OS et Windows Server.

![Serveurs](https://raw.githubusercontent.com/xez7082/RE2/main/img/serveurs.png)

---

## ♨️ Spa (LayZSpa)

Widget spa multi-vues avec calcul de chauffe, chimie de l'eau, programmation et caméra.

| Vue | Aperçu |
|-----|--------|
| Général | ![Spa général](https://raw.githubusercontent.com/xez7082/RE2/main/img/spa-general.png) |
| Chimie | ![Spa chimie](https://raw.githubusercontent.com/xez7082/RE2/main/img/spa-chimies.png) |
| Programmation | ![Spa programmation](https://raw.githubusercontent.com/xez7082/RE2/main/img/spa-programmation.png) |

**Vue Chimie** : jauges pH / ORP / TDS / sel avec plages min-max réglables et **conseils d'ajustement
automatiques** quand une valeur sort de sa plage.

---

## ⚡ Énergie & Solaire (natif)

Widget solaire reconstruit dans la carte, piloté par onglets (`active_tab` 0 à 3).

| Onglet | Aperçu |
|--------|--------|
| Solaire | ![Solaire](https://raw.githubusercontent.com/xez7082/RE2/main/img/solaire.png) |
| Prévisions | ![Prévisions](https://raw.githubusercontent.com/xez7082/RE2/main/img/solaire-prevision.png) |
| Batteries | ![Batteries](https://raw.githubusercontent.com/xez7082/RE2/main/img/solaire-batteries.png) |
| Économies | ![Économies](https://raw.githubusercontent.com/xez7082/RE2/main/img/solaire-economies.png) |

**Consommation** : widget multi-appareils (50+ prises), avec noms personnalisés et coût estimé.

![Consommation](https://raw.githubusercontent.com/xez7082/RE2/main/img/energie-conso.png)

Toutes les entités du widget solaire sont éditables depuis l'onglet **STRUCTURE** de l'éditeur
(panneau « ☀️ ENTITÉS DU WIDGET SOLAIRE », groupées par onglet).

---

## ❤️ Santé & Plantes

| Vue | Aperçu |
|-----|--------|
| Santé du personnel | ![Santé](https://raw.githubusercontent.com/xez7082/RE2/main/img/santé.png) |
| Plantes vertes | ![Plantes](https://raw.githubusercontent.com/xez7082/RE2/main/img/plantes-plantesverte.png) |
| Jardin (cuve) | ![Jardin](https://raw.githubusercontent.com/xez7082/RE2/main/img/plante-jardin.png) |

- **Santé** : suivi multi-personnes (poids, IMC, sommeil, rythme cardiaque…), basé sur les capteurs Withings.
- **Plantes** : humidité, éclairement, température, conductivité, batterie.
- **Jardin** : widget « cuve en verre » (niveau, volume, pluie, température).

---

## 📍 Tracker de présence

| Vue | Aperçu |
|-----|--------|
| Radar de présence | ![Tracker](https://raw.githubusercontent.com/xez7082/RE2/main/img/tracker.png) |
| Carte de présence | ![Carte](https://raw.githubusercontent.com/xez7082/RE2/main/img/tracker-carte.png) |

Position, distance au domicile, batterie, Wi-Fi, Bluetooth et carte interactive.

---

## 🔧 Équipements

Widget « Atelier Builder » : machines-outils, électroménagers et robots (aspirateur, tondeuse),
avec compte à rebours de cycle, carte de l'aspirateur et notifications vocales.

| Vue | Aperçu |
|-----|--------|
| Électroménagers | ![Électro](https://raw.githubusercontent.com/xez7082/RE2/main/img/equipement-electro.png) |
| Robots | ![Robots](https://raw.githubusercontent.com/xez7082/RE2/main/img/equipement-robots.png) |
| Robots (détail) | ![Robots détail](https://raw.githubusercontent.com/xez7082/RE2/main/img/equipement-robots1.png) |
| Atelier | ![Atelier](https://raw.githubusercontent.com/xez7082/RE2/main/img/equipement-atelier.png) |

---

## 🚨 Bandeau d'alertes

Un bandeau défilant apparaît dans l'en-tête dès qu'un problème est détecté.

**Détecté automatiquement** :
- chimie du spa hors plage (pH / ORP / TDS / sel) ;
- capteurs `biohazard_entities` actifs.

**Règles personnalisées** (éditeur → onglet GÉNÉRAL → 🚨 ALERTES DÉFILANTES, ou bloc `alerts:` en YAML) :

```yaml
alerts:
  - entity: switch.spa
    op: "off"
    message: LE SPA EST DISJONCTÉ
    level: crit
  - entity: binary_sensor.production_solaire_faible_jour
    op: "on"
    message: PRODUCTION SOLAIRE FAIBLE
    level: warn
```

Conditions disponibles : `on`, `off`, `unavailable`, `<`, `<=`, `>`, `>=`, `=`, `!=`, `contains`.
Niveaux : `warn` (orange) ou `crit` (rouge).

> Conseil : pour la production solaire, utiliser un `binary_sensor` template qui ne s'active que
> le jour (élévation du soleil > 5°) afin d'éviter les fausses alertes nocturnes.

---

## 🎛️ Éditeur visuel

L'éditeur intégré comporte trois onglets : **GÉNÉRAL**, **THÈME** et **STRUCTURE**.

| Onglet | Aperçu |
|--------|--------|
| Général | ![Éditeur](https://raw.githubusercontent.com/xez7082/RE2/main/img/editeur.png) |
| | ![Éditeur 1](https://raw.githubusercontent.com/xez7082/RE2/main/img/editeur1.png) |
| Thème | ![Éditeur 2](https://raw.githubusercontent.com/xez7082/RE2/main/img/editeur2.png) |
| Structure | ![Éditeur 3](https://raw.githubusercontent.com/xez7082/RE2/main/img/editeur3.png) |
| Widgets | ![Éditeur 4](https://raw.githubusercontent.com/xez7082/RE2/main/img/editeur4.png) |
| | ![Éditeur 5](https://raw.githubusercontent.com/xez7082/RE2/main/img/editeur5.png) |
| | ![Éditeur 6](https://raw.githubusercontent.com/xez7082/RE2/main/img/editeur6.png) |
| | ![Éditeur 7](https://raw.githubusercontent.com/xez7082/RE2/main/img/editeur7.png) |
| Export / Import | ![Éditeur 8](https://raw.githubusercontent.com/xez7082/RE2/main/img/editeur8.png) |

- **GÉNÉRAL** : titre, logo, hauteur de la carte, règles d'alerte.
- **THÈME** : couleurs, polices, mode contraste renforcé, effets HUD, sons.
- **STRUCTURE** : gestion des catégories, sous-menus et widgets ; édition des entités ;
  export / import d'une catégorie en JSON.

---

## 🧩 Types de widgets disponibles

| Type | Description |
|------|-------------|
| `weather` | Météo native complète (conditions, prévisions, pollen, vigilance, ciel animé). |
| `solar` | Énergie solaire 4 onglets (production, prévisions, batteries, économies). |
| `energie` | Suivi de consommation multi-appareils. |
| `spa_temp` | Spa multi-vues (général, chimie, interrupteurs, programmation, caméra). |
| `server` | Supervision serveur (CPU, RAM, disques, uptime). |
| `health` | Suivi santé multi-personnes. |
| `plant` | Capteurs de plante (humidité, lumière, température, conductivité). |
| `tank` | Cuve en verre (niveau, volume, pluie). |
| `tracker` / `map` | Présence : radar et carte. |
| `appliance` | Électroménagers, machines-outils, robots. |
| `progress` | Barre de progression pleine largeur. |
| `gauge`, `sparkline`, `badge`, `shape` | Briques d'affichage simples. |

---

## ⚙️ Options principales (racine)

| Clé | Rôle |
|-----|------|
| `title` | Titre affiché dans l'en-tête. |
| `card_height` | Hauteur de la carte en pixels. |
| `logo` | Chemin du logo (ex. `/local/Umbrella.png`). |
| `status_entity` | Entité pilotant le niveau de menace (FINE / CAUTION / DANGER). |
| `biohazard_entities` | Liste d'entités déclenchant le mode biohazard et des alertes. |
| `stale_minutes` | Délai (min) au-delà duquel un capteur est marqué « non à jour ». |
| `theme` | Couleurs, polices, contraste, effets HUD, sons. |
| `categories` | Arborescence des catégories / sous-menus / widgets. |
| `alerts` | Règles du bandeau d'alertes. |

---

## ♿ Accessibilité

La carte respecte des règles de lisibilité : **polices ≥ 12 px**, contraste élevé,
et un **mode contraste renforcé** activable dans l'onglet THÈME (fonds noirs, bordures cyan, polices agrandies).

---

## 🛠️ Dépannage

| Symptôme | Solution |
|----------|----------|
| L'ancienne version reste affichée | Incrémenter `?v=NN` sur la ressource + Ctrl+Maj+R / vider le cache. |
| Prévisions météo vides | Vérifier que l'entité `weather.*` expose des prévisions `daily`. |
| L'interface coupe au bout d'un temps | Mettre à jour la carte (corrige l'empilement d'abonnements météo) puis redémarrer Home Assistant. |
| Performances faibles sur tablette | `animated: false` sur le widget météo ; activer le cache et l'accélération matérielle dans Fully Kiosk. |
| Barre de progression vide | Vérifier `min`/`max` ; la virgule décimale (`6,5`) est acceptée. |

---

## 📄 Licence

Projet personnel. *Resident Evil* et *Umbrella Corporation* sont des marques de leurs détenteurs respectifs ;
ce thème est un travail de fan, sans affiliation officielle.
