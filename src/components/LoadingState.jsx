export default function LoadingState({ label = 'Loading…' }) {
  return <div className="loading-state" role="status"><span className="loading-spinner" />{label}</div>
}
