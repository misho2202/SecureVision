import React, { useState, useRef } from "react";
import Swal from "sweetalert2";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ArrowRight, Sparkles, Upload } from "lucide-react";

type BlurredMedia = {
  url: string;
  filename: string;
};

const UploadMediaComponent = () => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [blurredMedia, setBlurredMedia] = useState<BlurredMedia[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleFileClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;

    const formData = new FormData();
    for (const file of e.target.files) {
      formData.append("images", file);
    }

    try {
      Swal.fire({
        title: "Processing...",
        text: "Blurring sensitive data, please wait...",
        allowOutsideClick: false,
        didOpen: () => Swal.showLoading(),
      });

      const res = await fetch("http://localhost:8000/upload/", {
        method: "POST",
        body: formData,
      });

      Swal.close();

      if (!res.ok) throw new Error("Upload failed");
      const data = await res.json();

      if (data.results) {
        setBlurredMedia(data.results);
        setIsModalOpen(true);

        Swal.fire({
          icon: "success",
          title: "Done!",
          text: "Your files have been processed.",
          timer: 1200,
          showConfirmButton: false,
        });
      }
    } catch (err) {
      console.error("Upload error:", err);
      Swal.fire("Error", "Failed to upload or process files.", "error");
    } finally {
      // ✅ Reset input so selecting the same file again works
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  return (
    <>
      <div className="group bg-card rounded-3xl p-8 shadow-soft transition-spring hover:shadow-medium hover:scale-105">
        <div className="text-center mb-8">
          <div className="w-20 h-20 mx-auto rounded-2xl gradient-primary flex items-center justify-center mb-6 group-hover:shadow-glow transition-spring">
            <Upload className="w-10 h-10 text-primary-foreground" />
          </div>
          <h3 className="text-2xl font-bold text-card-foreground mb-4">
            Upload Media
          </h3>
          <p className="text-muted-foreground leading-relaxed">
            Upload your photos or videos and let our AI automatically detect and
            blur sensitive information before you share.
          </p>
        </div>

        <div className="space-y-4 mb-8">
          <div className="flex items-center gap-3 text-sm text-muted-foreground">
            <Sparkles className="w-4 h-4 text-primary" />
            <span>Detects personal information, IDs, and private data</span>
          </div>
          <div className="flex items-center gap-3 text-sm text-muted-foreground">
            <Sparkles className="w-4 h-4 text-primary" />
            <span>Automatic blur and protection features</span>
          </div>
          <div className="flex items-center gap-3 text-sm text-muted-foreground">
            <Sparkles className="w-4 h-4 text-primary" />
            <span>Supports images and videos</span>
          </div>
        </div>

        <input
          type="file"
          multiple
          ref={fileInputRef}
          onChange={handleFileChange}
          className="hidden"
          accept="image/*,video/*"
        />

        <Button
          variant="hero"
          className="w-full group"
          onClick={handleFileClick}
        >
          Upload Media
          <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
        </Button>
      </div>

      {/* Modal to Show Blurred Media */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-4xl w-full flex flex-col items-center">
          <DialogHeader className="w-full text-center">
            <DialogTitle>Blurred Media Preview</DialogTitle>
            <DialogDescription>
              Objects detected have been blurred for privacy.
            </DialogDescription>
          </DialogHeader>

          <div className="flex justify-center items-center w-full">
            {blurredMedia.length > 0 && (
              <>
                {blurredMedia[0].filename.endsWith(".webm") || blurredMedia[0].filename.endsWith(".mp4") ? (
                  <video
                    key={blurredMedia[0].url}
                    controls
                    className="rounded-lg shadow max-h-[400px] object-contain"
                  >
                    <source
                      src={`http://localhost:8000${blurredMedia[0].url}?t=${Date.now()}`}
                      type={blurredMedia[0].filename.endsWith(".webm") ? "video/webm" : "video/mp4"}
                    />
                    Your browser does not support the video tag.
                  </video>
                ) : (
                  <img
                    src={`http://localhost:8000${blurredMedia[0].url}`}
                    alt={blurredMedia[0].filename}
                    className="rounded-lg shadow max-h-[400px] object-contain cursor-pointer"
                    onClick={() =>
                      window.open(`http://localhost:8000${blurredMedia[0].url}`, "_blank")
                    }
                  />
                )}
              </>
            )}
          </div>

          <DialogFooter className="w-full flex justify-between">
            <Button
              variant="secondary"
              onClick={async () => {
                try {
                  const response = await fetch(
                    `http://localhost:8000${blurredMedia[0].url}`
                  );
                  const blob = await response.blob();

                  const link = document.createElement("a");
                  link.href = window.URL.createObjectURL(blob);
                  link.download = blurredMedia[0].filename;
                  document.body.appendChild(link);
                  link.click();
                  document.body.removeChild(link);

                  // Optional: clean up URL object after download
                  window.URL.revokeObjectURL(link.href);
                } catch (err) {
                  console.error("Download failed:", err);
                }
              }}
            >
              Download
            </Button>

            <Button variant="destructive" onClick={() => setIsModalOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default UploadMediaComponent;
