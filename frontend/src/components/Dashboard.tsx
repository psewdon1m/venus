'use client';

import { useEffect, useState, type FormEvent } from 'react';

import { useAuth } from '@/contexts/AuthContext';
import { apiClient } from '@/lib/api';

import type {
  Persona as ApiPersona,
  PersonaProjectAssignment,
  Project as ApiProject,
} from '@/lib/api';

type Project = ApiProject;
type Persona = ApiPersona;
type PersonaProject = PersonaProjectAssignment;

export function Dashboard(): JSX.Element {
  const { user, logout } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [personas, setPersonas] = useState<Persona[]>([]);
  const [activeTab, setActiveTab] = useState<'projects' | 'personas'>('projects');
  const [isLoading, setIsLoading] = useState(true);

  // Persona modal state
  const [isPersonaModalOpen, setIsPersonaModalOpen] = useState(false);
  const [editingPersona, setEditingPersona] = useState<Persona | null>(null);
  const [personaForm, setPersonaForm] = useState({
    displayName: '',
    manifest: '',
    slug: '',
  });
  const [isSubmittingPersona, setIsSubmittingPersona] = useState(false);

  // Project assignment modal state
  const [isAssignmentModalOpen, setIsAssignmentModalOpen] = useState(false);
  const [assigningPersona, setAssigningPersona] = useState<Persona | null>(null);
  const [personaProjects, setPersonaProjects] = useState<PersonaProject[]>([]);
  const [availableProjects, setAvailableProjects] = useState<Project[]>([]);
  const [isLoadingAssignments, setIsLoadingAssignments] = useState(false);

  useEffect(() => {
    const loadData = async (): Promise<void> => {
      try {
        const [projectsResponse, personasResponse] = await Promise.all([
          apiClient.getProjects(),
          apiClient.getPersonas(),
        ]);

        setProjects(projectsResponse.projects);
        setPersonas(personasResponse.personas);
      } catch (error) {
        console.error('Failed to load data:', error);
        // Keep empty arrays on error
      } finally {
        setIsLoading(false);
      }
    };

    void loadData();
  }, []);

  // Persona modal functions
  const openPersonaModal = (persona?: Persona): void => {
    if (persona) {
      setEditingPersona(persona);
      setPersonaForm({
        displayName: persona.displayName,
        manifest: persona.manifest || '',
        slug: '',
      });
    } else {
      setEditingPersona(null);
      setPersonaForm({
        displayName: '',
        manifest: '',
        slug: '',
      });
    }
    setIsPersonaModalOpen(true);
  };

  const closePersonaModal = (): void => {
    setIsPersonaModalOpen(false);
    setEditingPersona(null);
    setPersonaForm({
      displayName: '',
      manifest: '',
      slug: '',
    });
  };

  const handlePersonaSubmit = async (e: FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();
    setIsSubmittingPersona(true);

    try {
      if (editingPersona) {
        // Update persona
        await apiClient.updatePersona(editingPersona.id, {
          displayName: personaForm.displayName,
          manifest: personaForm.manifest || undefined,
        });
        // Update local state
        setPersonas((prev) =>
          prev.map((persona) =>
            persona.id === editingPersona.id
              ? { ...persona, displayName: personaForm.displayName, manifest: personaForm.manifest }
              : persona
          )
        );
      } else {
        // Create new persona
        const response = await apiClient.createPersona({
          displayName: personaForm.displayName,
          manifest: personaForm.manifest || undefined,
          slug: personaForm.slug || undefined,
        });
        // Add to local state
        setPersonas((prev) => [...prev, response.persona]);
      }
      closePersonaModal();
    } catch (error) {
      console.error('Failed to save persona:', error);
      // TODO: Show error message
    } finally {
      setIsSubmittingPersona(false);
    }
  };

  const handleDeletePersona = async (personaId: string): Promise<void> => {
    if (!confirm('Are you sure you want to delete this persona?')) return;

    try {
      await apiClient.deletePersona(personaId);
      setPersonas((prev) => prev.filter((persona) => persona.id !== personaId));
    } catch (error) {
      console.error('Failed to delete persona:', error);
      // TODO: Show error message
    }
  };

  const handlePublishPersona = async (personaId: string): Promise<void> => {
    try {
      const response = await apiClient.publishPersona(personaId);
      // Update persona in local state
      setPersonas((prev) =>
        prev.map((persona) =>
          persona.id === personaId
            ? { ...persona, isPublic: true, publicSlug: response.persona.publicSlug }
            : persona
        )
      );
      alert('Persona published successfully!');
    } catch (error) {
      console.error('Failed to publish persona:', error);
      alert('Failed to publish persona. Please try again.');
    }
  };

  // Project assignment functions
  const openAssignmentModal = async (persona: Persona): Promise<void> => {
    setAssigningPersona(persona);
    setIsLoadingAssignments(true);
    setIsAssignmentModalOpen(true);

    try {
      // Load persona's current projects
      const personaProjectsResponse = await apiClient.getPersonaProjects(persona.id);
      setPersonaProjects(personaProjectsResponse.projects);

      // Set available projects (all projects that are not already assigned)
      const assignedProjectIds = new Set(
        personaProjectsResponse.projects.map((assignment) => assignment.id)
      );
      setAvailableProjects(projects.filter((p) => !assignedProjectIds.has(p.id)));
    } catch (error) {
      console.error('Failed to load assignments:', error);
    } finally {
      setIsLoadingAssignments(false);
    }
  };

  const closeAssignmentModal = (): void => {
    setIsAssignmentModalOpen(false);
    setAssigningPersona(null);
    setPersonaProjects([]);
    setAvailableProjects([]);
  };

  const handleAssignProject = async (projectId: string): Promise<void> => {
    if (!assigningPersona) return;

    try {
      await apiClient.assignProjectToPersona(assigningPersona.id, { projectId });
      // Move project from available to assigned
      const project = availableProjects.find((item) => item.id === projectId);
      if (project) {
        setAvailableProjects((prev) => prev.filter((item) => item.id !== projectId));
        setPersonaProjects((prev) => [
          ...prev,
          {
            ...project,
            personaProjectId: 'temp-id',
            displayOrder: prev.length,
            isVisible: true,
          },
        ]);
      }
    } catch (error) {
      console.error('Failed to assign project:', error);
    }
  };

  const handleRemoveProject = async (projectId: string): Promise<void> => {
    if (!assigningPersona) return;

    try {
      await apiClient.removeProjectFromPersona(assigningPersona.id, projectId);
      // Move project from assigned back to available
      const assignedProject = personaProjects.find((project) => project.id === projectId);
      if (assignedProject) {
        setPersonaProjects((prev) => prev.filter((project) => project.id !== projectId));
        setAvailableProjects((prev) => [
          ...prev,
          {
            id: assignedProject.id,
            title: assignedProject.title,
            slug: assignedProject.slug,
            type: assignedProject.type,
            status: assignedProject.status,
            createdAt: assignedProject.createdAt,
            updatedAt: assignedProject.updatedAt,
          },
        ]);
      }
    } catch (error) {
      console.error('Failed to remove project:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-gray-900">Venus Platform</h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-700">Welcome, {user?.email}</span>
              <button
                onClick={() => {
                  void logout();
                }}
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md text-sm font-medium"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {/* Tabs */}
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              <button
                onClick={() => setActiveTab('projects')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'projects'
                    ? 'border-indigo-500 text-indigo-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Projects ({projects.length})
              </button>
              <button
                onClick={() => setActiveTab('personas')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'personas'
                    ? 'border-indigo-500 text-indigo-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Personas ({personas.length})
              </button>
            </nav>
          </div>

          {/* Content */}
          <div className="mt-8">
            {activeTab === 'projects' ? (
              <div>
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-lg font-medium text-gray-900">Your Projects</h2>
                  <button className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md text-sm font-medium">
                    + New Project
                  </button>
                </div>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {projects.map((project) => (
                    <div key={project.id} className="bg-white overflow-hidden shadow rounded-lg">
                      <div className="p-5">
                        <div className="flex items-center">
                          <div className="flex-shrink-0">
                            <div className="w-8 h-8 bg-indigo-500 rounded-full flex items-center justify-center">
                              <span className="text-white text-sm font-medium">
                                {project.title.charAt(0).toUpperCase()}
                              </span>
                            </div>
                          </div>
                          <div className="ml-5 w-0 flex-1">
                            <dl>
                              <dt className="text-sm font-medium text-gray-500 truncate">
                                {project.title}
                              </dt>
                              <dd className="text-sm text-gray-900">
                                {project.type} • {project.status}
                              </dd>
                            </dl>
                          </div>
                        </div>
                      </div>
                      <div className="bg-gray-50 px-5 py-3">
                        <div className="text-sm">
                          <button className="text-indigo-600 hover:text-indigo-500 font-medium">
                            View Details
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div>
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-lg font-medium text-gray-900">Your Personas</h2>
                  <button
                    onClick={() => openPersonaModal()}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md text-sm font-medium"
                  >
                    + New Persona
                  </button>
                </div>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {personas.map((persona) => (
                    <div key={persona.id} className="bg-white overflow-hidden shadow rounded-lg">
                      <div className="p-5">
                        <div className="flex items-center">
                          <div className="flex-shrink-0">
                            <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                              <span className="text-white text-sm font-medium">
                                {persona.displayName.charAt(0).toUpperCase()}
                              </span>
                            </div>
                          </div>
                          <div className="ml-5 w-0 flex-1">
                            <dl>
                              <dt className="text-sm font-medium text-gray-500 truncate">
                                {persona.displayName}
                              </dt>
                              <dd className="text-sm text-gray-900">
                                {persona.manifest || 'No manifest'}
                              </dd>
                            </dl>
                          </div>
                        </div>
                      </div>
                      <div className="bg-gray-50 px-5 py-3">
                        <div className="text-sm space-x-3">
                          <button
                            onClick={() => openPersonaModal(persona)}
                            className="text-indigo-600 hover:text-indigo-500 font-medium"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => {
                              void openAssignmentModal(persona);
                            }}
                            className="text-green-600 hover:text-green-500 font-medium"
                          >
                            Manage Projects
                          </button>
                          <button
                            onClick={() => {
                              void handlePublishPersona(persona.id);
                            }}
                            className="text-blue-600 hover:text-blue-500 font-medium"
                          >
                            Publish
                          </button>
                          <button
                            onClick={() => {
                              void handleDeletePersona(persona.id);
                            }}
                            className="text-red-600 hover:text-red-500 font-medium"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Persona Modal */}
      {isPersonaModalOpen && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                {editingPersona ? 'Edit Persona' : 'Create New Persona'}
              </h3>

              <form
                onSubmit={(event) => {
                  void handlePersonaSubmit(event);
                }}
                className="space-y-4"
              >
                <div>
                  <label htmlFor="displayName" className="block text-sm font-medium text-gray-700">
                    Display Name *
                  </label>
                  <input
                    type="text"
                    id="displayName"
                    value={personaForm.displayName}
                    onChange={(e) =>
                      setPersonaForm((prev) => ({ ...prev, displayName: e.target.value }))
                    }
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                    required
                  />
                </div>

                <div>
                  <label htmlFor="manifest" className="block text-sm font-medium text-gray-700">
                    Manifest/Bio
                  </label>
                  <textarea
                    id="manifest"
                    value={personaForm.manifest}
                    onChange={(e) =>
                      setPersonaForm((prev) => ({ ...prev, manifest: e.target.value }))
                    }
                    rows={3}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="Describe this persona..."
                  />
                </div>

                {!editingPersona && (
                  <div>
                    <label htmlFor="slug" className="block text-sm font-medium text-gray-700">
                      Slug (optional)
                    </label>
                    <input
                      type="text"
                      id="slug"
                      value={personaForm.slug}
                      onChange={(e) =>
                        setPersonaForm((prev) => ({ ...prev, slug: e.target.value }))
                      }
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                      placeholder="custom-slug"
                    />
                  </div>
                )}

                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={closePersonaModal}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmittingPersona}
                    className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSubmittingPersona ? 'Saving...' : editingPersona ? 'Update' : 'Create'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Project Assignment Modal */}
      {isAssignmentModalOpen && assigningPersona && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 max-w-4xl shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Manage Projects for {assigningPersona.displayName}
              </h3>

              {isLoadingAssignments ? (
                <div className="flex justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Assigned Projects */}
                  <div>
                    <h4 className="text-md font-medium text-gray-900 mb-3">Assigned Projects</h4>
                    <div className="space-y-2 max-h-96 overflow-y-auto">
                      {personaProjects.length === 0 ? (
                        <p className="text-gray-500 text-sm">No projects assigned yet</p>
                      ) : (
                        personaProjects.map((project) => (
                          <div
                            key={project.id}
                            className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-md"
                          >
                            <div>
                              <p className="text-sm font-medium text-gray-900">{project.title}</p>
                              <p className="text-xs text-gray-500">
                                {project.type} • {project.status}
                              </p>
                            </div>
                            <button
                              onClick={() => {
                                void handleRemoveProject(project.id);
                              }}
                              className="text-red-600 hover:text-red-800 text-sm font-medium"
                            >
                              Remove
                            </button>
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                  {/* Available Projects */}
                  <div>
                    <h4 className="text-md font-medium text-gray-900 mb-3">Available Projects</h4>
                    <div className="space-y-2 max-h-96 overflow-y-auto">
                      {availableProjects.length === 0 ? (
                        <p className="text-gray-500 text-sm">All projects are already assigned</p>
                      ) : (
                        availableProjects.map((project) => (
                          <div
                            key={project.id}
                            className="flex items-center justify-between p-3 bg-gray-50 border border-gray-200 rounded-md"
                          >
                            <div>
                              <p className="text-sm font-medium text-gray-900">{project.title}</p>
                              <p className="text-xs text-gray-500">
                                {project.type} • {project.status}
                              </p>
                            </div>
                            <button
                              onClick={() => {
                                void handleAssignProject(project.id);
                              }}
                              className="text-indigo-600 hover:text-indigo-800 text-sm font-medium"
                            >
                              Assign
                            </button>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              )}

              <div className="flex justify-end pt-4">
                <button
                  onClick={closeAssignmentModal}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
