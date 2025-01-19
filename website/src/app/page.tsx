import Header from './components/Header'
import DownloadGuide from './components/DownloadGuide'
import Showcase from './components/Showcase'
import Donation from './components/Donation'
import Comments from './components/Comments'
import Footer from './components/Footer'
import VerticalProgressBar from './components/VerticalProgressBar'

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-50 text-gray-800">
      <main className="max-w-3xl mx-auto px-4">
        <section id="header" className="min-h-screen flex items-center justify-center">
          <Header />
        </section>
        <section id="download" className="min-h-screen flex items-center justify-center">
          <DownloadGuide />
        </section>
        <section id="showcase" className="min-h-screen flex items-center justify-center">
          <Showcase />
        </section>
        <section id="donation" className="min-h-screen flex items-center justify-center">
          <Donation />
        </section>
        <section id="comments" className="min-h-screen flex items-center justify-center">
          <Comments />
        </section>
        <Footer />
      </main>
      <VerticalProgressBar />
    </div>
  )
}

