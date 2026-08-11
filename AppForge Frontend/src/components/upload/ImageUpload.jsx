import React, { useState, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { useToast } from "@/components/ui/use-toast";
import { Image as ImageIcon, UploadCloud, Camera, X, Loader2, Check, RefreshCw } from "lucide-react";

const MAX_SIZE = 10 * 1024 * 1024; // 10 MB
const ACCEPTED = ["image/png", "image/jpeg", "image/jpg", "image/svg+xml", "image/webp"];
const ACCEPT_STR = ".png,.jpg,.jpeg,.svg,.webp,image/png,image/jpeg,image/svg+xml,image/webp";

export default function ImageUpload({
  label,
  description,
  aspect = "square",
  value,
  onChange,
  recommendedSize,
}) {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [dragOver, setDragOver] = useState(false);
  const [error, setError] = useState("");
  const fileRef = useRef(null);
  const cameraRef = useRef(null);
  const { toast } = useToast();

  const aspectClass =
    aspect === "square" ? "aspect-square" :
    aspect === "banner" ? "aspect-[3/1]" :
    aspect === "wide" ? "aspect-video" : "aspect-square";

  const validate = (file) => {
    if (!file) return "No file selected";
    const extOk = ACCEPTED.includes(file.type) || /\.(png|jpe?g|svg|webp)$/i.test(file.name);
    if (!extOk) return "Unsupported format. Use PNG, JPG, SVG, or WEBP.";
    if (file.size > MAX_SIZE) return "File too large. Maximum size is 10 MB.";
    return "";
  };

  const doUpload = async (file) => {
    const err = validate(file);
    if (err) {
      setError(err);
      toast({ title: "Upload failed", description: err, variant: "destructive" });
      return;
    }
    setError("");
    setUploading(true);
    setProgress(0);

    // visual progress while the integration call runs
    let p = 0;
    const ticker = setInterval(() => {
      p = Math.min(p + Math.random() * 18, 92);
      setProgress(Math.round(p));
    }, 180);

    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      clearInterval(ticker);
      setProgress(100);
      onChange(file_url);
      toast({ title: "Uploaded", description: `${label} uploaded successfully.`, });
    } catch (e) {
      clearInterval(ticker);
      setError("Upload failed. Please try again.");
      toast({ title: "Upload failed", description: "Something went wrong.", variant: "destructive" });
    } finally {
      setTimeout(() => {
        setUploading(false);
        setProgress(0);
      }, 500);
    }
  };

  const onPick = (e) => {
    const file = e.target.files?.[0];
    if (file) doUpload(file);
    e.target.value = "";
  };

  const onDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) doUpload(file);
  };

  const remove = () => {
    onChange("");
    setError("");
  };

  return (
    <div>
      <div className="mb-2">
        <p className="text-sm font-medium">{label}</p>
        {description && <p className="text-xs text-muted-foreground mt-0.5">{description}</p>}
      </div>

      {value ? (
        <div className={`relative ${aspectClass} w-full max-w-[200px] rounded-2xl overflow-hidden border border-gray-100 dark:border-gray-800 bg-accent group`}>
          <img src={value} alt={label} className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
            <button
              onClick={() => fileRef.current?.click()}
              className="w-9 h-9 rounded-full bg-white text-gray-900 flex items-center justify-center hover:scale-105 transition-transform"
              title="Replace"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
            <button
              onClick={remove}
              className="w-9 h-9 rounded-full bg-white text-[#EF4444] flex items-center justify-center hover:scale-105 transition-transform"
              title="Remove"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          {uploading && (
            <div className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center gap-2">
              <Loader2 className="w-6 h-6 text-white animate-spin" />
              <div className="w-3/4 h-1.5 rounded-full bg-white/30 overflow-hidden">
                <div className="h-full bg-white transition-all" style={{ width: `${progress}%` }} />
              </div>
            </div>
          )}
        </div>
      ) : (
        <div
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={onDrop}
          onClick={() => fileRef.current?.click()}
          className={`${aspectClass} w-full max-w-[200px] rounded-2xl border-2 border-dashed cursor-pointer flex flex-col items-center justify-center text-center p-4 transition-all ${
            dragOver
              ? "border-[#4F7CFF] bg-[#4F7CFF]/5"
              : "border-gray-200 dark:border-gray-700 hover:border-[#4F7CFF]/50"
          }`}
        >
          {uploading ? (
            <>
              <Loader2 className="w-6 h-6 text-[#4F7CFF] animate-spin mb-2" />
              <div className="w-3/4 h-1.5 rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden">
                <div className="h-full bg-gradient-primary transition-all" style={{ width: `${progress}%` }} />
              </div>
              <p className="text-xs text-muted-foreground mt-2">{progress}%</p>
            </>
          ) : (
            <>
              <UploadCloud className="w-6 h-6 text-muted-foreground mb-1.5" />
              <p className="text-xs font-medium">Drag & drop</p>
              <p className="text-[10px] text-muted-foreground mt-0.5">or tap to browse</p>
            </>
          )}
        </div>
      )}

      {!value && !uploading && (
        <div className="flex gap-2 mt-2 max-w-[200px]">
          <button
            onClick={() => fileRef.current?.click()}
            className="flex-1 text-xs font-medium px-2 py-1.5 rounded-lg bg-accent hover:bg-accent/70 transition-colors flex items-center justify-center gap-1"
          >
            <ImageIcon className="w-3 h-3" />Browse
          </button>
          <button
            onClick={() => cameraRef.current?.click()}
            className="flex-1 text-xs font-medium px-2 py-1.5 rounded-lg bg-accent hover:bg-accent/70 transition-colors flex items-center justify-center gap-1"
          >
            <Camera className="w-3 h-3" />Camera
          </button>
        </div>
      )}

      {recommendedSize && <p className="text-[10px] text-muted-foreground mt-1.5">Recommended: {recommendedSize}</p>}
      {error && <p className="text-xs text-[#EF4444] mt-1.5">{error}</p>}

      <input ref={fileRef} type="file" accept={ACCEPT_STR} onChange={onPick} className="hidden" />
      <input ref={cameraRef} type="file" accept="image/*" capture="environment" onChange={onPick} className="hidden" />
    </div>
  );
}