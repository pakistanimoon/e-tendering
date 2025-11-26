import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { bidderAPI } from '../../services/api';

interface Project {
  id: number;
  title: string;
  description: string;
  deadline: string;
  budget_range_min?: number;
  budget_range_max?: number;
}

interface Bid {
  id: number;
  project_id: number;
  bid_amount: number;
  status: string;
  submitted_at?: string;
}

const BidderDashboard: React.FC = () => {
  const { user, logout } = useAuth();
  const [activeProjects, setActiveProjects] = useState<Project[]>([]);
  const [myBids, setMyBids] = useState<Bid[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'available' | 'mybids'>('available');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [projectsRes, bidsRes] = await Promise.all([
        bidderAPI.getActiveProjects(),
        bidderAPI.getMyBids(),
      ]);
      setActiveProjects(projectsRes.data);
      setMyBids(bidsRes.data);
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft': return 'bg-gray-100 text-gray-800';
      case 'submitted': return 'bg-blue-100 text-blue-800';
      case 'under_evaluation': return 'bg-yellow-100 text-yellow-800';
      case 'evaluated': return 'bg-purple-100 text-purple-800';
      case 'shortlisted': return 'bg-green-100 text-green-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      case 'awarded': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-bold text-gray-900">E-Tendering Platform</h1>
              <span className="ml-4 px-3 py-1 text-sm bg-green-100 text-green-800 rounded-full">
                Bidder
              </span>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-700">{user?.company_name}</span>
              <button
                onClick={logout}
                className="text-sm text-gray-700 hover:text-gray-900"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900">Welcome, {user?.full_name}</h2>
          <p className="mt-1 text-sm text-gray-600">
            Browse available tenders and manage your bids
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-blue-500 rounded-md p-3">
                <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Available Tenders</dt>
                  <dd className="text-2xl font-semibold text-gray-900">{activeProjects.length}</dd>
                </dl>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-green-500 rounded-md p-3">
                <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">My Bids</dt>
                  <dd className="text-2xl font-semibold text-gray-900">{myBids.length}</dd>
                </dl>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-yellow-500 rounded-md p-3">
                <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Under Review</dt>
                  <dd className="text-2xl font-semibold text-gray-900">
                    {myBids.filter(b => ['submitted', 'under_evaluation'].includes(b.status)).length}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="mb-6 border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('available')}
              className={`${
                activeTab === 'available'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
            >
              Available Tenders
            </button>
            <button
              onClick={() => setActiveTab('mybids')}
              className={`${
                activeTab === 'mybids'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
            >
              My Bids
            </button>
          </nav>
        </div>

        {/* Content */}
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          </div>
        ) : activeTab === 'available' ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {activeProjects.length === 0 ? (
              <div className="col-span-full text-center py-12 bg-white rounded-lg shadow">
                <p className="text-gray-500">No active tenders available</p>
              </div>
            ) : (
              activeProjects.map((project) => (
                <Link
                  key={project.id}
                  to={`/bidder/projects/${project.id}/bid`}
                  className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow p-6"
                >
                  <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-2">
                    {project.title}
                  </h3>
                  
                  <p className="text-sm text-gray-600 mb-4 line-clamp-3">
                    {project.description}
                  </p>
                  
                  {(project.budget_range_min || project.budget_range_max) && (
                    <p className="text-sm text-gray-700 mb-2">
                      Budget: ${project.budget_range_min?.toLocaleString()} - ${project.budget_range_max?.toLocaleString()}
                    </p>
                  )}
                  
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-500">
                      Deadline: {new Date(project.deadline).toLocaleDateString()}
                    </span>
                    <span className="text-blue-600 hover:text-blue-800">
                      Submit Bid →
                    </span>
                  </div>
                </Link>
              ))
            )}
          </div>
        ) : (
          <Link to="/bidder/my-bids" className="block">
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">My Submissions</h3>
              {myBids.length === 0 ? (
                <p className="text-gray-500">No bids submitted yet</p>
              ) : (
                <div className="space-y-4">
                  {myBids.slice(0, 5).map((bid) => (
                    <div key={bid.id} className="flex justify-between items-center border-b pb-3">
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          Bid #{bid.id} - Project {bid.project_id}
                        </p>
                        <p className="text-sm text-gray-500">
                          Amount: ${bid.bid_amount.toLocaleString()}
                        </p>
                      </div>
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(bid.status)}`}>
                        {bid.status}
                      </span>
                    </div>
                  ))}
                  {myBids.length > 5 && (
                    <p className="text-sm text-blue-600">View all bids →</p>
                  )}
                </div>
              )}
            </div>
          </Link>
        )}
      </div>
    </div>
  );
};

export default BidderDashboard;