import React from "react";
import LoadingAnimationPreview from "./LoadingAnimationPreview";
import { FileUp, Image as ImageIcon } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useToast } from "@/components/ui/use-toast";

const ANIM_TYPES = [
  { id: "material_circular", label: "Material Circular" },
  { id: "android_ring", label: "Android Ring" },
  { id: "pulse", label: "Pulse" },
  { id: "ripple", label: "Ripple" },
  { id: "wave", label: "Wave" },
  { id: "three_dots", label: "Three Dots" },
  { id: "four_dots", label: "Four Dots" },
  { id: "rotating_gradient", label: "Rotating Gradient" },
  { id: "orbit", label: "Orbit" },
  { id: "progress_bar", label: "Progress Bar" },
  { id: "lottie", label: "Lottie (JSON)" },
  { id: "gif", label: "Custom GIF" },
];

const FONTS = [
  { id: "Inter, sans-serif", label: "Inter" },
  { id: "Georgia, serif", label: "Georgia" },
  { id: "monospace", label: "Mono" },
  { id: "'Courier New', monospace", label: "Courier" },
];

export default function LoadingAnimationBuilder({ config, onChange }) {
  const { toast } = useToast();
  const set = (key, val) => onChange({ ...config, [key]: val });

  const uploadCustom = async (file, kind) => {
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      toast({ title: "Too large", description: "Max 10 MB.", variant: "destructive" });
      return;
    }
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      set("logo", file_url);
      toast({ title: "Uploaded", description: `${kind} loader ready.` });
    } catch {
      toast({ title: "Upload failed", variant: "destructive" });
    }
  };

  const inputCls = "w-full h-9 px-3 rounded-lg bg-accent text-sm border-0 focus:outline-none focus:ring-2 focus:ring-[#4F7CFF]/20";
  const labelCls = "text-xs font-medium text-muted-foreground mb-1.5 block";

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold mb-1">Loading Animation</h2>
        <p className="text-sm text-muted-foreground">Choose and customize the loading screen shown inside your app.</p>
      </div>

      <div className="grid sm:grid-cols-3 gap-5">
        {/* Preview */}
        <div className="sm:col-span-1 flex justify-center">
          <LoadingAnimationPreview config={config} />
        </div>

        {/* Controls */}
        <div className="sm:col-span-2 space-y-5">
          {/* Animation type grid */}
          <div>
            <span className={labelCls}>Animation Type</span>
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
              {ANIM_TYPES.map((t) => (
                <button
                  key={t.id}
                  onClick={() => set("type", t.id)}
                  className={`px-2 py-2 rounded-lg text-[11px] font-medium transition-all ${
                    config.type === t.id
                      ? "bg-[#4F7CFF]/10 text-[#4F7CFF] ring-1 ring-[#4F7CFF]/30"
                      : "bg-accent text-muted-foreground hover:bg-accent/70"
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {/* Colors */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <span className={labelCls}>Background Color</span>
              <div className="flex items-center gap-2">
                <input type="color" value={config.bg} onChange={(e) => set("bg", e.target.value)} className="w-9 h-9 rounded-lg cursor-pointer border-0" />
                <input value={config.bg} onChange={(e) => set("bg", e.target.value)} className={inputCls} />
              </div>
            </div>
            <div>
              <span className={labelCls}>Loader Color</span>
              <div className="flex items-center gap-2">
                <input type="color" value={config.color} onChange={(e) => set("color", e.target.value)} className="w-9 h-9 rounded-lg cursor-pointer border-0" />
                <input value={config.color} onChange={(e) => set("color", e.target.value)} className={inputCls} />
              </div>
            </div>
          </div>

          {/* Sliders */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <span className={labelCls}>Size: {config.size}px</span>
              <input type="range" min="24" max="120" value={config.size} onChange={(e) => set("size", +e.target.value)} className="w-full accent-[#4F7CFF]" />
            </div>
            <div>
              <span className={labelCls}>Speed: {config.speed}x</span>
              <input type="range" min="0.3" max="3" step="0.1" value={config.speed} onChange={(e) => set("speed", +e.target.value)} className="w-full accent-[#4F7CFF]" />
            </div>
          </div>

          {/* Text + font */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <span className={labelCls}>Loading Text</span>
              <input value={config.text} onChange={(e) => set("text", e.target.value)} className={inputCls} />
            </div>
            <div>
              <span className={labelCls}>Font Size: {config.fontSize}px</span>
              <input type="range" min="10" max="32" value={config.fontSize} onChange={(e) => set("fontSize", +e.target.value)} className="w-full accent-[#4F7CFF]" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <span className={labelCls}>Font Family</span>
              <select value={config.font} onChange={(e) => set("font", e.target.value)} className={inputCls}>
                {FONTS.map((f) => <option key={f.id} value={f.id}>{f.label}</option>)}
              </select>
            </div>
            <div>
              <span className={labelCls}>Logo Position</span>
              <select value={config.logoPosition} onChange={(e) => set("logoPosition", e.target.value)} className={inputCls}>
                <option value="top">Top</option>
                <option value="bottom">Bottom</option>
                <option value="none">Hidden</option>
              </select>
            </div>
          </div>

          {/* Custom upload for lottie/gif */}
          {(config.type === "lottie" || config.type === "gif") && (
            <div className="p-4 rounded-xl border border-dashed border-gray-200 dark:border-gray-700">
              <span className={labelCls}>{config.type === "lottie" ? "Upload Lottie JSON" : "Upload GIF"}</span>
              {config.logo ? (
                <div className="flex items-center gap-3">
                  <img src={config.logo} alt="custom" className="w-12 h-12 object-contain bg-accent rounded-lg" />
                  <button onClick={() => set("logo", "")} className="text-xs text-[#EF4444] font-medium">Remove</button>
                </div>
              ) : (
                <div className="flex gap-2">
                  <label className="flex-1 text-xs font-medium px-3 py-2 rounded-lg bg-accent hover:bg-accent/70 cursor-pointer flex items-center justify-center gap-1.5">
                    <FileUp className="w-3.5 h-3.5" />Browse
                    <input type="file" accept={config.type === "lottie" ? ".json,application/json" : ".gif,image/gif"} className="hidden" onChange={(e) => uploadCustom(e.target.files?.[0], config.type === "lottie" ? "Lottie" : "GIF")} />
                  </label>
                </div>
              )}
            </div>
          )}

          {/* Fullscreen toggle */}
          <label className="flex items-center justify-between p-3 rounded-xl bg-accent cursor-pointer">
            <span className="text-sm font-medium">Fullscreen Loading</span>
            <input type="checkbox" checked={config.fullscreen} onChange={(e) => set("fullscreen", e.target.checked)} className="w-4 h-4 accent-[#4F7CFF]" />
          </label>
        </div>
      </div>
    </div>
  );
}