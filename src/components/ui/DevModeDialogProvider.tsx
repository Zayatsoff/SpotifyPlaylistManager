import React, { createContext, useCallback, useContext, useMemo, useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

type DevModeContextType = {
  showDevMode403: () => void;
};

const DevModeContext = createContext<DevModeContextType>({ showDevMode403: () => {} });

export const useDevModeDialog = () => useContext(DevModeContext);

export const DevModeDialogProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [open, setOpen] = useState(false);

  const showDevMode403 = useCallback(() => {
    // Always show the modal when an error is detected; it's fine if multiple calls happen.
    setOpen(true);
  }, []);

  const value = useMemo(() => ({ showDevMode403 }), [showDevMode403]);

  return (
    <DevModeContext.Provider value={value}>
      {children}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Demo mode enabled</DialogTitle>
            <DialogDescription>
              There was an error reaching Spotify (e.g. 403 Forbidden). This app is currently in developer mode, so only allowlisted users can use live Spotify data.
              <br />
              <br />
              To be added to the access list, email <a className="underline" href="mailto:contact@liorrozin.co?subject=Spotify%20Playlist%20Manager%20access%20request">contact@liorrozin.co</a>.
              <br />
              <br />
              For now, the app is displaying a demo experience with sample playlists and tracks. Actions you take here are simulated and won’t change your Spotify account.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              onClick={() => {
                window.location.href =
                  "mailto:contact@liorrozin.co?subject=Spotify%20Playlist%20Manager%20access%20request";
              }}
            >
              Contact
            </Button>
            <Button variant="secondary" onClick={() => setOpen(false)}>
              Continue in demo mode
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DevModeContext.Provider>
  );
};


