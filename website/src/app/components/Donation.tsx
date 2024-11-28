import { Coffee } from 'lucide-react'

export default function Donation() {
  return (
    <div className="text-center">
      <h2 className="text-3xl font-semibold mb-6">Support the Project</h2>
      <a
        href="https://www.buymeacoffee.com"
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center px-6 py-3 bg-yellow-400 text-yellow-800 text-lg rounded-lg hover:bg-yellow-500 transition-colors"
      >
        <Coffee className="mr-2" />
        Buy me a coffee
      </a>
      <p className="mt-6 text-xl text-gray-600">
        Interested in collaborating? <a href="mailto:your@email.com" className="text-blue-600 hover:underline">Get in touch!</a>
      </p>
    </div>
  )
}

