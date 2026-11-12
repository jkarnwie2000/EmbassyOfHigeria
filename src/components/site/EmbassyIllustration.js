import { HIGERIA_COLORS } from './FlagMark';

/**
 * Original illustration (artist's impression) of the front of the fictional
 * Embassy of the Republic of Higeria: a neoclassical building at dawn with a
 * six-column portico, the Dawn Ring emblem in the pediment, and the national flag.
 */
const STONE = '#efe6d3';
const STONE_LINE = '#d6c7a3';
const STONE_SHADE = '#e2d5b8';
const GLASS = '#2f4f57';
const INK = '#2b2f36';

// Symmetric about x=400 with a wider central bay so the door stays visible
const COLUMN_XS = [290, 328, 362, 422, 456, 494];

function Window({ x, y, w = 30, h = 50 }) {
  return (
    <g>
      <rect x={x - 3} y={y - 3} width={w + 6} height={h + 6} fill={STONE_SHADE} />
      <rect x={x} y={y} width={w} height={h} fill={GLASS} />
      <path d={`M${x + w / 2} ${y}V${y + h}M${x} ${y + h / 2}H${x + w}`} stroke={STONE} strokeWidth="2" />
      <rect x={x - 5} y={y + h + 3} width={w + 10} height="4" fill={STONE_LINE} />
    </g>
  );
}

function Flag({ x, y, w = 84 }) {
  const { lagoon, ember, ivory } = HIGERIA_COLORS;
  return (
    <svg x={x} y={y} width={w} height={(w * 2) / 3} viewBox="0 0 300 200">
      <rect width="300" height="200" fill={lagoon} />
      <path d="M0 200 L0 150 L240 0 L300 0 L300 50 L60 200 Z" fill={ivory} />
      <path d="M0 200 L0 168 L268 0 L300 0 L300 32 L32 200 Z" fill={ember} />
      <circle cx="62" cy="58" r="30" fill="none" stroke={ivory} strokeWidth="9" />
      <circle cx="62" cy="58" r="9" fill={ivory} />
    </svg>
  );
}

function Lamp({ x }) {
  return (
    <g>
      <rect x={x - 2} y="408" width="4" height="62" fill={INK} />
      <rect x={x - 7} y="398" width="14" height="14" rx="2" fill="#fbe9b7" stroke={INK} strokeWidth="2" />
      <path d={`M${x - 9} 398 L${x} 390 L${x + 9} 398 Z`} fill={INK} />
    </g>
  );
}

