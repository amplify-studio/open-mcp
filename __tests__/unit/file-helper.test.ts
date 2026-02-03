import { describe, it } from 'node:test';
import assert from 'node:assert';
import fs from 'node:fs/promises';
import { detectFileType, readAsBase64, getMimeType, normalizeInput } from '../../src/utils/file-helper.js';

describe('file-helper', () => {
  describe('detectFileType', () => {
    it('should detect image files', () => {
      assert.equal(detectFileType('/path/to/image.png'), 'image');
      assert.equal(detectFileType('/path/to/photo.jpg'), 'image');
    });

    it('should detect video files', () => {
      assert.equal(detectFileType('/path/to/video.mp4'), 'video');
      assert.equal(detectFileType('/path/to/movie.mov'), 'video');
    });

    it('should detect document files', () => {
      assert.equal(detectFileType('/path/to/doc.pdf'), 'file');
      assert.equal(detectFileType('/path/to/text.txt'), 'file');
    });

    it('should return null for unknown types', () => {
      assert.equal(detectFileType('/path/to/unknown.xyz'), null);
    });
  });

  describe('normalizeInput', () => {
    it('should detect local file paths', () => {
      const result = normalizeInput('/tmp/test.png');
      assert.equal(result.type, 'local');
      assert.equal(result.value, '/tmp/test.png');
    });

    it('should detect HTTP URLs', () => {
      const result = normalizeInput('https://example.com/image.png');
      assert.equal(result.type, 'url');
    });

    it('should detect base64 data URIs', () => {
      const result = normalizeInput('data:image/png;base64,iVBORw0KG...');
      assert.equal(result.type, 'base64');
    });

    it('should detect raw base64 strings', () => {
      const result = normalizeInput('iVBORw0KGgoAAAANSUhEUgAAAAUA');
      assert.equal(result.type, 'base64');
    });
  });

  describe('readAsBase64', () => {
    it('should successfully convert a file to base64', async () => {
      // Create a temporary test file with known content
      const testFilePath = '/tmp/tests/test-file-helper.txt';
      await fs.writeFile(testFilePath, 'Hello, World!');

      const base64 = await readAsBase64(testFilePath);

      // Verify the base64 encoding is correct
      assert.equal(base64, 'SGVsbG8sIFdvcmxkIQ==');

      // Clean up
      await fs.unlink(testFilePath);
    });

    it('should throw error for non-existent file', async () => {
      const nonExistentPath = '/tmp/tests/non-existent-file-xyz123.txt';

      await assert.rejects(
        async () => await readAsBase64(nonExistentPath),
        (error: Error) => {
          assert.ok(error.message.includes('Failed to read file'));
          assert.ok(error.message.includes(nonExistentPath));
          return true;
        }
      );
    });
  });

  describe('getMimeType', () => {
    it('should return correct MIME types for image extensions', () => {
      assert.equal(getMimeType('image.png'), 'image/png');
      assert.equal(getMimeType('photo.jpg'), 'image/jpeg');
      assert.equal(getMimeType('photo.jpeg'), 'image/jpeg');
      assert.equal(getMimeType('animation.gif'), 'image/gif');
      assert.equal(getMimeType('image.webp'), 'image/webp');
      assert.equal(getMimeType('image.bmp'), 'image/bmp');
    });

    it('should return correct MIME types for video extensions', () => {
      assert.equal(getMimeType('video.mp4'), 'video/mp4');
      assert.equal(getMimeType('movie.mov'), 'video/quicktime');
    });

    it('should return correct MIME types for document extensions', () => {
      assert.equal(getMimeType('document.pdf'), 'application/pdf');
      assert.equal(getMimeType('notes.txt'), 'text/plain');
    });

    it('should return application/octet-stream for unknown extensions', () => {
      assert.equal(getMimeType('file.xyz'), 'application/octet-stream');
      assert.equal(getMimeType('unknown.unknown'), 'application/octet-stream');
      assert.equal(getMimeType('noextension'), 'application/octet-stream');
    });
  });
});
