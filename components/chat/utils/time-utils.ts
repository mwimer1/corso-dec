// components/chat/utils/time-utils.ts

export function greetingWithName(name?: string, d: Date = new Date()): string {
  const hour = d.getHours();
  let base: 'Good morning' | 'Good afternoon' | 'Good evening';
  if (hour < 12) base = 'Good morning';
  else if (hour < 18) base = 'Good afternoon';
  else base = 'Good evening';

  return name ? `${base}, ${name}` : base;
}


