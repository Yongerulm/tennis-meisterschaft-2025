import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Users, Trophy, Plus, Calendar, MapPin, User, AlertTriangle, Settings, Trash2, RefreshCw, Wifi, WifiOff, Cloud, CloudOff, Database } from 'lucide-react';
import googleSheetsService, { formatMatchForAPI, useGoogleSheets } from '../services/googleSheetsService';

const TennisChampionship = () => {
  // Google Sheets Integration
  const { service: sheetsService, isOnline, syncStatus, refreshSyncStatus } = useGoogleSheets();

  // State Management
  const [activeTab, setActiveTab] = useState('overview');
  const [loginPin, setLoginPin] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isAdminMode, setIsAdminMode] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [matches, setMatches] = useState([]);
  const [groups, setGroups] = useState({});
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [validationErrors, setValidationErrors] = useState([]);
  const [nextMatchId, setNextMatchId] = useState(1000);
  const [connectionStatus, setConnectionStatus] = useState('checking');
  const [lastSync, setLastSync] = useState(null);
  
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

  // Demo Data (fallback)
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
      status: 'completed'
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
      status: 'completed'
    }
  ];

  // ===== GOOGLE SHEETS INTEGRATION =====
  
  // Load data from Google Sheets on component mount
  useEffect(() => {
    loadDataFromSheets();
    checkConnectionHealth();
  }, []);

  // Periodic sync status refresh
  useEffect(() => {
    const interval = setInterval(() => {
      refreshSyncStatus();
      setLastSync(new Date().toLocaleTimeString());
    }, 30000); // Every 30 seconds

    return () => clearInterval(interval);
  }, [refreshSyncStatus]);

  const loadDataFromSheets = async () => {
    setIsLoading(true);
    setConnectionStatus('connecting');
    
    try {
      console.log('Loading data from Google Sheets...');
      
      const [matchesData, groupsData] = await Promise.all([
        sheetsService.getMatches(),
        sheetsService.getGroups()
      ]);
      
      console.log('Loaded from Google Sheets:', { 
        matches: matchesData?.length, 
        groups: Object.keys(groupsData || {}).length 
      });
      
      setMatches(matchesData || demoMatches);
      setGroups(groupsData || GROUPS);
      setConnectionStatus('connected');
      setLastSync(new Date().toLocaleTimeString());
      
      // Set next match ID based on existing matches
      if (matchesData && matchesData.length > 0) {
        const maxId = Math.max(...matchesData.map(m => parseInt(m.id) || 0));
        setNextMatchId(maxId + 1);
      }
      
    } catch (error) {
      console.error('Failed to load data from Google Sheets:', error);
      setConnectionStatus('error');
      
      // Fallback to demo data
      setMatches(demoMatches);
      setGroups(GROUPS);
      setNextMatchId(3);
      
      setSuccessMessage(
        `⚠️ Verbindung zu Google Sheets fehlgeschlagen\\n\\n` +
        `Fehler: ${error.message}\\n\\n` +
        `📝 Demo-Daten werden verwendet\\n` +
        `🔄 Versuche später erneut zu verbinden`
      );
      setShowSuccessModal(true);
    } finally {
      setIsLoading(false);
    }
  };

  const checkConnectionHealth = async () => {
    try {
      const health = await sheetsService.healthCheck();
      setConnectionStatus(health.status === 'healthy' ? 'connected' : 'error');
    } catch (error) {
      setConnectionStatus('error');
    }
  };

  const initializeGoogleSheets = async () => {
    setIsLoading(true);
    try {
      const result = await sheetsService.initializeSheets();
      console.log('Google Sheets initialized:', result);
      
      setSuccessMessage(
        `✅ Google Sheets erfolgreich initialisiert!\\n\\n` +
        `📊 Spreadsheet ID: ${result.spreadsheetId}\\n` +
        `📋 Erstelle Tabs: ${result.sheets.join(', ')}\\n\\n` +
        `🔄 Lade Daten neu...`
      );
      setShowSuccessModal(true);
      
      // Reload data after initialization
      await loadDataFromSheets();
    } catch (error) {
      alert(`Fehler bei der Initialisierung: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  // ===== TENNIS LOGIC (unchanged) =====
  
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
    const groupPlayers = groups[groupName] || GROUPS[groupName] || [];
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
  }, [matches, groups]);

  // Get Qualified Players for KO Phase
  const getQualifiedPlayers = useMemo(() => {
    const qualified = [];
    const groupFirsts = [];
    const groupSeconds = [];
    const groupThirds = [];
    
    Object.keys(groups).forEach(groupName => {
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
  }, [calculateGroupTable, groups]);

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
    const groupPlayers = groups[group] || GROUPS[group] || [];
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
  }, [matches, groups, isAdminMode]);

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

  // ===== ENHANCED ADD MATCH WITH GOOGLE SHEETS =====
  const addNewMatch = async () => {
    if (!newMatch.player1 || !newMatch.player2) {
      alert('Bitte wählen Sie beide Spieler aus.');
      return;
    }

    setIsLoading(true);

    try {
      const result = determineWinner(newMatch);
      
      if (result.errors.length > 0) {
        alert('Validierungsfehler:\\n\\n' + result.errors.join('\\n'));
        return;
      }

      if (!result.winner) {
        alert('Bitte geben Sie gültige Ergebnisse ein.');
        return;
      }

      // Format for API
      const matchData = formatMatchForAPI({
        ...newMatch,
        winner: result.winner
      });

      console.log('Saving match to Google Sheets:', matchData);

      // Add to Google Sheets
      const apiResult = await sheetsService.addMatch(matchData);
      console.log('Google Sheets API result:', apiResult);
      
      // Update local state
      const newMatchComplete = {
        id: apiResult.id,
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

      setMatches(currentMatches => [...currentMatches, newMatchComplete]);
      setNextMatchId(nextMatchId + 1);
      
      const phaseText = newMatchComplete.phase === 'group' ? `Gruppe ${newMatchComplete.group}` : 
                       newMatchComplete.phase === 'semifinal' ? 'Endrunde' : 'Finale';
      
      setSuccessMessage(
        `🎾 Match erfolgreich gespeichert!\\n\\n` +
        `${phaseText}\\n` +
        `${newMatchComplete.player1} vs ${newMatchComplete.player2}\\n` +
        `Satz 1: ${newMatchComplete.set1.player1}:${newMatchComplete.set1.player2}\\n` +
        `Satz 2: ${newMatchComplete.set2.player1}:${newMatchComplete.set2.player2}` +
        (newMatchComplete.tiebreak ? `\\nTiebreak: ${newMatchComplete.tiebreak.player1}:${newMatchComplete.tiebreak.player2}` : '') +
        `\\n\\n🏆 Sieger: ${newMatchComplete.winner}\\n\\n` +
        `✅ In Google Sheets gespeichert ${isOnline ? '(Online)' : '(Offline - wird synchronisiert)'}`
      );
      setShowSuccessModal(true);
      resetForm();
      
    } catch (error) {
      console.error('Error saving to Google Sheets:', error);
      alert(`Fehler beim Speichern: ${error.message}${!isOnline ? '\\n\\nOffline-Modus: Daten werden synchronisiert wenn online.' : ''}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Delete match (admin only) with Google Sheets
  const deleteMatch = async (matchId) => {
    if (!isAdminMode) {
      alert('Nur im Admin-Modus verfügbar!');
      return;
    }

    const confirmed = window.confirm('Möchten Sie dieses Match wirklich löschen?');
    if (!confirmed) return;

    setIsLoading(true);
    
    try {
      // Delete from Google Sheets
      await sheetsService.deleteMatch(matchId);
      
      // Update local state
      setMatches(currentMatches => {
        const updatedMatches = currentMatches.filter(m => m.id !== matchId);
        console.log('Match gelöscht, neue Liste:', updatedMatches);
        return updatedMatches;
      });
      
      setSuccessMessage('✅ Match erfolgreich gelöscht und aus Google Sheets entfernt!');
      setShowSuccessModal(true);
    } catch (error) {
      console.error('Fehler beim Löschen:', error);
      alert(`Fehler beim Löschen: ${error.message}`);
    } finally {
      setTimeout(() => setIsLoading(false), 500);
    }
  };

  // ===== COMPONENTS (enhanced with connection status) =====
  
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

  const ConnectionStatus = () => {
    const getStatusIcon = () => {
      if (!isOnline) return <WifiOff className="w-4 h-4" />;
      if (connectionStatus === 'connected') return <Cloud className="w-4 h-4" />;
      if (connectionStatus === 'connecting') return <RefreshCw className="w-4 h-4 animate-spin" />;
      if (connectionStatus === 'error') return <CloudOff className="w-4 h-4" />;
      return <Database className="w-4 h-4" />;
    };

    const getStatusText = () => {
      if (!isOnline) return 'Offline';
      if (connectionStatus === 'connected') return 'Google Sheets verbunden';
      if (connectionStatus === 'connecting') return 'Verbinde...';
      if (connectionStatus === 'error') return 'Verbindungsfehler';
      return 'Unbekannt';
    };

    const getStatusColor = () => {
      if (!isOnline) return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      if (connectionStatus === 'connected') return 'bg-green-100 text-green-700 border-green-200';
      if (connectionStatus === 'connecting') return 'bg-blue-100 text-blue-700 border-blue-200';
      if (connectionStatus === 'error') return 'bg-red-100 text-red-700 border-red-200';
      return 'bg-gray-100 text-gray-700 border-gray-200';
    };

    return (
      <div className="flex justify-center items-center gap-4 mb-6">
        <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor()}`}>
          {getStatusIcon()}
          <span>{getStatusText()}</span>
        </div>
        
        {syncStatus && syncStatus.queuedRequests > 0 && (
          <div className="px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700 border border-blue-200">
            📤 {syncStatus.queuedRequests} ausstehend
          </div>
        )}
        
        <button
          onClick={loadDataFromSheets}
          disabled={isLoading}
          className="flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700 border border-gray-200 hover:bg-gray-200 disabled:opacity-50"
        >
          <RefreshCw className={`w-3 h-3 ${isLoading ? 'animate-spin' : ''}`} />
          Aktualisieren
        </button>
        
        {lastSync && (
          <div className="text-xs text-gray-500">
            Letzter Sync: {lastSync}
          </div>
        )}
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

  // ... (GroupCard, KOBracket, AdminMatchList components remain the same but use the 'groups' state instead of GROUPS constant)

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
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg md:text-xl font-semibold text-gray-800 flex items-center">
            <Settings className="mr-2 text-blue-500" size={20} />
            Alle Matches verwalten ({allMatches.length})
          </h3>
          
          {isAdminMode && (
            <div className="flex gap-2">
              <button
                onClick={initializeGoogleSheets}
                disabled={isLoading}
                className="px-3 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors disabled:opacity-50 text-sm"
              >
                <Database className="inline w-4 h-4 mr-1" />
                Sheets initialisieren
              </button>
            </div>
          )}
        </div>
        
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
                      {match.timestamp && (
                        <span className="text-xs text-gray-500">
                          {new Date(match.timestamp).toLocaleString()}
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

  // Main render content (continues as before, but with ConnectionStatus component added)
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
                {Object.entries(groups).map(([groupName, players]) => (
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
              {Object.entries(groups).map(([groupName, players]) => (
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
                          {Object.keys(groups).map(groupName => (
                            <option key={groupName} value={groupName}>Gruppe {groupName}</option>
                          ))}
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
                          <span>Speichert in Google Sheets...</span>
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
                      <h4 className="text-green-800 font-medium mb-2">☁️ Google Sheets Integration:</h4>
                      <ul className="text-green-700 text-sm space-y-1">
                        <li>• Daten werden automatisch in Google Sheets gespeichert</li>
                        <li>• Offline-Support mit automatischer Synchronisation</li>
                        <li>• Zugriff auf Daten von allen Geräten</li>
                        <li>• {isOnline ? '🟢 Online - Sofortige Synchronisation' : '🟡 Offline - Wird später synchronisiert'}</li>
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

        <ConnectionStatus />

        <main>{renderContent()}</main>
        
        <SuccessModal />
      </div>
    </div>
  );
};

export default TennisChampionship;
