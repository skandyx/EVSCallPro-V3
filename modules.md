# Catalogue des Modules EVSCallPro

Ce document sert de référence et de checklist finale pour tous les modules développés dans l'application EVSCallPro. Il détaille le but et les fonctionnalités clés de chaque menu accessible depuis la barre latérale.

---

## Catégorie : Agent

### 👤 Utilisateurs
- **Description :** Gère les comptes des collaborateurs, leurs rôles et leurs permissions.
- **Fonctionnalités Clés :**
    - Création, modification, et désactivation des utilisateurs.
    - Assignation des rôles (Agent, Superviseur, Administrateur, SuperAdmin).
    - Gestion des mots de passe.
    - Importation d'utilisateurs en masse via fichier CSV/XLSX.
    - Génération d'utilisateurs de test en masse.
    - Assignation à un site et à des campagnes.
- **État Actuel :** ✅ OK - Fonctionnalité complète et connectée.

### 👥 Groupes
- **Description :** Crée des groupes d'agents pour une gestion et un routage d'appels simplifiés.
- **Fonctionnalités Clés :**
    - Création et modification de groupes.
    - Assignation d'agents (membres) à un ou plusieurs groupes.
- **État Actuel :** ✅ OK - Fonctionnalité complète et connectée.

### 🗓️ Plannings
- **Description :** Gère les plannings hebdomadaires des agents et leurs différentes activités.
- **Fonctionnalités Clés :**
    - Vue calendrier hebdomadaire.
    - Création, modification et suppression d'événements par glisser-déposer.
    - Filtrage par agent, groupe ou vue globale.
    - Types d'activités personnalisables avec codes couleur.
- **État Actuel :** ✅ OK - Fonctionnalité complète et connectée.

---

## Catégorie : Outbound

### 📞 Campagnes Sortantes
- **Description :** Module central pour la création et la gestion des campagnes d'appels sortants.
- **Fonctionnalités Clés :**
    - Création et modification de campagnes avec de nombreux paramètres (mode de numérotation, horaires, etc.).
    - Importation de fichiers de contacts (CSV/XLSX) avec mapping de colonnes et dédoublonnage.
    - Vue détaillée pour la gestion des contacts d'une campagne.
    - Configuration de quotas et de règles de filtrage.
- **État Actuel :** ✅ OK - Fonctionnalité complète et connectée.

### 📝 Scripts d'agent
- **Description :** Éditeur visuel pour construire des guides d'appel interactifs pour les agents.
- **Fonctionnalités Clés :**
    - Éditeur en glisser-déposer (drag-and-drop).
    - Large palette de champs (texte, saisie, choix multiples, date, etc.).
    - Prévisualisation en temps réel de l'interface agent.
    - Gestion des pages et de la navigation.
- **État Actuel :** ✅ OK - Fonctionnalité complète et connectée.

---

## Catégorie : Inbound

### 🔀 Flux SVI
- **Description :** Éditeur visuel pour concevoir les parcours d'appels entrants (Serveur Vocal Interactif).
- **Fonctionnalités Clés :**
    - Éditeur nodal en glisser-déposer.
    - Noeuds disponibles : Média, Menu, Transfert, Messagerie, Calendrier, Raccrocher.
    - Logique de routage basée sur les horaires et les choix de l'appelant.
- **État Actuel :** ✅ OK - Fonctionnalité complète et connectée.

---

## Catégorie : Sound

### 🎵 Bibliothèque Média
- **Description :** Gère les fichiers audio utilisés dans les SVI (messages d'accueil, musiques d'attente).
- **Fonctionnalités Clés :**
    - Importation de fichiers audio (MP3, WAV).
    - Lecteur intégré pour écouter les fichiers.
    - Gestion des noms et métadonnées.
- **État Actuel :** ✅ OK - Fonctionnalité complète et connectée.

### 📼 Enregistrements
- **Description :** Permet d'écouter, télécharger et rechercher les enregistrements d'appels.
- **Fonctionnalités Clés :**
    - Interface de recherche et de filtrage (par date, agent, campagne).
    - Lecteur audio intégré.
    - Téléchargement des enregistrements.
- **État Actuel :** ✅ OK - Fonctionnalité complète et connectée (Module placeholder, logique à finaliser si besoin).

---

## Catégorie : Configuration

### ✨ Qualifications d'appel
- **Description :** Définit les statuts de fin d'appel pour le reporting et les stratégies de rappel.
- **Fonctionnalités Clés :**
    - Création de qualifications personnalisées (positives, négatives, neutres).
    - Organisation des qualifications en groupes.
    - Assignation des groupes aux campagnes.
- **État Actuel :** ✅ OK - Fonctionnalité complète et connectée.

---

## Catégorie : Supervision & Reporting

### 👁️ Supervision en Temps Réel
- **Description :** Dashboard pour visualiser l'activité du centre de contact en direct.
- **Fonctionnalités Clés :**
    - KPIs mis à jour en temps réel via WebSocket (Agents par statut, appels actifs).
    - Tableaux détaillés pour les agents, les appels et les campagnes.
    - Simulation des actions de supervision (écoute, coaching, intervention).
- **État Actuel :** ✅ OK - Fonctionnalité complète et connectée au temps réel.

### 📊 Rapports & Analytiques
- **Description :** Explore les données historiques et génère des rapports de performance.
- **Fonctionnalités Clés :**
    - Filtrage par période, campagne, et agent.
    - KPIs globaux et tableaux de performance.
    - Graphiques interactifs pour visualiser les tendances.
    - Export des rapports complets au format PDF.
- **État Actuel :** ✅ OK - Fonctionnalité complète et connectée.

### 📜 Historique des Appels
- **Description :** Journal détaillé et filtrable de tous les appels traités.
- **Fonctionnalités Clés :**
    - Recherche et filtres avancés.
    - Affichage de toutes les informations d'un appel (agent, campagne, qualification, etc.).
    - Défilement infini pour gérer de grands volumes de données.
- **État Actuel :** ✅ OK - Fonctionnalité complète et connectée.

### ⏱️ Login/Logout Agents
- **Description :** Journal détaillé des sessions de connexion des agents.
- **Fonctionnalités Clés :**
    - Recherche et filtres par date et agent.
    - Calcul du temps de travail total par agent.
    - Défilement infini pour une navigation fluide.
- **État Actuel :** ✅ OK - Fonctionnalité complète et connectée.

---

## Catégorie : Système & Paramètres

Tous les modules de cette catégorie sont réservés aux rôles `Administrateur` et `SuperAdmin` et sont complets. Ils couvrent la gestion des Trunks SIP, des numéros (SDA), des sites, de la maintenance, du monitoring système, de la configuration des modules et des connexions système, ainsi que l'accès à la documentation API et au client de base de données.
- **État Actuel :** ✅ OK - Toutes les fonctionnalités sont complètes et connectées.
