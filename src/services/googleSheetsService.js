// 🎾 Google Sheets Service für Tennis Tournament
// Datei: src/services/googleSheetsService.js

const GOOGLE_APPS_SCRIPT_URL = process.env.REACT_APP_GOOGLE_APPS_SCRIPT_URL || '';

// Basis API-Aufruf
const callGoogleAppsScript = async (action, data = {}) => {
  try {
    if (!GOOGLE_APPS_SCRIPT_URL) {
      console.warn('Google Apps Script URL nicht konfiguriert - verwende Demo-Modus');
      return { status: 'offline', message: 'Demo-Modus aktiv' };
    }

    const requestData = {
      action,
      ...data
    };

    console.log(`📡 Google Sheets API: ${action}`, requestData);

    const response = await fetch(GOOGLE_APPS_SCRIPT_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestData)
    });

    if (!response.ok) {
      throw new Error(`HTTP Error: ${response.status} ${response.statusText}`);
    }

    const result = await response.json();
    
    console.log(`✅ Google Sheets Response:`, result);
    
    return result;

  } catch (error) {
    console.error(`❌ Google Sheets Error (${action}):`, error);
    return {
      status: 'error',
      message: error.message || 'Verbindungsfehler zu Google Sheets'
    };
  }
};

// Google Sheets Service Klasse
class GoogleSheetsService {
  constructor() {
    this.isOnline = true;
    this.lastSync = null;
  }

  // Backend-Verbindung testen
  async testConnection() {
    try {
      const result = await callGoogleAppsScript('test');
      this.isOnline = result.status === 'success';
      return this.isOnline;
    } catch (error) {
      console.error('Connection test failed:', error);
      this.isOnline = false;
      return false;
    }
  }

  // Alle Matches laden
  async loadMatches() {
    try {
      const result = await callGoogleAppsScript('getMatches');
      
      if (result.status === 'success') {
        this.lastSync = new Date();
        return {
          success: true,
          data: result.data || [],
          message: result.message
        };
      } else if (result.status === 'offline') {
        return {
          success: false,
          offline: true,
          message: 'Google Sheets nicht verfügbar - Demo-Modus aktiv'
        };
      } else {
        return {
          success: false,
          message: result.message || 'Fehler beim Laden der Matches'
        };
      }
    } catch (error) {
      return {
        success: false,
        message: 'Verbindungsfehler: ' + error.message,
        offline: true
      };
    }
  }

  // Match speichern
  async saveMatch(match) {
    try {
      const result = await callGoogleAppsScript('addMatch', { match });
      
      if (result.status === 'success') {
        this.lastSync = new Date();
        return {
          success: true,
          data: result.data,
          message: result.message
        };
      } else if (result.status === 'offline') {
        return {
          success: false,
          offline: true,
          message: 'Google Sheets nicht verfügbar - Match nur lokal gespeichert'
        };
      } else {
        return {
          success: false,
          message: result.message || 'Fehler beim Speichern des Matches'
        };
      }
    } catch (error) {
      return {
        success: false,
        message: 'Verbindungsfehler: ' + error.message,
        offline: true
      };
    }
  }

  // Match löschen
  async deleteMatch(matchId) {
    try {
      const result = await callGoogleAppsScript('deleteMatch', { matchId });
      
      if (result.status === 'success') {
        this.lastSync = new Date();
        return {
          success: true,
          message: result.message
        };
      } else if (result.status === 'offline') {
        return {
          success: false,
          offline: true,
          message: 'Google Sheets nicht verfügbar - Match nur lokal gelöscht'
        };
      } else {
        return {
          success: false,
          message: result.message || 'Fehler beim Löschen des Matches'
        };
      }
    } catch (error) {
      return {
        success: false,
        message: 'Verbindungsfehler: ' + error.message,
        offline: true
      };
    }
  }

  // Sync-Status abrufen
  getSyncStatus() {
    return {
      isOnline: this.isOnline,
      lastSync: this.lastSync,
      hasConnection: !!GOOGLE_APPS_SCRIPT_URL
    };
  }
}

// Singleton-Instanz erstellen
const googleSheetsService = new GoogleSheetsService();

// React Hook für Google Sheets
export const useGoogleSheets = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [syncStatus, setSyncStatus] = useState(googleSheetsService.getSyncStatus());

  // Verbindung testen
  const testConnection = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const isOnline = await googleSheetsService.testConnection();
      setSyncStatus(googleSheetsService.getSyncStatus());
      return isOnline;
    } catch (err) {
      setError(err.message);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  // Matches laden
  const loadMatches = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const result = await googleSheetsService.loadMatches();
      setSyncStatus(googleSheetsService.getSyncStatus());
      
      if (!result.success && !result.offline) {
        setError(result.message);
      }
      
      return result;
    } catch (err) {
      setError(err.message);
      return {
        success: false,
        message: err.message,
        offline: true
      };
    } finally {
      setIsLoading(false);
    }
  };

  // Match speichern
  const saveMatch = async (match) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const result = await googleSheetsService.saveMatch(match);
      setSyncStatus(googleSheetsService.getSyncStatus());
      
      if (!result.success && !result.offline) {
        setError(result.message);
      }
      
      return result;
    } catch (err) {
      setError(err.message);
      return {
        success: false,
        message: err.message,
        offline: true
      };
    } finally {
      setIsLoading(false);
    }
  };

  // Match löschen
  const deleteMatch = async (matchId) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const result = await googleSheetsService.deleteMatch(matchId);
      setSyncStatus(googleSheetsService.getSyncStatus());
      
      if (!result.success && !result.offline) {
        setError(result.message);
      }
      
      return result;
    } catch (err) {
      setError(err.message);
      return {
        success: false,
        message: err.message,
        offline: true
      };
    } finally {
      setIsLoading(false);
    }
  };

  return {
    isLoading,
    error,
    syncStatus,
    testConnection,
    loadMatches,
    saveMatch,
    deleteMatch
  };
};

// Named Exports
export { googleSheetsService };
export default googleSheetsService;

// React State Import für Hook
import { useState } from 'react';
