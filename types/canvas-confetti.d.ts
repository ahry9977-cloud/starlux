declare module "canvas-confetti" {
  type Options = Record<string, unknown>;
  interface Confetti {
    (options?: Options): void;
    reset(): void;
  }
  const confetti: Confetti;
  export default confetti;
}
