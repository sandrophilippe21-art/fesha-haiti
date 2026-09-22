# FEHSA — Site officiel

Site responsive de la Fédération Haïtienne de Savate, avec inscription en ligne et espace d'administration.

## Fonctionnalités
- Accueil, présentation, disciplines, galerie, comité et contact
- Formulaire d'inscription avec enregistrement SQLite
- Connexion administrateur
- Tableau de bord des inscriptions
- Mise à jour du statut d'une inscription
- Export CSV
- Interface mobile et desktop

## Installation
1. Installer Node.js 18+.
2. Copier `.env.example` vers `.env` et modifier le mot de passe administrateur.
3. Exécuter `npm install`.
4. Exécuter `npm start`.
5. Ouvrir `http://localhost:3000`.
6. Administration : `http://localhost:3000/admin/login`.

Pour la mise en ligne, utiliser un hébergement Node.js avec HTTPS et une sauvegarde régulière du dossier `data/`.
