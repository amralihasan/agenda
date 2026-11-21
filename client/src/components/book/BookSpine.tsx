import React from 'react';

export const BookSpine: React.FC = () => {
  return (
    <div className="hidden lg:flex absolute top-0 bottom-0 left-1/2 -translate-x-1/2 w-8 pointer-events-none z-30 justify-center">
      {/* 1px Center binding seam */}
      <div className="w-[1px] h-full bg-[#d4c9bc]"></div>

      {/* Two-sided gradient spine shadow simulating bound valley */}
      <div className="absolute inset-0 bg-gradient-to-r from-black/15 via-transparent to-black/15"></div>

      {/* Draped Silk Ribbon Marker */}
      <div className="absolute -top-3 w-3 h-[106%] bg-gradient-to-r from-[#832613] via-[#da664d] to-[#832613] shadow-[1px_4px_10px_rgba(0,0,0,0.5)] flex flex-col justify-between overflow-hidden">
        {/* Ribbon texture sheen */}
        <div className="w-full h-full bg-gradient-to-b from-white/10 via-transparent to-black/20"></div>

        {/* Ribbon Swallowtail Cut Tail at bottom */}
        <div
          className="w-full h-4 bg-[#fcf9f3] relative -mb-0.5"
          style={{ clipPath: 'polygon(0 0, 50% 100%, 100% 0, 100% 100%, 0 100%)' }}
        ></div>
      </div>
    </div>
  );
};
