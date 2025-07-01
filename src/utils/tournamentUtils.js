export const generatePairings = (players) => {
  const pairings = [];
  for (let i = 0; i < players.length; i++) {
    for (let j = i + 1; j < players.length; j++) {
      pairings.push([players[i], players[j]]);
    }
  }
  return pairings;
};

export const calculateGroupTable = (groupName, matches, groups) => {
  const groupPlayers = groups[groupName];
  const groupMatches = matches.filter(
    (m) => m.group === groupName && m.status === 'completed'
  );

  const playerStats = {};
  groupPlayers.forEach((player) => {
    playerStats[player] = {
      name: player,
      matches: 0,
      wins: 0,
      losses: 0,
      setsWon: 0,
      setsLost: 0,
      gamesWon: 0,
      gamesLost: 0,
      setDifference: 0,
      gameDifference: 0,
      setPercentage: 0,
      gamePercentage: 0,
    };
  });

  groupMatches.forEach((match) => {
    const p1 = match.player1;
    const p2 = match.player2;

    if (playerStats[p1] && playerStats[p2]) {
      playerStats[p1].matches++;
      playerStats[p2].matches++;

      let p1Sets = 0,
        p2Sets = 0;

      if (match.set1.player1 > match.set1.player2) p1Sets++;
      else p2Sets++;
      playerStats[p1].gamesWon += match.set1.player1;
      playerStats[p1].gamesLost += match.set1.player2;
      playerStats[p2].gamesWon += match.set1.player2;
      playerStats[p2].gamesLost += match.set1.player1;

      if (match.set2.player1 > match.set2.player2) p1Sets++;
      else p2Sets++;
      playerStats[p1].gamesWon += match.set2.player1;
      playerStats[p1].gamesLost += match.set2.player2;
      playerStats[p2].gamesWon += match.set2.player2;
      playerStats[p2].gamesLost += match.set2.player1;

      if (match.tiebreak) {
        if (match.tiebreak.player1 > match.tiebreak.player2) p1Sets++;
        else p2Sets++;
      }

      playerStats[p1].setsWon += p1Sets;
      playerStats[p1].setsLost += p2Sets;
      playerStats[p2].setsWon += p2Sets;
      playerStats[p2].setsLost += p1Sets;

      if (match.winner === p1) {
        playerStats[p1].wins++;
        playerStats[p2].losses++;
      } else if (match.winner === p2) {
        playerStats[p2].wins++;
        playerStats[p1].losses++;
      }
    }
  });

  Object.values(playerStats).forEach((player) => {
    const totalSets = player.setsWon + player.setsLost;
    const totalGames = player.gamesWon + player.gamesLost;
    player.setDifference = player.setsWon - player.setsLost;
    player.gameDifference = player.gamesWon - player.gamesLost;
    player.setPercentage = totalSets > 0 ? (player.setsWon / totalSets) * 100 : 0;
    player.gamePercentage = totalGames > 0 ? (player.gamesWon / totalGames) * 100 : 0;
  });

  return Object.values(playerStats).sort((a, b) => {
    if (b.wins !== a.wins) return b.wins - a.wins;
    if (b.setDifference !== a.setDifference) return b.setDifference - a.setDifference;
    if (Math.abs(b.setPercentage - a.setPercentage) > 0.1) {
      return b.setPercentage - a.setPercentage;
    }
    if (b.gameDifference !== a.gameDifference) return b.gameDifference - a.gameDifference;
    return b.gamePercentage - a.gamePercentage;
  });
};

export const getQualifiedPlayers = (matches, groups) => {
  const qualified = [];
  const groupFirsts = [];
  const groupSeconds = [];
  const groupThirds = [];

  ['A', 'B', 'C'].forEach((groupName) => {
    const table = calculateGroupTable(groupName, matches, groups);
    if (table.length >= 1) {
      groupFirsts.push({
        name: table[0].name,
        group: groupName,
        position: 1,
        wins: table[0].wins,
        setDifference: table[0].setDifference,
        setPercentage: table[0].setPercentage,
        setsWon: table[0].setsWon,
        setsLost: table[0].setsLost,
      });
    }
    if (table.length >= 2) {
      groupSeconds.push({
        name: table[1].name,
        group: groupName,
        position: 2,
        wins: table[1].wins,
        setDifference: table[1].setDifference,
        setPercentage: table[1].setPercentage,
        setsWon: table[1].setsWon,
        setsLost: table[1].setsLost,
      });
    }
    if (table.length >= 3) {
      groupThirds.push({
        name: table[2].name,
        group: groupName,
        position: 3,
        wins: table[2].wins,
        setPercentage: table[2].setPercentage,
        gamePercentage: table[2].gamePercentage,
        setDifference: table[2].setDifference,
        setsWon: table[2].setsWon,
        setsLost: table[2].setsLost,
      });
    }
  });

  groupFirsts.sort((a, b) => {
    if (b.wins !== a.wins) return b.wins - a.wins;
    if (b.setDifference !== a.setDifference) return b.setDifference - a.setDifference;
    return b.setPercentage - a.setPercentage;
  });

  groupSeconds.sort((a, b) => {
    if (b.wins !== a.wins) return b.wins - a.wins;
    if (b.setDifference !== a.setDifference) return b.setDifference - a.setDifference;
    return b.setPercentage - a.setPercentage;
  });

  groupThirds.sort((a, b) => {
    if (b.wins !== a.wins) return b.wins - a.wins;
    if (b.setDifference !== a.setDifference) return b.setDifference - a.setDifference;
    if (Math.abs(b.setPercentage - a.setPercentage) > 0.1) {
      return b.setPercentage - a.setPercentage;
    }
    return b.gamePercentage - a.gamePercentage;
  });

  qualified.push(...groupFirsts);
  qualified.push(...groupSeconds);
  qualified.push(...groupThirds.slice(0, 2));

  return qualified;
};

