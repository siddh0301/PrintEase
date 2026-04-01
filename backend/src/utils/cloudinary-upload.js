import cloudinary from '../config/cloudinary.js';
import pdfParse from 'pdf-parse/lib/pdf-parse.js';
import fs from 'fs';
import { promises as fsPromises } from 'fs';

/**
 * Extract PDF page count from buffer (fastest - no disk I/O)
 * Works with files loaded in memory
 * Falls back to pdf-parse for complex PDFs
 */
export const extractPageCountFromBuffer = async (buffer, mimeType) => {
  try {
    if ((mimeType || '').toLowerCase() !== 'application/pdf') {
      return null;
    }

    if (!buffer || buffer.length === 0) {
      return null;
    }

    const start = Date.now();

    // Strategy 1: Quick header search (first 100KB)
    try {
      const headerSize = Math.min(100 * 1024, buffer.length);
      const headerText = buffer.toString('latin1', 0, headerSize);
      const countMatch = headerText.match(/\/Count\s+(\d+)/);
      
      if (countMatch) {
        const pageCount = parseInt(countMatch[1]);
        if (pageCount > 0) {
          console.log(`✅ Pages (Header): ${pageCount} (${Date.now() - start}ms)`);
          return pageCount;
        }
      }
    } catch (error) {
      // Try next strategy
    }

    // Strategy 2: Quick footer search (last 100KB)
    try {
      const footerSize = Math.min(100 * 1024, buffer.length);
      const footerStart = Math.max(0, buffer.length - footerSize);
      const footerText = buffer.toString('latin1', footerStart);
      const countMatches = footerText.match(/\/Count\s+(\d+)/g);
      
      if (countMatches && countMatches.length > 0) {
        const lastMatch = countMatches[countMatches.length - 1];
        const pageCount = parseInt(lastMatch.match(/(\d+)/)[0]);
        
        if (pageCount > 0) {
          console.log(`✅ Pages (Footer): ${pageCount} (${Date.now() - start}ms)`);
          return pageCount;
        }
      }
    } catch (error) {
      // Try next strategy
    }

    // Strategy 3: Batch search across entire buffer at once
    try {
      const fullText = buffer.toString('latin1');
      const allMatches = fullText.match(/\/Count\s+(\d+)/g) || [];
      
      if (allMatches.length > 0) {
        // Get all page counts and use the largest one
        const pageCounts = allMatches.map(match => parseInt(match.match(/(\d+)/)[0]));
        const maxPageCount = Math.max(...pageCounts);
        
        if (maxPageCount > 0) {
          console.log(`✅ Pages (Batch): ${maxPageCount} (${Date.now() - start}ms)`);
          return maxPageCount;
        }
      }
    } catch (error) {
      // Try pdf-parse as fallback
    }

    // Strategy 4: Use pdf-parse as fallback (slower but more reliable)
    try {
      console.log(`⏳ Trying pdf-parse for reliable extraction...`);
      const data = await pdfParse(buffer);
      const pageCount = data?.numpages || null;
      
      if (pageCount && pageCount > 0) {
        console.log(`✅ Pages (PDF-Parse): ${pageCount} (${Date.now() - start}ms)`);
        return pageCount;
      }
    } catch (error) {
      console.log(`⚠️ PDF-Parse failed: ${error.message}`);
    }

    console.log(`⚠️ Pages: unknown (${Date.now() - start}ms) - Regex and PDF-Parse both failed`);
    return null;
  } catch (error) {
    console.error(`❌ Extract error: ${error.message}`);
    return null;
  }
};

/**
 * Calculate price based on page count and service rate
 */
export const calculatePrice = (pageCount, pricePerPage, quantity = 1) => {
  if (!pageCount || pageCount <= 0) return 0;
  return pageCount * pricePerPage * quantity;
};

/**
 * Upload file to Cloudinary (Buffer-based)
 * Works with memory storage - no disk I/O needed
 * Page count is extracted separately, not here
 * Skips upload for files > 10MB (Cloudinary free tier limit)
 */
export const uploadToCloudinayWithPageCount = async (file, options = {}) => {
  const { pricePerPage = 0, quantity = 1, pageCount = null } = options;
  const CLOUDINARY_MAX_SIZE = 10 * 1024 * 1024; // 10 MB

  try {
    // Step 1: Use provided page count (already extracted in inspectFiles)
    // OR extract if not provided
    let finalPageCount = pageCount;
    if (finalPageCount === null) {
      finalPageCount = await extractPageCountFromBuffer(file.buffer, file.mimetype);
    }

    // Step 2: Calculate price
    let calculatedPrice = null;
    if (finalPageCount !== null && finalPageCount > 0 && pricePerPage > 0) {
      calculatedPrice = calculatePrice(finalPageCount, pricePerPage, quantity);
    }

    // Step 3: Check file size before uploading
    const fileSize = file.buffer ? file.buffer.length : file.size;
    console.log(`📦 File Size: ${(fileSize / 1024 / 1024).toFixed(2)} MB`);

    let uploadUrl = null;
    let uploadId = null;

    if (fileSize > CLOUDINARY_MAX_SIZE) {
      console.log(`⚠️ File size (${(fileSize / 1024 / 1024).toFixed(2)} MB) exceeds Cloudinary limit (10 MB)`);
      console.log(`📝 Skipping Cloudinary upload - file too large`);
      console.log(`✅ Page count extracted: ${finalPageCount} pages | Price: ₹${calculatedPrice}`);
    } else {
      // Step 4: Upload to Cloudinary using buffer
      console.log(`☁️ Uploading to Cloudinary: ${file.originalname}`);
      
      const result = await new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
          {
            resource_type: 'auto',
            folder: 'printease/orders',
            original_filename: file.originalname,
            public_id: `${Date.now()}-${file.originalname.replace(/[^a-zA-Z0-9._-]/g, '-')}`.substring(0, 200)
          },
          (error, result) => {
            if (error) {
              console.error(`❌ Upload error: ${error.message}`);
              console.error('Full error:', error);
              reject(error);
            } else {
              console.log(`\n📊 CLOUDINARY RESPONSE:`);
              console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
              console.log(`✅ Public ID: ${result.public_id}`);
              console.log(`✅ Secure URL: ${result.secure_url}`);
              console.log(`✅ URL: ${result.url}`);
              console.log(`✅ File Size: ${result.bytes} bytes`);
              console.log(`✅ Upload: ${result.created_at}`);
              console.log(`✅ Version: ${result.version}`);
              console.log(`✅ Folder: ${result.folder}`);
              console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
              console.log('Full response:', JSON.stringify(result, null, 2));
              resolve(result);
            }
          }
        );
        
        // Write buffer to stream
        uploadStream.write(file.buffer);
        uploadStream.end();
      });

      uploadUrl = result.secure_url;
      uploadId = result.public_id;
      console.log(`✅ Uploaded: ${uploadUrl}`);
    }

    return {
      url: uploadUrl,
      pageCount: finalPageCount,
      calculatedPrice,
      originalName: file.originalname,
      mimeType: file.mimetype,
      fileSize: file.size,
      cloudinaryId: uploadId,
      uploadedToCloudinary: !!uploadUrl,
      message: fileSize > CLOUDINARY_MAX_SIZE ? 'File too large for Cloudinary - stored locally' : 'Uploaded to Cloudinary'
    };
  } catch (error) {
    throw new Error(`Upload failed: ${error.message}`);
  }
};

