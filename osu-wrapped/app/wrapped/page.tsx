import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

async function getWrappedStats() {
  const cookieStore = await cookies();
  const token = cookieStore.get('osu_access_token');

  if (!token) {
    redirect('/');
  }

  try {
    // Get full user data (includes monthly_playcounts!)
    const userResponse = await fetch('https://osu.ppy.sh/api/v2/me', {
      headers: {
        Authorization: `Bearer ${token.value}`,
      },
    });
    const userData = await userResponse.json();

    console.log('User data received:', userData.username);

    // Get best plays from 2025
    const bestPlaysResponse = await fetch(
      `https://osu.ppy.sh/api/v2/users/${userData.id}/scores/best?limit=100`,
      {
        headers: {
          Authorization: `Bearer ${token.value}`,
        },
      }
    );
    const allBestPlays = await bestPlaysResponse.json();

    // Filter for 2025 plays only
    const bestPlays2025 = allBestPlays.filter((play: any) => {
      const playDate = new Date(play.created_at);
      return playDate.getFullYear() === 2025;
    });

    console.log('Best plays from 2025:', bestPlays2025.length);

    // Calculate stats from monthly playcounts
    const monthlyStats = calculate2025Stats(userData, bestPlays2025);

    return monthlyStats;
  } catch (error) {
    console.error('Error fetching stats:', error);
    throw error;
  }
}

function calculate2025Stats(userData: any, bestPlays: any[]) {
  // Process monthly playcounts for 2025
  const monthlyPlaycounts = userData.monthly_playcounts || [];
  
  // Filter for 2025 months
  const playcounts2025 = monthlyPlaycounts.filter((month: any) => {
    const date = new Date(month.start_date);
    return date.getFullYear() === 2025;
  });

  console.log('Monthly playcounts for 2025:', playcounts2025);

  // Calculate total plays in 2025
  const totalPlays2025 = playcounts2025.reduce(
    (sum: number, month: any) => sum + month.count,
    0
  );

  // Find most active month
  let mostActiveMonth = null;
  if (playcounts2025.length > 0) {
    const sorted = [...playcounts2025].sort((a: any, b: any) => b.count - a.count);
    const topMonth = sorted[0];
    const monthName = new Date(topMonth.start_date).toLocaleString('default', { month: 'long' });
    mostActiveMonth = {
      month: monthName,
      plays: topMonth.count,
    };
  }

  // Get top play from 2025 (highest PP)
  const topPlay = bestPlays.length > 0 ? bestPlays[0] : null;

  // Count plays per beatmap from best plays
  const beatmapCounts: { [key: string]: { count: number; beatmap: any; beatmapset: any } } = {};
  bestPlays.forEach((play: any) => {
    const mapId = play.beatmap?.id;
    if (mapId) {
      if (!beatmapCounts[mapId]) {
        beatmapCounts[mapId] = { count: 0, beatmap: play.beatmap, beatmapset: play.beatmapset };
      }
      beatmapCounts[mapId].count++;
    }
  });

  // Find most played map from best plays
  const mostPlayedFromBest = Object.values(beatmapCounts).sort((a, b) => b.count - a.count)[0];

  // Calculate average accuracy from best plays
  const avgAccuracy = bestPlays.length > 0
    ? bestPlays.reduce((sum: number, play: any) => sum + (play.accuracy || 0), 0) / bestPlays.length
    : 0;

  // Get background image from top play
  const backgroundImage = topPlay?.beatmapset?.covers?.cover || null;

  return {
    total_plays: totalPlays2025,
    most_active_month: mostActiveMonth,
    top_play: topPlay
      ? {
          title: topPlay.beatmapset?.title || topPlay.beatmap?.beatmapset?.title || 'Unknown',
          artist: topPlay.beatmapset?.artist || topPlay.beatmap?.beatmapset?.artist || 'Unknown',
          difficulty: topPlay.beatmap?.version || 'Unknown',
          pp: topPlay.pp,
          accuracy: (topPlay.accuracy * 100).toFixed(2),
          rank: topPlay.rank,
          date: new Date(topPlay.created_at).toLocaleDateString('default', { 
            month: 'long', 
            day: 'numeric' 
          }),
        }
      : null,
    most_improved_map: mostPlayedFromBest
      ? {
          title: mostPlayedFromBest.beatmapset?.title || mostPlayedFromBest.beatmap?.beatmapset?.title || 'Unknown',
          artist: mostPlayedFromBest.beatmapset?.artist || mostPlayedFromBest.beatmap?.beatmapset?.artist || 'Unknown',
          difficulty: mostPlayedFromBest.beatmap?.version || 'Unknown',
          attempts: mostPlayedFromBest.count,
        }
      : null,
    best_plays_count: bestPlays.length,
    avg_accuracy: avgAccuracy,
    current_rank: userData.statistics?.global_rank,
    current_pp: userData.statistics?.pp,
    background_image: backgroundImage,
  };
}

