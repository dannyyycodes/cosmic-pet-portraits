/**
 * TemplatePreview — Konva-based live composite of pet cutout inside template mask.
 *
 * Layer order (bottom to top):
 *   1. Background fill (template.bgColor)
 *   2. Clipped Group with the pet image (draggable + Transformer attached)
 *   3. Frame stroke (mask shape outline)
 *   4. Optional decoration PNG (crowns, ribbons)
 *
 * Customer interactions: drag pet, pinch/scroll to zoom, drag handles to rotate.
 *
 * Output: parent gets PetTransform back via onChange so the same numbers can
 * drive the server-side print master in api/portraits/composite.ts at 3000×3000.
 */
import { useEffect, useMemo, useRef, useState } from "react";
import { Stage, Layer, Rect, Image as KonvaImage, Group, Circle, Ellipse, Line, Path, Transformer } from "react-konva";
import type Konva from "konva";
import type { TemplateDef, PetTransform } from "./data";

interface TemplatePreviewProps {
  template: TemplateDef;
  /** Public URL of the cutout PNG (transparent bg, pet only). */
  cutoutUrl: string;
  /** Current transform (controlled). */
  transform: PetTransform;
  onChange: (next: PetTransform) => void;
  /** Canvas pixel size on screen (square preview). */
  size?: number;
}

/** Hex shape vertices (flat-top), centered at (0,0), radius r. */
function hexPoints(r: number): number[] {
  const pts: number[] = [];
  for (let i = 0; i < 6; i++) {
    const angle = (Math.PI / 3) * i;
    pts.push(r * Math.cos(angle), r * Math.sin(angle));
  }
  return pts;
}

/** Heater-shield "crest" SVG path centred at (0,0), bounding ~r. */
function crestPathData(r: number): string {
  const w = r;
  const h = r * 1.18;
  // Move to top-left, line to top-right, curve down to bottom point.
  return `M ${-w} ${-h * 0.6} L ${w} ${-h * 0.6} L ${w} ${h * 0.1} Q ${w} ${h * 0.7} 0 ${h} Q ${-w} ${h * 0.7} ${-w} ${h * 0.1} Z`;
}

