type Props = { saved: boolean; onClick: () => void; compact?: boolean }
export default function SaveButton({ saved, onClick, compact }: Props) {
  return <button className={'save-button press ' + (compact ? 'compact' : '')} onClick={onClick} aria-pressed={saved}>
    {saved ? '✓ 보관됨' : '♡ 보관하기'}
  </button>
}
