import React, { useState } from 'react';

const ImageZoom = ({ images }) => {
  const [activeImage, setActiveImage] = useState(0);
  const [zoomStyle, setZoomStyle] = useState({ transformOrigin: 'center center', transform: 'scale(1)' });

  if (!images || images.length === 0) {
    return (
      <div className="aspect-[4/5] bg-neutral-100 dark:bg-neutral-900 rounded-lg flex items-center justify-center">
        <span className="text-neutral-400">No images available</span>
      </div>
    );
  }

  // Helper to resolve backend image paths vs absolute URLs
  const getFullUrl = (path) => {
    if (!path) return '';
    let cleanPath = path;
    if (typeof path === 'string' && path.startsWith('"') && path.endsWith('"')) {
      try {
        cleanPath = JSON.parse(path);
      } catch (e) {
        // keep as is
      }
    }
    return cleanPath.startsWith('http') ? cleanPath : `${import.meta.env.VITE_API_URL ? import.meta.env.VITE_API_URL.replace('/api', '') : 'http://localhost:5000'}${cleanPath}`;
  };

  const handleMouseMove = (e) => {
    const { left, top, width, height } = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - left) / width) * 100;
    const y = ((e.clientY - top) / height) * 100;
    setZoomStyle({
      transformOrigin: `${x}% ${y}%`,
      transform: 'scale(2.2)'
    });
  };

  const handleMouseLeave = () => {
    setZoomStyle({
      transformOrigin: 'center center',
      transform: 'scale(1)'
    });
  };

  return (
    <div className="flex flex-col space-y-4">
      {/* Active Zoom Image Area */}
      <div
        className="relative aspect-[4/5] bg-neutral-50 dark:bg-neutral-900 border border-neutral-100 dark:border-neutral-900 rounded-xl overflow-hidden cursor-zoom-in"
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
      >
        <img
          src={getFullUrl(images[activeImage])}
          alt={`Product view`}
          className="w-full h-full object-cover transition-transform duration-100 ease-out"
          style={zoomStyle}
        />
      </div>

      {/* Thumbnails Gallery */}
      {images.length > 1 && (
        <div className="grid grid-cols-5 gap-3">
          {images.map((img, i) => (
            <button
              key={i}
              onClick={() => setActiveImage(i)}
              className={`aspect-square bg-neutral-50 dark:bg-neutral-900 rounded-lg overflow-hidden border transition-all ${
                activeImage === i
                  ? 'border-luxury-gold-500 shadow-md scale-95'
                  : 'border-neutral-200 dark:border-neutral-800 hover:border-neutral-400'
              }`}
            >
              <img
                src={getFullUrl(img)}
                alt={`Thumbnail ${i + 1}`}
                className="w-full h-full object-cover"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default ImageZoom;
