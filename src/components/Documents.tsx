import React, { useState, useEffect } from 'react';

interface Document {
    file_path: string;
    status: string;
}

const Documents = () => {
    const [documents, setDocuments] = useState<Document[]>([]);
    const [file, setFile] = useState<File | null>(null);
    const [recipientEmail, setRecipientEmail] = useState<string>('');
    const [message, setMessage] = useState<string>('');
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);

    // Fetch Documents from the Server
    useEffect(() => {
        fetch('http://localhost:5001/api/documents?userId=1')
        .then(res => res.json())
        .then(data => setDocuments(data));
    }, []);

    // Handle File Change and Preview
    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = e.target.files ? e.target.files[0] : null;
        setFile(selectedFile);
        if (selectedFile) {
            const preview = URL.createObjectURL(selectedFile);
            setPreviewUrl(preview);
        }
    };

    // Handle Sending Document to Recipient
    const handleSend = async () => {
        if (!file) {
            setMessage('Please select a file to send.');
            return;
        }

        if (!recipientEmail) {
            setMessage('Please enter a recipient email.');
            return;
        }

        const formData = new FormData();
        formData.append('file', file);
        formData.append('userId', '1');
        formData.append('recipientEmail', recipientEmail);

        console.log("Sending document with the following data:", {
            recipientEmail,
            file: file.name,
        });

        try {
            // Upload the Document
            const uploadResponse = await fetch('http://localhost:5001/api/documents', {
                method: 'POST',
                body: formData,
            });

            const uploadResult = await uploadResponse.json();
            if (!uploadResponse.ok) {
                // Adding more informative error message here
                setMessage(`Upload failed: ${uploadResult?.message || 'Unknown error'}`);
                return;
            }

            console.log("Upload Result:", uploadResult);

            // Send the Document to the Recipient
            const response = await fetch('http://localhost:5001/api/send-document', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    recipientEmail,
                    filePath: uploadResult.filePath,
                }),
            });

            const result = await response.json();
            if (response.ok) {
                setMessage(`Document sent successfully to ${recipientEmail}!`);
                setDocuments([...documents, { file_path: uploadResult.filePath, status: 'Pending' }]);
                setFile(null);
                setRecipientEmail('');
                setPreviewUrl(null);
            } else {
                setMessage(`Error sending document: ${result.message || 'Unknown error'}`);
            }
        } catch (error) {
            setMessage('Error sending document');
            console.error("Error during document send:", error);
        }
    };

    // Handle Deleting a Document
    const handleDelete = async (documentId: number) => {
        try {
            const response = await fetch(`/api/documents/${documentId}`, {
                method: 'DELETE',
            });

            if (response.ok) {
                setDocuments(documents.filter((doc: any) => doc.id !== documentId));
                setMessage('Document deleted successfully.');
            } else {
                setMessage('Error deleting document.');
            }
        } catch (error) {
            setMessage('Error deleting document');
            console.error(error);
        }
    };

    return (
        <div className="p-4">
            <h2 className="text-xl font-bold mb-4">Documents</h2>

            {/* Document Upload and Send */}
            <div className="mb-4">
                <input
                    type="file"
                    onChange={handleFileChange}
                    className="border p-2 rounded mb-2"
                />
                <input
                    type="email"
                    placeholder="Recipient Email (e.g., professor@csun.edu)"
                    value={recipientEmail}
                    onChange={(e) => setRecipientEmail(e.target.value)}
                    className="border p-2 rounded w-64 mb-2"
                />
                <button
                    onClick={handleSend}
                    className="bg-green-500 text-white px-4 py-2 rounded"
                >
                    Send to Professor/Admin
                </button>
                {message && <p className="text-sm text-gray-600 mt-2">{message}</p>}
            </div>

            {/* Document Preview */}
            {previewUrl && (
                <div className="mb-4">
                    <h3 className="text-lg font-semibold mb-2">Document Preview</h3>
                    <embed src={previewUrl} width="100%" height="400px" />
                </div>
            )}

            {/* Pending Approval Documents */}
            <h3 className="text-lg font-semibold mb-2">Pending Approval Documents</h3>
            <ul className="space-y-2">
                {documents
                    .filter((doc: any) => doc.status === 'Pending')
                    .map((doc: any) => (
                        <li key={doc.id} className="border p-2 rounded flex justify-between items-center">
                            <div>
                                <p>{doc.file_path} - {doc.status}</p>
                                <embed
                                    src={`/${doc.file_path}`}
                                    width="100%"
                                    height="300px"
                                    className="border rounded mt-2"
                                />
                            </div>
                            <button
                                onClick={() => handleDelete(doc.id)}
                                className="bg-red-500 text-white px-2 py-1 rounded"
                            >
                                Delete
                            </button>
                        </li>
                    ))}
            </ul>
        </div>
    );
};

export default Documents;
