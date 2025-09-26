# Foire Aux Questions (FAQ) - EVSCallPro

Ce document regroupe les questions fréquentes concernant l'architecture, les fonctionnalités et l'utilisation de l'application EVSCallPro.

---

### Q1 : Est-il possible pour un agent d'utiliser la carte SIM de son mobile (appel GSM) pour appeler au lieu d'un softphone, en cas de mauvaise connexion Internet ?

**R :** Oui, c'est tout à fait possible et c'est une fonctionnalité clé pour garantir la continuité de l'activité. Cela permet de s'affranchir de la qualité de la connexion Internet de l'agent pour la partie la plus critique : la voix.

#### Comment ça fonctionne ? (Mécanisme "Connect to Phone")

Le principe est que le serveur de téléphonie (Asterisk) devient l'intermédiaire qui établit deux appels distincts via le réseau téléphonique classique (PSTN) et les connecte ensemble.

1.  **Initiation depuis le CRM :** L'agent, après avoir sélectionné "Mobile" comme son poste de travail dans l'interface, clique sur le bouton pour appeler un contact.

2.  **Appel vers l'agent (1er appel - "Agent Leg") :** Le système ne lance pas l'appel vers le client. Il ordonne au serveur téléphonique de composer d'abord le **numéro de téléphone mobile de l'agent** (préalablement enregistré dans son profil).

3.  **L'agent décroche :** Le téléphone portable de l'agent sonne. Quand il répond, il est connecté au serveur. Il entend une tonalité ou un message lui indiquant que le système va maintenant appeler le client.

4.  **Appel vers le client (2ème appel - "Customer Leg") :** Dès que le serveur confirme que l'agent a décroché, il lance le deuxième appel vers le numéro du client.

5.  **Mise en relation (Bridge) :** Lorsque le client répond, le serveur connecte (ponte) les deux communications. L'agent et le client peuvent alors se parler.

#### Quels sont les avantages ?

*   **Fiabilité Accrue :** La communication vocale de l'agent passe par le réseau GSM, beaucoup plus stable et résilient aux coupures qu'une connexion Internet résidentielle.
*   **Qualité Audio :** La qualité de la voix est souvent supérieure et n'est pas sujette aux problèmes de "hachures" (jitter) ou de coupures liés à la VoIP.
*   **Contrôle Centralisé Conservé :** Bien que l'audio passe par le téléphone mobile, l'interface CRM reste le centre de contrôle. L'agent continue d'utiliser son écran pour voir le script, qualifier l'appel et terminer la communication.
*   **Supervision et Enregistrement :** Comme l'appel est entièrement géré et ponté par le serveur central, il peut être enregistré, écouté en temps réel par un superviseur et apparaît dans les statistiques comme n'importe quel autre appel.

La seule dépendance à Internet restante est celle, très faible, nécessaire pour l'affichage de l'interface web (script, boutons), qui est bien moins sensible aux instabilités du réseau.

---

### Q2 : Comment l'application récupère-t-elle les données d'appels (CDR) d'Asterisk ?

**Réponse :** L'application **n'injecte PAS** les fichiers CDR bruts d'Asterisk. C'est une méthode ancienne et inefficace. Nous utilisons une approche moderne, temps-réel et intégrée via l'**Asterisk Manager Interface (AMI)**.

#### Le Processus en 5 Étapes :

1. **Lancement de l'Appel :**
   *  Quand un appel est initié depuis le CRM, notre backend (`asteriskRouter.ts`) envoie une commande `Originate` à Asterisk.
   *  **Point Clé :** Nous injectons des **variables de contexte métier** dans l'appel (ex: `campaignId=xyz`, `agentId=1001`).

2. **Asterisk Génère des Événements :**
   *  Pendant toute la durée de l'appel, Asterisk émet des événements en temps réel sur l'AMI (`Newchannel`, `BridgeEnter`, `Hangup`, etc.), chacun avec un identifiant d'appel unique.

3. **Notre `amiListener.js` Capture Tout :**
   *  Notre service backend est constamment à l'écoute de ce flux d'événements. Il utilise les premiers événements pour associer l'identifiant de l'appel à nos variables de contexte.

4. **L'Événement `Hangup` Déclenche l'Écriture :**
   *  Quand l'appel se termine, l'événement `Hangup` contient toutes les informations finales (durée facturable, cause du raccrochage).

5. **Création d'un CDR Enrichi :**
   *  À la réception du `Hangup`, notre listener a toutes les informations :
       *  Les données **métier** du CRM (agent, campagne, etc.).
       *  Les données **téléphoniques** d'Asterisk (numéros, durées).
   *  Il insère alors une ligne unique et complète dans notre table `call_history`, créant un CDR de qualité supérieure.

