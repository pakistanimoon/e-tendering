import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { bidderAPI } from '../../services/api';

interface Project {
  id: number;
  title: string;
  description: string;
  deadline: string;
  budget_range_min?: number;
  budget_range_max?: number;
  organization_name?: string;
}

const ProjectList: React.FC = () => {
  const navigate = useNavigate();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'deadline' | 'budget'>('deadline');

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      const response = await bidderAPI.getActiveProjects();
      setProjects(response.data);
    } catch (error) {
      console.error('Failed to fetch projects:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredProjects = projects
    .filter(project =>
      project.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      project.description.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => {
      if (sortBy === 'deadline') {
        return new Date(a.deadline).getTime() - new Date(b.deadline).getTime();
      } else {
        const aMax = a.budget_range_max || 0;
        const bMax = b.budget_range_max || 0;
        return bMax - aMax;
      }
    });

  const getDaysRemaining = (deadline: string) => {
    const now = new Date();
    const end = new Date(deadline);
    const diff = end.getTime() - now.getTime();
    const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
    return days;
  };

  const getDeadlineColor = (days: number) => {
    if (days < 0) return 'text-red-600';
    if (days <= 3) return 'text-orange-600';
    if (days <= 7) return 'text-yellow-600';
    return 'text-green-600';
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
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Available Tenders
          </h1>
          <p className="text-gray-600">
            Browse and submit bids for active projects
          </p>
        </div>

        {/* Filters and Search */}
        <div className="bg-white rounded-lg shadow p-4 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Search Projects
              </label>
              <input
                type="text"
                placeholder="Search by title or description..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Sort By
              </label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as 'deadline' | 'budget')}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="deadline">Deadline (Earliest First)</option>
                <option value="budget">Budget (Highest First)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Projects Count */}
        <div className="mb-4">
          <p className="text-gray-600">
            Showing {filteredProjects.length} of {projects.length} projects
          </p>
        </div>

        {/* Projects Grid */}
        {filteredProjects.length === 0 ? (
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
            <h3 className="mt-2 text-lg font-medium text-gray-900">No projects found</h3>
            <p className="mt-1 text-sm text-gray-500">
              {searchTerm ? 'Try adjusting your search terms' : 'No active tenders available at the moment'}
            </p>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filteredProjects.map((project) => {
              const daysRemaining = getDaysRemaining(project.deadline);
              
              return (
                <div
                  key={project.id}
                  className="bg-white rounded-lg shadow hover:shadow-xl transition-shadow"
                >
                  <div className="p-6">
                    {/* Project Title */}
                    <h3 className="text-xl font-semibold text-gray-900 mb-2 line-clamp-2 min-h-[3.5rem]">
                      {project.title}
                    </h3>

                    {/* Organization */}
                    {project.organization_name && (
                      <p className="text-sm text-gray-500 mb-3">
                        by {project.organization_name}
                      </p>
                    )}

                    {/* Description */}
                    <p className="text-sm text-gray-600 mb-4 line-clamp-3 min-h-[4.5rem]">
                      {project.description}
                    </p>

                    {/* Budget */}
                    {project.budget_range_min && project.budget_range_max && (
                      <div className="mb-3 p-2 bg-blue-50 rounded">
                        <p className="text-xs text-gray-500 mb-1">Budget Range</p>
                        <p className="text-sm font-semibold text-blue-900">
                          ${project.budget_range_min.toLocaleString()} - ${project.budget_range_max.toLocaleString()}
                        </p>
                      </div>
                    )}

                    {/* Deadline */}
                    <div className="mb-4 p-2 bg-gray-50 rounded">
                      <p className="text-xs text-gray-500 mb-1">Deadline</p>
                      <p className="text-sm font-medium text-gray-900">
                        {new Date(project.deadline).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </p>
                      <p className={`text-xs font-semibold mt-1 ${getDeadlineColor(daysRemaining)}`}>
                        {daysRemaining < 0
                          ? 'Deadline passed'
                          : daysRemaining === 0
                          ? 'Due today!'
                          : daysRemaining === 1
                          ? '1 day remaining'
                          : `${daysRemaining} days remaining`}
                      </p>
                    </div>

                    {/* Action Button */}
                    <Link
                      to={`/bidder/projects/${project.id}/bid`}
                      className="block w-full px-4 py-2 bg-blue-600 text-white text-center rounded-md hover:bg-blue-700 transition-colors font-medium"
                    >
                      View & Submit Bid
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default ProjectList;