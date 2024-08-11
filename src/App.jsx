import React, { useState, useEffect } from 'react'
import Sidebar from './components/Sidebar/Sidebar'
import Main from './components/Main/Main'
import Modal from './components/Modal/modal'
import ScheduleModal from './components/Schedule/ScheduleModal'
import HelpModal from './components/HelpModal/HelpModal'
import OnboardingAnimation from './components/OnboardingAnimation/OnboardingAnimation'

const App = () => {
  const [showOnboarding, setShowOnboarding] = useState(true)

  useEffect(() => {
    // Reset showOnboarding to true on each mount (refresh)
    setShowOnboarding(true)
  }, [])

  const handleOnboardingComplete = () => {
    setShowOnboarding(false)
  }

  if (showOnboarding) {
    return <OnboardingAnimation onComplete={handleOnboardingComplete} />
  }

  return (
    <>
      <ScheduleModal/>
      <HelpModal/>
      <Modal/>
      <Sidebar/>
      <Main />
    </>
  )
}

export default App