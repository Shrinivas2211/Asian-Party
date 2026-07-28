/**
 * 颜色对比工具。
 *
 * 分类色是数据（可以随时增删改），所以图标该用什么颜色不能靠人肉挑 ——
 * 按亮度算出来才不会有漏网的。这个文件就干这一件事。
 */

type RGB = [number, number, number]

function parse(hex: string): RGB {
  return [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16)) as RGB
}

function toHex(rgb: RGB): string {
  return `#${rgb.map((v) => Math.round(v).toString(16).padStart(2, '0')).join('')}`
}

/** t=0 全取 a，t=1 全取 b */
export function mix(a: string, b: string, t: number): string {
  const [x, y] = [parse(a), parse(b)]
  return toHex(x.map((v, i) => v * (1 - t) + y[i] * t) as RGB)
}

/** WCAG 相对亮度 */
function luminance(hex: string): number {
  const [r, g, b] = parse(hex)
    .map((v) => v / 255)
    .map((v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4))
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}

/** WCAG 对比度，1–21 */
export function contrast(a: string, b: string): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((p, q) => q - p)
  return (hi + 0.05) / (lo + 0.05)
}

/** 在给定底色上，深色和浅色哪个更清楚就用哪个 */
export function readableOn(background: string, dark: string, light: string): string {
  return contrast(dark, background) >= contrast(light, background) ? dark : light
}
