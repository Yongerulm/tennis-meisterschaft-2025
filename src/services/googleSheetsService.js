/**
 * 🔧 Einfacher Google Sheets Service - Build-sicher
 */

const GOOGLE_APPS_SCRIPT_URL = process.env.REACT_APP_GOOGLE_SCRIPT_URL || '';

class GoogleSheetsService {
  constructor() {
    this.isOnline = navigator.onLine;
    this.cache = new Map();
    
    // Listen for online/offline events
    window.addEventListener('online', () => {
      this.isOnline = true;
    });
    
    window.addEventListener('offline', () => {
      this.isOnline = false;
    });
  }

  async makeRequest(action, data = null, method = 'GET') {
    const url = `${GOOGLE_APPS_SCRIPT_URL}${method === 'GET' ? `?action=${action}` : ''}`;
    
    const options = {
      method: method,
      mode: 'cors',
      cache: 'no-cache',
      headers: {
        'Content-Type': 'application/json',
      }
    };

    if (method === 'POST' && data) {
      options.body = JSON.stringify({ action, ...data });
    } else if (method === 'POST') {
      options.body = JSON.stringify({ action });
    }

    try {
      const response = await fetch(url, options);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const result = await response.json();
      
      if (result.error) {
        throw new Error(result.error);
      }
      
      return result;
    } catch (error) {
      console.error('API Request failed:', error);
      throw error;
    }
  }

  async getMatches() {
    try {
      const result = await this.makeRequest('getMatches');
      return result.matches || [];
    } catch (error) {
      console.error('Failed to get matches:', error);
      return [];
    }
  }

  async addMatch(matchData) {
    try {
      const result = await this.makeRequest('addMatch', { data: matchData }, 'POST');
      console.log('Match added successfully:', result);
      return result;
    } catch (error) {
      console.error('Failed to add match:', error);
      throw error;
    }
  }

  async deleteMatch(id) {
    try {
      const result = await this.makeRequest('deleteMatch', { id }, 'POST');
      console.log('Match deleted successfully:', result);
      return result;
    } catch (error) {
      console.error('Failed to delete match:', error);
      throw error;
    }
  }

  async getPlayers() {
    try {
      const result = await this.makeRequest('getPlayers');
      return result.players || [];
    } catch (error) {
      console.error('Failed to get players:', error);
      return [];
    }
  }

  async getGroups() {
    try {
      const result = await this.makeRequest('getGroups');
      return result.groups || {};
    } catch (error) {
      console.error('Failed to get groups:', error);
      return {
        A: ['Henning', 'Julia', 'Fabi', 'Michael'],
        B: ['Markus', 'Thomas', 'Gunter', 'Bernd'],
        C: ['Sascha', 'Herbert', 'Sven', 'Jose']
      };
    }
  }

  async healthCheck() {
    try {
      const result = await this.makeRequest('getMatches');
      return { 
        status: 'healthy', 
        online: this.isOnline,
        lastCheck: new Date().toISOString(),
        matchCount: result.matches?.length || 0
      };
    } catch (error) {
      return { 
        status: 'error', 
        online: this.isOnline,
        error: error.message,
        lastCheck: new Date().toISOString()
      };
    }
  }

  getSyncStatus() {
    return {
      online: this.isOnline,
      configured: !!GOOGLE_APPS_SCRIPT_URL && GOOGLE_APPS_SCRIPT_URL !== ''
    };
  }
}

// Singleton export
const googleSheetsService = new GoogleSheetsService();
export default googleSheetsService;

// Utility functions
export const formatMatchForAPI = (match) => {
  return {
    group: match.group,
    phase: match.phase || 'group',
    player1: match.player1,
    player2: match.player2,
    set1: {
      player1: parseInt(match.set1Player1) || 0,
      player2: parseInt(match.set1Player2) || 0
    },
    set2: {
      player1: parseInt(match.set2Player1) || 0,
      player2: parseInt(match.set2Player2) || 0
    },
    tiebreak: (match.tiebreakPlayer1 || match.tiebreakPlayer2) ? {
      player1: parseInt(match.tiebreakPlayer1) || 0,
      player2: parseInt(match.tiebreakPlayer2) || 0
    } : null,
    winner: match.winner,
    status: match.status || 'completed'
  };
};
