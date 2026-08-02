import React from 'react';

const AnnouncementBar = () => {
  const announcementText = "🚚 Free Shipping Across India | ✨ Premium Fashion Jewellery | 🔒 Secure Payments";

  return (
    <>
      <style>{`
        @keyframes marquee-scroll {
          0% {
            transform: translateX(0%);
          }
          100% {
            transform: translateX(-50%);
          }
        }
        .marquee-wrapper {
          display: flex;
          overflow: hidden;
          white-space: nowrap;
          width: 100%;
        }
        .marquee-content {
          display: flex;
          width: max-content;
          animation: marquee-scroll 35s linear infinite;
        }
        .marquee-content:hover {
          animation-play-state: paused;
        }
      `}</style>

      <div className="bg-gradient-to-r from-luxury-gold-800 via-luxury-gold-500 to-luxury-gold-800 text-black py-2.5 text-[10px] sm:text-xs font-bold uppercase tracking-widest marquee-wrapper select-none z-55 border-b border-luxury-gold-700 cursor-pointer shadow-xs">
        <div className="marquee-content">
          <span className="px-4 flex items-center gap-4">
            {announcementText} • {announcementText} •
          </span>
          <span className="px-4 flex items-center gap-4">
            {announcementText} • {announcementText} •
          </span>
        </div>
      </div>
    </>
  );
};

export default AnnouncementBar;
