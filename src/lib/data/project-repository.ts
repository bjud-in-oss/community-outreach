/**
 * Project repository for managing projects and assets
 * Implements hybrid data model with Git integration and cloud storage
 */

import { 
  Project, 
  Asset, 
  ProjectType,
  ProjectStatus,
  AssetType,
  AssetStatus,
  StorageProvider,
  GitCommit,
  ProjectVersion,
  UIStateTree,
  ProjectSettings,
  ProjectCollaborator,
  CollaboratorRole,
  AssetMetadata,
  GitRepository
} from '../../types/data-models';

/**
 * Project creation data
 */
export interface CreateProjectData {
  name: string;
  description?: string;
  type: ProjectType;
  settings?: Partial<ProjectSettings>;
}

/**
 * Asset upload data
 */
export interface UploadAssetData {
  filename: string;
  type: AssetType;
  mime_type: string;
  size_bytes: number;
  file_data: ArrayBuffer;
  metadata?: Partial<AssetMetadata>;
}

/**
 * Project repository implementation
 * Requirement 11.1: Implement hybrid Project data model with Git integration
 */
export class ProjectRepository {
  private projects: Map<string, Project> = new Map();
  private assets: Map<string, Asset> = new Map();
  private gitRepositories: Map<string, GitRepository> = new Map();
  private projectVersions: Map<string, ProjectVersion[]> = new Map();
  
  /**
   * Creates a new project with Git repository
   * Requirement 11.1: Create Project node in Graph RAG with Git repository URL
   */
  async createProject(
    ownerId: string, 
    data: CreateProjectData
  ): Promise<Project> {
    const id = this.generateId();
    const now = new Date();
    
    // Create Git repository for the project
    const gitRepoUrl = await this.createGitRepository(id, data.name);
    
    // Default project settings
    const defaultSettings: ProjectSettings = {
      visibility: {
        view_access: 'owner',
        edit_access: 'owner',
        searchable: false,
        forkable: false
      },
      collaboration: {
        real_time_editing: true,
        require_approval: false,
        allow_comments: true,
        allow_suggestions: true,
        max_collaborators: 10
      },
      backup: {
        auto_backup: true,
        backup_frequency_hours: 24,
        backup_retention_count: 30,
        include_assets: true
      },
      notifications: {
        new_collaborators: true,
        content_changes: true,
        comments: true,
        asset_uploads: true
      }
    };
    
    const project: Project = {
      id,
      owner_id: ownerId,
      name: data.name,
      description: data.description,
      type: data.type,
      status: 'active',
      git_repository_url: gitRepoUrl,
      default_branch: 'main',
      settings: { ...defaultSettings, ...data.settings },
      assets: [],
      collaborators: [{
        user_id: ownerId,
        role: 'owner',
        permissions: {
          read: true,
          edit: true,
          delete: true,
          manage_assets: true,
          invite_others: true,
          manage_settings: true,
          view_history: true
        },
        status: 'accepted',
        added_at: now,
        joined_at: now,
        last_activity_at: now
      }],
      created_at: now,
      updated_at: now,
      last_activity_at: now
    };
    
    this.projects.set(id, project);
    
    // Initialize project with empty UIStateTree
    await this.initializeProjectContent(project);
    
    return project;
  }
  
  /**
   * Gets a project by ID
   */
  async getProjectById(id: string): Promise<Project | null> {
    return this.projects.get(id) || null;
  }
  
  /**
   * Gets all projects for a user
   */
  async getProjectsByUserId(userId: string): Promise<Project[]> {
    const projects: Project[] = [];
    
    for (const project of this.projects.values()) {
      // Check if user is owner or collaborator
      if (project.owner_id === userId || 
          project.collaborators.some(c => c.user_id === userId && c.status === 'accepted')) {
        projects.push(project);
      }
    }
    
    return projects;
  }
  
