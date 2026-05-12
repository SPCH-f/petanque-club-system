const PizZip = require('pizzip');
const Docxtemplater = require('docxtemplater');
const libre = require('libreoffice-convert');
const fs = require('fs').promises;
const path = require('path');
const { promisify } = require('util');
const ImageModule = require('docxtemplater-image-module-free');

const convertAsync = promisify(libre.convert);

/**
 * Document Service for generating documents from templates
 */
class DocumentService {
  /**
   * Generate a PDF document from a DOCX template
   * @param {string} templatePath - Path to the DOCX template file
   * @param {Object} data - Key-value pairs for placeholders {{key}}
   * @returns {Buffer} - The generated PDF buffer
   */
  async generatePdfFromDocx(templatePath, data) {
    try {
      // 1. Read the template file
      const content = await fs.readFile(templatePath, 'binary');
      const zip = new PizZip(content);

      // 2. Configure Image Module (same as in generateDocx)
      const fsSync = require('fs');
      const imageOptions = {
        centered: false,
        getImage: (tagValue) => {
          const emptyImage = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=', 'base64');
          if (!tagValue || tagValue === 'undefined') return emptyImage;
          try {
            return fsSync.readFileSync(tagValue);
          } catch (err) {
            console.warn(`Could not read image at ${tagValue}, using empty image instead.`);
            return emptyImage;
          }
        },
        getSize() { return [150, 60]; },
      };
      const imageModule = new ImageModule(imageOptions);

      // 3. Initialize Docxtemplater with Image Module and custom delimiters
      const doc = new Docxtemplater(zip, {
        paragraphLoop: true,
        linebreaks: true,
        delimiters: { start: '{{', end: '}}' },
        modules: [imageModule],
        nullGetter: () => "" // Return empty string for missing tags instead of "undefined"
      });

      // 4. Pre-process data: convert booleans to checkmarks
      const processedData = { ...data };
      Object.keys(processedData).forEach(key => {
        if (typeof processedData[key] === 'boolean') {
          processedData[key] = processedData[key] ? "✓" : "";
        }
      });

      // 5. Render the document
      doc.render(processedData);

      // 5. Get DOCX buffer
      const docxBuffer = doc.getZip().generate({
        type: 'nodebuffer',
        compression: 'DEFLATE',
      });

      // 6. Convert to PDF
      const pdfBuffer = await convertAsync(docxBuffer, '.pdf', undefined);
      return pdfBuffer;
    } catch (err) {
      if (err.properties && err.properties.errors) {
        console.error('Docxtemplater Errors:', JSON.stringify(err.properties.errors, null, 2));
      }
      console.error('Document generation error:', err);
      throw new Error(`Failed to generate document: ${err.message}`);
    }
  }

  /**
   * Generate a DOCX document buffer from a template
   * @param {string} templatePath 
   * @param {Object} data 
   * @returns {Buffer}
   */
  async generateDocx(templatePath, data) {
    try {
      const content = await fs.readFile(templatePath, 'binary');
      const zip = new PizZip(content);

      const fsSync = require('fs');

      // Image module configuration
      const imageOptions = {
        centered: false,
        getImage: (tagValue) => {
          // 1x1 transparent PNG buffer to use as a fallback for missing signatures
          const emptyImage = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=', 'base64');

          if (!tagValue || tagValue === 'undefined') {
            return emptyImage;
          }
          try {
            return fsSync.readFileSync(tagValue);
          } catch (err) {
            console.warn(`Could not read image at ${tagValue}, using empty image instead.`);
            return emptyImage;
          }
        },
        getSize() {
          // Fixed size for signatures (e.g., 150x60 pixels)
          return [150, 60];
        },
      };
      const imageModule = new ImageModule(imageOptions);

      const doc = new Docxtemplater(zip, {
        paragraphLoop: true,
        linebreaks: true,
        delimiters: { start: '{{', end: '}}' },
        modules: [imageModule],
        nullGetter: () => ""
      });

      // Pre-process data: convert booleans to checkmarks
      const processedData = { ...data };
      Object.keys(processedData).forEach(key => {
        if (typeof processedData[key] === 'boolean') {
          processedData[key] = processedData[key] ? "✓" : "";
        }
      });

      doc.render(processedData);

      return doc.getZip().generate({
        type: 'nodebuffer',
        compression: 'DEFLATE',
      });
    } catch (err) {
      console.error('DOCX generation error:', err);
      throw new Error(`Failed to generate DOCX: ${err.message}`);
    }
  }

  /**
   * Helper to ensure the uploads directory exists
   */
  async ensureUploadDirs() {
    const dirs = [
      path.join(__dirname, '../../uploads/templates'),
      path.join(__dirname, '../../uploads/generated')
    ];
    for (const dir of dirs) {
      try {
        await fs.access(dir);
      } catch {
        await fs.mkdir(dir, { recursive: true });
      }
    }
  }
}

module.exports = new DocumentService();
