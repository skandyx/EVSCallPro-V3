# Guide de Configuration : Utiliser un Yeastar S-Series comme Trunk SIP

Ce document explique comment configurer votre PBX Yeastar (S100/S300) pour qu'il agisse comme une simple passerelle (Trunk SIP) vers votre serveur Asterisk central. Dans cette architecture, toute l'intelligence (SVI, files d'attente, logique d'appel) réside sur Asterisk.

## Objectif

- **Appels sortants** : L'agent `1001` (enregistré sur Asterisk) appelle le `0612345678`. Asterisk route l'appel vers le Trunk SIP du Yeastar du site de l'agent, qui l'envoie vers l'opérateur téléphonique externe.
- **Appels entrants** : Un client appelle un numéro (SDA) de votre entreprise. L'opérateur envoie l'appel au Yeastar, qui le transmet immédiatement au Trunk SIP d'Asterisk pour traitement par le SVI.

---

## Étape 1 : Désactiver les Fonctions PBX Inutiles sur le Yeastar

Puisque le Yeastar ne servira que de passerelle, il est recommandé de désactiver les fonctionnalités qui pourraient interférer avec Asterisk.

- **Désactiver SIP ALG sur votre routeur/pare-feu de site**. C'est une cause fréquente de problèmes audio.
- Sur le Yeastar, supprimez ou désactivez :
  - Les files d'attente existantes.
  - Les SVI existants.
  - Les groupes de sonnerie.
- Gardez uniquement :
  - Les **extensions des téléphones physiques** si vous en avez (même si non utilisés, ils peuvent servir de backup).
  - La **configuration de vos Trunks opérateurs** (vers votre fournisseur comme OVH, Orange, etc.).

---

## Étape 2 : Créer un Trunk SIP "Service Provider" vers Asterisk

Nous allons créer un "faux" Trunk de type `Service Provider` qui pointera vers l'IP de votre serveur Asterisk central.

1.  **Accédez à l'interface de votre Yeastar.**
2.  Naviguez vers `Paramètres > PBX > Trunks`.
3.  Cliquez sur **Ajouter**.
4.  **Configuration du Trunk** :
    - **Type de Trunk** : Choisissez `Service Provider`.
    - **Nom** : `vers_asterisk_central`
    - **Type de Protocole** : `SIP`
    - **Nom d'hôte/IP** : Entrez l'**adresse IP (VPN) de votre serveur Asterisk**. Par exemple : `10.0.0.1`.
    - **Domaine** : Entrez à nouveau l'**adresse IP (VPN) de votre serveur Asterisk**.
    - **Type d'authentification** : `Aucun`. L'authentification se fera par adresse IP.
5.  **Sauvegardez.**

---

## Étape 3 : Configurer les Routes d'Appels

### 3.1 - Routes Entrantes (PSTN → Yeastar → Asterisk)

Il faut dire au Yeastar que **tous les appels entrants** de vos numéros (SDA) doivent être envoyés vers le Trunk Asterisk.

1.  Naviguez vers `Paramètres > PBX > Contrôle d'Appel > Routes Entrantes`.
2.  **Modifiez TOUTES vos routes entrantes existantes.**
3.  Pour chaque route :
    - **Destination** : Sélectionnez `Trunk`.
    - Dans la liste déroulante qui apparaît, choisissez le trunk que vous venez de créer : `vers_asterisk_central`.
4.  **Sauvegardez.**

Désormais, dès qu'un appel arrive sur le Yeastar depuis l'extérieur, il est immédiatement et sans condition transféré à Asterisk.

### 3.2 - Routes Sortantes (Agent → Asterisk → Yeastar → PSTN)

Asterisk enverra les appels sortants vers le Yeastar. Le Yeastar doit savoir comment les acheminer vers votre opérateur externe. Cette partie est probablement déjà configurée si votre Yeastar fonctionnait déjà.

1.  Naviguez vers `Paramètres > PBX > Contrôle d'Appel > Routes Sortantes`.
2.  Assurez-vous que vos règles de numérotation (`_0.`, `_00.` etc.) sont bien configurées pour utiliser vos Trunks opérateurs externes.
3.  **Point crucial de sécurité** : vous devez vous assurer que seuls les appels provenant d'Asterisk peuvent utiliser ces routes.
    - Naviguez vers `Paramètres > Sécurité > Liste de blocage/d'autorisation IP`.
    - **Ajoutez l'adresse IP (VPN) de votre serveur Asterisk** à la liste des IP autorisées avec un masque de sous-réseau `/32` (ex: `10.0.0.1/32`). Cela empêchera toute tentative d'appel frauduleux.

---

## Étape 4 : Réglages SIP Avancés

1.  Naviguez vers `Paramètres > PBX > SIP > NAT`.
2.  **Désactivez NAT** si la communication se fait entièrement via un VPN stable où les adresses IP sont privées et routées.
3.  Naviguez vers `Paramètres > PBX > SIP > Avancé`.
4.  Assurez-vous que les codecs `ulaw` (ou `alaw` pour l'Europe) sont prioritaires dans la liste des codecs.

---

## Checklist Finale

- [ ] SIP ALG est désactivé sur le routeur du site.
- [ ] Un Trunk de type "Service Provider" pointant vers l'IP VPN d'Asterisk a été créé sur le Yeastar.
- [ ] Toutes les routes entrantes du Yeastar pointent vers ce nouveau Trunk Asterisk.
- [ ] Les routes sortantes du Yeastar sont fonctionnelles.
- [ ] L'adresse IP VPN du serveur Asterisk a été ajoutée à la liste blanche de sécurité du Yeastar.
- [ ] Les codecs audio (ulaw/alaw) sont cohérents entre Asterisk et le Yeastar.

Votre Yeastar est maintenant configuré comme une passerelle SIP simple et robuste pour votre infrastructure de centre d'appels centralisée.
