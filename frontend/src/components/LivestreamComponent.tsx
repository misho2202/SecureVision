import React, { useState } from "react";
import Swal from "sweetalert2";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

const LivestreamComponent = () => {
  const [isConnected, setIsConnected] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const handleLivestreamConnect = async () => {
    try {
      // ✅ Ask for confirmation before starting
      const confirm = await Swal.fire({
        title: "Start Livestream?",
        text: "Do you want to start your webcam livestream now?",
        icon: "question",
        showCancelButton: true,
        confirmButtonText: "Yes, start",
        cancelButtonText: "Cancel",
      });

      if (!confirm.isConfirmed) return; // Cancel if user pressed cancel

      // ✅ Start the livestream
      const res = await fetch("http://localhost:8000/livestream/", {
        method: "GET",
      });
      if (!res.ok) throw new Error("Failed to start stream");

      Swal.fire({
        icon: "success",
        title: "Connected!",
        text: "Livestream started successfully.",
        timer: 1200,
        showConfirmButton: false,
      });

      setIsConnected(true);
      setIsDialogOpen(true); // Open the popup
    } catch (err) {
      console.error("Livestream connection error:", err);
      Swal.fire("Error", "Could not start the livestream.", "error");
    }
  };

  const handleLivestreamDisconnect = async () => {
    try {
      const res = await fetch("http://localhost:8000/livestream/disconnect/", {
        method: "POST",
      });
      const data = await res.json();

      Swal.fire({
        icon: "info",
        title: "Disconnected",
        text:
          data.status === "disconnected"
            ? "Livestream stopped."
            : "It was already closed.",
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

  // ✅ Automatically disconnect if the dialog is closed manually or by outside click
  const handleDialogChange = (open: boolean) => {
    if (!open && isConnected) {
      handleLivestreamDisconnect();
    }
    setIsDialogOpen(open);
  };

  return (
    <>
      {/* Button in the main page */}
      <Button
        variant="secondary"
        className="w-full group"
        onClick={handleLivestreamConnect}
      >
        Connect Livestream
        <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
      </Button>

      {/* Popup (Dialog) */}
      <Dialog open={isDialogOpen} onOpenChange={handleDialogChange}>
        <DialogContent className="max-w-3xl w-full">
          <DialogHeader>
            <DialogTitle className="text-lg flex items-center gap-2">
              📺 Live Camera Feed
            </DialogTitle>
          </DialogHeader>

          {isConnected && (
            <div className="space-y-4">
              <img
                src="http://localhost:8000/livestream/"
                alt="Webcam Stream"
                className="rounded-lg border w-full"
              />
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
