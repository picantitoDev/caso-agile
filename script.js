import { generateICACITCertificate } from './utils/generadorCertificados.js';

await generateICACITCertificate({
  programName: 'INGENIERÍA MECATRÓNICA',
  universityName: 'Universidad Ricardo Palma',
  modalidad: 'modalidad presencial del campus Principal',
  accreditationDate: '2023',
  presidenteName: 'Enrique Alvarez Rodrich',
  technicalCommitteePresidentName: 'César Gallegos Chávez',
  outputPath: 'my-certificate.pdf'
});