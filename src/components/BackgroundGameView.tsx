import React from 'react';

interface BackgroundGameViewProps {
  gameUrl: string;
}

export const BackgroundGameView: React.FC<BackgroundGameViewProps> = ({ gameUrl }) => {
  return (
    <div className="w-full h-screen bg-slate-950 overflow-hidden relative">
      <iframe
        src={gameUrl}
        title="Game View"
        className="w-full h-full border-0 bg-slate-950"
        allow="autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        sandbox="allow-same-origin allow-scripts allow-popups allow-forms allow-modals"
      />
    </div>
  );
};

