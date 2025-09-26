# Guide d'Installation Complet - EVSCallPro

Ce document décrit les étapes nécessaires pour installer et configurer l'ensemble de l'application (backend et frontend) sur un serveur **Debian 11/12** ou **Ubuntu 20.04/22.04** vierge.

---

## Philosophie de la Configuration

Ce guide couvre l'**installation d'amorçage** (bootstrap), effectuée une seule fois par un administrateur système. Une fois l'installation terminée, toute la **gestion continue** (création d'utilisateurs, de campagnes, de SVI, etc.) se fait **exclusivement via l'interface web de l'application**.

L'application fonctionne avec une architecture centralisée où le backend pilote un unique serveur Asterisk, qui route les appels vers les passerelles téléphoniques de chaque site (par exemple, des Yeastar).

---

## Étape 1 : Prérequis Système et Pare-feu (UFW)

```bash
# Mise à jour du système et installation des paquets de base
sudo apt update && sudo apt upgrade -y
sudo apt install -y build-essential git curl gnupg sudo nginx

# Configuration du pare-feu
sudo ufw allow ssh     # Accès SSH
sudo ufw allow 'Nginx Full' # Port 80 (HTTP) et 443 (HTTPS)
# Note : Les ports de l'API (3001) et d'Asterisk (5038) ne sont pas exposés publiquement.
# L'accès se fait localement ou via Nginx.

# Activer le pare-feu (confirmez avec 'y')
sudo ufw enable
```

---

## Étape 2 : Installation de la Base de Données (PostgreSQL)

```bash
# Installer PostgreSQL
sudo apt install -y postgresql

# Se connecter à psql pour créer l'utilisateur et la base de données
sudo -u postgres psql

# Dans l'interface psql, exécutez les commandes suivantes :
CREATE USER contact_center_user WITH PASSWORD 'votre_mot_de_passe_securise';
CREATE DATABASE contact_center_db OWNER contact_center_user;
\q
```
**Note** : Remplacez `votre_mot_de_passe_securise` par un mot de passe fort et conservez-le.

---

## Étape 3 : Installation du Moteur de Téléphonie (Asterisk)

```bash
# Installer Asterisk (version LTS des dépôts officiels)
sudo apt install -y asterisk

# Démarrer et activer le service
sudo systemctl start asterisk
sudo systemctl enable asterisk

# Vérifier qu'Asterisk est bien en cours d'exécution
sudo systemctl status asterisk
# Vous devriez voir "active (running)". Appuyez sur Q pour quitter.
```

---

## Étape 4 : Installation du Backend (Node.js & PM2)

```bash
# Installer Node.js v20.x (LTS)
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# Installer PM2, le gestionnaire de processus pour Node.js
sudo npm install -g pm2
```

---

## Étape 5 : Déploiement et Configuration du Code

1.  **Récupérez le code de l'application** :
    ```bash
    git clone https://votre-repository/EVSCallPro.git
    cd EVSCallPro
    ```

2.  **Configurer les variables d'environnement du Backend :**
    ```bash
    cd backend
    cp .env.example .env
    nano .env
    ```
    Modifiez le fichier `.env` avec les informations correctes. **Voici un exemple complet**:
    ```env
    # --- Base de Données ---
    DB_HOST=localhost
    DB_PORT=5432
    DB_USER=contact_center_user
    DB_PASSWORD=votre_mot_de_passe_securise
    DB_NAME=contact_center_db

    # --- Serveur AGI ---
    AGI_PORT=4573

    # --- Connexion Asterisk Manager Interface (AMI) ---
    # Doit correspondre à la configuration dans asterisk-configs/manager.d/evscallpro.conf
    AMI_HOST=127.0.0.1
    AMI_PORT=5038
    AMI_USER=ami_user
    AMI_SECRET=ami_password
    ```

3.  **Appliquer la configuration Asterisk via le script** :
    *Ce script va sauvegarder votre configuration actuelle, copier les nouveaux fichiers, et recharger Asterisk.*
    ```bash
    # Assurez-vous d'être dans le dossier EVSCallPro/
    cd .. 
    sudo chmod +x scripts/apply-asterisk-config.sh
    sudo ./scripts/apply-asterisk-config.sh
    ```

4.  **Installer les dépendances du projet Backend** :
    ```bash
    cd backend
    npm install
    ```

5.  **Compiler le Frontend pour la production** :
    ```bash
    cd .. # Retourner à la racine EVSCallPro
    npm install
    npm run build
    ```
    Cette commande crée un dossier `dist/` contenant les fichiers statiques (HTML, CSS, JS) de votre application.

