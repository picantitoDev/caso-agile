const { PDFDocument, rgb, StandardFonts } = require('pdf-lib');
const fs = require('fs');

async function generateICACITCertificate({
  programName = 'INGENIERÍA MECATRÓNICA',
  universityName = 'Universidad Ricardo Palma',
  modalidad = 'modalidad presencial del campus Principal',
  accreditationDate = '2023',
  presidenteName = 'Enrique Alvarez Rodrich',
  technicalCommitteePresidentName = 'César Gallegos Chávez',
  outputPath = 'icacit-certificate.pdf'
} = {}) {
  
  try {
    // Create a new PDF document
    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage([595.28, 841.89]); // A4 size
    
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
    
    // Draw ICACIT logo area (simplified geometric representation)
    // Main circle
    page.drawCircle({
      x: 150,
      y: height - 80,
      size: 25,
      color: darkBlue,
    });
    
    // Secondary circles for logo effect
    page.drawCircle({
      x: 140,
      y: height - 75,
      size: 15,
      color: lightBlue,
    });
    
    page.drawCircle({
      x: 160,
      y: height - 85,
      size: 12,
      color: lightBlue,
    });
    
    // Draw "ICACIT" text
    page.drawText('ICACIT', {
      x: 200,
      y: height - 90,
      size: 32,
      font: helveticaBoldFont,
      color: darkBlue,
    });
    
    // Main header text
    const headerText1 = 'El Comité Técnico de Acreditación de Ingeniería (CTAI) del Instituto de Calidad y Acreditación de Programas de';
    const headerText2 = 'Computación, Ingeniería y Tecnología – ICACIT ha completado la evaluación del Programa en:';
    
    page.drawText(headerText1, {
      x: 50,
      y: height - 140,
      size: 11,
      font: helveticaFont,
      color: black,
      maxWidth: width - 100,
    });
    
    page.drawText(headerText2, {
      x: 50,
      y: height - 158,
      size: 11,
      font: helveticaFont,
      color: black,
      maxWidth: width - 100,
    });
    
    // Program name (large, bold, centered)
    const programNameWidth = timesRomanBoldFont.widthOfTextAtSize(programName, 24);
    page.drawText(programName, {
      x: (width - programNameWidth) / 2,
      y: height - 220,
      size: 24,
      font: timesRomanBoldFont,
      color: black,
    });
    
    // University information
    const universityText = `De la ${universityName}, ${modalidad}`;
    const universityTextWidth = helveticaFont.widthOfTextAtSize(universityText, 12);
    page.drawText(universityText, {
      x: (width - universityTextWidth) / 2,
      y: height - 260,
      size: 12,
      font: helveticaFont,
      color: black,
    });
    
    // Accreditation text
    const accreditationText1 = `Este Programa ha logrado la Acreditación ICACIT hasta la siguiente fecha`;
    const accreditationText2 = `de revisión que se realizará en el Ciclo de Acreditación ${accreditationDate}.`;
    
    const accreditationText1Width = helveticaFont.widthOfTextAtSize(accreditationText1, 11);
    const accreditationText2Width = helveticaFont.widthOfTextAtSize(accreditationText2, 11);
    
    page.drawText(accreditationText1, {
      x: (width - accreditationText1Width) / 2,
      y: height - 320,
      size: 11,
      font: helveticaFont,
      color: black,
    });
    
    page.drawText(accreditationText2, {
      x: (width - accreditationText2Width) / 2,
      y: height - 338,
      size: 11,
      font: helveticaFont,
      color: black,
    });
    
    // Signature lines
    const signatureY = height - 450;
    const leftSignatureX = 120;
    const rightSignatureX = 400;
    
    // Left signature line
    page.drawLine({
      start: { x: leftSignatureX - 50, y: signatureY },
      end: { x: leftSignatureX + 100, y: signatureY },
      thickness: 1,
      color: black,
    });
    
    // Right signature line
    page.drawLine({
      start: { x: rightSignatureX - 50, y: signatureY },
      end: { x: rightSignatureX + 100, y: signatureY },
      thickness: 1,
      color: black,
    });
    
    // Signature names and titles
    const presidenteNameWidth = helveticaFont.widthOfTextAtSize(presidenteName, 10);
    page.drawText(presidenteName, {
      x: leftSignatureX + 25 - (presidenteNameWidth / 2),
      y: signatureY - 20,
      size: 10,
      font: helveticaFont,
      color: black,
    });
    
    const presidenteTitleWidth = helveticaFont.widthOfTextAtSize('Presidente', 9);
    page.drawText('Presidente', {
      x: leftSignatureX + 25 - (presidenteTitleWidth / 2),
      y: signatureY - 35,
      size: 9,
      font: helveticaFont,
      color: black,
    });
    
    const consejoTitleWidth = helveticaFont.widthOfTextAtSize('Consejo Directivo', 9);
    page.drawText('Consejo Directivo', {
      x: leftSignatureX + 25 - (consejoTitleWidth / 2),
      y: signatureY - 48,
      size: 9,
      font: helveticaFont,
      color: black,
    });
    
    // Right signature
    const techPresidentNameWidth = helveticaFont.widthOfTextAtSize(technicalCommitteePresidentName, 10);
    page.drawText(technicalCommitteePresidentName, {
      x: rightSignatureX + 25 - (techPresidentNameWidth / 2),
      y: signatureY - 20,
      size: 10,
      font: helveticaFont,
      color: black,
    });
    
    const techPresidenteTitleWidth = helveticaFont.widthOfTextAtSize('Presidente', 9);
    page.drawText('Presidente', {
      x: rightSignatureX + 25 - (techPresidenteTitleWidth / 2),
      y: signatureY - 35,
      size: 9,
      font: helveticaFont,
      color: black,
    });
    
    const committeeTitleWidth = helveticaFont.widthOfTextAtSize('Comité Técnico de Acreditación de Ingeniería', 9);
    page.drawText('Comité Técnico de Acreditación de Ingeniería', {
      x: rightSignatureX + 25 - (committeeTitleWidth / 2),
      y: signatureY - 48,
      size: 9,
      font: helveticaFont,
      color: black,
    });
    
    // Add a subtle border
    page.drawRectangle({
      x: 30,
      y: 30,
      width: width - 60,
      height: height - 60,
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
      outputPath: 'certificate-mecatronica.pdf'
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
