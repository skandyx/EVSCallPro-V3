// ecosystem.config.js
module.exports = {
  apps: [
    {
      name: 'evscallpro-backend',
      // Lancement direct du serveur, plus robuste que via 'npm start'.
      script: 'server.js',
      // Le 'cwd' (Current Working Directory) reste crucial.
      // Il force PM2 à exécuter la commande depuis le bon dossier.
      cwd: '/home/debian/EVSCallPro/backend/',
      watch: false,
      env: {
        NODE_ENV: 'production',
      },
    },
  ],
};