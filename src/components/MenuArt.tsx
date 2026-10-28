export function MenuArt() {
  return (
    <svg className="menu-art" viewBox="0 0 720 690" role="img" aria-label="Суровый чёрный кот с пистолетом окружён агрессивными утками">
      <defs>
        <radialGradient id="ground"><stop stopColor="#516b46"/><stop offset="1" stopColor="#2c4638"/></radialGradient>
        <filter id="shadow"><feDropShadow dx="0" dy="12" stdDeviation="8" floodOpacity=".35"/></filter>
      </defs>
      <ellipse cx="380" cy="370" rx="325" ry="280" fill="url(#ground)"/>
      <path d="M70 540 Q350 660 666 520" fill="none" stroke="#9bb36d" strokeOpacity=".16" strokeWidth="3" strokeDasharray="14 18"/>
      <g opacity=".96">
        <Duck x={130} y={205} scale={1.15} flip={false}/><Duck x={570} y={180} scale={.92} flip/>
        <Duck x={605} y={405} scale={1.22} flip/><Duck x={132} y={470} scale={.82}/>
        <Duck x={470} y={560} scale={.8} flip/><Duck x={295} y={115} scale={.7}/>
        <Duck x={75} y={340} scale={.65}/><Duck x={520} y={305} scale={.58} flip/>
      </g>
      <g transform="translate(345 368)" filter="url(#shadow)">
        <ellipse cx="0" cy="160" rx="130" ry="35" fill="#14261e" opacity=".35"/>
        <path d="M-72 90 Q-175 130 -160 15 Q-150 -35 -115 -8" fill="none" stroke="#14201d" strokeWidth="37" strokeLinecap="round"/>
        <ellipse cy="55" rx="91" ry="112" fill="#1c2925" stroke="#111b18" strokeWidth="8"/>
        <path d="M-77 -57 L-66 -144 L-13 -82 M77 -57 L66 -144 L13 -82" fill="#202e29" stroke="#111b18" strokeWidth="8" strokeLinejoin="round"/>
        <path d="M-61 -79 L-57 -120 L-30 -88 M61 -79 L57 -120 L30 -88" fill="#8b6264"/>
        <ellipse cy="-40" rx="90" ry="78" fill="#23312c" stroke="#111b18" strokeWidth="8"/>
        <ellipse cy="-8" rx="42" ry="24" fill="#3b4941"/>
        <path d="M-12 -18 L12 -18 L0 -3Z" fill="#c08380"/>
        <ellipse cx="-33" cy="-51" rx="21" ry="13" fill="#d9e66d" transform="rotate(9 -33 -51)"/>
        <ellipse cx="33" cy="-51" rx="21" ry="13" fill="#d9e66d" transform="rotate(-9 33 -51)"/>
        <path d="M-34 -62 V-41 M34 -62 V-41" stroke="#122019" strokeWidth="7"/>
        <path d="M-63 -79 L-15 -59 M63 -79 L15 -59" stroke="#101a17" strokeWidth="11" strokeLinecap="round"/>
        <path d="M-46 1 Q-95 -7 -107 -23 M-46 12 Q-93 17 -111 9 M46 1 Q95 -7 107 -23 M46 12 Q93 17 111 9" stroke="#9aa89a" strokeWidth="3" fill="none"/>
        <g transform="rotate(-12 55 50)">
          <rect x="25" y="26" width="170" height="47" rx="8" fill="#94a49a" stroke="#15231e" strokeWidth="8"/>
          <rect x="67" y="67" width="43" height="68" rx="6" fill="#4d5e53" stroke="#15231e" strokeWidth="8"/>
          <rect x="148" y="39" width="54" height="13" fill="#d1dbcf"/>
          <path d="M26 27 L-1 10 L-12 45 L27 56" fill="#5e7064" stroke="#15231e" strokeWidth="7"/>
        </g>
      </g>
      <g fill="#f3d86b" stroke="#716232" strokeWidth="2">
        <path d="M88 112 q-25 -35 8 -48 q29 26 -8 48Z"/><path d="M643 540 q-25 -35 8 -48 q29 26 -8 48Z"/>
        <path d="M245 596 q-25 -35 8 -48 q29 26 -8 48Z"/>
      </g>
    </svg>
  )
}

function Duck({ x, y, scale, flip = false }: { x: number; y: number; scale: number; flip?: boolean }) {
  return <g transform={`translate(${x} ${y}) scale(${flip ? -scale : scale} ${scale})`}>
    <ellipse cy="31" rx="43" ry="12" fill="#16281f" opacity=".3"/>
    <ellipse cy="0" rx="38" ry="30" fill="#e8edce" stroke="#293b30" strokeWidth="5"/>
    <ellipse cx="-16" cy="5" rx="21" ry="13" fill="#bdc89d" stroke="#293b30" strokeWidth="4" transform="rotate(-25)"/>
    <circle cx="24" cy="-25" r="24" fill="#edf0d4" stroke="#293b30" strokeWidth="5"/>
    <path d="M42 -27 L72 -17 L43 -8Z" fill="#eaa043" stroke="#293b30" strokeWidth="4"/>
    <circle cx="30" cy="-31" r="4" fill="#1d2c24"/><path d="M17 -42 L36 -35" stroke="#1d2c24" strokeWidth="5" strokeLinecap="round"/>
  </g>
}
