import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { bidderAPI } from '../../services/api';

const BidCreate: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  const [project, setProject] = useState<any>(null);
  const [bidData, setBidData] = useState({
    bid_amount: '',
    currency: 'USD',
    cover_letter: '',
  });
  const [documents, setDocuments] = useState<{
    type: string;
    file: File | null;
  }[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [bidId, setBidId] = useState<number | null>(null);
  const [step, setStep] = useState(1); // 1: Bid info, 2: Documents, 3: Review

  useEffect(() => {
    fetchProject();
  }, [id]);

  const fetchProject = async () => {
    try {
      const response = await bidderAPI.getProject(Number(id));
      setProject(response.data.project);
      
      // Check if already has a bid
      if (response.data.existing_bid_id) {
        setBidId(response.data.existing_bid_id);
        setStep(2); // Skip to documents if bid exists
      }
    } catch (err: any) {
      setError('Failed to load project details');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleBidSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    try {
      const response = await bidderAPI.createBid({
        project_id: Number(id),
        bid_amount: parseFloat(bidData.bid_amount),
        currency: bidData.currency,
        cover_letter: bidData.cover_letter,
      });
      setBidId(response.data.id);
      setStep(2); // Move to document upload
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to create bid');
    } finally {
      setSubmitting(false);
    }
  };

  const handleAddDocument = () => {
    setDocuments([...documents, { type: 'technical', file: null }]);
  };

  const handleDocumentChange = (index: number, field: string, value: any) => {
    const newDocs = [...documents];
    newDocs[index] = { ...newDocs[index], [field]: value };
    setDocuments(newDocs);
  };

  const handleRemoveDocument = (index: number) => {
    setDocuments(documents.filter((_, i) => i !== index));
  };

  const handleDocumentUpload = async () => {
    if (!bidId) return;

    setSubmitting(true);
    setError('');

    try {
      for (const doc of documents) {
        if (doc.file) {
          const formData = new FormData();
          formData.append('file', doc.file);
          formData.append('document_type', doc.type);

          await bidderAPI.uploadDocument(bidId, formData);
        }
      }
      setStep(3); // Move to review
    } catch (err: any) {
      setError('Failed to upload documents');
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleFinalSubmit = async () => {
    if (!bidId) return;

    if (!window.confirm('Are you sure you want to submit your bid? You cannot modify it after submission.')) {
      return;
    }

    setSubmitting(true);

    try {
      await bidderAPI.submitBid(bidId);
      alert('Bid submitted successfully!');
      navigate('/bidder/my-bids');
    } catch (err: any) {
      setError('Failed to submit bid');
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error && !project) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-800">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={() => navigate('/bidder/projects')}
            className="text-blue-600 hover:text-blue-800 mb-4"
          >
            ← Back to Projects
          </button>
        </div>

        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex items-center justify-center">
            {[1, 2, 3].map((s, idx) => (
              <React.Fragment key={s}>
                <div className="flex items-center">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold ${
                    step >= s ? 'bg-blue-600 text-white' : 'bg-gray-300 text-gray-600'
                  }`}>
                    {s}
                  </div>
                  <span className="ml-2 text-sm font-medium text-gray-700">
                    {s === 1 ? 'Bid Details' : s === 2 ? 'Documents' : 'Review'}
                  </span>
                </div>
                {idx < 2 && (
                  <div className={`w-24 h-1 mx-4 ${step > s ? 'bg-blue-600' : 'bg-gray-300'}`} />
                )}
              </React.Fragment>
            ))}
          </div>
        </div>

        {/* Project Info Card */}
        <div className="bg-white rounded-lg shadow mb-6 p-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">{project.title}</h2>
          <p className="text-gray-600 mb-4">{project.description}</p>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-500">Deadline:</span>
              <span className="ml-2 font-semibold">{new Date(project.deadline).toLocaleDateString()}</span>
            </div>
            {project.budget_range_min && project.budget_range_max && (
              <div>
                <span className="text-gray-500">Budget:</span>
                <span className="ml-2 font-semibold">
                  ${project.budget_range_min.toLocaleString()} - ${project.budget_range_max.toLocaleString()}
                </span>
              </div>
            )}
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <p className="text-red-800">{error}</p>
          </div>
        )}

        {/* Step 1: Bid Details */}
        {step === 1 && (
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-xl font-semibold mb-4">Bid Information</h3>
            <form onSubmit={handleBidSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Bid Amount *
                </label>
                <div className="flex">
                  <select
                    value={bidData.currency}
                    onChange={(e) => setBidData({ ...bidData, currency: e.target.value })}
                    className="px-3 py-2 border border-gray-300 rounded-l-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="USD">USD</option>
                    <option value="EUR">EUR</option>
                    <option value="GBP">GBP</option>
                    <option value="PKR">PKR</option>
                  </select>
                  <input
                    type="number"
                    required
                    min="0"
                    step="0.01"
                    value={bidData.bid_amount}
                    onChange={(e) => setBidData({ ...bidData, bid_amount: e.target.value })}
                    className="flex-1 px-4 py-2 border border-l-0 border-gray-300 rounded-r-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter your bid amount"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Cover Letter
                </label>
                <textarea
                  rows={6}
                  value={bidData.cover_letter}
                  onChange={(e) => setBidData({ ...bidData, cover_letter: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Introduce your company and explain why you're the best fit for this project..."
                />
              </div>

              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                >
                  {submitting ? 'Creating...' : 'Next: Upload Documents'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Step 2: Document Upload */}
        {step === 2 && (
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-xl font-semibold mb-4">Upload Supporting Documents</h3>
            
            <div className="space-y-4 mb-6">
              {documents.map((doc, index) => (
                <div key={index} className="flex gap-4 items-start p-4 border rounded-lg">
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Document Type
                    </label>
                    <select
                      value={doc.type}
                      onChange={(e) => handleDocumentChange(index, 'type', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="financial">Financial Statements</option>
                      <option value="technical">Technical Proposal</option>
                      <option value="rfp">RFP Response</option>
                      <option value="eoi">Expression of Interest</option>
                      <option value="sbd">Standard Bidding Document</option>
                      <option value="spq">Supplier Pre-Qualification</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      File
                    </label>
                    <input
                      type="file"
                      accept=".pdf,.doc,.docx,.xls,.xlsx"
                      onChange={(e) => handleDocumentChange(index, 'file', e.target.files?.[0] || null)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <button
                    onClick={() => handleRemoveDocument(index)}
                    className="mt-7 text-red-600 hover:text-red-800"
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>

            <button
              onClick={handleAddDocument}
              className="mb-6 px-4 py-2 border-2 border-dashed border-gray-300 text-gray-600 rounded-md hover:border-blue-500 hover:text-blue-600 w-full"
            >
              + Add Document
            </button>

            <div className="flex justify-between">
              <button
                onClick={() => setStep(1)}
                className="px-6 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
              >
                Back
              </button>
              <button
                onClick={handleDocumentUpload}
                disabled={submitting || documents.length === 0}
                className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
              >
                {submitting ? 'Uploading...' : 'Next: Review & Submit'}
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Review and Submit */}
        {step === 3 && (
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-xl font-semibold mb-4">Review Your Bid</h3>
            
            <div className="space-y-4 mb-6">
              <div className="border-b pb-4">
                <p className="text-sm text-gray-500">Bid Amount</p>
                <p className="text-2xl font-bold text-gray-900">
                  {bidData.currency} {parseFloat(bidData.bid_amount).toLocaleString()}
                </p>
              </div>

              {bidData.cover_letter && (
                <div className="border-b pb-4">
                  <p className="text-sm text-gray-500 mb-2">Cover Letter</p>
                  <p className="text-gray-700 whitespace-pre-wrap">{bidData.cover_letter}</p>
                </div>
              )}

              <div>
                <p className="text-sm text-gray-500 mb-2">Uploaded Documents ({documents.length})</p>
                <ul className="list-disc list-inside space-y-1">
                  {documents.map((doc, idx) => (
                    <li key={idx} className="text-gray-700">
                      {doc.type}: {doc.file?.name}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
              <p className="text-sm text-yellow-800">
                <strong>Important:</strong> Once you submit your bid, you cannot modify it. 
                Please review all information carefully before submitting.
              </p>
            </div>

            <div className="flex justify-between">
              <button
                onClick={() => setStep(2)}
                className="px-6 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
              >
                Back
              </button>
              <button
                onClick={handleFinalSubmit}
                disabled={submitting}
                className="px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 font-semibold"
              >
                {submitting ? 'Submitting...' : 'Submit Bid'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default BidCreate;