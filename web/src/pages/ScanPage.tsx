import { Camera, ChevronLeft, Images, RotateCcw, ScanLine, TriangleAlert } from 'lucide-react'
import { useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'

import { ReceiptForm } from '../components/ReceiptForm'
import { ReceiptImage } from '../components/ReceiptImage'
import { recognizeReceipt } from '../lib/api'
import { shrinkImage } from '../lib/image'
import {
  draftError,
  draftFromRecognition,
  emptyDraft,
  uploadReceiptImage,
} from '../lib/receipts'
import { useReceiptStore } from '../store/receipts'
import type { ReceiptDraft } from '../types'

type Stage = 'idle' | 'recognizing' | 'failed' | 'confirming'

/**
 * 拍小票 → 模型识别 → 核对 → 入账。
 *
 * 识别结果一律要人过目才写库：模型认错金额的代价是账本变脏，
 * 而多看一眼几乎没有成本。
 */
export function ScanPage() {
  const navigate = useNavigate()
  const save = useReceiptStore((s) => s.save)

  const cameraInput = useRef<HTMLInputElement>(null)
  const albumInput = useRef<HTMLInputElement>(null)

  const [file, setFile] = useState<File | null>(null)
  const [draft, setDraft] = useState<ReceiptDraft | null>(null)
  const [stage, setStage] = useState<Stage>('idle')
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  function reset() {
    setFile(null)
    setDraft(null)
    setError(null)
    setStage('idle')
    // 选同一个文件不会再触发 change，得先把 input 清空，否则「重拍」拍回
    // 同一张图会毫无反应
    if (cameraInput.current) cameraInput.current.value = ''
    if (albumInput.current) albumInput.current.value = ''
  }

  async function onPick(picked: File | undefined) {
    if (!picked) return

    setError(null)
    setStage('recognizing')

    const prepared = await shrinkImage(picked)
    setFile(prepared)

    try {
      setDraft(draftFromRecognition(await recognizeReceipt(prepared)))
      setStage('confirming')
    } catch (e) {
      setError((e as Error).message)
      setStage('failed')
    }
  }

  async function onSave() {
    if (!draft || !file || saving) return

    const problem = draftError(draft)
    if (problem) {
      setError(problem)
      return
    }

    setSaving(true)
    setError(null)
    try {
      // 先传图拿到路径，再连着记录一起写库。反过来的话中途失败会留下
      // 一条 image_path 指不到东西的记录。
      const imagePath = await uploadReceiptImage(file)
      await save(draft, { imagePath, isManual: false })
      navigate('/list', { replace: true })
    } catch (e) {
      setError((e as Error).message)
      setSaving(false)
    }
  }

  return (
    <div className="min-h-dvh bg-bg pt-safe">
      <header className="sticky top-0 z-20 flex items-center gap-1 border-b border-line bg-bg/85 px-2 py-3 backdrop-blur-xl">
        <button
          onClick={() => navigate(-1)}
          aria-label="Back"
          className="flex size-9 items-center justify-center rounded-full text-accent active:bg-surface-2"
        >
          <ChevronLeft size={26} />
        </button>
        <h1 className="flex-1 text-[17px] font-semibold text-fg">
          {stage === 'confirming' ? 'Check details' : 'Scan receipt'}
        </h1>
        {stage === 'confirming' && (
          <button
            onClick={onSave}
            disabled={saving}
            className="rounded-full px-4 py-1.5 text-[17px] font-semibold text-accent active:opacity-60 disabled:opacity-40"
          >
            {saving ? 'Saving…' : 'Save'}
          </button>
        )}
      </header>

      {/* 两个 input：带 capture 的直接调后置摄像头，不带的走相册。
          桌面浏览器会忽略 capture，两个都是文件选择框。 */}
      <input
        ref={cameraInput}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={(e) => onPick(e.target.files?.[0])}
      />
      <input
        ref={albumInput}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => onPick(e.target.files?.[0])}
      />

      <div className="mx-auto flex max-w-md flex-col gap-4 px-4 pt-4 pb-12">
        {stage === 'idle' && (
          <>
            <div className="flex flex-col items-center gap-3 rounded-2xl bg-surface px-6 py-16 text-center">
              <ScanLine size={40} className="text-muted" strokeWidth={1.5} />
              <p className="text-[15px] text-fg">Snap a receipt</p>
              <p className="text-[13px] leading-relaxed text-muted">
                Amount, merchant, date and items get filled in
                <br />
                You can edit everything before saving
              </p>
            </div>

            <button
              onClick={() => cameraInput.current?.click()}
              className="flex items-center justify-center gap-2 rounded-2xl bg-accent py-4 text-[17px] font-semibold text-accent-fg active:opacity-80"
            >
              <Camera size={20} />
              Take photo
            </button>
            <button
              onClick={() => albumInput.current?.click()}
              className="flex items-center justify-center gap-2 rounded-2xl bg-surface py-4 text-[17px] font-medium text-fg active:opacity-60"
            >
              <Images size={20} />
              Choose from library
            </button>
          </>
        )}

        {stage === 'recognizing' && (
          <>
            <ReceiptImage file={file} />
            <div className="flex flex-col items-center gap-3 rounded-2xl bg-surface px-6 py-10 text-center">
              <ScanLine size={28} className="animate-pulse text-accent" />
              <p className="text-[15px] text-fg">Reading…</p>
              <p className="text-[13px] text-muted">Usually a few seconds</p>
            </div>
          </>
        )}

        {stage === 'failed' && (
          <>
            <ReceiptImage file={file} />
            <div className="flex flex-col items-center gap-3 rounded-2xl bg-surface px-6 py-8 text-center">
              <TriangleAlert size={28} className="text-danger" strokeWidth={1.5} />
              <p className="text-[15px] text-fg">Couldn't read it</p>
              <p className="text-[13px] leading-relaxed break-words text-muted">{error}</p>
            </div>

            <button
              onClick={reset}
              className="flex items-center justify-center gap-2 rounded-2xl bg-accent py-4 text-[17px] font-semibold text-accent-fg active:opacity-80"
            >
              <RotateCcw size={18} />
              Try another photo
            </button>
            <button
              onClick={() => {
                // 图已经拍了，别让这一步白费 —— 手填也把原图一起存下来
                setDraft(emptyDraft())
                setError(null)
                setStage('confirming')
              }}
              className="rounded-2xl bg-surface py-4 text-[17px] font-medium text-fg active:opacity-60"
            >
              Enter manually, keep the photo
            </button>
          </>
        )}

        {stage === 'confirming' && draft && (
          <>
            <p className="px-1 text-[13px] text-muted">
              Check the details below before saving. The photo is saved too.
            </p>

            <ReceiptForm
              draft={draft}
              onChange={(fields) => setDraft((d) => (d ? { ...d, ...fields } : d))}
              imageFile={file}
            />

            {error && (
              <p className="px-1 text-[13px] text-danger" role="alert">
                {error}
              </p>
            )}

            <button
              onClick={reset}
              disabled={saving}
              className="flex items-center justify-center gap-2 rounded-2xl bg-surface py-4 text-[17px] text-fg active:opacity-60 disabled:opacity-40"
            >
              <RotateCcw size={18} />
              Retake
            </button>
          </>
        )}
      </div>
    </div>
  )
}
