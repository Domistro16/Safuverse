import { useRef, useState } from "react";
import { Nav } from "./nav";
import axios from "axios";
import { useWallet } from "@solana/wallet-adapter-react";
import ChatInterface from "./ChatInterface";

interface Card {
  title: string;
  description: string;
  gradient: string;
  class: string;
  icon: React.ReactElement;
  access?: boolean;
}

const cards: Card[] = [
  {
    title: "AI dApp Builder",
    description:
      "Build secure, production-ready dApps on any chain with AI-powered design, UX, and one-click deployment tools.",
    gradient: "from-[#FFB000] via-[#FFA500] to-[#FFD54F]",
    class: "funding",
    icon: <img src="/dApp.png" className="h-20 rounded-full" />,
  },
  {
    title: "Be The Replyooor",
    description:
      "Be the ultimate reply guy. Paste a tweet and get real, human-sounding replies that fit perfectly every time.",
    gradient: "from-pink-400 via-purple-500 to-indigo-600",
    class: "nft",
    icon: <img src="/replyoor.png" className="h-20 rounded-full" />,
  },
  {
    title: "Arcanum x402",
    description:
      "The meta-builder that guides anyone from idea to deployment. Designs, codes, tests, and documents x402 apps.",
    gradient: "from-[#FFB000] via-yellow-500 to-red-600",
    class: "meme",
    icon: <img src="/arcanum.png" className="h-20 rounded-full" />,
  },
  {
    title: "Predictus",
    description:
      "The AI architect for prediction markets. Builds Polymarket & Kalshi-powered apps across every chain.",
    gradient: "from-[#FFB000] via-yellow-500 to-red-600",
    class: "meme",
    icon: <img src="/predictus.png" className="h-20 rounded-full" />,
  },
  {
    title: "Crypto Persona Generator",
    description:
      "Helps you create a unique, authentic crypto persona with the perfect human tone and online voice.",
    gradient: "from-green-300 via-teal-400 to-emerald-600",
    class: "ambassador",
    icon: <img src="/crypto.png" className="h-20 rounded-full" />,
  },
  {
    title: "L3 Scanner",
    description:
      "AI security auditor for smart contracts and backend code that detects, explains, and reports vulnerabilities.",
    gradient: "from-blue-400 via-indigo-500 to-violet-600",
    class: "jobs",
    icon: <img src="/scanner.png" className="h-20 rounded-full" />,
  },
  {
    title: "Pitch Deck Generator",
    description:
      "Transform any Web3 or crypto project idea into a stunning, investor-ready pitch deck for fundraising success.",
    gradient: "from-[#00E5FF] via-[#0099FF] to-[#0066FF]",
    class: "defi",
    icon: <img src="/deck.png" className="h-20 rounded-full" />,
  },
  {
    title: "MemeCoin Lab",
    description:
      "Full-on degen AI strategist that builds, names, and launches viral memecoins that send to the moon!",
    gradient: "from-red-400 via-pink-500 to-fuchsia-600",
    class: "meme",
    icon: <img src="/memecoin.png" className="h-20 rounded-full" />,
  },
  {
    title: "Token Studio",
    description:
      "Designs detailed tokenomics systems with visual models, flow diagrams, and exportable whitepaper PDFs.",
    gradient: "from-[#FFB000] via-yellow-500 to-red-600",
    class: "meme",
    icon: <img src="/token.png" className="h-20 rounded-full" />,
  },
  {
    title: "Crypto Job Findooor",
    description:
      "Helps you find the perfect Web3 job in your blockchain or niche of choice, with smart coaching and insights.",
    gradient: "from-blue-400 via-blue-800 to-blue-900",
    class: "meme",
    icon: <img src="/search.png" className="h-20 rounded-full" />,
  },
  {
    title: "AI Website Builder",
    description:
      "Stack-agnostic web architect that designs, builds, brands, and deploys production-ready websites end-to-end.",
    gradient: "from-[#00E5FF] via-[#0099FF] to-[#0066FF]",
    class: "meme",
    icon: <img src="/website.png" className="h-20 rounded-full" />,
  },
];

