import React from 'react';

export type FeatureId =
  | 'users'
  | 'groups'
  | 'trunks'
  | 'dids'
  | 'outbound'
  | 'qualifications'
  | 'scripts'
  | 'ivr'
  | 'audio'
  | 'records'
  | 'supervision'
  | 'reporting'
  | 'history'
  | 'sessions'
  | 'planning'
  | 'maintenance'
  | 'monitoring'
  | 'help'
  | 'module-settings'
  | 'sites-config'
  | 'system-connection'
  | 'api-docs'
  | 'database-client';

export type FeatureCategory = 'Agent' | 'Outbound' | 'Inbound' | 'Sound' | 'Configuration' | 'Supervision & Reporting' | 'Système' | 'Paramètres';

export interface ModuleVisibility {
  categories: Partial<Record<FeatureCategory, boolean>>;
  features: Partial<Record<FeatureId, boolean>>;
}

export interface Feature {
  id: FeatureId;
  title: string;
  category: FeatureCategory;
  description: string;
  component: React.FC<any>;
  userJourney: {
    title: string;
    steps: string[];
  };
  specs: {
    title: string;
    points: string[];
  };
  simplificationTip: {
    title: string;
    content: string;
  };
}

export type UserRole = 'Agent' | 'Superviseur' | 'Administrateur' | 'SuperAdmin';

export interface User {
    id: string;
    loginId: string;
    firstName: string;
    lastName: string;
    email: string;
    role: UserRole;
    isActive: boolean;
    campaignIds: string[];
    password?: string;
    siteId?: string | null;
    mobileNumber?: string | null;
    useMobileAsStation?: boolean;
}

export interface Site {
    id: string;
    name: string;
}

export interface UserGroup {
    id: string;
    name: string;
    memberIds: string[];
}

export interface SavedScript {
    id: string;
    name: string;
    pages: Page[];
    startPageId: string;
    backgroundColor: string;
}

export interface Page {
    id: string;
    name: string;
    blocks: ScriptBlock[];
}

export type BlockType = 'group' | 'label' | 'text' | 'input' | 'email' | 'phone' | 'date' | 'time' | 'radio' | 'checkbox' | 'dropdown' | 'button' | 'web-view' | 'textarea' | 'history';

export interface ScriptBlock {
    id: string;
    name: string; // User-visible name, e.g., "Code Postal"
    fieldName: string; // Sanitized technical name, e.g., "code_postal"
    type: BlockType;
    x: number;
    y: number;
    width: number;
    height: number;
    content: any;
    displayCondition: DisplayCondition | null;
    parentId: string | null;
    readOnly?: boolean;
    backgroundColor?: string;
    textColor?: string;
    fontFamily?: string;
    fontSize?: number;
    textAlign?: 'left' | 'center' | 'right';
    contentBackgroundColor?: string;
    contentTextColor?: string;
    isStandard?: boolean;
    isVisible?: boolean;
}

export interface DisplayCondition {
    blockFieldName: string;
    value: any;
}

export interface ButtonAction {
    type: 'none' | 'save' | 'navigate' | 'next' | 'previous' | 'insert_contact';
    pageId?: string;
}

export interface QuotaRule {
    id: string;
    contactField: 'postalCode';
    operator: 'equals' | 'starts_with';
    value: string;
    limit: number;
    currentCount: number;
}

export interface FilterRule {
    id: string;
    type: 'include' | 'exclude';
    contactField: 'postalCode' | 'phoneNumber' | 'lastName';
    operator: 'equals' | 'starts_with' | 'contains' | 'is_not_empty';
    value: string;
}

export interface Campaign {
    id: string;
    name: string;
    description: string;
    scriptId: string | null;
    callerId: string;
    isActive: boolean;
    assignedUserIds: string[];
    qualificationGroupId: string | null;
    contacts: Contact[];
    dialingMode: 'PREDICTIVE' | 'PROGRESSIVE' | 'MANUAL';
    priority: number;
    timezone: string;
    callingDays: number[];
    callingStartTime: string;
    callingEndTime: string;
    maxAbandonRate: number;
    paceFactor: number;
    minAgentsBeforeStart: number;
    retryAttempts: number;
    retryIntervals: number[];
    retryOnStatus: string[];
    amdEnabled: boolean;
    amdConfidence: number;
    voicemailAction: 'HANGUP' | 'LEAVE_MESSAGE';
    recordingEnabled: boolean;
    recordingBeep: boolean;
    maxRingDuration: number;
    wrapUpTime: number;
    maxCallDuration: number;
    quotaRules: QuotaRule[];
    filterRules: FilterRule[];
}