#### Tableau Comparatif

| Caractéristique | Notre Méthode (AMI Temps-Réel) | Méthode Classique (Injection de Fichier) |
| :--- | :--- | :--- |
| **Temps-Réel** | ✅ **Instantané.** Le CDR est dans la base dès que l'appel est terminé. | ❌ **Différé.** Dépend d'un script qui tourne périodiquement. |
| **Richesse des Données** | ✅ **Très Riche.** Contient les données CRM (agent, campagne, qualif). | ❌ **Pauvre.** Données purement téléphoniques, sans contexte métier. |
| **Performance** | ✅ **Léger.** Traite les événements un par un. | ❌ **Lourd.** Peut nécessiter de parser de gros fichiers. |
| **Maintenance** | ✅ **Centralisée.** Toute la logique est dans `amiListener.js`. | ❌ **Complexe.** Nécessite de maintenir Asterisk + un script d'injection. |

---

### Q3 : Quelle est l'architecture pour plusieurs sites, chacun avec son propre Yeastar ?

**Réponse :** L'architecture utilisée est un système **centralisé avec Asterisk**. C'est la solution la plus robuste et scalable.

#### Le Flux d'Appel Expliqué :

1. **Connexion** : Tous les agents, quel que soit leur site, connectent leur téléphone (softphone ou physique) directement au **serveur Asterisk central** via le VPN.
2. **Rôle des Yeastar** : Chaque Yeastar local ne sert plus que de **passerelle SIP** (Trunk) vers l'opérateur téléphonique de son site. Il ne gère plus les agents ni la logique d'appel.
3. **Appel Sortant** :
   *  Un agent sur le Site A clique pour appeler un client.
   *  La demande part de son téléphone vers le **serveur Asterisk central**.
   *  Asterisk, sachant que l'agent est du Site A (grâce à l'information stockée dans son profil utilisateur), route l'appel vers le **Trunk SIP pointant vers le Yeastar du Site A**.
   *  Le Yeastar du Site A envoie l'appel à l'extérieur via son opérateur local.
   *  *Le flux est identique pour un agent du Site B, mais en utilisant le Trunk du Yeastar du Site B.*

Cette architecture garantit un **contrôle total**, une **scalabilité parfaite** et une **supervision temps-réel efficace**, car toute l'intelligence est centralisée.

---

### Q4 : Où sont créées les extensions des agents ? Sur Asterisk ou sur le Yeastar local ?

**Réponse :** Exclusivement sur le **serveur Asterisk central**.

Les Yeastar locaux n'ont **aucune connaissance** des extensions des agents. Leur seul rôle est de dialoguer avec le serveur Asterisk via une connexion Trunk SIP. Cela simplifie radicalement la gestion : pour ajouter ou modifier un agent, vous n'intervenez qu'à un seul endroit, le CRM (qui configure Asterisk), quel que soit le site de l'agent.

---

### Q5 : Comment gérer les extensions mobiles (softphone sur smartphone) ?

**Réponse :** L'architecture centralisée rend cela très simple. Un agent sur mobile est traité exactement comme un agent au bureau.

#### Procédure :

1. **VPN** : L'agent doit d'abord activer la connexion VPN sur son smartphone pour accéder au réseau de l'entreprise.
2. **Softphone** : Il lance une application softphone standard (comme Zoiper, Linphone, etc.).
3. **Configuration** : Il configure l'application avec les **mêmes identifiants SIP** que son poste de bureau (numéro d'extension, mot de passe, et l'adresse IP du serveur Asterisk central).

Une fois enregistré, le softphone mobile est vu par Asterisk comme n'importe quel autre téléphone. L'agent peut lancer des appels depuis le CRM, être supervisé, et toutes les fonctionnalités s'appliquent de manière transparente.

---

### Q6 : Comment le système contacte-t-il un agent sur son numéro de mobile (GSM) si sa connexion Internet est mauvaise ? Quel est le déroulement de l'appel ?

**Réponse :** C'est précisément pour ce scénario que la fonctionnalité "Utiliser le mobile comme poste de travail" a été conçue. Elle sépare le canal **voix** (qui passe par le réseau mobile GSM, très stable) du canal **données** (l'interface CRM, qui a besoin d'Internet mais consomme peu).

Voici le déroulement exact d'un appel lorsque cette option est activée :

#### Prérequis

1.  **Configuration :** Le numéro de mobile de l'agent doit être renseigné dans son profil utilisateur.
2.  **Activation :** L'option "Utiliser le mobile comme poste de travail" doit être activée pour cet agent par un superviseur ou un administrateur.

#### Déroulement de l'appel

