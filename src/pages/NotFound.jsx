import { Link } from 'react-router-dom'

export default function NotFound() {
  return <div className="not-found"><span>404</span><h1>We can’t find that page.</h1><p>It may have moved, or the link might be a little off.</p><Link to="/" className="button button-primary">Back to overview</Link></div>
}
