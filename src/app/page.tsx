'use client';

import { useState } from 'react';

interface GeneratedForm {
  formSpec: {
    title: string;
    description?: string;
    fields: Array<{
      id: string;
      type: string;
      label: string;
      required: boolean;
    }>;
  };
  deploymentPackage: Record<string, string>;
}

export default function Home() {
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<GeneratedForm | null>(null);
  const [error, setError] = useState<string | null>(null);

  const generateForm = async () => {
    if (!prompt.trim()) return;

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ prompt }),
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Failed to generate form');
      }

      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            CareCanvas AI
          </h1>
          <p className="text-xl text-gray-600">
            Generate healthcare forms in seconds with natural language
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
          <div className="mb-6">
            <label htmlFor="prompt" className="block text-sm font-medium text-gray-700 mb-2">
              Describe the form you want to create
            </label>
            <textarea
              id="prompt"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="e.g., Create a patient intake form with name, email, symptoms, and medical history..."
              className="w-full h-32 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
            />
          </div>

          <button
            onClick={generateForm}
            disabled={loading || !prompt.trim()}
            className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg font-medium hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? 'Generating Form...' : 'Generate Form'}
          </button>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-8">
            <div className="flex">
              <div className="text-red-800">
                <h3 className="font-medium">Error</h3>
                <p className="mt-1 text-sm">{error}</p>
              </div>
            </div>
          </div>
        )}

        {result && (
          <div className="bg-white rounded-lg shadow-lg p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Generated Form: {result.formSpec.title}
            </h2>
            
            {result.formSpec.description && (
              <p className="text-gray-600 mb-6">{result.formSpec.description}</p>
            )}

            <div className="mb-8">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Form Fields</h3>
              <div className="space-y-3">
                {result.formSpec.fields.map((field) => (
                  <div key={field.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <span className="font-medium text-gray-900">{field.label}</span>
                      <span className="ml-2 text-sm text-gray-500">({field.type})</span>
                    </div>
                    {field.required && (
                      <span className="text-xs bg-red-100 text-red-800 px-2 py-1 rounded">Required</span>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="border-t pt-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Next Steps</h3>
              <div className="bg-blue-50 rounded-lg p-4">
                <p className="text-blue-800 mb-2">
                  <strong>Your form has been generated!</strong>
                </p>
                <p className="text-blue-700 text-sm">
                  The complete deployment package includes all necessary files to deploy your form. 
                  In the full version, this would be automatically deployed to Vercel and integrated with Healthie.
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="mt-12 text-center text-sm text-gray-500">
          <p>
            Powered by Claude AI • Integrates with Healthie • HIPAA Compliant
          </p>
        </div>
      </div>
    </div>
  );
}
