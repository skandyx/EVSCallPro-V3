
// data/features.ts
import type { Feature } from '../types.ts';
import UserManager from '../components/UserManager.tsx';
import GroupManager from '../components/GroupManager.tsx';
import TrunkManager from '../components/TrunkManager.tsx';
import DidManager from '../components/DidManager.tsx';
import OutboundCampaignsManager from '../components/OutboundCampaignsManager.tsx';
import QualificationsManager from '../components/QualificationsManager.tsx';
import ScriptFeature from '../components/ScriptFeature.tsx';
import IvrFeature from '../components/IvrFeature.tsx';
import AudioManager from '../components/AudioManager.tsx';
import RecordsManager from '../components/RecordsManager.tsx';
// FIX: Corrected import path for SupervisionDashboard
import SupervisionDashboard from '../components/SupervisionDashboard.tsx';
import ReportingDashboard from '../components/ReportingDashboard.tsx';
import MaintenanceManager from '../components/MaintenanceManager.tsx';
import MonitoringDashboard from '../components/MonitoringDashboard.tsx';
// FIX: Corrected import path for HistoryViewer
import HistoryViewer from '../components/HistoryViewer.tsx';
// FIX: Corrected import path for SessionViewer
import SessionViewer from '../components/SessionViewer.tsx';
import HelpCenter from '../components/HelpCenter.tsx';
import PlanningManager from '../components/PlanningManager.tsx';
import ModuleSettingsManager from '../components/ModuleSettingsManager.tsx';
import SiteManager from '../components/SiteManager.tsx';
import SystemConnectionManager from '../components/SystemConnectionManager.tsx';
import ApiDocs from '../components/ApiDocs.tsx';
import DatabaseManager from '../components/DatabaseManager.tsx';

