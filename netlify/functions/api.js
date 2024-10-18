const { v4: uuidv4 } = require('uuid');

// In-memory database (replace with a proper database in production)
let patients = [];
let notes = [];

exports.handler = async (event, context) => {
  const path = event.path.replace(/^\/\.netlify\/functions\/api/, '');
  const method = event.httpMethod;

  console.log(`Received ${method} request for ${path}`);

  try {
    switch (true) {
      case method === 'GET' && path === '/patients':
        return {
          statusCode: 200,
          body: JSON.stringify(patients),
        };

      case method === 'POST' && path === '/patients':
        const newPatient = JSON.parse(event.body);
        newPatient.status = 'Active';
        patients.push(newPatient);
        return {
          statusCode: 201,
          body: JSON.stringify(newPatient),
        };

      case method === 'PUT' && path.match(/^\/patients\/[\w-]+$/):
        const updatePatientMRN = path.split('/')[2];
        const updates = JSON.parse(event.body);
        const patientToUpdateIndex = patients.findIndex(p => p.mrn === updatePatientMRN);
        if (patientToUpdateIndex !== -1) {
          patients[patientToUpdateIndex] = { ...patients[patientToUpdateIndex], ...updates };
          return {
            statusCode: 200,
            body: JSON.stringify(patients[patientToUpdateIndex]),
          };
        }
        return { statusCode: 404, body: JSON.stringify({ error: 'Patient not found' }) };

      case method === 'GET' && path.match(/^\/patients\/[\w-]+\/notes$/):
        const patientMRN = path.split('/')[2];
        const patientNotes = notes.filter(n => n.patientMrn === patientMRN);
        return {
          statusCode: 200,
          body: JSON.stringify(patientNotes),
        };

      case method === 'POST' && path === '/notes':
        const newNote = JSON.parse(event.body);
        newNote.id = uuidv4();
        notes.push(newNote);
        return {
          statusCode: 201,
          body: JSON.stringify(newNote),
        };

      case method === 'POST' && path.match(/^\/patients\/[\w-]+\/discharge$/):
        const dischargeMRN = path.split('/')[2];
        const { dischargeNotes } = JSON.parse(event.body);
        const patientIndex = patients.findIndex(p => p.mrn === dischargeMRN);
        if (patientIndex !== -1) {
          patients[patientIndex] = {
            ...patients[patientIndex],
            status: 'Discharged',
            dischargeDate: new Date().toISOString()
          };
          notes.push({
            id: uuidv4(),
            patientMrn: dischargeMRN,
            date: new Date().toISOString(),
            note: `Discharge notes: ${dischargeNotes}`,
            user: 'System'
          });
          return {
            statusCode: 200,
            body: JSON.stringify(patients[patientIndex]),
          };
        }
        return { statusCode: 404, body: JSON.stringify({ error: 'Patient not found' }) };

      case method === 'GET' && path === '/specialties':
        const specialties = [...new Set(patients.map(p => p.specialty))];
        return {
          statusCode: 200,
          body: JSON.stringify(specialties),
        };

      default:
        return { statusCode: 404, body: JSON.stringify({ error: 'Not Found' }) };
    }
  } catch (error) {
    console.error('Error in API:', error);
    return { statusCode: 500, body: JSON.stringify({ error: 'Internal Server Error' }) };
  }
};