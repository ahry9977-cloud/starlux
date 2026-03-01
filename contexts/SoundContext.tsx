import React, { createContext, useContext, useMemo, useState } from "react";

type SoundContextValue = {
  enabled: boolean;
  volume: number;
  setEnabled: (enabled: boolean) => void;
  setVolume: (volume: number) => void;
  toggle: () => boolean;
  play: (_type: string) => void;
};

const SoundContext = createContext<SoundContextValue | null>(null);

export function SoundProvider({
  children,
}: {
  children: React.ReactNode;
}): React.JSX.Element {
  const [enabled, setEnabled] = useState(false);
  const [volume, setVolume] = useState(0.5);

  const value = useMemo<SoundContextValue>(() => {
    return {
      enabled,
      volume,
      setEnabled,
      setVolume,
      toggle: () => {
        const next = !enabled;
        setEnabled(next);
        return next;
      },
      play: () => {
        // no-op (sound system not wired yet)
      },
    };
  }, [enabled, volume]);

  return <SoundContext.Provider value={value}>{children}</SoundContext.Provider>;
}

export function useSoundContext(): SoundContextValue {
  const ctx = useContext(SoundContext);
  if (!ctx) {
    return {
      enabled: false,
      volume: 0.5,
      setEnabled: () => {},
      setVolume: () => {},
      toggle: () => false,
      play: () => {},
    };
  }
  return ctx;
}