export interface Contact {
    id: string;
    firstName: string;
    lastName: string;
    phoneNumber: string;
    postalCode: string;
    status: 'pending' | 'called' | 'qualified';
    customFields?: Record<string, any>;
}

export interface ContactNote {
    id: string;
    contactId: string;
    agentId: string;
    campaignId: string;
    note: string;
    createdAt: string; // ISO String
}

export interface Qualification {
    id: string;
    code: string;
    description: string;
    type: 'positive' | 'neutral' | 'negative';
    groupId: string | null;
    isStandard: boolean;
    parentId?: string | null;
}

export interface QualificationGroup {
    id: string;
    name: string;
}

export interface IvrFlow {
    id: string;
    name: string;
    nodes: IvrNode[];
    connections: IvrConnection[];
}

export type IvrNodeType = 'start' | 'menu' | 'media' | 'transfer' | 'voicemail' | 'hangup' | 'calendar';

export interface IvrNode {
    id: string;
    type: IvrNodeType;
    name: string;
    x: number;
    y: number;
    content: any;
}

export interface IvrConnection {
    id: string;
    fromNodeId: string;
    fromPortId: string;
    toNodeId: string;
    toPortId: string;
}

export interface IvrNodePort {
    id: string;
    type: 'input' | 'output';
    label: string;
}

export type DayOfWeek = 'mon' | 'tue' | 'wed' | 'thu' | 'fri' | 'sat' | 'sun';

export interface CalendarEvent {
    id: string;
    name: string;
    eventType: 'open' | 'closed';
    isRecurring: boolean;
    allDay: boolean;
    days: DayOfWeek[];
    startTime: string;
    endTime: string;
    startDate: string;
    endDate: string;
}

export interface Trunk {
    id: string;
    name: string;
    domain: string;
    login: string;
    password?: string;
    authType: 'register' | 'ip';
    registerString?: string;
    dialPattern: string;
    inboundContext: string;
    forceCallerId?: string;
}

export interface Did {
    id: string;
    number: string;
    description: string;
    trunkId: string;
    ivrFlowId: string | null;
}

export interface BackupLog {
    id: string;
    timestamp: string;
    status: 'success' | 'failure';
    fileName: string;
}

export interface BackupSchedule {
    frequency: 'none' | 'daily' | 'weekly';
    time: string;
}

export type AgentStatus = 'En Attente' | 'En Appel' | 'En Post-Appel' | 'En Pause';

export interface AgentState extends User {
    status: AgentStatus;
    statusDuration: number;
    callsHandledToday: number;
    averageHandlingTime: number;
}

export interface ActiveCall {
    id: string;
    from: string;
    to: string;
    agentId: string;
    campaignId: string;
    duration: number;
    status: 'active' | 'queued';
}

export interface CampaignState {
    id: string;
    name: string;
    status: 'running' | 'paused' | 'stopped';
    offered: number;
    answered: number;
    hitRate: number;
    agentsOnCampaign: number;
}

export interface CallHistoryRecord {
    id: string;
    timestamp: string;
    direction: 'inbound' | 'outbound';
    agentId: string;
    campaignId: string | null;
    callerNumber: string;
    duration: number;
    qualificationId: string | null;
}

export interface AgentSession {
    id: string;
    agentId: string;
    loginTime: string;
    logoutTime: string;
}

export interface SystemLog {
    id: string;
    timestamp: string;
    level: 'INFO' | 'WARNING' | 'ERROR';
    service: string;
    message: string;
}

export interface VersionInfo {
    application: string;
    asterisk: string;
    database: string;
    'asterisk.io': string;
}

export interface ConnectivityService {
    id: string;
    name: string;
    target: string;
}

export interface AudioFile {
  id: string;
  name: string;
  fileName: string;
  duration: number; // in seconds
  size: number; // in bytes
  uploadDate: string; // ISO string
}

export interface ActivityType {
    id: string;
    name: string;
    color: string;
}

export interface PlanningEvent {
    id: string;
    agentId: string;
    activityId: string;
    startDate: string; // ISO String
    endDate: string; // ISO String
}

export interface PersonalCallback {
    id: string;
    agentId: string;
    contactId: string;
    campaignId: string;
    contactName: string;
    contactNumber: string;
    scheduledTime: string; // ISO String
    notes: string;
}

export interface SystemConnectionSettings {
    database: {
        host: string;
        port: number;
        user: string;
        password?: string;
        database: string;
    };
    asterisk: {
        amiHost: string;
        amiPort: number;
        amiUser: string;
        amiPassword?: string;
        agiPort: number;
    };
}