export default async function Wrapped() {
  const stats = await getWrappedStats();

  return (
    <div 
      className="min-h-screen p-8 relative"
      style={{
        backgroundImage: stats.background_image 
          ? `linear-gradient(rgba(0, 0, 0, 0.7), rgba(0, 0, 0, 0.8)), url(${stats.background_image})`
          : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundAttachment: 'fixed',
      }}
    >
      <div className="max-w-4xl mx-auto space-y-8">
        
        {/* Header */}
        <div className="text-center text-white mb-12">
          <h1 className="text-7xl font-bold mb-4 drop-shadow-lg">Your 2025 osu! Wrapped</h1>
          <p className="text-3xl drop-shadow-md">Your year in rhythm gaming</p>
        </div>

        {/* Total Plays */}
        <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-2xl p-12 text-center transform hover:scale-105 transition-transform">
          <p className="text-gray-700 text-2xl mb-2 font-medium">You played</p>
          <p className="text-8xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
            {stats.total_plays.toLocaleString()}
          </p>
          <p className="text-gray-700 text-2xl mt-2 font-medium">times in 2025</p>
        </div>

        {/* Most Active Month */}
        {stats.most_active_month && (
          <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-2xl p-12 text-center transform hover:scale-105 transition-transform">
            <h2 className="text-4xl font-bold mb-6 text-gray-800">Your Most Active Month</h2>
            <p className="text-6xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
              {stats.most_active_month.month}
            </p>
            <p className="text-3xl text-gray-700 mt-4 font-semibold">
              {stats.most_active_month.plays.toLocaleString()} plays
            </p>
            
          </div>
        )}

        {/* Top Play */}
        {stats.top_play && (
          <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-2xl p-12 transform hover:scale-105 transition-transform">
            <h2 className="text-4xl font-bold mb-8 text-center text-gray-800">Your Best Play of 2025</h2>
            <div className="text-center">
              <p className="text-5xl font-bold text-blue-600 mb-3">{stats.top_play.title}</p>
              <p className="text-3xl text-gray-700 mt-2">{stats.top_play.artist}</p>
              <p className="text-2xl text-gray-600 mt-2 font-medium">[{stats.top_play.difficulty}]</p>
              <p className="text-lg text-gray-500 mt-3">Set on {stats.top_play.date}</p>
              <div className="mt-8 flex justify-center gap-12">
                <div className="bg-purple-50 p-6 rounded-xl">
                  <p className="text-gray-700 text-lg font-medium">PP</p>
                  <p className="text-5xl font-bold text-purple-600">{Math.round(stats.top_play.pp)}</p>
                </div>
                <div className="bg-pink-50 p-6 rounded-xl">
                  <p className="text-gray-700 text-lg font-medium">Accuracy</p>
                  <p className="text-5xl font-bold text-pink-600">{stats.top_play.accuracy}%</p>
                </div>
                <div className="bg-blue-50 p-6 rounded-xl">
                  <p className="text-gray-700 text-lg font-medium">Rank</p>
                  <p className="text-5xl font-bold text-blue-600">{stats.top_play.rank}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Most Improved Map */}
        {stats.most_improved_map && (
          <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-2xl p-12 transform hover:scale-105 transition-transform">
            <h2 className="text-4xl font-bold mb-6 text-center text-gray-800">Map You Conquered</h2>
            <div className="text-center">
              <p className="text-gray-700 mb-3 text-xl">You set multiple top scores on</p>
              <p className="text-5xl font-bold text-pink-600 mb-3">{stats.most_improved_map.title}</p>
              <p className="text-3xl text-gray-700 mt-2">{stats.most_improved_map.artist}</p>
              <p className="text-2xl text-gray-600 mt-2 font-medium">[{stats.most_improved_map.difficulty}]</p>
              <p className="text-5xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent mt-8">
                {stats.most_improved_map.attempts} top scores
              </p>
              <p className="text-xl text-gray-600 mt-3">Dedication pays off! </p>
            </div>
          </div>
        )}

        {/* Stats Summary */}
        <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-2xl p-12 transform hover:scale-105 transition-transform">
          <h2 className="text-4xl font-bold mb-8 text-center text-gray-800">2025 Summary</h2>
          <div className="grid grid-cols-2 gap-6">
            <div className="text-center p-6 bg-gradient-to-br from-purple-100 to-purple-50 rounded-xl border-2 border-purple-200">
              <p className="text-gray-700 text-lg font-medium">New Top Scores</p>
              <p className="text-5xl font-bold text-purple-600 mt-2">{stats.best_plays_count}</p>
            </div>
            <div className="text-center p-6 bg-gradient-to-br from-pink-100 to-pink-50 rounded-xl border-2 border-pink-200">
              <p className="text-gray-700 text-lg font-medium">Avg Accuracy</p>
              <p className="text-5xl font-bold text-pink-600 mt-2">{(stats.avg_accuracy * 100).toFixed(2)}%</p>
            </div>
            <div className="text-center p-6 bg-gradient-to-br from-blue-100 to-blue-50 rounded-xl border-2 border-blue-200">
              <p className="text-gray-700 text-lg font-medium">Current Rank</p>
              <p className="text-5xl font-bold text-blue-600 mt-2">#{stats.current_rank?.toLocaleString()}</p>
            </div>
            <div className="text-center p-6 bg-gradient-to-br from-indigo-100 to-indigo-50 rounded-xl border-2 border-indigo-200">
              <p className="text-gray-700 text-lg font-medium">Total PP</p>
              <p className="text-5xl font-bold text-indigo-600 mt-2">{Math.round(stats.current_pp || 0).toLocaleString()}</p>
            </div>
          </div>
        </div>

        {/* Back to Dashboard */}
        <div className="text-center pb-8">
          <a href="/dashboard" className="text-white text-2xl hover:underline drop-shadow-lg font-medium">
            ← Back to Dashboard
          </a>
        </div>
      </div>
    </div>
  );
}