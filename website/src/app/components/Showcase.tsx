import Image from 'next/image'

export default function Showcase() {
  return (
    <div className="w-full">
      <h2 className="text-3xl font-semibold mb-6 text-center">Showcase</h2>
      <div className="mb-8">
        <h3 className="text-2xl mb-4 text-center">Demo Video</h3>
        <div className="aspect-w-16 aspect-h-9 max-w-2xl mx-auto">
          <iframe
            src="https://www.youtube.com/embed/dQw4w9WgXcQ"
            frameBorder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            className="w-full h-full"
          ></iframe>
        </div>
      </div>
      <div>
        <h3 className="text-2xl mb-4 text-center">Screenshots</h3>
        <div className="grid grid-cols-2 gap-4 max-w-2xl mx-auto">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-gray-200 rounded-lg overflow-hidden">
              <Image
                src={`/placeholder.svg?text=Screenshot ${i}`}
                alt={`Screenshot ${i}`}
                width={300}
                height={200}
                className="w-full h-auto"
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

