import { useState, useEffect } from "react";

export default function ModalForm({ isOpen, onClose, mode, onSubmit, currentItem }) {
    const [company, setCompany] = useState('');
    const [category, setCategory] = useState('');
    const [billingCycle, setBillingCycle] = useState('monthly');
    const [nextBillingDate, setNextBillingDate] = useState('');
    const [amount, setAmount] = useState('');
    const [currency, setCurrency] = useState('USD');
    const [notes, setNotes] = useState('');
    const [isActive, setIsActive] = useState(true);

    // Format date for input field
    const formatDateForInput = (dateString) => {
        if (!dateString) return '';
        
        try {
            const date = new Date(dateString);
            if (isNaN(date.getTime())) return '';
            
            return date.toISOString().split('T')[0];
        } catch (err) {
            console.error("Date formatting error:", err);
            return '';
        }
    };

    useEffect(() => {
        if (mode === 'edit' && currentItem) {
            // Handle both camelCase and snake_case field names
            setCompany(currentItem.company || '');
            setCategory(currentItem.category || '');
            setBillingCycle(currentItem.billing_cycle || currentItem.billingCycle || 'monthly');
            setNextBillingDate(formatDateForInput(currentItem.next_billing_date || currentItem.nextBillingDate || ''));
            setAmount(currentItem.amount ? currentItem.amount.toString() : '');
            setCurrency(currentItem.currency || 'USD');
            setNotes(currentItem.notes || '');
            setIsActive(currentItem.is_active !== undefined ? currentItem.is_active : 
                      (currentItem.isActive !== undefined ? currentItem.isActive : true));
        } else {
            // Reset form for new subscription
            setCompany('');
            setCategory('');
            setBillingCycle('monthly');
            setNextBillingDate('');
            setAmount('');
            setCurrency('USD');
            setNotes('');
            setIsActive(true);
        }
    }, [mode, currentItem, isOpen]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            // Create form data using snake_case for backend compatibility
            const formData = {
                company,
                category,
                billing_cycle: billingCycle,  // Convert to snake_case
                next_billing_date: nextBillingDate, // Convert to snake_case
                amount: parseFloat(amount),
                currency,
                notes,
                is_active: isActive // Convert to snake_case
            };
            
            console.log("Submitting data:", formData);
            await onSubmit(formData);
        } catch(err) {
            console.error("Error submitting subscription", err);
        }
        onClose();
    };

    return (
        <dialog id="subscription_modal" className="modal bg-black/40" open={isOpen}>
            <div className="modal-box">
                <button className="btn btn-sm btn-circle btn-ghost absolute right-2 top-2" onClick={onClose}>✕</button>
                <h3 className="font-bold text-lg mb-4">
                    {mode === 'edit' ? 'Edit Subscription' : 'Add New Subscription'}
                </h3>
                
                <form onSubmit={handleSubmit} className="space-y-3">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div>
                            <label className="label">Company</label>
                            <input 
                                type="text" 
                                className="input input-bordered w-full" 
                                value={company} 
                                onChange={(e) => setCompany(e.target.value)}
                                required
                            />
                        </div>
                        
                        <div>
                            <label className="label">Category</label>
                            <input 
                                type="text" 
                                className="input input-bordered w-full" 
                                value={category} 
                                onChange={(e) => setCategory(e.target.value)}
                            />
                        </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="label">Amount</label>
                            <input 
                                type="number" 
                                step="0.01" 
                                className="input input-bordered w-full" 
                                value={amount} 
                                onChange={(e) => setAmount(e.target.value)}
                                required
                            />
                        </div>
                        
                        <div>
                            <label className="label">Currency</label>
                            <select 
                                className="select select-bordered w-full" 
                                value={currency}
                                onChange={(e) => setCurrency(e.target.value)}
                            >
                                <option value="USD">USD</option>
                                <option value="EUR">EUR</option>
                                <option value="GBP">GBP</option>
                                <option value="CNY">CNY</option>
                                <option value="JPY">JPY</option>
                            </select>
                        </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="label">Billing Cycle</label>
                            <select 
                                className="select select-bordered w-full" 
                                value={billingCycle}
                                onChange={(e) => setBillingCycle(e.target.value)}
                            >
                                <option value="daily">Daily</option>
                                <option value="weekly">Weekly</option>
                                <option value="monthly">Monthly</option>
                                <option value="yearly">Yearly</option>
                            </select>
                        </div>
                        
                        <div>
                            <label className="label">Next Billing Date</label>
                            <input 
                                type="date" 
                                className="input input-bordered w-full" 
                                value={nextBillingDate} 
                                onChange={(e) => setNextBillingDate(e.target.value)}
                                required
                            />
                        </div>
                    </div>
                    
                    <div>
                        <label className="label">Notes</label>
                        <input 
                            type="text" 
                            className="input input-bordered w-full" 
                            value={notes} 
                            onChange={(e) => setNotes(e.target.value)}
                            placeholder="Add notes about this subscription"
                        />
                    </div>
                    
                    <div className="form-control">
                        <label className="label cursor-pointer justify-start gap-2">
                            <input 
                                type="checkbox" 
                                className="toggle toggle-primary" 
                                checked={isActive}
                                onChange={(e) => setIsActive(e.target.checked)}
                            />
                            <span className="label-text">Active Subscription</span> 
                        </label>
                    </div>
                    
                    <div className="modal-action">
                        <button type="button" className="btn btn-outline" onClick={onClose}>Cancel</button>
                        <button type="submit" className="btn btn-primary">
                            {mode === 'edit' ? 'Save Changes' : 'Add Subscription'}
                        </button>
                    </div>
                </form>
            </div>
        </dialog>
    );
}