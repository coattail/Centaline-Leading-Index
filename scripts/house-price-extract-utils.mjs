export function cityNameFromMetric(metricName) {
  const raw = String(metricName || "").trim();
  if (!raw) return "";

  const segments = raw
    .split(/[：:]/)
    .map((segment) => segment.trim())
    .filter(Boolean);

  if (segments.length === 0) return "";
  if (segments.length === 1) return segments[0];
  return segments[segments.length - 2];
}