1.  **Clic sur "Appeler" :** L'agent est sur son interface CRM. Même avec une connexion lente, il peut charger la page et voir le contact à appeler. Il clique sur le bouton "Prochain Appel".

2.  **Le CRM ordonne au serveur d'appeler l'AGENT :** L'interface envoie une commande à notre serveur backend. Le serveur voit que l'agent est en mode "mobile". Au lieu de faire sonner un softphone, il commande au système téléphonique (Asterisk) de lancer un premier appel vers le **numéro de téléphone mobile de l'agent**.

3.  **Le téléphone portable de l'agent sonne :** L'agent reçoit un appel entrant normal sur son téléphone mobile.

4.  **L'agent décroche :** En répondant, l'agent n'est pas encore en ligne avec le client. Il est connecté directement au serveur téléphonique. Il peut entendre une musique d'attente ou un message vocal bref comme "Connexion en cours...".

5.  **Le serveur appelle le CLIENT :** Dès que le système détecte que l'agent a répondu, il lance automatiquement le deuxième appel, cette fois vers le numéro du client final.

6.  **Connexion des deux appels :** Quand le client décroche, le serveur "ponte" (connecte) les deux appels. La conversation peut commencer.

#### Pendant la conversation

-   La **voix** de l'agent et du client transite via le réseau GSM et l'opérateur téléphonique, garantissant une qualité audio stable et claire, insensible aux problèmes d'Internet de l'agent.
-   L'**interface CRM** sur l'ordinateur de l'agent reste active. Il l'utilise pour suivre le script, saisir des informations, et qualifier l'appel à la fin. Ces actions nécessitent très peu de bande passante.

#### Fin de l'appel

-   L'agent qualifie l'appel dans le CRM et clique sur "Finaliser". C'est le serveur qui reçoit l'ordre et qui se charge de raccrocher les deux communications. L'agent n'a pas besoin de raccrocher depuis son mobile.

Cette méthode offre le meilleur des deux mondes : la stabilité du réseau téléphonique traditionnel pour la voix, et la flexibilité d'une interface web pour la gestion des données.

---

### Q7 : Est-ce que le système crée une nouvelle table "Clients" et "Appels" pour chaque campagne ?

**Réponse : Non, absolument pas.** C'est une anti-pattern qui rendrait le système très lent et impossible à maintenir. Notre CRM utilise une conception de base de données relationnelle, bien plus robuste.

#### Comment ça marche ?

Pensez à une grande armoire de classement unique pour toute l'entreprise :

1.  **Une table `campaigns` :** C'est l'armoire elle-même. Chaque campagne est un **tiroir** dans cette armoire (ex: "Tiroir Ventes T4", "Tiroir Satisfaction Client").
2.  **Une table `contacts` :** C'est l'ensemble de tous les **dossiers** (fiches client) de l'armoire. C'est ici que sont stockés tous les contacts de toutes les campagnes.
3.  **La liaison `campaign_id` :** Chaque dossier (chaque ligne dans la table `contacts`) possède une **étiquette** (`campaign_id`). Cette étiquette indique à quel tiroir (à quelle campagne) le contact appartient.

Quand vous importez un nouveau fichier pour une campagne, le système ajoute simplement de nouveaux dossiers dans l'armoire en leur mettant la bonne étiquette. Il ne construit jamais une nouvelle armoire. Il en va de même pour la table `call_history` qui stocke tous les appels de toutes les campagnes.

Cette méthode garantit que le système reste rapide, organisé et facile à interroger, même avec des millions de contacts.

---

### Q8 : Comment fonctionne la gestion des quotas et y a-t-il des limites ?

**Réponse :** Les quotas sont un outil pour contrôler la répartition de vos réussites sur différents segments de votre fichier d'appel.

#### Le Mécanisme

1.  **Définition :** Dans les paramètres d'une campagne, vous créez une règle. Par exemple :
    *   **Champ :** `Code Postal`
    *   **Opérateur :** `commence par`
    *   **Valeur :** `75`
    *   **Limite :** `50`
2.  **Suivi :** Chaque fois qu'un agent qualifie un appel avec un statut "positif" (ex: "Vente"), le système vérifie les données du contact. Si son code postal commence par "75", le compteur de cette règle est incrémenté.
3.  **Blocage :** Avant de distribuer un nouveau contact à un agent, le système vérifie les quotas. Si le compteur pour le code postal "75" a atteint 50, le système **ignorera automatiquement tous les autres contacts de Paris** et cherchera une fiche d'un autre segment dont le quota n'est pas atteint.

#### Limitations et Bonnes Pratiques

