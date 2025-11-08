# SafuLanding - Safuverse Marketing Website

Marketing and landing page for the **Safuverse ecosystem on BNB Chain**. This website showcases the AI-powered Web3 learning platform and the various components of the Safuverse deployed on BNB Smart Chain.

## Overview

SafuLanding is the public-facing website that introduces users to the Safuverse ecosystem, including:
- SafuCourse: Educational platform on BNB Chain
- safudomains: .safu domain name system on BSC
- safupad: Token launchpad on BNB Chain
- Safucard: NFT scorecard system
- SafuAgents: AI-powered Web3 interface

**Key Message**: Level3 offers AI-created courses for content creators and crypto earning opportunities through tasks and jobs, all powered by **BNB Chain** infrastructure.

## BNB Chain Integration

While this is a static marketing website, it connects users to the Safuverse ecosystem that is **entirely deployed on BNB Chain**:

- **Course Platform**: Links to learn.level3labs.fun (deployed on BSC)
- **Domain System**: Links to dns.level3labs.fun (deployed on BSC)
- **Token Launches**: References to safupad platform on BNB Chain
- **Wallet Integration**: Promotes connecting to BNB Chain networks

All interactive features and blockchain operations referenced on this landing page occur on **BNB Smart Chain (BSC)**.

## Features

- **Responsive Design**: Mobile-first design with Tailwind CSS
- **Modern UI**: Radix UI components with smooth animations
- **Interactive Elements**: Framer Motion animations
- **Multi-Page Navigation**: React Router for seamless navigation
- **Ecosystem Overview**: Information about all Safuverse components on BNB Chain

## Technology Stack

### Frontend
- **Framework**: React 18.2.0
- **Language**: TypeScript 5.2
- **Build Tool**: Vite 4.4.5
- **Routing**: React Router DOM 6.16.0

### UI/UX
- **CSS Framework**: Tailwind CSS 3.3.3
- **Component Library**: Radix UI
- **Animations**: Framer Motion 10.16.4
- **Icons**: Lucide React 0.292.0
- **Utilities**: clsx, tailwind-merge, class-variance-authority

## Getting Started

### Prerequisites

- Node.js 18+ (specified in `.nvmrc`)
- npm or yarn

### Installation

```bash
cd SafuLanding
npm install
# or
yarn install
```

### Development

Run the development server:

```bash
npm run dev
# or
yarn dev
```

The website will be available at `http://localhost:5173`

### Build for Production

```bash
npm run build
# or
yarn build
```

The built files will be in the `dist/` directory.

### Preview Production Build

```bash
npm run preview
# or
yarn preview
```

## Project Structure

```
SafuLanding/
├── src/
│   ├── main.tsx           # Application entry point
│   ├── App.tsx            # Main app component
│   ├── components/        # Reusable UI components
│   ├── pages/             # Page components
│   └── styles/            # Global styles
├── public/                # Static assets
├── plugins/               # Custom Vite plugins
├── index.html             # HTML template
├── tailwind.config.js     # Tailwind CSS configuration
├── vite.config.js         # Vite build configuration
└── package.json           # Dependencies
```

## Content Highlights

### BNB Chain Ecosystem References

The landing page emphasizes:

1. **Domain Minting on BSC**: Users can mint .safu domains on BNB Chain to access courses
2. **On-Chain Learning**: All courses are deployed as smart contracts on BSC
3. **Crypto Earning**: Tasks and jobs that reward users with tokens on BNB Chain
4. **AI-Powered Content**: AI-created courses accessible through BNB Chain infrastructure

### Key Pages

- **Home**: Overview of the Safuverse ecosystem on BNB Chain
- **Features**: Detailed breakdown of platform capabilities
- **About**: Mission and vision of building on BNB Chain
- **Contact**: Ways to get support for BNB Chain integration

## Configuration

### Tailwind CSS

Custom Tailwind configuration with:
- Extended color palette
- Custom animations
- Responsive breakpoints
- Utility classes

See `tailwind.config.js` for full configuration.

### Vite Configuration

Custom Vite setup with:
- React plugin
- TypeScript support
- Custom build optimizations
- Plugin extensions

See `vite.config.js` for details.

## Deployment

The website can be deployed to any static hosting service:

### Vercel
```bash
vercel
```

### Netlify
```bash
netlify deploy --prod
```

### Traditional Hosting
```bash
npm run build
# Upload dist/ folder to web server
```

## Environment Variables

If you need to configure environment-specific settings:

```bash
# .env
VITE_COURSE_URL=https://learn.level3labs.fun
VITE_DNS_URL=https://dns.level3labs.fun
VITE_BSC_NETWORK=mainnet
```

## Integration with Safuverse Ecosystem

This landing page serves as the entry point to:

- **SafuCourse** (learn.level3labs.fun): Educational platform on BNB Chain
- **safudomains** (dns.level3labs.fun): Domain registration on BSC
- **safupad**: Token launchpad on BNB Chain
- **Safucard**: NFT scorecard minting on BSC
- **SafuAgents**: AI agents with BNB Chain wallet integration

All linked platforms are deployed on **BNB Smart Chain**.

## Performance Optimization

- Code splitting with React Router
- Lazy loading of components
- Optimized images in `public/`
- Minified production builds
- Tree-shaking for smaller bundles

## Browser Support

- Modern browsers (Chrome, Firefox, Safari, Edge)
- Mobile browsers (iOS Safari, Chrome Mobile)
- Progressive enhancement for older browsers

## Contributing

To contribute to the landing page:

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test responsiveness across devices
5. Submit a pull request

## SEO

The landing page is optimized for search engines:
- Semantic HTML structure
- Meta descriptions emphasizing BNB Chain
- Open Graph tags for social sharing
- Structured data for better indexing

## Brand Guidelines

When updating content, maintain consistency with:
- Safuverse brand colors
- Typography (Gilroy Bold font)
- Messaging emphasizing BNB Chain deployment
- Call-to-action buttons linking to BSC-powered platforms

## Support

For issues or questions:
- Check existing documentation
- Visit the main Safuverse repository
- Contact: info@level3labs.fun

## License

See the main Safuverse repository for license information.

---

**Showcasing the Safuverse Ecosystem on BNB Chain** - Your gateway to AI-powered Web3 learning on BNB Smart Chain.