export const features: Feature[] = [
    {
        id: 'users',
        title: 'Utilisateurs',
        category: 'Agent',
        description: 'Gérez les comptes utilisateurs, leurs rôles et leurs permissions.',
        component: UserManager,
        userJourney: {
            title: 'Parcours Utilisateur: Ajout d\'un agent',
            steps: [
                "L'administrateur clique sur 'Ajouter un utilisateur'.",
                "Il remplit les informations de l'agent (nom, prénom, identifiant).",
                "Il assigne le rôle 'Agent' et choisit les campagnes auxquelles l'agent participera.",
                "Un mot de passe est généré et l'administrateur sauvegarde.",
                "L'agent peut maintenant se connecter avec ses identifiants."
            ],
        },
        specs: {
            title: 'Spécifications Techniques',
            points: [
                "Chaque utilisateur doit avoir un identifiant unique (4-6 chiffres).",
                "Trois rôles disponibles: Agent, Superviseur, Administrateur.",
                "Les administrateurs peuvent tout voir et tout modifier.",
                "Les superviseurs peuvent voir les dashboards et coacher les agents.",
                "Les agents n'ont accès qu'à leur interface d'appel."
            ],
        },
        simplificationTip: {
            title: 'Conseil de Simplification',
            content: "Pour une démo rapide, utilisez la fonction 'Générer en masse' pour créer 10 agents de test en un clic, leur assignant automatiquement des identifiants et mots de passe."
        }
    },
    {
        id: 'groups',
        title: 'Groupes',
        category: 'Agent',
        description: 'Créez des groupes d\'agents pour une gestion et un routage simplifiés.',
        component: GroupManager,
         userJourney: {
            title: 'Parcours Utilisateur: Création d\'un groupe "Experts"',
            steps: [
                "L'administrateur va dans 'Groupes d'agents' et clique sur 'Créer un groupe'.",
                "Il nomme le groupe 'Experts Produit A'.",
                "Il sélectionne dans la liste les agents ayant la certification pour le Produit A.",
                "Il sauvegarde le groupe.",
                "Ce groupe peut maintenant être utilisé comme destination dans un SVI."
            ],
        },
        specs: {
            title: 'Spécifications Techniques',
            points: [
                "Un agent peut appartenir à plusieurs groupes.",
                "Les groupes peuvent être utilisés pour le routage d'appels entrants.",
                "Les groupes peuvent servir à filtrer les rapports."
            ],
        },
        simplificationTip: {
            title: 'Conseil de Simplification',
            content: "Commencez avec un seul groupe 'Général' contenant tous vos agents. Vous pourrez créer des groupes plus spécifiques plus tard, lorsque vos besoins en routage se complexifieront."
        }
    },
    {
        id: 'planning',
        title: 'Plannings',
        category: 'Agent',
        description: 'Créez et gérez les plannings hebdomadaires des agents et leurs activités.',
        component: PlanningManager,
         userJourney: {
            title: 'Parcours Utilisateur: Planifier une session de formation',
            steps: [
                "Le superviseur se rend dans le menu 'Plannings'.",
                "Il navigue jusqu'à la semaine souhaitée.",
                "Il clique sur le créneau du mercredi à 14h00.",
                "Dans la fenêtre qui s'ouvre, il sélectionne l'agent 'Alice'.",
                "Il choisit l'activité 'Formation' et ajuste l'heure de fin à 16h00.",
                "Il sauvegarde, et le nouvel événement apparaît en couleur dans le calendrier."
            ],
        },
        specs: {
            title: 'Spécifications Techniques',
            points: [
                "Vue hebdomadaire du calendrier.",
                "Filtrage par agent ou vue de tous les agents.",
                "Types d'activités personnalisables avec code couleur.",
                "Création, modification et suppression d'événements via une interface modale."
            ],
        },
        simplificationTip: {
            title: 'Conseil de Simplification',
            content: "Commencez par définir quelques types d'activités de base comme 'Appels Sortants', 'Pause Déjeuner' et 'Réunion'. Vous pourrez ensuite affiner les plannings avec des activités plus spécifiques."
        }
    },
    {
        id: 'outbound',
        title: 'Campagnes Sortantes',
        category: 'Outbound',
        description: 'Créez et gérez des campagnes d\'appels sortants avec des stratégies de numérotation avancées.',
        component: OutboundCampaignsManager,
        userJourney: {
            title: "Parcours Utilisateur: Lancement d'une campagne de prospection",
            steps: [
                "Le manager clique sur 'Créer une campagne'.",
                "Il nomme la campagne, choisit le script d'agent et le groupe de qualifications.",
                "Il définit la planification (jours/heures d'appel).",
                "Il configure la stratégie (mode de numérotation, tentatives de rappel).",
                "Il importe une liste de contacts CSV.",
                "Il active la campagne. Le système commence à distribuer les appels aux agents."
            ],
        },
        specs: {
            title: 'Spécifications Techniques',
            points: [
                "Modes de numérotation: Prédictif, Progressif, Manuel.",
                "Gestion fine des rappels automatiques basée sur les qualifications d'appel.",
                "Configuration du numéro présenté (Caller ID).",
                "Détection de répondeur (AMD) configurable."
            ],
        },
        simplificationTip: {
            title: 'Conseil de Simplification',
            content: "Pour démarrer, utilisez le mode 'Progressif'. Il est plus simple que le prédictif et garantit qu'un agent est toujours disponible pour chaque appel connecté, évitant les appels abandonnés."
        }
    },
    {
        id: 'scripts',
        title: 'Scripts d\'agent',
        category: 'Outbound',
        description: 'Construisez des guides d\'appel interactifs pour vos agents avec un éditeur visuel.',
        component: ScriptFeature,
        userJourney: {
            title: "Parcours Utilisateur: Création d'un script de vente",
            steps: [
                "Le superviseur clique sur 'Créer un nouveau script'.",
                "Il glisse-dépose un bloc 'Titre' pour l'accroche, puis un bloc 'Texte' pour le pitch.",
                "Il ajoute un champ 'Champ de Saisie' pour noter le nom du contact.",
                "Il ajoute un 'Choix unique' pour qualifier l'intérêt du prospect.",
                "Il sauvegarde le script, qui devient disponible pour les campagnes d'appels."
            ],
        },
        specs: {
            title: 'Spécifications Techniques',
            points: [
                "Éditeur visuel en glisser-déposer (drag-and-drop).",
                "Logique conditionnelle pour afficher/masquer des blocs (à venir).",
                "Prévisualisation en temps réel de l'interface agent.",
                "Large palette de types de champs: textes, saisies, choix multiples, dates, etc."
            ],
        },
        simplificationTip: {
            title: 'Conseil de Simplification',
            content: "N'essayez pas de créer un script parfait du premier coup. Commencez avec quelques blocs de texte simples pour les points clés de la conversation. L'objectif est de guider, pas de forcer l'agent à lire un texte mot pour mot."
        }
    },
    {
        id: 'ivr',
        title: 'Flux SVI',
        category: 'Inbound',
        description: 'Concevez des flux d\'appels entrants complexes avec un designer graphique.',
        component: IvrFeature,
        userJourney: {
            title: "Parcours Utilisateur: Création d'un SVI de bienvenue",
            steps: [
                "L'admin clique sur 'Créer un nouveau flux'.",
                "Il relie le noeud 'Début' à un noeud 'Média' et tape le message d'accueil.",
                "Il relie le 'Média' à un noeud 'Menu' ('Tapez 1 pour les ventes, 2 pour le support').",
                "Il relie l'option '1' à un noeud 'Transfert' vers le groupe d'agents 'Ventes'.",
                "Il relie l'option '2' à un autre noeud 'Transfert' vers le groupe 'Support'.",
                "Il sauvegarde le flux. Il peut maintenant l'assigner à un numéro."
            ],
        },
        specs: {
            title: 'Spécifications Techniques',
            points: [
                "Éditeur visuel nodal (connexions entre blocs).",
                "Noeuds disponibles: Média, Menu, Transfert, Messagerie, Raccrocher, Calendrier.",
                "Le noeud 'Calendrier' permet de router les appels différemment selon les horaires d'ouverture."
            ],
        },
        simplificationTip: {
            title: 'Conseil de Simplification',
            content: "Votre premier SVI peut être très simple: un noeud 'Média' (message d'accueil) directement connecté à un noeud 'Transfert' vers votre groupe principal d'agents. Cela professionnalise déjà l'accueil de vos appelants."
        }
    },
    {
        id: 'audio',
        title: 'Bibliothèque Média',
        category: 'Sound',
        description: 'Importez et gérez les messages vocaux pour vos SVI et musiques d\'attente.',
        component: AudioManager,
        userJourney: {
            title: 'Parcours: Mettre à jour le message d\'accueil',
            steps: [
                "Le service marketing a enregistré un nouveau message pour les promotions de Noël.",
                "L'admin va dans 'Gestion Audio', clique sur 'Importer un fichier'.",
                "Il nomme le fichier 'accueil_noel_2024' et sélectionne le fichier MP3.",
                "Il va ensuite dans l'éditeur de SVI, sélectionne le noeud 'Média' d'accueil.",
                "Il choisit le nouveau fichier 'accueil_noel_2024' dans la liste déroulante."
            ],
        },
        specs: {
            title: 'Spécifications',
            points: [
                "Supporte les formats WAV et MP3.",
                "Conversion automatique au format optimal pour la téléphonie.",
                "Les fichiers peuvent être écoutés directement depuis l'interface.",
                "Organisation par dossiers pour les projets complexes."
            ],
        },
        simplificationTip: {
            title: 'Astuce',
            content: "Si vous n'avez pas de messages pré-enregistrés, ce n'est pas un problème. Les noeuds SVI peuvent utiliser la synthèse vocale (Text-to-Speech) pour lire n'importe quel message que vous tapez."
        }
    },
    {
        id: 'records',
        title: 'Enregistrements',
        category: 'Sound',
        description: 'Écoutez, téléchargez et archivez les enregistrements d\'appels pour la qualité et la conformité.',
        component: RecordsManager,
         userJourney: {
            title: 'Parcours: Revoir un appel pour le coaching',
            steps: [
                "Un superviseur veut écouter l'appel d'un agent qui a eu des difficultés.",
                "Il va dans 'Enregistrements' et filtre par le nom de l'agent et la date d'hier.",
                "Il trouve l'appel concerné dans la liste et clique sur l'icône 'Play'.",
                "L'enregistrement est lu directement dans le navigateur.",
                "Il peut ensuite télécharger le fichier pour l'archiver ou le partager."
            ],
        },
        specs: {
            title: 'Spécifications',
            points: [
                "Recherche par date, agent, campagne, numéro de téléphone.",
                "Lecteur audio intégré.",
                "Téléchargement des enregistrements au format MP3.",
                "Archivage automatique après une période configurable."
            ],
        },
        simplificationTip: {
            title: 'Astuce',
            content: "L'activation de l'enregistrement se fait au niveau de chaque campagne sortante ou sur chaque file d'attente entrante. Assurez-vous d'activer l'option là où vous en avez besoin."
        }
    },
    {
        id: 'qualifications',
        title: 'Qualifications d\'appel',
        category: 'Configuration',
        description: 'Définissez les statuts de fin d\'appel pour le reporting et les stratégies de rappel.',
        component: QualificationsManager,
        userJourney: {
            title: "Parcours Utilisateur: Création d'un groupe de qualifications",
            steps: [
                "Le superviseur clique sur 'Créer un Groupe'.",
                "Il nomme le groupe 'Ventes Produit A'.",
                "Il ajoute des qualifications personnalisées comme 'Intéressé - Rappeler' ou 'Pas intéressé - Budget'.",
                "Il assigne ces nouvelles qualifications au groupe, en plus des qualifications standards (Répondeur, Non réponse...).",
                "Le groupe est sauvegardé et peut être assigné à une campagne d'appels sortants."
            ],
        },
        specs: {
            title: 'Spécifications Techniques',
            points: [
                "Les qualifications sont regroupées dans des 'Groupes de Qualifications'.",
                "Types de qualifications: Positif, Négatif, Neutre.",
                "Seules les qualifications neutres et négatives peuvent être utilisées pour des rappels automatiques.",
                "Certaines qualifications (Répondeur, Non réponse...) sont standards et incluses dans tous les groupes."
            ],
        },
        simplificationTip: {
            title: 'Conseil de Simplification',
            content: "Commencez par un seul groupe 'Général'. Ajoutez simplement les 2 ou 3 qualifications les plus importantes pour votre activité (ex: 'Vente réalisée', 'Rendez-vous pris')."
        }
    },
    {
        id: 'supervision',
        title: 'Supervision en Temps Réel',
        category: 'Supervision & Reporting',
        description: 'Visualisez l\'activité de votre centre de contact en direct et interagissez avec les agents.',
        component: SupervisionDashboard,
        userJourney: {
            title: "Parcours Utilisateur: Coaching d'un agent en difficulté",
            steps: [
                "Le superviseur voit dans le dashboard qu'un agent est en appel depuis très longtemps.",
                "Il clique sur l'onglet 'Agents' pour voir plus de détails.",
                "Il clique sur l'icône 'Écoute' à côté de l'agent pour écouter l'appel discrètement.",
                "Il se rend compte que l'agent est bloqué. Il clique sur 'Coaching' pour parler à l'agent sans que le client entende.",
                "Il guide l'agent pour conclure l'appel avec succès."
            ],
        },
        specs: {
            title: 'Spécifications Techniques',
            points: [
                "Mise à jour des données toutes les 2 secondes via WebSocket (simulé).",
                "KPIs principaux: Agents par statut, appels en attente, temps d'attente max.",
                "Actions de supervision: Écoute, Coaching (chuchoter), Intervention (barge).",
                "Vue détaillée par agent, par appel et par campagne."
            ],
        },
        simplificationTip: {
            title: 'Conseil de Simplification',
            content: "La vue 'Live' donne un aperçu global et rapide de la santé du centre d'appels. C'est le premier écran à regarder pour détecter rapidement un problème (ex: trop d'agents en pause, un appel en attente depuis trop longtemps)."
        }
    },
    {
        id: 'reporting',
        title: 'Rapports & Analytiques',
        category: 'Supervision & Reporting',
        description: 'Explorez les données historiques, créez des rapports personnalisés et exportez les résultats.',
        component: ReportingDashboard,
        userJourney: {
            title: "Parcours Utilisateur: Génération d'un rapport de performance hebdomadaire",
            steps: [
                "Le manager va dans la section 'Rapports'.",
                "Il utilise les filtres pour sélectionner la période '7 derniers jours' et la campagne 'Ventes Trimestre 4'.",
                "Il consulte les KPIs globaux et les tableaux de performance par agent.",
                "Il visualise les graphiques pour identifier les tendances.",
                "Satisfait des données, il clique sur 'Exporter en PDF' pour générer un rapport complet à partager."
            ],
        },
        specs: {
            title: 'Spécifications Techniques',
            points: [
                "Filtrage puissant par période, agent, et campagne.",
                "Tableaux croisés dynamiques pour analyser les performances.",
                "Graphiques interactifs pour la visualisation des données.",
                "Export des rapports au format PDF."
            ],
        },
        simplificationTip: {
            title: 'Conseil de Simplification',
            content: "Utilisez les périodes prédéfinies ('7 derniers jours', 'Ce mois-ci') pour un accès rapide aux données les plus courantes. La personnalisation des dates est là pour des analyses plus poussées."
        }
    },
    {
        id: 'history',
        title: 'Historique des Appels',
        category: 'Supervision & Reporting',
        description: 'Consultez, filtrez et recherchez dans le journal détaillé de tous les appels entrants et sortants.',
        component: HistoryViewer,
        userJourney: {
            title: "Parcours Utilisateur: Recherche d'un appel spécifique",
            steps: [
                "Un client appelle pour se plaindre d'une conversation qui a eu lieu hier.",
                "Le superviseur se rend dans 'Historique des Appels'.",
                "Il utilise les filtres de date pour sélectionner la journée d'hier.",
                "Il entre le numéro de téléphone du client dans la barre de recherche.",
                "L'appel correspondant s'affiche instantanément, avec l'agent qui l'a traité et sa qualification.",
                "Le superviseur a toutes les informations pour investiguer."
            ],
        },
        specs: {
            title: 'Spécifications Techniques',
            points: [
                "Affichage de l'historique complet des communications (appels entrants/sortants).",
                "Filtres multiples : par direction, par plage de dates/heures.",
                "Champ de recherche unifié : recherche par numéro, nom d'agent, ou nom de campagne.",
                "Pagination pour gérer de grands volumes de données (à venir).",
                "Lien vers l'enregistrement de l'appel (à venir)."
            ],
        },
        simplificationTip: {
            title: 'Conseil de Simplification',
            content: "Le filtre par date est le plus puissant pour commencer. Par défaut, il affiche les appels d'aujourd'hui, vous donnant une vue rapide de l'activité de la journée sans avoir à naviguer dans les rapports complexes."
        }
    },
    {
        id: 'sessions',
        title: 'Login/Logout Agents',
        category: 'Supervision & Reporting',
        description: 'Consultez le journal détaillé des connexions, déconnexions et temps de travail des agents.',
        component: SessionViewer,
        userJourney: {
            title: "Parcours Utilisateur: Vérification des heures d'un agent",
            steps: [
                "Un manager souhaite vérifier les heures de connexion de l'agent 'Alice'.",
                "Il se rend dans le menu 'Login/Logout Agents'.",
                "Il utilise les filtres pour sélectionner la journée d'hier.",
                "Il entre 'Alice' dans la barre de recherche pour filtrer les résultats.",
                "Le tableau affiche toutes les sessions d'Alice pour la journée, avec le total de son temps de connexion."
            ],
        },
        specs: {
            title: 'Spécifications Techniques',
            points: [
                "Chaque connexion/déconnexion d'un agent génère une entrée.",
                "Filtres par plage de dates et par nom d'agent.",
                "Affichage détaillé de chaque session (début, fin, durée).",
                "Panneau de résumé affichant le temps de travail total par agent sur la période sélectionnée."
            ],
        },
        simplificationTip: {
            title: 'Conseil de Simplification',
            content: "Le filtre par date est le plus puissant. Laissez la recherche vide pour voir l'activité de tous les agents sur la période choisie et identifier rapidement les tendances globales."
        }
    },
     {
        id: 'trunks',
        title: 'Trunks SIP',
        category: 'Paramètres',
        description: 'Connectez vos opérateurs téléphoniques pour les appels entrants et sortants.',
        component: TrunkManager,
        userJourney: {
            title: 'Parcours Utilisateur: Configuration d\'un nouvel opérateur',
            steps: [
                "Le technicien reçoit les identifiants SIP de l'opérateur.",
                "Il va dans 'Trunks SIP' et clique sur 'Ajouter un Trunk'.",
                "Il nomme le trunk (ex: 'Opérateur Principal'), et entre le domaine, l'identifiant et le mot de passe fournis.",
                "Il sauvegarde la configuration.",
                "Le système s'enregistre auprès de l'opérateur et est prêt à recevoir des appels."
            ],
        },
        specs: {
            title: 'Spécifications Techniques',
            points: [
                "Supporte l'authentification par identifiant/mot de passe.",
                "Chaque trunk est enregistré individuellement auprès de l'opérateur.",
                "Les numéros (SDA) sont ensuite associés à un trunk spécifique."
            ],
        },
        simplificationTip: {
            title: 'Conseil de Simplification',
            content: "Toute la complexité de la configuration SIP (codecs, timeouts, etc.) est gérée automatiquement. Vous n'avez besoin que des 4 informations principales de votre fournisseur."
        }
    },
     {
        id: 'dids',
        title: 'Numéros (SDA)',
        category: 'Paramètres',
        description: 'Gérez vos numéros de téléphone entrants et leur routage initial.',
        component: DidManager,
         userJourney: {
            title: 'Parcours Utilisateur: Routage d\'un numéro de support',
            steps: [
                "L'admin va dans 'Numéros (SDA)' et clique sur 'Ajouter'.",
                "Il entre le numéro de téléphone (ex: 0123456789) et une description ('Support Technique').",
                "Il sélectionne le Trunk SIP par lequel ce numéro arrive.",
                "Dans 'Destination', il choisit le flux SVI 'SVI Principal' préalablement créé.",
                "Il sauvegarde. Tout appel vers ce numéro sera maintenant traité par le SVI."
            ],
        },
        specs: {
            title: 'Spécifications Techniques',
            points: [
                "Chaque numéro doit être unique.",
                "Un numéro est associé à un seul Trunk SIP.",
                "La destination peut être un SVI ou directement une campagne/groupe (fonctionnalité future)."
            ],
        },
        simplificationTip: {
            title: 'Conseil de Simplification',
            content: "Assurez-vous d'avoir créé au moins un Trunk SIP et un flux SVI avant d'ajouter un numéro, car ce sont des champs obligatoires pour le routage."
        }
    },
    {
        id: 'sites-config',
        title: 'Configuration des Sites',
        category: 'Paramètres',
        description: 'Gérez les différents sites physiques pour le routage des appels sortants.',
        component: SiteManager,
        userJourney: {
            title: 'Parcours Utilisateur: Ajouter une nouvelle agence',
            steps: [
                "L'administrateur se rend dans 'Configuration des Sites'.",
                "Il clique sur 'Ajouter un Site'.",
                "Il nomme le site 'Agence de Lyon'.",
                "Il sauvegarde. Le site est maintenant disponible pour y assigner des agents.",
                "Le système utilisera ce site pour router les appels sortants via la bonne passerelle téléphonique."
            ],
        },
        specs: {
            title: 'Spécifications Techniques',
            points: [
                "Chaque site doit avoir un nom unique.",
                "Un site est utilisé par Asterisk pour sélectionner le bon Trunk de sortie.",
                "La suppression d'un site désassignera automatiquement les agents qui y étaient liés."
            ],
        },
        simplificationTip: {
            title: 'Conseil de Simplification',
            content: "Même si vous n'avez qu'un seul emplacement physique, créez un site 'Principal'. Cela prépare votre configuration pour une future expansion et garantit le bon fonctionnement du routage des appels."
        }
    },
    {
        id: 'database-client',
        title: 'Base de Données',
        category: 'Paramètres',
        description: 'Exécutez des requêtes SQL directement sur la base de données pour le débogage et le reporting avancé.',
        component: DatabaseManager,
        userJourney: {
            title: 'Parcours: Vérifier des contacts importés',
            steps: [
                "Le SuperAdmin suspecte un problème avec la dernière importation de contacts.",
                "Il va dans 'Paramètres' > 'Base de Données'.",
                "Il clique sur la requête prédéfinie 'Lister les 20 derniers contacts'.",
                "La requête `SELECT * FROM contacts ORDER BY created_at DESC LIMIT 20;` s'affiche dans l'éditeur.",
                "Il exécute la requête et examine les résultats dans le tableau pour confirmer les données."
            ],
        },
        specs: {
            title: 'Spécifications Techniques',
            points: [
                "Accès réservé aux utilisateurs avec le rôle 'SuperAdmin'.",
                "Mode 'Lecture Seule' activé par défaut pour empêcher les modifications accidentelles.",
                "Validation des requêtes côté backend pour bloquer les commandes dangereuses en mode lecture seule.",
                "Affichage dynamique des résultats dans un tableau."
            ],
        },
        simplificationTip: {
            title: 'Conseil de Sécurité',
            content: "Utilisez toujours les requêtes prédéfinies lorsque c'est possible. Ne désactivez le mode 'Lecture Seule' qu'en cas d'absolue nécessité et après avoir doublement vérifié votre requête `UPDATE` ou `DELETE`, en particulier la clause `WHERE`."
        }
    },
    {
        id: 'system-connection',
        title: 'Connexion Système',
        category: 'Paramètres',
        description: 'Configurer les connexions à la base de données et au serveur de téléphonie Asterisk.',
        component: SystemConnectionManager,
        userJourney: {
            title: 'Parcours: Configuration initiale du système',
            steps: [
                "L'administrateur se rend dans 'Connexion Système'.",
                "Dans la section 'Base de Données', il renseigne l'hôte, le port et les identifiants.",
                "Il clique sur 'Tester la connexion' et attend l'indicateur de succès.",
                "Dans la section 'Téléphonie', il configure les accès à l'interface de management (AMI) d'Asterisk.",
                "Il teste également cette connexion.",
                "Une fois les deux connexions validées, il sauvegarde les paramètres et le système est opérationnel."
            ],
        },
        specs: {
            title: 'Spécifications Techniques',
            points: [
                "Les mots de passe sont stockés de manière chiffrée et ne sont jamais affichés en clair.",
                "Les tests de connexion tentent une authentification réelle avec les identifiants fournis.",
                "Les modifications ne sont appliquées qu'après avoir cliqué sur 'Enregistrer les modifications'.",
                "Ces paramètres sont critiques et ne devraient être modifiés que par un administrateur système."
            ],
        },
        simplificationTip: {
            title: 'Conseil de Simplification',
            content: "Utilisez le bouton 'Tester la connexion' pour chaque section après avoir entré les informations. Cela vous assure que les paramètres sont corrects avant de les sauvegarder et d'activer la connexion."
        }
    },
    {
        id: 'api-docs',
        title: 'Documentation API',
        category: 'Paramètres',
        description: 'Consultez la documentation complète de l\'API pour l\'intégration et le développement.',
        component: ApiDocs,
        userJourney: {
            title: 'Parcours: Consulter un endpoint',
            steps: [
                "Le SuperAdmin se rend dans 'Paramètres' > 'Documentation API'.",
                "Il navigue jusqu'à la section 'Utilisateurs'.",
                "Il clique sur l'endpoint 'GET /api/users' pour voir sa description.",
                "Il examine les exemples de corps de requête et de réponse pour comprendre comment l'utiliser."
            ],
        },
        specs: {
            title: 'Spécifications Techniques',
            points: [
                "L'accès à cette page est strictement réservé aux utilisateurs avec le rôle 'SuperAdmin'.",
                "La documentation est en lecture seule.",
                "Fournit des exemples clairs pour chaque endpoint disponible dans l'API."
            ],
        },
        simplificationTip: {
            title: 'Conseil de Simplification',
            content: "Cette page est une référence technique. Utilisez-la pour comprendre la structure des données de l'application ou pour développer des intégrations avec des systèmes tiers."
        }
    },
];