-   **Limite Technique :** Il n'y a pas de limite technique stricte au nombre de règles de quota que vous pouvez créer.
-   **Limite de Performance :** **Oui.** Avoir un très grand nombre de règles (par exemple, 500 règles pour un fichier de 5000 contacts) est **fortement déconseillé**. Pour chaque contact à distribuer, le système devrait vérifier des centaines de règles, ce qui ralentirait considérablement le rythme des appels.

**Bonne Pratique :** Le but d'un quota n'est pas de gérer des contacts individuels, mais de piloter des **segments de marché**. Pour un fichier de 5000 contacts, un nombre raisonnable de quotas serait entre **5 et 20**.

*   **Exemple :** Vous avez des quotas par grande région, par tranche d'âge, ou par type de prospect. Vous ne créez pas un quota pour chaque ville ou chaque contact.

En résumé, utilisez les quotas pour la stratégie globale de votre campagne, pas pour de la micro-gestion. Cela garantit des performances optimales.

---

### Q9 : Comment fonctionne la colonne `custom_fields` ? Est-ce vraiment un système "sans limite" de champs ?

**Réponse :** Oui, c'est exact. La colonne `custom_fields` est l'un des éléments les plus puissants de notre système. Elle offre une flexibilité totale pour adapter les informations de contact aux besoins spécifiques de chaque campagne, sans jamais avoir à modifier la structure de la base de données.

#### L'Ancienne Méthode (Rigide)

Traditionnellement, si vous aviez besoin de stocker une nouvelle information (ex: "Numéro de contrat" pour une campagne d'assurance), il fallait demander à un technicien de modifier la base de données en ajoutant une nouvelle colonne. C'était lent, rigide, et cela créait des tables énormes avec beaucoup de colonnes vides pour les campagnes qui n'utilisaient pas ce champ.

#### Notre Nouvelle Méthode (Flexible) : La Colonne `custom_fields`

Nous utilisons une approche moderne. Au lieu d'avoir des dizaines de colonnes, la table `contacts` possède une seule colonne spéciale nommée `custom_fields`. Cette colonne est de type `JSONB`, ce qui signifie qu'elle peut stocker des données structurées (comme un objet JavaScript) directement à l'intérieur.

**Le processus est simple et entièrement géré depuis l'interface :**

1.  **Définition dans le Script :** Un superviseur, en créant un script d'agent, ajoute un "Champ de Saisie" et le nomme "Numéro de Contrat". Le système génère un nom technique comme `numero_de_contrat`.

2.  **Saisie par l'Agent :** Pendant l'appel, l'agent remplit ce champ avec la valeur `ABC-12345`.

3.  **Stockage Intelligent :** Au lieu de chercher une colonne `numero_de_contrat` qui n'existe pas, le système enregistre cette information **à l'intérieur de la colonne `custom_fields`** du contact. La donnée stockée ressemble à ceci :
    ```json
    { "numero_de_contrat": "ABC-12345" }
    ```
    Si pour le même contact, l'agent saisit aussi une "Date de Fin d'Engagement", la colonne `custom_fields` contiendra :
    ```json
    {
      "numero_de_contrat": "ABC-12345",
      "date_fin_engagement": "2025-10-31"
    }
    ```

#### Avantages de cette approche

| Caractéristique | Notre Méthode (`custom_fields` JSONB) | Ancienne Méthode (Colonnes Rigides) |
| :--- | :--- | :--- |
| **Flexibilité** | ✅ **Totale.** "Sans limite" signifie que vous pouvez créer autant de champs personnalisés que nécessaire pour chaque campagne. | ❌ **Rigide.** Chaque nouveau champ est une modification structurelle de la base de données. |
| **Autonomie** | ✅ **Les superviseurs sont autonomes.** Ils définissent les données dont ils ont besoin dans l'éditeur de script, sans aucune intervention technique. | ❌ **Dépendance.** Nécessite un développeur pour modifier la base de données. |
| **Performance** | ✅ **Optimale.** Pas de gaspillage d'espace avec des colonnes vides. Le type `JSONB` de PostgreSQL est hautement optimisé et peut être indexé pour des recherches rapides. | ❌ **Dégradée.** Des tables avec de nombreuses colonnes vides sont moins performantes. |
| **Simplicité** | ✅ **Le code est plus simple.** Il gère un seul objet `custom_fields` au lieu d'une multitude de colonnes potentielles. | ❌ **Complexe.** Le code backend et frontend doit être mis à jour à chaque ajout de colonne. |

En résumé, quand on dit "sans limite", on parle de la **structure**. Vous n'êtes plus limité par un nombre de colonnes prédéfinies. Cela vous donne le pouvoir d'adapter dynamiquement la fiche contact à la nature de chaque campagne.