import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { organizationAPI } from '../../services/api';

interface Bid {
  id: number;
  bidder: {
    company_name: string;
    full_name: string;
  };
  bid_amount: number;
  currency: string;
  status: string;
  submitted_at: string;
}

const ProjectDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [project, setProject] = useState<any>(null);
  const [bids, setBids] = useState<Bid[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchProjectDetails();
  }, [id]);

  const fetchProjectDetails = async () => {
    try {
      const response = await organizationAPI.getProject(Number(id));
      setProject(response.data.project);
      setBids(response.data.bids || []);
    } catch (err: any) {
      setError('Failed to load project details');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handlePublish = async () => {
    if (!window.confirm('Are you sure you want to publish this project? Bidders will be able to see and bid on it.')) {
      return;
    }

    try {
      await organizationAPI.publishProject(Number(id));
      await fetchProjectDetails();
      alert('Project published successfully!');
    } catch (err: any) {
      alert('Failed to publish project');
      console.error(err);
    }
  };

  const getStatusColor = (status: string) => {
    const colors: { [key: string]: string } = {
      draft: 'bg-gray-100 text-gray-800',
      submitted: 'bg-blue-100 text-blue-800',
      under_evaluation: 'bg-yellow-100 text-yellow-800',
      evaluated: 'bg-purple-100 text-purple-800',
      shortlisted: 'bg-green-100 text-green-800',
      rejected: 'bg-red-100 text-red-800',
      awarded: 'bg-green-600 text-white',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-800">{error || 'Project not found'}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={() => navigate('/organization')}
            className="text-blue-600 hover:text-blue-800 mb-4"
          >
            ← Back to Dashboard
          </button>
        </div>

        {/* Project Info Card */}
        <div className="bg-white rounded-lg shadow mb-6">
          <div className="p-6">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">
                  {project.title}
                </h1>
                <p className="text-sm text-gray-500">
                  Tender Reference: {project.tender_reference}
                </p>
              </div>
              <span className={`px-3 py-1 text-sm font-medium rounded-full ${getStatusColor(project.status)}`}>
                {project.status}
              </span>
            </div>

            <div className="border-t pt-4 mb-4">
              <h3 className="text-lg font-semibold mb-2">Description</h3>
              <p className="text-gray-700 whitespace-pre-wrap">{project.description}</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 border-t pt-4">
              <div>
                <p className="text-sm text-gray-500">Deadline</p>
                <p className="text-lg font-semibold">
                  {new Date(project.deadline).toLocaleString()}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Budget Range</p>
                <p className="text-lg font-semibold">
                  {project.budget_range_min && project.budget_range_max
                    ? `$${project.budget_range_min.toLocaleString()} - $${project.budget_range_max.toLocaleString()}`
                    : 'Not specified'}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Total Bids</p>
                <p className="text-lg font-semibold">{bids.length}</p>
              </div>
            </div>

            {/* Evaluation Criteria */}
            {project.evaluation_criteria && (
              <div className="border-t pt-4 mt-4">
                <h3 className="text-lg font-semibold mb-3">Evaluation Criteria</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">Technical Weight</p>
                    <p className="font-medium">{project.evaluation_criteria.technical_weight}%</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Financial Weight</p>
                    <p className="font-medium">{project.evaluation_criteria.financial_weight}%</p>
                  </div>
                  {project.evaluation_criteria.minimum_experience_years && (
                    <div>
                      <p className="text-sm text-gray-500">Minimum Experience</p>
                      <p className="font-medium">{project.evaluation_criteria.minimum_experience_years} years</p>
                    </div>
                  )}
                  {project.evaluation_criteria.required_certifications?.length > 0 && (
                    <div className="col-span-2">
                      <p className="text-sm text-gray-500 mb-1">Required Certifications</p>
                      <div className="flex flex-wrap gap-2">
                        {project.evaluation_criteria.required_certifications.map((cert: string, idx: number) => (
                          <span key={idx} className="px-2 py-1 bg-blue-100 text-blue-800 text-sm rounded">
                            {cert}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="border-t pt-4 mt-4 flex gap-3">
              {project.status === 'draft' && (
                <button
                  onClick={handlePublish}
                  className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
                >
                  Publish Project
                </button>
              )}
              {project.status === 'active' && bids.length > 0 && (
                <Link
                  to={`/organization/projects/${id}/evaluations`}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  View Evaluations
                </Link>
              )}
              <button
                onClick={() => navigate(`/organization/projects/${id}/edit`)}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
              >
                Edit Project
              </button>
            </div>
          </div>
        </div>

        {/* Bids List */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Submitted Bids ({bids.length})
            </h2>

            {bids.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <p>No bids submitted yet</p>
                {project.status === 'draft' && (
                  <p className="mt-2 text-sm">Publish the project to start receiving bids</p>
                )}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Bidder
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Bid Amount
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Submitted
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {bids.map((bid) => (
                      <tr key={bid.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {bid.bidder.company_name}
                            </div>
                            <div className="text-sm text-gray-500">
                              {bid.bidder.full_name}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-semibold text-gray-900">
                            ${bid.bid_amount.toLocaleString()} {bid.currency}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(bid.status)}`}>
                            {bid.status.replace('_', ' ')}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(bid.submitted_at).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <button
                            onClick={() => navigate(`/organization/bids/${bid.id}`)}
                            className="text-blue-600 hover:text-blue-800"
                          >
                            View Details
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProjectDetail;