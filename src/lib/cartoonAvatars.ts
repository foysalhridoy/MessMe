export interface CartoonAvatar {
  id: string;
  name: string;
  category: 'all' | 'characters' | 'animals' | 'fantasy';
  dataUri: string;
}

function svgToDataUri(svg: string): string {
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg.trim())}`;
}

export const CARTOON_AVATARS: CartoonAvatar[] = [
  // 1. Leo - Gamer Boy
  {
    id: 'gamer-leo',
    name: 'Leo (Gamer)',
    category: 'characters',
    dataUri: svgToDataUri(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100">
        <circle cx="50" cy="50" r="48" fill="#E0F2FE"/>
        <!-- Head -->
        <circle cx="50" cy="52" r="26" fill="#FCD34D"/>
        <!-- Hair -->
        <path d="M26 48 C26 30 36 22 50 22 C64 22 74 30 74 48 C68 40 60 38 50 38 C40 38 32 40 26 48 Z" fill="#78350F"/>
        <path d="M38 22 L42 28 L46 20 L50 28 L56 22 L54 32 Z" fill="#78350F"/>
        <!-- Eyes -->
        <circle cx="41" cy="50" r="3.5" fill="#1E293B"/>
        <circle cx="59" cy="50" r="3.5" fill="#1E293B"/>
        <circle cx="42" cy="49" r="1.2" fill="#FFFFFF"/>
        <circle cx="60" cy="49" r="1.2" fill="#FFFFFF"/>
        <!-- Smile -->
        <path d="M43 60 Q50 67 57 60" stroke="#B45309" stroke-width="2.5" stroke-linecap="round" fill="none"/>
        <!-- Blush -->
        <circle cx="34" cy="56" r="3.5" fill="#F87171" opacity="0.4"/>
        <circle cx="66" cy="56" r="3.5" fill="#F87171" opacity="0.4"/>
        <!-- Gaming Headset -->
        <path d="M22 50 A28 28 0 0 1 78 50" stroke="#0284C7" stroke-width="4.5" stroke-linecap="round" fill="none"/>
        <rect x="18" y="44" width="7" height="15" rx="3.5" fill="#0369A1"/>
        <rect x="75" y="44" width="7" height="15" rx="3.5" fill="#0369A1"/>
        <path d="M24 57 Q28 67 38 67" stroke="#0369A1" stroke-width="2.5" stroke-linecap="round" fill="none"/>
        <circle cx="39" cy="67" r="2.5" fill="#38BDF8"/>
      </svg>
    `),
  },

  // 2. Maya - Tech Girl
  {
    id: 'maya-tech',
    name: 'Maya (Tech)',
    category: 'characters',
    dataUri: svgToDataUri(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100">
        <circle cx="50" cy="50" r="48" fill="#F3E8FF"/>
        <!-- Hair Back & Bun -->
        <circle cx="50" cy="24" r="14" fill="#581C87"/>
        <circle cx="50" cy="52" r="28" fill="#581C87"/>
        <!-- Head -->
        <circle cx="50" cy="54" r="24" fill="#FDE68A"/>
        <!-- Hair Bangs -->
        <path d="M28 46 C32 36 42 34 50 36 C58 34 68 36 72 46 C68 40 58 39 50 41 C42 39 32 40 28 46 Z" fill="#581C87"/>
        <!-- Glasses -->
        <rect x="32" y="46" width="15" height="12" rx="4" fill="none" stroke="#0D9488" stroke-width="2.5"/>
        <rect x="53" y="46" width="15" height="12" rx="4" fill="none" stroke="#0D9488" stroke-width="2.5"/>
        <line x1="47" y1="52" x2="53" y2="52" stroke="#0D9488" stroke-width="2.5"/>
        <!-- Eyes inside glasses -->
        <circle cx="39.5" cy="52" r="2.5" fill="#1E293B"/>
        <circle cx="60.5" cy="52" r="2.5" fill="#1E293B"/>
        <circle cx="40.5" cy="51" r="0.9" fill="#FFFFFF"/>
        <circle cx="61.5" cy="51" r="0.9" fill="#FFFFFF"/>
        <!-- Smile -->
        <path d="M44 64 Q50 69 56 64" stroke="#B45309" stroke-width="2" stroke-linecap="round" fill="none"/>
        <!-- Blush -->
        <ellipse cx="33" cy="59" rx="3.5" ry="2" fill="#F43F5E" opacity="0.4"/>
        <ellipse cx="67" cy="59" rx="3.5" ry="2" fill="#F43F5E" opacity="0.4"/>
      </svg>
    `),
  },

  // 3. Byte - Cute Robot
  {
    id: 'byte-robot',
    name: 'Byte (Robot)',
    category: 'fantasy',
    dataUri: svgToDataUri(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100">
        <circle cx="50" cy="50" r="48" fill="#CFFAFE"/>
        <!-- Antenna -->
        <line x1="50" y1="26" x2="50" y2="15" stroke="#64748B" stroke-width="3" stroke-linecap="round"/>
        <circle cx="50" cy="13" r="4.5" fill="#F59E0B"/>
        <!-- Ears -->
        <rect x="20" y="44" width="6" height="14" rx="3" fill="#64748B"/>
        <rect x="74" y="44" width="6" height="14" rx="3" fill="#64748B"/>
        <!-- Head -->
        <rect x="24" y="26" width="52" height="48" rx="14" fill="#F8FAFC" stroke="#CBD5E1" stroke-width="2.5"/>
        <!-- Visor Screen -->
        <rect x="30" y="34" width="40" height="24" rx="8" fill="#0F172A"/>
        <!-- LED Eyes -->
        <circle cx="40" cy="46" r="4" fill="#06B6D4"/>
        <circle cx="60" cy="46" r="4" fill="#06B6D4"/>
        <circle cx="41" cy="45" r="1.5" fill="#FFFFFF"/>
        <circle cx="61" cy="45" r="1.5" fill="#FFFFFF"/>
        <!-- LED Mouth -->
        <path d="M43 63 Q50 67 57 63" stroke="#06B6D4" stroke-width="2.5" stroke-linecap="round" fill="none"/>
        <!-- Cheeks -->
        <circle cx="28" cy="56" r="2.5" fill="#38BDF8" opacity="0.6"/>
        <circle cx="72" cy="56" r="2.5" fill="#38BDF8" opacity="0.6"/>
      </svg>
    `),
  },

  // 4. Luna - Astronaut
  {
    id: 'luna-astronaut',
    name: 'Luna (Astronaut)',
    category: 'fantasy',
    dataUri: svgToDataUri(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100">
        <circle cx="50" cy="50" r="48" fill="#1E1B4B"/>
        <!-- Stars in background -->
        <circle cx="20" cy="25" r="1.5" fill="#FDE047"/>
        <circle cx="82" cy="30" r="1.2" fill="#FDE047"/>
        <circle cx="78" cy="78" r="1.5" fill="#FDE047"/>
        <circle cx="22" cy="75" r="1" fill="#FDE047"/>
        <!-- Suit Collar -->
        <ellipse cx="50" cy="80" rx="30" ry="12" fill="#E2E8F0"/>
        <rect x="42" y="74" width="16" height="5" rx="2" fill="#3B82F6"/>
        <!-- Helmet -->
        <circle cx="50" cy="48" r="30" fill="#F8FAFC" stroke="#CBD5E1" stroke-width="3"/>
        <!-- Visor -->
        <ellipse cx="50" cy="48" rx="22" ry="17" fill="#0284C7"/>
        <!-- Visor Glow Reflection -->
        <path d="M35 40 Q50 34 65 40 Q50 38 35 40 Z" fill="#BAE6FD" opacity="0.8"/>
        <!-- Friendly Face Reflection Inside Visor -->
        <circle cx="43" cy="48" r="2.5" fill="#FFFFFF"/>
        <circle cx="57" cy="48" r="2.5" fill="#FFFFFF"/>
        <path d="M46 56 Q50 59 54 56" stroke="#FFFFFF" stroke-width="2" stroke-linecap="round" fill="none"/>
        <!-- Audio Mic -->
        <circle cx="71" cy="52" r="3" fill="#64748B"/>
      </svg>
    `),
  },

  // 5. Felix - Cool Cat
  {
    id: 'felix-cat',
    name: 'Felix (Cool Cat)',
    category: 'animals',
    dataUri: svgToDataUri(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100">
        <circle cx="50" cy="50" r="48" fill="#FEF3C7"/>
        <!-- Ears -->
        <polygon points="26,45 22,18 42,32" fill="#F97316"/>
        <polygon points="28,40 26,24 38,32" fill="#FCA5A5"/>
        <polygon points="74,45 78,18 58,32" fill="#F97316"/>
        <polygon points="72,40 74,24 62,32" fill="#FCA5A5"/>
        <!-- Head -->
        <ellipse cx="50" cy="55" rx="28" ry="24" fill="#FB923C"/>
        <!-- Cheeks and Muzzle -->
        <ellipse cx="50" cy="62" rx="14" ry="10" fill="#FFF7ED"/>
        <!-- Nose -->
        <polygon points="48,58 52,58 50,61" fill="#F43F5E"/>
        <!-- Mouth -->
        <path d="M45 64 Q50 67 50 61 Q50 67 55 64" stroke="#7C2D12" stroke-width="1.8" stroke-linecap="round" fill="none"/>
        <!-- Whiskers -->
        <line x1="24" y1="58" x2="36" y2="60" stroke="#7C2D12" stroke-width="1.5" stroke-linecap="round"/>
        <line x1="22" y1="64" x2="35" y2="64" stroke="#7C2D12" stroke-width="1.5" stroke-linecap="round"/>
        <line x1="76" y1="58" x2="64" y2="60" stroke="#7C2D12" stroke-width="1.5" stroke-linecap="round"/>
        <line x1="78" y1="64" x2="65" y2="64" stroke="#7C2D12" stroke-width="1.5" stroke-linecap="round"/>
        <!-- Cool Sunglasses -->
        <polygon points="30,46 47,46 44,55 33,55" fill="#0F172A"/>
        <polygon points="53,46 70,46 67,55 56,55" fill="#0F172A"/>
        <line x1="47" y1="48" x2="53" y2="48" stroke="#0F172A" stroke-width="2.5"/>
        <!-- Glasses reflection -->
        <line x1="34" y1="48" x2="42" y2="53" stroke="#38BDF8" stroke-width="1.5" stroke-linecap="round"/>
        <line x1="57" y1="48" x2="65" y2="53" stroke="#38BDF8" stroke-width="1.5" stroke-linecap="round"/>
      </svg>
    `),
  },

  // 6. Chill Panda
  {
    id: 'chill-panda',
    name: 'Panda (Chill)',
    category: 'animals',
    dataUri: svgToDataUri(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100">
        <circle cx="50" cy="50" r="48" fill="#DCFCE7"/>
        <!-- Ears -->
        <circle cx="26" cy="30" r="10" fill="#1E293B"/>
        <circle cx="74" cy="30" r="10" fill="#1E293B"/>
        <!-- Head -->
        <circle cx="50" cy="54" r="28" fill="#FFFFFF" stroke="#E2E8F0" stroke-width="1.5"/>
        <!-- Eye Patches -->
        <ellipse cx="37" cy="50" rx="7.5" ry="9" fill="#1E293B" transform="rotate(-15 37 50)"/>
        <ellipse cx="63" cy="50" rx="7.5" ry="9" fill="#1E293B" transform="rotate(15 63 50)"/>
        <!-- Eyes -->
        <circle cx="38" cy="49" r="2.5" fill="#FFFFFF"/>
        <circle cx="62" cy="49" r="2.5" fill="#FFFFFF"/>
        <circle cx="38" cy="49" r="1.2" fill="#0F172A"/>
        <circle cx="62" cy="49" r="1.2" fill="#0F172A"/>
        <!-- Nose -->
        <ellipse cx="50" cy="59" rx="4" ry="2.8" fill="#1E293B"/>
        <!-- Mouth -->
        <path d="M46 64 Q50 67 54 64" stroke="#1E293B" stroke-width="2" stroke-linecap="round" fill="none"/>
        <!-- Rosy Cheeks -->
        <circle cx="28" cy="58" r="4.5" fill="#F43F5E" opacity="0.4"/>
        <circle cx="72" cy="58" r="4.5" fill="#F43F5E" opacity="0.4"/>
        <!-- Bamboo Sprig in mouth -->
        <path d="M52 64 Q62 66 70 60" stroke="#16A34A" stroke-width="2.5" stroke-linecap="round" fill="none"/>
        <path d="M66 61 Q72 56 68 53 Q64 57 66 61 Z" fill="#22C55E"/>
      </svg>
    `),
  },

  // 7. Cyber Ninja
  {
    id: 'cyber-ninja',
    name: 'Kage (Ninja)',
    category: 'fantasy',
    dataUri: svgToDataUri(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100">
        <circle cx="50" cy="50" r="48" fill="#0F172A"/>
        <!-- Hood Outline -->
        <circle cx="50" cy="50" r="29" fill="#1E293B"/>
        <!-- Headband -->
        <rect x="22" y="32" width="56" height="10" rx="3" fill="#334155"/>
        <!-- Metal Plate with Shuriken/Slash -->
        <rect x="40" y="33" width="20" height="8" rx="2" fill="#64748B"/>
        <path d="M47 37 L53 37" stroke="#38BDF8" stroke-width="2" stroke-linecap="round"/>
        <!-- Face Opening -->
        <rect x="27" y="42" width="46" height="18" rx="4" fill="#FDE68A"/>
        <!-- Glowing Cyber Eyes -->
        <ellipse cx="40" cy="50" rx="5" ry="3.5" fill="#0284C7"/>
        <ellipse cx="60" cy="50" rx="5" ry="3.5" fill="#0284C7"/>
        <ellipse cx="40" cy="50" rx="2.5" ry="1.5" fill="#E0F2FE"/>
        <ellipse cx="60" cy="50" rx="2.5" ry="1.5" fill="#E0F2FE"/>
        <!-- Ninja Face Mask Covering Mouth -->
        <path d="M26 58 C34 56 66 56 74 58 L71 78 C62 82 38 82 29 78 Z" fill="#090D16"/>
        <path d="M50 63 L50 75" stroke="#1E293B" stroke-width="2" stroke-linecap="round"/>
      </svg>
    `),
  },

  // 8. Wizard Milo
  {
    id: 'wizard-milo',
    name: 'Milo (Wizard)',
    category: 'fantasy',
    dataUri: svgToDataUri(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100">
        <circle cx="50" cy="50" r="48" fill="#312E81"/>
        <!-- Magic Sparks -->
        <circle cx="20" cy="30" r="1.5" fill="#FDE047"/>
        <circle cx="82" cy="40" r="2" fill="#FDE047"/>
        <circle cx="78" cy="75" r="1.5" fill="#FDE047"/>
        <!-- Head -->
        <circle cx="50" cy="56" r="24" fill="#FDE68A"/>
        <!-- White Hair & Beard -->
        <path d="M26 56 C26 72 38 82 50 82 C62 82 74 72 74 56" fill="#F8FAFC"/>
        <!-- Eyes -->
        <circle cx="41" cy="53" r="3" fill="#1E293B"/>
        <circle cx="59" cy="53" r="3" fill="#1E293B"/>
        <circle cx="42" cy="52" r="1" fill="#FFFFFF"/>
        <circle cx="60" cy="52" r="1" fill="#FFFFFF"/>
        <!-- Gentle Smile -->
        <path d="M45 64 Q50 68 55 64" stroke="#B45309" stroke-width="2" stroke-linecap="round" fill="none"/>
        <!-- Wizard Hat Brim -->
        <ellipse cx="50" cy="40" rx="34" ry="9" fill="#4338CA"/>
        <!-- Wizard Hat Cone -->
        <polygon points="50,10 32,38 68,38" fill="#4F46E5"/>
        <!-- Hat Ribbon & Golden Star -->
        <path d="M33 36 Q50 33 67 36 L68 39 Q50 36 32 39 Z" fill="#F59E0B"/>
        <polygon points="50,28 52,32 56,32 53,34 54,38 50,35 46,38 47,34 44,32 48,32" fill="#FDE047"/>
      </svg>
    `),
  },

  // 9. Sam - Beanie Skater
  {
    id: 'sam-skater',
    name: 'Sam (Skater)',
    category: 'characters',
    dataUri: svgToDataUri(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100">
        <circle cx="50" cy="50" r="48" fill="#FFEDD5"/>
        <!-- Head -->
        <circle cx="50" cy="54" r="24" fill="#FCD34D"/>
        <!-- Messy Hair Under Beanie -->
        <path d="M30 48 Q26 58 32 62" stroke="#451A03" stroke-width="3" stroke-linecap="round" fill="none"/>
        <path d="M70 48 Q74 58 68 62" stroke="#451A03" stroke-width="3" stroke-linecap="round" fill="none"/>
        <!-- Beanie Cap -->
        <ellipse cx="50" cy="40" rx="26" ry="16" fill="#EA580C"/>
        <rect x="25" y="36" width="50" height="9" rx="4" fill="#C2410C"/>
        <!-- Beanie fold lines -->
        <line x1="38" y1="37" x2="38" y2="44" stroke="#9A3412" stroke-width="1.5"/>
        <line x1="50" y1="37" x2="50" y2="44" stroke="#9A3412" stroke-width="1.5"/>
        <line x1="62" y1="37" x2="62" y2="44" stroke="#9A3412" stroke-width="1.5"/>
        <!-- Eyes -->
        <circle cx="41" cy="53" r="3.2" fill="#1E293B"/>
        <circle cx="59" cy="53" r="3.2" fill="#1E293B"/>
        <circle cx="42" cy="52" r="1.1" fill="#FFFFFF"/>
        <circle cx="60" cy="52" r="1.1" fill="#FFFFFF"/>
        <!-- Cheek Bandage -->
        <rect x="30" y="58" width="8" height="5" rx="1.5" fill="#FEF08A" stroke="#CA8A04" stroke-width="0.8" transform="rotate(-15 34 60)"/>
        <!-- Smirk -->
        <path d="M44 64 Q52 68 57 62" stroke="#9A3412" stroke-width="2.5" stroke-linecap="round" fill="none"/>
      </svg>
    `),
  },

  // 10. Zoe - Creative Artist
  {
    id: 'zoe-artist',
    name: 'Zoe (Artist)',
    category: 'characters',
    dataUri: svgToDataUri(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100">
        <circle cx="50" cy="50" r="48" fill="#FFE4E6"/>
        <!-- Teal Bob Hair -->
        <circle cx="50" cy="52" r="28" fill="#0D9488"/>
        <!-- Head -->
        <circle cx="50" cy="55" r="23" fill="#FDE68A"/>
        <!-- Hair Bangs -->
        <path d="M30 46 C34 38 44 38 50 40 C56 38 66 38 70 46 C64 42 56 42 50 43 C44 42 36 42 30 46 Z" fill="#0D9488"/>
        <!-- Beret Hat -->
        <ellipse cx="46" cy="32" rx="24" ry="12" fill="#F59E0B" transform="rotate(-10 46 32)"/>
        <circle cx="42" cy="21" r="2.5" fill="#D97706"/>
        <!-- Eyes with Cute Lashes -->
        <circle cx="41" cy="53" r="3.2" fill="#1E293B"/>
        <circle cx="59" cy="53" r="3.2" fill="#1E293B"/>
        <circle cx="42" cy="52" r="1.1" fill="#FFFFFF"/>
        <circle cx="60" cy="52" r="1.1" fill="#FFFFFF"/>
        <path d="M37 50 L35 48" stroke="#1E293B" stroke-width="1.5" stroke-linecap="round"/>
        <path d="M63 50 L65 48" stroke="#1E293B" stroke-width="1.5" stroke-linecap="round"/>
        <!-- Paint Smudge on Cheek -->
        <circle cx="34" cy="60" r="3.2" fill="#38BDF8" opacity="0.8"/>
        <circle cx="36" cy="62" r="2" fill="#EC4899" opacity="0.8"/>
        <!-- Smile -->
        <path d="M44 65 Q50 69 56 65" stroke="#B45309" stroke-width="2.2" stroke-linecap="round" fill="none"/>
      </svg>
    `),
  },

  // 11. Playful Fox
  {
    id: 'playful-fox',
    name: 'Kitsune (Fox)',
    category: 'animals',
    dataUri: svgToDataUri(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100">
        <circle cx="50" cy="50" r="48" fill="#FFF7ED"/>
        <!-- Large Fox Ears -->
        <polygon points="26,44 18,14 44,28" fill="#EA580C"/>
        <polygon points="27,38 23,20 38,28" fill="#FFFFFF"/>
        <polygon points="74,44 82,14 56,28" fill="#EA580C"/>
        <polygon points="73,38 77,20 62,28" fill="#FFFFFF"/>
        <!-- Head -->
        <polygon points="20,48 50,84 80,48 50,38" fill="#EA580C"/>
        <!-- White Fur Cheeks -->
        <polygon points="20,48 35,62 50,84 42,56" fill="#FFFFFF"/>
        <polygon points="80,48 65,62 50,84 58,56" fill="#FFFFFF"/>
        <!-- Black Nose -->
        <circle cx="50" cy="80" r="3.5" fill="#1E293B"/>
        <!-- Playful Eyes -->
        <path d="M34 50 Q41 46 44 51" stroke="#1E293B" stroke-width="3" stroke-linecap="round" fill="none"/>
        <path d="M66 50 Q59 46 56 51" stroke="#1E293B" stroke-width="3" stroke-linecap="round" fill="none"/>
        <!-- Whiskers -->
        <line x1="22" y1="58" x2="30" y2="60" stroke="#CBD5E1" stroke-width="1.5" stroke-linecap="round"/>
        <line x1="78" y1="58" x2="70" y2="60" stroke="#CBD5E1" stroke-width="1.5" stroke-linecap="round"/>
      </svg>
    `),
  },

  // 12. Nova - Friendly Alien
  {
    id: 'alien-nova',
    name: 'Nova (Alien)',
    category: 'fantasy',
    dataUri: svgToDataUri(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100">
        <circle cx="50" cy="50" r="48" fill="#EDE9FE"/>
        <!-- Antennae -->
        <path d="M42 32 Q32 20 28 22" stroke="#8B5CF6" stroke-width="3" stroke-linecap="round" fill="none"/>
        <circle cx="28" cy="22" r="4.5" fill="#C084FC"/>
        <path d="M58 32 Q68 20 72 22" stroke="#8B5CF6" stroke-width="3" stroke-linecap="round" fill="none"/>
        <circle cx="72" cy="22" r="4.5" fill="#C084FC"/>
        <!-- Head -->
        <ellipse cx="50" cy="54" rx="28" ry="24" fill="#A855F7"/>
        <!-- Big Cosmic Eyes -->
        <ellipse cx="37" cy="52" rx="7" ry="10" fill="#0F172A" transform="rotate(-10 37 52)"/>
        <ellipse cx="63" cy="52" rx="7" ry="10" fill="#0F172A" transform="rotate(10 63 52)"/>
        <!-- Eye Star Sparkles -->
        <circle cx="36" cy="48" r="2.8" fill="#F472B6"/>
        <circle cx="64" cy="48" r="2.8" fill="#F472B6"/>
        <circle cx="39" cy="54" r="1.2" fill="#FFFFFF"/>
        <circle cx="61" cy="54" r="1.2" fill="#FFFFFF"/>
        <!-- Small Sweet Smile -->
        <path d="M46 66 Q50 69 54 66" stroke="#FFFFFF" stroke-width="2.5" stroke-linecap="round" fill="none"/>
        <!-- Cheeks -->
        <circle cx="27" cy="58" r="3.5" fill="#F472B6" opacity="0.6"/>
        <circle cx="73" cy="58" r="3.5" fill="#F472B6" opacity="0.6"/>
      </svg>
    `),
  },

  // 13. Dino Rex - Baby Dino
  {
    id: 'baby-dino',
    name: 'Rex (Baby Dino)',
    category: 'animals',
    dataUri: svgToDataUri(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100">
        <circle cx="50" cy="50" r="48" fill="#ECFCCB"/>
        <!-- Dino Back Spikes -->
        <polygon points="50,18 44,28 56,28" fill="#EAB308"/>
        <polygon points="36,24 32,32 42,32" fill="#EAB308"/>
        <polygon points="64,24 58,32 68,32" fill="#EAB308"/>
        <!-- Head -->
        <ellipse cx="50" cy="54" rx="27" ry="24" fill="#84CC16"/>
        <!-- Snout -->
        <ellipse cx="50" cy="62" rx="19" ry="12" fill="#A3E635"/>
        <!-- Nostrils -->
        <circle cx="45" cy="58" r="1.8" fill="#4D7C0F"/>
        <circle cx="55" cy="58" r="1.8" fill="#4D7C0F"/>
        <!-- Big Cute Eyes -->
        <circle cx="38" cy="46" r="5" fill="#1E293B"/>
        <circle cx="62" cy="46" r="5" fill="#1E293B"/>
        <circle cx="39" cy="45" r="2" fill="#FFFFFF"/>
        <circle cx="63" cy="45" r="2" fill="#FFFFFF"/>
        <!-- Happy Open Mouth with Tiny Tooth -->
        <path d="M43 65 Q50 72 57 65 Z" fill="#991B1B"/>
        <polygon points="48,65 52,65 50,68" fill="#FFFFFF"/>
        <!-- Rosy Cheeks -->
        <circle cx="29" cy="56" r="3.5" fill="#F43F5E" opacity="0.4"/>
        <circle cx="71" cy="56" r="3.5" fill="#F43F5E" opacity="0.4"/>
      </svg>
    `),
  },

  // 14. Aria - Pop / Music Diva
  {
    id: 'aria-music',
    name: 'Aria (Music)',
    category: 'characters',
    dataUri: svgToDataUri(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100">
        <circle cx="50" cy="50" r="48" fill="#FCE7F3"/>
        <!-- Big Glam Hair -->
        <circle cx="50" cy="52" r="29" fill="#1E1B4B"/>
        <!-- Magenta Highlights -->
        <path d="M26 44 C28 60 22 72 32 76" stroke="#D946EF" stroke-width="3" stroke-linecap="round" fill="none"/>
        <path d="M74 44 C72 60 78 72 68 76" stroke="#D946EF" stroke-width="3" stroke-linecap="round" fill="none"/>
        <!-- Head -->
        <circle cx="50" cy="54" r="23" fill="#FDE68A"/>
        <!-- Star Eyes -->
        <polygon points="40,49 41,52 44,52 42,54 43,57 40,55 37,57 38,54 36,52 39,52" fill="#7C3AED"/>
        <polygon points="60,49 61,52 64,52 62,54 63,57 60,55 57,57 58,54 56,52 59,52" fill="#7C3AED"/>
        <!-- Lip Gloss Smile -->
        <path d="M44 65 Q50 70 56 65" stroke="#E11D48" stroke-width="2.5" stroke-linecap="round" fill="none"/>
        <!-- Pink Headphones -->
        <path d="M24 50 A26 26 0 0 1 76 50" stroke="#EC4899" stroke-width="4.5" stroke-linecap="round" fill="none"/>
        <rect x="20" y="44" width="6" height="15" rx="3" fill="#DB2777"/>
        <rect x="74" y="44" width="6" height="15" rx="3" fill="#DB2777"/>
      </svg>
    `),
  },

  // 15. Dexter - Hacker with Cyber Visor
  {
    id: 'dexter-hacker',
    name: 'Dex (Cyberpunk)',
    category: 'fantasy',
    dataUri: svgToDataUri(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100">
        <circle cx="50" cy="50" r="48" fill="#ECFDF5"/>
        <!-- Hoodie -->
        <circle cx="50" cy="54" r="28" fill="#064E3B"/>
        <!-- Face Inside Hoodie -->
        <circle cx="50" cy="54" r="22" fill="#FDE68A"/>
        <!-- Cyber Visor -->
        <polygon points="26,45 74,45 70,57 30,57" fill="#10B981"/>
        <line x1="30" y1="51" x2="70" y2="51" stroke="#A7F3D0" stroke-width="1.8" stroke-dasharray="3,2"/>
        <!-- Cool Smile -->
        <path d="M45 65 Q50 68 55 64" stroke="#065F46" stroke-width="2.2" stroke-linecap="round" fill="none"/>
        <!-- Earbud -->
        <circle cx="28" cy="54" r="2.5" fill="#10B981"/>
      </svg>
    `),
  },

  // 16. Superhero Max
  {
    id: 'super-max',
    name: 'Hero (Max)',
    category: 'fantasy',
    dataUri: svgToDataUri(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100">
        <circle cx="50" cy="50" r="48" fill="#E0E7FF"/>
        <!-- Hair with Superhero Curl -->
        <circle cx="50" cy="46" r="26" fill="#1E293B"/>
        <path d="M48 24 Q55 24 53 32 Q49 32 48 24 Z" fill="#1E293B"/>
        <!-- Head -->
        <circle cx="50" cy="54" r="24" fill="#FCD34D"/>
        <!-- Superhero Domino Mask -->
        <path d="M26 46 Q50 42 74 46 Q68 58 58 56 Q50 50 42 56 Q32 58 26 46 Z" fill="#DC2626"/>
        <!-- Eyes Cutout in Mask -->
        <ellipse cx="38" cy="49" rx="4" ry="2.5" fill="#FFFFFF"/>
        <ellipse cx="62" cy="49" rx="4" ry="2.5" fill="#FFFFFF"/>
        <circle cx="39" cy="49" r="1.8" fill="#1E293B"/>
        <circle cx="61" cy="49" r="1.8" fill="#1E293B"/>
        <!-- Confident Smile -->
        <path d="M43 64 Q50 70 57 64" stroke="#991B1B" stroke-width="2.5" stroke-linecap="round" fill="none"/>
      </svg>
    `),
  },
];
