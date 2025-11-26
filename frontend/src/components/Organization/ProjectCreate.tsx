import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { organizationAPI } from '../../services/api';

const ProjectCreate: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    deadline: '',
    budget_range_min: '',
    budget_range_max: '',
    technical_weight: '60',
    financial_weight: '40',
    minimum_experience_years: '3',
    required_certifications: '',
    technical_requirements: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Build evaluation criteria
      const evaluation_criteria = {
        technical_weight: parseInt(formData.technical_weight),
        financial_weight: parseInt(formData.financial_weight),
        minimum_experience_years: parseInt(formData.minimum_experience_years),
        required_certifications: formData.required_certifications
          .split(',')
          .map(cert => cert.trim())
          .filter(cert => cert),
        technical_requirements: formData.technical_requirements
          .split('\n')
          .map(req => req.trim())
          .filter(req => req),
      };

      const projectData = {
        title: formData.title,
        description: formData.description,
        deadline: new Date(formData.deadline).toISOString(),
        budget_range_min: formData.budget_range_min ? parseFloat(formData.budget_range_min) : null,
        budget_range_max: formData.budget_range_max ? parseFloat(formData.budget_range_max) : null,
        evaluation_criteria,
      };

      const response = await organizationAPI.createProject(projectData);
      navigate(`/organization/projects/${response.data.id}`);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to create project');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-6">
          <button
            onClick={() => navigate('/organization')}
            className="text-blue-600 hover:text-blue-800"
          >
            ← Back to Dashboard
          </button>
        </div>

        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Create New Project</h2>

          {error && (
            <div className="mb-4 rounded-md bg-red-50 p-4">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Basic Information */}
            <div className="border-b pb-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Basic Information</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Project Title *
                  </label>
                  <input
                    type="text"
                    name="title"
                    required
                    value={formData.title}
                    onChange={handleChange}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    placeholder="Website Development Project"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Description *
                  </label>
                  <textarea
                    name="description"
                    required
                    rows={4}
                    value={formData.description}
                    onChange={handleChange}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    placeholder="Detailed project description..."
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Deadline *
                    </label>
                    <input
                      type="datetime-local"
                      name="deadline"
                      required
                      value={formData.deadline}
                      onChange={handleChange}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Budget Min (USD)
                    </label>
                    <input
                      type="number"
                      name="budget_range_min"
                      value={formData.budget_range_min}
                      onChange={handleChange}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                      placeholder="10000"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Budget Max (USD)
                    </label>
                    <input
                      type="number"
                      name="budget_range_max"
                      value={formData.budget_range_max}
                      onChange={handleChange}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                      placeholder="50000"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Evaluation Criteria */}
            <div className="border-b pb-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Evaluation Criteria</h3>
              
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Technical Weight (%) *
                    </label>
                    <input
                      type="number"
                      name="technical_weight"
                      required
                      min="0"
                      max="100"
                      value={formData.technical_weight}
                      onChange={handleChange}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Financial Weight (%) *
                    </label>
                    <input
                      type="number"
                      name="financial_weight"
                      required
                      min="0"
                      max="100"
                      value={formData.financial_weight}
                      onChange={handleChange}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Minimum Experience (Years)
                  </label>
                  <input
                    type="number"
                    name="minimum_experience_years"
                    min="0"
                    value={formData.minimum_experience_years}
                    onChange={handleChange}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Required Certifications (comma-separated)
                  </label>
                  <input
                    type="text"
                    name="required_certifications"
                    value={formData.required_certifications}
                    onChange={handleChange}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    placeholder="ISO 9001, ISO 27001, PMP"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Technical Requirements (one per line)
                  </label>
                  <textarea
                    name="technical_requirements"
                    rows={5}
                    value={formData.technical_requirements}
                    onChange={handleChange}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    placeholder="React experience&#10;Cloud deployment&#10;API development&#10;Database design"
                  />
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <div className="flex justify-end space-x-4">
              <button
                type="button"
                onClick={() => navigate('/organization')}
                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm font-medium disabled:opacity-50"
              >
                {loading ? 'Creating...' : 'Create Project'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ProjectCreate;