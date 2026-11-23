(() => {
if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

"use strict";

/* =======================================================================
   CONFIG — every knob you'd want to tweak for the portfolio lives here.
   ======================================================================= */
const CONFIG = {
  fontSize:    16,      // glyph size in px (drives grid density)
  lineHeight:  1.25,    // cell height = fontSize * lineHeight
  maxDPR:      1.5,     // cap device-pixel-ratio (lower = fewer pixels = faster on retina)
  speed:       0.25,    // swirl animation speed (the spiral motion)

  // Animated swirl (inverse-mapped, so the field stays fully packed — no holes)
  swirl:       1.6,     // twist strength
  swirlPower:  0.5,     // how twist scales with distance from center

  // Animated ambient field (value-noise fBm) — the flowing orange<->purple texture.
  noiseScale:  2.4,     // spatial frequency of the bands
  noiseTime:   0.22,    // how fast the bands morph
  octaves:     3,       // fBm detail
  contrast:    1.7,     // ridge/valley separation
  ambientLow:  0.10,    // coldest ambient -> deep purple (low end of inferno)
  ambientHigh: 0.60,    // hottest ambient -> orange tint (capped below yellow)

  // Cursor "hot spot": a smooth round gradient that lifts the local area to yellow.
  heatRadius:  150,     // gaussian radius in px
  heatGain:    1.0,     // peak heat at the cursor (1 = full yellow)

  // Glassy magnifier lens, coupled to the cursor: warps the field sampling so the
  // area under the pointer looks magnified (the "glass"). Eased so it trails smoothly.
  lensRadius:  175,     // lens size in px
  lensMag:     0.55,    // magnification (0 = off; ~0.55 ≈ 2x at centre; keep < 0.9)
  cursorEase:  0.12,    // cursor smoothing (lower = more trailing / wispier lag)

  // "Smoky" chromatic aberration: RGB-split fringe that blooms around the cursor,
  // with the split direction warped by drifting noise (the wispy smoke).
  caStrength:  5,      // max channel offset in px at the cursor
  caRadius:    100,     // gaussian falloff radius in px (matched to the lens)
  caSmoke:     1.7,     // how hard noise bends the split direction (0 = clean radial)
  caSmokeFreq: 0.012,   // spatial scale of the smoke wisps
  caDrift:     0.5,     // how fast the smoke drifts over time
  caEdge:      0.9,     // extra fringe at the glass rim (the glassy refracted edge)
  caAlpha:     0.55,    // fringe opacity

  levels:      26,      // color quantization buckets (perf: fewer fillStyle changes)

  // "Inferno" thermodynamic ramp [r,g,b], cold valley first -> hot ridge last
  palette: [
    [27,18,34],     // warm near-black (matches lifted backdrop)
    [40,11,84],     // deep purple
    [101,21,110],   // purple
    [159,42,99],    // magenta
    [212,72,66],    // red
    [245,125,21],   // orange
    [250,193,39],   // amber
    [252,255,164],  // pale yellow (hottest)
  ],
};

/* Source text the glyphs are sampled from — gives the "scrolling code" identity. */
const SOURCE = `
KR01_Genesis_Navier_Stokes_Incompressible_Continuity = "div(u) = 0"
VS67_Sauron_Navier_Stokes_Incompressible_Momentum = "rho * (du/dt + u * grad(u)) = -grad(p) + mu * del^2(u) + f"
IO99_Gatekeeper_Navier_Stokes_Compressible_Continuity = "d(rho)/dt + div(rho * u) = 0"
GX10_Iris_Navier_Stokes_Viscous_Stress_Tensor = "tau = 2 * mu * E + lambda * div(u) * I"
SC55_Cerberus_Navier_Stokes_Vorticity_Transport = "d(omega)/dt + (u * grad)*omega = (omega * grad)*u + nu * del^2(omega)"
TR66_Hunter_Navier_Stokes_Reynolds_Averaged_Momentum = "rho * u_j * d(u_i)/dx_j = rho * f_i + d/dx_j * [-p * delta_ij + mu * (d(u_i)/dx_j + d(u_j)/dx_i) - rho * u_i_prime * u_j_prime]"
OB33_Monolith_General_Relativity_Einstein_Field_Equations = "G_mu_nu + Lambda * g_mu_nu = 8 * pi * G / c^4 * T_mu_nu"
CPX4_Cortex_General_Relativity_Geodesic_Equation = "d^2(x_mu)/d(lambda)^2 + Gamma_mu_alpha_beta * d(x_alpha)/d(lambda) * d(x_beta)/d(lambda) = 0"
DP44_Prism_General_Relativity_Riemann_Curvature_Tensor = "R_rho_sigma_mu_nu = d_mu(Gamma_rho_nu_sigma) - d_nu(Gamma_rho_mu_sigma) + Gamma_rho_mu_lambda * Gamma_lambda_nu_sigma - Gamma_rho_nu_lambda * Gamma_lambda_mu_sigma"
CR99_Enigma_General_Relativity_Schwarzschild_Metric = "ds^2 = -(1 - 2*G*M / (c^2 * r)) * c^2 * dt^2 + (1 - 2*G*M / (c^2 * r))^-1 * dr^2 + r^2 * d(Omega)^2"
RC01_Spectre_General_Relativity_Killing_Equation = "grad_mu(xi_nu) + grad_nu(xi_mu) = 0"
AI00_Oracle_General_Relativity_Ricci_Tensor = "R_mu_nu = R_lambda_mu_lambda_nu"
VM82_Mnemosyne_Isentropic_Flow_Stagnation_Pressure_Ratio = "P0 / P = (1 + (gamma - 1) / 2 * M^2)^(gamma / (gamma - 1))"
VS88_Argus_Isentropic_Flow_Stagnation_Temperature_Ratio = "T0 / T = 1 + (gamma - 1) / 2 * M^2"
NK23_Hermes_Isentropic_Flow_Stagnation_Density_Ratio = "rho0 / rho = (1 + (gamma - 1) / 2 * M^2)^(1 / (gamma - 1))"
WB09_Valkyrie_Isentropic_Flow_Area_Mach_Relation = "A / A_star = (1 / M) * ((2 / (gamma + 1)) * (1 + (gamma - 1) / 2 * M^2))^((gamma + 1) / (2 * (gamma - 1)))"
EV77_Horizon_Isentropic_Flow_Speed_of_Sound = "a = sqrt(gamma * R * T)"
BT00_Zero_Isentropic_Flow_Characteristic_Mach_Number = "M_star = M * sqrt((gamma + 1) / (2 + (gamma - 1) * M^2))"
TX09_Chroma_Thermodynamics_First_Law = "dU = dQ - dW"
ID07_Ghost_Thermodynamics_Fundamental_Relation = "dU = T * dS - P * dV"
SNX1_Viper_Thermodynamics_Gibbs_Free_Energy = "G = H - T * S"
BM19_Leviathan_Thermodynamics_Clausius_Clapeyron = "dP / dT = L / (T * delta_V)"
PS12_Dynamo_Thermodynamics_Ideal_Gas_Law = "P * V = n * R * T"
HZ60_Refresh_Thermodynamics_Maxwell_Relation = "dT / dV_S = -dP / dS_V"
PL13_Locksmith_Discretization_Central_Difference_First_Derivative = "d(phi)/dx = (phi_i_plus_1 - phi_i_minus_1) / (2 * delta_x)"
DF05_Phalanx_Discretization_Central_Difference_Second_Derivative = "d^2(phi)/dx^2 = (phi_i_plus_1 - 2 * phi_i + phi_i_minus_1) / delta_x^2"
XF51_Roswell_Discretization_Forward_Euler = "u_n_plus_1 = u_n + delta_t * f(t_n, u_n)"
LU01_Lumens_Discretization_Crank_Nicolson = "(u_n_plus_1 - u_n) / delta_t = 0.5 * (F(u_n_plus_1) + F(u_n))"
SH42_Aegis_Discretization_First_Order_Upwind = "v * d(phi)/dx = v * (phi_i - phi_i_minus_1) / delta_x"
SY99_Overlord_Discretization_Runge_Kutta_Fourth_Order = "u_n_plus_1 = u_n + (delta_t / 6) * (k1 + 2*k2 + 2*k3 + k4)"
`;
const LINES = SOURCE.trim().split("\n").map(s => s.trim() + "  ");

/* ---- Fast integer-lattice value noise + fBm (no deps, no Math.sin hashing) ---- */
function vhash(ix, iy, iz) {
  let n = (ix | 0) * 374761393 + (iy | 0) * 668265263 + (iz | 0) * 1274126177;
  n = (n ^ (n >>> 13)) >>> 0;
  n = (n * 1274126177) >>> 0;
  return (n & 0xffffff) / 0x1000000;          // [0,1)
}
const smooth = t => t * t * (3 - 2 * t);        // smoothstep
function valueNoise(x, y, z) {
  const xi = Math.floor(x), yi = Math.floor(y), zi = Math.floor(z);
  const xf = smooth(x - xi), yf = smooth(y - yi), zf = smooth(z - zi);
  const lerp = (a, b, t) => a + (b - a) * t;
  const c000 = vhash(xi,   yi,   zi),   c100 = vhash(xi+1, yi,   zi);
  const c010 = vhash(xi,   yi+1, zi),   c110 = vhash(xi+1, yi+1, zi);
  const c001 = vhash(xi,   yi,   zi+1), c101 = vhash(xi+1, yi,   zi+1);
  const c011 = vhash(xi,   yi+1, zi+1), c111 = vhash(xi+1, yi+1, zi+1);
  return lerp(
    lerp(lerp(c000, c100, xf), lerp(c010, c110, xf), yf),
    lerp(lerp(c001, c101, xf), lerp(c011, c111, xf), yf),
    zf
  );
}
function fbm(x, y, z, octaves) {
  let sum = 0, amp = 0.5, freq = 1, norm = 0;
  for (let o = 0; o < octaves; o++) {
    sum  += amp * valueNoise(x * freq, y * freq, z * freq);
    norm += amp; amp *= 0.5; freq *= 2;
  }
  return sum / norm;                              // [0,1]
}

/* =======================================================================
   Renderer
   ======================================================================= */
const canvas = document.getElementById("field");
const ctx = canvas.getContext("2d", { alpha: false });

let W = 0, H = 0, dpr = 1;
let cellW = 0, cellH = 0, cols = 0, rows = 0;

// Precompute the palette LUT once (brightness level -> "rgb(...)" string).
const LUT = new Array(CONFIG.levels + 1);
function buildLUT() {
  const stops = CONFIG.palette, segs = stops.length - 1;
  for (let i = 0; i <= CONFIG.levels; i++) {
    const t = i / CONFIG.levels;            // 0..1
    const s = Math.min(segs - 1, Math.floor(t * segs));
    const lt = t * segs - s;
    const a = stops[s], b = stops[s + 1];
    const r = Math.round(a[0] + (b[0] - a[0]) * lt);
    const g = Math.round(a[1] + (b[1] - a[1]) * lt);
    const bl = Math.round(a[2] + (b[2] - a[2]) * lt);
    const gray = Math.round(0.2126 * r + 0.7152 * g + 0.0722 * bl);
    LUT[i] = `rgb(${gray},${gray},${gray})`;
  }
}
buildLUT();

// ---- Brightness->ambient LUT: folds Math.pow(contrast) out of the hot loop ----
const ambLUT = new Float32Array(1024);
for (let i = 0; i < 1024; i++) {
  const a = Math.pow(i / 1023, CONFIG.contrast);
  ambLUT[i] = CONFIG.ambientLow + (CONFIG.ambientHigh - CONFIG.ambientLow) * a;
}

// ---- Source text as char codes (no per-cell string allocation) ----
const LINE_CODES = LINES.map(l => {
  const a = new Uint16Array(l.length);
  for (let i = 0; i < l.length; i++) a[i] = l.charCodeAt(i);
  return a;
});
function getCodeAt(tx, ty) {
  const n = LINE_CODES.length;
  const arr = LINE_CODES[((ty % n) + n) % n];
  const m = arr.length;
  return arr[((tx % m) + m) % m];
}

// ---- Glyph atlas: each glyph is rasterised ONCE, then blitted with drawImage
//      (far cheaper than fillText per cell). Base atlas = one row per level. ----
const charCol = new Int16Array(128).fill(-1);   // ASCII code -> atlas column
const atlasChars = [];
for (const arr of LINE_CODES) for (const code of arr) {
  if (code !== 32 && code < 128 && charCol[code] === -1) { charCol[code] = atlasChars.length; atlasChars.push(code); }
}
let atlasBase, atlasRed, atlasCyan, atlasLime, tileWd, tileHd;
function makeTintRow(color, fontDev) {
  const cv = document.createElement("canvas");
  cv.width = atlasChars.length * tileWd; cv.height = tileHd;
  const a = cv.getContext("2d");
  a.textBaseline = "top"; a.font = fontDev; a.fillStyle = color;
  for (let i = 0; i < atlasChars.length; i++) a.fillText(String.fromCharCode(atlasChars[i]), i * tileWd, 0);
  return cv;
}
function buildAtlas() {
  tileWd = Math.max(1, Math.ceil(cellW * dpr));
  tileHd = Math.max(1, Math.ceil(cellH * dpr));
  const fontDev = `${CONFIG.fontSize * dpr}px ui-monospace, "SFMono-Regular", Menlo, Consolas, monospace`;
  atlasBase = document.createElement("canvas");
  atlasBase.width = atlasChars.length * tileWd;
  atlasBase.height = (CONFIG.levels + 1) * tileHd;
  const a = atlasBase.getContext("2d");
  a.textBaseline = "top"; a.font = fontDev;
  for (let lvl = 0; lvl <= CONFIG.levels; lvl++) {
    a.fillStyle = LUT[lvl];
    for (let i = 0; i < atlasChars.length; i++) a.fillText(String.fromCharCode(atlasChars[i]), i * tileWd, lvl * tileHd);
  }
  atlasRed  = makeTintRow("rgb(91,91,91)", fontDev);     // grayscale fringe
  atlasCyan = makeTintRow("rgb(170,170,170)", fontDev);
  atlasLime = makeTintRow("rgb(201,242,90)", fontDev);
}

// ---- Static per-cell geometry (constant until resize), so the hot loop skips
//      atan2 / pow / sqrt for every cell the lens isn't currently warping. ----
let gDist, gAng, gDistPow;
function buildGeometry() {
  const asp = W / H, N = cols * rows;
  gDist = new Float32Array(N); gAng = new Float32Array(N); gDistPow = new Float32Array(N);
  let i = 0;
  for (let gy = 0; gy < rows; gy++) for (let gx = 0; gx < cols; gx++, i++) {
    const nx = (gx / cols - 0.5) * asp, ny = (gy / rows - 0.5);
    const d = Math.sqrt(nx * nx + ny * ny);
    gDist[i] = d; gAng[i] = Math.atan2(ny, nx); gDistPow[i] = Math.pow(d, CONFIG.swirlPower);
  }
}

// Scratch arrays for cells near the cursor (fed to the chromatic-aberration pass).
const caCode = [], caX = [], caY = [];

function resize() {
  dpr = Math.min(window.devicePixelRatio || 1, CONFIG.maxDPR);   // cap DPR for perf
  W = window.innerWidth; H = window.innerHeight;
  canvas.width = Math.round(W * dpr);
  canvas.height = Math.round(H * dpr);
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.font = `${CONFIG.fontSize}px ui-monospace, "SFMono-Regular", Menlo, Consolas, monospace`;
  ctx.textBaseline = "top";
  cellW = ctx.measureText("M").width || CONFIG.fontSize * 0.6;
  cellH = CONFIG.fontSize * CONFIG.lineHeight;
  cols = Math.ceil(W / cellW) + 1;
  rows = Math.ceil(H / cellH) + 1;
  buildGeometry();
  buildAtlas();
}
window.addEventListener("resize", resize);
resize();

// Raw pointer target; the lens follows an *eased* copy (lcx,lcy) so it trails smoothly.
let mxPx = W / 2, myPx = H / 2;          // raw target
let lcx = W / 2, lcy = H / 2;            // eased lens centre
window.addEventListener("pointermove", e => { mxPx = e.clientX; myPx = e.clientY; });

let pending = true;
function frame(now) {
  pending = false;
  const t = now * 0.001 * CONFIG.speed;
  const tCA = now * 0.001;                                  // real seconds for CA drift
  const asp = W / H;
  const inv2sig2 = 1 / (2 * CONFIG.heatRadius * CONFIG.heatRadius);
  const caInv2 = 1 / (2 * CONFIG.caRadius * CONFIG.caRadius);
  const caCullSq = (CONFIG.caRadius * 2.6) ** 2;            // ignore cells with ~0 fringe
  const lensR = CONFIG.lensRadius, lensR2 = lensR * lensR;

  // Hoist hot config values into locals (fewer property lookups per cell).
  const swirl = CONFIG.swirl, swirlPow = CONFIG.swirlPower, lensMag = CONFIG.lensMag;
  const noiseScale = CONFIG.noiseScale, noiseTime = CONFIG.noiseTime, octaves = CONFIG.octaves;
  const heatGain = CONFIG.heatGain, levels = CONFIG.levels, cw = cellW, chh = cellH;

  // Ease the lens centre toward the cursor — this is what makes it smooth + wispy.
  lcx += (mxPx - lcx) * CONFIG.cursorEase;
  lcy += (myPx - lcy) * CONFIG.cursorEase;

  ctx.fillStyle = "#151515";
  ctx.fillRect(0, 0, W, H);

  caCode.length = 0; caX.length = 0; caY.length = 0;

  let i = 0;
  for (let gy = 0; gy < rows; gy++) {
    for (let gx = 0; gx < cols; gx++, i++) {
      const px = gx * cw, py = gy * chh;
      const ldx = px - lcx, ldy = py - lcy;
      const ld2 = ldx * ldx + ldy * ldy;

      // Geometry: precomputed outside the lens, recomputed (warped) inside it.
      let dist, ang0, distPow;
      if (ld2 < lensR2) {
        const r = Math.sqrt(ld2) / lensR;                   // 0 centre -> 1 rim
        const scale = 1 - lensMag * (1 - smooth(r));        // <1 near centre = magnify
        const u = (lcx + ldx * scale) / cw / cols;
        const v = (lcy + ldy * scale) / chh / rows;
        const nx = (u - 0.5) * asp, ny = (v - 0.5);
        dist = Math.sqrt(nx * nx + ny * ny);
        ang0 = Math.atan2(ny, nx);
        distPow = Math.pow(dist, swirlPow);
      } else {
        dist = gDist[i]; ang0 = gAng[i]; distPow = gDistPow[i];
      }

      // --- Animated inverse-mapped swirl: the spiral motion ---
      const ang = ang0 + swirl * distPow * t;
      const su = Math.cos(ang) * dist, sv = Math.sin(ang) * dist;

      const tx = Math.floor((su / asp + 0.5) * cols);
      const ty = Math.floor((sv + 0.5) * rows);
      const code = getCodeAt(tx, ty);
      if (code === 32) continue;                            // space -> leave background

      // --- Ambient brightness (LUT'd), lifted toward yellow by the cursor hot spot ---
      const af = fbm(su * noiseScale + 100, sv * noiseScale + 100, t * noiseTime, octaves);
      const amb = ambLUT[(af * 1023) | 0];
      const heat = heatGain * Math.exp(-ld2 * inv2sig2);
      const b = 1 - (1 - amb) * (1 - heat);

      let lvl = (b * levels) | 0;
      if (lvl < 0) lvl = 0; else if (lvl > levels) lvl = levels;

      // Blit the pre-rasterised glyph tile (char column, brightness row).
      ctx.drawImage(atlasBase, charCol[code] * tileWd, lvl * tileHd, tileWd, tileHd, px, py, cw, chh);
      // A pair of faint, widely spaced strands follows the warped source rows.
      if (((ty % 24) + 24) % 24 < 2) {
        ctx.globalAlpha = 0.18;
        ctx.drawImage(atlasLime, charCol[code] * tileWd, 0, tileWd, tileHd, px, py, cw, chh);
        ctx.globalAlpha = 1;
      }

      if (ld2 < caCullSq) { caCode.push(code); caX.push(px); caY.push(py); }
    }
  }

  // --- Smoky chromatic aberration pass (additive, near the cursor only) ---
  // Re-blit collected glyphs as offset red + cyan ghosts. The offset grows toward
  // the cursor and is bent by drifting noise, so the colour fringe reads as smoke.
  ctx.globalCompositeOperation = "lighter";
  const caStrength = CONFIG.caStrength, caSmoke = CONFIG.caSmoke, caSmokeFreq = CONFIG.caSmokeFreq,
        caDrift = CONFIG.caDrift, caEdge = CONFIG.caEdge, caAlpha = CONFIG.caAlpha, caRadius = CONFIG.caRadius;
  for (let k = 0; CONFIG.caAlpha > 0 && k < caCode.length; k++) {
    const px = caX[k], py = caY[k];
    const dx = px - lcx, dy = py - lcy;                     // distance to eased centre
    const d2 = dx * dx + dy * dy;
    const d = Math.sqrt(d2) || 0.0001;
    const fall = Math.exp(-d2 * caInv2);                    // smoky bloom (centre-weighted)
    const r = d / caRadius;                                 // 0 centre -> 1 rim
    const edge = (r < 1) ? caEdge * 4 * r * (1 - r) : 0;    // glassy refracted rim
    const mag = fall + edge;

    const n = fbm(px * caSmokeFreq, py * caSmokeFreq, tCA * caDrift, 2);
    const rot = (n - 0.5) * Math.PI * caSmoke;
    const cr = Math.cos(rot), sr = Math.sin(rot);
    const ux = dx / d, uy = dy / d;
    const wx = ux * cr - uy * sr, wy = ux * sr + uy * cr;   // warped split direction

    const off = caStrength * mag * (0.4 + n);
    const sx = charCol[caCode[k]] * tileWd;
    ctx.globalAlpha = caAlpha * Math.min(1, mag);
    ctx.drawImage(atlasRed,  sx, 0, tileWd, tileHd, px + wx * off, py + wy * off, cw, chh);
    ctx.drawImage(atlasCyan, sx, 0, tileWd, tileHd, px - wx * off, py - wy * off, cw, chh);
  }
  ctx.globalAlpha = 1;
  ctx.globalCompositeOperation = "source-over";

  if (!document.hidden) { pending = true; requestAnimationFrame(frame); }
}
requestAnimationFrame(frame);
// Pause the loop while the tab is hidden; resume (once) when it returns.
document.addEventListener("visibilitychange", () => {
  if (!document.hidden && !pending) { pending = true; requestAnimationFrame(frame); }
});

})();