  /**
   * Updates a project
   */
  async updateProject(
    id: string, 
    updates: Partial<Project>
  ): Promise<Project | null> {
    const project = this.projects.get(id);
    if (!project) return null;
    
    const updatedProject = {
      ...project,
      ...updates,
      updated_at: new Date(),
      last_activity_at: new Date()
    };
    
    this.projects.set(id, updatedProject);
    
    // Commit changes to Git repository
    await this.commitProjectChanges(updatedProject, 'Update project metadata');
    
    return updatedProject;
  }
  
  /**
   * Uploads an asset to cloud storage
   * Requirement 11.3: Store actual file in cloud storage service
   */
  async uploadAsset(
    projectId: string,
    ownerId: string,
    data: UploadAssetData
  ): Promise<Asset | null> {
    const project = this.projects.get(projectId);
    if (!project) return null;
    
    const id = this.generateId();
    const now = new Date();
    
    // Simulate cloud storage upload
    const storageUrl = await this.uploadToCloudStorage(data.file_data, data.filename);
    
    const asset: Asset = {
      id,
      project_id: projectId,
      owner_id: ownerId,
      filename: data.filename,
      type: data.type,
      mime_type: data.mime_type,
      size_bytes: data.size_bytes,
      storage_url: storageUrl,
      storage_provider: 'aws_s3',
      metadata: {
        description: data.metadata?.description,
        tags: data.metadata?.tags || [],
        dimensions: data.metadata?.dimensions,
        duration_seconds: data.metadata?.duration_seconds,
        thumbnail_url: data.metadata?.thumbnail_url,
        alt_text: data.metadata?.alt_text,
        copyright: data.metadata?.copyright,
        location: data.metadata?.location,
        device_info: data.metadata?.device_info
      },
      status: 'available',
      uploaded_at: now,
      last_accessed_at: now
    };
    
    this.assets.set(id, asset);
    
    // Add asset to project
    project.assets.push(asset);
    project.updated_at = now;
    project.last_activity_at = now;
    
    // Create Asset node in Graph RAG and link to project
    await this.createAssetGraphNode(asset, project);
    
    return asset;
  }
  
  /**
   * Gets an asset by ID
   */
  async getAssetById(id: string): Promise<Asset | null> {
    const asset = this.assets.get(id);
    if (asset) {
      // Update last accessed timestamp
      asset.last_accessed_at = new Date();
    }
    return asset || null;
  }
  
  /**
   * Gets all assets for a project
   */
  async getAssetsByProjectId(projectId: string): Promise<Asset[]> {
    const project = this.projects.get(projectId);
    return project ? project.assets : [];
  }
  
  /**
   * Deletes an asset
   */
  async deleteAsset(id: string): Promise<boolean> {
    const asset = this.assets.get(id);
    if (!asset) return false;
    
    // Mark as deleted (soft delete)
    asset.status = 'deleted';
    
    // Remove from cloud storage (simulated)
    await this.deleteFromCloudStorage(asset.storage_url);
    
    // Remove from project
    const project = this.projects.get(asset.project_id);
    if (project) {
      project.assets = project.assets.filter(a => a.id !== id);
      project.updated_at = new Date();
      project.last_activity_at = new Date();
    }
    
    return true;
  }
  
  /**
   * Gets project version history from Git
   * Requirement 11.5: Retrieve version history from Git repositories
   */
  async getProjectVersionHistory(projectId: string): Promise<ProjectVersion[]> {
    const project = this.projects.get(projectId);
    if (!project) return [];
    
    // Get cached versions or fetch from Git
    let versions = this.projectVersions.get(projectId);
    if (!versions) {
      versions = await this.fetchVersionHistoryFromGit(project.git_repository_url);
      this.projectVersions.set(projectId, versions);
    }
    
    return versions;
  }
  
  /**
   * Gets a specific project version
   */
  async getProjectVersion(
    projectId: string, 
    versionId: string
  ): Promise<ProjectVersion | null> {
    const versions = await this.getProjectVersionHistory(projectId);
    return versions.find(v => v.id === versionId) || null;
  }
  
