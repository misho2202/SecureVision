import { useRef } from "react";
import { Button } from "@/components/ui/button";
import { Upload, Video, ArrowRight, Sparkles } from "lucide-react";
import Swal from "sweetalert2";
import LivestreamComponent from "./LivestreamComponent";


const StartSection = () => {
  const fileInputRef = useRef(null);

  const handleFileClick = () => {
    fileInputRef.current?.click();
  };

  function getCSRFToken() {
    let name = "csrftoken";
    let cookieValue = null;
    if (document.cookie && document.cookie !== "") {
      const cookies = document.cookie.split(";");
      for (let cookie of cookies) {
        cookie = cookie.trim();
        if (cookie.startsWith(name + "=")) {
          cookieValue = decodeURIComponent(cookie.slice(name.length + 1));
          break;
        }
      }
    }
    return cookieValue;
  }

  const handleFileChange = async (event) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    for (const file of files) {
      const formData = new FormData();
      formData.append("images", file); // change if your API uses another name

      try {
        const res = await fetch("http://localhost:8000/upload/", {
          method: "POST",
          headers: {
            "X-CSRFToken": getCSRFToken(), // remove if using @csrf_exempt
          },
          body: formData,
        });

        const data = await res.json();

        for (const result of data.results || []) {
          if (result.stored) {
            await Swal.fire({
              toast: true,
              icon: "success",
              title: `${result.filename} uploaded`,
              position: "top-end",
              showConfirmButton: false,
              timer: 2000,
              timerProgressBar: true,
            });
          } else {
            await Swal.fire(
              "Upload failed",
              `${result.filename} could not be uploaded.`,
              "error"
            );
          }
        }
      } catch (err) {
        console.error("Upload error:", err);
        await Swal.fire(
          "Upload failed",
          `${file.name} could not be uploaded.`,
          "error"
        );
      }
    }
    // ✅ Reset input so selecting the same file again triggers change
    event.target.value = "";
  };

  const handleLivestreamConnect = async () => {
    try {
      // Ask for confirmation before connecting
      const confirm = await Swal.fire({
        title: "Connect to Livestream?",
        text: "Do you want to start the livestream connection now?",
        icon: "question",
        showCancelButton: true,
        confirmButtonText: "Yes, connect",
        cancelButtonText: "Cancel",
      });

      if (!confirm.isConfirmed) return;

      // Simulate API call (replace with real one)
      await Swal.fire({
        title: "Connecting...",
        text: "Please wait while we establish the connection.",
        allowOutsideClick: false,
        didOpen: () => {
          Swal.showLoading();
        },
      });

      // ✅ Simulated delay (replace with your fetch to backend)
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // Close loading and show success
      Swal.fire({
        icon: "success",
        title: "Connected!",
        text: "The livestream is now active.",
        timer: 2000,
        showConfirmButton: false,
      });

      // Here you can also update state, e.g., setIsConnected(true)
    } catch (err) {
      console.error("Livestream connection error:", err);
      Swal.fire("Error", "Failed to connect to livestream.", "error");
    }
  };

  return (
    <section id="start" className="py-20">
      <div className="container mx-auto px-6">
        <div className="max-w-4xl mx-auto text-center mb-16">
          <h2 className="text-4xl lg:text-5xl font-bold text-foreground mb-6">
            Ready to
            <span className="block gradient-accent bg-clip-text text-transparent">
              Protect Your Privacy?
            </span>
          </h2>
          <p className="text-xl text-muted-foreground leading-relaxed">
            Choose how you want to secure your content. Our AI-powered
            protection works seamlessly for both static media and live streams.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
          {/* Upload Media */}
          <div className="group bg-card rounded-3xl p-8 shadow-soft transition-spring hover:shadow-medium hover:scale-105">
            <div className="text-center mb-8">
              <div className="w-20 h-20 mx-auto rounded-2xl gradient-primary flex items-center justify-center mb-6 group-hover:shadow-glow transition-spring">
                <Upload className="w-10 h-10 text-primary-foreground" />
              </div>
              <h3 className="text-2xl font-bold text-card-foreground mb-4">
                Upload Media
              </h3>
              <p className="text-muted-foreground leading-relaxed">
                Upload your photos, videos, or documents and let our AI
                automatically detect and blur sensitive information before you
                share.
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
                <span>Supports images, videos, and documents</span>
              </div>
            </div>

            <input
              type="file"
              multiple
              ref={fileInputRef}
              onChange={handleFileChange}
              className="hidden"
              accept="image/*,video/*,.pdf"
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

          {/* Connect to Livestream */}
          <div className="group bg-card rounded-3xl p-8 shadow-soft transition-spring hover:shadow-medium hover:scale-105">
            <div className="text-center mb-8">
              <div className="w-20 h-20 mx-auto rounded-2xl gradient-secondary flex items-center justify-center mb-6 group-hover:shadow-glow transition-spring">
                <Video className="w-10 h-10 text-secondary-foreground" />
              </div>
              <h3 className="text-2xl font-bold text-card-foreground mb-4">
                Connect to Livestream
              </h3>
              <p className="text-muted-foreground leading-relaxed">
                Protect your live streams in real-time. Our AI monitors your
                stream and automatically protects sensitive content as you
                broadcast.
              </p>
            </div>

            <div className="space-y-4 mb-8">
              <div className="flex items-center gap-3 text-sm text-muted-foreground">
                <Sparkles className="w-4 h-4 text-secondary" />
                <span>Real-time privacy protection during live streams</span>
              </div>
              <div className="flex items-center gap-3 text-sm text-muted-foreground">
                <Sparkles className="w-4 h-4 text-secondary" />
                <span>Compatible with major streaming platforms</span>
              </div>
              <div className="flex items-center gap-3 text-sm text-muted-foreground">
                <Sparkles className="w-4 h-4 text-secondary" />
                <span>Instant alerts for potential privacy risks</span>
              </div>
            </div>

            <LivestreamComponent />

          </div>
        </div>

        {/* Additional Info */}
        <div className="max-w-3xl mx-auto mt-16 text-center">
          <div className="bg-muted/50 rounded-2xl p-8 shadow-soft">
            <h4 className="text-lg font-semibold text-foreground mb-4">
              🔒 Your Privacy, Always Protected
            </h4>
            <p className="text-muted-foreground">
              All processing happens securely and privately. We never store your
              media or access your personal information. Your content remains
              yours, always.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default StartSection;
