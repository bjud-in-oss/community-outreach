/**
 * Integration tests for project repository functionality
 * Tests hybrid data model, Git integration, and asset management
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { ProjectRepository } from '../../lib/data/project-repository';
import type { 
  CreateProjectData, 
  UploadAssetData 
} from '../../lib/data/project-repository';
import type { UIStateTree } from '../../types/data-models';

describe('ProjectRepository', () => {
  let repository: ProjectRepository;
  let userId: string;
  
  beforeEach(async () => {
    repository = new ProjectRepository();
    await repository.clear();
    userId = 'user-123';
  });
  
  describe('Project Management', () => {
    const sampleProjectData: CreateProjectData = {
      name: 'My Personal Chronicle',
      description: 'A place for my thoughts and memories',
      type: 'personal_chronicle'
    };
    
    it('should create a project with Git repository', async () => {
      const project = await repository.createProject(userId, sampleProjectData);
      
      expect(project.id).toBeDefined();
      expect(project.owner_id).toBe(userId);
      expect(project.name).toBe('My Personal Chronicle');
      expect(project.type).toBe('personal_chronicle');
      expect(project.status).toBe('active');
      expect(project.git_repository_url).toBeDefined();
      expect(project.git_repository_url).toContain(project.id);
      expect(project.default_branch).toBe('main');
      expect(project.assets).toEqual([]);
      expect(project.collaborators).toHaveLength(1);
      expect(project.collaborators[0].user_id).toBe(userId);
      expect(project.collaborators[0].role).toBe('owner');
    });
    
    it('should set default project settings', async () => {
      const project = await repository.createProject(userId, sampleProjectData);
      
      expect(project.settings.visibility.view_access).toBe('owner');
      expect(project.settings.collaboration.real_time_editing).toBe(true);
      expect(project.settings.backup.auto_backup).toBe(true);
      expect(project.settings.notifications.content_changes).toBe(true);
    });
    
    it('should allow custom project settings', async () => {
      const customData: CreateProjectData = {
        ...sampleProjectData,
        settings: {
          visibility: {
            view_access: 'public',
            edit_access: 'collaborators',
            searchable: true,
            forkable: true
          }
        }
      };
      
      const project = await repository.createProject(userId, customData);
      
      expect(project.settings.visibility.view_access).toBe('public');
      expect(project.settings.visibility.searchable).toBe(true);
    });
    
    it('should retrieve project by ID', async () => {
      const project = await repository.createProject(userId, sampleProjectData);
      const retrieved = await repository.getProjectById(project.id);
      
      expect(retrieved).toEqual(project);
    });
    
    it('should return null for non-existent project', async () => {
      const retrieved = await repository.getProjectById('non-existent');
      expect(retrieved).toBeNull();
    });
    
    it('should get projects by user ID', async () => {
      const project1 = await repository.createProject(userId, sampleProjectData);
      const project2 = await repository.createProject(userId, {
        ...sampleProjectData,
        name: 'Another Project'
      });
      
      const projects = await repository.getProjectsByUserId(userId);
      
      expect(projects).toHaveLength(2);
      expect(projects.map(p => p.id)).toContain(project1.id);
      expect(projects.map(p => p.id)).toContain(project2.id);
    });
    
    it('should update project properties', async () => {
      const project = await repository.createProject(userId, sampleProjectData);
      const originalUpdatedAt = project.updated_at;
      
      // Wait a bit to ensure timestamp difference
      await new Promise(resolve => setTimeout(resolve, 10));
      
      const updated = await repository.updateProject(project.id, {
        name: 'Updated Project Name',
        description: 'Updated description'
      });
      
      expect(updated).not.toBeNull();
      expect(updated!.name).toBe('Updated Project Name');
      expect(updated!.description).toBe('Updated description');
      expect(updated!.updated_at.getTime()).toBeGreaterThan(originalUpdatedAt.getTime());
    });
  });
  
  describe('Asset Management', () => {
    let projectId: string;
    
    beforeEach(async () => {
      const project = await repository.createProject(userId, {
        name: 'Test Project',
        type: 'general'
      });
      projectId = project.id;
    });
    
    const sampleAssetData: UploadAssetData = {
      filename: 'photo.jpg',
      type: 'image',
      mime_type: 'image/jpeg',
      size_bytes: 1024000,
      file_data: new ArrayBuffer(1024000),
      metadata: {
        description: 'A beautiful sunset',
        tags: ['sunset', 'nature'],
        dimensions: { width: 1920, height: 1080 },
        alt_text: 'Sunset over mountains'
      }
    };
    
    it('should upload an asset to cloud storage', async () => {
      const asset = await repository.uploadAsset(projectId, userId, sampleAssetData);
      
      expect(asset).not.toBeNull();
      expect(asset!.id).toBeDefined();
      expect(asset!.project_id).toBe(projectId);
      expect(asset!.owner_id).toBe(userId);
      expect(asset!.filename).toBe('photo.jpg');
      expect(asset!.type).toBe('image');
      expect(asset!.mime_type).toBe('image/jpeg');
      expect(asset!.size_bytes).toBe(1024000);
      expect(asset!.storage_url).toBeDefined();
      expect(asset!.storage_url).toContain('storage.example.com');
      expect(asset!.storage_provider).toBe('aws_s3');
      expect(asset!.status).toBe('available');
      expect(asset!.metadata.description).toBe('A beautiful sunset');
      expect(asset!.metadata.tags).toEqual(['sunset', 'nature']);
    });
    
    it('should add asset to project', async () => {
      const asset = await repository.uploadAsset(projectId, userId, sampleAssetData);
      const project = await repository.getProjectById(projectId);
      
      expect(project!.assets).toHaveLength(1);
      expect(project!.assets[0].id).toBe(asset!.id);
    });
    
    it('should retrieve asset by ID', async () => {
      const asset = await repository.uploadAsset(projectId, userId, sampleAssetData);
      const retrieved = await repository.getAssetById(asset!.id);
      
      expect(retrieved).toEqual(asset);
    });
    
    it('should update last accessed timestamp when retrieving asset', async () => {
      const asset = await repository.uploadAsset(projectId, userId, sampleAssetData);
      const originalAccessTime = asset!.last_accessed_at!;
      
      // Wait a bit to ensure timestamp difference
      await new Promise(resolve => setTimeout(resolve, 10));
      
      const retrieved = await repository.getAssetById(asset!.id);
      
      expect(retrieved!.last_accessed_at!.getTime()).toBeGreaterThan(originalAccessTime.getTime());
    });
    
    it('should get assets by project ID', async () => {
      await repository.uploadAsset(projectId, userId, sampleAssetData);
      await repository.uploadAsset(projectId, userId, {
        ...sampleAssetData,
        filename: 'video.mp4',
        type: 'video',
        mime_type: 'video/mp4'
      });
      
      const assets = await repository.getAssetsByProjectId(projectId);
      
      expect(assets).toHaveLength(2);
      expect(assets.map(a => a.filename)).toContain('photo.jpg');
      expect(assets.map(a => a.filename)).toContain('video.mp4');
    });
    
    it('should delete an asset', async () => {
      const asset = await repository.uploadAsset(projectId, userId, sampleAssetData);
      const success = await repository.deleteAsset(asset!.id);
      
      expect(success).toBe(true);
      
      const retrieved = await repository.getAssetById(asset!.id);
      expect(retrieved!.status).toBe('deleted');
      
      const project = await repository.getProjectById(projectId);
      expect(project!.assets).toHaveLength(0);
    });
    
    it('should handle asset upload for non-existent project', async () => {
      const asset = await repository.uploadAsset('non-existent', userId, sampleAssetData);
      expect(asset).toBeNull();
    });
  });
  
  describe('Version History', () => {
    let projectId: string;
    
    beforeEach(async () => {
      const project = await repository.createProject(userId, {
        name: 'Versioned Project',
        type: 'general'
      });
      projectId = project.id;
    });
    
    it('should get project version history', async () => {
      const versions = await repository.getProjectVersionHistory(projectId);
      
      expect(versions).toHaveLength(1);
      expect(versions[0].name).toBe('Initial Version');
      expect(versions[0].type).toBe('commit');
      expect(versions[0].is_current).toBe(true);
      expect(versions[0].commit).toBeDefined();
      expect(versions[0].commit.message).toBe('Initial commit');
    });
    
    it('should get specific project version', async () => {
      const versions = await repository.getProjectVersionHistory(projectId);
      const version = await repository.getProjectVersion(projectId, versions[0].id);
      
      expect(version).toEqual(versions[0]);
    });
    
    it('should return null for non-existent version', async () => {
      const version = await repository.getProjectVersion(projectId, 'non-existent');
      expect(version).toBeNull();
    });
    
    it('should get project content at version', async () => {
      const versions = await repository.getProjectVersionHistory(projectId);
      const content = await repository.getProjectContentAtVersion(projectId, versions[0].id);
      
      // In this mock implementation, it returns null
      // In a real implementation, it would return the UIStateTree
      expect(content).toBeNull();
    });
  });
  
  describe('Content Management', () => {
    let projectId: string;
    
    beforeEach(async () => {
      const project = await repository.createProject(userId, {
        name: 'Content Project',
        type: 'general'
      });
      projectId = project.id;
    });
    
    it('should save project content to Git', async () => {
      const content: UIStateTree = {
        version: '1.0.0',
        root: {
          id: 'root',
          type: 'page',
          properties: { title: 'My Page' },
          children: [{
            id: 'para1',
            type: 'paragraph',
            properties: { text: 'Hello, world!' },
            children: []
          }]
        },
        metadata: {
          project_id: projectId,
          created_by: userId,
          last_modified_by: userId,
          created_at: new Date(),
          schema_version: '1.0.0'
        },
        last_modified: new Date()
      };
      
      const success = await repository.saveProjectContent(
        projectId,
        content,
        'Add hello world paragraph'
      );
      
      expect(success).toBe(true);
      
      const project = await repository.getProjectById(projectId);
      expect(project!.updated_at).toBeDefined();
    });
    
    it('should handle content save for non-existent project', async () => {
      const content: UIStateTree = {
        version: '1.0.0',
        root: { id: 'root', type: 'page', properties: {}, children: [] },
        metadata: {
          project_id: 'non-existent',
          created_by: userId,
          last_modified_by: userId,
          created_at: new Date(),
          schema_version: '1.0.0'
        },
        last_modified: new Date()
      };
      
      const success = await repository.saveProjectContent(
        'non-existent',
        content,
        'Test commit'
      );
      
      expect(success).toBe(false);
    });
  });
  
  describe('Collaboration Management', () => {
    let projectId: string;
    const collaboratorId = 'collaborator-456';
    
    beforeEach(async () => {
      const project = await repository.createProject(userId, {
        name: 'Collaborative Project',
        type: 'collaborative_space'
      });
      projectId = project.id;
    });
    
    it('should add a collaborator to project', async () => {
      const success = await repository.addCollaborator(projectId, collaboratorId, 'editor');
      
      expect(success).toBe(true);
      
      const project = await repository.getProjectById(projectId);
      expect(project!.collaborators).toHaveLength(2);
      
      const collaborator = project!.collaborators.find(c => c.user_id === collaboratorId);
      expect(collaborator).toBeDefined();
      expect(collaborator!.role).toBe('editor');
      expect(collaborator!.status).toBe('invited');
      expect(collaborator!.permissions.read).toBe(true);
      expect(collaborator!.permissions.edit).toBe(true);
      expect(collaborator!.permissions.delete).toBe(false);
    });
    
    it('should not add duplicate collaborator', async () => {
      await repository.addCollaborator(projectId, collaboratorId, 'editor');
      const success = await repository.addCollaborator(projectId, collaboratorId, 'viewer');
      
      expect(success).toBe(false);
      
      const project = await repository.getProjectById(projectId);
      expect(project!.collaborators).toHaveLength(2);
    });
    
    it('should remove a collaborator from project', async () => {
      await repository.addCollaborator(projectId, collaboratorId, 'editor');
      const success = await repository.removeCollaborator(projectId, collaboratorId);
      
      expect(success).toBe(true);
      
      const project = await repository.getProjectById(projectId);
      expect(project!.collaborators).toHaveLength(1);
      expect(project!.collaborators[0].user_id).toBe(userId); // Only owner remains
    });
    
    it('should not remove project owner', async () => {
      const success = await repository.removeCollaborator(projectId, userId);
      
      expect(success).toBe(false);
      
      const project = await repository.getProjectById(projectId);
      expect(project!.collaborators).toHaveLength(1);
      expect(project!.collaborators[0].user_id).toBe(userId);
    });
    
    it('should include collaborator projects in user projects', async () => {
      await repository.addCollaborator(projectId, collaboratorId, 'editor');
      
      // Update collaborator status to accepted
      const project = await repository.getProjectById(projectId);
      const collaborator = project!.collaborators.find(c => c.user_id === collaboratorId);
      collaborator!.status = 'accepted';
      collaborator!.joined_at = new Date();
      
      const projects = await repository.getProjectsByUserId(collaboratorId);
      
      expect(projects).toHaveLength(1);
      expect(projects[0].id).toBe(projectId);
    });
    
    it('should set correct permissions for different roles', async () => {
      await repository.addCollaborator(projectId, collaboratorId, 'viewer');
      
      const project = await repository.getProjectById(projectId);
      const collaborator = project!.collaborators.find(c => c.user_id === collaboratorId);
      
      expect(collaborator!.permissions.read).toBe(true);
      expect(collaborator!.permissions.edit).toBe(false);
      expect(collaborator!.permissions.delete).toBe(false);
      expect(collaborator!.permissions.manage_assets).toBe(false);
      expect(collaborator!.permissions.invite_others).toBe(false);
      expect(collaborator!.permissions.manage_settings).toBe(false);
    });
  });
  
  describe('Error Handling', () => {
    it('should handle operations on non-existent projects', async () => {
      const nonExistentId = 'non-existent-project';
      
      expect(await repository.getProjectById(nonExistentId)).toBeNull();
      expect(await repository.updateProject(nonExistentId, { name: 'New Name' })).toBeNull();
      expect(await repository.getAssetsByProjectId(nonExistentId)).toEqual([]);
      expect(await repository.getProjectVersionHistory(nonExistentId)).toEqual([]);
      expect(await repository.addCollaborator(nonExistentId, 'user', 'editor')).toBe(false);
    });
    
    it('should handle operations on non-existent assets', async () => {
      expect(await repository.getAssetById('non-existent-asset')).toBeNull();
      expect(await repository.deleteAsset('non-existent-asset')).toBe(false);
    });
  });
});