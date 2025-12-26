'use client';

export default function ShareButton() {
  const handleShare = () => {
    alert('Screenshot feature coming soon! For now, take a screenshot manually of the card above.');
  };

  return (
    <button
      onClick={handleShare}
      className="bg-white text-purple-600 px-10 py-5 rounded-full text-2xl font-bold hover:bg-gray-100 hover:scale-105 transition-all shadow-2xl mb-4"
    >
      Share Your Wrapped 📸
    </button>
  );
}