export default function Home() {
  return (
    <div 
      className="min-h-screen flex items-center justify-center relative"
      style={{
        backgroundImage: 'linear-gradient(rgba(0, 0, 0, 0.5), rgba(0, 0, 0, 0.6)), url(https://assets.ppy.sh/contests/269/winners/h3p0.jpg)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundAttachment: 'fixed',
      }}
    >
      <div className="text-center z-10">
        <h1 className="text-7xl font-bold text-white mb-6 drop-shadow-2xl flex items-center justify-center gap-3">
          <img 
            src="https://upload.wikimedia.org/wikipedia/commons/1/1e/Osu%21_Logo_2016.svg" 
            alt="osu!" 
            className="h-28"
          />
          Wrapped
        </h1>
        <p className="text-2xl text-white mb-10 drop-shadow-lg font-medium">
          See your year in rhythm gaming, just like Spotify Wrapped
        </p>
        
          <a href="/api/auth/login"
          className="bg-white/95 backdrop-blur-sm text-pink-600 px-12 py-5 rounded-full text-2xl font-bold hover:bg-white hover:scale-105 transition-all shadow-2xl border-2 border-white">
        
          Login with osu!
        </a>
      </div>
    </div>
  );
}