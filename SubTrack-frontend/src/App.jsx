import './App.css'
import Dock from '../../SubTrack-frontend/src/components/Dock'
import Navbar from '../../SubTrack-frontend/src/components/Navbar'
import Tablelist from '../../SubTrack-frontend/src/components/Tablelist'
import ModalForm from '../../SubTrack-frontend/src/components/ModalForm'
import { useState, useEffect } from 'react'
import axios from 'axios';

function App() {
  const [isOpen, setIsOpen] = useState(false);
  const [modalMode, setModelMode] = useState('add');
  const [currentItem, setCurrentItem] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [tableData, setTableData] = useState([]);
  

  const fetchData = async () => {
    try {
      const response = await axios.get("http://localhost:3000/api/subs");
      setTableData(response.data);
    } catch (err) {
      console.error("Error fetching data:", err);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleOpen = (mode, item = null) => {
    setModelMode(mode);
    setCurrentItem(item);
    setIsOpen(true);
  }

  const handleSubmit = async (newSubsData) => {
    if (modalMode === 'add'){
      try{
        const response = await axios.post('http://localhost:3000/api/subs', newSubsData);
        console.log("added:", response.data);
        setTableData((prevData) => [...prevData, response.data]);
      } catch (err) {
        console.error("Error fetching data:", err);
      }
      console.log('modal mode Add')
    } else{
        console.log('Updating sub with ID', currentItem.id);
        try{
          const response = await axios.put(`http://localhost:3000/api/subs/${currentItem.id}`, newSubsData);
          console.log("updated:", response.data);
          setTableData((prevData) =>
            prevData.map((subs) => (subs.id === currentItem.id ? response.data : subs))
          );
        } catch (err) {
          console.error("Error fetching data:", err);
        }
        console.log('modal mode Update')
    }
  }

  return (
    <>
    <div className="py-5 px-5 ">
      <Navbar 
      onSearch = {setSearchTerm}
      />
      <Tablelist 
      setTableData={setTableData}
      tableData={tableData}
      onOpen = {(item) => handleOpen('edit', item)}
      searchTerm = {searchTerm}
      />
      <ModalForm 
      isOpen={isOpen} 
      onSubmit={handleSubmit}
      onClose={() => setIsOpen(false)} 
      mode={modalMode}
      currentItem={currentItem}
      />
      <Dock 
      onOpen = {() => handleOpen('add')}
      />
    </div>
    </>
  )
}

export default App