  /**
   * Gets project content at a specific version
   */
  async getProjectContentAtVersion(
    projectId: string,
    versionId: string
  ): Promise<UIStateTree | null> {
    const project = this.projects.get(projectId);
    if (!project) return null;
    
    // Fetch content from Git at specific commit
    return await this.fetchContentFromGit(project.git_repository_url, versionId);
  }
  
  /**
   * Saves project content to Git
   * Requirement 11.4: Store UIStateTree.json in Git repository
   */
  async saveProjectContent(
    projectId: string,
    content: UIStateTree,
    commitMessage: string
  ): Promise<boolean> {
    const project = this.projects.get(projectId);
    if (!project) return false;
    
    // Save UIStateTree.json to Git repository
    const success = await this.saveContentToGit(
      project.git_repository_url,
      content,
      commitMessage
    );
    
    if (success) {
      project.updated_at = new Date();
      project.last_activity_at = new Date();
      
      // Clear cached versions to force refresh
      this.projectVersions.delete(projectId);
    }
    
    return success;
  }
  
  /**
   * Adds a collaborator to a project
   */
  async addCollaborator(
    projectId: string,
    userId: string,
    role: CollaboratorRole
  ): Promise<boolean> {
    const project = this.projects.get(projectId);
    if (!project) return false;
    
    // Check if user is already a collaborator
    const existingCollaborator = project.collaborators.find(c => c.user_id === userId);
    if (existingCollaborator) return false;
    
    const now = new Date();
    const collaborator: ProjectCollaborator = {
      user_id: userId,
      role,
      permissions: this.getPermissionsForRole(role),
      status: 'invited',
      added_at: now
    };
    
    project.collaborators.push(collaborator);
    project.updated_at = now;
    project.last_activity_at = now;
    
    return true;
  }
  
  /**
   * Removes a collaborator from a project
   */
  async removeCollaborator(projectId: string, userId: string): Promise<boolean> {
    const project = this.projects.get(projectId);
    if (!project) return false;
    
    const collaboratorIndex = project.collaborators.findIndex(c => c.user_id === userId);
    if (collaboratorIndex === -1) return false;
    
    // Can't remove the owner
    if (project.collaborators[collaboratorIndex].role === 'owner') return false;
    
    project.collaborators.splice(collaboratorIndex, 1);
    project.updated_at = new Date();
    project.last_activity_at = new Date();
    
    return true;
  }
  
  /**
   * Creates a Git repository for the project (simulated)
   */
  private async createGitRepository(projectId: string, projectName: string): Promise<string> {
    const repoUrl = `https://git.example.com/projects/${projectId}`;
    
    const gitRepo: GitRepository = {
      url: repoUrl,
      provider: 'github',
      default_branch: 'main',
      status: 'active',
      last_sync_at: new Date(),
      size_bytes: 0
    };
    
    this.gitRepositories.set(projectId, gitRepo);
    
    return repoUrl;
  }
  
  /**
   * Initializes project with empty UIStateTree
   */
  private async initializeProjectContent(project: Project): Promise<void> {
    const initialContent: UIStateTree = {
      version: '1.0.0',
      root: {
        id: 'root',
        type: 'page',
        properties: {
          title: project.name,
          description: project.description || ''
        },
        children: [],
        metadata: {
          created_by: project.owner_id,
          last_modified_by: project.owner_id,
          created_at: project.created_at,
          last_modified_at: project.created_at
        }
      },
      metadata: {
        project_id: project.id,
        created_by: project.owner_id,
        last_modified_by: project.owner_id,
        created_at: project.created_at,
        schema_version: '1.0.0'
      },
      last_modified: project.created_at
    };
    
    await this.saveContentToGit(
      project.git_repository_url,
      initialContent,
      'Initial project setup'
    );
  }
  
  /**
   * Commits project changes to Git (simulated)
   */
  private async commitProjectChanges(
    project: Project,
    message: string
  ): Promise<void> {
    // In a real implementation, this would commit metadata changes to Git
    console.log(`Committing changes to ${project.git_repository_url}: ${message}`);
  }
  
