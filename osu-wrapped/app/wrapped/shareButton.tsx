'use client';

import html2canvas from 'html2canvas';

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

      // Create isolated clone
      const cardClone = card.cloneNode(true) as HTMLElement;
      
      // Fix the profile image CORS issue - convert to base64
      const img = cardClone.querySelector('img[alt]') as HTMLImageElement;
      if (img && img.src) {
        try {
          // Create a canvas to convert the image
          const imgCanvas = document.createElement('canvas');
          const imgCtx = imgCanvas.getContext('2d');
          const tempImg = new Image();
          tempImg.crossOrigin = 'anonymous';
          
          await new Promise((resolve, reject) => {
            tempImg.onload = () => {
              imgCanvas.width = tempImg.width;
              imgCanvas.height = tempImg.height;
              imgCtx?.drawImage(tempImg, 0, 0);
              img.src = imgCanvas.toDataURL('image/png');
              resolve(true);
            };
            tempImg.onerror = reject;
            tempImg.src = img.src;
          });
        } catch (e) {
          console.log('Could not convert profile image, using placeholder');
          img.style.display = 'none'; // Hide if can't load
        }
      }

      const wrapper = document.createElement('div');
      wrapper.style.position = 'fixed';
      wrapper.style.left = '-9999px';
      wrapper.style.top = '0';
      wrapper.style.background = '#ffffff';
      wrapper.appendChild(cardClone);
      document.body.appendChild(wrapper);

      await new Promise(resolve => setTimeout(resolve, 200));

      const canvas = await html2canvas(wrapper, {
        backgroundColor: '#ffffff',
        scale: 2,
        logging: false,
        useCORS: false, // Disable CORS since we converted the image
        allowTaint: false,
        foreignObjectRendering: false,
      });

      document.body.removeChild(wrapper);

      canvas.toBlob((blob) => {
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
      alert('Failed to generate screenshot: ' + (error as Error).message);
      const button = document.querySelector('button');
      if (button) button.textContent = 'Share Your Wrapped 📸';
    }
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