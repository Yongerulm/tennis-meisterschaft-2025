/**
 * 🏆 Google Sheets Integration für React Tennis App
 * Erstelle diese Datei als: src/services/googleSheetsService.js
 */

// ===== KONFIGURATION =====
const GOOGLE_APPS_SCRIPT_URL = process.env.REACT_APP_GOOGLE_SCRIPT_URL || 'DEINE_GOOGLE_APPS_SCRIPT_URL_HIER';

// ===== API SERVICE CLASS =====
class GoogleSheetsService {
  constructor() {
    this.baseURL = GOOGLE_APPS_SCRIPT_URL;
    this.isOnline = navigator.onLine;
    this.cache = new Map();
    this.syncQueue = [];
    
    // Listen for online/offline events
    window.addEventListener('online', () => {
      this.isOnline = true;
      this.syncOfflineData();
    });
    
    window.addEventListener('offline', () => {
      this.isOnline = false;
    });
  }

  // ===== HTTP UTILITIES =====
  async makeRequest(action, data = null, method = 'GET') {
    const url = `${this.baseURL}${method === 'GET' ? `?action=${action}` : ''}`;
    
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
      
      // If offline, queue the request
      if (!this.isOnline && method === 'POST') {
        this.queueOfflineRequest(action, data);
        throw new Error('Offline: Request queued for later sync');
      }
      
      throw error;
    }
  }

  // ===== OFFLINE SUPPORT =====
  queueOfflineRequest(action, data) {
    const request = {
      id: Date.now(),
      action,
      data,
      timestamp: new Date().toISOString()
    };
    
    this.syncQueue.push(request);
    localStorage.setItem('tennis_sync_queue', JSON.stringify(this.syncQueue));
    
    console.log('Request queued for offline sync:', request);
  }

  async syncOfflineData() {
    const savedQueue = localStorage.getItem('tennis_sync_queue');
    if (savedQueue) {
      this.syncQueue = JSON.parse(savedQueue);
    }

    if (this.syncQueue.length === 0) return;

    console.log('Syncing offline data...', this.syncQueue);

    const results = [];
    for (const request of this.syncQueue) {
      try {
        const result = await this.makeRequest(request.action, request.data, 'POST');
        results.push({ success: true, request, result });
      } catch (error) {
        results.push({ success: false, request, error: error.message });
      }
    }

    // Clear successful requests
    this.syncQueue = this.syncQueue.filter((_, index) => !results[index].success);
    localStorage.setItem('tennis_sync_queue', JSON.stringify(this.syncQueue));

    return results;
  }

  // ===== CACHE MANAGEMENT =====
  getCached(key) {
    const cached = this.cache.get(key);
    if (cached && Date.now() - cached.timestamp < 30000) { // 30 seconds cache
      return cached.data;
    }
    return null;
  }

  setCache(key, data) {
    this.cache.set(key, {
      data,
      timestamp: Date.now()
    });
  }

  // ===== INITIALIZATION =====
  async initializeSheets() {
    try {
      const result = await this.makeRequest('initializeSheets', null, 'POST');
      console.log('Sheets initialized:', result);
      return result;
    } catch (error) {
      console.error('Failed to initialize sheets:', error);
      throw error;
    }
  }

  // ===== MATCHES API =====
  async getMatches(useCache = true) {
    if (useCache) {
      const cached = this.getCached('matches');
      if (cached) {
        return cached;
      }
    }

    try {
      const result = await this.makeRequest('getMatches');
      this.setCache('matches', result.matches);
      return result.matches;
    } catch (error) {
      console.error('Failed to get matches:', error);
      
      // Try to return cached data if API fails
      const cached = this.getCached('matches');
      if (cached) {
        console.log('Returning cached matches due to API failure');
        return cached;
      }
      
      // Return empty array if no cache available
      return [];
    }
  }

  async addMatch(matchData) {
    try {
      // Add timestamp and generate temporary ID for immediate UI update
      const tempMatch = {
        ...matchData,
        id: `temp_${Date.now()}`,
        timestamp: new Date().toISOString()
      };

      // Update cache immediately for responsive UI
      const currentMatches = this.getCached('matches') || [];
      this.setCache('matches', [...currentMatches, tempMatch]);

      const result = await this.makeRequest('addMatch', { data: matchData }, 'POST');
      
      // Update cache with real ID from server
      const updatedMatches = currentMatches.map(match => 
        match.id === tempMatch.id ? { ...matchData, id: result.id, timestamp: result.match.timestamp } : match
      );
      this.setCache('matches', updatedMatches);

      console.log('Match added successfully:', result);
      return result;
    } catch (error) {
      console.error('Failed to add match:', error);
      throw error;
    }
  }

  async updateMatch(id, matchData) {
    try {
      const result = await this.makeRequest('updateMatch', { id, data: matchData }, 'POST');
      
      // Update cache
      const currentMatches = this.getCached('matches') || [];
      const updatedMatches = currentMatches.map(match => 
        match.id === id ? { ...match, ...matchData } : match
      );
      this.setCache('matches', updatedMatches);

      console.log('Match updated successfully:', result);
      return result;
    } catch (error) {
      console.error('Failed to update match:', error);
      throw error;
    }
  }

  async deleteMatch(id) {
    try {
      const result = await this.makeRequest('deleteMatch', { id }, 'POST');
      
      // Update cache
      const currentMatches = this.getCached('matches') || [];
      const updatedMatches = currentMatches.filter(match => match.id !== id);
      this.setCache('matches', updatedMatches);

      console.log('Match deleted successfully:', result);
      return result;
    } catch (error) {
      console.error('Failed to delete match:', error);
      throw error;
    }
  }

  // ===== PLAYERS & GROUPS API =====
  async getPlayers(useCache = true) {
    if (useCache) {
      const cached = this.getCached('players');
      if (cached) {
        return cached;
      }
    }

    try {
      const result = await this.makeRequest('getPlayers');
      this.setCache('players', result.players);
      return result.players;
    } catch (error) {
      console.error('Failed to get players:', error);
      return [];
    }
  }

  async getGroups(useCache = true) {
    if (useCache) {
      const cached = this.getCached('groups');
      if (cached) {
        return cached;
      }
    }

    try {
      const result = await this.makeRequest('getGroups');
      this.setCache('groups', result.groups);
      return result.groups;
    } catch (error) {
      console.error('Failed to get groups:', error);
      
      // Return default groups if API fails
      return {
        A: ['Henning', 'Julia', 'Fabi', 'Michael'],
        B: ['Markus', 'Thomas', 'Gunter', 'Bernd'],
        C: ['Sascha', 'Herbert', 'Sven', 'Jose']
      };
    }
  }

  // ===== HEALTH CHECK =====
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

  // ===== SYNC STATUS =====
  getSyncStatus() {
    return {
      online: this.isOnline,
      queuedRequests: this.syncQueue.length,
      lastSync: localStorage.getItem('tennis_last_sync'),
      cacheEntries: this.cache.size
    };
  }

  // ===== CLEAR DATA =====
  clearCache() {
    this.cache.clear();
    console.log('Cache cleared');
  }

  clearSyncQueue() {
    this.syncQueue = [];
    localStorage.removeItem('tennis_sync_queue');
    console.log('Sync queue cleared');
  }
}

