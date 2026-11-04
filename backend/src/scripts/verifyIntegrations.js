import 'dotenv/config';
import { initFirebase, testFirebase } from '../db/firebase.js';

console.log('oauth', {
  clientId: Boolean(process.env.GOOGLE_CLIENT_ID),
  secret: Boolean(process.env.GOOGLE_CLIENT_SECRET),
  redirect: process.env.GOOGLE_REDIRECT_URI,
});
console.log('drive', {
  apiKey: Boolean(process.env.GOOGLE_DRIVE_API_KEY),
  folderId: process.env.GOOGLE_DRIVE_FOLDER_ID,
});

const init = await initFirebase();
console.log('firebase init', init);
const test = await testFirebase();
console.log('firebase test', test);

import { listDriveFolderFiles, serviceAccountEmail } from '../services/googleDrive.js';

console.log('drive sa', serviceAccountEmail());
const listed = await listDriveFolderFiles({
  folderId: process.env.GOOGLE_DRIVE_FOLDER_ID,
});
console.log('drive list', {
  source: listed.source,
  count: listed.files?.length || 0,
  error: listed.error?.message,
  hint: listed.hint,
  names: (listed.files || []).slice(0, 8).map((f) => f.name),
});
