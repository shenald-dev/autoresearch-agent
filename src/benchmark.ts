
const cache = new Map<string, string>();

async function mockInvoke(topic: string, depth: string): Promise<string> {
  // Simulate network latency of 500ms
  await new Promise(resolve => setTimeout(resolve, 500));
  return `Result for ${topic} at depth ${depth}`;
}

async function runCachedInvoke(topic: string, depth: string): Promise<string> {
  const cacheKey = `${topic}|${depth}`;
  const cached = cache.get(cacheKey);
  if (cached) return cached;

  const result = await mockInvoke(topic, depth);
  cache.set(cacheKey, result);
  return result;
}

async function runBenchmark() {
  const topic = "Performance Optimization";
  const depth = "3";

  console.log("--- Performance Verification (With Caching) ---");

  const start = Date.now();

  console.log("Call 1 (Cold)...");
  await runCachedInvoke(topic, depth);
  const after1 = Date.now();
  console.log(`Call 1 took ${after1 - start}ms`);

  console.log("Call 2 (Hot/Cached)...");
  await runCachedInvoke(topic, depth);
  const after2 = Date.now();
  console.log(`Call 2 took ${after2 - after1}ms`);

  console.log("Call 3 (Hot/Cached)...");
  await runCachedInvoke(topic, depth);
  const after3 = Date.now();
  console.log(`Call 3 took ${after3 - after2}ms`);

  const totalTime = after3 - start;
  console.log(`Total time for 3 calls: ${totalTime}ms`);
  console.log(`Average time per call: ${totalTime / 3}ms`);
}

runBenchmark().catch(console.error);
