https://eni-dev09.github.io/calcbuild/

# CalcBuild — Estimation rapide bâtiment (MVP)
Application web **statique** (HTML/CSS/JS) pour estimer rapidement les **surfaces de murs** et les **coûts matériaux** (peinture, enduit, isolation) à partir d'une liste de pièces.

## Fonctionnalités
- Ajout / suppression de pièces (nom, longueur, largeur, surface d'ouvertures).
- Paramètres projet: hauteur de murs, rendement & prix peinture, prix enduit, prix isolation, marge de perte.
- Calculs instantanés (local, aucun envoi serveur).
- Enregistrement / chargement de projets via **localStorage**.
- Export **CSV** et impression **PDF** (via le navigateur).
- Design moderne, responsive, **offline-first**.

## Formules
- Périmètre pièce = 2 × (L + W)
- Surface murs pièce = périmètre × hauteur − ouvertures
- Marge de perte appliquée sur les surfaces
- Peinture (L) = surface / rendement
- Coûts = surfaces × prix unitaires (ou litres × prix/litre)

## Déploiement
Ouvrir `index.html` dans un navigateur moderne ou héberger le dossier sur un serveur statique (GitHub Pages, Netlify, Vercel...).

## Avertissement
Ceci est un MVP pour pré-chiffrage rapide. Pour un DPGF/DOE précis, intégrer des coefficients plus fins (portes/fenêtres, plinthes, TVA, main-d'œuvre, etc.).
