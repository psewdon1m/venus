'use client';

import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';

interface Persona {
  id: string;
  slug: string;
  displayName: string;
  manifest?: string;
}

interface Project {
  id: string;
  title: string;
  slug: string;
  content: {
    placeholders: Array<{
      id: string;
      type: string;
      order: number;
      content: any;
    }>;
  };
}

export default function PersonaPage() {
  const params = useParams();
  const slug = params.slug as string;

  const [persona, setPersona] = useState<Persona | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPersonaData = async () => {
      try {
        // TODO: Fetch from API
        // For now, mock data
        setPersona({
          id: '1',
          slug,
          displayName: 'John Doe',
          manifest: 'Creative designer with 5+ years of experience in motion graphics and branding.'
        });

        setProjects([
          {
            id: '1',
            title: 'Brand Identity Project',
            slug: 'brand-identity',
            content: {
              placeholders: [
                {
                  id: 'cover-1',
                  type: 'cover',
                  order: 1,
                  content: {
                    title: 'Brand Identity Project',
                    subtitle: 'Complete brand redesign for tech startup'
                  }
                },
                {
                  id: 'meta-1',
                  type: 'meta',
                  order: 2,
                  content: {
                    role: 'Lead Designer',
                    year: 2024,
                    industry: 'Technology',
                    client: 'TechCorp'
                  }
                },
                {
                  id: 'process-1',
                  type: 'process',
                  order: 3,
                  content: {
                    description: 'Research, mood boards, logo concepts, final designs'
                  }
                }
              ]
            }
          }
        ]);
      } catch (err) {
        setError('Failed to load persona');
      } finally {
        setLoading(false);
      }
    };

    if (slug) {
      fetchPersonaData();
    }
  }, [slug]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  if (error || !persona) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Persona Not Found</h1>
          <p className="text-gray-600">The persona you're looking for doesn't exist.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 py-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">{persona.displayName}</h1>
          {persona.manifest && (
            <p className="text-xl text-gray-600 leading-relaxed">{persona.manifest}</p>
          )}
        </div>
      </header>

      {/* Projects Grid */}
      <main className="max-w-6xl mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {projects.map((project) => (
            <div key={project.id} className="group cursor-pointer">
              <div className="aspect-square bg-gray-100 rounded-lg mb-4 overflow-hidden">
                {/* Placeholder for project image */}
                <div className="w-full h-full bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center">
                  <span className="text-gray-500 text-sm">Project Image</span>
                </div>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 group-hover:text-gray-600 transition-colors">
                {project.title}
              </h3>
              <p className="text-sm text-gray-600 mt-1">
                {project.content.placeholders.find(p => p.type === 'meta')?.content.role || 'Project'}
              </p>
            </div>
          ))}
        </div>

        {projects.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500">No projects yet.</p>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-200 mt-16">
        <div className="max-w-4xl mx-auto px-4 py-8 text-center">
          <p className="text-gray-600">Built with Venus Platform</p>
        </div>
      </footer>
    </div>
  );
}