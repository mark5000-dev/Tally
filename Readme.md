# Tally – Real-Time Community Polling Platform

Tally is a modern, ultra-fast real-time polling platform designed to capture the pulse of Kenya's communities. Create structured sentiment analytics, gather instant feedback, and tap into emerging urban trends with zero friction.

## 🎯 About Tally

Tally answers the question: **"What does Kenya actually think?"**

Whether you're a business seeking market insights, a content creator gauging audience preferences, or a community leader understanding local sentiment, Tally provides an intuitive platform to:

- **Create ultra-fast polls** in seconds
- **Gather real-time responses** with live analytics
- **Discover public trends** across diverse categories
- **Monetize insights** through paid polling features
- **Access structured sentiment data** for better decision-making

## ✨ Key Features

- **Real-Time Polling** – Create and publish polls instantly, see results update live
- **Category-Based Discovery** – Browse trending polls across Music, Sports, Food, Events, Media, Fashion, Tech, and more
- **Search & Filter** – Find specific polls or creators with powerful search capabilities
- **Free & Paid Polls** – Choose between free community polls or monetized premium surveys
- **Dashboard Studio** – Full-featured creator dashboard for managing polls and analytics
- **Trending Indicators** – Identify hot topics and emerging trends at a glance
- **Dark Mode Support** – Beautiful UI optimized for both light and dark themes
- **Mobile Responsive** – Works seamlessly on desktop, tablet, and mobile devices

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ 
- npm, yarn, pnpm, or bun

### Installation

1. Clone the repository:
```bash
cd tally
```

2. Install dependencies:
```bash
npm install
# or
yarn install
# or
pnpm install
# or
bun install
```

3. Run the development server:
```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

4. Open your browser and navigate to [http://localhost:3000](http://localhost:3000)

The application will auto-reload as you make changes.

## 📁 Project Structure

```
tally/
├── src/
│   └── app/
│       ├── page.tsx              # Home landing page
│       ├── layout.tsx            # Root layout
│       ├── dashboard/            # Creator studio dashboard
│       │   ├── page.tsx
│       │   └── layout.tsx
│       ├── polls/                # Public polls discovery
│       │   ├── page.tsx          # Browse all polls
│       │   └── [pollid]/         # Individual poll details
│       │       └── page.tsx
│       └── globals.css           # Global styles
├── public/                       # Static assets
├── package.json                  # Project dependencies
├── next.config.ts               # Next.js configuration
├── tailwind.config.ts           # Tailwind CSS configuration
├── tsconfig.json                # TypeScript configuration
├── biome.json                   # Code quality & formatting config
└── README.md                    # This file
```

## 🛠 Available Scripts

- **`npm run dev`** – Start the development server with hot reload
- **`npm run build`** – Create an optimized production build
- **`npm run start`** – Run the production build locally
- **`npm run lint`** – Check code quality with Biome
- **`npm run format`** – Auto-format code with Biome

## 🎨 Tech Stack

- **Frontend Framework** – [Next.js 16](https://nextjs.org/) with App Router
- **UI Component Library** – [React 19](https://react.dev/)
- **Styling** – [Tailwind CSS 4](https://tailwindcss.com/)
- **Icons** – [Lucide React](https://lucide.dev/)
- **Language** – [TypeScript 5](https://www.typescriptlang.org/)
- **Code Quality** – [Biome](https://biomejs.dev/) (linting & formatting)
- **Optimization** – Babel React Compiler for performance

## 📱 Core Pages

### Home (`/`)
Landing page showcasing Tally's value proposition. Users can quickly access active polls or jump to the creator studio.

### Polls Discovery (`/polls`)
Browse and search all active polls with advanced filtering:
- Filter by category (Music, Sports, Food, Events, Media, Fashion, Tech, All)
- Search by poll title or creator
- Filter by poll type (Free, Paid)
- View trending (hot) polls at a glance

### Poll Details (`/polls/[pollid]`)
View detailed information about a specific poll, including:
- Poll description and options
- Real-time vote counts and percentages
- Time remaining to vote
- Creator information

### Dashboard Studio (`/dashboard`)
Creator dashboard for managing polls:
- Create new polls
- View poll analytics and performance
- Manage poll settings and pricing
- Track earnings from paid polls

## 🎓 Learn More

- [Next.js Documentation](https://nextjs.org/docs) – Learn about Next.js features
- [React Documentation](https://react.dev/) – Explore React concepts
- [Tailwind CSS](https://tailwindcss.com/docs) – Style customization
- [Lucide Icons](https://lucide.dev/) – Available icons

## 🚢 Deployment

The easiest way to deploy Tally is using [Vercel](https://vercel.com) (created by the Next.js team):

1. Push your code to GitHub
2. Import the project on Vercel
3. Vercel automatically detects Next.js and configures the build settings
4. Deploy with a single click

See the [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

## 📝 License

This project is private. All rights reserved.

## 💡 Contributing

Contributions and feedback are welcome! Please ensure code follows our style guide (enforced by Biome).

## 📧 Support

For questions or issues, please refer to the project documentation or contact the development team.

---

**Tally** – *Pulse of the Community* 🎯
