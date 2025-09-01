import { describe, it, expect } from 'vitest';
import { UIStateTree, TextBlock, HeadingBlock } from '@/types/editor';

describe('Editor Types', () => {
  describe('UIStateTree', () => {
    it('should have required metadata properties', () => {
      const now = new Date();
      const document: UIStateTree = {
        metadata: {
          title: 'Test Document',
          id: 'test-id',
          created_at: now,
          updated_at: now,
          author: 'test-author',
          version: 1
        },
        blocks: []
      };
      
      expect(document.metadata.title).toBe('Test Document');
      expect(document.metadata.id).toBe('test-id');
      expect(document.metadata.author).toBe('test-author');
      expect(document.metadata.version).toBe(1);
      expect(document.blocks).toEqual([]);
    });
  });
  
  describe('TextBlock', () => {
    it('should have correct structure', () => {
      const now = new Date();
      const textBlock: TextBlock = {
        id: 'text-1',
        type: 'text',
        created_at: now,
        updated_at: now,
        content: {
          text: 'Sample text',
          formatting: {
            bold: true,
            italic: false
          }
        }
      };
      
      expect(textBlock.type).toBe('text');
      expect(textBlock.content.text).toBe('Sample text');
      expect(textBlock.content.formatting?.bold).toBe(true);
      expect(textBlock.content.formatting?.italic).toBe(false);
    });
  });
  
  describe('HeadingBlock', () => {
    it('should have correct structure', () => {
      const now = new Date();
      const headingBlock: HeadingBlock = {
        id: 'heading-1',
        type: 'heading',
        created_at: now,
        updated_at: now,
        content: {
          text: 'Sample Heading',
          level: 2
        }
      };
      
      expect(headingBlock.type).toBe('heading');
      expect(headingBlock.content.text).toBe('Sample Heading');
      expect(headingBlock.content.level).toBe(2);
    });
  });
});