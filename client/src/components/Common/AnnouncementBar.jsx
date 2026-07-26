import React from 'react';

const AnnouncementBar = () => {
  const text = "✨ FREE INSURED SHIPPING ON ORDERS OVER ₹43,000 • USE CODE LUXURY20 FOR 20% OFF ✨";
  // Repeat the text to ensure it covers all screens and loops seamlessly
  const repeatedText = `${text} \u00a0\u00a0\u00a0\u00a0 ${text} \u00a0\u00a0\u00a0\u00a0 ${text} \u00a0\u00a0\u00a0\u00a0 ${text}`;

  return (
    <>
      <style>{`
        @keyframes marquee-ltr {
          0% {
            transform: translateX(-50%);
          }
          100% {
            transform: translateX(0%);
          }
        }
        .marquee-container {
          display: flex;
          overflow: hidden;
          white-space: nowrap;
          width: 100%;
        }
        .marquee-scrollable {
          display: inline-block;
          animation: marquee-ltr 24s linear infinite;
        }
        .marquee-scrollable:hover {
          animation-play-state: paused;
        }
      `}</style>
      <div className="bg-gradient-to-r from-luxury-gold-800 via-luxury-gold-500 to-luxury-gold-800 text-black py-2 text-[10px] sm:text-xs font-bold uppercase tracking-widest marquee-container select-none z-55 border-b border-luxury-gold-700 cursor-pointer">
        <div className="marquee-scrollable">
          <span>{repeatedText}</span>
        </div>
      </div>
    </>
  );
};

export default AnnouncementBar;
