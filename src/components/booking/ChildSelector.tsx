import { useState, useEffect } from 'react';
import type { Child, Session } from '../../types/booking';
import { api } from '../../api/booking-client';
import { useAuth } from '../../contexts/AuthContext';
import { useBasket } from '../../contexts/BasketContext';
import AddChildForm from './AddChildForm';

interface ChildSelectorProps {
  session: Session;
  onClose: () => void;
}

export default function ChildSelector({ session, onClose }: ChildSelectorProps) {
  const { isAuthenticated, setShowLoginModal } = useAuth();
  const { addItem } = useBasket();
  const [children, setChildren] = useState<Child[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [selectedChildId, setSelectedChildId] = useState<string | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch children on mount
  useEffect(() => {
    if (isAuthenticated) {
      fetchChildren();
    } else {
      setIsLoading(false);
    }
  }, [isAuthenticated]);

  const fetchChildren = async () => {
    try {
      const response = await api.getChildren();
      setChildren(response.data);

      // If no children, show add form automatically
      if (response.data.length === 0) {
        setShowAddForm(true);
      } else {
        // Pre-select first child
        setSelectedChildId(response.data[0].id);
      }
    } catch (err) {
      console.error('Error fetching children:', err);
      setError('Failed to load children');
    } finally {
      setIsLoading(false);
    }
  };

  const handleChildAdded = (newChild: Child) => {
    setChildren((prev) => [...prev, newChild]);
    setSelectedChildId(newChild.id);
    setShowAddForm(false);
  };

  const handleAddToBasket = async () => {
    if (!selectedChildId) {
      setError('Please select a child');
      return;
    }

    const selectedChild = children.find((c) => c.id === selectedChildId);
    if (!selectedChild) {
      setError('Selected child not found');
      return;
    }

    setIsAdding(true);
    setError(null);

    try {
      await addItem(session, selectedChild);
      onClose();
    } catch (err) {
      console.error('Error adding to basket:', err);
      setError('Failed to add to basket');
    } finally {
      setIsAdding(false);
    }
  };

  const handleSignIn = () => {
    onClose();
    setShowLoginModal(true);
  };

  if (!isAuthenticated) {
    return (
      <div className="p-4 bg-white rounded-lg shadow-lg">
        <p className="text-gray-600 mb-4">
          Please sign in to book this program.
        </p>
        <div className="flex gap-3">
          <button
            onClick={handleSignIn}
            className="flex-1 px-4 py-2 bg-[--color-primary] text-white text-center font-medium rounded-md hover:opacity-90"
          >
            Sign In
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 text-gray-700 font-medium rounded-md hover:bg-gray-50"
          >
            Cancel
          </button>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="p-4 bg-white rounded-lg shadow-lg">
        <div className="flex items-center justify-center py-8">
          <svg
            className="animate-spin h-8 w-8 text-[--color-primary]"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            ></circle>
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            ></path>
          </svg>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 bg-white rounded-lg shadow-lg max-w-md">
      {/* Program Info */}
      <div className="mb-4 pb-4 border-b border-gray-200">
        <h3 className="font-semibold text-[--color-text]">{session.program.name}</h3>
        <p className="text-sm text-gray-600">
          {session.start_time} - {session.end_time}
          {session.location && ` at ${session.location}`}
        </p>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      {showAddForm ? (
        <AddChildForm
          onChildAdded={handleChildAdded}
          onCancel={() => {
            if (children.length > 0) {
              setShowAddForm(false);
            } else {
              onClose();
            }
          }}
        />
      ) : (
        <>
          {/* Child Selection */}
          <div className="mb-4">
            <label
              htmlFor="child-select"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Select Child
            </label>
            <select
              id="child-select"
              value={selectedChildId || ''}
              onChange={(e) => setSelectedChildId(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[--color-primary]"
            >
              <option value="" disabled>
                Choose a child...
              </option>
              {children.map((child) => (
                <option key={child.id} value={child.id}>
                  {child.first_name} {child.last_name || ''}
                </option>
              ))}
            </select>
          </div>

          {/* Add New Child Link */}
          <div className="mb-6">
            <button
              type="button"
              onClick={() => setShowAddForm(true)}
              className="text-sm text-[--color-accent] hover:underline"
            >
              + Add a new child
            </button>
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <button
              onClick={handleAddToBasket}
              disabled={!selectedChildId || isAdding}
              className="flex-1 px-4 py-2 bg-[--color-primary] text-white font-medium rounded-md hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isAdding ? 'Adding...' : 'Add to Basket'}
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 text-gray-700 font-medium rounded-md hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
          </div>
        </>
      )}
    </div>
  );
}
