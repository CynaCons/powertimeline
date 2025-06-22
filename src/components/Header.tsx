import { Link } from 'react-router-dom'

export default function Header() {
  return (
    <header className="p-4 shadow-md bg-white dark:bg-gray-900">
      <nav className="container mx-auto flex justify-between">
        <Link to="/" className="text-xl font-semibold">
          Chronochart
        </Link>
      </nav>
    </header>
  )
}
