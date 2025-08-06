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

  const deleteBlurredFiles = async (files: BlurredMedia[]) => {
    for (const media of files) {
      try {
        await fetch("http://localhost:8000/delete-file/", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ filename: media.filename }),
        });
      } catch (err) {
        console.error(`Failed to delete ${media.filename}:`, err);
      }
    }
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

      <Dialog
        open={isModalOpen}
        onOpenChange={(open) => {
          if (!open && blurredMedia.length > 0) {
            deleteBlurredFiles(blurredMedia);
            setBlurredMedia([]);
          }
          setIsModalOpen(open);
        }}
      >
        <DialogContent
          className="max-w-6xl w-full max-h-[90vh] overflow-hidden"
          style={{ padding: "1.5rem" }}
        >
          <DialogHeader className="text-center">
            <DialogTitle>Blurred Media Preview</DialogTitle>
            <DialogDescription>
              All detected objects are blurred for privacy.
            </DialogDescription>
          </DialogHeader>

          <div
            className={`w-full ${
              blurredMedia.length > 2 ? "max-h-[60vh] overflow-y-auto" : ""
            }`}
          >
            <div
              className={`mt-6 w-full flex flex-wrap justify-center gap-6 ${
                blurredMedia.length <= 2 ? "items-start" : ""
              }`}
            >
              {blurredMedia.map((media) => (
                <div
                  key={media.url}
                  className={`flex flex-col items-center ${
                    blurredMedia.length <= 2 ? "w-full max-w-[500px]" : "w-[280px]"
                  }`}
                >
                  {media.filename.endsWith(".webm") ||
                  media.filename.endsWith(".mp4") ? (
                    <video
                      controls
                      className="rounded-lg shadow max-h-[300px] object-contain w-full"
                    >
                      <source
                        src={`http://localhost:8000${media.url}?t=${Date.now()}`}
                        type={
                          media.filename.endsWith(".webm")
                            ? "video/webm"
                            : "video/mp4"
                        }
                      />
                      Your browser does not support the video tag.
                    </video>
                  ) : (
                    <img
                      src={`http://localhost:8000${media.url}`}
                      alt={media.filename}
                      className="rounded-lg shadow max-h-[300px] object-contain cursor-pointer w-full"
                      onClick={() =>
                        window.open(
                          `http://localhost:8000${media.url}`,
                          "_blank"
                        )
                      }
                    />
                  )}
                  <p className="text-sm text-muted-foreground mt-2 truncate max-w-full text-center">
                    {media.filename}
                  </p>

                  {/* Only show small download button if more than one media */}
                  {blurredMedia.length > 1 && (
                    <Button
                      size="sm"
                      className="mt-2 bg-primary text-white hover:bg-primary/90 transition-colors"
                      onClick={async () => {
                        try {
                          const response = await fetch(
                            `http://localhost:8000${media.url}`
                          );
                          const blob = await response.blob();
                          const link = document.createElement("a");
                          link.href = window.URL.createObjectURL(blob);
                          link.download = media.filename;
                          document.body.appendChild(link);
                          link.click();
                          document.body.removeChild(link);
                          window.URL.revokeObjectURL(link.href);
                        } catch (err) {
                          console.error("Download failed:", err);
                        }
                      }}
                    >
                      Download
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {blurredMedia.length > 1 && (
            <DialogFooter className="w-full flex justify-between pt-6">
              <Button
                className="bg-primary text-white hover:bg-primary/90 transition-colors"
                onClick={async () => {
                  for (const media of blurredMedia) {
                    try {
                      const response = await fetch(
                        `http://localhost:8000${media.url}`
                      );
                      const blob = await response.blob();
                      const link = document.createElement("a");
                      link.href = window.URL.createObjectURL(blob);
                      link.download = media.filename;
                      document.body.appendChild(link);
                      link.click();
                      document.body.removeChild(link);
                      window.URL.revokeObjectURL(link.href);
                    } catch (err) {
                      console.error(`Download failed for ${media.filename}:`, err);
                    }
                  }
                }}
              >
                Download All
              </Button>

              <Button
                variant="destructive"
                onClick={() => {
                  deleteBlurredFiles(blurredMedia);
                  setBlurredMedia([]);
                  setIsModalOpen(false);
                }}
              >
                Close and Delete All
              </Button>
            </DialogFooter>
          )}

          {blurredMedia.length === 1 && (
            <DialogFooter className="w-full flex justify-end pt-6 gap-4">
              <Button
                className="bg-primary text-white hover:bg-primary/90 transition-colors"
                onClick={async () => {
                  const media = blurredMedia[0];
                  try {
                    const response = await fetch(
                      `http://localhost:8000${media.url}`
                    );
                    const blob = await response.blob();
                    const link = document.createElement("a");
                    link.href = window.URL.createObjectURL(blob);
                    link.download = media.filename;
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                    window.URL.revokeObjectURL(link.href);
                  } catch (err) {
                    console.error("Download failed:", err);
                  }
                }}
              >
                Download
              </Button>

              <Button
                variant="destructive"
                onClick={() => {
                  deleteBlurredFiles(blurredMedia);
                  setBlurredMedia([]);
                  setIsModalOpen(false);
                }}
              >
                Close and Delete
              </Button>
            </DialogFooter>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};

export default UploadMediaComponent;
