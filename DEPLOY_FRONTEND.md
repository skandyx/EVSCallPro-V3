# Guide de Déploiement du Frontend sur un VPS

Ce document explique comment déployer l'interface utilisateur (le frontend React) de l'application sur un serveur de production pour la rendre accessible via un navigateur web. Il complète le guide `INSTALL.md` qui se concentre sur le backend.

Nous utiliserons **Nginx** comme serveur web, ce qui est la solution standard, performante et sécurisée.

## Prérequis

- Vous avez suivi le guide `INSTALL.md` et tous les services backend sont fonctionnels sur votre VPS.
- Vous avez le code source du frontend sur votre machine locale ou sur le serveur.
- `npm` est installé.

---

## Le Processus en 2 Étapes Clés

1.  **"Compiler" l'application React** : Le code source de votre interface (les fichiers `.tsx`) doit être transformé en un ensemble de fichiers statiques (HTML, CSS, JavaScript) que n'importe quel navigateur peut comprendre. C'est ce qu'on appelle le "build".
2.  **Configurer Nginx pour servir ces fichiers ET servir de proxy pour l'API** : Nous allons installer Nginx et lui dire de montrer les fichiers statiques à quiconque visite l'adresse IP de votre serveur, et de rediriger les appels API vers notre backend Node.js.

---

## Étape 1 : Préparer ("Builder") les Fichiers du Frontend

Cette étape transforme votre code de développement en fichiers optimisés pour la production.

1.  **Placez-vous dans le dossier racine du projet frontend.**
    *Ce dossier est celui qui contient `package.json`, `index.html`, `App.tsx`, etc.*

2.  **Installez les dépendances du projet** (si ce n'est pas déjà fait) :
    ```bash
    npm install
    ```

3.  **Lancez la commande de build** :
    ```bash
    # Cette commande peut varier, mais `build` est la convention standard.
    # Référez-vous au script "build" dans votre fichier `package.json`.
    npm run build
    ```
    Cette commande va créer un nouveau dossier (généralement nommé `dist/`). Ce dossier contient tout ce dont nous avons besoin pour l'interface web.

---

## Étape 2 : Mettre en Place Nginx sur le VPS

1.  **Créez un répertoire pour héberger vos fichiers web** :
    ```bash
    sudo mkdir -p /var/www/evscallpro
    ```

2.  **Transférez le contenu du dossier `dist/`** (créé à l'étape 1) dans le répertoire `/var/www/evscallpro` de votre VPS. Vous pouvez utiliser des outils comme `scp` ou `rsync`.
    *Exemple avec `scp` depuis votre machine locale :*
    ```bash
    scp -r ./dist/* votre_user@votre_ip_vps:/var/www/evscallpro/
    ```

3.  **Installez Nginx** :
    ```bash
    sudo apt update
    sudo apt install -y nginx
    ```

4.  **Configurez le Pare-feu** pour autoriser le trafic web :
    ```bash
    sudo ufw allow 'Nginx Full'
    sudo ufw reload
    ```

5.  **Créez un fichier de configuration Nginx pour votre site** :
    ```bash
    sudo nano /etc/nginx/sites-available/evscallpro
    ```

6.  **Collez la configuration suivante dans ce fichier**.
    *Remplacez `votre_adresse_ip_vps` par l'IP de votre serveur (ou votre nom de domaine si vous en avez un).*

    ```nginx
    server {
        listen 80;
        server_name votre_adresse_ip_vps;

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
            proxy_set_header Connection "upgrade";
        }

        # --- Partie Frontend React ---
        # Toutes les autres requêtes sont servies par les fichiers statiques.
        location / {
            root /var/www/evscallpro;
            index index.html;
            try_files $uri /index.html;
        }

        # Fichiers de log pour le débogage
        access_log /var/log/nginx/evscallpro.access.log;
        error_log /var/log/nginx/evscallpro.error.log;
    }
    ```

    **Explication de cette configuration :**
    - `location /api/ { ... }` : Ce bloc intercepte toutes les requêtes dont l'URL commence par `/api/` (par exemple, `/api/users`). Au lieu de chercher un fichier sur le disque, Nginx transmet la requête au serveur Node.js qui tourne localement sur le port 3001. C'est le **reverse proxy**.
    - `location / { ... }` : Ce bloc intercepte **toutes les autres requêtes**. Il sert les fichiers de votre interface React. La ligne `try_files` est essentielle pour que le routage interne de React fonctionne correctement.


7.  **Activez la configuration** en créant un lien symbolique :
    ```bash
    sudo ln -s /etc/nginx/sites-available/evscallpro /etc/nginx/sites-enabled/
    ```
    *Il est conseillé de supprimer le site par défaut : `sudo rm /etc/nginx/sites-enabled/default`*

8.  **Vérifiez que la syntaxe de votre configuration est correcte** :
    ```bash
    sudo nginx -t
    ```
    Si tout va bien, le terminal affichera `syntax is ok` et `test is successful`.

9.  **Redémarrez Nginx** pour appliquer tous les changements :
    ```bash
    sudo systemctl restart nginx
    ```

---

## Étape 3 : Accéder à l'Interface

Ouvrez votre navigateur web et rendez-vous à l'adresse de votre serveur :

`http://votre_adresse_ip_vps`

Vous devriez maintenant voir l'écran de connexion de votre application "EVSCallPro". Les appels à l'API fonctionneront car ils seront correctement redirigés par Nginx.

### Dépannage
- **Erreur 502 Bad Gateway** : Cela signifie que Nginx ne parvient pas à joindre votre backend. Vérifiez que le service backend est bien en cours d'exécution avec `pm2 status`. Consultez les logs de Nginx `sudo tail -f /var/log/nginx/evscallpro.error.log`.
- **Page blanche ou erreur 404** : Vérifiez le chemin (`root`) dans votre configuration Nginx. Assurez-vous qu'il pointe bien vers le dossier contenant `index.html`.
- **Le site ne charge pas du tout** : Vérifiez que Nginx est bien en cours d'exécution (`sudo systemctl status nginx`) et que votre pare-feu autorise le port 80 (`sudo ufw status`).