export function getGameGradient(name = "") {
  const n = String(name).toLowerCase();

  if (n.includes("dungeon")) return "linear-gradient(135deg, #45207f, #1a0f36)";
  if (n.includes("space")) return "linear-gradient(135deg, #1f4a7a, #0b2238)";
  if (n.includes("twilight")) return "linear-gradient(135deg, #6a2e43, #250f16)";
  if (n.includes("subway")) return "linear-gradient(135deg, #245a58, #103030)";
  if (n.includes("cheeze") || n.includes("chopped")) return "linear-gradient(135deg, #75612d, #2f2610)";
  if (n.includes("soundtrack")) return "linear-gradient(135deg, #40617a, #1a2d3b)";

  return "linear-gradient(135deg, #234564, #0e1f31)";
}