  /**
   * Uploads file to cloud storage (simulated)
   */
  private async uploadToCloudStorage(
    fileData: ArrayBuffer,
    filename: string
  ): Promise<string> {
    // In a real implementation, this would upload to AWS S3, Google Cloud, etc.
    const assetId = this.generateId();
    return `https://storage.example.com/assets/${assetId}/${filename}`;
  }
  
  /**
   * Deletes file from cloud storage (simulated)
   */
  private async deleteFromCloudStorage(storageUrl: string): Promise<void> {
    // In a real implementation, this would delete from cloud storage
    console.log(`Deleting from cloud storage: ${storageUrl}`);
  }
  
  /**
   * Creates Asset node in Graph RAG (simulated)
   */
  private async createAssetGraphNode(asset: Asset, project: Project): Promise<void> {
    // In a real implementation, this would create nodes and relationships in Neo4j
    console.log(`Creating Asset node for ${asset.filename} in project ${project.name}`);
  }
  
  /**
   * Fetches version history from Git (simulated)
   */
  private async fetchVersionHistoryFromGit(repoUrl: string): Promise<ProjectVersion[]> {
    // In a real implementation, this would fetch from Git API
    const now = new Date();
    const mockCommit: GitCommit = {
      sha: 'abc123',
      message: 'Initial commit',
      author: {
        name: 'System',
        email: 'system@example.com',
        timestamp: now
      },
      committer: {
        name: 'System',
        email: 'system@example.com',
        timestamp: now
      },
      timestamp: now,
      parents: [],
      files_changed: [{
        path: 'UIStateTree.json',
        type: 'added',
        additions: 10,
        deletions: 0
      }],
      stats: {
        files_changed: 1,
        additions: 10,
        deletions: 0
      }
    };
    
    return [{
      id: 'abc123',
      name: 'Initial Version',
      description: 'Initial project setup',
      commit: mockCommit,
      type: 'commit',
      is_current: true,
      created_at: now
    }];
  }
  
  /**
   * Fetches content from Git at specific version (simulated)
   */
  private async fetchContentFromGit(
    repoUrl: string,
    versionId: string
  ): Promise<UIStateTree | null> {
    // In a real implementation, this would fetch UIStateTree.json from Git
    return null;
  }
  
  /**
   * Saves content to Git (simulated)
   */
  private async saveContentToGit(
    repoUrl: string,
    content: UIStateTree,
    commitMessage: string
  ): Promise<boolean> {
    // In a real implementation, this would save UIStateTree.json to Git
    console.log(`Saving content to ${repoUrl}: ${commitMessage}`);
    return true;
  }
  
  /**
   * Gets permissions for a collaborator role
   */
  private getPermissionsForRole(role: CollaboratorRole) {
    switch (role) {
      case 'owner':
        return {
          read: true,
          edit: true,
          delete: true,
          manage_assets: true,
          invite_others: true,
          manage_settings: true,
          view_history: true
        };
      case 'editor':
        return {
          read: true,
          edit: true,
          delete: false,
          manage_assets: true,
          invite_others: false,
          manage_settings: false,
          view_history: true
        };
      case 'viewer':
        return {
          read: true,
          edit: false,
          delete: false,
          manage_assets: false,
          invite_others: false,
          manage_settings: false,
          view_history: true
        };
      case 'commenter':
        return {
          read: true,
          edit: false,
          delete: false,
          manage_assets: false,
          invite_others: false,
          manage_settings: false,
          view_history: false
        };
      default:
        return {
          read: false,
          edit: false,
          delete: false,
          manage_assets: false,
          invite_others: false,
          manage_settings: false,
          view_history: false
        };
    }
  }
  
  /**
   * Generates a unique ID
   */
  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
  
  /**
   * Clears all data (for testing)
   */
  async clear(): Promise<void> {
    this.projects.clear();
    this.assets.clear();
    this.gitRepositories.clear();
    this.projectVersions.clear();
  }
}

/**
 * Global project repository instance
 */
export const projectRepository = new ProjectRepository();