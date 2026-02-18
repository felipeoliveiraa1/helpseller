/**
 * URLs do backend (API + WebSocket) e do dashboard.
 * Em dev: .env com VITE_API_URL e VITE_DASHBOARD_URL opcionais (default localhost).
 * Em produção: definir no build (ex.: Vite env) para Cloud Run e Vercel.
 */
const rawApi = import.meta.env?.VITE_API_URL ?? '';
const rawDashboard = import.meta.env?.VITE_DASHBOARD_URL ?? '';

const API_BASE_URL = rawApi.trim() || 'http://localhost:3001';
const DASHBOARD_URL = rawDashboard.trim() || 'http://localhost:3000';

/** Base HTTP do backend (ex.: https://helpseller-backend-xxx.run.app) */
export const apiBaseUrl = API_BASE_URL.replace(/\/$/, '');

/** Base WebSocket do backend (ws ou wss conforme apiBaseUrl) */
export const wsBaseUrl =
    API_BASE_URL.replace(/^http:\/\//, 'ws://').replace(/^https:\/\//, 'wss://').replace(/\/$/, '');

/** URL do dashboard (ex.: https://seu-app.vercel.app) */
export const dashboardUrl = DASHBOARD_URL.replace(/\/$/, '');