export function TemplatePreview({ template, cutoutUrl, transform, onChange, size = 480 }: TemplatePreviewProps) {
  const [petImg, setPetImg] = useState<HTMLImageElement | null>(null);
  const [decoImg, setDecoImg] = useState<HTMLImageElement | null>(null);
  const imgRef = useRef<Konva.Image>(null);
  const trRef = useRef<Konva.Transformer>(null);
  const [selected, setSelected] = useState(false);

  // Load pet cutout.
  useEffect(() => {
    if (!cutoutUrl) return;
    const img = new window.Image();
    img.crossOrigin = "anonymous";
    img.src = cutoutUrl;
    img.onload = () => setPetImg(img);
  }, [cutoutUrl]);

  // Load optional decoration PNG.
  useEffect(() => {
    if (!template.decorationPng) {
      setDecoImg(null);
      return;
    }
    const img = new window.Image();
    img.crossOrigin = "anonymous";
    img.src = template.decorationPng;
    img.onload = () => setDecoImg(img);
  }, [template.decorationPng]);

  // Attach transformer when image is selected.
  useEffect(() => {
    if (selected && trRef.current && imgRef.current) {
      trRef.current.nodes([imgRef.current]);
      trRef.current.getLayer()?.batchDraw();
    } else if (trRef.current) {
      trRef.current.nodes([]);
    }
  }, [selected, petImg]);

  const cx = template.maskCenter.x * size;
  const cy = template.maskCenter.y * size;
  const r = template.maskRadiusFrac * size;
  const stroke = template.frameWidthFrac * size;

  // Default fit: pet covers mask circle (square aspect).
  const defaultPetSize = r * 2.2;
  const petPos = useMemo(() => ({
    x: transform.cx * size,
    y: transform.cy * size,
    scale: transform.scale,
    rotation: transform.rotation,
  }), [transform, size]);

  function commitTransform() {
    const node = imgRef.current;
    if (!node) return;
    onChange({
      cx: node.x() / size,
      cy: node.y() / size,
      scale: node.scaleX(),
      rotation: node.rotation(),
    });
  }

  // Render mask shape twice: once as clipFunc for the pet group, once as
  // visible stroke on the frame layer.
  function applyClip(ctx: CanvasRenderingContext2D) {
    ctx.beginPath();
    if (template.maskShape === "circle") {
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
    } else if (template.maskShape === "oval") {
      ctx.ellipse(cx, cy, r * 0.85, r, 0, 0, Math.PI * 2);
    } else if (template.maskShape === "hex") {
      const pts = hexPoints(r);
      ctx.moveTo(cx + pts[0], cy + pts[1]);
      for (let i = 2; i < pts.length; i += 2) {
        ctx.lineTo(cx + pts[i], cy + pts[i + 1]);
      }
      ctx.closePath();
    } else {
      // crest — convert path to canvas
      const path = new Path2D(crestPathData(r));
      ctx.translate(cx, cy);
      ctx.clip(path);
      ctx.translate(-cx, -cy);
      return;
    }
    ctx.closePath();
  }

  return (
    <div
      className="relative rounded-lg overflow-hidden"
      style={{
        width: size,
        height: size,
        background: template.bgColor,
        boxShadow: "0 12px 40px rgba(60, 36, 18, 0.12)",
      }}
      onClick={() => setSelected(true)}
    >
      <Stage width={size} height={size}>
        {/* bg fill */}
        <Layer listening={false}>
          <Rect x={0} y={0} width={size} height={size} fill={template.bgColor} />
        </Layer>

        {/* clipped pet */}
        <Layer clipFunc={applyClip}>
          {petImg && (
            <KonvaImage
              ref={imgRef}
              image={petImg}
              x={petPos.x}
              y={petPos.y}
              width={defaultPetSize}
              height={defaultPetSize}
              offsetX={defaultPetSize / 2}
              offsetY={defaultPetSize / 2}
              scaleX={petPos.scale}
              scaleY={petPos.scale}
              rotation={petPos.rotation}
              draggable
              onDragEnd={commitTransform}
              onTransformEnd={commitTransform}
              onClick={() => setSelected(true)}
              onTap={() => setSelected(true)}
            />
          )}
        </Layer>

        {/* frame stroke */}
        <Layer listening={false}>
          {template.maskShape === "circle" && (
            <Circle x={cx} y={cy} radius={r} stroke={template.frameColor} strokeWidth={stroke} />
          )}
          {template.maskShape === "oval" && (
            <Ellipse x={cx} y={cy} radiusX={r * 0.85} radiusY={r} stroke={template.frameColor} strokeWidth={stroke} />
          )}
          {template.maskShape === "hex" && (
            <Line points={hexPoints(r)} closed x={cx} y={cy} stroke={template.frameColor} strokeWidth={stroke} />
          )}
          {template.maskShape === "crest" && (
            <Path data={crestPathData(r)} x={cx} y={cy} stroke={template.frameColor} strokeWidth={stroke} fill="" />
          )}
        </Layer>

        {/* decoration */}
        {decoImg && (
          <Layer listening={false}>
            <KonvaImage image={decoImg} x={0} y={0} width={size} height={size} />
          </Layer>
        )}

        {/* transformer */}
        <Layer>
          <Transformer
            ref={trRef}
            rotateEnabled
            keepRatio
            enabledAnchors={["top-left", "top-right", "bottom-left", "bottom-right"]}
            boundBoxFunc={(_oldBox, newBox) => {
              // Prevent flipping / negative.
              if (newBox.width < 40 || newBox.height < 40) return _oldBox;
              return newBox;
            }}
            anchorStroke="#bf524a"
            anchorFill="#FFFDF5"
            borderStroke="#bf524a"
            borderDash={[6, 4]}
          />
        </Layer>
      </Stage>

      {!selected && petImg && (
        <div
          className="absolute bottom-3 left-1/2 -translate-x-1/2 px-3 py-1.5 rounded-full text-[11px] uppercase pointer-events-none"
          style={{
            background: "rgba(20, 18, 16, 0.7)",
            color: "#FFFDF5",
            letterSpacing: "0.12em",
            backdropFilter: "blur(4px)",
          }}
        >
          Tap to drag · pinch to zoom
        </div>
      )}
    </div>
  );
}
