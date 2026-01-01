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
    // Add one day to the start_date to ensure we're in the correct month
    const date = new Date(topMonth.start_date);
    date.setDate(date.getDate() + 1); // Offset by 1 day to avoid timezone issues
    const monthName = date.toLocaleString('default', { month: 'long' });
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

        {/* Shareable Summary Card - Pure inline styles, no Tailwind */}
<div 
  id="shareable-card"
  style={{
    background: '#ffffff',
    borderRadius: '16px',
    overflow: 'hidden',
    maxWidth: '800px',
    margin: '0 auto',
  }}
>
  {/* Header with gradient */}
  <div style={{
    background: 'linear-gradient(135deg, #9333ea 0%, #ec4899 50%, #3b82f6 100%)',
    padding: '40px',
    textAlign: 'center',
    color: '#ffffff',
  }}>
    <img 
      src={`/api/proxy-image?url=${encodeURIComponent(stats.avatar_url)}`}
      alt={stats.username}
      style={{
        width: '128px',
        height: '128px',
        borderRadius: '50%',
        border: '4px solid #ffffff',
        boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.3)',
        margin: '0 auto 16px',
        display: 'block',
      }}
    />
    <h2 style={{ fontSize: '48px', fontWeight: 'bold', marginBottom: '8px', margin: '0' }}>
      {stats.username}
    </h2>
    <p style={{ fontSize: '24px', opacity: 0.9, margin: '8px 0 0 0' }}>
      2025 osu! Wrapped
    </p>
  </div>

  {/* Content */}
  <div style={{ padding: '40px', background: '#ffffff' }}>
    
    {/* Key Stats Row */}
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '40px' }}>
      <div style={{ textAlign: 'center' }}>
        <p style={{ color: '#4b5563', fontSize: '18px', marginBottom: '4px' }}>Total Plays</p>
        <p style={{ fontSize: '48px', fontWeight: 'bold', color: '#9333ea', margin: '0' }}>
          {stats.total_plays.toLocaleString()}
        </p>
      </div>
      <div style={{ textAlign: 'center' }}>
        <p style={{ color: '#4b5563', fontSize: '18px', marginBottom: '4px' }}>New Top Scores</p>
        <p style={{ fontSize: '48px', fontWeight: 'bold', color: '#ec4899', margin: '0' }}>
          {stats.best_plays_count}
        </p>
      </div>
    </div>

    {/* Most Active Month */}
    {stats.most_active_month && (
      <div style={{
        marginBottom: '40px',
        background: 'linear-gradient(to right, #faf5ff, #fdf2f8)',
        padding: '24px',
        borderRadius: '12px',
      }}>
        <p style={{ color: '#374151', fontSize: '18px', fontWeight: '500', marginBottom: '8px' }}>
          Most Active Month
        </p>
        <p style={{ fontSize: '36px', fontWeight: 'bold', color: '#9333ea', margin: '0' }}>
          {stats.most_active_month.month}
        </p>
        <p style={{ fontSize: '20px', color: '#4b5563', marginTop: '4px' }}>
          {stats.most_active_month.plays.toLocaleString()} plays
        </p>
      </div>
    )}

    {/* Two Column Layout */}
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '32px', marginBottom: '40px' }}>
      
      {/* Top Artists */}
      {stats.top_5_artists.length > 0 && (
        <div>
          <h3 style={{ fontSize: '24px', fontWeight: 'bold', color: '#1f2937', marginBottom: '16px' }}>
            Top Artists
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {stats.top_5_artists.slice(0, 5).map((artist: any, index: number) => (
              <div key={index} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span style={{ fontSize: '24px', fontWeight: 'bold', color: '#ec4899', width: '32px' }}>
                  {index + 1}
                </span>
                <div style={{ flexGrow: 1 }}>
                  <p style={{
                    fontSize: '18px',
                    fontWeight: '600',
                    color: '#1f2937',
                    margin: '0',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}>
                    {artist.artist}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Top Mappers */}
      {stats.top_5_mappers.length > 0 && (
        <div>
          <h3 style={{ fontSize: '24px', fontWeight: 'bold', color: '#1f2937', marginBottom: '16px' }}>
            Top Mappers
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {stats.top_5_mappers.slice(0, 5).map((mapper: any, index: number) => (
              <div key={index} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span style={{ fontSize: '24px', fontWeight: 'bold', color: '#3b82f6', width: '32px' }}>
                  {index + 1}
                </span>
                <div style={{ flexGrow: 1 }}>
                  <p style={{
                    fontSize: '18px',
                    fontWeight: '600',
                    color: '#1f2937',
                    margin: '0',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}>
                    {mapper.mapper}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>

    {/* Top 5 Songs */}
    {stats.top_5_plays.length > 0 && (
      <div style={{ marginBottom: '32px' }}>
        <h3 style={{ fontSize: '24px', fontWeight: 'bold', color: '#1f2937', marginBottom: '16px' }}>
          Top Songs
        </h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {stats.top_5_plays.map((play: any, index: number) => (
            <div key={index} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span style={{ fontSize: '24px', fontWeight: 'bold', color: '#9333ea', width: '32px' }}>
                {index + 1}
              </span>
              <div style={{ flexGrow: 1 }}>
                <p style={{
                  fontSize: '18px',
                  fontWeight: '600',
                  color: '#1f2937',
                  margin: '0',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}>
                  {play.title}
                </p>
                <p style={{
                  fontSize: '14px',
                  color: '#4b5563',
                  margin: '0',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}>
                  {play.artist}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    )}

    {/* Bottom Stats */}
    <div style={{
      display: 'grid',
      gridTemplateColumns: '1fr 1fr',
      gap: '24px',
      paddingTop: '24px',
    }}>
      <div style={{ textAlign: 'center' }}>
        <p style={{ color: '#4b5563', fontSize: '14px', marginBottom: '4px' }}>Current Rank</p>
        <p style={{ fontSize: '30px', fontWeight: 'bold', color: '#3b82f6', margin: '0' }}>
          #{stats.current_rank?.toLocaleString()}
        </p>
      </div>
      <div style={{ textAlign: 'center' }}>
        <p style={{ color: '#4b5563', fontSize: '14px', marginBottom: '4px' }}>Total PP</p>
        <p style={{ fontSize: '30px', fontWeight: 'bold', color: '#6366f1', margin: '0' }}>
          {Math.round(stats.current_pp || 0).toLocaleString()}
        </p>
      </div>
    </div>

    {/* Footer */}
    <div style={{
      textAlign: 'center',
      marginTop: '32px',
      paddingTop: '24px',
    }}>
      <p style={{ fontSize: '14px', color: '#6b7280', margin: '0' }}>osu-wrapped.com</p>
    </div>
  </div>
</div>

        {/* Share Button */}
        <div style={{ textAlign: 'center', marginTop: '40px' }}>
          <ShareButton />
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