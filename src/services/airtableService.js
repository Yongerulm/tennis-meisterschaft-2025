// 🎾 Airtable Service für Tennis Tournament
// Datei: src/services/airtableService.js

import { useState } from 'react';

// Airtable Konfiguration
const AIRTABLE_API_KEY = 'pat1234567890abcdef'; // DEINE API-KEY HIER
const AIRTABLE_BASE_ID = 'appABCDEF123456789'; // DEINE BASE-ID HIER
const AIRTABLE_TABLE_NAME = 'Matches';

const AIRTABLE_API_URL = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${AIRTABLE_TABLE_NAME}`;

// Airtable API Call
const callAirtable = async (method = 'GET', data = null, recordId = null) => {
  try {
    const url = recordId ? `${AIRTABLE_API_URL}/${recordId}` : AIRTABLE_API_URL;
    
    const options = {
      method,
      headers: {
        'Authorization': `Bearer ${AIRTABLE_API_KEY}`,
        'Content-Type': 'application/json'
      }
    };
    
    if (data && (method === 'POST' || method === 'PATCH')) {
      options.body = JSON.stringify(data);
    }
    
    console.log(`📊 Airtable ${method}:`, url);
    
    const response = await fetch(url, options);
    
    if (!response.ok) {
      throw new Error(`Airtable ${method} Error: ${response.status} ${response.statusText}`);
    }
    
    const result = await response.json();
    console.log(`✅ Airtable Response:`, result);
    
    return result;
    
  } catch (error) {
    console.error(`❌ Airtable Error:`, error);
    throw error;
  }
};

// Match-Daten für Airtable konvertieren
const matchToAirtable = (match) => {
  return {
    fields: {
      'ID': match.id,
      'Gruppe': match.group || '',
      'Phase': match.phase,
      'Spieler1': match.player1,
      'Spieler2': match.player2,
      'Satz1_Spieler1': match.set1.player1,
      'Satz1_Spieler2': match.set1.player2,
      'Satz2_Spieler1': match.set2.player1,
      'Satz2_Spieler2': match.set2.player2,
      'Tiebreak_Spieler1': match.tiebreak?.player1 || 0,
      'Tiebreak_Spieler2': match.tiebreak?.player2 || 0,
      'Sieger': match.winner,
      'Status': match.status,
      'Zeitstempel': match.timestamp
    }
  };
};

// Airtable-Daten zu Match konvertieren
const airtableToMatch = (record) => {
  const fields = record.fields;
  
  const match = {
    id: fields.ID,
    group: fields.Gruppe || undefined,
    phase: fields.Phase,
    player1: fields.Spieler1,
    player2: fields.Spieler2,
    set1: {
      player1: fields.Satz1_Spieler1 || 0,
      player2: fields.Satz1_Spieler2 || 0
    },
    set2: {
      player1: fields.Satz2_Spieler1 || 0,
      player2: fields.Satz2_Spieler2 || 0
    },
    winner: fields.Sieger,
    status: fields.Status,
    timestamp: fields.Zeitstempel,
    airtableId: record.id // Airtable Record ID speichern
  };
  
  // Tiebreak nur hinzufügen wenn vorhanden
  if (fields.Tiebreak_Spieler1 || fields.Tiebreak_Spieler2) {
    match.tiebreak = {
      player1: fields.Tiebreak_Spieler1 || 0,
      player2: fields.Tiebreak_Spieler2 || 0
    };
  }
  
  return match;
};

// Airtable Service Klasse
class AirtableService {
  constructor() {
    this.isOnline = true;
    this.lastSync = null;
  }

  // Verbindung testen
  async testConnection() {
    try {
      await callAirtable('GET');
      this.isOnline = true;
      return true;
    } catch (error) {
      console.error('Airtable Connection Test failed:', error);
      this.isOnline = false;
      return false;
    }
  }

  // Alle Matches laden
  async loadMatches() {
    try {
      const result = await callAirtable('GET');
      
      if (result.records) {
        const matches = result.records.map(airtableToMatch);
        this.lastSync = new Date();
        
        return {
          success: true,
          data: matches,
          message: `${matches.length} Matches von Airtable geladen`
        };
      } else {
        return {
          success: true,
          data: [],
          message: 'Keine Matches gefunden'
        };
      }
      
    } catch (error) {
      return {
        success: false,
        message: 'Fehler beim Laden: ' + error.message,
        offline: true
      };
    }
  }

  // Match speichern
  async saveMatch(match) {
    try {
      const airtableData = matchToAirtable(match);
      
      const result = await callAirtable('POST', {
        records: [airtableData]
      });
      
      if (result.records && result.records.length > 0) {
        this.lastSync = new Date();
        return {
          success: true,
          data: match,
          message: 'Match in Airtable gespeichert'
        };
      } else {
        throw new Error('Unerwartete Airtable-Antwort');
      }
      
    } catch (error) {
      return {
        success: false,
        message: 'Fehler beim Speichern: ' + error.message,
        offline: true
      };
    }
  }

  // Match löschen
  async deleteMatch(matchId) {
    try {
      // Finde das Match anhand der ID
      const loadResult = await this.loadMatches();
      if (!loadResult.success) {
        throw new Error('Matches konnten nicht geladen werden');
      }
      
      const matchToDelete = loadResult.data.find(m => m.id === matchId);
      if (!matchToDelete || !matchToDelete.airtableId) {
        throw new Error('Match nicht gefunden');
      }
      
      await callAirtable('DELETE', null, matchToDelete.airtableId);
      
      this.lastSync = new Date();
      return {
        success: true,
        message: 'Match aus Airtable gelöscht'
      };
      
    } catch (error) {
      return {
        success: false,
        message: 'Fehler beim Löschen: ' + error.message,
        offline: true
      };
    }
  }

  // Sync-Status
  getSyncStatus() {
    return {
      isOnline: this.isOnline,
      lastSync: this.lastSync,
      hasConnection: !!(AIRTABLE_API_KEY && AIRTABLE_BASE_ID)
    };
  }
}

// Singleton
const airtableService = new AirtableService();

// React Hook
export const useAirtable = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [syncStatus, setSyncStatus] = useState(airtableService.getSyncStatus());

  const testConnection = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const isOnline = await airtableService.testConnection();
      setSyncStatus(airtableService.getSyncStatus());
      return isOnline;
    } catch (err) {
      setError(err.message);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const loadMatches = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const result = await airtableService.loadMatches();
      setSyncStatus(airtableService.getSyncStatus());
      
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

  const saveMatch = async (match) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const result = await airtableService.saveMatch(match);
      setSyncStatus(airtableService.getSyncStatus());
      
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

  const deleteMatch = async (matchId) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const result = await airtableService.deleteMatch(matchId);
      setSyncStatus(airtableService.getSyncStatus());
      
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

export { airtableService };
export default airtableService;
