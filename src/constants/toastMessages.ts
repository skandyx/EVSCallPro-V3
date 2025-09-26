
export const TOAST_MESSAGES = {
  // Generic
  SAVE_SUCCESS: {
    title: 'Succès',
    description: 'Les modifications ont été enregistrées avec succès.',
    status: 'success',
  },
  SAVE_ERROR: {
    title: 'Erreur',
    description: "Une erreur est survenue lors de l'enregistrement.",
    status: 'error',
  },
  DELETE_SUCCESS: {
    title: 'Supprimé',
    description: "L'élément a été supprimé avec succès.",
    status: 'success',
  },
  DELETE_ERROR: {
    title: 'Erreur',
    description: "Une erreur est survenue lors de la suppression.",
    status: 'error',
  },

  // Specific
  LOGIN_SUCCESS: {
    title: 'Connexion réussie',
    description: 'Bienvenue !',
    status: 'success',
  },
  LOGIN_ERROR: {
    title: 'Échec de la connexion',
    description: 'Veuillez vérifier vos identifiants.',
    status: 'error',
  },
  LOGOUT_SUCCESS: {
    title: 'Déconnexion',
    description: 'Vous avez été déconnecté avec succès.',
    status: 'info',
  },
  API_ERROR: {
    title: 'Erreur de communication',
    description: 'Impossible de contacter le serveur. Veuillez réessayer plus tard.',
    status: 'error',
  },
  WEBSOCKET_CONNECTED: {
    title: 'Connecté',
    description: 'Connexion temps réel établie.',
    status: 'success',
  },
  WEBSOCKET_DISCONNECTED: {
    title: 'Déconnecté',
    description: 'La connexion temps réel a été perdue. Tentative de reconnexion...',
    status: 'warning',
  },
};
