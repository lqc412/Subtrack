import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../services/api';
import Tablelist from '../components/Tablelist';
import ModalForm from '../components/ModalForm';
import Dock from '../components/Dock';

export default function SubscriptionsPage() {
  const [isOpen, setIsOpen] = useState(false);
  const [modalMode, setModalMode] = useState('add');
  const [currentItem, setCurrentItem] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  
  const queryClient = useQueryClient();
  
  // Fetch subscriptions data
  const { data: tableData, isLoading, error } = useQuery({
    queryKey: ['subscriptions'],
    queryFn: () => api.get('/subs').then(res => res.data)
  });
  
  // Mutations for create, update, delete
  const createMutation = useMutation({
    mutationFn: (newData) => api.post('/subs', newData),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['subscriptions'] })
  });
  
  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => api.put(`/subs/${id}`, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['subscriptions'] })
  });
  
  const deleteMutation = useMutation({
    mutationFn: (id) => api.delete(`/subs/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['subscriptions'] })
  });

  const handleOpen = (mode, item = null) => {
    setModalMode(mode);
    setCurrentItem(item);
    setIsOpen(true);
  };

  const handleSubmit = async (newSubsData) => {
    if (modalMode === 'add'){
      createMutation.mutate(newSubsData);
    } else {
      updateMutation.mutate({ id: currentItem.id, data: newSubsData });
    }
    setIsOpen(false);
  };
  
  const handleDelete = async (id) => {
    if (confirm('Are you sure you want to delete this subscription?')) {
      deleteMutation.mutate(id);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center p-8">
        <span className="loading loading-spinner loading-lg"></span>
      </div>
    );
  }

  if (error) {
    return <div className="alert alert-error">Error loading subscriptions</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Subscriptions</h1>
        <div className="flex gap-2">
          <input 
            type="text" 
            placeholder="Search subscriptions..." 
            className="input input-bordered"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <button 
            className="btn btn-primary" 
            onClick={() => handleOpen('add')}
          >
            Add New
          </button>
        </div>
      </div>
      
      <Tablelist 
        tableData={tableData || []}
        setTableData={(newData) => queryClient.setQueryData(['subscriptions'], newData)}
        onOpen={(item) => handleOpen('edit', item)}
        onDelete={handleDelete}
        searchTerm={searchTerm}
      />
      
      <ModalForm 
        isOpen={isOpen} 
        onSubmit={handleSubmit}
        onClose={() => setIsOpen(false)} 
        mode={modalMode}
        currentItem={currentItem}
      />
      
      <Dock onOpen={() => handleOpen('add')} />
    </div>
  );
}