import React, { useState, useRef, useEffect } from "react";
import { Send, Loader2, ArrowLeftIcon, Sparkles } from "lucide-react";
import { useAccount } from "wagmi";

interface Message {
  role: "user" | "assistant";
  content: string;
}
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
    icon: <img src="/dAppb.png" className="h-20 rounded-full" />,
  },
  {
    title: "Be The Replyooor",
    description:
      "Be the ultimate reply guy. Paste a tweet and get real, human-sounding replies that fit perfectly every time.",
    gradient: "from-pink-400 via-purple-500 to-indigo-600",
    class: "nft",
    icon: <img src="/replyoorb.png" className="h-20 rounded-full" />,
  },
  {
    title: "Crypto Persona Generator",
    description:
      "Helps you create a unique, authentic crypto persona with the perfect human tone and online voice.",
    gradient: "from-green-300 via-teal-400 to-emerald-600",
    class: "ambassador",
    icon: <img src="/cryptob.png" className="h-20 rounded-full" />,
  },
  {
    title: "L3 Scanner",
    description:
      "AI security auditor for smart contracts and backend code that detects, explains, and reports vulnerabilities.",
    gradient: "from-blue-400 via-indigo-500 to-violet-600",
    class: "jobs",
    icon: <img src="/scannerb.png" className="h-20 rounded-full" />,
  },
  {
    title: "Pitch Deck Generator",
    description:
      "Transform any Web3 or crypto project idea into a stunning, investor-ready pitch deck for fundraising success.",
    gradient: "from-[#00E5FF] via-[#0099FF] to-[#0066FF]",
    class: "defi",
    icon: <img src="/deckb.png" className="h-20 rounded-full" />,
  },
  {
    title: "MemeCoin Lab",
    description:
      "Full-on degen AI strategist that builds, names, and launches viral memecoins that send to the moon!",
    gradient: "from-red-400 via-pink-500 to-fuchsia-600",
    class: "meme",
    icon: <img src="/memecoinb.png" className="h-20 rounded-full" />,
  },
  {
    title: "Token Studio",
    description:
      "Designs detailed tokenomics systems with visual models, flow diagrams, and exportable whitepaper PDFs.",
    gradient: "from-[#FFB000] via-yellow-500 to-red-600",
    class: "meme",
    icon: <img src="/tokenb.png" className="h-20 rounded-full" />,
  },
  {
    title: "Grant & Funding Findoor",
    description:
      "Web3 funding expert that finds active crypto grants, analyzes fit, and helps builders actually secure funding fast",
    gradient: "from-green-400 via-green-800 to-black",
    class: "meme",
    icon: <img src="/grantb.png" className="h-20 rounded-full" />,
  },
  {
    title: "Crypto Job Findooor",
    description:
      "Helps you find the perfect Web3 job in your blockchain or niche of choice, with smart coaching and insights.",
    gradient: "from-blue-400 via-blue-800 to-blue-900",
    class: "meme",
    icon: <img src="/searchb.png" className="h-20 rounded-full" />,
  },
  {
    title: "AI Website Builder",
    description:
      "Stack-agnostic web architect that designs, builds, brands, and deploys production-ready websites end-to-end.",
    gradient: "from-[#00E5FF] via-[#0099FF] to-[#0066FF]",
    class: "meme",
    icon: <img src="/website.png" className="h-20 rounded-full" />,
  },
  {
    title: "Arcanum x402",
    description:
      "The meta-builder that guides anyone from idea to deployment. Designs, codes, tests, and documents x402 apps.",
    gradient: "from-[#FFB000] via-yellow-500 to-red-600",
    class: "meme",
    icon: <img src="/arcanumb.png" className="h-20 rounded-full" />,
  },
  {
    title: "Predictus",
    description:
      "The AI architect for prediction markets. Builds Polymarket & Kalshi-powered apps across every chain.",
    gradient: "from-[#FFB000] via-yellow-500 to-red-600",
    class: "meme",
    icon: <img src="/predictusb.png" className="h-20 rounded-full" />,
  },
];

