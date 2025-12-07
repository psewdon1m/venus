// Public persona page - displays published personas

import { apiClient, Persona, Placeholder } from '@/lib/api';
import { Metadata } from 'next';
import Image from 'next/image';
import { notFound } from 'next/navigation';

interface PublicPersonaPageProps {
  params: {
    slug: string;
  };
}

type ProjectPlaceholder = Placeholder & {
  content: Placeholder['content'] & {
    image?: string;
    subtitle?: string;
  };
};

type Project = {
  id: string;
  title: string;
  slug: string;
  type: string;
  status: string;
  content: {
    placeholders: ProjectPlaceholder[];
  };
  createdAt: string;
  updatedAt: string;
};

type PublicPersona = Persona & {
  projects: Project[];
};

// Generate metadata for SEO
export async function generateMetadata({ params }: PublicPersonaPageProps): Promise<Metadata> {
  try {
    const response = await apiClient.getPublicPersona(params.slug);
    const persona = response.data.persona;

    return {
      title: `${persona.displayName} - Portfolio`,
      description: persona.manifest || `Portfolio of ${persona.displayName}`,
      openGraph: {
        title: `${persona.displayName} - Portfolio`,
        description: persona.manifest || `Portfolio of ${persona.displayName}`,
        type: 'profile',
      },
    };
  } catch {
    return {
      title: 'Portfolio Not Found',
      description: 'The requested portfolio could not be found.',
    };
  }
}

// Fetch persona data
async function getPersonaData(slug: string): Promise<PublicPersona | null> {
  try {
    const response = await apiClient.getPublicPersona(slug);
    return response.data.persona;
  } catch (error) {
    console.error('Failed to fetch persona:', error);
    return null;
  }
}

export default async function PublicPersonaPage({ params }: PublicPersonaPageProps) {
  const persona = await getPersonaData(params.slug);

  if (!persona) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              {persona.displayName}
            </h1>
            {persona.manifest && (
              <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                {persona.manifest}
              </p>
            )}
          </div>
        </div>
      </header>

      {/* Projects Grid */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {persona.projects.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg">No projects published yet.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {persona.projects.map((project) => {
              const coverPlaceholder = project.content.placeholders.find(
                (placeholder) => placeholder.type === 'cover'
              );

              return (
                <div
                  key={project.id}
                  className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300"
                >
                  {/* Project Cover */}
                  <div className="aspect-video bg-gray-200 flex items-center justify-center">
                    {coverPlaceholder?.content?.image ? (
                      <Image
                        src={coverPlaceholder.content.image}
                        alt={project.title}
                        width={640}
                        height={360}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="text-gray-400 text-center">
                        <div className="w-16 h-16 bg-gray-300 rounded-full flex items-center justify-center mx-auto mb-2">
                          <span className="text-2xl font-bold">
                            {project.title.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <p className="text-sm">No image</p>
                      </div>
                    )}
                  </div>

                  {/* Project Info */}
                  <div className="p-6">
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">
                      {project.title}
                    </h3>

                    {coverPlaceholder?.content?.subtitle && (
                      <p className="text-gray-600 mb-3">
                        {coverPlaceholder.content.subtitle}
                      </p>
                    )}

                    <div className="flex items-center justify-between">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        {project.type}
                      </span>
                      <span className="text-sm text-gray-500">
                        {new Date(project.createdAt).getFullYear()}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center text-gray-500">
            <p>© {new Date().getFullYear()} {persona.displayName}. Powered by Venus Platform.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
