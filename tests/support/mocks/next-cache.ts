export function revalidateTag(_tag: string) {}
export function revalidatePath(_path: string) {}
export function unstable_cache<T extends (...args: any[]) => any>(fn: T): T {
  // pass-through in tests
  return fn;
}



