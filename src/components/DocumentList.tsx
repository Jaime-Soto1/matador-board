import React, { useState, useEffect } from 'react';

interface Document {
  id: number;
  file_path: string;
  status: string;
  recipient_email: string;
}

const DocumentList: React.FC = () => {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [role, setRole] = useState<string>('');
  const [message, setMessage] = useState<string>('');

  const userId = 1; // dynamically from context/auth later
  const backendUrl = 'http://localhost:5001';

  useEffect(() => {
    const fetchRole = async () => {
      const res = await fetch(`/api/get-user-role?userId=${userId}`);
      const data = await res.json();
      setRole(data.role);
    };
    fetchRole();
  }, []);

  useEffect(() => {
    const fetchDocuments = async () => {
      const res = await fetch(`/api/documents?userId=${userId}`);
      const data = await res.json();
      setDocuments(data);
    };
    fetchDocuments();
  }, []);

  const handleDelete = async (id: number) => {
    const res = await fetch(`/api/documents/${id}`, { method: 'DELETE' });
    if (res.ok) {
      setDocuments(docs => docs.filter(doc => doc.id !== id));
      setMessage('Document deleted.');
      setTimeout(() => setMessage(''), 3000);
    }
  };

  const handleApprove = async (id: number) => {
    await fetch(`/api/documents/${id}/approve`, { method: 'PATCH' });
    setDocuments(docs =>
      docs.map(doc => doc.id === id ? { ...doc, status: 'Approved' } : doc)
    );
  };

  const handleReject = async (id: number) => {
    await fetch(`/api/documents/${id}/reject`, { method: 'PATCH' });
    setDocuments(docs =>
      docs.map(doc => doc.id === id ? { ...doc, status: 'Rejected' } : doc)
    );
  };

  const getPreview = (path: string) => {
    const ext = path.split('.').pop()?.toLowerCase();
    const fullPath = `${backendUrl}/${path}`;

    if (['jpg', 'jpeg', 'png', 'gif'].includes(ext!)) {
      return <img src={fullPath} alt="Preview" className="w-40 rounded" />;
    } else if (ext === 'pdf') {
      return <embed src={fullPath} type="application/pdf" width="200" height="250" />;
    } else {
      return <p className="text-gray-500">No preview</p>;
    }
  };
  

  const statusBadge = (status: string) => {
    const base = "px-2 py-1 text-sm rounded";
    if (status === 'Pending') return <span className={`${base} bg-yellow-100 text-yellow-800`}>Pending</span>;
    if (status === 'Approved') return <span className={`${base} bg-green-100 text-green-800`}>Approved</span>;
    if (status === 'Rejected') return <span className={`${base} bg-red-100 text-red-800`}>Rejected</span>;
    return <span>{status}</span>;
  };

  return (
    <div className="p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-4">Your Uploaded Documents</h2>
      {message && <div className="bg-green-100 text-green-800 p-2 rounded mb-4">{message}</div>}
      
      <ul className="space-y-4">
        {documents.map(doc => (
          <li key={doc.id} className="border p-4 rounded bg-gray-50">
            <div className="flex flex-col md:flex-row justify-between md:items-center">
              <div>
                <p className="font-semibold">Recipient: {doc.recipient_email}</p>
                <div className="my-2">{getPreview(doc.file_path)}</div>
                <p className="mt-1">Status: {statusBadge(doc.status)}</p>
              </div>

              <div className="flex gap-2 mt-4 md:mt-0">
                {role === 'faculty' && doc.status === 'Pending' && (
                  <>
                    <button onClick={() => handleApprove(doc.id)} className="bg-green-500 text-white px-3 py-1 rounded">Approve</button>
                    <button onClick={() => handleReject(doc.id)} className="bg-red-500 text-white px-3 py-1 rounded">Reject</button>
                  </>
                )}
                {role === 'user' && (
                  <button onClick={() => handleDelete(doc.id)} className="bg-gray-700 text-white px-3 py-1 rounded">Delete</button>
                )}
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default DocumentList;
