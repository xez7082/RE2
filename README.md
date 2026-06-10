# Resident Evil / Umbrella Corp Terminal Card for Home Assistant

Une carte Home Assistant avancée et stylisée reprenant le design rétro-terminal de l'univers **Resident Evil (Umbrella Corporation)**. Propulsée par LitElement, elle propose des animations d'électrocardiogramme (ECG), un filigrane animé et une gestion multi-onglets (Aperçu, Spa HUD, Caméras, Énergie).

## Caractéristiques
* 🧪 **Design Rétro-Terminal :** Look sombre, polices monospaces et lignes de balayage CRT.
* 📈 **Animations ECG fluides :** Indicateurs d'état animés aux couleurs d'Umbrella Corp.
* 🛁 **HUD Spa dédié :** Suivi complet des métriques d'eau, températures cibles et compteurs de maintenance.
* 📹 **Aperçu Caméras :** Intégration de flux avec filtres d'effet vidéo et overlays HUD tactiques.

## Installation

### Mode Manuel
1. Téléchargez le fichier `dist/resident-evil-card.js`.
2. Placez-le dans le dossier `www/` de votre instance Home Assistant (ex: `www/community/resident-evil-card.js`).
3. Ajoutez la référence dans votre tableau de bord Lovelace (Paramètres -> Tableaux de bord -> Ressources) :
   * **URL :** `/local/community/resident-evil-card.js`
   * **Type :** `JavaScript Module`

### Mode HACS (Dépôt personnalisé)
1. Ouvrez **HACS** dans Home Assistant.
2. Cliquez sur les trois petits points en haut à droite et sélectionnez **Dépôts personnalisés**.
3. Collez l'URL de votre dépôt GitHub.
4. Sélectionnez la catégorie `Interface (Lovelace)` et cliquez sur **Ajouter**.

## Configuration de base

Ajoutez la carte à votre tableau de bord en utilisant le code YAML suivant :

```yaml
type: custom:resident-evil-card
title: "UMBRELLA MAIN TERMINAL"
# Ajoutez vos entités spécifiques ici selon la structure attendue par votre script.
