const HeroIllustration = () => {
  return (
    <div className="rounded-2xl bg-card/60 border border-border/60 p-6 shadow-xl">
      <svg
        viewBox="0 0 500 380"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-auto"
        role="img"
        aria-label="Trash Picker and Value Picker trucks collecting street items"
      >
        <defs>
          <linearGradient id="greenBody" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#34d27a" />
            <stop offset="100%" stopColor="#1aa75a" />
          </linearGradient>
          <linearGradient id="amberBody" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#fbbf24" />
            <stop offset="100%" stopColor="#d97706" />
          </linearGradient>
          <linearGradient id="ground" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="hsl(var(--muted))" stopOpacity="0.35" />
            <stop offset="100%" stopColor="hsl(var(--muted))" stopOpacity="0" />
          </linearGradient>
          <marker
            id="arrowhead"
            markerWidth="10"
            markerHeight="10"
            refX="6"
            refY="5"
            orient="auto"
          >
            <path d="M0,0 L8,5 L0,10 z" fill="hsl(var(--foreground))" />
          </marker>
        </defs>

        {/* Ground shadow */}
        <ellipse cx="250" cy="320" rx="220" ry="14" fill="url(#ground)" />

        {/* ============ GREEN TRUCK (TRASH PICKER) — left, larger ============ */}
        <g transform="translate(20,150)">
          {/* Cargo box */}
          <rect x="60" y="20" width="130" height="90" rx="6" fill="url(#greenBody)" stroke="#0f5132" strokeWidth="2" />
          {/* Cargo panel lines */}
          <line x1="95" y1="28" x2="95" y2="102" stroke="#0f5132" strokeWidth="1.5" opacity="0.6" />
          <line x1="130" y1="28" x2="130" y2="102" stroke="#0f5132" strokeWidth="1.5" opacity="0.6" />
          <line x1="165" y1="28" x2="165" y2="102" stroke="#0f5132" strokeWidth="1.5" opacity="0.6" />
          {/* Recycling badge */}
          <circle cx="125" cy="65" r="18" fill="#ffffff" stroke="#0f5132" strokeWidth="2" />
          <path
            d="M118 60 l7 -10 l7 10 M132 70 l-3 11 l-11 -2 M114 73 l-3 -11 l11 -2"
            fill="none"
            stroke="#1aa75a"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          {/* Cab */}
          <path
            d="M190 50 L230 50 L245 75 L245 110 L190 110 Z"
            fill="url(#greenBody)"
            stroke="#0f5132"
            strokeWidth="2"
          />
          {/* Window */}
          <path d="M195 55 L228 55 L240 75 L195 75 Z" fill="#bae6fd" stroke="#0f5132" strokeWidth="2" />
          {/* Headlight */}
          <rect x="240" y="92" width="6" height="8" rx="1.5" fill="#fef3c7" stroke="#0f5132" strokeWidth="1.5" />
          {/* Bumper */}
          <rect x="58" y="108" width="190" height="6" rx="2" fill="#0f5132" />
          {/* Wheels */}
          <g>
            <circle cx="95" cy="118" r="14" fill="#1f2937" stroke="#0f5132" strokeWidth="2" />
            <circle cx="95" cy="118" r="5" fill="#9ca3af" />
            <circle cx="210" cy="118" r="14" fill="#1f2937" stroke="#0f5132" strokeWidth="2" />
            <circle cx="210" cy="118" r="5" fill="#9ca3af" />
          </g>
          {/* Label */}
          <rect x="70" y="40" width="110" height="14" rx="2" fill="#ffffff" opacity="0.92" />
          <text
            x="125"
            y="51"
            textAnchor="middle"
            fontFamily="ui-monospace, SFMono-Regular, Menlo, monospace"
            fontSize="10"
            fontWeight="700"
            letterSpacing="2"
            fill="#0f5132"
          >
            TRASH PICKER
          </text>

          {/* Speech bubble */}
          <g transform="translate(150,-40)">
            <rect x="0" y="0" width="150" height="40" rx="10" fill="#ffffff" stroke="hsl(var(--border))" strokeWidth="2" />
            <polygon points="30,40 40,40 32,52" fill="#ffffff" stroke="hsl(var(--border))" strokeWidth="2" />
            <polygon points="32,40 39,40 33,50" fill="#ffffff" />
            <text
              x="75"
              y="25"
              textAnchor="middle"
              fontFamily="ui-sans-serif, system-ui"
              fontSize="13"
              fontWeight="600"
              fill="#0f172a"
            >
              Lot of stuff here!
            </text>
          </g>
        </g>

        {/* ============ PILE OF ITEMS — center ============ */}
        <g transform="translate(245,235)">
          {/* Box */}
          <rect x="0" y="30" width="46" height="38" rx="3" fill="#b45309" stroke="#0f172a" strokeWidth="2" />
          <path d="M0 42 L46 42 M23 30 L23 68" stroke="#0f172a" strokeWidth="1.5" opacity="0.6" />
          {/* Sofa */}
          <g transform="translate(40,18)">
            <rect x="0" y="22" width="70" height="26" rx="5" fill="#94a3b8" stroke="#0f172a" strokeWidth="2" />
            <rect x="0" y="12" width="14" height="22" rx="4" fill="#cbd5e1" stroke="#0f172a" strokeWidth="2" />
            <rect x="56" y="12" width="14" height="22" rx="4" fill="#cbd5e1" stroke="#0f172a" strokeWidth="2" />
            <rect x="16" y="20" width="38" height="10" rx="3" fill="#cbd5e1" stroke="#0f172a" strokeWidth="2" />
          </g>
          {/* Lamp */}
          <g transform="translate(8,-30)">
            <path d="M0 30 L18 30 L14 8 L4 8 Z" fill="#fde68a" stroke="#0f172a" strokeWidth="2" />
            <line x1="9" y1="30" x2="9" y2="60" stroke="#0f172a" strokeWidth="2" />
            <ellipse cx="9" cy="62" rx="10" ry="3" fill="#0f172a" />
          </g>
        </g>

        {/* ============ CURVED ARROW from pile → yellow truck ============ */}
        <path
          d="M370 235 C 410 200, 430 200, 430 175"
          fill="none"
          stroke="hsl(var(--foreground))"
          strokeWidth="2.5"
          strokeLinecap="round"
          markerEnd="url(#arrowhead)"
        />
        <text
          x="420"
          y="225"
          fontFamily="ui-sans-serif, system-ui"
          fontSize="12"
          fontWeight="700"
          fill="hsl(var(--foreground))"
        >
          Let's Go!
        </text>

        {/* ============ YELLOW TRUCK (VALUE PICKER) — right, smaller ============ */}
        <g transform="translate(330,80)">
          {/* Cargo box (open-top junk hauler) */}
          <rect x="40" y="30" width="90" height="58" rx="4" fill="url(#amberBody)" stroke="#7c2d12" strokeWidth="2" />
          <line x1="65" y1="35" x2="65" y2="83" stroke="#7c2d12" strokeWidth="1.2" opacity="0.6" />
          <line x1="90" y1="35" x2="90" y2="83" stroke="#7c2d12" strokeWidth="1.2" opacity="0.6" />
          <line x1="115" y1="35" x2="115" y2="83" stroke="#7c2d12" strokeWidth="1.2" opacity="0.6" />
          {/* Cab */}
          <path
            d="M130 48 L160 48 L172 68 L172 88 L130 88 Z"
            fill="url(#amberBody)"
            stroke="#7c2d12"
            strokeWidth="2"
          />
          <path d="M134 52 L158 52 L168 68 L134 68 Z" fill="#bae6fd" stroke="#7c2d12" strokeWidth="2" />
          <rect x="167" y="76" width="5" height="7" rx="1" fill="#fef3c7" stroke="#7c2d12" strokeWidth="1.2" />
          {/* Bumper */}
          <rect x="38" y="86" width="138" height="5" rx="2" fill="#7c2d12" />
          {/* Wheels */}
          <circle cx="68" cy="94" r="11" fill="#1f2937" stroke="#7c2d12" strokeWidth="2" />
          <circle cx="68" cy="94" r="4" fill="#9ca3af" />
          <circle cx="148" cy="94" r="11" fill="#1f2937" stroke="#7c2d12" strokeWidth="2" />
          <circle cx="148" cy="94" r="4" fill="#9ca3af" />
          {/* Label */}
          <rect x="46" y="48" width="78" height="12" rx="2" fill="#ffffff" opacity="0.92" />
          <text
            x="85"
            y="57"
            textAnchor="middle"
            fontFamily="ui-monospace, SFMono-Regular, Menlo, monospace"
            fontSize="8.5"
            fontWeight="700"
            letterSpacing="1.8"
            fill="#7c2d12"
          >
            VALUE PICKER
          </text>
          {/* $ badge */}
          <circle cx="135" cy="38" r="12" fill="#ffffff" stroke="#7c2d12" strokeWidth="2" />
          <text
            x="135"
            y="43"
            textAnchor="middle"
            fontFamily="ui-sans-serif, system-ui"
            fontSize="14"
            fontWeight="800"
            fill="#b45309"
          >
            $
          </text>
        </g>
      </svg>
    </div>
  );
};

export default HeroIllustration;