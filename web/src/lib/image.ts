/** 上传前在浏览器里先把照片压小。同一个文件既送后端识别、也存 Storage。 */

const MAX_EDGE = 1600
const JPEG_QUALITY = 0.85

/** 本来就不大的图不值得再解一次码 */
const SKIP_BELOW_BYTES = 600 * 1024

/** canvas 一定解得开的格式。HEIC 不在里面 —— 见下面 catch 的说明。 */
const CANVAS_SAFE = new Set(['image/jpeg', 'image/png', 'image/webp'])

/**
 * 缩到长边 1600 以内的 JPEG。压不动就原样返回，绝不因为压缩失败挡住记账。
 *
 * 手机直出的照片动辄 4000×3000 / 4 MB，而这张图要上传两次（识别一次、
 * 存档一次）。压完通常只剩几十 KB，模型看小票也完全够。
 */
export async function shrinkImage(file: File): Promise<File> {
  if (file.size <= SKIP_BELOW_BYTES && CANVAS_SAFE.has(file.type)) return file

  try {
    // from-image：按 EXIF 把竖拍的照片转正。重新编码会丢掉 EXIF，
    // 这里不转的话存进 Storage 的图就是躺着的。
    const bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' })

    const scale = Math.min(1, MAX_EDGE / Math.max(bitmap.width, bitmap.height))
    const canvas = document.createElement('canvas')
    canvas.width = Math.round(bitmap.width * scale)
    canvas.height = Math.round(bitmap.height * scale)

    const ctx = canvas.getContext('2d')
    if (!ctx) return file
    ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height)
    bitmap.close()

    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, 'image/jpeg', JPEG_QUALITY),
    )
    // 小图重新编码有可能反而变大
    if (!blob || blob.size >= file.size) return file

    return new File([blob], `${file.name.replace(/\.[^.]+$/, '')}.jpg`, { type: 'image/jpeg' })
  } catch {
    // 桌面版 Chrome 解不了 HEIC，createImageBitmap 会抛。原图照样传得出去：
    // 后端有 pillow-heif 顶着，Storage 的 bucket 也允许 image/heic。
    // 代价是这类图在非 Safari 浏览器里预览不出来。
    return file
  }
}
