import { Github, Linkedin } from 'lucide-react'

export default function Footer() {
  return (
    <footer className="py-8 border-t">
      <div className="flex justify-center space-x-6">
        <a href="https://github.com/yourusername" target="_blank" rel="noopener noreferrer" className="text-gray-600 hover:text-gray-800">
          <Github className="w-6 h-6" />
        </a>
        <a href="https://linkedin.com/in/yourusername" target="_blank" rel="noopener noreferrer" className="text-gray-600 hover:text-gray-800">
          <Linkedin className="w-6 h-6" />
        </a>
      </div>
      <p className="mt-4 text-center text-sm text-gray-600">© {new Date().getFullYear()} Your Chrome Extension. All rights reserved.</p>
    </footer>
  )
}

