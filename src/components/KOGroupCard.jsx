import React, { useMemo } from 'react';
import { Trophy } from 'lucide-react';
import { calculateKOGroupTable, generatePairings } from '../utils/tournamentUtils';

const KOGroupCard = ({ groupName, players, matches }) => {
  const tableData = useMemo(
    () => calculateKOGroupTable(groupName, players, matches),
    [groupName, players, matches]
  );

  const totalMatches = generatePairings(players.map((p) => p.name)).length;
  const playedMatches = matches.filter(
    (m) =>
      m.phase === 'semifinal' &&
      m.koGroup === groupName &&
      m.status === 'completed'
  ).length;

  return (
    <div className="bg-white rounded-2xl shadow-xl border-2 border-gray-100 p-4 md:p-6 hover:shadow-2xl hover:border-blue-200 transition-all duration-300">
      <h3 className="text-lg md:text-xl font-semibold text-gray-800 mb-4 flex items-center justify-between">
        <div className="flex items-center">
          <Trophy className="mr-2 text-blue-500" size={20} />
          K.O. Gruppe {groupName}
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
                <th className="text-center py-2 px-1 text-xs font-medium text-gray-500">Vorr.</th>
                <th className="text-center py-2 px-1 text-xs font-medium text-gray-500">S</th>
                <th className="text-center py-2 px-1 text-xs font-medium text-gray-500">N</th>
                <th className="text-center py-2 px-1 text-xs font-medium text-gray-500">Sätze</th>
                <th className="text-center py-2 px-1 text-xs font-medium text-gray-500">Games</th>
              </tr>
            </thead>
            <tbody>
              {tableData.map((player, index) => (
                <tr
                  key={player.name}
                  className={`border-b border-gray-100 ${
                    index === 0 ? 'bg-green-50' : index === 1 ? 'bg-blue-50' : ''
                  }`}
                >
                  <td className="py-2 px-1 text-center">
                    <span
                      className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold ${
                        index === 0
                          ? 'bg-yellow-500 text-white'
                          : index === 1
                          ? 'bg-gray-400 text-white'
                          : 'bg-gray-200 text-gray-700'
                      }`}
                    >
                      {index + 1}
                    </span>
                  </td>
                  <td className="py-2 px-2">
                    <div>
                      <span className="font-medium text-gray-800">{player.name}</span>
                      <span className="text-xs text-gray-500 ml-1">
                        ({player.originalGroup}
                        {player.originalPosition})
                      </span>
                    </div>
                  </td>
                  <td className="py-2 px-1 text-center text-xs text-gray-600">Gr.{player.originalGroup}</td>
                  <td className="py-2 px-1 text-center font-bold text-green-600">{player.wins}</td>
                  <td className="py-2 px-1 text-center text-red-600">{player.losses}</td>
                  <td className="py-2 px-1 text-center text-gray-600 text-xs">
                    {player.setsWon}:{player.setsLost}
                  </td>
                  <td className="py-2 px-1 text-center text-gray-600 text-xs">
                    {player.gamesWon}:{player.gamesLost}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {playedMatches > 0 && (
          <div className="text-xs text-gray-500 mt-2">
            <p>🥇 Platz 1 & 2 qualifizieren sich fürs Finale</p>
          </div>
        )}
      </div>

      <div>
        <h4 className="text-sm font-medium text-gray-700 mb-3">Matches</h4>
        <div className="space-y-2">
          {generatePairings(players.map((p) => p.name)).map((pairing, index) => {
            const match = matches.find(
              (m) =>
                m.phase === 'semifinal' &&
                m.koGroup === groupName &&
                ((m.player1 === pairing[0] && m.player2 === pairing[1]) ||
                  (m.player1 === pairing[1] && m.player2 === pairing[0]))
            );
            const isCompleted = match && match.status === 'completed';

            return (
              <div
                key={index}
                className={`p-3 rounded-lg border transition-all duration-200 ${
                  isCompleted ? 'bg-green-50 border-green-200' : 'bg-yellow-50 border-yellow-200'
                }`}
              >
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
                          <span className="text-xs font-medium text-gray-700">Sieger: {match.winner}</span>
                        </div>
                      </div>
                    )}
                  </div>

                  <span
                    className={`px-2 md:px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap ml-3 ${
                      isCompleted ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                    }`}
                  >
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

export default KOGroupCard;
