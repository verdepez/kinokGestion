import React, { useState, useEffect } from 'react';
import {
  Play,
  X,
  ArrowUpRight,
  Lock,
  Smartphone,
  Download,
  Film,
  Sparkles,
  Instagram,
  Mail,
  CheckCircle2,
  ShieldCheck,
  Maximize2,
} from 'lucide-react';

// Catálogo real de obras extraído de https://vimeo.com/kinokprod (User ID: 97608697 - Kinok / Nicolás Iriarte O'Ryan)
export const KINOK_VIMEO_WORKS = [
  {
    id: '870741943',
    title: 'NOTCO — MASTER 4K',
    rawTitle: 'NOTCO_MASTER_UHD_24FPS_4K',
    client: 'NotCo',
    category: 'comercial',
    categoryLabel: 'Comercial & Marcas',
    year: '2023',
    resolution: '4K UHD · 24FPS',
    duration: '02:50',
    location: 'Santiago, Chile',
    quote: '“LA INNOVACIÓN ALIMENTARIA CONTADA DESDE EL PULSO HUMANO Y EL RITMO CINEMATOGRÁFICO.”',
    description:
      'Pieza audiovisual masterizada en 4K UHD a 24 cuadros por segundo para NotCo. Dirección de fotografía de alto contraste, cámara en movimiento e identidad visual contemporánea.',
    thumbnail:
      'https://i.vimeocdn.com/video/1732928201-d7c48c086c8eb826f9731a7f0748b5e7f02fb51ac326a19e5befc74696bcf9f1-d_1280?region=us',
    vimeoUrl: 'https://vimeo.com/870741943',
    featured: true,
  },
  {
    id: '700493985',
    title: 'EL FARO DE INÍO — UN VIAJE AL SUR DE CHILOÉ',
    rawTitle: 'El Faro de Inío - Un viaje al sur de Chiloé - Master 4K',
    client: 'Documental Original Kinok',
    category: 'documental',
    categoryLabel: 'Documental & Territorio',
    year: '2022',
    resolution: '4K UHD · 24FPS',
    duration: '06:43',
    location: 'Parque Tantauco, Sur de Chiloé',
    quote: '“DONDE TERMINA EL MAPA COMIENZA LA LUZ: UN RELATO DOCUMENTAL EN EL EXTREMO AUSTRAL.”',
    description:
      'Cortometraje documental rodado en 4K en los confines del archipiélago de Chiloé. Una exploración íntima sobre el aislamiento, el territorio austral y la resistencia humana frente al océano.',
    thumbnail:
      'https://i.vimeocdn.com/video/1732887122-ab0864084096c613aadc768e6955405dc0d39725eba7a97227aa130028c2f75e-d_1280?region=us',
    vimeoUrl: 'https://vimeo.com/700493985',
    featured: true,
  },
  {
    id: '870742596',
    title: 'ODD — MASTER UHD 24FPS 4K',
    rawTitle: 'ODD_MASTER_UHD_24FPS_4K',
    client: 'ODD',
    category: 'comercial',
    categoryLabel: 'Comercial & Marcas',
    year: '2023',
    resolution: '4K UHD · 24FPS',
    duration: '02:42',
    location: 'Santiago, Chile',
    quote: '“ROMPER LA SIMETRÍA PARA ENCONTRAR UNA ESTÉTICA PROPIA.”',
    description:
      'Producción integral en formato 4K UHD (24fps). Montaje rítmico, encuadres angulares y diseño de color autoral.',
    thumbnail:
      'https://i.vimeocdn.com/video/1732928801-c9a3942e72236ba16ea385d9d4e965874c1a1cee5bb409c3ca167b29871f3b0c-d_1280?region=us',
    vimeoUrl: 'https://vimeo.com/870742596',
    featured: true,
  },
  {
    id: '870743281',
    title: 'DOAT — MASTER HD 25FPS',
    rawTitle: 'DOAT_MASTER_HD_25FPS_1080',
    client: 'DOAT',
    category: 'comercial',
    categoryLabel: 'Comercial & Marcas',
    year: '2023',
    resolution: 'Full HD · 25FPS',
    duration: '02:35',
    location: 'Santiago, Chile',
    quote: '“CADA CORTE ES UNA DECISIÓN DE LENGUAJE.”',
    description:
      'Pieza audiovisual dirigida por Nicolás Iriarte O’Ryan para DOAT. Narrativa ágil y dirección de arte minimalista.',
    thumbnail:
      'https://i.vimeocdn.com/video/1732923295-5b17a23d15468ffcd3e259c6a1ac8dab173fda87ccb53fbb4e1b0bc112abaa6d-d_1280?region=us',
    vimeoUrl: 'https://vimeo.com/870743281',
    featured: true,
  },
  {
    id: '769888069',
    title: 'GREENPEACE — NO MÁS SALMONERAS',
    rawTitle: 'Greenpeace - No más Salmoneras - 1 Min_Horizontal_Master.mp4',
    client: 'Greenpeace Chile',
    category: 'documental',
    categoryLabel: 'Documental & Territorio',
    year: '2022',
    resolution: 'Full HD · 16:9',
    duration: '00:59',
    location: 'Patagonia & Mares Australes',
    quote: '“CINE DE IMPACTO AMBIENTAL EN DEFENSA DE LOS ECOSISTEMAS PATAGÓNICOS.”',
    description:
      'Campaña audiovisual de concientización ambiental para Greenpeace Chile. Imágenes de fuerza documental y llamado urgente a la protección de las reservas marinas.',
    thumbnail:
      'https://i.vimeocdn.com/video/1545252332-59500bff8f1631bd42d1255ce85814e45ba8386e54ef86b1baab180cfc466a43-d_1280?region=us',
    vimeoUrl: 'https://vimeo.com/769888069',
    featured: true,
  },
  {
    id: '854485234',
    title: 'CHILE: LA MAGIA',
    rawTitle: '7_CHILE_LAMAGIA_1MIN_KVESP',
    client: 'Marca Chile / Turismo',
    category: 'documental',
    categoryLabel: 'Documental & Territorio',
    year: '2023',
    resolution: '4K UHD · 16:9',
    duration: '01:25',
    location: 'Chile',
    quote: '“UN RECORRIDO VISUAL POR LA GEOGRAFÍA EXTREMA Y LA IDENTIDAD DE CHILE.”',
    description:
      'Pieza cinematográfica en 4K UHD que retrata los paisajes, contrastes y energía cultural del territorio chileno.',
    thumbnail:
      'https://i.vimeocdn.com/video/1710476654-376bfd5455dbd73fc3b5ce3742c62de3906f30eab6eaa70e60ae11f349a88cfe-d_1280?region=us',
    vimeoUrl: 'https://vimeo.com/854485234',
  },
  {
    id: '816974995',
    title: 'PORTILLO — MASTER 4K',
    rawTitle: 'AA_PORTILLO_Master_4K',
    client: 'Portillo',
    category: 'documental',
    categoryLabel: 'Documental & Territorio',
    year: '2023',
    resolution: '4K UHD · 16:9',
    duration: '01:25',
    location: 'Cordillera de los Andes, Chile',
    quote: '“LA ESCALA MONUMENTAL DE LA CORDILLERA DE LOS ANDES EN 4K.”',
    description:
      'Rodaje de alta montaña en Portillo. Fotografía aérea y terrestre en 4K capturando la luz invernal de los Andes.',
    thumbnail:
      'https://i.vimeocdn.com/video/1732889274-ba524bea40c85cdcdd3ffda539e434d698f50778d53a0959f5db385a2983251c-d_1280?region=us',
    vimeoUrl: 'https://vimeo.com/816974995',
  },
  {
    id: '763963653',
    title: 'WOM — VAMOS WOMERS',
    rawTitle: 'WOM - VAMOS WOMERS - MASTER - LOV',
    client: 'WOM Chile',
    category: 'comercial',
    categoryLabel: 'Comercial & Marcas',
    year: '2022',
    resolution: 'Full HD · Master',
    duration: '02:04',
    location: 'Santiago, Chile',
    quote: '“ENERGÍA, CULTURA POP Y RITMO URBANO SIN FILTROS.”',
    description:
      'Pieza audiovisual para WOM Chile con sello dinámico, cámara en mano y montaje de alta velocidad.',
    thumbnail:
      'https://i.vimeocdn.com/video/1732882541-7a9aea9ee3efe053bd41381c4beea177c3fff329f705160bf5030b9b99599e9f-d_1280?region=us',
    vimeoUrl: 'https://vimeo.com/763963653',
  },
  {
    id: '845139054',
    title: 'AGUAS ANTOFAGASTA — MEMORIA INTEGRADA',
    rawTitle: 'Aguas Antofagasta - Memoria Integrada 2022 - Master',
    client: 'Aguas Antofagasta',
    category: 'corporativo',
    categoryLabel: 'Corporativo & Sostenibilidad',
    year: '2023',
    resolution: 'Full HD · Master',
    duration: '02:24',
    location: 'Desierto de Atacama & Antofagasta',
    quote: '“INFRAESTRUCTURA HÍDRICA Y COMUNIDAD EN EL DESIERTO MÁS ÁRIDO DEL MUNDO.”',
    description:
      'Documental corporativo sobre sostenibilidad hídrica y operación en la Región de Antofagasta.',
    thumbnail:
      'https://i.vimeocdn.com/video/1697498977-25aaa9cca9b6ae8e4d5dc0049eb88dfe5a4952922295f4e567a0b102fc803462-d_1280?region=us',
    vimeoUrl: 'https://vimeo.com/845139054',
  },
  {
    id: '824051516',
    title: 'CASAIDEAS — REPORTE SOSTENIBILIDAD',
    rawTitle: 'Reporte Sostenibilidad 2022_Casaideas_Master',
    client: 'Casaideas',
    category: 'corporativo',
    categoryLabel: 'Corporativo & Sostenibilidad',
    year: '2023',
    resolution: 'Full HD · Master',
    duration: '00:54',
    location: 'Santiago, Chile',
    quote: '“DISEÑO CONSCIENTE Y SOSTENIBILIDAD APLICADA AL HOGAR.”',
    description:
      'Pieza síntesis del Reporte de Sostenibilidad de Casaideas con dirección de arte cálida y narrativa clara.',
    thumbnail:
      'https://i.vimeocdn.com/video/1732885940-4c7cc8aad905434807c45261ab8fb47bd1e694ecf2f5c655d62aa9d6c89783ec-d_1280?region=us',
    vimeoUrl: 'https://vimeo.com/824051516',
  },
  {
    id: '788410111',
    title: 'AUTOEXPERTO — MANTENCIÓN 16:9',
    rawTitle: 'AutoExperto - Mantención - Master 16:9',
    client: 'AutoExperto',
    category: 'comercial',
    categoryLabel: 'Comercial & Marcas',
    year: '2023',
    resolution: 'Full HD · 16:9',
    duration: '01:00',
    location: 'Santiago, Chile',
    quote: '“PRECISIÓN TÉCNICA Y CONFIANZA EN FORMATO COMERCIAL.”',
    description:
      'Spot comercial 16:9 para plataforma automotriz AutoExperto, combinando storytelling directo y fotografía limpia.',
    thumbnail:
      'https://i.vimeocdn.com/video/1585508085-6656dae4b3adeb219ae115c199f06964204c434be6a276c5375505bf1ffba84b-d_1280?region=us',
    vimeoUrl: 'https://vimeo.com/788410111',
  },
  {
    id: '696311703',
    title: 'RANITA DE DARWIN — BIODIVERSIDAD',
    rawTitle: 'Ranita de Darwin - Horizontal',
    client: 'Conservación & Naturaleza',
    category: 'documental',
    categoryLabel: 'Documental & Territorio',
    year: '2022',
    resolution: 'Full HD · 16:9',
    duration: '00:55',
    location: 'Bosques Templados del Sur',
    quote: '“MICRO-FOTOGRAFÍA DOCUMENTAL EN EL CORAZÓN DEL BOSQUE NATIVO.”',
    description:
      'Cápsula de historia natural dedicada a la conservación de la Ranita de Darwin en los bosques húmedos del sur de Chile.',
    thumbnail:
      'https://i.vimeocdn.com/video/1408393714-7e42e91bbdf247b70ab3700a8333590c7f8eb67f572c338d3edcbe89934a9292-d_1280?region=us',
    vimeoUrl: 'https://vimeo.com/696311703',
  },
  {
    id: '689886021',
    title: 'SMU — DÍA MUNDIAL DEL SÍNDROME DE DOWN',
    rawTitle: 'SMU_Día Mundial del Síndrome de Down 2022_Versión Mediana_3MIN',
    client: 'SMU Chile',
    category: 'corporativo',
    categoryLabel: 'Corporativo & Sostenibilidad',
    year: '2022',
    resolution: 'Full HD · 16:9',
    duration: '03:12',
    location: 'Santiago, Chile',
    quote: '“HISTORIAS REALES DE INCLUSIÓN CON MIRADA DOCUMENTAL.”',
    description:
      'Cortometraje testimonial conmemorativo enfocado en inclusión laboral y diversidad humana.',
    thumbnail:
      'https://i.vimeocdn.com/video/1732881367-e36eb8e728285eae3c8748e83e53d33200aaea0efb46468ce59fa9032d856fb7-d_1280?region=us',
    vimeoUrl: 'https://vimeo.com/689886021',
  },
  {
    id: '727932450',
    title: 'ACADEMIA ÑAM — GASTRONOMÍA SOCIAL',
    rawTitle: 'promo_academia_ñam_-_50_segundos_-_master (1080p)',
    client: 'Festival Ñam',
    category: 'comercial',
    categoryLabel: 'Comercial & Marcas',
    year: '2022',
    resolution: 'Full HD · 1080p',
    duration: '00:48',
    location: 'Santiago, Chile',
    quote: '“LA COCINA COMO MOTOR DE CAMBIO CULTURAL Y ENCUENTRO.”',
    description:
      'Pieza promocional para Academia Ñam celebrando la gastronomía latinoamericana y la identidad local.',
    thumbnail:
      'https://i.vimeocdn.com/video/1732886494-f4942018afec8aa3d4bf3b3a3a8c3ad25b8908c85ec705febf7b5056e4d948e4-d_1280?region=us',
    vimeoUrl: 'https://vimeo.com/727932450',
  },
  {
    id: '658639347',
    title: 'BARBAZUL — BRAND FILM WEB',
    rawTitle: 'Barbazul - Video Web',
    client: 'Barbazul',
    category: 'comercial',
    categoryLabel: 'Comercial & Marcas',
    year: '2021',
    resolution: 'Full HD · 16:9',
    duration: '01:02',
    location: 'Santiago, Chile',
    quote: '“ATMÓSFERA NOCTURNA, TEXTURAS Y PULSO CINEMATOGRÁFICO.”',
    description:
      'Video web de marca para Barbazul con fotografía cálida de baja clave y montaje dinámico.',
    thumbnail:
      'https://i.vimeocdn.com/video/1330193537-25cb5c67f34753f78a5db5a4b8660ae135e481602a4ed983197a9572dde695b6-d_1280?region=us',
    vimeoUrl: 'https://vimeo.com/658639347',
  },
  {
    id: '624993496',
    title: '50 AÑOS — TERCERA COMPAÑÍA CBPA',
    rawTitle: '50 AÑOS - TERCERA COMPAÑIA - MASTER HD',
    client: 'Cuerpo de Bomberos Puente Alto',
    category: 'documental',
    categoryLabel: 'Documental & Territorio',
    year: '2021',
    resolution: 'Full HD · Master',
    duration: '05:04',
    location: 'Puente Alto, Chile',
    quote: '“MEDIO SIGLO DE VOCACIÓN Y MEMORIA COLECTIVA.”',
    description:
      'Documental histórico conmemorativo de los 50 años de servicio de la Tercera Compañía de Bomberos.',
    thumbnail:
      'https://i.vimeocdn.com/video/1267333172-20f481bfe78131020737ffe29ffc2207c90c291095ef28d77_1280?region=us',
    vimeoUrl: 'https://vimeo.com/624993496',
  },
];