export const getKOGroups = (qualifiedPlayers) => {
  if (qualifiedPlayers.length < 8) {
    return { A: [], B: [] };
  }

  const firsts = qualifiedPlayers.filter((p) => p.position === 1);
  const seconds = qualifiedPlayers.filter((p) => p.position === 2);
  const thirds = qualifiedPlayers.filter((p) => p.position === 3);

  const koGroupA = [];
  const koGroupB = [];

  if (firsts[0]) koGroupA.push(firsts[0]);
  if (firsts[1]) koGroupB.push(firsts[1]);
  if (firsts[2]) koGroupA.push(firsts[2]);

  if (seconds[0]) koGroupB.push(seconds[0]);
  if (seconds[1]) koGroupA.push(seconds[1]);
  if (seconds[2]) koGroupB.push(seconds[2]);

  if (thirds[0]) koGroupA.push(thirds[0]);
  if (thirds[1]) koGroupB.push(thirds[1]);

  return { A: koGroupA, B: koGroupB };
};

export const calculateKOGroupTable = (groupName, groupPlayers, matches) => {
  if (!groupPlayers || groupPlayers.length === 0) return [];

  const koMatches = matches.filter(
    (m) => m.phase === 'semifinal' && m.koGroup === groupName && m.status === 'completed'
  );

  const playerStats = {};
  groupPlayers.forEach((player) => {
    const name = player.name || player;
    playerStats[name] = {
      name,
      originalGroup: player.group,
      originalPosition: player.position,
      matches: 0,
      wins: 0,
      losses: 0,
      setsWon: 0,
      setsLost: 0,
      gamesWon: 0,
      gamesLost: 0,
      setDifference: 0,
      gameDifference: 0,
      setPercentage: 0,
      gamePercentage: 0,
    };
  });

  koMatches.forEach((match) => {
    const p1 = match.player1;
    const p2 = match.player2;

    if (playerStats[p1] && playerStats[p2]) {
      playerStats[p1].matches++;
      playerStats[p2].matches++;

      let p1Sets = 0;
      let p2Sets = 0;

      if (match.set1.player1 > match.set1.player2) p1Sets++;
      else p2Sets++;
      playerStats[p1].gamesWon += match.set1.player1;
      playerStats[p1].gamesLost += match.set1.player2;
      playerStats[p2].gamesWon += match.set1.player2;
      playerStats[p2].gamesLost += match.set1.player1;

      if (match.set2.player1 > match.set2.player2) p1Sets++;
      else p2Sets++;
      playerStats[p1].gamesWon += match.set2.player1;
      playerStats[p1].gamesLost += match.set2.player2;
      playerStats[p2].gamesWon += match.set2.player2;
      playerStats[p2].gamesLost += match.set2.player1;

      if (match.tiebreak) {
        if (match.tiebreak.player1 > match.tiebreak.player2) p1Sets++;
        else p2Sets++;
      }

      playerStats[p1].setsWon += p1Sets;
      playerStats[p1].setsLost += p2Sets;
      playerStats[p2].setsWon += p2Sets;
      playerStats[p2].setsLost += p1Sets;

      if (match.winner === p1) {
        playerStats[p1].wins++;
        playerStats[p2].losses++;
      } else if (match.winner === p2) {
        playerStats[p2].wins++;
        playerStats[p1].losses++;
      }
    }
  });

  Object.values(playerStats).forEach((player) => {
    const totalSets = player.setsWon + player.setsLost;
    const totalGames = player.gamesWon + player.gamesLost;
    player.setDifference = player.setsWon - player.setsLost;
    player.gameDifference = player.gamesWon - player.gamesLost;
    player.setPercentage = totalSets > 0 ? (player.setsWon / totalSets) * 100 : 0;
    player.gamePercentage = totalGames > 0 ? (player.gamesWon / totalGames) * 100 : 0;
  });

  return Object.values(playerStats).sort((a, b) => {
    if (b.wins !== a.wins) return b.wins - a.wins;
    if (b.setDifference !== a.setDifference) return b.setDifference - a.setDifference;
    if (Math.abs(b.setPercentage - a.setPercentage) > 0.1) {
      return b.setPercentage - a.setPercentage;
    }
    if (b.gameDifference !== a.gameDifference) return b.gameDifference - a.gameDifference;
    return b.gamePercentage - a.gamePercentage;
  });
};
