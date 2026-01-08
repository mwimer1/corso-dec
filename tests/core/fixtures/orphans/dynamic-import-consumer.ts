// Consumer that uses dynamic import
export async function dynamicImportConsumer() {
  const { usedFunction } = await import('./used-barrel');
  return usedFunction();
}