export default function App() {
  const cardsRef = useRef<HTMLDivElement | null>(null);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const { publicKey } = useWallet();
  const [gpt, setGpt] = useState("Be the Replyooor");
  const handleScroll = () => {
    if (cardsRef.current) {
      cardsRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  let formatted: Card[] = cards;
  // Call the /api/verify endpoint to verify and update GPT access
  const verifyUser = async (gptAccess: string) => {
    setGpt(gptAccess);
    try {
      setLoading(true);
      const response = await axios.post(
        `${import.meta.env.VITE_API}/api/verify`,
        {
          publicKey: publicKey?.toBase58(),
          gpt: gptAccess,
        },
        {
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
      // Only log in development
      if (import.meta.env.DEV) {
        console.log('[Verification]', response.data);
      }
      if (response.data.access) {
        setOpen(true);
      } else {
        alert("Access denied. You do not have permission to use this GPT.");
      }
    } catch (err) {
      // Only log errors in development
      if (import.meta.env.DEV) {
        console.error('[Verification Error]', err);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white text-gray-900 font-sans">
      {/* Hero Section */}
      <div
        className="h-screen fixed z-10 bg-black/50 w-full flex justify-center items-center"
        hidden={!loading}
      >
        <img src="/small.png" className="h-30" />
      </div>
      <section className="text-center py-3 bg-gradient-to-b from-gray-50 to-gray-100">
        <Nav />
        <div className="py-20">
          <h1 className="text-5xl font-bold text-black mb-4">
            Explore the Future of On-Chain Intelligence
          </h1>
          <p className="text-gray-600 text-xl max-w-md md:max-w-2xl mx-auto mb-10">
            A new generation of crypto native agents built for builders,
            creators and degens. <br className="md:hidden" />
            Powered by $LVL
          </p>
          <button
            onClick={handleScroll}
            className="bg-[#FFB000] text-black font-semibold py-3 px-8 rounded-full shadow-lg hover:shadow-[#FFB000]/50 hover:bg-yellow-400 transition"
          >
            Get Started For Free
          </button>
        </div>
      </section>

      {/* GPT Cards Section */}
      <section
        ref={cardsRef}
        className="max-w-6xl mx-auto px-4 py-16 grid gap-10 sm:grid-cols-2 lg:grid-cols-3"
      >
        {formatted.map((card, index) => (
          <div
            key={index}
            className={`card ${card.class} rounded-2xl shadow-xl bg-white text-center overflow-hidden transition-transform duration-400 ease-in-out hover:-translate-y-2 hover:shadow-2xl`}
          >
            <div
              className={`gradient-header h-40 flex items-center justify-center bg-gradient-to-r ${card.gradient} animate-[gradientShift_8s_ease_infinite,breathe_6s_ease-in-out_infinite] relative overflow-hidden transition-transform duration-400 ease-in-out`}
            >
              <div className="p-6 rounded-full bg-white/20 mx-auto backdrop-blur-md">
                {card.icon}
              </div>
            </div>
            <div className="p-8">
              <h2 className="text-2xl font-bold mb-2 text-black">
                {card.title}
              </h2>
              <p className="text-gray-700 mb-6">{card.description}</p>
              <div className="flex justify-between items-center">
                <button
                  onClick={() => {
                    setGpt(card.title);
                    verifyUser(card.title);
                  }}
                  className={`border cursor-pointer border-black text-black mx-auto w-full" 
                   py-2 px-6 rounded-full font-semibold hover:bg-[#FFB000] hover:text-white transition`}
                >
                  Summon Agent
                </button>
              </div>
            </div>
          </div>
        ))}
      </section>
      {open && (
        <div className="fixed bg-black/40 inset-0 flex items-center justify-center z-50">
          <ChatInterface gpt={gpt} onClose={() => setOpen(false)} />
        </div>
      )}
      {/* Footer */}
      <footer className="text-center py-10 text-gray-500 border-t border-gray-200">
        <p>
          © 2025 Level 3 Labs. Powered by .safu. Building the future of learning
          and earning.
        </p>
      </footer>
    </div>
  );
}
