/**
 * @schema 2.10
 * @input hours: number = 10
 * @input minutes: number = 10
 * @input seconds: number = 30
 * @input tickLength: number = 10
 * @input stroke: number = 1.5
 * @input faceColor: color = #0A0A0A
 * @input handColor: color = #FFFFFF
 * @input secondColor: color = #A855F7
 * @input tickColor: color = #71717A
 * @input ringColor: color = #1A1A1A
 * @input numberFont: string = "Anton"
 * @input numberWeight: string = "400"
 */

const w = pencil.width;
const h = pencil.height;
const cx = w / 2;
const cy = h / 2;
const radius = Math.min(cx, cy) * 0.9;

const nodes = [];

function f(n) {
  return n.toFixed(1);
}

function pushLine(x1, y1, x2, y2, thickness, color) {
  nodes.push({
    type: "path",
    x: 0,
    y: 0,
    width: w,
    height: h,
    viewBox: [0, 0, w, h],
    geometry: "M " + f(x1) + " " + f(y1) + " L " + f(x2) + " " + f(y2),
    stroke: {
      align: "center",
      thickness: thickness,
      cap: "round",
      fill: [{ type: "color", color: color }],
    },
  });
}

function drawHand(fraction, length, thickness, color) {
  const angle = fraction * Math.PI * 2 - Math.PI / 2;
  const x2 = cx + Math.cos(angle) * length;
  const y2 = cy + Math.sin(angle) * length;
  pushLine(cx, cy, x2, y2, thickness, color);
}

nodes.push({
  type: "ellipse",
  x: cx - radius - 2,
  y: cy - radius - 2,
  width: (radius + 2) * 2,
  height: (radius + 2) * 2,
  fill: [{ type: "color", color: pencil.input.faceColor }],
  stroke: {
    align: "outside",
    thickness: 2,
    fill: [{ type: "color", color: pencil.input.ringColor }],
  },
  effect: {
    type: "shadow",
    shadowType: "outer",
    color: "#000000B3",
    offset: { x: 0, y: 8 },
    blur: 20,
  },
});

nodes.push({
  type: "ellipse",
  x: cx - radius,
  y: cy - radius,
  width: radius * 2,
  height: radius * 2,
  stroke: {
    align: "inside",
    thickness: 1,
    fill: [{ type: "color", color: pencil.input.secondColor + "33" }],
  },
});

for (let i = 0; i < 60; i++) {
  if (i % 5 === 0) {
    continue;
  }
  const angle = (i / 60) * Math.PI * 2 - Math.PI / 2;
  const outerR = radius - 6;
  const innerR = outerR - pencil.input.tickLength * 0.4;

  pushLine(
    cx + Math.cos(angle) * innerR,
    cy + Math.sin(angle) * innerR,
    cx + Math.cos(angle) * outerR,
    cy + Math.sin(angle) * outerR,
    pencil.input.stroke * 0.4,
    pencil.input.tickColor + "80"
  );
}

for (let i = 0; i < 12; i++) {
  const angle = (i / 12) * Math.PI * 2 - Math.PI / 2;
  const outerR = radius - 6;
  const innerR = outerR - pencil.input.tickLength;

  pushLine(
    cx + Math.cos(angle) * innerR,
    cy + Math.sin(angle) * innerR,
    cx + Math.cos(angle) * outerR,
    cy + Math.sin(angle) * outerR,
    pencil.input.stroke * 1.2,
    pencil.input.handColor
  );
}

for (let i = 0; i < 12; i++) {
  const angle = (i / 12) * Math.PI * 2 - Math.PI / 2;
  const numR = radius - pencil.input.tickLength - 18;
  const nx = cx + Math.cos(angle) * numR;
  const ny = cy + Math.sin(angle) * numR;
  const label = i === 0 ? "12" : String(i);
  const fontSize = radius * 0.16;

  nodes.push({
    type: "text",
    x: nx - fontSize,
    y: ny - fontSize * 0.55,
    width: fontSize * 2,
    height: fontSize * 1.1,
    content: label,
    fontSize: fontSize,
    fontFamily: pencil.input.numberFont,
    fontWeight: pencil.input.numberWeight,
    textAlign: "center",
    textAlignVertical: "middle",
    textGrowth: "fixed-width-height",
    fill: [{ type: "color", color: pencil.input.handColor }],
  });
}

drawHand(
  ((pencil.input.hours % 12) + pencil.input.minutes / 60) / 12,
  radius * 0.48,
  pencil.input.stroke * 3,
  pencil.input.handColor
);
drawHand(
  pencil.input.minutes / 60,
  radius * 0.68,
  pencil.input.stroke * 2,
  pencil.input.handColor
);
drawHand(
  pencil.input.seconds / 60,
  radius * 0.75,
  pencil.input.stroke * 0.7,
  pencil.input.secondColor
);

const secAngle = (pencil.input.seconds / 60) * Math.PI * 2 - Math.PI / 2;
pushLine(
  cx,
  cy,
  cx - Math.cos(secAngle) * radius * 0.18,
  cy - Math.sin(secAngle) * radius * 0.18,
  pencil.input.stroke * 0.7,
  pencil.input.secondColor
);

nodes.push({
  type: "ellipse",
  x: cx - 5,
  y: cy - 5,
  width: 10,
  height: 10,
  fill: [{ type: "color", color: pencil.input.secondColor }],
  effect: {
    type: "shadow",
    shadowType: "outer",
    color: pencil.input.secondColor + "66",
    offset: { x: 0, y: 0 },
    blur: 8,
  },
});

nodes.push({
  type: "ellipse",
  x: cx - 2,
  y: cy - 2,
  width: 4,
  height: 4,
  fill: [{ type: "color", color: pencil.input.faceColor }],
});

return nodes;
