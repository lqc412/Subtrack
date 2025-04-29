import './App.css'
import Dock from '../../SubTrack-frontend/src/components/Dock'
import Navbar from '../../SubTrack-frontend/src/components/Navbar'
import Tablelist from '../../SubTrack-frontend/src/components/Tablelist'
import ModalForm from '../../SubTrack-frontend/src/components/ModalForm'
import { useState } from 'react'

function App() {
  const [isOpen, setIsOpen] = useState(false);
  const [modalMode, setModelMode] = useState('add');
  const [currentItem, setCurrentItem] = useState(null);

  const handleOpen = (mode, item = null) => {
    setModelMode(mode);
    setCurrentItem(item);
    setIsOpen(true);
  }

  const handleSubmit = () => {
    if (modalMode === 'add'){
      console.log('modal mode Add')
    } else{
      console.log('modal mode Update')
    }
    setIsOpen(false);
  }

  return (
    <>
    <div className="py-5 px-5 ">
      <Navbar />
      <Tablelist onOpen = {(item) => handleOpen('edit', item)}/>
      <ModalForm 
      isOpen={isOpen} 
      onSubmit={handleSubmit}
      onClose={() => setIsOpen(false)} 
      mode={modalMode}
      currentItem={currentItem}
      />
      <Dock onOpen = {() => handleOpen('add')}/>
    </div>
    </>
  )
}

export default App
