// Consumer that imports from the used barrel
import { usedFunction } from './used-barrel';

export function consumerFunction() {
  return usedFunction();
}

