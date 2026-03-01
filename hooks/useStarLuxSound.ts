export function useStarLuxSound() {
  return {
    playClickSound: () => {},
    playSuccessSound: () => {},
    playErrorSound: () => {},
    playNavigationSound: () => {},
  };
}

export function useFormSound() {
  return {
    onSubmit: () => {},
  };
}

export function useNavigationSound() {
  return {
    onNavigate: () => {},
  };
}

export function useAdminSound() {
  return {
    playOpen: () => {},
    playClose: () => {},
  };
}

export function useModalSound() {
  return {
    playOpen: () => {},
    playClose: () => {},
  };
}
