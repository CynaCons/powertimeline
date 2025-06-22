import { motion } from 'framer-motion'
import Button from '@/components/Button'
import { Link } from 'react-router-dom'

export default function Home() {
  return (
    <motion.main
      className="flex flex-col items-center justify-center min-h-screen text-center p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      <h1 className="text-4xl font-bold mb-6">Chronochart</h1>
      <Link to="/editor">
        <Button>Start Creating Timeline</Button>
      </Link>
    </motion.main>
  )
}
