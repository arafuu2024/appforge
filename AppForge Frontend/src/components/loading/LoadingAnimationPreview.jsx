import React from "react";
import { motion } from "framer-motion";

// Renders a live preview of the chosen loading animation inside a phone-like frame.
// Props: type, bg, color, size, speed, text, font, fontSize, logo (url), logoPosition, fullscreen
export default function LoadingAnimationPreview({ config }) {
  const {
    type = "material_circular",
    bg = "#0B1020",
    color = "#4F7CFF",
    size = 56,
    speed = 1,
    text = "Loading...",
    font = "Inter, sans-serif",
    fontSize = 14,
    logo,
    logoPosition = "top",
    fullscreen = true,
  } = config;

  const dur = `${1 / speed}s`;

  const renderLoader = () => {
    switch (type) {
      case "material_circular":
        return (
          <div
            className="rounded-full border-4 border-white/10"
            style={{
              width: size,
              height: size,
              borderTopColor: color,
              animation: `spin ${dur} linear infinite`,
            }}
          />
        );
      case "android_ring":
        return (
          <div className="relative" style={{ width: size, height: size }}>
            {[0, 1, 2].map((i) => (
              <span
                key={i}
                className="absolute inset-0 rounded-full border-4 border-transparent"
                style={{
                  borderTopColor: color,
                  animation: `spin ${dur} linear infinite`,
                  animationDelay: `${i * (parseFloat(dur) / 3)}s`,
                  opacity: 1 - i * 0.3,
                }}
              />
            ))}
          </div>
        );
      case "pulse":
        return (
          <motion.div
            className="rounded-full"
            style={{ width: size, height: size, backgroundColor: color }}
            animate={{ scale: [1, 1.4, 1], opacity: [0.6, 0.2, 0.6] }}
            transition={{ duration: parseFloat(dur), repeat: Infinity, ease: "easeInOut" }}
          />
        );
      case "ripple":
        return (
          <div className="relative" style={{ width: size, height: size }}>
            {[0, 1].map((i) => (
              <motion.span
                key={i}
                className="absolute inset-0 rounded-full border-2"
                style={{ borderColor: color }}
                animate={{ scale: [0, 1.5], opacity: [0.8, 0] }}
                transition={{ duration: parseFloat(dur) * 1.6, repeat: Infinity, ease: "easeOut", delay: i * 0.8 }}
              />
            ))}
          </div>
        );
      case "wave":
        return (
          <div className="flex items-end gap-1" style={{ height: size }}>
            {[0, 1, 2, 3, 4].map((i) => (
              <motion.span
                key={i}
                className="w-1.5 rounded-full"
                style={{ backgroundColor: color }}
                animate={{ scaleY: [0.3, 1, 0.3] }}
                transition={{ duration: parseFloat(dur), repeat: Infinity, ease: "easeInOut", delay: i * 0.12 }}
              />
            ))}
          </div>
        );
      case "three_dots":
        return (
          <div className="flex gap-2">
            {[0, 1, 2].map((i) => (
              <motion.span
                key={i}
                className="rounded-full"
                style={{ width: size / 3, height: size / 3, backgroundColor: color }}
                animate={{ opacity: [0.3, 1, 0.3], y: [0, -6, 0] }}
                transition={{ duration: parseFloat(dur), repeat: Infinity, delay: i * 0.15 }}
              />
            ))}
          </div>
        );
      case "four_dots":
        return (
          <div className="grid grid-cols-2 gap-1.5" style={{ width: size, height: size }}>
            {[0, 1, 2, 3].map((i) => (
              <motion.span
                key={i}
                className="rounded-full"
                style={{ backgroundColor: color }}
                animate={{ scale: [1, 0.5, 1], opacity: [1, 0.4, 1] }}
                transition={{ duration: parseFloat(dur), repeat: Infinity, delay: i * 0.2 }}
              />
            ))}
          </div>
        );
      case "rotating_gradient":
        return (
          <motion.div
            className="rounded-full"
            style={{
              width: size,
              height: size,
              background: `conic-gradient(${color}, #7C3AED, ${color})`,
            }}
            animate={{ rotate: 360 }}
            transition={{ duration: parseFloat(dur) * 1.5, repeat: Infinity, ease: "linear" }}
          />
        );
      case "orbit":
        return (
          <div className="relative" style={{ width: size, height: size }}>
            <motion.div
              className="absolute inset-0"
              animate={{ rotate: 360 }}
              transition={{ duration: parseFloat(dur) * 2, repeat: Infinity, ease: "linear" }}
            >
              <span className="absolute top-0 left-1/2 -translate-x-1/2 w-2.5 h-2.5 rounded-full" style={{ backgroundColor: color }} />
              <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-2 h-2 rounded-full" style={{ backgroundColor: color, opacity: 0.6 }} />
            </motion.div>
            <div className="absolute inset-0 rounded-full border-2 border-white/10" />
          </div>
        );
      case "progress_bar":
        return (
          <div className="w-32 h-2 rounded-full bg-white/10 overflow-hidden">
            <motion.div
              className="h-full rounded-full"
              style={{ backgroundColor: color }}
              animate={{ x: ["-100%", "100%"] }}
              transition={{ duration: parseFloat(dur) * 1.5, repeat: Infinity, ease: "easeInOut" }}
            />
          </div>
        );
      case "lottie":
      case "gif":
        return (
          <div className="text-xs text-white/50 text-center" style={{ width: size }}>
            {logo ? (
              <img src={logo} alt="custom loader" className="w-16 h-16 object-contain mx-auto" />
            ) : (
              <div className="w-16 h-16 mx-auto rounded-xl bg-white/5 flex items-center justify-center">
                <span className="text-[10px]">Upload {type === "lottie" ? "JSON" : "GIF"}</span>
              </div>
            )}
          </div>
        );
      default:
        return null;
    }
  };

  const logoEl = logo && (
    <img src={logo} alt="logo" className="h-10 w-auto object-contain mb-4" />
  );

  return (
    <div
      className={`relative mx-auto rounded-[2rem] border-4 border-gray-800 overflow-hidden shadow-2xl ${fullscreen ? "" : ""}`}
      style={{
        width: "100%",
        maxWidth: 220,
        aspectRatio: "220 / 440",
        backgroundColor: bg,
        fontFamily: font,
      }}
    >
      {/* notch */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-20 h-5 bg-gray-800 rounded-b-2xl z-10" />
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-5 px-6">
        {logo && logoPosition === "top" && logoEl}
        {renderLoader()}
        {text && (
          <p style={{ color: "#fff", fontSize, opacity: 0.85 }} className="mt-2 text-center">
            {text}
          </p>
        )}
        {logo && logoPosition === "bottom" && logoEl}
      </div>
    </div>
  );
}