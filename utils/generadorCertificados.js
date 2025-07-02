const { PDFDocument, rgb, StandardFonts } = require('pdf-lib');
const fs = require('fs');

async function generateICACITCertificate({
  programName = 'INGENIERÍA MECATRÓNICA',
  universityName = 'Universidad Ricardo Palma',
  modalidad = 'modalidad presencial del campus Principal',
  accreditationDate = '2023',
  presidenteName = 'Enrique Alvarez Rodrich',
  technicalCommitteePresidentName = 'César Gallegos Chávez',
  logoPath = null, // Path to ICACIT logo image
  leftSignaturePath = null, // Path to left signature PNG
  rightSignaturePath = null, // Path to right signature PNG
  outputPath = 'icacit-certificate.pdf'
} = {}) {
  
  try {
    // Create a new PDF document with landscape orientation
    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage([841.89, 595.28]); // A4 landscape (width x height)
    
    // Get page dimensions
    const { width, height } = page.getSize();
    
    // Load fonts
    const helveticaFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const helveticaBoldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    const timesRomanFont = await pdfDoc.embedFont(StandardFonts.TimesRoman);
    const timesRomanBoldFont = await pdfDoc.embedFont(StandardFonts.TimesRomanBold);
    
    // Colors
    const darkBlue = rgb(0.1, 0.2, 0.4);
    const lightBlue = rgb(0.4, 0.7, 0.9);
    const black = rgb(0, 0, 0);
    const gray = rgb(0.4, 0.4, 0.4);
    
    // Logo handling
    let logoImage = null;
    if (logoPath && fs.existsSync(logoPath)) {
      try {
        const logoBytes = fs.readFileSync(logoPath);
        const logoExtension = logoPath.toLowerCase().split('.').pop();
        
        if (logoExtension === 'png') {
          logoImage = await pdfDoc.embedPng(logoBytes);
        } else if (logoExtension === 'jpg' || logoExtension === 'jpeg') {
          logoImage = await pdfDoc.embedJpg(logoBytes);
        }
      } catch (error) {
        console.warn('Could not load logo image:', error.message);
      }
    }
    
    // Draw logo or fallback geometric logo
    const logoX = 80;
    const logoY = height - 80;
    
    if (logoImage) {
      const logoScale = 0.3; // Adjust scale as needed
      page.drawImage(logoImage, {
        x: logoX - 30,
        y: logoY - 30,
        width: logoImage.width * logoScale,
        height: logoImage.height * logoScale,
      });
    } else {
      // Fallback geometric logo
      page.drawCircle({
        x: logoX,
        y: logoY,
        size: 25,
        color: darkBlue,
      });
      
      page.drawCircle({
        x: logoX - 10,
        y: logoY + 5,
        size: 15,
        color: lightBlue,
      });
      
      page.drawCircle({
        x: logoX + 10,
        y: logoY - 5,
        size: 12,
        color: lightBlue,
      });
    }
    
    // Draw "ICACIT" text
    page.drawText('ICACIT', {
      x: logoX + 60,
      y: logoY - 5,
      size: 36,
      font: helveticaBoldFont,
      color: darkBlue,
    });
    
    // Main header text - adjusted for landscape
    const headerText1 = 'El Comité Técnico de Acreditación de Ingeniería (CTAI) del Instituto de Calidad y Acreditación de Programas de';
    const headerText2 = 'Computación, Ingeniería y Tecnología – ICACIT ha completado la evaluación del Programa en:';
    
    page.drawText(headerText1, {
      x: 60,
      y: height - 140,
      size: 12,
      font: helveticaFont,
      color: black,
      maxWidth: width - 120,
    });
    
    page.drawText(headerText2, {
      x: 60,
      y: height - 160,
      size: 12,
      font: helveticaFont,
      color: black,
      maxWidth: width - 120,
    });
    
    // Program name (large, bold, centered)
    const programNameWidth = timesRomanBoldFont.widthOfTextAtSize(programName, 28);
    page.drawText(programName, {
      x: (width - programNameWidth) / 2,
      y: height - 220,
      size: 28,
      font: timesRomanBoldFont,
      color: black,
    });
    
    // University information
    const universityText = `De la ${universityName}, ${modalidad}`;
    const universityTextWidth = helveticaFont.widthOfTextAtSize(universityText, 14);
    page.drawText(universityText, {
      x: (width - universityTextWidth) / 2,
      y: height - 260,
      size: 14,
      font: helveticaFont,
      color: black,
    });
    
    // Accreditation text
    const accreditationText1 = `Este Programa ha logrado la Acreditación ICACIT hasta la siguiente fecha`;
    const accreditationText2 = `de revisión que se realizará en el Ciclo de Acreditación ${accreditationDate}.`;
    
    const accreditationText1Width = helveticaFont.widthOfTextAtSize(accreditationText1, 12);
    const accreditationText2Width = helveticaFont.widthOfTextAtSize(accreditationText2, 12);
    
    page.drawText(accreditationText1, {
      x: (width - accreditationText1Width) / 2,
      y: height - 320,
      size: 12,
      font: helveticaFont,
      color: black,
    });
    
    page.drawText(accreditationText2, {
      x: (width - accreditationText2Width) / 2,
      y: height - 340,
      size: 12,
      font: helveticaFont,
      color: black,
    });
    
    // Signature section - positioned for landscape
    const signatureY = height - 450;
    const leftSignatureX = 180;
    const rightSignatureX = 580;
    
    // Load signature images if provided
    let leftSignatureImage = null;
    let rightSignatureImage = null;
    
    if (leftSignaturePath && fs.existsSync(leftSignaturePath)) {
      try {
        const leftSigBytes = fs.readFileSync(leftSignaturePath);
        leftSignatureImage = await pdfDoc.embedPng(leftSigBytes);
      } catch (error) {
        console.warn('Could not load left signature image:', error.message);
      }
    }
    
    if (rightSignaturePath && fs.existsSync(rightSignaturePath)) {
      try {
        const rightSigBytes = fs.readFileSync(rightSignaturePath);
        rightSignatureImage = await pdfDoc.embedPng(rightSigBytes);
      } catch (error) {
        console.warn('Could not load right signature image:', error.message);
      }
    }
    
    // Left signature area
    if (leftSignatureImage) {
      const sigScale = 0.5; // Adjust scale as needed
      page.drawImage(leftSignatureImage, {
        x: leftSignatureX - 50,
        y: signatureY + 10,
        width: leftSignatureImage.width * sigScale,
        height: leftSignatureImage.height * sigScale,
      });
    }
    
    // Left signature line
    page.drawLine({
      start: { x: leftSignatureX - 70, y: signatureY },
      end: { x: leftSignatureX + 70, y: signatureY },
      thickness: 1,
      color: black,
    });
    
    // Right signature area
    if (rightSignatureImage) {
      const sigScale = 0.5; // Adjust scale as needed
      page.drawImage(rightSignatureImage, {
        x: rightSignatureX - 50,
        y: signatureY + 10,
        width: rightSignatureImage.width * sigScale,
        height: rightSignatureImage.height * sigScale,
      });
    }
    
    // Right signature line
    page.drawLine({
      start: { x: rightSignatureX - 70, y: signatureY },
      end: { x: rightSignatureX + 70, y: signatureY },
      thickness: 1,
      color: black,
    });
    
    // Signature names and titles
    const presidenteNameWidth = helveticaFont.widthOfTextAtSize(presidenteName, 11);
    page.drawText(presidenteName, {
      x: leftSignatureX - (presidenteNameWidth / 2),
      y: signatureY - 20,
      size: 11,
      font: helveticaFont,
      color: black,
    });
    
    const presidenteTitleWidth = helveticaFont.widthOfTextAtSize('Presidente', 10);
    page.drawText('Presidente', {
      x: leftSignatureX - (presidenteTitleWidth / 2),
      y: signatureY - 35,
      size: 10,
      font: helveticaFont,
      color: black,
    });
    
    const consejoTitleWidth = helveticaFont.widthOfTextAtSize('Consejo Directivo', 10);
    page.drawText('Consejo Directivo', {
      x: leftSignatureX - (consejoTitleWidth / 2),
      y: signatureY - 50,
      size: 10,
      font: helveticaFont,
      color: black,
    });
    
    // Right signature
    const techPresidentNameWidth = helveticaFont.widthOfTextAtSize(technicalCommitteePresidentName, 11);
    page.drawText(technicalCommitteePresidentName, {
      x: rightSignatureX - (techPresidentNameWidth / 2),
      y: signatureY - 20,
      size: 11,
      font: helveticaFont,
      color: black,
    });
    
    const techPresidenteTitleWidth = helveticaFont.widthOfTextAtSize('Presidente', 10);
    page.drawText('Presidente', {
      x: rightSignatureX - (techPresidenteTitleWidth / 2),
      y: signatureY - 35,
      size: 10,
      font: helveticaFont,
      color: black,
    });
    
    const committeeTitleWidth = helveticaFont.widthOfTextAtSize('Comité Técnico de Acreditación de Ingeniería', 10);
    page.drawText('Comité Técnico de Acreditación de Ingeniería', {
      x: rightSignatureX - (committeeTitleWidth / 2),
      y: signatureY - 50,
      size: 10,
      font: helveticaFont,
      color: black,
    });
    
    // Add a subtle border
    page.drawRectangle({
      x: 40,
      y: 40,
      width: width - 80,
      height: height - 80,
      borderColor: lightBlue,
      borderWidth: 2,
    });
    
    // Serialize the PDF
    const pdfBytes = await pdfDoc.save();
    
    // Save to file
    fs.writeFileSync(outputPath, pdfBytes);
    
    console.log(`Certificate generated successfully: ${outputPath}`);
    return pdfBytes;
    
  } catch (error) {
    console.error('Error generating certificate:', error);
    throw error;
  }
}

// Example usage function
async function example() {
  try {
    await generateICACITCertificate({
      programName: 'INGENIERÍA MECATRÓNICA',
      universityName: 'Universidad Ricardo Palma',
      modalidad: 'modalidad presencial del campus Principal',
      accreditationDate: '2023',
      presidenteName: 'Enrique Alvarez Rodrich',
      technicalCommitteePresidentName: 'César Gallegos Chávez',
      logoPath: './public/logo-icacit.png', 
      leftSignaturePath: './public/firma1.png', 
      rightSignaturePath: './public/firma2.png', 
      outputPath: 'certificate-mecatronica-landscape.pdf'
    });
  } catch (error) {
    console.error('Failed to generate certificate:', error);
  }
}

// Export the function
module.exports = {
  generateICACITCertificate,
  example
};
