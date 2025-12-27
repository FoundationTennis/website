import { useState } from 'react';
import type { FormEvent, ChangeEvent } from 'react';
import { api } from '../../api/booking-client';
import type { Child } from '../../types/booking';

interface AddChildFormProps {
  onChildAdded: (child: Child) => void;
  onCancel: () => void;
}

interface FormData {
  first_name: string;
  last_name: string;
  date_of_birth: string;
  medical_conditions: string;
  allergies: string;
  emergency_contact_name: string;
  emergency_contact_phone: string;
  media_consent: boolean;
}

const initialFormData: FormData = {
  first_name: '',
  last_name: '',
  date_of_birth: '',
  medical_conditions: '',
  allergies: '',
  emergency_contact_name: '',
  emergency_contact_phone: '',
  media_consent: false, // IMPORTANT: Must NOT be pre-checked
};

export default function AddChildForm({ onChildAdded, onCancel }: AddChildFormProps) {
  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleChange = (
    e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;

    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!formData.first_name.trim()) {
      setError('First name is required');
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await api.addChild({
        first_name: formData.first_name,
        last_name: formData.last_name || undefined,
        date_of_birth: formData.date_of_birth || undefined,
      });

      const newChild: Child = {
        id: response.data.id,
        first_name: formData.first_name,
        last_name: formData.last_name || undefined,
        date_of_birth: formData.date_of_birth || undefined,
        medical_conditions: formData.medical_conditions || undefined,
        allergies: formData.allergies || undefined,
        emergency_contact_name: formData.emergency_contact_name || undefined,
        emergency_contact_phone: formData.emergency_contact_phone || undefined,
        media_consent: formData.media_consent,
      };

      onChildAdded(newChild);
    } catch (err) {
      console.error('Error adding child:', err);
      setError('Failed to add child. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <h3 className="text-lg font-semibold text-[--color-text] mb-4">
        Add Child Details
      </h3>

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-md">
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      {/* Name Fields */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label
            htmlFor="first_name"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            First Name *
          </label>
          <input
            type="text"
            id="first_name"
            name="first_name"
            value={formData.first_name}
            onChange={handleChange}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[--color-primary]"
          />
        </div>
        <div>
          <label
            htmlFor="last_name"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Last Name
          </label>
          <input
            type="text"
            id="last_name"
            name="last_name"
            value={formData.last_name}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[--color-primary]"
          />
        </div>
      </div>

      {/* Date of Birth */}
      <div>
        <label
          htmlFor="date_of_birth"
          className="block text-sm font-medium text-gray-700 mb-1"
        >
          Date of Birth
        </label>
        <input
          type="date"
          id="date_of_birth"
          name="date_of_birth"
          value={formData.date_of_birth}
          onChange={handleChange}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[--color-primary]"
        />
      </div>

      {/* Emergency Contact */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label
            htmlFor="emergency_contact_name"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Emergency Contact
          </label>
          <input
            type="text"
            id="emergency_contact_name"
            name="emergency_contact_name"
            value={formData.emergency_contact_name}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[--color-primary]"
          />
        </div>
        <div>
          <label
            htmlFor="emergency_contact_phone"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Emergency Phone
          </label>
          <input
            type="tel"
            id="emergency_contact_phone"
            name="emergency_contact_phone"
            value={formData.emergency_contact_phone}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[--color-primary]"
          />
        </div>
      </div>

      {/* Media Consent - IMPORTANT: NOT pre-checked */}
      <div className="border-t border-gray-200 pt-4">
        <div className="flex items-start gap-3">
          <input
            type="checkbox"
            id="media_consent"
            name="media_consent"
            checked={formData.media_consent}
            onChange={handleChange}
            className="mt-1 h-4 w-4 text-[--color-primary] border-gray-300 rounded focus:ring-[--color-primary]"
          />
          <label htmlFor="media_consent" className="text-sm text-gray-700">
            I consent to photos/videos of{' '}
            <span className="font-medium">
              {formData.first_name || '[child name]'}
            </span>{' '}
            being used for Foundation Tennis marketing purposes.
          </label>
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-3 pt-4">
        <button
          type="submit"
          disabled={isSubmitting}
          className="flex-1 px-4 py-2 bg-[--color-primary] text-white font-medium rounded-md hover:opacity-90 disabled:opacity-50 transition-colors"
        >
          {isSubmitting ? 'Adding...' : 'Add Child'}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 border border-gray-300 text-gray-700 font-medium rounded-md hover:bg-gray-50 transition-colors"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
