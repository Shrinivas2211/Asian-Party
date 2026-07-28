import { ImageOff } from 'lucide-react'
import { useEffect, useState } from 'react'

import { signedImageUrl } from '../lib/receipts'

interface Props {
  /** 已经存进 Storage 的对象路径 */
  path?: string | null
  /** 还没上传的本地文件（拍完照确认时用） */
  file?: File | null
}

/** 小票原图。file 优先 —— 刚拍的那张不用等上传就能看见。 */
export function ReceiptImage({ path, file }: Props) {
  const [url, setUrl] = useState<string | null>(null)
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    setFailed(false)

    if (file) {
      const objectUrl = URL.createObjectURL(file)
      setUrl(objectUrl)
      // 不 revoke 的话每换一张图就漏一份 blob
      return () => URL.revokeObjectURL(objectUrl)
    }

    if (!path) {
      setUrl(null)
      return
    }

    // 私有 bucket，URL 现签现用
    let cancelled = false
    signedImageUrl(path)
      .then((signed) => !cancelled && setUrl(signed))
      .catch(() => !cancelled && setFailed(true))
    return () => {
      cancelled = true
    }
  }, [path, file])

  if (!path && !file) return null

  if (failed) {
    return (
      <div className="card flex flex-col items-center gap-2 px-6 py-10 text-center">
        <ImageOff size={28} className="text-muted" strokeWidth={1.5} />
        {/* HEIC 在非 Safari 浏览器里解不开，这时候图是好的、只是显示不出来 */}
        <p className="text-[13px] text-muted">Can't show this photo here — try Safari or your phone</p>
      </div>
    )
  }

  return (
    <div className="card overflow-hidden">
      {url && (
        <img
          src={url}
          alt="Receipt photo"
          onError={() => setFailed(true)}
          className="max-h-72 w-full object-contain"
        />
      )}
    </div>
  )
}
