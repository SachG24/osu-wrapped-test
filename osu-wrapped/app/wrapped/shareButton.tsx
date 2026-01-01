'use client';

import domtoimage from 'dom-to-image-more';

export default function ShareButton() {
  const handleShare = async () => {
    const card = document.getElementById('shareable-card');
    
    if (!card) {
      alert('Could not find the card to screenshot!');
      return;
    }

    try {
      const button = document.querySelector('button');
      const originalText = button?.textContent;
      if (button) button.textContent = 'Generating image...';

      // Use dom-to-image instead
      const blob = await domtoimage.toBlob(card, {
        quality: 1,
        width: card.offsetWidth * 2,
        height: card.offsetHeight * 2,
        style: {
          transform: 'scale(2)',
          transformOrigin: 'top left',
          width: card.offsetWidth + 'px',
          height: card.offsetHeight + 'px'
        }
      });

      // Create download link
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.download = 'osu-wrapped-2025.png';
      link.href = url;
      link.click();
      
      URL.revokeObjectURL(url);
      
      if (button) button.textContent = originalText || 'Share Your Wrapped 📸';

    } catch (error) {
      console.error('Screenshot error:', error);
      alert('Failed to generate screenshot. Please try taking a manual screenshot!');
      const button = document.querySelector('button');
      if (button) button.textContent = 'Share Your Wrapped 📸';
    }
  };

  return (
    <button
      onClick={handleShare}
      className="bg-white text-purple-600 px-10 py-5 rounded-full text-2xl font-bold hover:bg-gray-100 hover:scale-105 transition-all shadow-2xl mb-4"
    >
      Share Your Wrapped 
    </button>
  );
}