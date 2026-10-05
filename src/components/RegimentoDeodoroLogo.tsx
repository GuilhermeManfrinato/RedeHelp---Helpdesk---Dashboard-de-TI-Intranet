import React from 'react';

interface RegimentoDeodoroLogoProps {
  className?: string;
  size?: number;
  highContrast?: boolean;
}

export const RegimentoDeodoroLogo: React.FC<RegimentoDeodoroLogoProps> = ({
  className = "w-8 h-8",
  size = 36,
  highContrast = false,
}) => {
  const gold = highContrast ? '#FACC15' : '#DFB642';
  const darkGold = highContrast ? '#CA8A04' : '#B8922C';
  const green = highContrast ? '#000000' : '#192B14';
  const lightGreen = highContrast ? '#1F2937' : '#27431E';
  const red = highContrast ? '#EF4444' : '#C23616';

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`shrink-0 drop-shadow-sm ${className}`}
      aria-label="Brasão do 2º Grupo de Artilharia de Campanha - Regimento Deodoro"
    >
      {/* Escudo Heráldico Militar */}
      <path
        d="M50 4 C72 4 88 16 88 38 C88 64 68 86 50 96 C32 86 12 64 12 38 C12 16 28 4 50 4 Z"
        fill={green}
        stroke={gold}
        strokeWidth="3.5"
        strokeLinejoin="round"
      />

      {/* Borda interna do escudo */}
      <path
        d="M50 8 C69 8 83 18 83 38 C83 61 65 81 50 90 C35 81 17 61 17 38 C17 18 31 8 50 8 Z"
        fill={lightGreen}
        stroke={darkGold}
        strokeWidth="1.2"
        opacity="0.8"
      />

      {/* Canhão 1 (Diagonal Direita para Baixo) */}
      <g transform="rotate(45 50 50)">
        {/* Boca do Canhão */}
        <rect x="47" y="16" width="6" height="4" rx="1" fill={gold} stroke={darkGold} strokeWidth="0.8" />
        {/* Anéis e Alma */}
        <rect x="46" y="20" width="8" height="46" rx="1.5" fill={gold} stroke={darkGold} strokeWidth="1" />
        <rect x="44.5" y="24" width="11" height="3" rx="0.5" fill={darkGold} />
        <rect x="45" y="38" width="10" height="3" rx="0.5" fill={darkGold} />
        {/* Munhões laterais */}
        <rect x="40" y="44" width="20" height="4.5" rx="1.5" fill={gold} stroke={darkGold} strokeWidth="0.8" />
        {/* Culatra / Cascavel */}
        <path d="M45 66 C45 74 55 74 55 66 Z" fill={darkGold} stroke={gold} strokeWidth="0.8" />
        <circle cx="50" cy="74" r="3" fill={gold} stroke={darkGold} strokeWidth="0.8" />
      </g>

      {/* Canhão 2 (Diagonal Esquerda para Baixo) */}
      <g transform="rotate(-45 50 50)">
        {/* Boca do Canhão */}
        <rect x="47" y="16" width="6" height="4" rx="1" fill={gold} stroke={darkGold} strokeWidth="0.8" />
        {/* Tubo */}
        <rect x="46" y="20" width="8" height="46" rx="1.5" fill={gold} stroke={darkGold} strokeWidth="1" />
        <rect x="44.5" y="24" width="11" height="3" rx="0.5" fill={darkGold} />
        <rect x="45" y="38" width="10" height="3" rx="0.5" fill={darkGold} />
        {/* Munhões laterais */}
        <rect x="40" y="44" width="20" height="4.5" rx="1.5" fill={gold} stroke={darkGold} strokeWidth="0.8" />
        {/* Culatra / Cascavel */}
        <path d="M45 66 C45 74 55 74 55 66 Z" fill={darkGold} stroke={gold} strokeWidth="0.8" />
        <circle cx="50" cy="74" r="3" fill={gold} stroke={darkGold} strokeWidth="0.8" />
      </g>

      {/* Granada de Artilharia Central com Labareda de Fogo */}
      {/* Corpo esférico da bomba */}
      <circle cx="50" cy="54" r="10.5" fill={green} stroke={gold} strokeWidth="2.5" />
      <circle cx="50" cy="54" r="7.5" fill={darkGold} opacity="0.3" />

      {/* Chamas da Artilharia (Símbolo de Santa Bárbara / Mallet) */}
      <path
        d="M50 44 C45 38 43 32 46 25 C48 30 50 33 50 33 C50 33 53 28 55 24 C57 32 55 38 50 44 Z"
        fill={gold}
      />
      <path
        d="M50 44 C48 40 47 36 48 30 C49 33 50 35 50 35 C50 35 52 32 53 29 C54 35 53 40 50 44 Z"
        fill={red}
      />

      {/* Texto 2º GAC e Estrela */}
      <text
        x="50"
        y="58"
        textAnchor="middle"
        fill={gold}
        fontSize="7.5"
        fontWeight="900"
        fontFamily="monospace"
        letterSpacing="0.5"
      >
        2ºGAC
      </text>

      {/* Faixa / Listel com inscrição DEODORO no topo */}
      <path
        d="M26 15 L74 15 L70 21 L30 21 Z"
        fill={green}
        stroke={gold}
        strokeWidth="1"
      />
      <text
        x="50"
        y="19.5"
        textAnchor="middle"
        fill={gold}
        fontSize="5.2"
        fontWeight="900"
        fontFamily="sans-serif"
        letterSpacing="1"
      >
        DEODORO
      </text>
    </svg>
  );
};