// Suggested prompts for each GPT
const promptSuggestions: { [key: string]: string[] } = {
  "Crypto Job Findooor": [
    "Find me the latest Solana developer jobs",
    "Analyze my CV and tell me my skill gaps for a DeFi engineer role",
    "Suggest a portfolio project to strengthen my Web3 resume",
    "Enable coach mode and send me weekly job insights",
  ],
  "Be The Replyooor": [
    "Reply to this tweet: \"I can't believe it's Monday again.\"",
    'This tweet is blowing up: "AI is the new electricity." Write replies',
    'Thread reply: The first tweet says "I quit my job today."',
    "Here's my tweet, make replies that sound like me",
  ],
  "L3 Scanner": [
    "Audit my solidity contract using the latest 2025 standards",
    "Run a GitHub PR scan and generate a standard based report",
    "Simulate new exploit scenario for this code",
    "Generate a version-stamped compliance audit report",
  ],
  "AI dApp Builder": [
    "Build me a DEX with fee-sharing and governance",
    "Create an NFT marketplace like Magic Eden",
    "I want to launch a memecoin launchpad with a bonding curve",
    "Generate a DAO with staking and treasury management",
  ],
  "Pitch Deck Generator": [
    "Create a Web3 pitch deck for my multichain NFT platform. Palette: teal and green",
    "Generate a Binance Labs style deck for a gaming metaverse project",
    "Turn this text into 10 slides MVB ready deck with orange and blue accents",
    "Add infographics for tokenomics and roadmap",
  ],
  "Token Studio": [
    "Create a full tokenomics model",
    "Generate allocation and emission charts",
    "Export whitepaper PDF",
    "Visualize token reward flow",
  ],
  "Crypto Persona Generator": [
    "Help me define my crypto tone and voice",
    "Create a hybrid persona from two archetypes",
    "Show how my tweet sounds across tone and modes",
    "Build a complete persona kit for my CT identity",
  ],
  "MemeCoin Lab": [
    "Make a BNB Chain memecoin that can go viral",
    "Generate a memecoin inspired by cats and degens",
    "Give me 3 meme visuals for my $HOPIUM token",
    "Whats the most funny memecoin I can create right now?",
  ],
  "AI Website Builder": [
    "Build a modern landing page with pricing contact form",
    "Design and code a full portfolio website with dark mode",
    "Create a blog site with SEO and deploy it to Vercel",
    "Rebuild this website from the provided link and improve performance",
  ],
  "Grant & Funding Findoor": [
    "Suggest the best chain for a education startup focused on DAOs",
    "Alert me for new DePIN or RWA grants on Base and Polygon",
    "Analyze my proposal for tone and clarity",
    "Show AI related grants with deadline I can export to Notion",
  ],
  "Arcanum x402": [
    "Create a platform where agents list skills, complete tasks for crypto, and auto-settle payments through smart contracts.",
    "Build an on-chain payment system that lets one AI agent pay another for API calls or model access, with escrow and receipts.Alert me for new DePIN or RWA grants on Base and Polygon",
    "Design a protocol where agents can register, verify reputation, and get paid in USDC for completing jobs across chains.",
    "Develop a settlement hub that routes payments between Solana, Base, and BNB agents using CCIP or Wormhole for atomic transfers.",
  ],
  Predictus: [
    "Create a dashboard that tracks Polymarket and Kalshi odds for BTC, ETH, and macro events — with real-time charts and wallet login.",
    "Design a DeFi vault that reallocates liquidity based on Polymarket probabilities — yield when you’re right, hedge when you’re not.",
    "Build a play-to-earn prediction game where users stake on crypto narratives using Kalshi data, earning XP and token rewards for accuracy.",
    "Generate an oracle that brings Polymarket & Kalshi event outcomes on-chain for BNB and Polygon dApps — with verification scripts.",
  ],
};

