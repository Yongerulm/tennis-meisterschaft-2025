import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Users, Trophy, Plus, Calendar, MapPin, User, AlertTriangle, Settings, Trash2, RefreshCw, Wifi, WifiOff } from 'lucide-react';

const TennisChampionship = () => {
  // State Management
  const [activeTab, setActiveTab] = useState('overview');
  const [loginPin, setLoginPin] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isAdminMode, setIsAdminMode] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [matches, setMatches] = useState([]);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [validationErrors, setValidationErrors] = useState([]);
  const [nextMatchId, setNextMatchId] = useState(1000);
  const [connectionStatus, setConnectionStatus] = useState('testing');
  const [errorMessage, setErrorMessage] = useState('');
  
  // New Match Form State
  const [newMatch, setNewMatch] = useState({
    group: 'A',
    phase: 'group',
    player1: '',
    player2: '',
    set1Player1: '',
    set1Player2: '',
    set2Player1: '',
    set2Player2: '',
    tiebreakPlayer1: '',
    tiebreakPlayer2: ''
  });

  // Constants
  const GROUPS = {
    A: ['Henning', 'Julia', 'Fabi', 'Michael'],
    B: ['Markus', 'Thomas', 'Gunter', 'Bernd'],
    C: ['Sascha', 'Herbert', 'Sven', 'Jose']
  };

  const correctPin = '2025';
  const adminPin = '9999';

  // Airtable Configuration - Safe environment variable access
  const getEnvVar = (key, fallback = '') => {
    try {
      return (typeof process !== 'undefined' && process.env && process.env[key]) || fallback;
    } catch (error) {
      console.warn(`Environment variable ${key} not available, using fallback`);
      return fallback;
    }
  };

  const AIRTABLE_CONFIG = {
    baseId: getEnvVar('REACT_APP_AIRTABLE_BASE_ID', 'app5txy8Rr2jz0R0i'),
    tableName: getEnvVar('REACT_APP_AIRTABLE_TABLE_NAME', 'Matches'),
    apiKey: getEnvVar('REACT_APP_AIRTABLE_API_KEY', 'pata8AegwOwmtid9t.f9bbcc2ac3248d3712e9443d9df066c7fcc922683c05401b6028a5892a5b25e9'),
    get apiUrl() {
      return `https://api.airtable.com/v0/${this.baseId}/${this.tableName}`;
    }
  };

  // Demo Data Fallback
  const demoMatches = [
    {
      id: 1,
      group: 'A',
      phase: 'group',
      player1: 'Henning',
      player2: 'Julia',
      set1: { player1: 6, player2: 4 },
      set2: { player1: 3, player2: 6 },
      tiebreak: { player1: 10, player2: 7 },
      winner: 'Henning',
      status: 'completed',
      timestamp: new Date().toISOString()
    },
    {
      id: 2,
      group: 'A',
      phase: 'group',
      player1: 'Fabi',
      player2: 'Michael',
      set1: { player1: 6, player2: 2 },
      set2: { player1: 6, player2: 4 },
      winner: 'Fabi',
      status: 'completed',
      timestamp: new Date().toISOString()
    }
  ];

  // Airtable API Functions - ONLY Airtable!
  const airtableRequest = async (method, endpoint = '', data = null) => {
    if (!AIRTABLE_CONFIG.apiKey) {
      throw new Error('Airtable API Key nicht konfiguriert');
    }

    const url = endpoint ? `${AIRTABLE_CONFIG.apiUrl}/${endpoint}` : AIRTABLE_CONFIG.apiUrl;
    
    const config = {
      method,
      headers: {
        'Authorization': `Bearer ${AIRTABLE_CONFIG.apiKey}`,
        'Content-Type': 'application/json'
      }
    };

    if (data) {
      config.body = JSON.stringify(data);
    }

    const response = await fetch(url, config);
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Airtable ${method} Error: ${response.status} - ${errorText}`);
    }

    return response.json();
  };

  // Test Airtable Connection - ONLY Airtable!
  const testAirtableConnection = async () => {
    try {
      console.log('🎾 Initialisiere Tennis App...');
      console.log('🔄 Teste Airtable Verbindung...');
      setConnectionStatus('testing');
      
      await airtableRequest('GET');
      
      console.log('✅ Airtable Verbindung erfolgreich!');
      setConnectionStatus('connected');
      setErrorMessage('');
      return true;
    } catch (error) {
      console.error('❌ Airtable Verbindung fehlgeschlagen:', error);
      console.log('⚠️ Verwende Demo-Modus aufgrund von Verbindungsproblemen');
      setConnectionStatus('disconnected');
      setErrorMessage(error.message);
      return false;
    }
  };

  // Load Matches from Airtable - ONLY Airtable!
  const loadMatches = async () => {
    try {
      if (connectionStatus !== 'connected') {
        console.log('⚠️ Verwende Demo-Daten - Airtable nicht verbunden');
        setMatches(demoMatches);
        return;
      }

      const response = await airtableRequest('GET');
      
      const airtableMatches = response.records.map(record => ({
        id: record.fields.id,
        group: record.fields.group,
        phase: record.fields.phase,
        player1: record.fields.player1,
        player2: record.fields.player2,
        set1: {
          player1: record.fields.set1Player1 || 0,
          player2: record.fields.set1Player2 || 0
        },
        set2: {
          player1: record.fields.set2Player1 || 0,
          player2: record.fields.set2Player2 || 0
        },
        ...(record.fields.tiebreakPlayer1 && {
          tiebreak: {
            player1: record.fields.tiebreakPlayer1,
            player2: record.fields.tiebreakPlayer2
          }
        }),
        winner: record.fields.winner,
        status: record.fields.status,
        timestamp: record.fields.timestamp,
        airtableId: record.id
      }));

      setMatches(airtableMatches);
      
      if (airtableMatches.length > 0) {
        const maxId = Math.max(...airtableMatches.map(m => m.id));
        setNextMatchId(maxId + 1);
      }
      
      console.log(`📊 ${airtableMatches.length} Matches von Airtable geladen`);
      
    } catch (error) {
      console.error('❌ Fehler beim Laden der Matches:', error);
      setMatches(demoMatches);
      setErrorMessage(`Laden fehlgeschlagen: ${error.message}`);
    }
  };

  // Save Match to Airtable - ONLY Airtable!
  const saveMatchToAirtable = async (matchData) => {
    if (connectionStatus !== 'connected') {
      console.log('⚠️ Demo-Modus: Match nur lokal gespeichert');
      return matchData;
    }

    try {
      const airtableData = {
        fields: {
          id: matchData.id,
          group: matchData.group,
          phase: matchData.phase,
          player1: matchData.player1,
          player2: matchData.player2,
          set1Player1: matchData.set1.player1,
          set1Player2: matchData.set1.player2,
          set2Player1: matchData.set2.player1,
          set2Player2: matchData.set2.player2,
          ...(matchData.tiebreak && {
            tiebreakPlayer1: matchData.tiebreak.player1,
            tiebreakPlayer2: matchData.tiebreak.player2
          }),
          winner: matchData.winner,
          status: matchData.status,
          timestamp: matchData.timestamp
        }
      };

      const response = await airtableRequest('POST', '', airtableData);
      
      console.log('✅ Match erfolgreich in Airtable gespeichert');
      return {
        ...matchData,
        airtableId: response.id
      };
      
    } catch (error) {
      console.error('❌ Fehler beim Speichern in Airtable:', error);
      throw new Error(`Airtable Speichern fehlgeschlagen: ${error.message}`);
    }
  };

  // Delete Match from Airtable - ONLY Airtable!
  const deleteMatchFromAirtable = async (match) => {
    if (connectionStatus !== 'connected' || !match.airtableId) {
      console.log('⚠️ Demo-Modus: Match nur lokal gelöscht');
      return;
    }

    try {
      await airtableRequest('DELETE', match.airtableId);
      console.log('✅ Match aus Airtable gelöscht');
    } catch (error) {
      console.error('❌ Fehler beim Löschen aus Airtable:', error);
      throw new Error(`Airtable Löschen fehlgeschlagen: ${error.message}`);
    }
  };

  // Initialize Connection and Load Data - ONLY Airtable!
  useEffect(() => {
    const initializeApp = async () => {
      console.log('🎾 Tennis App wird gestartet...');
      const connected = await testAirtableConnection();
      await loadMatches();
      console.log('🚀 Tennis App erfolgreich geladen!');
    };

    initializeApp();
  }, []);

  // Tennis Score Validation
  const validateTennisScore = useCallback((set1P1, set1P2, set2P1, set2P2, tbP1, tbP2) => {
    const errors = [];
    
    const validateSet = (p1Score, p2Score, setNumber) => {
      const s1 = parseInt(p1Score) || 0;
      const s2 = parseInt(p2Score) || 0;
      
      if (s1 < 0 || s2 < 0) {
        errors.push(`Satz ${setNumber}: Negative Werte sind nicht erlaubt`);
        return false;
      }
      
      if (s1 === 0 && s2 === 0) return true;
      
      if (s1 > 7 || s2 > 7) {
        errors.push(`Satz ${setNumber}: Maximal 7 Games pro Satz möglich`);
        return false;
      }
      
      // Valid score patterns
      if ((s1 === 6 && s2 <= 4) || (s2 === 6 && s1 <= 4)) return true;
      if ((s1 === 7 && s2 === 5) || (s2 === 7 && s1 === 5)) return true;
      if ((s1 === 7 && s2 === 6) || (s2 === 7 && s1 === 6)) return true;
      
      if (s1 === 6 && s2 === 6) {
        errors.push(`Satz ${setNumber}: Bei 6:6 muss ein Tiebreak gespielt werden (Ergebnis wäre dann 7:6)`);
        return false;
      }
      
      return true;
    };
    
    validateSet(set1P1, set1P2, 1);
    validateSet(set2P1, set2P2, 2);
    
    const tb1 = parseInt(tbP1) || 0;
    const tb2 = parseInt(tbP2) || 0;
    
    if (tb1 > 0 || tb2 > 0) {
      if (tb1 < 0 || tb2 < 0) {
        errors.push('Match-Tiebreak: Negative Werte sind nicht erlaubt');
      } else if (Math.max(tb1, tb2) < 10) {
        errors.push('Match-Tiebreak: Match-Tiebreak geht normalerweise bis mindestens 10 Punkte');
      } else if (Math.max(tb1, tb2) >= 10 && Math.abs(tb1 - tb2) < 2) {
        errors.push('Match-Tiebreak: Bei 10+ Punkten muss mindestens 2 Punkte Vorsprung bestehen');
      }
    }
    
    return errors;
  }, []);

  // Determine Winner
  const determineWinner = useCallback((matchData) => {
    const set1P1 = parseInt(matchData.set1Player1) || 0;
    const set1P2 = parseInt(matchData.set1Player2) || 0;
    const set2P1 = parseInt(matchData.set2Player1) || 0;
    const set2P2 = parseInt(matchData.set2Player2) || 0;
    const tbP1 = parseInt(matchData.tiebreakPlayer1) || 0;
    const tbP2 = parseInt(matchData.tiebreakPlayer2) || 0;

    const validationErrors = validateTennisScore(set1P1, set1P2, set2P1, set2P2, tbP1, tbP2);
    
    if (validationErrors.length > 0) {
      return { winner: null, errors: validationErrors };
    }

    if (set1P1 === 0 && set1P2 === 0 && set2P1 === 0 && set2P2 === 0) {
      return { winner: null, errors: ['Bitte geben Sie mindestens ein Satz-Ergebnis ein'] };
    }

    let p1Sets = 0, p2Sets = 0;
    
    if (set1P1 > 0 || set1P2 > 0) {
      if (set1P1 > set1P2) p1Sets++; else p2Sets++;
    }
    
    if (set2P1 > 0 || set2P2 > 0) {
      if (set2P1 > set2P2) p1Sets++; else p2Sets++;
    }

    if (p1Sets === 2) return { winner: matchData.player1, errors: [] };
    if (p2Sets === 2) return { winner: matchData.player2, errors: [] };

    if (p1Sets === 1 && p2Sets === 1) {
      if (tbP1 === 0 && tbP2 === 0) {
        return { winner: null, errors: ['Bei 1:1 Sätzen ist ein Match-Tiebreak erforderlich'] };
      }
      return { winner: tbP1 > tbP2 ? matchData.player1 : matchData.player2, errors: [] };
    }

    if (p1Sets === 1 && p2Sets === 0) return { winner: matchData.player1, errors: [] };
    if (p2Sets === 1 && p1Sets === 0) return { winner: matchData.player2, errors: [] };
    
    return { winner: null, errors: ['Ungültiges Match-Ergebnis'] };
  }, [validateTennisScore]);

  // Calculate Group Table
  const calculateGroupTable = useCallback((groupName) => {
    const groupPlayers = GROUPS[groupName];
    const groupMatches = matches.filter(m => m.group === groupName && m.status === 'completed');
    
    const playerStats = {};
    groupPlayers.forEach(player => {
      playerStats[player] = {
        name: player,
        matches: 0,
        wins: 0,
        losses: 0,
        setsWon: 0,
        setsLost: 0,
        points: 0
      };
    });

    groupMatches.forEach(match => {
      const p1 = match.player1;
      const p2 = match.player2;
      
      if (playerStats[p1] && playerStats[p2]) {
        playerStats[p1].matches++;
        playerStats[p2].matches++;
        
        let p1Sets = 0, p2Sets = 0;
        if (match.set1.player1 > match.set1.player2) p1Sets++; else p2Sets++;
        if (match.set2.player1 > match.set2.player2) p1Sets++; else p2Sets++;
        
        if (match.tiebreak) {
          if (match.tiebreak.player1 > match.tiebreak.player2) p1Sets++; else p2Sets++;
        }
        
        playerStats[p1].setsWon += p1Sets;
        playerStats[p1].setsLost += p2Sets;
        playerStats[p2].setsWon += p2Sets;
        playerStats[p2].setsLost += p1Sets;
        
        if (match.winner === p1) {
          playerStats[p1].wins++;
          playerStats[p1].points += 2;
          playerStats[p2].losses++;
          playerStats[p2].points += 1;
        } else if (match.winner === p2) {
          playerStats[p2].wins++;
          playerStats[p2].points += 2;
          playerStats[p1].losses++;
          playerStats[p1].points += 1;
        }
      }
    });

    return Object.values(playerStats).sort((a, b) => {
      if (b.points !== a.points) return b.points - a.points;
      const aSetRatio = a.setsLost === 0 ? a.setsWon : (a.setsWon / a.setsLost);
      const bSetRatio = b.setsLost === 0 ? b.setsWon : (b.setsWon / b.setsLost);
      return bSetRatio - aSetRatio;
    });
  }, [matches]);

  // Get Qualified Players for KO Phase
  const getQualifiedPlayers = useMemo(() => {
    const qualified = [];
    const groupFirsts = [];
    const groupSeconds = [];
    const groupThirds = [];
    
    ['A', 'B', 'C'].forEach(groupName => {
      const table = calculateGroupTable(groupName);
      if (table.length >= 1) {
        groupFirsts.push({
          name: table[0].name,
          group: groupName,
          position: 1,
          points: table[0].points
        });
      }
      if (table.length >= 2) {
        groupSeconds.push({
          name: table[1].name,
          group: groupName,
          position: 2,
          points: table[1].points
        });
      }
      if (table.length >= 3) {
        groupThirds.push({
          name: table[2].name,
          group: groupName,
          position: 3,
          points: table[2].points
        });
      }
    });

    // Sortiere nach Punkten
    groupFirsts.sort((a, b) => b.points - a.points);
    groupSeconds.sort((a, b) => b.points - a.points);
    groupThirds.sort((a, b) => b.points - a.points);

    // Alle Gruppensieger (3 Spieler)
    qualified.push(...groupFirsts);
    // Alle Gruppenzweiten (3 Spieler)  
    qualified.push(...groupSeconds);
    // 2 beste Gruppendritten (2 Spieler)
    qualified.push(...groupThirds.slice(0, 2));

    return qualified;
  }, [calculateGroupTable]);

  // Generate Pairings
  const generatePairings = (players) => {
    const pairings = [];
    for (let i = 0; i < players.length; i++) {
      for (let j = i + 1; j < players.length; j++) {
        pairings.push([players[i], players[j]]);
      }
    }
    return pairings;
  };

  // Get Available Matches
  const getAvailableMatches = useCallback((group) => {
    const groupPlayers = GROUPS[group];
    const availableMatches = [];
    
    for (let i = 0; i < groupPlayers.length; i++) {
      for (let j = i + 1; j < groupPlayers.length; j++) {
        const player1 = groupPlayers[i];
        const player2 = groupPlayers[j];
        
        const existingMatch = matches.find(m => 
          m.group === group && 
          m.status === 'completed' &&
          ((m.player1 === player1 && m.player2 === player2) || 
           (m.player1 === player2 && m.player2 === player1))
        );
        
        if (!existingMatch || isAdminMode) {
          availableMatches.push([player1, player2, !!existingMatch]);
        }
      }
    }
    return availableMatches;
  }, [matches, isAdminMode]);

  // Handle Login
  const handleLogin = () => {
    if (loginPin === correctPin) {
      setIsAuthenticated(true);
      setIsAdminMode(false);
      setLoginPin('');
    } else if (loginPin === adminPin) {
      setIsAuthenticated(true);
      setIsAdminMode(true);
      setLoginPin('');
    } else {
      alert('Falsche PIN. Versuchen Sie "2025" für normalen Zugang oder "9999" für Admin-Modus.');
    }
  };

  // Validate new match on change
  useEffect(() => {
    if (newMatch.player1 && newMatch.player2) {
      const result = determineWinner(newMatch);
      setValidationErrors(result.errors);
    } else {
      setValidationErrors([]);
    }
  }, [newMatch, determineWinner]);

  // Reset form
  const resetForm = () => {
    setNewMatch({
      group: 'A',
      phase: 'group',
      player1: '',
      player2: '',
      set1Player1: '',
      set1Player2: '',
      set2Player1: '',
      set2Player2: '',
      tiebreakPlayer1: '',
      tiebreakPlayer2: ''
    });
    setValidationErrors([]);
  };

  // Add new match
  const addNewMatch = async () => {
    if (!newMatch.player1 || !newMatch.player2) {
      alert('Bitte wählen Sie beide Spieler aus.');
      return;
    }

    setIsLoading(true);

    try {
      const result = determineWinner(newMatch);
      
      if (result.errors.length > 0) {
        alert('Validierungsfehler:\n\n' + result.errors.join('\n'));
        return;
      }

      if (!result.winner) {
        alert('Bitte geben Sie gültige Ergebnisse ein.');
        return;
      }

      const match = {
        id: nextMatchId,
        group: newMatch.group === 'KO' ? undefined : newMatch.group,
        phase: newMatch.phase,
        player1: newMatch.player1,
        player2: newMatch.player2,
        set1: {
          player1: parseInt(newMatch.set1Player1) || 0,
          player2: parseInt(newMatch.set1Player2) || 0
        },
        set2: {
          player1: parseInt(newMatch.set2Player1) || 0,
          player2: parseInt(newMatch.set2Player2) || 0
        },
        ...(newMatch.tiebreakPlayer1 && {
          tiebreak: {
            player1: parseInt(newMatch.tiebreakPlayer1) || 0,
            player2: parseInt(newMatch.tiebreakPlayer2) || 0
          }
        }),
        winner: result.winner,
        status: 'completed',
        timestamp: new Date().toISOString()
      };

      // Save to Airtable first
      const savedMatch = await saveMatchToAirtable(match);
      
      // Update local state
      setMatches(currentMatches => [...currentMatches, savedMatch]);
      setNextMatchId(nextMatchId + 1);
      
      const phaseText = match.phase === 'group' ? `Gruppe ${match.group}` : 
                       match.phase === 'semifinal' ? 'Endrunde' : 'Finale';
      
      const statusText = connectionStatus === 'connected' ? 
        '✅ In Airtable gespeichert!' : 
        '⚠️ Nur lokal gespeichert (Demo-Modus)';
      
      setSuccessMessage(
        `🎾 Match erfolgreich gespeichert!\n\n` +
        `${phaseText}\n` +
        `${match.player1} vs ${match.player2}\n` +
        `Satz 1: ${match.set1.player1}:${match.set1.player2}\n` +
        `Satz 2: ${match.set2.player1}:${match.set2.player2}` +
        (match.tiebreak ? `\nTiebreak: ${match.tiebreak.player1}:${match.tiebreak.player2}` : '') +
        `\n\n🏆 Sieger: ${match.winner}\n\n${statusText}`
      );
      setShowSuccessModal(true);
      resetForm();
      
    } catch (error) {
      console.error('Fehler beim Speichern:', error);
      alert(`Fehler beim Speichern: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Delete match
  const deleteMatch = async (matchId) => {
    if (!isAdminMode) {
      alert('Nur im Admin-Modus verfügbar!');
      return;
    }

    const matchToDelete = matches.find(m => m.id === matchId);
    if (!matchToDelete) return;

    const confirmed = window.confirm('Möchten Sie dieses Match wirklich löschen?');
    if (!confirmed) return;

    setIsLoading(true);
    
    try {
      // Delete from Airtable first
      await deleteMatchFromAirtable(matchToDelete);
      
      // Update local state
      setMatches(currentMatches => {
        const updatedMatches = currentMatches.filter(m => m.id !== matchId);
        console.log('Match gelöscht, neue Liste:', updatedMatches);
        return updatedMatches;
      });
      
      const statusText = connectionStatus === 'connected' ? 
        'Match aus Airtable gelöscht!' : 
        'Match lokal gelöscht (Demo-Modus)';
      
      setSuccessMessage(statusText);
      setShowSuccessModal(true);
    } catch (error) {
      console.error('Fehler beim Löschen:', error);
      alert(`Fehler beim Löschen: ${error.message}`);
    } finally {
      setTimeout(() => setIsLoading(false), 500);
    }
  };

  // Retry Connection
  const retryConnection = async () => {
    setIsLoading(true);
    await testAirtableConnection();
    if (connectionStatus === 'connected') {
      await loadMatches();
    }
    setIsLoading(false);
  };

  // Components
  const ConnectionStatusCard = () => (
    <div className="mb-6 p-4 bg-white rounded-xl shadow-lg border">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-medium text-gray-700 flex items-center">
          {connectionStatus === 'connected' && <Wifi className="w-4 h-4 text-green-500 mr-2" />}
          {connectionStatus === 'disconnected' && <WifiOff className="w-4 h-4 text-red-500 mr-2" />}
          {connectionStatus === 'testing' && <RefreshCw className="w-4 h-4 text-blue-500 mr-2 animate-spin" />}
          Airtable Status
        </h3>
        <button
          onClick={retryConnection}
          disabled={isLoading || connectionStatus === 'testing'}
          className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded hover:bg-blue-200 transition-colors disabled:opacity-50"
        >
          Erneut versuchen
        </button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
        <div className="flex items-center justify-between">
          <span className="text-gray-600">Verbindung:</span>
          <span className={`font-medium ${
            connectionStatus === 'connected' ? 'text-green-600' : 
            connectionStatus === 'disconnected' ? 'text-red-600' : 'text-blue-600'
          }`}>
            {connectionStatus === 'connected' ? 'Verbunden' : 
             connectionStatus === 'disconnected' ? 'Getrennt' : 'Teste...'}
          </span>
        </div>
        
        <div className="flex items-center justify-between">
          <span className="text-gray-600">Modus:</span>
          <span className={`font-medium ${
            connectionStatus === 'connected' ? 'text-green-600' : 'text-yellow-600'
          }`}>
            {connectionStatus === 'connected' ? 'Produktiv' : 'Demo'}
          </span>
        </div>
        
        <div className="flex items-center justify-between">
          <span className="text-gray-600">Matches:</span>
          <span className="font-medium text-gray-800">{matches.length}</span>
        </div>
      </div>

      {errorMessage && (
        <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
          <h4 className="text-red-800 font-medium mb-1">Verbindungsfehler:</h4>
          <p className="text-red-700 text-sm">{errorMessage}</p>
          <p className="text-red-600 text-xs mt-2">
            💡 Überprüfen Sie Ihre .env Datei und Airtable-Konfiguration
          </p>
        </div>
      )}

      {connectionStatus === 'disconnected' && !errorMessage && (
        <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
          <h4 className="text-yellow-800 font-medium mb-2">⚠️ Demo-Modus aktiv</h4>
          <ul className="text-yellow-700 text-sm space-y-1">
            <li>• Daten werden nur lokal gespeichert</li>
            <li>• Beim Neuladen gehen Daten verloren</li>
            <li>• Konfigurieren Sie Airtable für permanente Speicherung</li>
          </ul>
        </div>
      )}
    </div>
  );

  const ValidationAlert = ({ errors }) => {
    if (errors.length === 0) return null;

    return (
      <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
        <div className="flex items-start space-x-2">
          <AlertTriangle className="text-red-500 mt-0.5 flex-shrink-0" size={18} />
          <div>
            <h4 className="text-red-800 font-medium mb-2">Eingabe-Probleme:</h4>
            <ul className="text-red-700 text-sm space-y-1">
              {errors.map((error, index) => (
                <li key={index} className="flex items-start space-x-1">
                  <span className="text-red-500">•</span>
                  <span>{error}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    );
  };

  const SuccessModal = () => {
    if (!showSuccessModal) return null;
    
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={() => setShowSuccessModal(false)}>
        <div className="bg-white rounded-2xl p-8 max-w-md mx-4 shadow-2xl transform">
          <div className="text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Trophy className="w-8 h-8 text-green-600" />
            </div>
            <h3 className="text-xl font-bold text-gray-800 mb-4">Erfolgreich!</h3>
            <p className="text-gray-600 whitespace-pre-line mb-6">
              {successMessage}
            </p>
            <button
              onClick={() => setShowSuccessModal(false)}
              className="w-full bg-green-500 text-white py-3 rounded-xl font-medium hover:bg-green-600 transition-colors"
            >
              Super! 🎾
            </button>
          </div>
        </div>
      </div>
    );
  };

  const TabButton = ({ id, label, icon: Icon, isActive, onClick }) => (
    <button
      onClick={onClick}
      className={`flex items-center space-x-2 px-4 md:px-6 py-2 md:py-3 rounded-full transition-all duration-300 ${
        isActive 
          ? 'bg-blue-500 text-white shadow-lg transform scale-105' 
          : 'bg-white text-gray-600 hover:bg-gray-50 shadow-md hover:shadow-lg'
      }`}
    >
      <Icon size={18} />
      <span className="font-medium hidden sm:inline">{label}</span>
    </button>
  );

  const GroupCard = ({ groupName, players }) => {
    const tableData = useMemo(() => calculateGroupTable(groupName), [groupName]);
    const totalMatches = generatePairings(players).length;
    const playedMatches = matches.filter(m => m.group === groupName && m.status === 'completed').length;
    
    return (
      <div className="bg-white rounded-2xl shadow-lg p-4 md:p-6 hover:shadow-xl transition-all duration-300">
        <h3 className="text-lg md:text-xl font-semibold text-gray-800 mb-4 flex items-center justify-between">
          <div className="flex items-center">
            <Users className="mr-2 text-blue-500" size={20} />
            Gruppe {groupName}
          </div>
          <span className="text-sm text-gray-500">
            {playedMatches}/{totalMatches} Matches
          </span>
        </h3>
        
        <div className="mb-6">
          <h4 className="text-sm font-medium text-gray-700 mb-3">Tabelle</h4>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-2 px-1 text-xs font-medium text-gray-500">Platz</th>
                  <th className="text-left py-2 px-2 text-xs font-medium text-gray-500">Spieler</th>
                  <th className="text-center py-2 px-1 text-xs font-medium text-gray-500">Pkt</th>
                  <th className="text-center py-2 px-1 text-xs font-medium text-gray-500">S</th>
                  <th className="text-center py-2 px-1 text-xs font-medium text-gray-500">N</th>
                  <th className="text-center py-2 px-1 text-xs font-medium text-gray-500">Sätze</th>
                </tr>
              </thead>
              <tbody>
                {tableData.map((player, index) => (
                  <tr key={player.name} className={`border-b border-gray-100 ${
                    index === 0 ? 'bg-green-50' : index === 2 ? 'bg-yellow-50' : ''
                  }`}>
                    <td className="py-2 px-1 text-center">
                      <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold ${
                        index === 0 ? 'bg-yellow-500 text-white' : 
                        index === 1 ? 'bg-gray-400 text-white' : 
                        index === 2 ? 'bg-orange-400 text-white' : 
                        'bg-gray-200 text-gray-700'
                      }`}>
                        {index + 1}
                      </span>
                    </td>
                    <td className="py-2 px-2 font-medium text-gray-800">{player.name}</td>
                    <td className="py-2 px-1 text-center font-bold text-blue-600">{player.points}</td>
                    <td className="py-2 px-1 text-center text-green-600">{player.wins}</td>
                    <td className="py-2 px-1 text-center text-red-600">{player.losses}</td>
                    <td className="py-2 px-1 text-center text-gray-600 text-xs">
                      {player.setsWon}:{player.setsLost}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {playedMatches > 0 && (
            <div className="text-xs text-gray-500 mt-2 space-y-1">
              <p>🥇 1. Platz • 🥈 2. Platz • 🥉 3. Platz • 8 beste Spieler qualifiziert</p>
              <p>📊 Punktesystem: Sieg = 2 Pkt, Niederlage = 1 Pkt (für Teilnahme)</p>
            </div>
          )}
        </div>

        <div>
          <h4 className="text-sm font-medium text-gray-700 mb-3">Matches</h4>
          <div className="space-y-2">
            {generatePairings(players).map((pairing, index) => {
              const match = matches.find(m => 
                m.group === groupName && 
                ((m.player1 === pairing[0] && m.player2 === pairing[1]) || 
                 (m.player1 === pairing[1] && m.player2 === pairing[0]))
              );
              const isCompleted = match && match.status === 'completed';
              
              return (
                <div key={index} className={`p-3 rounded-lg border transition-all duration-200 ${
                  isCompleted ? 'bg-green-50 border-green-200' : 'bg-yellow-50 border-yellow-200'
                }`}>
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="font-medium text-gray-800 mb-1">
                        {pairing[0]} vs {pairing[1]}
                      </div>
                      
                      {isCompleted && match.set1 && (
                        <div className="text-sm text-gray-600">
                          <div className="flex flex-wrap items-center gap-2 md:gap-4">
                            <span className="flex items-center space-x-1">
                              <span className="text-xs text-gray-500">Satz 1:</span>
                              <span className="font-mono font-medium">
                                {match.set1.player1}:{match.set1.player2}
                              </span>
                            </span>
                            <span className="flex items-center space-x-1">
                              <span className="text-xs text-gray-500">Satz 2:</span>
                              <span className="font-mono font-medium">
                                {match.set2.player1}:{match.set2.player2}
                              </span>
                            </span>
                            {match.tiebreak && (
                              <span className="flex items-center space-x-1">
                                <span className="text-xs text-gray-500">TB:</span>
                                <span className="font-mono font-medium">
                                  {match.tiebreak.player1}:{match.tiebreak.player2}
                                </span>
                              </span>
                            )}
                          </div>
                          <div className="mt-1 flex items-center">
                            <Trophy className="w-3 h-3 text-yellow-500 mr-1" />
                            <span className="text-xs font-medium text-gray-700">
                              Sieger: {match.winner}
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                    
                    <span className={`px-2 md:px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap ml-3 ${
                      isCompleted 
                        ? 'bg-green-100 text-green-700' 
                        : 'bg-yellow-100 text-yellow-700'
                    }`}>
                      {isCompleted ? 'Gespielt' : 'Ausstehend'}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  };

  const KOBracket = ({ phase, title }) => {
    if (phase === 'semifinal' && getQualifiedPlayers.length < 8) {
      return (
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <h3 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
            <Trophy className="mr-2 text-blue-500" size={20} />
            {title}
          </h3>
          <div className="text-center py-12 text-gray-500">
            <Trophy className="mx-auto mb-4 opacity-30" size={48} />
            <p>Gruppenphase noch nicht abgeschlossen</p>
            <p className="text-sm mt-2">Noch {8 - getQualifiedPlayers.length} Plätze offen</p>
          </div>
        </div>
      );
    }

    return (
      <div className="bg-white rounded-2xl shadow-lg p-6">
        <h3 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
          <Trophy className="mr-2 text-blue-500" size={20} />
          {title}
        </h3>
        <div className="text-center py-12 text-gray-500">
          <Trophy className="mx-auto mb-4 opacity-30" size={48} />
          <p>K.O.-Phase wird freigeschaltet, wenn alle Gruppensieger feststehen</p>
        </div>
      </div>
    );
  };

  const AdminMatchList = () => {
    const allMatches = [...matches].sort((a, b) => {
      const phaseOrder = { 'group': 1, 'semifinal': 2, 'final': 3 };
      return phaseOrder[a.phase] - phaseOrder[b.phase] || a.id - b.id;
    });

    const getPhaseTitle = (match) => {
      if (match.phase === 'group') return `Gruppe ${match.group}`;
      if (match.phase === 'semifinal') return 'Endrunde';
      if (match.phase === 'final') return 'Finale';
      return 'Unbekannt';
    };

    return (
      <div className="bg-white rounded-2xl shadow-lg p-4 md:p-6">
        <h3 className="text-lg md:text-xl font-semibold text-gray-800 mb-6 flex items-center">
          <Settings className="mr-2 text-blue-500" size={20} />
          Alle Matches verwalten ({allMatches.length})
        </h3>
        
        {allMatches.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <Trophy className="mx-auto mb-4 opacity-30" size={48} />
            <p>Noch keine Matches vorhanden</p>
          </div>
        ) : (
          <div className="space-y-3">
            {allMatches.map(match => (
              <div key={match.id} className="border border-gray-200 rounded-lg p-3 md:p-4 hover:shadow-md transition-all duration-200">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded-full text-xs font-medium">
                        {getPhaseTitle(match)}
                      </span>
                      <span className="font-medium text-gray-800">
                        {match.player1} vs {match.player2}
                      </span>
                      {match.airtableId && connectionStatus === 'connected' && (
                        <span className="bg-green-100 text-green-700 px-2 py-1 rounded-full text-xs">
                          Airtable
                        </span>
                      )}
                    </div>
                    
                    <div className="text-sm text-gray-600">
                      <div className="flex items-center space-x-4">
                        <span className="flex items-center space-x-1">
                          <span className="text-xs text-gray-500">Satz 1:</span>
                          <span className="font-mono font-medium">
                            {match.set1.player1}:{match.set1.player2}
                          </span>
                        </span>
                        <span className="flex items-center space-x-1">
                          <span className="text-xs text-gray-500">Satz 2:</span>
                          <span className="font-mono font-medium">
                            {match.set2.player1}:{match.set2.player2}
                          </span>
                        </span>
                        {match.tiebreak && (
                          <span className="flex items-center space-x-1">
                            <span className="text-xs text-gray-500">TB:</span>
                            <span className="font-mono font-medium">
                              {match.tiebreak.player1}:{match.tiebreak.player2}
                            </span>
                          </span>
                        )}
                        <span className="flex items-center space-x-1">
                          <Trophy className="w-3 h-3 text-yellow-500" />
                          <span className="text-xs font-medium">
                            {match.winner}
                          </span>
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex space-x-2 ml-4">
                    <button
                      onClick={() => deleteMatch(match.id)}
                      disabled={isLoading}
                      className="p-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors disabled:opacity-50"
                      title="Match löschen"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  // Main render content
  const renderContent = () => {
    switch (activeTab) {
      case 'overview':
        return (
          <div>
            <div className="text-center mb-8">
              <h1 className="text-3xl md:text-4xl lg:text-5xl font-light text-gray-800 mb-6">
                Vereinsmeisterschaft 2025 TV Reicheneck
              </h1>
              <div className="flex flex-col md:flex-row items-center justify-center space-y-2 md:space-y-0 md:space-x-6 text-gray-600">
                <div className="flex items-center">
                  <MapPin className="mr-2" size={18} />
                  <span>TV Reicheneck</span>
                </div>
                <div className="flex items-center">
                  <Calendar className="mr-2" size={18} />
                  <span>Vorrunde bis 30. Juni 2025</span>
                </div>
                <div className="flex items-center">
                  <Calendar className="mr-2" size={18} />
                  <span>Endrunde bis 31. Juli 2025</span>
                </div>
              </div>
              <p className="mt-6 text-lg text-gray-600 max-w-2xl mx-auto leading-relaxed px-4">
                Willkommen zur diesjährigen Vereinsmeisterschaft! 12 Spieler treten in 3 Gruppen gegeneinander an. 
                Die Endrunde spielen 8 Spieler. Jeweils die 2 Besten aus den 3 Gruppen plus die 2 besten 3ten aus allen Gruppen.
                Gespielt wird im Best-of-3-Format mit Match-Tiebreak bei 1:1 Sätzen.
              </p>
            </div>
            
            {/* Gruppenphase */}
            <div className="mb-12">
              <h2 className="text-xl md:text-2xl font-light text-gray-800 mb-6 text-center">Gruppenphase</h2>
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
                {Object.entries(GROUPS).map(([groupName, players]) => (
                  <GroupCard key={groupName} groupName={groupName} players={players} />
                ))}
              </div>
            </div>

            {/* K.O.-Phase */}
            <div className="space-y-12">
              <h2 className="text-xl md:text-2xl font-light text-gray-800 text-center">K.O.-Phase</h2>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8">
                <KOBracket phase="semifinal" title="Endrunde" />
                <KOBracket phase="final" title="Finale" />
              </div>
            </div>
          </div>
        );

      case 'groups':
        return (
          <div>
            <h2 className="text-2xl md:text-3xl font-light text-gray-800 mb-8 text-center">Gruppenphase</h2>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
              {Object.entries(GROUPS).map(([groupName, players]) => (
                <GroupCard key={groupName} groupName={groupName} players={players} />
              ))}
            </div>
          </div>
        );

      case 'semifinal':
        return (
          <div>
            <h2 className="text-2xl md:text-3xl font-light text-gray-800 mb-8 text-center">Endrunde</h2>
            <div className="max-w-4xl mx-auto">
              <KOBracket phase="semifinal" title="Endrunde" />
              
              {getQualifiedPlayers.length >= 8 && (
                <div className="mt-8 bg-white rounded-2xl shadow-lg p-4 md:p-6">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">Qualifizierte Spieler (8)</h3>
                  <div className="space-y-4">
                    <div>
                      <h4 className="text-sm font-medium text-gray-700 mb-2">Alle Gruppensieger (3)</h4>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {getQualifiedPlayers.filter(p => p.position === 1).map((player, index) => (
                          <div key={index} className="bg-green-50 border border-green-200 rounded-lg p-3 text-center">
                            <div className="font-medium text-gray-800">{player.name}</div>
                            <div className="text-xs text-gray-600">
                              Gruppe {player.group} • 1. Platz ({player.points} Pkt)
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-gray-700 mb-2">Alle Gruppenzweiten (3)</h4>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {getQualifiedPlayers.filter(p => p.position === 2).map((player, index) => (
                          <div key={index} className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-center">
                            <div className="font-medium text-gray-800">{player.name}</div>
                            <div className="text-xs text-gray-600">
                              Gruppe {player.group} • 2. Platz ({player.points} Pkt)
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-gray-700 mb-2">2 Beste Gruppendritten</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {getQualifiedPlayers.filter(p => p.position === 3).map((player, index) => (
                          <div key={index} className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-center">
                            <div className="font-medium text-gray-800">{player.name}</div>
                            <div className="text-xs text-gray-600">
                              Gruppe {player.group} • 3. Platz ({player.points} Pkt)
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        );

      case 'final':
        return (
          <div>
            <h2 className="text-2xl md:text-3xl font-light text-gray-800 mb-8 text-center">Finale</h2>
            <div className="max-w-lg mx-auto">
              <KOBracket phase="final" title="Finale" />
            </div>
          </div>
        );

      case 'entry':
        return (
          <div>
            <h2 className="text-2xl md:text-3xl font-light text-gray-800 mb-8 text-center">Ergebnis eintragen</h2>
            
            {!isAuthenticated ? (
              <div className="max-w-md mx-auto bg-white rounded-2xl shadow-lg p-6 md:p-8">
                <div className="text-center mb-6">
                  <User className="mx-auto mb-4 text-blue-500" size={48} />
                  <h3 className="text-xl font-semibold text-gray-800 mb-2">Anmeldung erforderlich</h3>
                  <p className="text-gray-600">Bitte geben Sie die PIN ein, um Ergebnisse einzutragen.</p>
                </div>
                <div className="space-y-4">
                  <input
                    type="password"
                    placeholder="PIN eingeben"
                    value={loginPin}
                    onChange={(e) => setLoginPin(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    onKeyPress={(e) => e.key === 'Enter' && handleLogin()}
                  />
                  <button
                    onClick={handleLogin}
                    className="w-full bg-blue-500 text-white py-3 rounded-xl font-medium hover:bg-blue-600 transition-colors"
                  >
                    Anmelden
                  </button>
                  <p className="text-sm text-gray-500 text-center">
                    Standard-PIN: 2025 | Admin-PIN: 9999
                  </p>
                </div>
              </div>
            ) : (
              <div className="max-w-2xl mx-auto space-y-8">
                {/* Connection Status - always show when authenticated */}
                <ConnectionStatusCard />
                
                {/* Admin Match Liste */}
                {isAdminMode && <AdminMatchList />}
                
                {/* Match-Eingabe */}
                <div className="bg-white rounded-2xl shadow-lg p-6 md:p-8">
                  <div className="mb-6 flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-gray-800">
                      {isAdminMode ? 'Admin-Modus' : 'Standard-Modus'}
                    </h3>
                    <button
                      onClick={() => {
                        setIsAuthenticated(false);
                        setIsAdminMode(false);
                        resetForm();
                      }}
                      className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                    >
                      Abmelden
                    </button>
                  </div>
                  
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Gruppe</label>
                        <select
                          value={newMatch.group}
                          onChange={(e) => setNewMatch({...newMatch, group: e.target.value, player1: '', player2: ''})}
                          className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="A">Gruppe A</option>
                          <option value="B">Gruppe B</option>
                          <option value="C">Gruppe C</option>
                        </select>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Spielpaarung</label>
                        <select
                          value={`${newMatch.player1}-${newMatch.player2}`}
                          onChange={(e) => {
                            const [p1, p2] = e.target.value.split('-');
                            setNewMatch({...newMatch, player1: p1, player2: p2});
                          }}
                          className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="-">Wählen Sie ein Match...</option>
                          {getAvailableMatches(newMatch.group).map(([p1, p2, played], index) => (
                            <option key={index} value={`${p1}-${p2}`}>
                              {p1} vs {p2} {played && isAdminMode ? '⚠️ (bereits gespielt!)' : ''}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div className="text-center">
                        <h4 className="text-lg font-medium text-gray-800 mb-4">
                          {newMatch.player1 && newMatch.player2 ? 
                            `${newMatch.player1} vs ${newMatch.player2}` : 
                            'Wählen Sie zuerst die Spieler'
                          }
                        </h4>
                      </div>

                      <div className="grid grid-cols-2 gap-6">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2 text-center">Satz 1</label>
                          <div className="flex items-center justify-center space-x-2">
                            <input
                              type="number"
                              placeholder="0"
                              min="0"
                              max="7"
                              value={newMatch.set1Player1}
                              onChange={(e) => setNewMatch({...newMatch, set1Player1: e.target.value})}
                              className="w-16 px-2 py-2 border border-gray-300 rounded-lg text-center focus:ring-2 focus:ring-blue-500"
                            />
                            <span className="text-gray-500 font-bold">:</span>
                            <input
                              type="number"
                              placeholder="0"
                              min="0"
                              max="7"
                              value={newMatch.set1Player2}
                              onChange={(e) => setNewMatch({...newMatch, set1Player2: e.target.value})}
                              className="w-16 px-2 py-2 border border-gray-300 rounded-lg text-center focus:ring-2 focus:ring-blue-500"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2 text-center">Satz 2</label>
                          <div className="flex items-center justify-center space-x-2">
                            <input
                              type="number"
                              placeholder="0"
                              min="0"
                              max="7"
                              value={newMatch.set2Player1}
                              onChange={(e) => setNewMatch({...newMatch, set2Player1: e.target.value})}
                              className="w-16 px-2 py-2 border border-gray-300 rounded-lg text-center focus:ring-2 focus:ring-blue-500"
                            />
                            <span className="text-gray-500 font-bold">:</span>
                            <input
                              type="number"
                              placeholder="0"
                              min="0"
                              max="7"
                              value={newMatch.set2Player2}
                              onChange={(e) => setNewMatch({...newMatch, set2Player2: e.target.value})}
                              className="w-16 px-2 py-2 border border-gray-300 rounded-lg text-center focus:ring-2 focus:ring-blue-500"
                            />
                          </div>
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2 text-center">
                          Match-Tiebreak (bei 1:1 Sätzen)
                        </label>
                        <div className="flex items-center justify-center space-x-2">
                          <input
                            type="number"
                            placeholder="0"
                            min="0"
                            max="15"
                            value={newMatch.tiebreakPlayer1}
                            onChange={(e) => setNewMatch({...newMatch, tiebreakPlayer1: e.target.value})}
                            className="w-16 px-2 py-2 border border-gray-300 rounded-lg text-center focus:ring-2 focus:ring-blue-500"
                          />
                          <span className="text-gray-500 font-bold">:</span>
                          <input
                            type="number"
                            placeholder="0"
                            min="0"
                            max="15"
                            value={newMatch.tiebreakPlayer2}
                            onChange={(e) => setNewMatch({...newMatch, tiebreakPlayer2: e.target.value})}
                            className="w-16 px-2 py-2 border border-gray-300 rounded-lg text-center focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                      </div>
                    </div>

                    <ValidationAlert errors={validationErrors} />

                    <button
                      onClick={addNewMatch}
                      disabled={!newMatch.player1 || !newMatch.player2 || validationErrors.length > 0 || isLoading}
                      className={`w-full py-4 rounded-xl font-medium flex items-center justify-center space-x-2 transition-all duration-200 ${
                        (!newMatch.player1 || !newMatch.player2 || validationErrors.length > 0 || isLoading)
                          ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                          : 'bg-green-500 text-white hover:bg-green-600'
                      }`}
                    >
                      {isLoading ? (
                        <>
                          <RefreshCw size={20} className="animate-spin" />
                          <span>Speichert...</span>
                        </>
                      ) : (
                        <>
                          <Plus size={20} />
                          <span>Ergebnis speichern</span>
                        </>
                      )}
                    </button>

                    <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                      <h4 className="text-blue-800 font-medium mb-2">💡 Punktesystem:</h4>
                      <ul className="text-blue-700 text-sm space-y-1">
                        <li>• <strong>Sieg:</strong> 2 Punkte</li>
                        <li>• <strong>Niederlage:</strong> 1 Punkt (für Teilnahme)</li>
                        <li>• Bei 1:1 Sätzen ist ein Match-Tiebreak erforderlich</li>
                      </ul>
                    </div>

                    <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                      <h4 className="text-green-800 font-medium mb-2">✅ Nur Airtable Integration:</h4>
                      <ul className="text-green-700 text-sm space-y-1">
                        <li>• Alle Daten werden in Airtable gespeichert</li>
                        <li>• Keine Google Sheets mehr - saubere Lösung</li>
                        <li>• Demo-Fallback wenn Airtable nicht verfügbar</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
      <div className="container mx-auto px-4 py-6 md:py-8">
        <nav className="flex flex-wrap justify-center gap-2 mb-8 md:mb-12">
          <TabButton
            id="overview"
            label="Überblick"
            icon={Trophy}
            isActive={activeTab === 'overview'}
            onClick={() => setActiveTab('overview')}
          />
          <TabButton
            id="groups"
            label="Gruppen"
            icon={Users}
            isActive={activeTab === 'groups'}
            onClick={() => setActiveTab('groups')}
          />
          <TabButton
            id="semifinal"
            label="Endrunde"
            icon={Trophy}
            isActive={activeTab === 'semifinal'}
            onClick={() => setActiveTab('semifinal')}
          />
          <TabButton
            id="final"
            label="Finale"
            icon={Trophy}
            isActive={activeTab === 'final'}
            onClick={() => setActiveTab('final')}
          />
          <TabButton
            id="entry"  
            label="Eingabe"
            icon={Plus}
            isActive={activeTab === 'entry'}
            onClick={() => setActiveTab('entry')}
          />
        </nav>

        <main>{renderContent()}</main>
        
        <SuccessModal />
      </div>
    </div>
  );
};

export default TennisChampionship;
