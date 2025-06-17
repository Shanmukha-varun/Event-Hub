    // File: eventhub-backend/services/qrCodeService.js

    const QRCode = require('qrcode');

    /**
     * Generates a QR code image as a Base64 Data URL.
     * @param {string} text - The text to encode in the QR code.
     * @returns {Promise<string>} - A promise that resolves with the Data URL string.
     */
    const generateQRCodeDataURL = async (text) => {
      try {
        // Options for QR code generation (can be customized)
        const options = {
          errorCorrectionLevel: 'H', // High error correction level
          type: 'image/png',
          quality: 0.92,
          margin: 1,
        };
        // Generate QR code as Data URL
        const dataUrl = await QRCode.toDataURL(text, options);
        return dataUrl;
      } catch (err) {
        console.error('Error generating QR code Data URL:', err);
        throw new Error('Could not generate QR code'); // Re-throw for handling upstream
      }
    };

    module.exports = {
      generateQRCodeDataURL,
    };
    