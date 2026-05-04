/**
 * Pet-on-template definitions for Tier 0 (no signup) flow.
 *
 * Each template = clean-masked design (circular window / vignette frame / badge)
 * where the customer's pet photo composites in. NO fur-blending into a body —
 * that's what AI generation tier handles.
 *
 * Two layers per template:
 *  1. Parametric base — rendered in Konva preview AND server-side print master.
 *     Always present. Defines the cutout shape + frame stroke + bg colour.
 *  2. Optional PNG decoration — rendered on top (crowns, ribbons, ornaments).
 *     File lives in /public/portraits/templates/{id}-deco.png. Optional for v1.
 *
 * Server-side composite uses the same parameters at 3000×3000 px (Gelato spec)
 * via `sharp` in api/portraits/composite.ts.
 */
import type { ProductTypeKey } from "../productLineup";

export type MaskShape = "circle" | "oval" | "hex" | "crest";

export interface TemplateDef {
  /** Stable id for routing/cart. */
  id: string;
  /** Display label. */
  label: string;
  /** Tagline shown under label in gallery. */
  tagline: string;
  /** Which Shopify product this template ships on. */
  productType: ProductTypeKey;
  /** Cutout window shape. */
  maskShape: MaskShape;
  /** Background colour behind the pet. */
  bgColor: string;
  /** Frame stroke colour. */
  frameColor: string;
  /** Frame stroke width as fraction of canvas size (0..1). */
  frameWidthFrac: number;
  /** Mask center as fraction of canvas (0..1). */
  maskCenter: { x: number; y: number };
  /** Mask radius (for circle) or size (for hex/crest) as fraction of canvas. */
  maskRadiusFrac: number;
  /** Optional PNG decoration overlay path (relative to /public). */
  decorationPng?: string;
  /** Gallery preview thumbnail path. */
  galleryThumb: string;
  /** Tags shown on the gallery card. */
  tags: string[];
}

/**
 * v1 starter library — 5 clean-masked templates across 5 surfaces.
 * Decoration PNGs are optional; templates render without them.
 */
export const TEMPLATES: TemplateDef[] = [
  {
    id: "circle-mug",
    label: "Cameo Mug",
    tagline: "Their face, framed in gold, on your morning brew.",
    productType: "mug",
    maskShape: "circle",
    bgColor: "#FFFDF5",
    frameColor: "#c4a265",
    frameWidthFrac: 0.025,
    maskCenter: { x: 0.5, y: 0.5 },
    maskRadiusFrac: 0.42,
    galleryThumb: "/portraits/templates/circle-mug.webp",
    tags: ["Mug", "Cream + gold", "Bestseller"],
  },
  {
    id: "vignette-canvas",
    label: "Heirloom Vignette Canvas",
    tagline: "Soft oval frame. Museum-grade canvas.",
    productType: "framed-canvas",
    maskShape: "oval",
    bgColor: "#FFFDF5",
    frameColor: "#c4a265",
    frameWidthFrac: 0.018,
    maskCenter: { x: 0.5, y: 0.5 },
    maskRadiusFrac: 0.45,
    galleryThumb: "/portraits/templates/vignette-canvas.webp",
    tags: ["Framed canvas", "Heirloom", "4 sizes"],
  },
  {
    id: "hex-tote",
    label: "Crest Tote",
    tagline: "Hex badge. Heavy canvas. Your pet, sigil-style.",
    productType: "tote",
    maskShape: "hex",
    bgColor: "#FFFDF5",
    frameColor: "#141210",
    frameWidthFrac: 0.022,
    maskCenter: { x: 0.5, y: 0.5 },
    maskRadiusFrac: 0.4,
    galleryThumb: "/portraits/templates/hex-tote.webp",
    tags: ["Tote", "Daily carry"],
  },
  {
    id: "badge-tee",
    label: "Pocket Badge Tee",
    tagline: "Subtle left-chest pet badge. 100% cotton.",
    productType: "tee",
    maskShape: "circle",
    bgColor: "#FFFDF5",
    frameColor: "#141210",
    frameWidthFrac: 0.02,
    maskCenter: { x: 0.5, y: 0.5 },
    maskRadiusFrac: 0.4,
    galleryThumb: "/portraits/templates/badge-tee.webp",
    tags: ["Tee", "6 sizes"],
  },
  {
    id: "crest-hoodie",
    label: "Crest Hoodie",
    tagline: "Heritage crest on the chest. Heavyweight hoodie.",
    productType: "hoodie",
    maskShape: "crest",
    bgColor: "#FFFDF5",
    frameColor: "#bf524a",
    frameWidthFrac: 0.024,
    maskCenter: { x: 0.5, y: 0.5 },
    maskRadiusFrac: 0.42,
    galleryThumb: "/portraits/templates/crest-hoodie.webp",
    tags: ["Hoodie", "6 sizes"],
  },
];

export function getTemplate(id: string): TemplateDef | undefined {
  return TEMPLATES.find((t) => t.id === id);
}

/**
 * Default user transform for the pet cutout inside the mask. Customer can
 * adjust via drag/zoom/rotate handles in <TemplatePreview>.
 */
export interface PetTransform {
  /** Center X as fraction of canvas (0..1). */
  cx: number;
  /** Center Y as fraction of canvas (0..1). */
  cy: number;
  /** Scale (1 = fits mask radius). */
  scale: number;
  /** Rotation in degrees. */
  rotation: number;
}

export const DEFAULT_TRANSFORM: PetTransform = {
  cx: 0.5,
  cy: 0.5,
  scale: 1,
  rotation: 0,
};
