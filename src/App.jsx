import Navbar from './components/Navbar.jsx'
import Hero from './components/Hero.jsx'
import Trusted from './components/Trusted.jsx'
import Features from './components/Features.jsx'
import HowItWorks from './components/HowItWorks.jsx'
import Workspace from './components/Workspace.jsx'
import Testimonials from './components/Testimonials.jsx'
import Footer from './components/Footer.jsx'

export default function App() {
  return (
    <div className="page">
      <header className="hero-wrap" id="home">
        <Navbar />
        <Hero />
      </header>
      <main>
        <Trusted />
        <Features />
        <HowItWorks />
        <Workspace />
        <Testimonials />
      </main>
      <Footer />
    </div>
  )
}
