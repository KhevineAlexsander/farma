import React from 'react';

interface SyringeVisualizerProps {
  currentUnits: number;
  capacityUnits: number;
  volumeToInjectMl: number;
  syringeLabel?: string;
  isOverCapacity?: boolean;
}

export const SyringeVisualizer: React.FC<SyringeVisualizerProps> = ({
  currentUnits,
  capacityUnits,
  volumeToInjectMl,
  syringeLabel = 'U-100',
  isOverCapacity = false,
}) => {
  const safeCap = capacityUnits > 0 ? capacityUnits : 100;
  const clampedUnits = Math.max(0, currentUnits);
  const fillFraction = Math.min(clampedUnits / safeCap, 1);
  const percentage = Math.round((clampedUnits / safeCap) * 100);

  // Dimensões do SVG
  // Comprimento ativo de líquido: de x=75 até x=435 (360px de curso útil)
  const barrelStartX = 75;
  const barrelLength = 360;
  const liquidWidth = fillFraction * barrelLength;
  const plungerX = barrelStartX + liquidWidth;

  // Geração de marcas de graduação baseadas na capacidade da seringa
  const majorInterval = safeCap <= 30 ? 5 : safeCap <= 50 ? 10 : 10;
  const minorInterval = safeCap <= 30 ? 1 : safeCap <= 50 ? 2 : 2;
  const totalSteps = Math.floor(safeCap / minorInterval);

  return (
    <div className="bg-slate-950 p-4 sm:p-5 rounded-2xl border border-slate-800 shadow-xl space-y-3 select-none">
      {/* Cabeçalho da Seringa com porcentagem e UI */}
      <div className="flex items-center justify-between text-xs">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-pulse"></span>
          <span className="font-bold text-white">Visualizador da Seringa Graduada</span>
          <span className="text-[10px] px-2 py-0.5 rounded-md bg-cyan-500/10 text-cyan-300 font-mono font-bold border border-cyan-500/20">
            {syringeLabel} ({safeCap} UI)
          </span>
        </div>
        <div className="text-right">
          <span className="text-cyan-400 font-mono font-black text-sm">
            {currentUnits} UI
          </span>
          <span className="text-slate-400 text-[11px] ml-1.5 font-medium">
            ({percentage}% da seringa)
          </span>
        </div>
      </div>

      {/* Desenho Ilustrativo da Seringa com Animação Fluida */}
      <div className="relative py-2 overflow-x-auto admin-nav-scrollbar">
        <svg
          viewBox="0 0 540 130"
          className="w-full h-auto min-w-[340px] drop-shadow-xl"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            {/* Gradiente do Corpo de Vidro */}
            <linearGradient id="syringeGlassBody" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#ffffff" stopOpacity="0.3" />
              <stop offset="25%" stopColor="#38bdf8" stopOpacity="0.08" />
              <stop offset="75%" stopColor="#0f172a" stopOpacity="0.25" />
              <stop offset="100%" stopColor="#0284c7" stopOpacity="0.25" />
            </linearGradient>

            {/* Gradiente do Líquido (Peptídeo Reconstituído) */}
            <linearGradient id="peptideFluidGradient" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.95" />
              <stop offset="50%" stopColor="#0284c7" stopOpacity="0.9" />
              <stop offset="100%" stopColor="#38bdf8" stopOpacity="0.95" />
            </linearGradient>

            {/* Brilho Superior no Líquido */}
            <linearGradient id="fluidSheen" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#ffffff" stopOpacity="0.45" />
              <stop offset="50%" stopColor="#38bdf8" stopOpacity="0.1" />
              <stop offset="100%" stopColor="#0369a1" stopOpacity="0.6" />
            </linearGradient>

            {/* Êmbolo de Borracha Negra */}
            <linearGradient id="plungerRubber" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#475569" />
              <stop offset="40%" stopColor="#0f172a" />
              <stop offset="60%" stopColor="#020617" />
              <stop offset="100%" stopColor="#334155" />
            </linearGradient>

            {/* Haste Plástica do Êmbolo */}
            <linearGradient id="plungerRodGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#94a3b8" />
              <stop offset="50%" stopColor="#475569" />
              <stop offset="100%" stopColor="#1e293b" />
            </linearGradient>

            {/* Agulha de Aço Inox */}
            <linearGradient id="steelNeedle" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#e2e8f0" />
              <stop offset="50%" stopColor="#94a3b8" />
              <stop offset="100%" stopColor="#cbd5e1" />
            </linearGradient>
          </defs>

          {/* 1. AGULHA & CANHÃO (LADO ESQUERDO) */}
          {/* Haste de aço da agulha */}
          <line
            x1="12"
            y1="65"
            x2="60"
            y2="65"
            stroke="url(#steelNeedle)"
            strokeWidth="2.5"
            strokeLinecap="round"
          />
          {/* Bisel da ponta da agulha */}
          <polygon points="12,64 16,63 16,65" fill="#f8fafc" />

          {/* Canhão plástico da agulha (hub laranja/ciano translúcido de insulina) */}
          <polygon
            points="60,54 75,57 75,73 60,76"
            fill="#0284c7"
            stroke="#0369a1"
            strokeWidth="1"
          />
          <rect x="71" y="56" width="4" height="18" fill="#38bdf8" opacity="0.6" />

          {/* 2. CORPO CILÍNDRICO DE VIDRO (BARREL) */}
          {/* Fundo interno do tubo */}
          <rect
            x="75"
            y="40"
            width="360"
            height="50"
            rx="5"
            fill="#090d16"
            stroke="#334155"
            strokeWidth="1.5"
          />

          {/* 3. LÍQUIDO PREENCHIDO (ANIMADO) */}
          <g className="transition-all duration-500 ease-out">
            {liquidWidth > 0 && (
              <>
                {/* Massa principal do líquido com gradiente */}
                <rect
                  x="75"
                  y="41"
                  width={liquidWidth}
                  height="48"
                  rx="3"
                  fill="url(#peptideFluidGradient)"
                  className="transition-all duration-500 ease-out"
                />
                {/* Brilho/reflexo superior no líquido */}
                <rect
                  x="75"
                  y="42"
                  width={liquidWidth}
                  height="16"
                  fill="url(#fluidSheen)"
                  className="transition-all duration-500 ease-out"
                />
                {/* Menisco arredondado de líquido na frente */}
                <ellipse
                  cx={75 + liquidWidth}
                  cy="65"
                  rx="3"
                  ry="23"
                  fill="#7dd3fc"
                  opacity="0.8"
                  className="transition-all duration-500 ease-out"
                />
              </>
            )}
          </g>

          {/* 4. MARCADOR / PIN ELEGANTE EM CIMA DA MARCAÇÃO EXATA */}
          <g
            transform={`translate(${plungerX}, 28)`}
            className="transition-all duration-500 ease-out"
          >
            {/* Triângulo indicador apontando para a linha */}
            <polygon points="0,7 -5,0 5,0" fill="#38bdf8" />
            {/* Badge flutuante acima */}
            <rect
              x="-24"
              y="-18"
              width="48"
              height="16"
              rx="4"
              fill="#0284c7"
              stroke="#38bdf8"
              strokeWidth="1"
            />
            <text
              x="0"
              y="-7"
              fill="#ffffff"
              fontSize="9"
              fontWeight="900"
              fontFamily="monospace"
              textAnchor="middle"
            >
              {currentUnits} UI
            </text>
          </g>

          {/* 5. ÊMBOLO MÓVEL (PLUNGER STOPPER & ROD) */}
          <g
            transform={`translate(${plungerX}, 0)`}
            className="transition-all duration-500 ease-out"
          >
            {/* Anel frontal da borracha de vedação (onde se faz a leitura exata) */}
            <rect
              x="0"
              y="41"
              width="6"
              height="48"
              rx="1.5"
              fill="#020617"
              stroke="#0f172a"
              strokeWidth="0.8"
            />
            {/* Núcleo central da borracha */}
            <rect
              x="5"
              y="42"
              width="8"
              height="46"
              fill="url(#plungerRubber)"
            />
            {/* Anel traseiro da borracha de vedação */}
            <rect
              x="12"
              y="41"
              width="6"
              height="48"
              rx="1.5"
              fill="#020617"
              stroke="#0f172a"
              strokeWidth="0.8"
            />

            {/* Haste de plástico que empurra o êmbolo para a direita */}
            <rect
              x="18"
              y="60"
              width="90"
              height="10"
              rx="2"
              fill="url(#plungerRodGrad)"
              stroke="#334155"
              strokeWidth="0.8"
            />
            {/* Ranhuras na haste plástica */}
            <line x1="35" y1="60" x2="35" y2="70" stroke="#64748b" strokeWidth="1" />
            <line x1="55" y1="60" x2="55" y2="70" stroke="#64748b" strokeWidth="1" />
            <line x1="75" y1="60" x2="75" y2="70" stroke="#64748b" strokeWidth="1" />
            <line x1="95" y1="60" x2="95" y2="70" stroke="#64748b" strokeWidth="1" />

            {/* Apoio do polegar (Thumb Flange no final da haste) */}
            <rect
              x="108"
              y="45"
              width="6"
              height="40"
              rx="3"
              fill="#64748b"
              stroke="#94a3b8"
              strokeWidth="1"
            />
          </g>

          {/* 6. CAMADA DE VIDRO TRANSPARENTE COM REFLEXOS */}
          <rect
            x="75"
            y="40"
            width="360"
            height="50"
            rx="5"
            fill="url(#syringeGlassBody)"
            stroke="#475569"
            strokeWidth="1.5"
            pointerEvents="none"
          />

          {/* 7. ESCALA E MARCAS DE GRADUAÇÃO (TICKS) NO VIDRO */}
          {Array.from({ length: totalSteps + 1 }).map((_, stepIdx) => {
            const unitVal = stepIdx * minorInterval;
            if (unitVal > safeCap) return null;
            const xPos = barrelStartX + (unitVal / safeCap) * barrelLength;
            const isMajor = unitVal % majorInterval === 0;

            if (isMajor) {
              return (
                <g key={`tick-${unitVal}`}>
                  {/* Linha superior maior */}
                  <line
                    x1={xPos}
                    y1="40"
                    x2={xPos}
                    y2="54"
                    stroke="#f8fafc"
                    strokeWidth="1.3"
                  />
                  {/* Linha inferior maior */}
                  <line
                    x1={xPos}
                    y1="76"
                    x2={xPos}
                    y2="90"
                    stroke="#f8fafc"
                    strokeWidth="1.3"
                  />
                  {/* Numeração da escala impressa no vidro */}
                  <text
                    x={xPos}
                    y="104"
                    fill="#94a3b8"
                    fontSize="9"
                    fontWeight="800"
                    fontFamily="monospace"
                    textAnchor="middle"
                  >
                    {unitVal}
                  </text>
                </g>
              );
            }

            // Marca intermediária menor
            return (
              <line
                key={`tick-${unitVal}`}
                x1={xPos}
                y1="40"
                x2={xPos}
                y2="47"
                stroke="#94a3b8"
                strokeWidth="0.8"
                strokeOpacity="0.75"
              />
            );
          })}

          {/* 8. FLANGE DE APOIO DOS DEDOS (ABAS LATERAIS DO VIDRO À DIREITA) */}
          <rect
            x="433"
            y="26"
            width="8"
            height="78"
            rx="4"
            fill="#334155"
            stroke="#64748b"
            strokeWidth="1.2"
          />
        </svg>
      </div>

      {/* Instrução Farmacotécnica de Alinhamento */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-2 p-2.5 rounded-xl bg-slate-900/70 border border-slate-800 text-[11px]">
        <div className="flex items-center gap-2 text-slate-300">
          <span className="w-2 h-2 rounded-full bg-cyan-400 shrink-0"></span>
          <span>
            Alinhe a <strong>borda preta frontal da borracha</strong> exatamente na linha de{' '}
            <strong className="text-cyan-400 font-mono">{currentUnits} UI</strong> ({volumeToInjectMl.toFixed(2)} mL).
          </span>
        </div>
        {isOverCapacity && (
          <span className="text-red-400 font-bold bg-red-950/50 px-2 py-0.5 rounded border border-red-500/30">
            ⚠️ Volume excede a seringa!
          </span>
        )}
      </div>
    </div>
  );
};
