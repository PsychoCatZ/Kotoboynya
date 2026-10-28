export {}

declare global {
  interface Window {
    kotoboynyaDesktop?: {
      isDesktop: true
      exit: () => void
    }
  }
}
