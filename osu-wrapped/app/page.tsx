export default function Home() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-pink-500 via-purple-500 to-blue-500">
      <div className="text-center">
        <h1 className="text-6xl font-bold text-white mb-4">
          osu! Wrapped
        </h1>
        <p className="text-xl text-white mb-8">
          See your year in osu! just like Spotify Wrapped
        </p>
        <a
          href="/api/auth/login"
          className="bg-white text-purple-600 px-8 py-4 rounded-full text-lg font-semibold hover:bg-gray-100 transition"
        >
          Login with osu!
        </a>
      </div>
    </div>
  );
}
