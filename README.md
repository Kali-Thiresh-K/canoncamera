# Canon EOS R1 — Engineered Without Compromise

An interactive, high-performance web experience showcasing the flagship **Canon EOS R1** full-frame mirrorless camera.

![Canon EOS R1 Showcase](public/frames/frame-0001.jpg)

## Highlights

- **60 FPS Interactive Hero Sequence**: HTML5 Canvas animation driven by off-main-thread `createImageBitmap` decoding and smart frame preloading.
- **Hover-to-Scrub Interaction**: Scroll-to-animate activates precisely when hovering over the camera body, passing through to natural page scrolling elsewhere.
- **Zero Black-Screen Load**: Priority parallel preloading ensures frame-0001 renders instantly with a smooth fade-in.
- **Modern Stack**: Built with React 19, TanStack Start, Vite 8, and TailwindCSS v4.

## Getting Started

### Prerequisites

- Node.js >= 18
- npm or bun

### Installation

```bash
npm install
```

### Development Server

```bash
npm run dev
```

Open [http://localhost:8080](http://localhost:8080) in your browser.

### Production Build

```bash
npm run build
npm run preview
```

## License

MIT License. Developed for Canon EOS R1 Showcase.