export default function EmbassyIllustration({ className = '' }) {
  const { lagoon, ember, ivory } = HIGERIA_COLORS;
  return (
    <svg
      viewBox="0 0 800 520"
      className={className}
      role="img"
      aria-labelledby="embassy-illustration-title embassy-illustration-desc"
    >
      <title id="embassy-illustration-title">Illustration of the Embassy of the Republic of Higeria</title>
      <desc id="embassy-illustration-desc">
        A cream stone neoclassical building with a six-column portico, a teal front door, wide steps and a lawn
        with iron railings. The Higerian flag, teal with a coral diagonal band and an ivory ring, flies from a flagpole.
      </desc>
      <defs>
        <linearGradient id="emb-sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#bfe0dc" />
          <stop offset="0.65" stopColor="#f3e9d2" />
          <stop offset="1" stopColor="#f7dccf" />
        </linearGradient>
        <linearGradient id="emb-column" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#fbf7ee" />
          <stop offset="0.6" stopColor="#f1e8d5" />
          <stop offset="1" stopColor="#dccfb0" />
        </linearGradient>
      </defs>

      {/* Sky and morning sun */}
      <rect width="800" height="520" fill="url(#emb-sky)" />
      <circle cx="690" cy="92" r="38" fill="#fbe3c8" opacity="0.9" />
      <path d="M250 50 q30 -14 60 0 q20 -10 40 2" fill="none" stroke="#ffffff" strokeWidth="6" strokeLinecap="round" opacity="0.7" />
      <path d="M520 54 q24 -12 48 0 q16 -8 32 2" fill="none" stroke="#ffffff" strokeWidth="5" strokeLinecap="round" opacity="0.6" />

      {/* Background trees */}
      <g fill="#3f7d5c">
        <ellipse cx="60" cy="300" rx="70" ry="110" />
        <ellipse cx="750" cy="290" rx="72" ry="115" />
      </g>
      <g fill="#2e6248">
        <ellipse cx="25" cy="340" rx="50" ry="80" />
        <ellipse cx="785" cy="330" rx="48" ry="82" />
      </g>

      {/* Side wings */}
      <rect x="92" y="222" width="70" height="180" fill={STONE_SHADE} stroke={STONE_LINE} />
      <rect x="638" y="222" width="70" height="180" fill={STONE_SHADE} stroke={STONE_LINE} />
      <rect x="86" y="214" width="82" height="10" fill={STONE_LINE} />
      <rect x="632" y="214" width="82" height="10" fill={STONE_LINE} />
      <Window x={112} y={250} />
      <Window x={112} y={320} />
      <Window x={658} y={250} />
      <Window x={658} y={320} />

      {/* Main block */}
      <rect x="160" y="172" width="480" height="230" fill={STONE} stroke={STONE_LINE} />
      <rect x="150" y="160" width="500" height="14" fill={STONE_LINE} />
      <rect x="156" y="150" width="488" height="12" fill={STONE_SHADE} />
      {/* Rusticated base course */}
      {Array.from({ length: 6 }, (_, i) => (
        <line key={i} x1="160" x2="640" y1={360 + i * 7} y2={360 + i * 7} stroke={STONE_LINE} strokeWidth="1" />
      ))}
      <Window x={185} y={200} />
      <Window x={232} y={200} />
      <Window x={185} y={285} />
      <Window x={232} y={285} />
      <Window x={538} y={200} />
      <Window x={585} y={200} />
      <Window x={538} y={285} />
      <Window x={585} y={285} />

      {/* Portico recess and door */}
      <rect x="282" y="186" width="236" height="182" fill={STONE_SHADE} />
      <path d="M376 304 a24 24 0 0 1 48 0" fill="none" stroke={STONE_LINE} strokeWidth="5" />
      <path d="M382 368 V314 a18 18 0 0 1 36 0 V368 Z" fill={lagoon} stroke={INK} strokeWidth="1.5" />
      <path d="M400 296 V368" stroke="#0a4845" strokeWidth="2" />
      <circle cx="395" cy="338" r="2" fill={ivory} />
      <circle cx="405" cy="338" r="2" fill={ivory} />

      {/* Columns */}
      {COLUMN_XS.map((x) => (
        <g key={x}>
          <rect x={x - 4} y="184" width="24" height="8" fill={STONE_LINE} />
          <rect x={x} y="192" width="16" height="170" fill="url(#emb-column)" />
          <path d={`M${x + 5} 194 V360 M${x + 10} 194 V360`} stroke="#e4d8bd" strokeWidth="1" />
          <rect x={x - 4} y="360" width="24" height="8" fill={STONE_LINE} />
        </g>
      ))}

      {/* Entablature with inscription, and pediment with the Dawn Ring emblem */}
      <rect x="268" y="162" width="264" height="24" fill="#f6eedc" stroke={STONE_LINE} />
      <text
        x="400"
        y="179"
        textAnchor="middle"
        fontFamily="Georgia, 'Times New Roman', serif"
        fontSize="11"
        letterSpacing="1.6"
        fill="#6b5a3a"
      >
        EMBASSY OF THE REPUBLIC OF HIGERIA
      </text>
      <path d="M260 162 L400 92 L540 162 Z" fill="#f6eedc" stroke={STONE_LINE} strokeWidth="2" />
      <path d="M282 156 L400 100 L518 156 Z" fill={STONE_SHADE} />
      <circle cx="400" cy="134" r="14" fill="none" stroke={lagoon} strokeWidth="4" />
      <circle cx="400" cy="134" r="4.5" fill={ember} />

      {/* Steps */}
      <rect x="272" y="368" width="256" height="10" fill="#e6dcc4" stroke={STONE_LINE} />
      <rect x="260" y="378" width="280" height="11" fill="#ddd1b5" stroke={STONE_LINE} />
      <rect x="248" y="389" width="304" height="13" fill="#d3c6a6" stroke={STONE_LINE} />

      {/* Shrubs along the facade */}
      <g fill="#4d8a5f">
        {[176, 214, 586, 624].map((cx) => (
          <ellipse key={cx} cx={cx} cy="398" rx="22" ry="12" />
        ))}
        <ellipse cx="127" cy="400" rx="30" ry="12" />
        <ellipse cx="673" cy="400" rx="30" ry="12" />
      </g>

      {/* Lawn, path and sidewalk */}
      <rect x="0" y="402" width="800" height="70" fill="#7fae74" />
      <path d="M352 402 H448 L470 472 H330 Z" fill="#e3dac6" />
      <rect x="0" y="472" width="800" height="48" fill="#d9d2c3" />
      <path d="M0 472 H800" stroke="#c4bba8" strokeWidth="3" />

      {/* Iron railings with a gap for the path */}
      <g stroke={INK} strokeWidth="2">
        <path d="M20 448 H325 M475 448 H780" />
        {Array.from({ length: 31 }, (_, i) => 22 + i * 10)
          .filter((x) => x < 325)
          .map((x) => (
            <line key={`l${x}`} x1={x} x2={x} y1="440" y2="470" />
          ))}
        {Array.from({ length: 31 }, (_, i) => 478 + i * 10)
          .filter((x) => x < 780)
          .map((x) => (
            <line key={`r${x}`} x1={x} x2={x} y1="440" y2="470" />
          ))}
      </g>
      <rect x="318" y="430" width="10" height="42" fill={INK} />
      <rect x="472" y="430" width="10" height="42" fill={INK} />

      {/* Gate plaque */}
      <rect x="540" y="414" width="96" height="22" rx="2" fill={lagoon} stroke={INK} strokeWidth="1" />
      <text x="588" y="428" textAnchor="middle" fontFamily="Arial, sans-serif" fontSize="7.5" fill={ivory} letterSpacing="0.6">
        EMBASSY OF HIGERIA
      </text>

      <Lamp x={300} />
      <Lamp x={500} />

      {/* Flagpole and Higerian flag */}
      <rect x="68" y="76" width="4" height="396" fill="#8e9298" />
      <circle cx="70" cy="74" r="4" fill="#c9a24a" />
      <Flag x={72} y={80} w={78} />
    </svg>
  );
}
