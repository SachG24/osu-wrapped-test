import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

async function getUserData() {
  const cookieStore = await cookies();
  const token = cookieStore.get('osu_access_token');

  if (!token) {
    redirect('/');
  }

  const response = await fetch('https://osu.ppy.sh/api/v2/me', {
    headers: {
      Authorization: `Bearer ${token.value}`,
    },
  });

  if (!response.ok) {
    redirect('/');
  }

  return response.json();
}

export default async function Dashboard() {
  const userData = await getUserData();

  return (
    <div 
      className="min-h-screen p-8"
      style={{
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%)',
        backgroundAttachment: 'fixed',
      }}
    >
      <div className="max-w-5xl mx-auto">
        {/* Profile Card */}
        <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-2xl p-10 mb-8">
          <div className="flex items-center gap-6 mb-10">
            <img 
              src={userData.avatar_url} 
              alt={userData.username}
              className="w-32 h-32 rounded-full border-4 border-purple-400 shadow-lg"
            />
            <div>
              <h1 className="text-5xl font-bold text-gray-800 mb-2">{userData.username}</h1>
              <p className="text-2xl text-gray-600 font-medium">
                Global Rank #{userData.statistics?.global_rank?.toLocaleString() || 'Unranked'}
              </p>
              <p className="text-lg text-gray-500 mt-1">
                {userData.country?.name || userData.country_code} 
              </p>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="bg-gradient-to-br from-purple-100 to-purple-50 p-6 rounded-xl border-2 border-purple-200 text-center transform hover:scale-105 transition-transform">
              <p className="text-gray-700 font-medium mb-2">Play Count</p>
              <p className="text-4xl font-bold text-purple-600">{userData.statistics?.play_count?.toLocaleString()}</p>
            </div>
            <div className="bg-gradient-to-br from-pink-100 to-pink-50 p-6 rounded-xl border-2 border-pink-200 text-center transform hover:scale-105 transition-transform">
              <p className="text-gray-700 font-medium mb-2">Total PP</p>
              <p className="text-4xl font-bold text-pink-600">{Math.round(userData.statistics?.pp || 0).toLocaleString()}</p>
            </div>
            <div className="bg-gradient-to-br from-blue-100 to-blue-50 p-6 rounded-xl border-2 border-blue-200 text-center transform hover:scale-105 transition-transform">
              <p className="text-gray-700 font-medium mb-2">Accuracy</p>
              <p className="text-4xl font-bold text-blue-600">{userData.statistics?.hit_accuracy?.toFixed(2)}%</p>
            </div>
            <div className="bg-gradient-to-br from-indigo-100 to-indigo-50 p-6 rounded-xl border-2 border-indigo-200 text-center transform hover:scale-105 transition-transform">
              <p className="text-gray-700 font-medium mb-2">Level</p>
              <p className="text-4xl font-bold text-indigo-600">{userData.statistics?.level?.current}</p>
            </div>
          </div>

          {/* Additional Stats Row */}
          <div className="grid grid-cols-3 gap-6 mt-6">
            <div className="bg-gradient-to-br from-green-100 to-green-50 p-6 rounded-xl border-2 border-green-200 text-center">
              <p className="text-gray-700 font-medium mb-2">SS Ranks</p>
              <p className="text-3xl font-bold text-green-600">
                {(userData.statistics?.grade_counts?.ss || 0) + (userData.statistics?.grade_counts?.ssh || 0)}
              </p>
            </div>
            <div className="bg-gradient-to-br from-yellow-100 to-yellow-50 p-6 rounded-xl border-2 border-yellow-200 text-center">
              <p className="text-gray-700 font-medium mb-2">S Ranks</p>
              <p className="text-3xl font-bold text-yellow-600">
                {(userData.statistics?.grade_counts?.s || 0) + (userData.statistics?.grade_counts?.sh || 0)}
              </p>
            </div>
            <div className="bg-gradient-to-br from-orange-100 to-orange-50 p-6 rounded-xl border-2 border-orange-200 text-center">
              <p className="text-gray-700 font-medium mb-2">A Ranks</p>
              <p className="text-3xl font-bold text-orange-600">{userData.statistics?.grade_counts?.a || 0}</p>
            </div>
          </div>
        </div>

        {/* Wrapped Button Card */}
        <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-2xl p-10 text-center">
          <h2 className="text-3xl font-bold text-gray-800 mb-4">Ready to see your year?</h2>
          <p className="text-xl text-gray-600 mb-6">Check out your personalized 2025 recap!</p>
          <a
            href="/wrapped"
            className="inline-block bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500 text-white px-10 py-5 rounded-full text-2xl font-bold hover:shadow-2xl hover:scale-105 transition-all"
          >
            See Your 2025 Wrapped 
          </a>
        </div>
      </div>
    </div>
  );
}