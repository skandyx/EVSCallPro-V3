# Guide de Configuration du Yeastar S100 pour l'Intégration CRM

Ce document fournit les instructions détaillées pour configurer votre autocommutateur (PBX) Yeastar S100 afin qu'il communique avec l'application CRM. L'objectif principal est d'activer la fonctionnalité "Click-to-Call", permettant aux agents de lancer des appels directement depuis leur interface.

## Prérequis

- **PBX Yeastar S100** : Assurez-vous que votre PBX est installé, accessible sur le réseau et que vous disposez des identifiants administrateur.
- **Firmware Recommandé** : Version `37.x.x.x` ou supérieure.
- **Accès Réseau** : Le serveur CRM doit pouvoir atteindre le PBX sur son adresse IP via le réseau.
- **Informations CRM** : Vous devez connaître l'adresse IP du serveur sur lequel tourne l'application CRM.

---

## Étape 1 : Activer et Configurer l'API du Yeastar

L'API (Application Programming Interface) permet à des applications externes comme notre CRM d'envoyer des commandes au PBX (par exemple, "lance un appel").

1.  **Accédez à l'interface web de votre Yeastar S100.**
2.  Dans le menu de gauche, naviguez vers **Paramètres > API**.
3.  **Activez l'API** : Cochez la case "Activer l'API".
4.  **Créez un utilisateur API** :
    *   Cliquez sur le bouton **Ajouter**.
    *   **Nom d'utilisateur** : Entrez un nom explicite, par exemple `crm_api_user`. **Notez ce nom**, il sera nécessaire dans le CRM.
    *   **Mot de passe** : Entrez un mot de passe fort et sécurisé. **Notez ce mot de passe**, il sera également nécessaire.
5.  **Définir les Permissions** :
    *   Sélectionnez l'utilisateur que vous venez de créer.
    *   Dans la section des permissions, assurez-vous que la permission **"Originate" (Appel)** est bien cochée. C'est la seule permission requise pour le click-to-call.
6.  **Sécuriser l'Accès (Important)** :
    *   Dans le champ **IPs Autorisées**, ajoutez l'adresse IP de votre serveur CRM.
    *   Ceci garantit que seul votre CRM peut envoyer des commandes à l'API, renforçant la sécurité.
7.  **Sauvegardez les modifications.**

![Exemple de configuration API Yeastar](https://www.yeastar.com/wp-content/uploads/2018/12/api-settings.png)

---

## Étape 2 : Vérifier la Configuration des Extensions

Chaque agent dans le CRM doit avoir une extension SIP correspondante configurée sur le Yeastar.

1.  **Cohérence des Identifiants** :
    *   L'identifiant de connexion de l'agent dans le CRM (ex: `1001`) **doit impérativement correspondre** au numéro de son extension sur le Yeastar.
2.  **Créer ou vérifier une extension** :
    *   Naviguez vers **Paramètres > PBX > Extensions**.
    *   Pour chaque agent, assurez-vous qu'une extension SIP existe.
    *   Si vous créez une nouvelle extension, les informations minimales requises sont :
        *   **Extension** : Le numéro qui correspondra au `loginId` de l'agent (ex: `1001`).
        *   **Mot de passe d'enregistrement** : Le mot de passe que l'agent utilisera pour connecter son téléphone (softphone ou physique).
3.  **Enregistrement du Téléphone** :
    *   L'agent doit avoir un téléphone (physique ou logiciel/softphone) configuré et enregistré avec succès sur son extension. Le statut de l'extension doit être "OK" (vert) dans la liste des extensions du Yeastar.

---

## Étape 3 : Configurer les Routes Sortantes

Pour que le PBX sache comment acheminer les appels vers l'extérieur (via votre opérateur téléphonique), les routes sortantes doivent être configurées.

1.  Naviguez vers **Paramètres > PBX > Contrôle d'Appel > Routes Sortantes**.
2.  Assurez-vous d'avoir au moins une route sortante configurée pour les numéros que vos agents composeront (ex: numéros locaux, nationaux, mobiles).
3.  Une règle simple consiste à créer une route qui prend tous les numéros commençant par `0` et les envoie vers votre Trunk SIP principal.
    *   **Nom de la Route** : `Sortant_General`
    *   **Modèle de Numérotation** : `_0.` (le `_` indique un préfixe, le `0` est le chiffre à composer, et le `.` signifie "n'importe quel chiffre après").
    *   **Trunk** : Sélectionnez votre Trunk SIP principal.

---

## Étape 4 : Lier le PBX dans le CRM

Maintenant que le Yeastar est prêt, il faut déclarer ses informations de connexion dans le CRM.

1.  Connectez-vous au CRM en tant qu'**Administrateur**.
2.  Naviguez vers **Paramètres > Configuration des Sites**.
3.  Créez un nouveau site (ou modifiez un site existant) :
    *   **Nom du site** : Un nom descriptif (ex: `Agence de Paris`).
    *   **Adresse IP du Yeastar PBX** : Entrez l'adresse IP de votre Yeastar S100.
    *   **Utilisateur API** : Entrez le nom d'utilisateur créé à l'**Étape 1** (ex: `crm_api_user`).
    *   **Mot de passe API** : Entrez le mot de passe associé.
4.  **Sauvegardez la configuration.**
5.  Assurez-vous que vos agents sont bien assignés à ce site dans le module **Agent > Utilisateurs**.

---

## Étape 5 : Test final

Le système est maintenant prêt à être testé.

1.  Un agent se connecte à son interface CRM.
2.  Il s'assure que son téléphone (softphone ou physique) est bien enregistré sur son extension Yeastar.
3.  Dans l'interface agent, il clique sur le bouton **"Lancer l'appel"** pour le prochain contact.

**Le flux attendu est le suivant :**
1.  Le CRM envoie une commande API au Yeastar.
2.  Le Yeastar appelle **d'abord** l'extension de l'agent.
3.  L'agent décroche son téléphone.
4.  Dès que l'agent a décroché, le Yeastar compose le numéro du client et connecte les deux interlocuteurs.

Si ce flux fonctionne, l'intégration est réussie.
