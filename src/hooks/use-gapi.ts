
import { useState, useEffect, useCallback, useRef } from 'react';

// Types for better TS support (Basic)
declare global {
    interface Window {
        gapi: any;
        google: any;
    }
}

const DISCOVERY_DOCS = ['https://www.googleapis.com/discovery/v1/apis/drive/v3/rest', 'https://sheets.googleapis.com/$discovery/rest?version=v4'];
const SCOPES = 'https://www.googleapis.com/auth/drive.readonly https://www.googleapis.com/auth/spreadsheets.readonly';

export function useGapi(enabled: boolean = false) {
    const [isGapiLoaded, setIsGapiLoaded] = useState(false);
    const [isGisLoaded, setIsGisLoaded] = useState(false);
    const [tokenClient, setTokenClient] = useState<any>(null);
    const tokenClientRef = useRef<any>(null); // Immediate access ref
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isInitializing, setIsInitializing] = useState(false);
    const [isInitialized, setIsInitialized] = useState(false);
    const initPromiseRef = useRef<Promise<boolean> | null>(null);

    const [logs, setLogs] = useState<string[]>([]);

    const appendLog = useCallback((msg: string) => {
        const timestamp = new Date().toLocaleTimeString();
        setLogs(prev => [...prev, `[${timestamp}] ${msg}`]);
        if (enabled) {
            console.log(`[GapiHook] ${msg}`);
        }
    }, [enabled]);

    // Initialize scripts
    useEffect(() => {
        if (!enabled) return;

        const loadGapi = () => {
            appendLog('Loading GAPI script...');
            const script = document.createElement('script');
            script.src = 'https://apis.google.com/js/api.js';
            script.onload = () => { appendLog('GAPI script loaded.'); setIsGapiLoaded(true); };
            script.onerror = () => { appendLog('GAPI script FAILED.'); setError('Google API (gapi) script failed to load.'); };
            document.body.appendChild(script);
        };

        const loadGis = () => {
            appendLog('Loading GIS script...');
            const script = document.createElement('script');
            script.src = 'https://accounts.google.com/gsi/client';
            script.onload = () => { appendLog('GIS script loaded.'); setIsGisLoaded(true); };
            script.onerror = () => { appendLog('GIS script FAILED.'); setError('Google Identity Services script failed to load.'); };
            document.body.appendChild(script);
        };

        if (!window.gapi) loadGapi(); else { appendLog('GAPI already available.'); setIsGapiLoaded(true); }
        if (!window.google) loadGis(); else { appendLog('GIS already available.'); setIsGisLoaded(true); }
    }, [enabled, appendLog]);

    // Initialize Clients
    const initClient = useCallback(async (apiKey: string, clientId: string) => {
        if (initPromiseRef.current) {
            appendLog('Init already in progress, waiting...');
            return initPromiseRef.current;
        }

        appendLog(`InitClient requested. Keys provided? ${!!apiKey && !!clientId}`);
        if (!enabled) {
            appendLog('Google integration is disabled for now.');
            return false;
        }
        if (!isGapiLoaded || !isGisLoaded) {
            appendLog('Scripts not ready yet.');
            return false;
        }

        initPromiseRef.current = (async () => {
            setIsInitializing(true);
            try {
                appendLog('Loading GAPI client...');
                await new Promise<void>((resolve, reject) => {
                    window.gapi.load('client', { callback: resolve, onerror: reject });
                });
                appendLog('GAPI client loaded.');

                try {
                    appendLog('Initializing GAPI with API Key...');
                    await window.gapi.client.init({
                        apiKey: apiKey,
                        discoveryDocs: DISCOVERY_DOCS,
                    });
                    appendLog('GAPI init success.');
                } catch (initErr: any) {
                    const errMsg = initErr.result?.error?.message || initErr.message || JSON.stringify(initErr);
                    appendLog(`GAPI Client Init Failed: ${errMsg}`);
                    setError('API Anahtarı/Başlatma Hatası: ' + errMsg + '. Lütfen API anahtarınızı ve kısıtlamalarını kontrol edin.');
                }

                try {
                    appendLog('Initializing TokenClient...');
                    if (!window.google || !window.google.accounts || !window.google.accounts.oauth2) {
                        throw new Error("window.google.accounts.oauth2 missing.");
                    }

                    const client = window.google.accounts.oauth2.initTokenClient({
                        client_id: clientId,
                        scope: SCOPES,
                        callback: (tokenResponse: any) => {
                            appendLog('Token received.');
                            if (tokenResponse && tokenResponse.access_token) {
                                setIsAuthenticated(true);
                                appendLog('Authenticated true.');
                            }
                        },
                    });

                    if (client) {
                        appendLog('TokenClient created successfully.');
                        tokenClientRef.current = client;
                        setTokenClient(client);
                    } else {
                        appendLog('TokenClient creation returned null/undefined.');
                        setError("Google Kimlik Servisi (GIS) başlatılamadı.");
                    }
                } catch (tokenErr: any) {
                    appendLog(`TokenClient Init Failed: ${tokenErr.message}`);
                    setError("Oturum Açma Servisi (Token Client) Hatası: " + tokenErr.message);
                }

                setIsInitialized(true);
                return true;
            } catch (err: any) {
                appendLog(`Critical Setup Error: ${err.message}`);
                setError('Kritik Hata: ' + (err.message || 'Google scriptleri yüklenemedi.'));
                return false;
            } finally {
                setIsInitializing(false);
                initPromiseRef.current = null;
            }
        })();

        return initPromiseRef.current;
    }, [enabled, isGapiLoaded, isGisLoaded, appendLog]);

    const login = useCallback(() => {
        const client = tokenClientRef.current || tokenClient;
        appendLog(`Login requested. TokenClient present? ${!!client}`);
        if (client) {
            client.requestAccessToken({ prompt: 'consent' });
            return true;
        } else {
            appendLog('TokenClient not ready yet.');
            return false;
        }
    }, [tokenClient, appendLog]);

    return {
        isReady: isGapiLoaded && isGisLoaded,
        isInitializing,
        isInitialized,
        initClient,
        login,
        isAuthenticated,
        error,
        logs, // Expose logs
        gapi: typeof window !== 'undefined' ? window.gapi : null
    };
}
