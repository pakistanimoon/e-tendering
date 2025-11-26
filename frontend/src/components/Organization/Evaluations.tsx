import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { organizationAPI } from '../../services/api';

interface EvaluationData {
  bid_id: number;
  bidder_name: string;
  bid_amount: number;
  technical_score: number;
  financial_score: number;
  overall_score: number;
  is_qualified: boolean;
  rank: number;
  ai_analysis: {
    technical_evaluation?: any;
    financial_evaluation?: any;
    compliance_evaluation?: any;
    overall_assessment?: any;
  };
}

const Evaluations: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [projectTitle, setProjectTitle] = useState('');
  const [evaluations, setEvaluations] = useState<EvaluationData[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedBid, setSelectedBid] = useState<EvaluationData | null>(null);
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    fetchEvaluations();
  }, [id]);

  const fetchEvaluations = async () => {
    try {
      const response = await organizationAPI.getEvaluations(Number(id));
      setProjectTitle(response.data.project_title);
      setEvaluations(response.data.evaluations);
    } catch (error) {
      console.error('Failed to fetch evaluations:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAwardContract = async (bidId: number, bidderName: string) => {
    if (!window.confirm(`Are you sure you want to award the contract to ${bidderName}?`)) {
      return;
    }

    try {
      await organizationAPI.awardContract(Number(id), bidId);
      alert('Contract awarded successfully!');
      navigate(`/organization/projects/${id}`);
    } catch (error) {
      alert('Failed to award contract');
      console.error(error);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600 bg-green-100';
    if (score >= 60) return 'text-blue-600 bg-blue-100';
    if (score >= 40) return 'text-yellow-600 bg-yellow-100';
    return 'text-red-600 bg-red-100';
  };

  const getRankBadge = (rank: number) => {
    if (rank === 1) return 'bg-yellow-400 text-yellow-900';
    if (rank === 2) return 'bg-gray-300 text-gray-900';
    if (rank === 3) return 'bg-orange-400 text-orange-900';
    return 'bg-gray-200 text-gray-700';
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
            onClick={() => navigate(`/organization/projects/${id}`)}
            className="text-blue-600 hover:text-blue-800 mb-4"
          >
            ← Back to Project
          </button>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Bid Evaluations
          </h1>
          <p className="text-gray-600">{projectTitle}</p>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow p-4">
            <p className="text-sm text-gray-500">Total Bids</p>
            <p className="text-2xl font-bold text-gray-900">{evaluations.length}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <p className="text-sm text-gray-500">Qualified</p>
            <p className="text-2xl font-bold text-green-600">
              {evaluations.filter(e => e.is_qualified).length}
            </p>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <p className="text-sm text-gray-500">Average Score</p>
            <p className="text-2xl font-bold text-blue-600">
              {evaluations.length > 0
                ? (evaluations.reduce((sum, e) => sum + e.overall_score, 0) / evaluations.length).toFixed(1)
                : '0'}
            </p>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <p className="text-sm text-gray-500">Top Score</p>
            <p className="text-2xl font-bold text-purple-600">
              {evaluations.length > 0
                ? Math.max(...evaluations.map(e => e.overall_score)).toFixed(1)
                : '0'}
            </p>
          </div>
        </div>

        {/* Evaluations Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Rank
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Bidder
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Bid Amount
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Technical
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Financial
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Overall
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {evaluations.map((evaluation) => (
                  <tr key={evaluation.bid_id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center justify-center w-8 h-8 rounded-full font-bold ${getRankBadge(evaluation.rank)}`}>
                        {evaluation.rank}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {evaluation.bidder_name}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-semibold text-gray-900">
                        ${evaluation.bid_amount.toLocaleString()}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs font-medium rounded ${getScoreColor(evaluation.technical_score)}`}>
                        {evaluation.technical_score.toFixed(1)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs font-medium rounded ${getScoreColor(evaluation.financial_score)}`}>
                        {evaluation.financial_score.toFixed(1)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-3 py-1 text-sm font-bold rounded ${getScoreColor(evaluation.overall_score)}`}>
                        {evaluation.overall_score.toFixed(1)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {evaluation.is_qualified ? (
                        <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">
                          Qualified
                        </span>
                      ) : (
                        <span className="px-2 py-1 text-xs font-medium rounded-full bg-red-100 text-red-800">
                          Not Qualified
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm space-x-2">
                      <button
                        onClick={() => {
                          setSelectedBid(evaluation);
                          setShowDetails(true);
                        }}
                        className="text-blue-600 hover:text-blue-800"
                      >
                        Details
                      </button>
                      {evaluation.is_qualified && evaluation.rank <= 3 && (
                        <button
                          onClick={() => handleAwardContract(evaluation.bid_id, evaluation.bidder_name)}
                          className="text-green-600 hover:text-green-800"
                        >
                          Award
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Detailed Analysis Modal */}
        {showDetails && selectedBid && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <h2 className="text-2xl font-bold text-gray-900">
                    Detailed Analysis - {selectedBid.bidder_name}
                  </h2>
                  <button
                    onClick={() => setShowDetails(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                {/* Technical Evaluation */}
                {selectedBid.ai_analysis.technical_evaluation && (
                  <div className="mb-6 border-b pb-4">
                    <h3 className="text-lg font-semibold mb-2 text-blue-600">Technical Evaluation</h3>
                    <div className="bg-blue-50 p-4 rounded">
                      <p className="text-sm mb-2">
                        <strong>Score:</strong> {selectedBid.technical_score.toFixed(1)}/100
                      </p>
                      {selectedBid.ai_analysis.technical_evaluation.strengths && (
                        <div className="mb-2">
                          <strong className="text-sm">Strengths:</strong>
                          <ul className="list-disc list-inside ml-2 text-sm">
                            {selectedBid.ai_analysis.technical_evaluation.strengths.map((s: string, i: number) => (
                              <li key={i}>{s}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                      {selectedBid.ai_analysis.technical_evaluation.weaknesses && (
                        <div className="mb-2">
                          <strong className="text-sm">Weaknesses:</strong>
                          <ul className="list-disc list-inside ml-2 text-sm">
                            {selectedBid.ai_analysis.technical_evaluation.weaknesses.map((w: string, i: number) => (
                              <li key={i}>{w}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                      {selectedBid.ai_analysis.technical_evaluation.key_findings && (
                        <p className="text-sm mt-2">
                          <strong>Key Findings:</strong> {selectedBid.ai_analysis.technical_evaluation.key_findings}
                        </p>
                      )}
                    </div>
                  </div>
                )}

                {/* Financial Evaluation */}
                {selectedBid.ai_analysis.financial_evaluation && (
                  <div className="mb-6 border-b pb-4">
                    <h3 className="text-lg font-semibold mb-2 text-green-600">Financial Evaluation</h3>
                    <div className="bg-green-50 p-4 rounded">
                      <p className="text-sm mb-2">
                        <strong>Score:</strong> {selectedBid.financial_score.toFixed(1)}/100
                      </p>
                      {selectedBid.ai_analysis.financial_evaluation.competitiveness && (
                        <p className="text-sm mb-2">
                          <strong>Competitiveness:</strong> {selectedBid.ai_analysis.financial_evaluation.competitiveness}
                        </p>
                      )}
                      {selectedBid.ai_analysis.financial_evaluation.key_findings && (
                        <p className="text-sm">
                          <strong>Key Findings:</strong> {selectedBid.ai_analysis.financial_evaluation.key_findings}
                        </p>
                      )}
                    </div>
                  </div>
                )}

                {/* Overall Assessment */}
                {selectedBid.ai_analysis.overall_assessment && (
                  <div className="mb-4">
                    <h3 className="text-lg font-semibold mb-2 text-purple-600">Overall Assessment</h3>
                    <div className="bg-purple-50 p-4 rounded">
                      <p className="text-sm mb-2">
                        <strong>Overall Score:</strong> {selectedBid.overall_score.toFixed(1)}/100
                      </p>
                      <p className="text-sm mb-2">
                        <strong>Recommendation:</strong>{' '}
                        <span className="font-semibold capitalize">
                          {selectedBid.ai_analysis.overall_assessment.recommendation}
                        </span>
                      </p>
                      {selectedBid.ai_analysis.overall_assessment.summary && (
                        <p className="text-sm">
                          <strong>Summary:</strong> {selectedBid.ai_analysis.overall_assessment.summary}
                        </p>
                      )}
                    </div>
                  </div>
                )}

                <div className="flex justify-end mt-6">
                  <button
                    onClick={() => setShowDetails(false)}
                    className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 mr-2"
                  >
                    Close
                  </button>
                  {selectedBid.is_qualified && (
                    <button
                      onClick={() => {
                        setShowDetails(false);
                        handleAwardContract(selectedBid.bid_id, selectedBid.bidder_name);
                      }}
                      className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                    >
                      Award Contract
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Evaluations;