export async function runTest(name, fn) {
  try {
    const details = await fn();
    return { name, passed: true, details: details ?? null };
  } catch (error) {
    return {
      name,
      passed: false,
      error: error?.message || String(error),
    };
  }
}