const KINOK_PORTRAIT_URL =
  'https://i.vimeocdn.com/portrait/126732643_360x360?subrect=674%2C650%2C2219%2C2195&r=cover&sig=b133f6420003de9f94a17e112b4f653122523a1dd7ed8d6003d8d867c1299dc5&v=1&region=us';

// Ícono constructivista original inspirado en el emblema de davincis.digital/rbyba/
function ConstructivistEyeIcon({ className = 'w-6 h-6', fill = '#0BB2CB' }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0.5863 0.5859 34.8213 34.8213"
      fill="none"
      className={className}
      aria-hidden="true"
    >
      <path
        d="M33.4076 17.9971C33.4076 15.5999 32.8607 13.33 31.8842 11.3066V24.6855C32.8603 22.6625 33.4075 20.3938 33.4076 17.9971ZM29.8842 30.7158C28.7543 31.7722 27.4841 32.6796 26.1039 33.4072H29.8842V30.7158ZM6.1156 33.4072H9.89001C8.51224 32.6809 7.24387 31.7756 6.1156 30.7217V33.4072ZM10.4398 31.4287C12.3998 32.5338 14.6253 33.2221 16.9974 33.374V23.0303L10.4398 31.4287ZM18.9974 33.374C21.4058 33.2197 23.6633 32.5129 25.6449 31.3779L18.9974 22.9951V33.374ZM6.1156 27.8105C6.89345 28.7512 7.78077 29.5978 8.75818 30.3311L16.9974 19.7803V17.543H6.1156V27.8105ZM18.9974 19.7764L27.3177 30.2676C28.2647 29.5472 29.127 28.7213 29.8842 27.8047V17.543H18.9974V19.7764ZM21.5052 15.543H29.8842V9.67773L21.5052 15.543ZM6.1156 15.543H14.4886L6.1156 9.68164V15.543ZM16.9974 14.8564V9.23438H8.96423L16.9974 14.8564ZM18.9974 14.8555L27.0306 9.23438H18.9974V14.8555ZM17.9974 2.58594C13.6743 2.58594 9.7677 4.36715 6.96912 7.23438H29.0258C26.2272 4.36701 22.3206 2.58604 17.9974 2.58594ZM2.5863 17.9971C2.58636 20.3984 3.13587 22.6713 4.1156 24.6973V11.2949C3.13552 13.3212 2.5863 15.5952 2.5863 17.9971ZM35.4076 17.9971C35.4075 21.9414 34.0951 25.5788 31.8842 28.498V35.4072H4.1156V28.5049C1.90139 25.5844 0.586387 21.9446 0.586304 17.9971C0.586304 8.38137 8.38174 0.585938 17.9974 0.585938C27.613 0.58614 35.4076 8.3815 35.4076 17.9971Z"
        fill={fill}
      />
    </svg>
  );
}

