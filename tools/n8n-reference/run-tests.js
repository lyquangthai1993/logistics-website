const testCases = [
  {
    name: 'Case 4 - Nam Hoang',
    payload: {
      first_name: 'Nam',
      last_name: 'Hoang',
      email: 'nam.hoang@vietnamcorp.vn',
      phone: '+84903112233',
      preferred_visit_type: 'In-Person',
      preferred_visit_date: '2026-10-20',
      preferred_time: '10:30',
      num_visitors: 2,
      how_did_you_hear: ['Social Media', 'Friend Recommendation'],
      child_first_name: 'Minh',
      child_last_name: 'Hoang',
      child_date_of_birth: '2023-05-10',
      child_gender: 'Male',
      child_nationality: 'Vietnamese',
      cf_turnstile_response: 'test'
    }
  },
  {
    name: 'Case 5 - Sarah Jenkins',
    payload: {
      first_name: 'Sarah',
      last_name: 'Jenkins',
      email: 's.jenkins@internationalllc.com',
      phone: '+84945678901',
      preferred_visit_type: 'In-Person',
      preferred_visit_date: '2026-10-22',
      preferred_time: '14:30',
      num_visitors: 3,
      how_did_you_hear: ['Expat Forum', 'Google Search'],
      child_first_name: 'Oliver',
      child_last_name: 'Jenkins',
      child_date_of_birth: '2012-04-18',
      child_gender: 'Male',
      child_nationality: 'Australian',
      cf_turnstile_response: 'test'
    }
  },
  {
    name: 'Case 6 - Lan Le',
    payload: {
      first_name: 'Lan',
      last_name: 'Le',
      email: 'lelan.finance@gmail.com',
      phone: '+84977889900',
      preferred_visit_type: 'In-Person',
      preferred_visit_date: '2026-10-26',
      preferred_time: '09:00',
      num_visitors: 2,
      how_did_you_hear: ['Website', 'School Event'],
      child_first_name: 'Ha My',
      child_last_name: 'Le',
      child_date_of_birth: '2019-11-25',
      child_gender: 'Female',
      child_nationality: 'Vietnamese',
      cf_turnstile_response: 'test'
    }
  }
];

async function submitCase(tc) {
  console.log(`\nSubmitting ${tc.name}...`);
  try {
    const res = await fetch('http://localhost:1337/api/book-a-visits/submit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(tc.payload)
    });
    const data = await res.json();
    console.log(`Response status: ${res.status}`, data);
  } catch (err) {
    console.error(`Error submitting ${tc.name}:`, err.message);
  }
}

async function run() {
  for (const tc of testCases) {
    await submitCase(tc);
    console.log('Waiting 6 seconds before next submission...');
    await new Promise(r => setTimeout(r, 6000));
  }
  console.log('All 3 cases submitted! Waiting 12 seconds for n8n processing...');
  await new Promise(r => setTimeout(r, 12000));
  console.log('Done!');
}

run();