// ===== SINGLETON EXPORT =====
const googleSheetsService = new GoogleSheetsService();
export default googleSheetsService;

// ===== UTILITY FUNCTIONS =====
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

export const formatMatchFromAPI = (apiMatch) => {
  return {
    id: apiMatch.id,
    group: apiMatch.group,
    phase: apiMatch.phase,
    player1: apiMatch.player1,
    player2: apiMatch.player2,
    set1Player1: apiMatch.set1?.player1?.toString() || '',
    set1Player2: apiMatch.set1?.player2?.toString() || '',
    set2Player1: apiMatch.set2?.player1?.toString() || '',
    set2Player2: apiMatch.set2?.player2?.toString() || '',
    tiebreakPlayer1: apiMatch.tiebreak?.player1?.toString() || '',
    tiebreakPlayer2: apiMatch.tiebreak?.player2?.toString() || '',
    winner: apiMatch.winner,
    status: apiMatch.status,
    timestamp: apiMatch.timestamp
  };
};

// ===== REACT HOOKS =====
export const useGoogleSheets = () => {
  const [isOnline, setIsOnline] = React.useState(navigator.onLine);
  const [syncStatus, setSyncStatus] = React.useState(null);

  React.useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Initial sync status
    setSyncStatus(googleSheetsService.getSyncStatus());

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const refreshSyncStatus = () => {
    setSyncStatus(googleSheetsService.getSyncStatus());
  };

  return {
    service: googleSheetsService,
    isOnline,
    syncStatus,
    refreshSyncStatus
  };
};
