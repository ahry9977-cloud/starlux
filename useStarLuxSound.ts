/**
 * STAR LUX - React Hook for Interactive Sounds
 * Hook للتعامل مع الأصوات التفاعلية في React
 */

import { useCallback, useEffect, useRef } from 'react';
import {
  initStarLuxAudio,
  playSound,
  playHoverSound,
  playClickSound,
  playNavigationSound,
  playSubmitSound,
  playSuccessSound,
  playErrorSound,
  playWarningSound,
  playNotificationSound,
  playAdminSound,
  playToggleSound,
  playDeleteSound,
  playOpenSound,
  playCloseSound,
  getSoundSettings,
  updateSoundSettings,
  toggleSound,
  setVolume,
  toggleHoverSounds,
  type SoundSettings,
  type StarLuxSoundType,
  type ElementSoundType,
  getSoundForElement
} from '../lib/starLuxAudioManager';

/**
 * Main hook for Star Lux sounds
 */
export const useStarLuxSound = () => {
  const isInitialized = useRef(false);

  useEffect(() => {
    if (!isInitialized.current) {
      initStarLuxAudio();
      isInitialized.current = true;
    }
  }, []);

  return {
    // Play specific sounds
    playSound,
    playHoverSound,
    playClickSound,
    playNavigationSound,
    playSubmitSound,
    playSuccessSound,
    playErrorSound,
    playWarningSound,
    playNotificationSound,
    playAdminSound,
    playToggleSound,
    playDeleteSound,
    playOpenSound,
    playCloseSound,
    
    // Settings
    getSettings: getSoundSettings,
    updateSettings: updateSoundSettings,
    toggleSound,
    setVolume,
    toggleHoverSounds
  };
};

/**
 * Hook for button sounds with automatic event binding
 */
export const useButtonSound = (
  elementType: ElementSoundType = 'primary-button',
  enableHover: boolean = true
) => {
  const playElementSound = useCallback(() => {
    getSoundForElement(elementType)();
  }, [elementType]);

  const handleClick = useCallback((e?: React.MouseEvent) => {
    playElementSound();
  }, [playElementSound]);

  const handleMouseEnter = useCallback(() => {
    if (enableHover) {
      playHoverSound();
    }
  }, [enableHover]);

  const handlePointerDown = useCallback(() => {
    playElementSound();
  }, [playElementSound]);

  const handleTouchStart = useCallback(() => {
    playElementSound();
  }, [playElementSound]);

  return {
    onClick: handleClick,
    onMouseEnter: handleMouseEnter,
    onPointerDown: handlePointerDown,
    onTouchStart: handleTouchStart,
    // Combined props for easy spreading
    soundProps: {
      onClick: handleClick,
      onMouseEnter: handleMouseEnter
    }
  };
};

/**
 * Hook for navigation sounds
 */
export const useNavigationSound = () => {
  const handleNavigate = useCallback(() => {
    playNavigationSound();
  }, []);

  const handleHover = useCallback(() => {
    playHoverSound();
  }, []);

  return {
    onNavigate: handleNavigate,
    onHover: handleHover,
    soundProps: {
      onClick: handleNavigate,
      onMouseEnter: handleHover
    }
  };
};

/**
 * Hook for form sounds
 */
export const useFormSound = () => {
  const handleSubmit = useCallback(() => {
    playSubmitSound();
  }, []);

  const handleSuccess = useCallback(() => {
    playSuccessSound();
  }, []);

  const handleError = useCallback(() => {
    playErrorSound();
  }, []);

  const handleInputFocus = useCallback(() => {
    playHoverSound();
  }, []);

  return {
    onSubmit: handleSubmit,
    onSuccess: handleSuccess,
    onError: handleError,
    onInputFocus: handleInputFocus
  };
};

/**
 * Hook for toggle sounds
 */
export const useToggleSound = () => {
  const handleToggle = useCallback((isOn: boolean) => {
    playToggleSound(isOn);
  }, []);

  return {
    onToggle: handleToggle
  };
};

/**
 * Hook for modal/dialog sounds
 */
export const useModalSound = () => {
  const handleOpen = useCallback(() => {
    playOpenSound();
  }, []);

  const handleClose = useCallback(() => {
    playCloseSound();
  }, []);

  return {
    onOpen: handleOpen,
    onClose: handleClose
  };
};

/**
 * Hook for admin actions
 */
export const useAdminSound = () => {
  const handleAction = useCallback(() => {
    playAdminSound();
  }, []);

  const handleDelete = useCallback(() => {
    playDeleteSound();
  }, []);

  const handleWarning = useCallback(() => {
    playWarningSound();
  }, []);

  return {
    onAction: handleAction,
    onDelete: handleDelete,
    onWarning: handleWarning
  };
};

/**
 * Hook for notification sounds
 */
export const useNotificationSound = () => {
  const handleNotification = useCallback(() => {
    playNotificationSound();
  }, []);

  const handleSuccess = useCallback(() => {
    playSuccessSound();
  }, []);

  const handleError = useCallback(() => {
    playErrorSound();
  }, []);

  const handleWarning = useCallback(() => {
    playWarningSound();
  }, []);

  return {
    onNotification: handleNotification,
    onSuccess: handleSuccess,
    onError: handleError,
    onWarning: handleWarning
  };
};

// Export types
export type { SoundSettings, StarLuxSoundType, ElementSoundType };
