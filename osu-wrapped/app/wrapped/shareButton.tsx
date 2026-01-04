'use client';

import { useEffect, useState } from 'react';

export default function ShareButton() {
  const [html2canvas, setHtml2canvas] = useState<any>(null);

  useEffect(() => {
    // Dynamically import html2canvas only on client side
    import('html2canvas').then((module) => {
      setHtml2canvas(() => module.default);
    });
  }, []);

  const handleShare = async () => {
    if (!html2canvas) {
      alert('Screenshot library is still loading...');
      return;
    }

    const card = document.getElementById('shareable-card');
    
    if (!card) {
      alert('Could not find the card to screenshot!');
      return;
    }

    try {
      const button = document.querySelector('button');
      const originalText = button?.textContent;
      if (button) button.textContent = 'Generating image...';

      await new Promise(resolve => setTimeout(resolve, 300));

      const canvas = await html2canvas(card, {
        backgroundColor: '#ffffff',
        scale: 2,
        logging: false,
        useCORS: false,
        allowTaint: false,
      });

      canvas.toBlob((blob: Blob | null) => {
        if (!blob) {
          alert('Failed to generate image');
          if (button) button.textContent = originalText || 'Share Your Wrapped 📸';
          return;
        }

        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.download = 'osu-wrapped-2025.png';
        link.href = url;
        link.click();
        
        URL.revokeObjectURL(url);
        
        if (button) button.textContent = originalText || 'Share Your Wrapped 📸';
      });

    } catch (error) {
      console.error('Screenshot error:', error);
      alert('Failed to generate screenshot.');
      const button = document.querySelector('button');
      if (button) button.textContent = 'Share Your Wrapped 📸';
    }
  };

  return (
    <button
      onClick={handleShare}
      style={{
        background: '#ffffff',
        color: '#9333ea',
        padding: '20px 40px',
        borderRadius: '9999px',
        fontSize: '24px',
        fontWeight: 'bold',
        border: 'none',
        cursor: 'pointer',
        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
        transition: 'all 0.3s',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.background = '#f3f4f6';
        e.currentTarget.style.transform = 'scale(1.05)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = '#ffffff';
        e.currentTarget.style.transform = 'scale(1)';
      }}
    >
      Share Your Wrapped 
    </button>
  );
}