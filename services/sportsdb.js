const SPORTSDB_API_KEY = process.env.EXPO_PUBLIC_SPORTSDB_API_KEY || '3';
const BASE_URL = 'https://www.thesportsdb.com/api/v1/json';

export const fetchNFLSchedule = async (season = '2024') => {
  try {
    const response = await fetch(
      `${BASE_URL}/${SPORTSDB_API_KEY}/eventsseason.php?id=4391&s=${season}`
    );
    const data = await response.json();
    return data.events || [];
  } catch (error) {
    console.error('Error fetching NFL schedule:', error);
    throw error;
  }
};

export const fetchNFLWeekSchedule = async (week, season = '2024') => {
  try {
    const allGames = await fetchNFLSchedule(season);
    const weekGames = allGames.filter(game => {
      const gameWeek = parseInt(game.intRound);
      return gameWeek === parseInt(week);
    });
    return weekGames.map(game => ({
      id: game.idEvent,
      gameId: game.idEvent,
      homeTeam: game.strHomeTeam,
      awayTeam: game.strAwayTeam,
      kickoff: game.dateEvent + ' ' + game.strTime,
      timestamp: new Date(game.dateEvent + ' ' + game.strTime).getTime(),
      homeScore: game.intHomeScore,
      awayScore: game.intAwayScore,
      winner: game.intHomeScore && game.intAwayScore 
        ? (parseInt(game.intHomeScore) > parseInt(game.intAwayScore) ? 'home' : 'away')
        : null,
    }));
  } catch (error) {
    console.error('Error fetching week schedule:', error);
    throw error;
  }
};

export const getCurrentNFLWeek = () => {
  const seasonStart = new Date('2024-09-05');
  const now = new Date();
  const diffTime = Math.abs(now - seasonStart);
  const diffWeeks = Math.ceil(diffTime / (1000 * 60 * 60 * 24 * 7));
  return Math.min(Math.max(diffWeeks, 1), 18);
};
