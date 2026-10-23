import { useState } from 'react'
import type { Law } from '../data'
type Props = { law: Law; saved: boolean; onSave: () => void }
export default function LawCard({ law, saved, onSave }: Props) {
  const [open, setOpen] = useState(false)
  return <article className="law-card">
    <div className="law-title"><span><b>{law.title}</b><small>{law.code}</small></span><button className="law-toggle press" onClick={() => setOpen(!open)} aria-expanded={open}><b aria-hidden="true">{open ? '−' : '+'}</b><span>{open ? '해설 닫기' : '해설 보기'}</span></button></div>
    <section className="law-text" aria-label="법령 원문"><div className="law-label"><strong>법령 원문</strong><a href={law.sourceUrl} target="_blank" rel="noreferrer">국가법령정보센터에서 확인 ↗</a></div><p>{law.original}</p></section>
    {open && <section className="law-commentary" aria-label="조항 해설"><strong>해설</strong><p>{law.summary}</p></section>}
    <button className="text-save press" onClick={onSave}>{saved ? '✓ 조항 보관됨' : '♡ 조항 보관'}</button>
  </article>
}
