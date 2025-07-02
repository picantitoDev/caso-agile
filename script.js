import { generateICACITCertificate } from './utils/generadorCertificados.js';

await  generateICACITCertificate({
      programName: 'INGENIERÍA MECATRÓNICA',
      universityName: 'Universidad Ricardo Palma',
      modalidad: 'modalidad presencial del campus Principal',
      accreditationDate: '2023',
      presidenteName: 'Enrique Alvarez Rodrich',
      technicalCommitteePresidentName: 'César Gallegos Chávez',
      logoPath: './public/logo-icacit.png', // Optional: provide your logo path
      leftSignaturePath: './public/firma1.png', // Optional: left signature
      rightSignaturePath: './public/firma2.png', // Optional: right signature
      outputPath: 'certificate-mecatronica-landscape.pdf'
    });