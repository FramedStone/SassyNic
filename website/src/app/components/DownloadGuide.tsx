import Link from 'next/link'

export default function DownloadGuide() {
  return (
    <div className="w-full max-w-lg p-8 bg-white rounded-lg shadow">
      <h2 className="text-3xl font-semibold mb-6">Download Guide</h2>
      <ol className="list-decimal list-inside mb-6 space-y-2">
        <li>Open the Chrome Web Store</li>
        <li>Search for "Your Chrome Extension"</li>
        <li>Click "Add to Chrome"</li>
        <li>Confirm the installation</li>
      </ol>
      <h3 className="text-xl font-semibold mb-2">Requirements</h3>
      <p className="mb-4">Google Chrome version 88 or higher</p>
      <Link href="/terms" className="text-blue-600 hover:underline">
        Terms and Conditions
      </Link>
    </div>
  )
}

