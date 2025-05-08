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
  const [error, setError] = useState(null);
  
  const queryClient = useQueryClient();
  
  // Fetch subscriptions data
  const { 
    data: tableData, 
    isLoading, 
    error: queryError,
    refetch 
  } = useQuery({
    queryKey: ['subscriptions'],
    queryFn: async () => {
      try {
        const response = await api.get('/subs');
        return response.data;
      } catch (err) {
        console.error('Error fetching subscriptions:', err);
        setError(err.message || 'Failed to load subscriptions');
        return [];
      }
    }
  });
  
  // Mutations for create, update, delete
  const createMutation = useMutation({
    mutationFn: (newData) => api.post('/subs', newData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subscriptions'] });
      setError(null);
    },
    onError: (err) => {
      console.error('Error creating subscription:', err);
      setError(err.response?.data?.message || 'Failed to create subscription');
    }
  });
  
  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => api.put(`/subs/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subscriptions'] });
      setError(null);
    },
    onError: (err) => {
      console.error('Error updating subscription:', err);
      setError(err.response?.data?.message || 'Failed to update subscription');
    }
  });

  const handleOpen = (mode, item = null) => {
    setModalMode(mode);
    setCurrentItem(item);
    setIsOpen(true);
  };

  const handleSubmit = async (newSubsData) => {
    try {
      if (modalMode === 'add'){
        await createMutation.mutateAsync(newSubsData);
      } else {
        await updateMutation.mutateAsync({ id: currentItem.id, data: newSubsData });
      }
      setIsOpen(false);
    } catch (err) {
      console.error('Subscription operation failed:', err);
      // Error is handled by the mutation callbacks
    }
  };

  // Clear any errors
  const clearError = () => setError(null);

  if (isLoading) {
    return (
      <div className="flex justify-center p-8">
        <span className="loading loading-spinner loading-lg"></span>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {(error || queryError) && (
        <div className="alert alert-error">
          <span>{error || queryError?.message || 'An error occurred'}</span>
          <button onClick={clearError} className="btn btn-sm">Dismiss</button>
        </div>
      )}
      
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
          <button 
            className="btn btn-outline"
            onClick={() => refetch()}
            title="Refresh data"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 11A8.1 8.1 0 0 0 4.5 9M4 5v4h4M4 13a8.1 8.1 0 0 0 15.5 2m.5 4v-4h-4" />
            </svg>
          </button>
        </div>
      </div>
      
      <Tablelist 
        tableData={tableData || []}
        setTableData={(newData) => queryClient.setQueryData(['subscriptions'], newData)}
        onOpen={(item) => handleOpen('edit', item)}
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