'use client'

import { useState, useEffect } from 'react'
import { ChevronUp } from 'lucide-react'

const sections = ['Header', 'Download', 'Showcase', 'Donation', 'Comments']

export default function VerticalProgressBar() {
  const [activeSection, setActiveSection] = useState(0)

  useEffect(() => {
    const handleScroll = () => {
      const scrollPosition = window.scrollY
      const windowHeight = window.innerHeight
      const sectionElements = sections.map(section => 
        document.getElementById(section.toLowerCase())
      )

      sectionElements.forEach((section, index) => {
        if (section) {
          const sectionTop = section.offsetTop
          const sectionBottom = sectionTop + section.offsetHeight

          if (scrollPosition >= sectionTop - windowHeight / 2 && 
              scrollPosition < sectionBottom - windowHeight / 2) {
            setActiveSection(index)
          }
        }
      })
    }

    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const scrollToSection = (index: number) => {
    const section = document.getElementById(sections[index].toLowerCase())
    if (section) {
      section.scrollIntoView({ behavior: 'smooth' })
    }
  }

  return (
    <div className="fixed right-4 top-1/2 transform -translate-y-1/2 z-50">
      <div className="flex flex-col items-center space-y-4">
        {sections.map((section, index) => (
          <button
            key={section}
            onClick={() => scrollToSection(index)}
            className={`w-3 h-3 rounded-full ${
              index === activeSection ? 'bg-blue-600' : 'bg-gray-300'
            } transition-colors duration-200`}
            aria-label={`Scroll to ${section}`}
          />
        ))}
      </div>
      <button
        onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
        className="mt-4 p-2 bg-white rounded-full shadow-md hover:bg-gray-100 transition-colors duration-200"
        aria-label="Scroll to top"
      >
        <ChevronUp className="w-4 h-4" />
      </button>
    </div>
  )
}

