import auth from '@react-native-firebase/auth';

let _confirmation: any = null;

// Firebase orqali SMS yuborish
export async function firebaseSendOTP(phone: string): Promise<void> {
  try {
    _confirmation = await auth().signInWithPhoneNumber(phone);
  } catch (error: any) {
    console.error('Firebase SMS error:', error);
    throw new Error('SMS yuborishda xatolik: ' + error.message);
  }
}

// Firebase OTP tasdiqlash
export async function firebaseVerifyOTP(code: string): Promise<string> {
  if (!_confirmation) throw new Error('Avval SMS yuboring');
  try {
    const result = await _confirmation.confirm(code);
    // Firebase token olish
    const token = await result.user.getIdToken();
    return token;
  } catch (error: any) {
    console.error('Firebase verify error:', error);
    throw new Error('Kod noto\'g\'ri yoki muddati tugagan');
  }
}

// Firebase dan chiqish
export async function firebaseSignOut(): Promise<void> {
  await auth().signOut();
}