---

## Étape 6 : Configuration du Serveur Web (Nginx)

1.  **Créez un répertoire pour héberger vos fichiers web** :
    ```bash
    sudo mkdir -p /var/www/evscallpro
    ```

2.  **Copiez les fichiers compilés du frontend** :
    ```bash
    sudo cp -r dist/* /var/www/evscallpro/
    ```

3.  **Créez un fichier de configuration Nginx pour votre site** :
    ```bash
    sudo nano /etc/nginx/sites-available/evscallpro
    ```

4.  **Collez la configuration suivante**. Remplacez `votre_ip_ou_domaine` par l'IP ou le nom de domaine de votre serveur.
    ```nginx
    server {
        listen 80;
        server_name votre_ip_ou_domaine;

        # --- Partie API Backend ---
        # Toutes les requêtes commençant par /api/ sont redirigées
        # vers le serveur backend Node.js qui écoute sur le port 3001.
        location /api/ {
            proxy_pass http://127.0.0.1:3001;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection "upgrade"; # Important pour les WebSockets
        }

        # --- Partie Frontend React ---
        # Toutes les autres requêtes sont servies par les fichiers statiques.
        location / {
            root /var/www/evscallpro;
            index index.html;
            try_files $uri /index.html;
        }

        access_log /var/log/nginx/evscallpro.access.log;
        error_log /var/log/nginx/evscallpro.error.log;
    }
    ```

5.  **Activez la configuration et redémarrez Nginx** :
    ```bash
    sudo ln -s /etc/nginx/sites-available/evscallpro /etc/nginx/sites-enabled/
    sudo nginx -t # Vérifie la syntaxe
    sudo systemctl restart nginx
    ```

---

## Étape 7 : Démarrage et Initialisation Finale

1.  **Démarrer le Backend avec PM2** :
    *Depuis le dossier `EVSCallPro/backend`*
    ```bash
    # Utilise le fichier de configuration d'écosystème
    pm2 start ecosystem.config.js
    
    # Sauvegarde la configuration pour redémarrage automatique
    pm2 save
    pm2 startup
    # Suivez les instructions affichées par la dernière commande pour la finaliser.
    ```

2.  **Créer le Schéma de la Base de Données** :
    ```bash
    # Connectez-vous à votre base de données
    psql -U contact_center_user -d contact_center_db -h localhost
    ```
    Entrez votre mot de passe, puis **copiez-collez l'intégralité du contenu du fichier `database.txt`** et appuyez sur Entrée.

3.  **Insérer les Données Initiales (Seed)** :
    *Toujours dans `psql`*, **copiez-collez l'intégralité du contenu du fichier `seed.txt`** et appuyez sur Entrée.
    Quittez psql avec `\q`.

---

## Étape 8 : Configuration Post-Installation (Ajout d'un Site)

Pour chaque site physique disposant d'une passerelle téléphonique (ex: Yeastar), vous devez l'ajouter en tant que Trunk dans Asterisk pour le routage des appels.

1.  **Rendez le script exécutable** :
    ```bash
    sudo chmod +x scripts/addSiteTrunk.sh
    ```

2.  **Exécutez le script pour chaque site** :
    ```bash
    # Syntaxe: sudo ./scripts/addSiteTrunk.sh <ID_du_Site> <IP_VPN_de_la_Passerelle>
    # L'ID du site doit correspondre à celui dans la table 'sites' de la BDD.
    
    # Exemple pour le site de Paris (ID 1, IP 10.1.0.254)
    sudo ./scripts/addSiteTrunk.sh 1 10.1.0.254
    
    # Exemple pour le site de Lyon (ID 2, IP 10.2.0.254)
    sudo ./scripts/addSiteTrunk.sh 2 10.2.0.254
    ```

---

## Accès à l'Application

Ouvrez votre navigateur web et rendez-vous à l'adresse de votre serveur : `http://votre_ip_ou_domaine`

Vous devriez voir l'écran de connexion. Utilisez les identifiants par défaut créés par le script `seed.txt` (ex: SuperAdmin `9999`/`9999`).

### Dépannage
- **Logs du Backend** : `pm2 logs evscallpro-backend`
- **Logs d'Asterisk** : `sudo asterisk -rvvv`
- **Logs de Nginx** : `sudo tail -f /var/log/nginx/evscallpro.error.log`
- **Logs de PostgreSQL** : Consulter `/var/log/postgresql/`.