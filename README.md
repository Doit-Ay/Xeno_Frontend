# Xeno CRM — Frontend Dashboard

A modern, AI-native CRM dashboard built with **Next.js 16** and **React 19**.
Part of the Xeno AI-Native Mini CRM platform for Luxe & Co.

## Features

- Customer management with search and filtering
- Rule-based audience segmentation with live previews
- Multi-channel campaign creation (WhatsApp, SMS, Email, RCS)
- AI copilot for natural language segment and campaign creation
- Real-time campaign analytics and performance tracking
- Responsive bento-grid dashboard design

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 |
| UI Library | React 19 |
| Styling | Vanilla CSS with modern design tokens |
| Testing | Jest + React Testing Library |

## Setup

### Prerequisites

- Node.js 18+
- A running backend API (see [backend repo](https://github.com/YOUR_USERNAME/xeno-crm-backend))

### Install

```bash
npm install
```

### Configure

Create a `.env.local` file:

```env
NEXT_PUBLIC_API_URL=https://your-backend.onrender.com
```

For local development with the backend running locally:

```env
NEXT_PUBLIC_API_URL=http://localhost:3001
```

### Development

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Production Build

```bash
npm run build
npm start
```

## Deploy to Vercel

1. Push this repo to GitHub
2. Import the repo in [Vercel](https://vercel.com)
3. Add the environment variable:
   - `NEXT_PUBLIC_API_URL` = your Render.com backend URL
4. Deploy!

## Testing

```bash
npm test
npm run lint
```

## Live Demo

- **Frontend**: [https://your-app.vercel.app](https://your-app.vercel.app)
- **Backend API**: [https://your-backend.onrender.com](https://your-backend.onrender.com)
