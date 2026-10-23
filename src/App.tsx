import { useEffect, useMemo, useState } from 'react'
import { api } from './lib/api'
import { categories, procedures, type Law, type Procedure } from './data'
import SaveButton from './components/SaveButton'
import LawCard from './components/LawCard'
type View = 'home' | 'results' | 'procedure' | 'saved'
type Saved = { item_key: string; kind: string; title: string; category: string; description: string }
const lawRank = (law: Law) => law.title.includes('조례') ? 0 : law.title.includes('규칙') ? 1 : law.title.includes('시행령') ? 2 : 3
const orderedLaws = (laws: Law[]) => [...laws].sort((a, b) => lawRank(a) - lawRank(b))
export default function App() {
  const [view, setView] = useState<View>('home')
  const [query, setQuery] = useState('')
  const [selected, setSelected] = useState<Procedure>(procedures[0])
  const [saved, setSaved] = useState<Saved[]>([])
  const [toast, setToast] = useState('')
  const [activeStep, setActiveStep] = useState(0)
  const [loading, setLoading] = useState(true)
  const loadSaved = async () => { try { const r = await api('saved'); setSaved(await r.json()) } catch { setSaved([]) } finally { setLoading(false) } }
  useEffect(() => { loadSaved() }, [])
  const isSaved = (key: string) => saved.some(x => x.item_key === key)
  const toggle = async (key: string, kind: string, title: string, category: string, description: string) => {
    try {
      if (isSaved(key)) await api(`saved/${encodeURIComponent(key)}`, { method: 'DELETE' })
      else await api('saved', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ item_key: key, kind, title, category, description }) })
      await loadSaved(); setToast(isSaved(key) ? '보관함에서 뺐어요.' : '보관함에 차곡차곡 담았어요!'); setTimeout(() => setToast(''), 1800)
    } catch { setToast('저장 중 문제가 생겼어요. 다시 시도해 주세요.') }
  }
  const results = useMemo(() => { const q = query.trim().toLowerCase(); return !q ? procedures : procedures.filter(p => [p.title,p.category,p.summary,...p.tags,...p.laws.map(l=>l.title+l.summary)].join(' ').toLowerCase().includes(q)) }, [query])
  const availableSelected = procedures.find((procedure) => procedure.id === selected?.id) ?? procedures[0]
  const changeView = (nextView: View) => {
    if ((nextView === 'results' || nextView === 'procedure') && !availableSelected) {
      setToast('표시할 절차를 찾지 못했어요. 처음 화면으로 돌아갈게요.')
      setView('home')
      return
    }
    if (nextView === 'procedure') setActiveStep(0)
    setView(nextView)
  }
  const goResult = (procedure?: Procedure) => {
    const nextProcedure = procedures.find((item) => item.id === procedure?.id) ?? procedures[0]
    if (!nextProcedure) {
      setToast('표시할 절차를 찾지 못했어요. 다시 선택해 주세요.')
      return
    }
    setSelected(nextProcedure)
    setActiveStep(0)
    setView('results')
  }
  const lawSave = (law: Law) => toggle(`law:${law.title}`, '조항', law.title, law.code, law.summary)
  const procSave = (p: Procedure) => toggle(`procedure:${p.id}`, '절차', p.title, p.category, p.summary)
  return <div className="app-shell">
    <header className="topbar"><button className="brand" onClick={() => changeView('home')}><span className="brown-icon">◆</span><span>법률 절차는<br/><b>계획대로 되지 않아</b></span></button><nav><button onClick={() => changeView('home')}>찾아보기</button><button className={view === 'saved' ? 'nav-active' : ''} onClick={() => changeView('saved')}>♡ 보관함 <em>{saved.length}</em></button></nav></header>
    {toast && <div className="toast" role="status">{toast}</div>}
    <main>
      {view === 'home' && <Home query={query} setQuery={setQuery} results={results} onChoose={goResult} />}
      {view === 'results' && <Results results={results} selected={availableSelected} onChoose={goResult} onBack={() => changeView('home')} onGuide={() => changeView('procedure')} isSaved={isSaved} onSave={procSave} onLawSave={lawSave} />}
      {view === 'procedure' && <Guide procedure={availableSelected} active={activeStep} setActive={setActiveStep} onBack={() => changeView('results')} isSaved={isSaved} onSave={procSave} onLawSave={lawSave} />}
      {view === 'saved' && <SavedView items={saved} loading={loading} onOpen={(item) => { const procedure = procedures.find(p => `procedure:${p.id}` === item.item_key || p.laws.some(l => `law:${l.title}` === item.item_key)); if (procedure) { setSelected(procedure); setActiveStep(0); changeView(item.kind === '절차' ? 'procedure' : 'results') } else { setToast('연결된 절차를 찾지 못했어요.') } }} onRemove={(i) => toggle(i.item_key, i.kind, i.title, i.category, i.description)} />}
    </main>
  </div>
}
function AppIcon({ symbol, className = '' }: { symbol: string; className?: string }) { return <span className={`brown-icon ${className}`}>{symbol}</span> }
function Home({ query, setQuery, results, onChoose }: { query:string; setQuery:(s:string)=>void; results:Procedure[]; onChoose:(p:Procedure)=>void }) {
 return <><section className="hero"><p className="eyebrow">복잡한 순간에, 차분한 순서 한 장</p><h1>법률 절차를<br/><mark>부담 없이</mark> 찾아봐요.</h1><p className="hero-copy">소송비용액확정·인지환급부터 행정민원까지, 필요한 신청 절차와 근거를 쉬운 말로 정리해 드려요.</p><label className="searchbox"><span>⌕</span><input autoFocus value={query} onChange={e=>setQuery(e.target.value)} placeholder="예: 소송비용액확정, 인지환급, 정보공개"/><button onClick={() => results[0] && onChoose(results[0])}>찾아보기</button></label></section>
 <section className="section"><div className="section-heading"><div><p className="eyebrow">자주 찾는 분야</p><h2>어디부터 살펴볼까요?</h2></div><span>천천히 골라도 괜찮아요 <AppIcon symbol="☁" /></span></div><div className="category-grid">{categories.map((c,i)=>{const p=procedures.find(x=>x.category===c)!; return <button className="category-card press" key={c} onClick={()=>onChoose(p)}><i className="brown-icon">{['⚖','▦','⌕','⌂'][i]}</i><b>{c}</b><small>{p.title}</small><strong>→</strong></button>})}</div></section>
 {query && <section className="quick-results section"><div className="section-heading"><h2>바로 찾은 내용</h2><span>{results.length}개</span></div>{results.length ? <div className="mini-list">{results.map(p=><button key={p.id} onClick={()=>onChoose(p)}><AppIcon symbol={p.icon}/><div><b>{p.title}</b><small>{p.summary}</small></div><strong>→</strong></button>)}</div> : <div className="empty"><AppIcon symbol="⌕"/><b>아직 딱 맞는 결과가 없어요</b><p>‘민원’, ‘경매’, ‘등기’처럼 짧게 다시 검색해 보세요.</p></div>}</section>}</>
}
function Results({ results, selected, onChoose, onBack, onGuide, isSaved, onSave, onLawSave }: any) { return <section className="detail-page"><button className="back" onClick={onBack}>← 처음으로</button><div className="result-layout"><aside className="results-list"><p className="eyebrow">검색 결과 · {results.length}개</p><h2>어떤 내용이<br/>필요하신가요?</h2>{results.map((p:Procedure)=><button key={p.id} className={'result-row '+(p.id===selected.id?'chosen':'')} onClick={()=>onChoose(p)}><AppIcon symbol={p.icon}/><div><b>{p.title}</b><small>{p.category} · {p.tags.join(' · ')}</small></div><strong>›</strong></button>)}</aside><article className="detail-card"><div className="detail-top"><AppIcon symbol={selected.icon} className="big-icon"/><div><p className="eyebrow">{selected.category} · 절차 안내</p><h1>{selected.title}</h1></div><SaveButton saved={isSaved(`procedure:${selected.id}`)} onClick={()=>onSave(selected)} /></div><p className="detail-summary">{selected.summary}</p><div className="soft-note"><b><AppIcon symbol="⌁"/> 먼저 알아둘 점</b><p>아래 내용은 일반적인 길잡이예요. 실제 사건의 기한·서류는 상황에 따라 달라질 수 있어요.</p></div>{selected.practiceNote && <div className="practice-note"><b>법원실무제요 참고</b><p>{selected.practiceNote}</p></div>}{selected.forms && <FormLinks forms={selected.forms}/>}<div className="detail-actions"><button className="primary press" onClick={onGuide}>단계별로 살펴보기 →</button><span>약 {selected.steps.length}단계로 정리했어요</span></div><section className="law-section"><h3>작은 단위부터 보는 근거 조항</h3><p className="law-order-note">조례·규칙 → 시행령 → 법률 순으로 정리했어요.</p>{orderedLaws(selected.laws).map((law:Law)=><LawCard key={law.title} law={law} saved={isSaved(`law:${law.title}`)} onSave={()=>onLawSave(law)}/>)}</section></article></div></section> }
function FormLinks({ forms }: { forms: Procedure['forms'] }) { return <section className="form-links" aria-label="공식 서식 안내"><div><p className="eyebrow">공식 서식 · 안내</p><h3>신청 전에 서식을 확인하세요</h3></div>{forms?.map(form=><a key={form.label} href={form.url} target="_blank" rel="noreferrer"><span className="brown-icon">▱</span><span><b>{form.label} ↗</b><small>{form.description}</small><em>근거 · {form.legalBasis}</em></span></a>)}</section> }
function Guide({ procedure, active, setActive, onBack, isSaved, onSave, onLawSave }: any) { const step=procedure.steps[active]; return <section className="guide-page"><button className="back" onClick={onBack}>← 결과로 돌아가기</button><div className="guide-header"><AppIcon symbol={procedure.icon} className="guide-icon"/><div><p className="eyebrow">{procedure.category} 절차</p><h1>{procedure.title}</h1><p>하나씩 확인하며 내 상황에 맞게 정리해 보세요.</p></div><SaveButton saved={isSaved(`procedure:${procedure.id}`)} onClick={()=>onSave(procedure)} /></div>{procedure.practiceNote && <div className="practice-note guide-reference"><b>법원실무제요 참고</b><p>{procedure.practiceNote}</p></div>}{procedure.forms && <FormLinks forms={procedure.forms}/>}<div className="guide-grid"><ol className="step-list">{procedure.steps.map((s:any,i:number)=><li key={s.title} className={active===i?'active':''}><button onClick={()=>setActive(i)}><span>{i+1}</span><div><b>{s.title}</b><small>{s.description}</small></div></button></li>)}</ol><article className="step-detail"><p className="eyebrow">지금 보는 단계 · {active+1} / {procedure.steps.length}</p><div className="step-number">{active+1}</div><h2>{step.title}</h2><p className="step-copy">{step.description}</p><LawCard law={step.law} saved={isSaved(`law:${step.law.title}`)} onSave={()=>onLawSave(step.law)} /><div className="step-nav"><button disabled={active===0} onClick={()=>setActive(active-1)}>← 이전</button><button className="primary press" disabled={active===procedure.steps.length-1} onClick={()=>setActive(active+1)}>다음 단계 →</button></div></article></div></section> }
function SavedView({ items, loading, onOpen, onRemove }: any) { return <section className="saved-page"><p className="eyebrow">나만의 법률 메모</p><h1>차곡차곡 모아둔<br/><mark>보관함</mark>이에요.</h1><p className="saved-intro">다시 봐야 할 절차와 조항을 한곳에서 편하게 꺼내 보세요.</p>{loading ? <div className="empty">보관함을 불러오는 중이에요…</div> : !items.length ? <div className="empty big"><AppIcon symbol="▱" className="empty-icon"/><b>아직 담아둔 내용이 없어요</b><p>마음에 드는 절차나 조항의 ‘보관하기’를 눌러 보세요.</p></div> : <div className="saved-grid">{items.map((item:Saved)=><article key={item.item_key} className="saved-card"><AppIcon symbol={item.kind==='절차'?'▤':'▱'}/><p>{item.kind} · {item.category}</p><h2>{item.title}</h2><small>{item.description}</small><div><button className="plain-button press" onClick={()=>onOpen(item)}>다시 보기 →</button><button className="remove" onClick={()=>onRemove(item)}>보관 해제</button></div></article>)}</div>}</section> }
