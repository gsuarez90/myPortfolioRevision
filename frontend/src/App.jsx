import { useDisclosure } from '@mantine/hooks'
import Nav from './components/Nav'
import Hero from './components/Hero'
import Experience from './components/Experience'
import Projects from './components/Projects'
import ResumeModal from './components/ResumeModal'
import Footer from './components/Footer'

export default function App() {
  const [opened, { open, close }] = useDisclosure(false)

  return (
    <>
      <Nav onResumeClick={open} />
      <ResumeModal opened={opened} onClose={close} />
      <Hero onResumeClick={open} />
      <Experience />
      <Projects />
      <Footer />
    </>
  )
}
