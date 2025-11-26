import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { bidderAPI } from '../../services/api';

interface Bid {
  id: number;
  project_id: number;
  project: {
    title: string;
    deadline: string;
  };
  bid_amount: number;
  currency: string;
  status: string;
  submitted_at?: string;
  created_at: string;
}

interface Evaluation {
  overall_score?: number;
  is_qualified?: boolean;
  rank?: number;
  status?: string;
}

const MyBids: React.FC = () => {
  const navigate = useNavigate();
  const [bids, setBids] = useState<Bid[]>([]);
  const [loading, setLoading] = useState(true);
  //const [selectedBid, setSelectedBid] = useState<number | null>(null);
  const [evaluation, setEvaluation] = useState<Evaluation | null>(null);
  const [showEvaluation, setShowEvaluation] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string>('all');

  useEffect(() => {
    fetchBids();
  }, []);

  const fetchBids = async () => {
    try {
      const response = await bidderAPI.getMyBids();
      setBids(response.data);
    } catch (error) {
      console.error('Failed to fetch bids:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchEvaluation = async (bidId: number) => {
    try {
      const response = await bidderAPI.getEvaluation(bidId);
      setEvaluation(response.data);
      //setSelectedBid(bidId);
      setShowEvaluation(true);
    } catch (error) {
      console.error('Failed to fetch evaluation:', error);
      alert('Evaluation not available yet');
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

  const filteredBids = filterStatus === 'all' 
    ? bids 
    : bids.filter(bid => bid.status === filterStatus);

  const statusCounts = {
    all: bids.length,
    draft: bids.filter(b => b.status === 'draft').length,
    submitted: bids.filter(b => b.status === 'submitted').length,
    under_evaluation: bids.filter(b => b.status === 'under_evaluation').length,
    evaluated: bids.filter(b => b.status === 'evaluated').length,
    awarded: bids.filter(b => b.status === 'awarded').length,
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={() => navigate('/bidder')}
            className="text-blue-600 hover:text-blue-800 mb-4"
          >
            ← Back to Dashboard
          </button>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">My Bids</h1>
          <p className="text-gray-600">Track and manage your bid submissions</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow p-4">
            <p className="text-sm text-gray-500">Total Bids</p>
            <p className="text-2xl font-bold text-gray-900">{statusCounts.all}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <p className="text-sm text-gray-500">In Review</p>
            <p className="text-2xl font-bold text-yellow-600">{statusCounts.under_evaluation}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <p className="text-sm text-gray-500">Evaluated</p>
            <p className="text-2xl font-bold text-purple-600">{statusCounts.evaluated}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <p className="text-sm text-gray-500">Awarded</p>
            <p className="text-2xl font-bold text-green-600">{statusCounts.awarded}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <p className="text-sm text-gray-500">Drafts</p>
            <p className="text-2xl font-bold text-gray-500">{statusCounts.draft}</p>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow p-4 mb-6">
          <div className="flex flex-wrap gap-2">
            {Object.entries(statusCounts).map(([status, count]) => (
              <button
                key={status}
                onClick={() => setFilterStatus(status)}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  filterStatus === status
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {status === 'all' ? 'All' : status.replace('_', ' ')} ({count})
              </button>
            ))}
          </div>
        </div>

        {/* Bids List */}
        {filteredBids.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <svg
              className="mx-auto h-12 w-12 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
            <h3 className="mt-2 text-lg font-medium text-gray-900">No bids found</h3>
            <p className="mt-1 text-sm text-gray-500">
              {filterStatus === 'all' 
                ? "You haven't submitted any bids yet" 
                : `No bids with status: ${filterStatus.replace('_', ' ')}`}
            </p>
            <button
              onClick={() => navigate('/bidder/projects')}
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Browse Projects
            </button>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Project
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
                      Deadline
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredBids.map((bid) => (
                    <tr key={bid.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div className="text-sm font-medium text-gray-900">
                          {bid.project.title}
                        </div>
                        <div className="text-sm text-gray-500">
                          Bid ID: #{bid.id}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-semibold text-gray-900">
                          {bid.currency} {bid.bid_amount.toLocaleString()}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(bid.status)}`}>
                          {bid.status.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {bid.submitted_at 
                          ? new Date(bid.submitted_at).toLocaleDateString()
                          : 'Not submitted'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(bid.project.deadline).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm space-x-2">
                        {bid.status === 'draft' && (
                          <button
                            onClick={() => navigate(`/bidder/projects/${bid.project_id}/bid`)}
                            className="text-blue-600 hover:text-blue-800"
                          >
                            Continue
                          </button>
                        )}
                        {['evaluated', 'shortlisted', 'rejected', 'awarded'].includes(bid.status) && (
                          <button
                            onClick={() => fetchEvaluation(bid.id)}
                            className="text-purple-600 hover:text-purple-800"
                          >
                            View Results
                          </button>
                        )}
                        <button
                          onClick={() => navigate(`/bidder/bids/${bid.id}`)}
                          className="text-gray-600 hover:text-gray-800"
                        >
                          Details
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Evaluation Modal */}
        {showEvaluation && evaluation && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-2xl w-full p-6">
              <div className="flex justify-between items-start mb-4">
                <h2 className="text-2xl font-bold text-gray-900">Evaluation Results</h2>
                <button
                  onClick={() => setShowEvaluation(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {evaluation.status === 'pending_evaluation' ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                  <p className="text-gray-600">Your bid is being evaluated</p>
                  <p className="text-sm text-gray-500 mt-2">This may take a few minutes</p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="bg-blue-50 rounded-lg p-4">
                    <p className="text-sm text-gray-600 mb-1">Overall Score</p>
                    <p className="text-4xl font-bold text-blue-600">
                      {evaluation.overall_score?.toFixed(1)}/100
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-gray-50 rounded-lg p-4">
                      <p className="text-sm text-gray-600 mb-1">Qualification Status</p>
                      <p className={`text-lg font-semibold ${
                        evaluation.is_qualified ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {evaluation.is_qualified ? 'Qualified' : 'Not Qualified'}
                      </p>
                    </div>

                    {evaluation.rank && (
                      <div className="bg-gray-50 rounded-lg p-4">
                        <p className="text-sm text-gray-600 mb-1">Your Rank</p>
                        <p className="text-lg font-semibold text-purple-600">
                          #{evaluation.rank}
                        </p>
                      </div>
                    )}
                  </div>

                  {evaluation.is_qualified ? (
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                      <p className="text-green-800">
                        Congratulations! Your bid has been qualified for consideration. 
                        The organization will review all qualified bids and make a final decision.
                      </p>
                    </div>
                  ) : (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                      <p className="text-red-800">
                        Unfortunately, your bid did not meet the minimum qualification criteria. 
                        Please review the requirements carefully for future bids.
                      </p>
                    </div>
                  )}

                  <div className="flex justify-end mt-6">
                    <button
                      onClick={() => setShowEvaluation(false)}
                      className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
                    >
                      Close
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MyBids;