// Reproductor Vimeo embebido bajo demanda con estética Readymag/rbyba
function RbybaVideoFrame({
  video,
  isPlaying,
  onPlay,
  onOpenCinema,
  rounded = 'rounded-[10px]',
  aspectClass = 'aspect-video',
}) {
  return (
    <div
      className={`group relative w-full overflow-hidden bg-[#0C0C0B] ${aspectClass} ${rounded} select-none`}
    >
      {isPlaying ? (
        <iframe
          src={`https://player.vimeo.com/video/${video.id}?autoplay=1&color=0bb2cb&title=0&byline=0&portrait=0`}
          title={video.title}
          className="h-full w-full border-0"
          allow="autoplay; fullscreen; picture-in-picture"
          allowFullScreen
        />
      ) : (
        <>
          <img
            src={video.thumbnail}
            alt={video.title}
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.03]"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/15 to-black/20 transition-opacity duration-300 group-hover:opacity-90" />

          {/* Etiqueta técnica superior */}
          <div className="absolute left-4 right-4 top-4 flex items-center justify-between gap-2 text-[10px] font-bold uppercase tracking-[0.14em] text-white/90">
            <span className="bg-black/60 px-2.5 py-1 backdrop-blur-sm">
              {video.client} · {video.year}
            </span>
            <span className="bg-[#015966] px-2.5 py-1 text-white">
              {video.resolution}
            </span>
          </div>

          {/* Botón central de Play idéntico al estilo Readymag rbyba */}
          <button
            type="button"
            onClick={() => onPlay(video.id)}
            aria-label={`Reproducir ${video.title}`}
            className="absolute inset-0 flex items-center justify-center focus:outline-none"
          >
            <span
              className="flex h-16 w-16 items-center justify-center rounded-full transition-transform duration-300 group-hover:scale-110 sm:h-20 sm:w-20"
              style={{
                background: 'radial-gradient(rgba(0, 0, 0, 0.55), rgba(0, 0, 0, 0) 70%)',
              }}
            >
              <span className="flex h-14 w-14 items-center justify-center rounded-full bg-[#015966] text-white shadow-[0_12px_35px_rgba(1,125,150,0.55)] transition-colors group-hover:bg-white group-hover:text-[#0C0C0B]">
                <Play className="ml-1 h-6 w-6 fill-current" />
              </span>
            </span>
          </button>

          {/* Pie del frame */}
          <div className=" pointer-events-none absolute bottom-4 left-4 right-4 flex items-end justify-between gap-3">
            <div>
              <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-[#0BB2CB]">
                VIMEO/{video.id} · {video.duration}
              </p>
              <h3
                className="mt-0.5 text-lg font-bold uppercase leading-tight tracking-tight text-white sm:text-2xl"
                style={{ fontFamily: "'Anton', 'Space Grotesk', sans-serif" }}
              >
                {video.title}
              </h3>
            </div>
            {onOpenCinema && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onOpenCinema(video);
                }}
                className="pointer-events-auto hidden items-center gap-1.5 bg-black/75 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-white backdrop-blur-sm transition hover:bg-[#015966] sm:inline-flex"
              >
                <Maximize2 className="h-3 w-3" />
                <span>Pantalla Completa</span>
              </button>
            )}
          </div>
        </>
      )}
    </div>
  );
}

