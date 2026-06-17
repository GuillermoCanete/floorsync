import { initializeApp } from 'firebase/app';
import { getFirestore, doc, updateDoc, getDoc } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyAdb0rHpPkUDHgjk5naHOwni2fIsmDnZa0",
  authDomain: "floorsync-mfg-2026.firebaseapp.com",
  projectId: "floorsync-mfg-2026",
  storageBucket: "floorsync-mfg-2026.firebasestorage.app",
  messagingSenderId: "913611108187",
  appId: "1:913611108187:web:21faff389885f29fcdb47e"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function runTest() {
  const docRef = doc(db, 'workPositions', '01xTAdXnotUeEGLqfch0');
  console.log('Writing small pdfUrl...');
  try {
    await updateDoc(docRef, {
      pdfName: 'test_small.pdf',
      pdfUrl: 'data:application/pdf;base64,JVBERi0xLjQKJcFSnaerCg==' // Very short base64
    });
    console.log('SUCCESS! Small pdfUrl written.');
    
    const snap = await getDoc(docRef);
    console.log('Document fields:', snap.data());

    console.log('Writing large pdfUrl (exceeding 1MB)...');
    const largeBase64 = 'data:application/pdf;base64,' + 'A'.repeat(1024 * 1024 * 1.5); // ~1.5MB
    await updateDoc(docRef, {
      pdfName: 'test_large.pdf',
      pdfUrl: largeBase64
    });
    console.log('SUCCESS! Large pdfUrl written.');
  } catch (err) {
    console.error('ERROR OCCURRED:', err);
  }
}

runTest();
