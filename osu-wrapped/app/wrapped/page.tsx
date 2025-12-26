import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import ShareButton from './shareButton';

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

  // Get top 5 plays
  const top5Plays = bestPlays.slice(0, 5).map((play: any) => ({
    title: play.beatmapset?.title || play.beatmap?.beatmapset?.title || 'Unknown',
    artist: play.beatmapset?.artist || play.beatmap?.beatmapset?.artist || 'Unknown',
    difficulty: play.beatmap?.version || 'Unknown',
    pp: play.pp,
    accuracy: (play.accuracy * 100).toFixed(2),
    rank: play.rank,
    date: new Date(play.created_at).toLocaleDateString('default', { 
      month: 'long', 
      day: 'numeric' 
    }),
    cover: play.beatmapset?.covers?.list || null,
  }));

  // Count mappers
  const mapperCounts: { [key: string]: number } = {};
  bestPlays.forEach((play: any) => {
    const mapper = play.beatmapset?.creator || play.beatmap?.beatmapset?.creator;
    if (mapper) {
      mapperCounts[mapper] = (mapperCounts[mapper] || 0) + 1;
    }
  });
  const top5Mappers = Object.entries(mapperCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([mapper, count]) => ({ mapper, count }));

  // Count artists
  const artistCounts: { [key: string]: number } = {};
  bestPlays.forEach((play: any) => {
    const artist = play.beatmapset?.artist || play.beatmap?.beatmapset?.artist;
    if (artist) {
      artistCounts[artist] = (artistCounts[artist] || 0) + 1;
    }
  });
  const top5Artists = Object.entries(artistCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([artist, count]) => ({ artist, count }));

  // Get top play from 2025 (highest PP)
  const topPlay = bestPlays.length > 0 ? bestPlays[0] : null;

  // Calculate average accuracy from best plays
  const avgAccuracy = bestPlays.length > 0
    ? bestPlays.reduce((sum: number, play: any) => sum + (play.accuracy || 0), 0) / bestPlays.length
    : 0;

  // Get background image from top play
  const backgroundImage = topPlay?.beatmapset?.covers?.cover || null;

  return {
    username: userData.username,
    avatar_url: userData.avatar_url,
    total_plays: totalPlays2025,
    most_active_month: mostActiveMonth,
    top_5_plays: top5Plays,
    top_5_mappers: top5Mappers,
    top_5_artists: top5Artists,
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
      ? `linear-gradient(rgba(0, 0, 0, 0.75), rgba(0, 0, 0, 0.85)), url(${stats.background_image})`
      : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    backgroundRepeat: 'repeat-y',
    backgroundAttachment: 'fixed',
    backgroundColor: '#1a1a2e',
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
            <p className="text-xl text-gray-600 mt-3">You were unbreakable!</p>
          </div>
        )}

        {/* Top 5 Plays */}
        {stats.top_5_plays.length > 0 && (
          <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-2xl p-12">
            <h2 className="text-4xl font-bold mb-8 text-center text-gray-800">Your Top 5 Plays of 2025</h2>
            <div className="space-y-6">
              {stats.top_5_plays.map((play: any, index: number) => (
                <div 
                  key={index}
                  className="flex items-center gap-6 p-6 bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl border-2 border-purple-200 hover:scale-102 transition-transform"
                >
                  <div className="flex-shrink-0">
                    <div className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white text-3xl font-bold">
                      {index + 1}
                    </div>
                  </div>
                  {play.cover && (
                    <img 
                      src={play.cover} 
                      alt={play.title}
                      className="w-24 h-24 rounded-lg object-cover shadow-lg"
                    />
                  )}
                  <div className="flex-grow">
                    <p className="text-2xl font-bold text-gray-800">{play.title}</p>
                    <p className="text-lg text-gray-600">{play.artist}</p>
                    <p className="text-sm text-gray-500">[{play.difficulty}]</p>
                    <p className="text-xs text-gray-400 mt-1">{play.date}</p>
                  </div>
                  <div className="flex gap-6 text-center">
                    <div>
                      <p className="text-sm text-gray-600">PP</p>
                      <p className="text-2xl font-bold text-purple-600">{Math.round(play.pp)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Acc</p>
                      <p className="text-2xl font-bold text-pink-600">{play.accuracy}%</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Rank</p>
                      <p className="text-2xl font-bold text-blue-600">{play.rank}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Top 5 Mappers */}
        {stats.top_5_mappers.length > 0 && (
          <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-2xl p-12">
            <h2 className="text-4xl font-bold mb-8 text-center text-gray-800">Your Favorite Mappers</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {stats.top_5_mappers.map((mapper: any, index: number) => (
                <div 
                  key={index}
                  className="flex items-center gap-4 p-6 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl border-2 border-blue-200"
                >
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center text-white text-xl font-bold">
                    {index + 1}
                  </div>
                  <div className="flex-grow">
                    <p className="text-xl font-bold text-gray-800">{mapper.mapper}</p>
                    <p className="text-sm text-gray-600">{mapper.count} top plays</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Top 5 Artists */}
        {stats.top_5_artists.length > 0 && (
          <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-2xl p-12">
            <h2 className="text-4xl font-bold mb-8 text-center text-gray-800">Your Top Performing Artists</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {stats.top_5_artists.map((artist: any, index: number) => (
                <div 
                  key={index}
                  className="flex items-center gap-4 p-6 bg-gradient-to-br from-pink-50 to-rose-50 rounded-xl border-2 border-pink-200"
                >
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-pink-500 to-rose-500 flex items-center justify-center text-white text-xl font-bold">
                    {index + 1}
                  </div>
                  <div className="flex-grow">
                    <p className="text-xl font-bold text-gray-800">{artist.artist}</p>
                    <p className="text-sm text-gray-600">{artist.count} top plays</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Shareable Summary Card */}
<div className="bg-white rounded-2xl shadow-2xl overflow-hidden" id="shareable-card">
  {/* Header with gradient */}
  <div className="bg-gradient-to-br from-purple-600 via-pink-600 to-blue-600 p-10 text-white text-center">
    <img 
      src={stats.avatar_url} 
      alt={stats.username}
      className="w-32 h-32 rounded-full border-4 border-white shadow-xl mx-auto mb-4"
    />
    <h2 className="text-5xl font-bold mb-2">{stats.username}</h2>
    <p className="text-2xl opacity-90">2025 osu! Wrapped</p>
  </div>

  {/* Content Grid */}
  <div className="p-10 bg-white">
    
    {/* Key Stats Row */}
    <div className="grid grid-cols-2 gap-6 mb-10">
      <div className="text-center">
        <p className="text-gray-600 text-lg mb-1">Total Plays</p>
        <p className="text-5xl font-bold text-purple-600">{stats.total_plays.toLocaleString()}</p>
      </div>
      <div className="text-center">
        <p className="text-gray-600 text-lg mb-1">New Top Scores</p>
        <p className="text-5xl font-bold text-pink-600">{stats.best_plays_count}</p>
      </div>
    </div>

    {/* Most Active Month */}
    {stats.most_active_month && (
      <div className="mb-10 bg-gradient-to-r from-purple-50 to-pink-50 p-6 rounded-xl border-2 border-purple-200">
        <p className="text-gray-700 text-lg font-medium mb-2">Most Active Month</p>
        <p className="text-4xl font-bold text-purple-600">{stats.most_active_month.month}</p>
        <p className="text-xl text-gray-600 mt-1">{stats.most_active_month.plays.toLocaleString()} plays</p>
      </div>
    )}

    {/* Two Column Layout for Lists */}
    <div className="grid grid-cols-2 gap-8 mb-10">
      
      {/* Top Artists */}
      {stats.top_5_artists.length > 0 && (
        <div>
          <h3 className="text-2xl font-bold text-gray-800 mb-4">Top Artists</h3>
          <div className="space-y-2">
            {stats.top_5_artists.slice(0, 5).map((artist: any, index: number) => (
              <div key={index} className="flex items-center gap-3">
                <span className="text-2xl font-bold text-pink-600 w-8">{index + 1}</span>
                <div className="flex-grow">
                  <p className="text-lg font-semibold text-gray-800 truncate">{artist.artist}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Top Mappers */}
      {stats.top_5_mappers.length > 0 && (
        <div>
          <h3 className="text-2xl font-bold text-gray-800 mb-4">Top Mappers</h3>
          <div className="space-y-2">
            {stats.top_5_mappers.slice(0, 5).map((mapper: any, index: number) => (
              <div key={index} className="flex items-center gap-3">
                <span className="text-2xl font-bold text-blue-600 w-8">{index + 1}</span>
                <div className="flex-grow">
                  <p className="text-lg font-semibold text-gray-800 truncate">{mapper.mapper}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>

    {/* Top 5 Songs */}
    {stats.top_5_plays.length > 0 && (
      <div className="mb-8">
        <h3 className="text-2xl font-bold text-gray-800 mb-4">Top Songs</h3>
        <div className="space-y-2">
          {stats.top_5_plays.map((play: any, index: number) => (
            <div key={index} className="flex items-center gap-3">
              <span className="text-2xl font-bold text-purple-600 w-8">{index + 1}</span>
              <div className="flex-grow">
                <p className="text-lg font-semibold text-gray-800 truncate">{play.title}</p>
                <p className="text-sm text-gray-600 truncate">{play.artist}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    )}

    {/* Bottom Stats */}
    <div className="grid grid-cols-2 gap-6 pt-6 border-t-2 border-gray-200">
      <div className="text-center">
        <p className="text-gray-600 text-sm mb-1">Current Rank</p>
        <p className="text-3xl font-bold text-blue-600">#{stats.current_rank?.toLocaleString()}</p>
      </div>
      <div className="text-center">
        <p className="text-gray-600 text-sm mb-1">Total PP</p>
        <p className="text-3xl font-bold text-indigo-600">{Math.round(stats.current_pp || 0).toLocaleString()}</p>
      </div>
    </div>

    {/* Footer must change to actual site name */}
    <div className="text-center mt-8 pt-6 border-t-2 border-gray-200">
      <p className="text-sm text-gray-500">osu-wrapped.com</p> 
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