export default function KinokLandingPage({
  onEnterSystem,
  deferredPrompt,
  onInstallPwa,
  isPwaInstalled,
}) {
  const [playingVideoId, setPlayingVideoId] = useState(null);
  const [cinemaVideo, setCinemaVideo] = useState(null);
  const [activeCategory, setActiveCategory] = useState('todos');
  const [isGatewayModalOpen, setIsGatewayModalOpen] = useState(false);
  const [accessPin, setAccessPin] = useState('');
  const [pinError, setPinError] = useState('');

  // Atajo oculto Alt+K o triple clic en el emblema para abrir la puerta de entrada al sistema PWA
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.altKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsGatewayModalOpen(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const filteredWorks =
    activeCategory === 'todos'
      ? KINOK_VIMEO_WORKS
      : KINOK_VIMEO_WORKS.filter((w) => w.category === activeCategory);

  const flagshipWork = KINOK_VIMEO_WORKS[0]; // NotCo 4K
  const caseStudy1 = KINOK_VIMEO_WORKS[1]; // El Faro de Inío Chiloé 4K
  const caseStudy2 = KINOK_VIMEO_WORKS[2]; // ODD 4K
  const caseStudy3 = KINOK_VIMEO_WORKS[4]; // Greenpeace
  const closingWork = KINOK_VIMEO_WORKS[3]; // DOAT

  const handleGatewaySubmit = (e) => {
    e.preventDefault();
    if (!accessPin.trim() || accessPin.trim() === '2026' || accessPin.trim().toLowerCase() === 'kinok') {
      setPinError('');
      setIsGatewayModalOpen(false);
      onEnterSystem('director');
    } else {
      setPinError('Código incorrecto. Usa "2026" o ingresa directo con el botón inferior.');
    }
  };

  return (
    <div className="min-h-screen bg-[#0C0C0B] text-[#0C0C0B] selection:bg-[#015966] selection:text-white">
      {/* =====================================================================
          SECCIÓN 1: HERO CONSTRUCTIVISTA EN NEGRO + VIDEO BACKGROUND DE KINOK
          Inspirado directamente en el bloque superior de https://davincis.digital/rbyba/
         ===================================================================== */}
      <section className="relative min-h-[94vh] w-full overflow-hidden bg-black text-white">
        {/* Video de fondo continuo desde Vimeo de Kinok (NotCo 4K / Reel) + Poster de respaldo */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden opacity-65">
          <img
            src={flagshipWork.thumbnail}
            alt="Kinok Showreel Background"
            className="h-full w-full object-cover object-center scale-105 filter contrast-125"
          />
          <iframe
            src="https://player.vimeo.com/video/870741943?background=1&autoplay=1&loop=1&byline=0&title=0&muted=1"
            title="Kinok Background Reel"
            className="absolute left-1/2 top-1/2 h-[56.25vw] min-h-full w-[177.77vh] min-w-full -translate-x-1/2 -translate-y-1/2 border-0"
            allow="autoplay; fullscreen"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/75 via-black/45 to-[#0C0C0B]" />
        </div>

        {/* Barra superior editorial estilo Readymag rbyba */}
        <header className="relative z-20 mx-auto flex max-w-[1160px] items-center justify-between px-5 pt-5 sm:px-8">
          {/* Izquierda: Sello Vimeo Oficial */}
          <a
            href="https://vimeo.com/kinokprod"
            target="_blank"
            rel="noreferrer"
            className="group flex items-center gap-2.5 border border-white/20 bg-black/50 px-3 py-2 text-[10px] font-bold uppercase tracking-[0.2em] text-white backdrop-blur-md transition hover:border-[#0BB2CB] hover:bg-[#015966]"
          >
            <span className="h-2 w-2 rounded-full bg-[#015966] group-hover:bg-white" />
            <span>VIMEO / KINOKPROD</span>
            <ArrowUpRight className="h-3.5 w-3.5" />
          </a>

          {/* Centro: Identificador de Estudio */}
          <div className="hidden items-center gap-3 text-[11px] font-bold uppercase tracking-[0.26em] text-white/80 md:flex">
            <span>NICOLÁS IRIARTE O&apos;RYAN</span>
            <span className="text-[#0BB2CB]">—</span>
            <span>SANTIAGO, CHILE</span>
          </div>

          {/* Derecha: Navegación + Puerta de Entrada Discreta a la PWA */}
          <div className="flex items-center gap-2 sm:gap-3">
            <a
              href="#obras"
              className="hidden text-[11px] font-bold uppercase tracking-[0.18em] text-white/80 transition hover:text-[#0BB2CB] sm:inline-block"
            >
              Obras (65)
            </a>
            <a
              href="#manifiesto"
              className="hidden text-[11px] font-bold uppercase tracking-[0.18em] text-white/80 transition hover:text-[#0BB2CB] sm:inline-block"
            >
              Manifiesto
            </a>
            <a
              href="#contacto"
              className="hidden text-[11px] font-bold uppercase tracking-[0.18em] text-white/80 transition hover:text-[#0BB2CB] sm:inline-block"
            >
              Contacto
            </a>

            {/* PUERTA DE ENTRADA AL SISTEMA INTERNO (PWA) */}
            <button
              type="button"
              onClick={() => setIsGatewayModalOpen(true)}
              title="Puerta de entrada a Kinok OS (Sistema Interno PWA)"
              className="group relative flex items-center gap-2 border border-[#0BB2CB]/60 bg-black/75 px-3 py-2 text-[10px] font-bold uppercase tracking-[0.18em] text-white backdrop-blur-md transition hover:bg-[#015966]"
            >
              <ConstructivistEyeIcon className="h-4 w-4 transition-transform group-hover:rotate-12" fill="currentColor" />
              <span>KINOK OS</span>
              <span className="rounded bg-[#015966] px-1 py-0.5 font-mono text-[8px] text-white group-hover:bg-black">
                PWA
              </span>
            </button>
          </div>
        </header>

        {/* Sello lateral vertical como en rbyba (left: 984px; top: 214px) */}
        <div className="pointer-events-none absolute right-4 top-1/3 z-20 hidden -rotate-90 transform items-center gap-2 border border-white/20 bg-black/70 px-3 py-1.5 font-mono text-[9px] uppercase tracking-[0.28em] text-white/70 lg:flex">
          <span>CINE-OJO · 4K UHD · SANTIAGO</span>
        </div>

        {/* Bloque Central Tipográfico Constructivista en Rojo #0BB2CB (Homólogo a RED BLUE YELLOW BLACK AGAIN) */}
        <div className="relative z-10 mx-auto flex min-h-[82vh] max-w-[1160px] flex-col items-center justify-center px-5 py-16 text-center sm:px-8">
          <p className="mb-4 font-mono text-[11px] font-semibold uppercase tracking-[0.35em] text-white/85">
            DIRECTOR &amp; VIDEO PRODUCER · SANTIAGO DE CHILE
          </p>

          <div className="relative inline-block">
            <h1
              className="select-none text-[17vw] font-normal uppercase leading-[0.83] tracking-[-0.03em] text-[#0BB2CB] sm:text-[118px] md:text-[148px]"
              style={{ fontFamily: "'Anton', 'Space Grotesk', sans-serif" }}
            >
              <span className="block">LUZ REAL</span>
              <span className="block">ENCUADRE</span>
              <span className="block">TERRITORIO</span>
              <span className="inline-flex items-baseline gap-3">
                <span>KINOK</span>
                <ConstructivistEyeIcon className="h-7 w-7 sm:h-11 sm:w-11" fill="#0BB2CB" />
              </span>
            </h1>
          </div>

          <p className="mt-6 max-w-xl text-sm font-medium tracking-wide text-white/90 sm:text-base">
            “Soy <strong>Nicolás Iriarte O&apos;Ryan</strong>, filmmaker de Santiago, Chile.{' '}
            <strong className="text-[#0BB2CB]">KINOK</strong> es el lugar donde realizamos todo lo
            que nos gusta.”
          </p>

          {/* Acciones del Hero */}
          <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
            <button
              type="button"
              onClick={() => setCinemaVideo(flagshipWork)}
              className="group flex items-center gap-3 bg-[#015966] px-7 py-4 text-xs font-bold uppercase tracking-[0.2em] text-white transition hover:bg-white hover:text-[#0C0C0B]"
            >
              <Play className="h-4 w-4 fill-current" />
              <span>Reproducir Reel 4K</span>
            </button>

            <a
              href="#obras"
              className="border border-white/35 bg-black/50 px-7 py-4 text-xs font-bold uppercase tracking-[0.2em] text-white backdrop-blur-sm transition hover:border-white hover:bg-white hover:text-[#0C0C0B]"
            >
              Explorar Archivo Vimeo
            </a>
          </div>
        </div>
      </section>

      {/* =====================================================================
          SECCIÓN 2: LIENZO EDITORIAL BLANCO (#FFFFFF) — ESTILO READYMAG RBYBA
         ===================================================================== */}
      <section id="manifiesto" className="relative bg-white text-[#0C0C0B]">
        <div className="mx-auto max-w-[1060px] px-5 pb-24 pt-16 sm:px-8 sm:pt-24">
          {/* Frame Hero Superpuesto con cita gigante en #0BB2CB como en rbyba (top: 629px / 814px) */}
          <div className="relative">
            <div className="overflow-hidden rounded-[2px] bg-[#0C0C0B] shadow-2xl">
              <RbybaVideoFrame
                video={flagshipWork}
                isPlaying={playingVideoId === flagshipWork.id}
                onPlay={setPlayingVideoId}
                onOpenCinema={setCinemaVideo}
                rounded="rounded-none"
              />
            </div>

            {/* Cita Manifiesto Constructivista #1 */}
            <div className="mt-12 text-center sm:mt-16">
              <h2
                className="mx-auto max-w-[980px] text-[42px] uppercase leading-[0.88] tracking-[-0.02em] text-[#0BB2CB] sm:text-[72px] md:text-[85px]"
                style={{ fontFamily: "'Anton', 'Space Grotesk', sans-serif" }}
              >
                &ldquo;¡EL CINE NO ES UN FORMATO! LA IMAGEN INERTE HA MUERTO. LA CÁMARA VIVA TOMA LA
                PALABRA.&rdquo;
              </h2>
            </div>
          </div>

          {/* Dos columnas editoriales exactas a rbyba (font-size: 20px, line-height: 28px, weight: 500) */}
          <div className="mt-14 grid grid-cols-1 gap-8 md:grid-cols-2 md:gap-12">
            <p className="text-[19px] font-medium leading-[28px] tracking-[-0.01em] text-[#0C0C0B]">
              <strong>KINOK</strong> nace en Santiago de Chile bajo la dirección del filmmaker{' '}
              <strong>Nicolás Iriarte O&apos;Ryan</strong>. Nuestro nombre rinde tributo directo a
              los <em>Kinoks (Cine-Ojo)</em>: realizadores que derribaron la puesta en escena
              artificial para capturar la vida, la industria, la naturaleza y las personas con una
              honestidad visual radical.
            </p>
            <p className="text-[19px] font-medium leading-[28px] tracking-[-0.01em] text-[#0C0C0B]">
              Cada producción refleja cómo evoluciona la percepción audiovisual en el tiempo,
              volviendo siempre a una pregunta profundamente autoral que permanece intacta:{' '}
              <strong>
                ¿cómo lograr que una pieza comercial o documental conserve el alma del cine?
              </strong>
            </p>
          </div>

          {/* Cita Bicolor #2 ("The Old Art is dead — the new art rises!" -> Kinok) */}
          <div className="mt-20 text-center sm:mt-28">
            <h2
              className="mx-auto max-w-[980px] text-[44px] uppercase leading-[0.88] tracking-[-0.02em] sm:text-[74px] md:text-[85px]"
              style={{ fontFamily: "'Anton', 'Space Grotesk', sans-serif" }}
            >
              <span className="text-[#0BB2CB]">
                &ldquo;EL GUION CONVENCIONAL QUEDÓ ATRÁS
                <br />
              </span>
              <span className="text-[#0C0C0B]">— LA NUEVA NARRATIVA SE LEVANTA!&rdquo;</span>
            </h2>

            <div className="mt-10 grid grid-cols-1 md:grid-cols-2">
              <div />
              <p className="text-left text-[19px] font-medium leading-[28px] tracking-[-0.01em] text-[#0C0C0B]">
                Desde campañas en 4K UHD para <strong>NotCo, WOM, ODD, DOAT y AutoExperto</strong>,
                hasta expediciones documentales junto a <strong>Greenpeace, Portillo</strong> y los
                confines australes de <strong>Chiloé</strong>, cada plano se diseña para sostener
                tensión, ritmo y verdad fotográfica.
              </p>
            </div>
          </div>

          {/* Video Full-Width #2 (El Faro de Inío - Chiloé 4K) */}
          <div className="mt-14 -mx-5 sm:mx-0">
            <RbybaVideoFrame
              video={caseStudy1}
              isPlaying={playingVideoId === caseStudy1.id}
              onPlay={setPlayingVideoId}
              onOpenCinema={setCinemaVideo}
              rounded="rounded-none sm:rounded-[4px]"
            />
          </div>

          {/* Título Constructivista "BASED ON ORIGINAL WORKS BY NICOLÁS IRIARTE O'RYAN" */}
          <div className="mt-24 text-center sm:mt-32">
            <h2
              className="text-[42px] uppercase leading-[0.88] tracking-[-0.02em] text-[#0C0C0B] sm:text-[72px] md:text-[85px]"
              style={{ fontFamily: "'Anton', 'Space Grotesk', sans-serif" }}
            >
              BASADO EN
              <br />
              OBRAS DE DIRECCIÓN &amp; FOTOGRAFÍA
              <br />
              POR <span className="text-[#0BB2CB]">NICOLÁS IRIARTE O&apos;RYAN</span>
            </h2>
          </div>

          <div className="mt-12 grid grid-cols-1 gap-8 md:grid-cols-2 md:gap-12">
            <p className="text-[19px] font-medium leading-[28px] tracking-[-0.01em] text-[#0C0C0B]">
              En cada proceso reestructuramos y estilizamos la imagen para formato 16:9 y 4K UHD,
              trabajando el etalonaje de color, la textura óptica y el diseño sonoro para alcanzar
              el máximo impacto expresivo sin perder la huella documental del rodaje en terreno.
            </p>
            <p className="text-[19px] font-medium leading-[28px] tracking-[-0.01em] text-[#0C0C0B]">
              Al montar cada secuencia buscamos un realismo fotográfico inigualable: ángulos
              decididos, luz natural intervenida con precisión y una cadencia que subraya la
              energía vital de quienes aparecen frente al lente.
            </p>
          </div>

          {/* =================================================================
              TRÍPTICO DE CASOS CON LÍNEAS TÉCNICAS #0BB2CB (IDÉNTICO A RBYBA)
             ================================================================= */}
          <div className="mt-20 space-y-24">
            {/* CASO 01: Miniatura Izquierda + Líneas L #0BB2CB + Video Derecha */}
            <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-12">
              <div className="flex flex-col items-start lg:col-span-3">
                <div
                  onClick={() => setCinemaVideo(caseStudy2)}
                  className="group relative h-[210px] w-[142px] cursor-pointer overflow-hidden rounded-[10px] bg-black shadow-md transition-transform duration-500 hover:scale-110"
                >
                  <img
                    src={caseStudy2.thumbnail}
                    alt={caseStudy2.title}
                    className="h-full w-full object-cover"
                  />
                  <div className="absolute inset-0 bg-black/20 group-hover:bg-transparent" />
                </div>

                <p className="mt-2.5 font-mono text-[9px] font-medium uppercase leading-[11px] tracking-[0.08em] text-[#0BB2CB]">
                  FOTOGRAFÍA ORIGINAL
                  <br />
                  RODAJE 24FPS
                </p>

                {/* Conector Técnico SVG en L (#0BB2CB) inspirado en rbyba lines 3871-4046 */}
                <div className="relative mt-2 hidden h-28 w-full lg:block">
                  <svg className="h-full w-full overflow-visible" fill="none">
                    <path
                      d="M 18 0 L 18 82 L 210 82"
                      stroke="#0BB2CB"
                      strokeWidth="1"
                    />
                    <circle cx="18" cy="0" r="2.5" fill="#0BB2CB" />
                    <circle cx="210" cy="82" r="2.5" fill="#0BB2CB" />
                  </svg>
                  <span className="absolute bottom-7 right-2 text-right font-mono text-[9px] font-medium uppercase leading-[11px] tracking-[0.08em] text-[#0BB2CB]">
                    MASTERIZACIÓN &amp;
                    <br />
                    CORTE FINAL 4K
                  </span>
                </div>
              </div>

              <div className="relative lg:col-span-9">
                <RbybaVideoFrame
                  video={caseStudy2}
                  isPlaying={playingVideoId === caseStudy2.id}
                  onPlay={setPlayingVideoId}
                  onOpenCinema={setCinemaVideo}
                  rounded="rounded-[10px]"
                />
              </div>
            </div>

            {/* CASO 02: Video Izquierda + Miniatura Derecha + Líneas L #0BB2CB */}
            <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-12">
              <div className="relative order-2 lg:order-1 lg:col-span-9">
                <RbybaVideoFrame
                  video={caseStudy3}
                  isPlaying={playingVideoId === caseStudy3.id}
                  onPlay={setPlayingVideoId}
                  onOpenCinema={setCinemaVideo}
                  rounded="rounded-[10px]"
                />
              </div>

              <div className="order-1 flex flex-col items-end text-right lg:order-2 lg:col-span-3">
                <div
                  onClick={() => setCinemaVideo(caseStudy3)}
                  className="group relative h-[210px] w-[142px] cursor-pointer overflow-hidden rounded-[10px] bg-black shadow-md transition-transform duration-500 hover:scale-110"
                >
                  <img
                    src={caseStudy3.thumbnail}
                    alt={caseStudy3.title}
                    className="h-full w-full object-cover"
                  />
                </div>

                <p className="mt-2.5 font-mono text-[9px] font-medium uppercase leading-[11px] tracking-[0.08em] text-[#0BB2CB]">
                  REGISTRO DOCUMENTAL
                  <br />
                  PATAGONIA CHILENA
                </p>

                <div className="relative mt-2 hidden h-28 w-full lg:block">
                  <svg className="h-full w-full overflow-visible" fill="none">
                    <path
                      d="M 210 0 L 210 82 L 10 82"
                      stroke="#0BB2CB"
                      strokeWidth="1"
                    />
                    <circle cx="210" cy="0" r="2.5" fill="#0BB2CB" />
                    <circle cx="10" cy="82" r="2.5" fill="#0BB2CB" />
                  </svg>
                  <span className="absolute bottom-7 left-4 text-left font-mono text-[9px] font-medium uppercase leading-[11px] tracking-[0.08em] text-[#0BB2CB]">
                    CAMPAÑA NACIONAL
                    <br />
                    GREENPEACE CHILE
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* =================================================================
              MÉTRICAS CONSTRUCTIVISTAS GIGANTES (COMO "50 ORIGINAL PHOTOS / 100 UNIQUE SCENES / 1000+ VIDEO GENERATIONS")
             ================================================================= */}
          <div className="mt-28 border-y border-[#0C0C0B]/10 py-14 sm:mt-36">
            <div className="grid grid-cols-1 gap-10 md:grid-cols-3">
              <div>
                <div
                  className="text-[64px] uppercase leading-[0.85] tracking-[-0.02em] text-[#0BB2CB] sm:text-[82px]"
                  style={{ fontFamily: "'Anton', 'Space Grotesk', sans-serif" }}
                >
                  65+
                </div>
                <div
                  className="mt-1 text-[42px] uppercase leading-[0.9] tracking-[-0.02em] text-[#0C0C0B] sm:text-[52px]"
                  style={{ fontFamily: "'Anton', 'Space Grotesk', sans-serif" }}
                >
                  PRODUCCIONES EN VIMEO
                </div>
              </div>

              <div>
                <div
                  className="text-[64px] uppercase leading-[0.85] tracking-[-0.02em] text-[#0BB2CB] sm:text-[82px]"
                  style={{ fontFamily: "'Anton', 'Space Grotesk', sans-serif" }}
                >
                  4K UHD
                </div>
                <div
                  className="mt-1 text-[42px] uppercase leading-[0.9] tracking-[-0.02em] text-[#0C0C0B] sm:text-[52px]"
                  style={{ fontFamily: "'Anton', 'Space Grotesk', sans-serif" }}
                >
                  FLUJO DE COLOR &amp; CINE
                </div>
              </div>

              <div>
                <div
                  className="text-[64px] uppercase leading-[0.85] tracking-[-0.02em] text-[#0BB2CB] sm:text-[82px]"
                  style={{ fontFamily: "'Anton', 'Space Grotesk', sans-serif" }}
                >
                  100%
                </div>
                <div
                  className="mt-1 text-[42px] uppercase leading-[0.9] tracking-[-0.02em] text-[#0C0C0B] sm:text-[52px]"
                  style={{ fontFamily: "'Anton', 'Space Grotesk', sans-serif" }}
                >
                  DIRECCIÓN AUTORAL
                </div>
              </div>
            </div>
          </div>

          {/* =================================================================
              ARCHIVO COMPLETO INTERACTIVO DE VIMEO.COM/KINOKPROD
             ================================================================= */}
          <div id="obras" className="mt-24 scroll-mt-12">
            <div className="flex flex-col justify-between gap-6 border-b-2 border-[#0C0C0B] pb-6 md:flex-row md:items-end">
              <div>
                <p className="font-mono text-[11px] font-bold uppercase tracking-[0.25em] text-[#0BB2CB]">
                  ARCHIVO OFICIAL · HTTPS://VIMEO.COM/KINOKPROD
                </p>
                <h2
                  className="mt-2 text-[44px] uppercase leading-[0.88] tracking-[-0.02em] text-[#0C0C0B] sm:text-[68px]"
                  style={{ fontFamily: "'Anton', 'Space Grotesk', sans-serif" }}
                >
                  OBRAS SELECCIONADAS
                </h2>
              </div>

              {/* Filtros constructivistas */}
              <div className="flex flex-wrap gap-1.5">
                {[
                  { id: 'todos', label: `TODOS (${KINOK_VIMEO_WORKS.length})` },
                  { id: 'comercial', label: 'COMERCIAL & MARCAS' },
                  { id: 'documental', label: 'DOCUMENTAL & TERRITORIO' },
                  { id: 'corporativo', label: 'CORPORATIVO & SOSTENIBILIDAD' },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setActiveCategory(tab.id)}
                    className={`px-3.5 py-2 font-mono text-[10px] font-bold uppercase tracking-[0.14em] transition ${
                      activeCategory === tab.id
                        ? 'bg-[#015966] text-white'
                        : 'bg-[#F4F4F4] text-[#0C0C0B] hover:bg-[#0C0C0B] hover:text-white'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Mosaico Editorial de Videos de Kinok */}
            <div className="mt-10 grid grid-cols-1 gap-8 md:grid-cols-2">
              {filteredWorks.map((work, index) => (
                <article
                  key={work.id}
                  className={`group flex flex-col justify-between border border-[#0C0C0B]/15 bg-[#FAFAFA] p-3 transition hover:border-[#0BB2CB] ${
                    index === 0 && activeCategory === 'todos' ? 'md:col-span-2' : ''
                  }`}
                >
                  <div>
                    <RbybaVideoFrame
                      video={work}
                      isPlaying={playingVideoId === work.id}
                      onPlay={setPlayingVideoId}
                      onOpenCinema={setCinemaVideo}
                      rounded="rounded-[6px]"
                    />

                    <div className="mt-4 flex items-start justify-between gap-4 px-1">
                      <div>
                        <div className="flex flex-wrap items-center gap-2 font-mono text-[10px] font-bold uppercase tracking-[0.15em] text-[#0BB2CB]">
                          <span>0{index + 1}</span>
                          <span>/</span>
                          <span>{work.categoryLabel}</span>
                          <span>·</span>
                          <span>{work.location}</span>
                        </div>
                        <h3
                          className="mt-1 text-2xl uppercase tracking-tight text-[#0C0C0B] sm:text-3xl"
                          style={{ fontFamily: "'Anton', 'Space Grotesk', sans-serif" }}
                        >
                          {work.title}
                        </h3>
                        <p className="mt-1.5 text-sm font-medium leading-relaxed text-[#0C0C0B]/80">
                          {work.description}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 flex items-center justify-between border-t border-[#0C0C0B]/10 px-1 pt-3 font-mono text-[10px] uppercase tracking-[0.15em] text-[#0C0C0B]/70">
                    <span>MASTER: {work.rawTitle}</span>
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() => setCinemaVideo(work)}
                        className="font-bold text-[#0C0C0B] underline decoration-[#0BB2CB] decoration-2 underline-offset-4 hover:text-[#0BB2CB]"
                      >
                        VER EN CINE
                      </button>
                      <a
                        href={work.vimeoUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 font-bold text-[#0BB2CB] hover:underline"
                      >
                        <span>VIMEO</span>
                        <ArrowUpRight className="h-3 w-3" />
                      </a>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </div>

          {/* =================================================================
              CIERRE DEL LIENZO BLANCO: "...EL HOMBRE CON LA CÁMARA" (COMO EN RBYBA LINE 6349)
             ================================================================= */}
          <div className="mt-28 text-center sm:mt-36">
            <h2
              className="text-[46px] uppercase leading-[0.88] tracking-[-0.02em] sm:text-[76px] md:text-[85px]"
              style={{ fontFamily: "'Anton', 'Space Grotesk', sans-serif" }}
            >
              <span className="text-[#0BB2CB]">...EL HOMBRE CON </span>
              <br />
              <span className="text-[#0C0C0B]">LA CÁMARA DE CINE</span>
            </h2>
            <p className="mx-auto mt-6 max-w-2xl text-[19px] font-medium leading-[28px] text-[#0C0C0B]">
              Cada proyecto de <strong>Kinok</strong> combina la mirada autoral en terreno con una
              ingeniería de producción rigurosa: desde la planificación de rodaje hasta la entrega
              masterizada en 4K.
            </p>
          </div>

          <div className="mt-12 -mx-5 sm:mx-0">
            <RbybaVideoFrame
              video={closingWork}
              isPlaying={playingVideoId === closingWork.id}
              onPlay={setPlayingVideoId}
              onOpenCinema={setCinemaVideo}
              rounded="rounded-none sm:rounded-[10px]"
            />
          </div>
        </div>
      </section>

      {/* =====================================================================
          SECCIÓN 3: BLOQUE FINAL ROJO BERMELLÓN (#0BB2CB) + PUERTA DE ENTRADA PWA
          Inspirado directamente en el cierre rojo de https://davincis.digital/rbyba/ (top: 7362px)
         ===================================================================== */}
      <footer id="contacto" className="relative bg-[#015966] text-[#F4F4F4]">
        <div className="mx-auto max-w-[1060px] px-5 py-20 sm:px-8 sm:py-28">
          <div className="text-center">
            <p className="text-lg font-medium tracking-wide text-[#F4F4F4]">
              Dirigido y producido por
            </p>
            <h2
              className="mt-2 text-[68px] uppercase leading-[0.84] tracking-[-0.03em] text-white sm:text-[112px] md:text-[136px]"
              style={{ fontFamily: "'Anton', 'Space Grotesk', sans-serif" }}
            >
              KINOK · CHILE
            </h2>
          </div>

          {/* Video destacado dentro del bloque rojo como en rbyba (line 7778) */}
          <div className="mx-auto mt-12 max-w-[840px] overflow-hidden rounded-[10px] shadow-2xl ring-1 ring-black/20">
            <RbybaVideoFrame
              video={KINOK_VIMEO_WORKS[6]} // Portillo 4K
              isPlaying={playingVideoId === KINOK_VIMEO_WORKS[6].id}
              onPlay={setPlayingVideoId}
              onOpenCinema={setCinemaVideo}
              rounded="rounded-[10px]"
            />
          </div>

          {/* Retrato del Director + Estampa Temporal Gigante ("2019—— —2026" homólogo a "1891—— —1956") */}
          <div className="relative mt-20 flex flex-col items-center justify-center text-center">
            <h3
              className="select-none text-[44px] uppercase leading-none tracking-[-0.02em] text-[#F4F4F4] sm:text-[78px] md:text-[85px]"
              style={{ fontFamily: "'Anton', 'Space Grotesk', sans-serif" }}
            >
              2019—— &nbsp; —2026
            </h3>

            <div className="-mt-6 overflow-hidden rounded-2xl border-4 border-white bg-[#0C0C0B] shadow-2xl sm:-mt-10">
              <img
                src={KINOK_PORTRAIT_URL}
                alt="Nicolás Iriarte O'Ryan — Director Kinok"
                className="h-44 w-36 object-cover contrast-110 sm:h-52 sm:w-44"
              />
            </div>

            <h4
              className="mt-6 text-3xl uppercase tracking-tight text-white sm:text-4xl"
              style={{ fontFamily: "'Anton', 'Space Grotesk', sans-serif" }}
            >
              NICOLÁS IRIARTE O&apos;RYAN
            </h4>
            <p className="mt-1 max-w-md text-sm font-medium text-white/90">
              Filmmaker · Director &amp; Video Producer · Santiago, Chile
            </p>

            {/* Enlaces de contacto reales del perfil Vimeo */}
            <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
              <a
                href="mailto:nicolas@kinok.cl"
                className="flex items-center gap-2 bg-[#0C0C0B] px-5 py-3 font-mono text-xs font-bold uppercase tracking-[0.16em] text-white transition hover:bg-white hover:text-[#0C0C0B]"
              >
                <Mail className="h-4 w-4" />
                <span>nicolas@kinok.cl</span>
              </a>
              <a
                href="https://www.instagram.com/nicoiriarte"
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-2 border border-white/40 bg-white/10 px-5 py-3 font-mono text-xs font-bold uppercase tracking-[0.16em] text-white transition hover:bg-white hover:text-[#0C0C0B]"
              >
                <Instagram className="h-4 w-4" />
                <span>@nicoiriarte</span>
              </a>
              <a
                href="https://vimeo.com/kinokprod"
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-2 border border-white/40 bg-white/10 px-5 py-3 font-mono text-xs font-bold uppercase tracking-[0.16em] text-white transition hover:bg-white hover:text-[#0C0C0B]"
              >
                <Film className="h-4 w-4" />
                <span>vimeo.com/kinokprod</span>
              </a>
            </div>
          </div>

          {/* Barra inferior con la Puerta de Entrada Escondida al Sistema PWA */}
          <div className="mt-20 flex flex-col items-center justify-between gap-4 border-t border-white/25 pt-8 text-xs sm:flex-row">
            <div className="flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.18em] text-white/85">
              <span>© KINOK PRODUCTORA AUDIOVISUAL</span>
              <span>·</span>
              <span>SANTIAGO, CHILE</span>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              {deferredPrompt && !isPwaInstalled && (
                <button
                  type="button"
                  onClick={onInstallPwa}
                  className="flex items-center gap-2 border border-white/50 bg-white/15 px-3.5 py-2 font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-white transition hover:bg-white hover:text-[#0C0C0B]"
                >
                  <Download className="h-3.5 w-3.5" />
                  <span>Instalar App PWA</span>
                </button>
              )}

              <button
                type="button"
                onClick={() => setIsGatewayModalOpen(true)}
                className="flex items-center gap-2 bg-[#0C0C0B] px-4 py-2.5 font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-white shadow-lg transition hover:bg-white hover:text-[#0C0C0B]"
              >
                <Lock className="h-3.5 w-3.5 text-[#0BB2CB]" />
                <span>Kinok OS · Acceso Interno (PWA)</span>
              </button>
            </div>
          </div>
        </div>
      </footer>

      {/* =====================================================================
          LIGHTBOX DE CINE PANTALLA COMPLETA (VIMEO EMBED)
         ===================================================================== */}
      {cinemaVideo && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 p-4 backdrop-blur-md sm:p-8"
        >
          <div className="w-full max-w-5xl">
            <div className="mb-3 flex items-center justify-between gap-4 text-white">
              <div>
                <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-[#0BB2CB]">
                  {cinemaVideo.client} · {cinemaVideo.resolution} · VIMEO/{cinemaVideo.id}
                </p>
                <h3
                  className="text-2xl uppercase tracking-tight sm:text-3xl"
                  style={{ fontFamily: "'Anton', 'Space Grotesk', sans-serif" }}
                >
                  {cinemaVideo.title}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setCinemaVideo(null)}
                className="flex items-center gap-1.5 border border-white/25 bg-white/10 px-3.5 py-2 font-mono text-xs uppercase tracking-wider text-white transition hover:bg-[#015966]"
              >
                <X className="h-4 w-4" />
                <span>Cerrar</span>
              </button>
            </div>

            <div className="aspect-video w-full overflow-hidden border border-white/15 bg-black shadow-2xl">
              <iframe
                src={`https://player.vimeo.com/video/${cinemaVideo.id}?autoplay=1&color=0bb2cb&title=0&byline=0&portrait=0`}
                title={cinemaVideo.title}
                className="h-full w-full border-0"
                allow="autoplay; fullscreen; picture-in-picture"
                allowFullScreen
              />
            </div>
          </div>
        </div>
      )}

      {/* =====================================================================
          MODAL PUERTA DE ENTRADA AL SISTEMA INTERNO ESCONDIDO (KINOK OS PWA)
         ===================================================================== */}
      {isGatewayModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="kinok-pwa-gateway-title"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4 backdrop-blur-md"
        >
          <div className="relative w-full max-w-md border-2 border-[#0BB2CB] bg-[#0C0C0B] p-6 text-white shadow-[0_25px_70px_rgba(1,125,150,0.35)] sm:p-7">
            <button
              type="button"
              onClick={() => setIsGatewayModalOpen(false)}
              className="absolute right-4 top-4 p-1.5 text-white/60 transition hover:bg-white/10 hover:text-white"
              aria-label="Cerrar acceso interno"
            >
              <X className="h-4 w-4" />
            </button>

            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center bg-[#015966] text-white">
                <ConstructivistEyeIcon className="h-6 w-6" fill="#FFFFFF" />
              </div>
              <div>
                <span className="font-mono text-[10px] font-bold uppercase tracking-[0.22em] text-[#0BB2CB]">
                  INTRANET &amp; SISTEMA INTERNO PWA
                </span>
                <h3
                  id="kinok-pwa-gateway-title"
                  className="text-2xl uppercase tracking-tight text-white"
                  style={{ fontFamily: "'Anton', 'Space Grotesk', sans-serif" }}
                >
                  KINOK OS — GESTIÓN DE PRODUCCIÓN
                </h3>
              </div>
            </div>

            <p className="mt-3 text-xs leading-relaxed text-zinc-300">
              Puerta de entrada privada al entorno operativo de <strong>Kinok</strong>. Desde aquí
              puedes abrir el sistema interno de cotizaciones, presupuestos y rodajes o instalarlo
              como <strong>Aplicación Web Progresiva (PWA)</strong> independiente en tu dispositivo.
            </p>

            {/* Estado PWA / Instalación */}
            <div className="mt-4 border border-white/15 bg-white/5 p-3.5">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-2.5">
                  <Smartphone className="mt-0.5 h-4 w-4 shrink-0 text-[#0BB2CB]" />
                  <div>
                    <p className="font-mono text-[11px] font-bold uppercase tracking-wider text-white">
                      Modo App Independiente (PWA)
                    </p>
                    <p className="mt-0.5 text-[11px] text-zinc-400">
                      {isPwaInstalled
                        ? 'Kinok OS ya está ejecutándose como aplicación instalada.'
                        : deferredPrompt
                        ? 'Tu navegador permite instalar Kinok OS directo en tu pantalla de inicio.'
                        : 'Al instalarla o abrir ?app=pwa, el sistema entra directo sin pasar por la landing.'}
                    </p>
                  </div>
                </div>
                {deferredPrompt && !isPwaInstalled && (
                  <button
                    type="button"
                    onClick={onInstallPwa}
                    className="shrink-0 bg-[#015966] px-3 py-1.5 font-mono text-[10px] font-bold uppercase tracking-wider text-white transition hover:bg-white hover:text-[#0C0C0B]"
                  >
                    Instalar
                  </button>
                )}
              </div>
            </div>

            {/* Formulario de Acceso Rápido por Rol */}
            <form onSubmit={handleGatewaySubmit} className="mt-5 space-y-4">
              <div>
                <label
                  htmlFor="kinok-pin-input"
                  className="block font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-zinc-400"
                >
                  Clave de productor (Opcional en demo · PIN: 2026)
                </label>
                <input
                  id="kinok-pin-input"
                  type="password"
                  value={accessPin}
                  onChange={(e) => setAccessPin(e.target.value)}
                  placeholder="Ingresa 2026 o presiona entrar..."
                  className="mt-1.5 w-full border border-white/20 bg-black px-3.5 py-2.5 font-mono text-xs text-white placeholder-zinc-500 focus:border-[#0BB2CB] focus:outline-none"
                />
                {pinError && (
                  <p className="mt-1.5 font-mono text-[11px] text-[#0BB2CB]">{pinError}</p>
                )}
              </div>

              <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                <button
                  type="submit"
                  className="flex items-center justify-center gap-2 bg-[#015966] px-4 py-3 font-mono text-xs font-bold uppercase tracking-[0.15em] text-white transition hover:bg-white hover:text-[#0C0C0B]"
                >
                  <ShieldCheck className="h-4 w-4" />
                  <span>Entrar como Director</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setIsGatewayModalOpen(false);
                    onEnterSystem('freelance');
                  }}
                  className="flex items-center justify-center gap-2 border border-white/25 bg-white/5 px-4 py-3 font-mono text-xs font-bold uppercase tracking-[0.15em] text-white transition hover:bg-white hover:text-[#0C0C0B]"
                >
                  <Sparkles className="h-4 w-4 text-amber-400" />
                  <span>Portal Freelance</span>
                </button>
              </div>
            </form>

            <div className="mt-4 flex items-center justify-between border-t border-white/10 pt-3 font-mono text-[10px] text-zinc-500">
              <span>ATAJO TECLADO: ALT + K</span>
              <span>START_URL: /?app=pwa</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