export default function ChatInterface({
  gpt = "Be The Replyooor",
  onClose,
}: {
  gpt: string;
  onClose?: () => void;
}) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLTextAreaElement | null>(null);
  const { address } = useAccount();

  // Example user info (you can replace this with wallet/auth data)
  const profile = {
    id: address,
    name: "Desmond",
    prefs: { tone: "gen-z" },
  };

  // Get suggested prompts for current GPT
  const suggestions = promptSuggestions[gpt] || [];

  // Auto-scroll when new messages appear
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Send message to Express API
  const sendMessage = async (messageContent?: string) => {
    const content = messageContent || inputValue.trim();
    if (!content || isLoading) return;

    const userMessage: Message = { role: "user", content };
    setMessages((prev) => [...prev, userMessage]);
    setInputValue("");
    setIsLoading(true);

    try {
      const conversationHistory = [...messages, userMessage];
      const payload = {
        profile,
        messages: conversationHistory,
        gpt,
        publicKey: address,
      };

      const res = await fetch(`${import.meta.env.VITE_API}/api/assistant`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": import.meta.env.VITE_KEY,
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error(`Server ${res.status}`);
      const body = await res.json();

      const assistantMsg: Message = {
        role: "assistant",
        content: body.reply || "No reply",
      };
      setMessages((prev) => [...prev, assistantMsg]);
    } catch (err) {
      console.error(err);
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "⚠️ Something went wrong — please try again.",
        },
      ]);
    } finally {
      setIsLoading(false);
      inputRef.current?.focus();
    }
  };

  // Handle clicking a suggested prompt
  const handleSuggestionClick = (suggestion: string) => {
    sendMessage(suggestion);
  };

  // Handle Enter key for sending
  const handleKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="flex flex-col h-[95%] shadow-xl w-full rounded-lg rotate-y-10 bg-gradient-to-br from-slate-50 to-slate-100 ">
      {/* Header */}
      <div className="flex p-3 gap-3 pl-10 items-center border-b border-slate-200">
        <ArrowLeftIcon
          onClick={() => {
            setMessages([]);
            setInputValue("");
            onClose && onClose();
          }}
          size={30}
          className="cursor-pointer"
        />
        {cards.filter((card) => card.title == gpt)[0]?.icon}

        <h1 className="text-xl font-bold">{gpt}</h1>
      </div>

      {/* Chat display area */}
      <div className="flex-1 overflow-y-auto">
        <div className="mx-auto px-4 py-6">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center py-12">
              <div className="mb-8">
                <div className="w-16 h-16 bg-black rounded-2xl flex items-center justify-center mb-4 mx-auto">
                  <Sparkles className="w-8 h-8 text-[#FFB000]" />
                </div>
                <h2 className="text-2xl font-semibold text-slate-800 mb-2">
                  Start a conversation with {gpt}
                </h2>
                <p className="text-slate-500 mb-8">
                  Try one of these prompts or ask anything
                </p>
              </div>

              {/* Suggested Prompts */}
              {suggestions.length > 0 && (
                <div className="w-full max-w-3xl grid grid-cols-1 md:grid-cols-2 gap-3">
                  {suggestions.map((suggestion, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleSuggestionClick(suggestion)}
                      className="group relative bg-white border-2 border-slate-200 hover:border-blue-400 rounded-xl p-4 text-left transition-all duration-200 hover:shadow-md"
                    >
                      <div className="flex items-start gap-3">
                        <Sparkles className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5 group-hover:text-blue-600" />
                        <p className="text-sm text-slate-700 group-hover:text-slate-900 font-medium">
                          {suggestion}
                        </p>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-6">
              {messages.map((m, idx) => (
                <div
                  key={idx}
                  className={`flex ${
                    m.role === "user" ? "justify-end" : "justify-start"
                  }`}
                >
                  <div
                    className={`${
                      m.role === "user"
                        ? "bg-gray-200 text-black"
                        : "bg-white text-slate-800 shadow-sm border border-slate-200"
                    } max-w-3xl rounded-2xl px-5 py-3 whitespace-pre-wrap break-words`}
                  >
                    {m.content}
                  </div>
                </div>
              ))}

              {isLoading && (
                <div className="flex justify-start">
                  <div className="max-w-3xl rounded-2xl px-5 py-3 bg-white shadow-sm border border-slate-200">
                    <div className="flex items-center gap-2 text-slate-600">
                      <Loader2 className="w-4 h-4 animate-spin" /> Thinking...
                    </div>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>
          )}
        </div>
      </div>

      {/* Input box */}
      <div className="bg-white border-t border-slate-200 shadow-lg">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex gap-3 items-center">
            <div className="flex-1 relative">
              <textarea
                ref={inputRef}
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleKeyPress}
                placeholder="Type your message..."
                rows={1}
                className="w-full px-4 py-3 pr-12 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              />
            </div>
            <button
              onClick={() => sendMessage()}
              disabled={!inputValue.trim() || isLoading}
              className="px-5 py-3 bg-black -mt-2 rounded-xl flex items-center gap-2 disabled:opacity-50 text-[#FFB000] disabled:text-white"
            >
              {isLoading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Send className="w-5 h-5" />
              )}
              {!isLoading && "Send"}
            </button>
          </div>
          <p className="text-xs text-slate-400 mt-2 text-center">
            Press Enter to send
          </p>
        </div>
      </div>
    </div>
  );
}
