export function useRouter() {
  return { push: () => {}, replace: () => {}, refresh: () => {} };
}
export function notFound(): never {
  throw new Error("notFound");
}
export function redirect(_to: string): never {
  throw new Error("redirect");
}
export function useSearchParams() {
  return new URLSearchParams();
}



