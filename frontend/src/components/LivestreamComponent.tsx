import React, { useState, useRef } from "react";
import Swal from "sweetalert2";
import { Button } from "@/components/ui/button";
import { ArrowRight, Sparkles, Video } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";

const LivestreamComponent = () => {
  const [isConnected, setIsConnected] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const socketRef = useRef<WebSocket | null>(null);

  const handleLivestreamConnect = async () => {
    try {
      const confirm = await Swal.fire({
        title: "Start Livestream?",
        text: "Do you want to start your webcam livestream now?",
        icon: "question",
        showCancelButton: true,
        confirmButtonText: "Yes, start",
        cancelButtonText: "Cancel",
      });

      if (!confirm.isConfirmed) return;

      // ✅ Show processing modal
      Swal.fire({
        title: "Connecting...",
        text: "Establishing livestream, please wait...",
        allowOutsideClick: false,
        didOpen: () => Swal.showLoading(),
      });

      socketRef.current = new WebSocket("ws://localhost:8000/ws/livestream/");
      socketRef.current.onmessage = (event) => {
        const img = new Image();
        img.src = "data:image/jpeg;base64," + event.data;
        img.onload = () => {
          const ctx = canvasRef.current?.getContext("2d");
          if (!ctx || !canvasRef.current) return;
          canvasRef.current.width = img.width;
          canvasRef.current.height = img.height;
          ctx.drawImage(img, 0, 0);
        };
      };

      socketRef.current.onopen = () => {
        Swal.fire({
          icon: "success",
          title: "Connected!",
          text: "Livestream started successfully.",
          timer: 1200,
          showConfirmButton: false,
        });
        setIsConnected(true);
        setIsDialogOpen(true);
      };

      socketRef.current.onclose = () => {
        setIsConnected(false);
        setIsDialogOpen(false);
      };
    } catch (err) {
      console.error("Livestream connection error:", err);
      Swal.fire("Error", "Could not start the livestream.", "error");
    }
  };

  const handleLivestreamDisconnect = async () => {
    try {
      if (socketRef.current) {
        socketRef.current.close();
        socketRef.current = null;
      }

      await fetch("http://localhost:8000/livestream/disconnect/", {
        method: "POST",
      });

      Swal.fire({
        icon: "info",
        title: "Disconnected",
        text: "Livestream stopped.",
        timer: 1500,
        showConfirmButton: false,
      });

      setIsConnected(false);
      setIsDialogOpen(false);
    } catch (err) {
      console.error("Disconnect error:", err);
      Swal.fire("Error", "Could not disconnect livestream.", "error");
    }
  };

  const handleDialogChange = (open: boolean) => {
    if (!open && isConnected) {
      handleLivestreamDisconnect();
    }
    setIsDialogOpen(open);
  };

  return (
    <>
      {/* ✅ Card layout, same as UploadMedia */}
      <div className="group bg-card rounded-3xl p-8 shadow-soft transition-spring hover:shadow-medium hover:scale-105">
        <div className="text-center mb-8">
          <div className="w-20 h-20 mx-auto rounded-2xl gradient-secondary flex items-center justify-center mb-6 group-hover:shadow-glow transition-spring">
            <Video className="w-10 h-10 text-secondary-foreground" />
          </div>
          <h3 className="text-2xl font-bold text-card-foreground mb-4">
            Connect to Livestream
          </h3>
          <p className="text-muted-foreground leading-relaxed">
            Protect your live streams in real-time. Our AI monitors your stream
            and automatically protects sensitive content.
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

        <Button
          variant="secondary"
          className="w-full group"
          onClick={handleLivestreamConnect}
        >
          Connect Livestream
          <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
        </Button>
      </div>

      {/* ✅ Dialog (popup live preview) */}
      <Dialog open={isDialogOpen} onOpenChange={handleDialogChange}>
        <DialogContent
          className="max-w-3xl w-full"
          aria-describedby={undefined}
        >
          <DialogHeader>
            <DialogTitle className="text-lg flex items-center gap-2">
              📺 Live Stream (Blurred for Privacy)
            </DialogTitle>
            <DialogDescription>
              The stream is automatically processed to blur sensitive data in
              real-time.
            </DialogDescription>
          </DialogHeader>

          {isConnected && (
            <div className="space-y-4">
              <canvas
                ref={canvasRef}
                className="rounded-lg border w-full"
              ></canvas>
            </div>
          )}

          <DialogFooter>
            <Button
              variant="destructive"
              className="w-full"
              onClick={handleLivestreamDisconnect}
            >
              Disconnect Livestream
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default LivestreamComponent;
