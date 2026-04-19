import React, { useState, useRef } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  SafeAreaView, KeyboardAvoidingView, Platform, Alert, ActivityIndicator
} from 'react-native';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { C, S, R } from '../../constants/theme';
import { api } from '../../services/api';
import { useAuth } from '../../hooks/useAuth';
import { useLang } from '../../hooks/useLang';

function Logo() {
  return (
    <View style={ls.logoWrap}>
      <View style={ls.logoCircle}>
        <LinearGradient colors={['#7B2FBE','#C44AFF','#FF6B00']} start={{x:0,y:0}} end={{x:1,y:1}} style={ls.logoGrad}>
          <Text style={ls.logoP}>P</Text>
        </LinearGradient>
      </View>
      <View style={ls.titleRow}>
        <Text style={ls.titleOson}>Oson</Text>
        <Text style={ls.titlePay}>Pay</Text>
      </View>
      <Text style={ls.tagline}>Tez. Oson. Ishonchli.</Text>
    </View>
  );
}

export default function Login() {
  const { t, lang, changeLang } = useLang();
  const { login } = useAuth();
  const [step, setStep] = useState<'phone'|'otp'|'name'>('phone');
  const [phone, setPhone] = useState('998');
  const [otp, setOtp] = useState(['','','','','','']);
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const refs = useRef<any[]>([]);

  const digits = phone.replace(/\D/g,'');
  const e164 = `+${digits.startsWith('998') ? digits : '998'+digits}`;

  function dispPhone() {
    const d = digits.slice(0,12);
    if (d.length<=3) return '+'+d;
    if (d.length<=5) return `+${d.slice(0,3)} ${d.slice(3)}`;
    if (d.length<=8) return `+${d.slice(0,3)} ${d.slice(3,5)} ${d.slice(5)}`;
    if (d.length<=10) return `+${d.slice(0,3)} ${d.slice(3,5)} ${d.slice(5,8)} ${d.slice(8)}`;
    return `+${d.slice(0,3)} ${d.slice(3,5)} ${d.slice(5,8)} ${d.slice(8,10)} ${d.slice(10,12)}`;
  }

  function startTimer() {
    setCountdown(180);
    const tm = setInterval(() => setCountdown(c => { if(c<=1){clearInterval(tm);return 0;} return c-1; }), 1000);
  }

  async function sendOTP() {
    if (digits.length < 12) { Alert.alert(t('error'), t('enterPhone')); return; }
    setLoading(true);
    try {

      setStep('otp');
      startTimer();
    } catch(e:any) {
      Alert.alert(t('error'), e.message);
    } finally { setLoading(false); }
  }

  function handleOTP(v: string, i: number) {
    const n = [...otp]; n[i] = v.slice(-1); setOtp(n);
    if (v && i<5) refs.current[i+1]?.focus();
    if (n.join('').length === 6) setTimeout(() => verifyOTP(n.join('')), 200);
  }

  async function verifyOTP(code: string) {
    setLoading(true);
    try {

      if (res.isNewUser && !name) {
        setLoading(false);
        setStep('name');
        return;
      }

      await login(res.token, res.user, res.hasPin);
      if (res.hasPin) router.replace('/(auth)/pin-lock');
      else router.replace('/(auth)/create-pin');
    } catch(e:any) {
      Alert.alert(t('error'), e.message);
      setOtp(['','','','','','']);
      refs.current[0]?.focus();
    } finally { setLoading(false); }
  }

  async function submitName() {
    if (!name.trim()) return;
    setLoading(true);
    try {

      await login(res.token, res.user, res.hasPin);
      router.replace('/(auth)/create-pin');
    } catch(e:any) {
      Alert.alert(t('error'), e.message);
    } finally { setLoading(false); }
  }

  return (
    <SafeAreaView style={ls.root}>
      <KeyboardAvoidingView behavior={Platform.OS==='ios'?'padding':'height'} style={{flex:1}}>
        {/* Til tanlash */}
        <View style={ls.langRow}>
          <TouchableOpacity style={[ls.langBtn, lang==='uz'&&ls.langActive]} onPress={()=>changeLang('uz')}>
            <Text style={[ls.langTxt, lang==='uz'&&ls.langActiveTxt]}>🇺🇿 UZ</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[ls.langBtn, lang==='ru'&&ls.langActive]} onPress={()=>changeLang('ru')}>
            <Text style={[ls.langTxt, lang==='ru'&&ls.langActiveTxt]}>🇷🇺 RU</Text>
          </TouchableOpacity>
        </View>

        <View style={ls.inner}>
          <Logo />

          {/* Telefon */}
          {step==='phone' && (
            <View style={ls.form}>
              <Text style={ls.h1}>{t('enterPhone')}</Text>
              <View style={ls.phoneBox}>
                <Text style={{fontSize:22}}>🇺🇿</Text>
                <TextInput
                  style={ls.phoneField}
                  value={dispPhone()}
                  onChangeText={t=>setPhone(t.replace(/\D/g,''))}
                  keyboardType="phone-pad"
                  placeholder="+998"
                  placeholderTextColor={C.t3}
                  maxLength={17}
                />
              </View>
              <TouchableOpacity
                onPress={sendOTP}
                disabled={loading||digits.length<12}
                style={[ls.btnWrap, digits.length<12&&{opacity:0.4}]}
              >
                <LinearGradient colors={C.gBrand} start={{x:0,y:0}} end={{x:1,y:0}} style={ls.btn}>
                  {loading ? <ActivityIndicator color="#FFF"/> : <Text style={ls.btnTxt}>{t('continue')} →</Text>}
                </LinearGradient>
              </TouchableOpacity>
            </View>
          )}

          {/* OTP */}
          {step==='otp' && (
            <View style={ls.form}>
              <Text style={ls.h1}>{t('enterCode')}</Text>
              <Text style={ls.sub}>
                <Text style={{color:C.orange}}>{dispPhone()}</Text> {t('codeSent')}
              </Text>
              <View style={ls.otpRow}>
                {otp.map((d,i)=>(
                  <TextInput
                    key={i}
                    ref={r=>{refs.current[i]=r;}}
                    style={[ls.otpBox, d&&ls.otpActive]}
                    value={d}
                    onChangeText={v=>handleOTP(v,i)}
                    onKeyPress={({nativeEvent})=>{
                      if(nativeEvent.key==='Backspace'&&!otp[i]&&i>0){
                        const n=[...otp];n[i-1]='';setOtp(n);refs.current[i-1]?.focus();
                      }
                    }}
                    keyboardType="numeric" maxLength={1} textAlign="center"
                  />
                ))}
              </View>
              {loading && <ActivityIndicator color={C.primary}/>}
              <View style={ls.otpFoot}>
                <TouchableOpacity onPress={()=>{setStep('phone');setOtp(['','','','','','']);}}>
                  <Text style={{color:C.t3,fontSize:13}}>{t('changePhone')}</Text>
                </TouchableOpacity>
                {countdown>0
                  ? <Text style={{color:C.t2,fontSize:13}}>{Math.floor(countdown/60)}:{String(countdown%60).padStart(2,'0')}</Text>
                  : <TouchableOpacity onPress={sendOTP}><Text style={{color:C.orange,fontSize:13,fontWeight:'600'}}>{t('resend')}</Text></TouchableOpacity>
                }
              </View>
            </View>
          )}

          {/* Ism */}
          {step==='name' && (
            <View style={ls.form}>
              <Text style={ls.h1}>{t('enterName')}</Text>
              <Text style={ls.sub}>Birinchi marta kiryapsiz</Text>
              <TextInput
                style={ls.nameInput}
                value={name}
                onChangeText={setName}
                placeholder={t('namePlaceholder')}
                placeholderTextColor={C.t3}
                autoCapitalize="words"
                autoFocus
              />
              <TouchableOpacity
                onPress={submitName}
                disabled={loading||!name.trim()}
                style={[ls.btnWrap, !name.trim()&&{opacity:0.4}]}
              >
                <LinearGradient colors={C.gBrand} start={{x:0,y:0}} end={{x:1,y:0}} style={ls.btn}>
                  {loading ? <ActivityIndicator color="#FFF"/> : <Text style={ls.btnTxt}>{t('start')}</Text>}
                </LinearGradient>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const ls = StyleSheet.create({
  root: {flex:1, backgroundColor:C.bg},
  langRow: {flexDirection:'row', justifyContent:'flex-end', padding:S.md, gap:S.sm},
  langBtn: {paddingHorizontal:14, paddingVertical:6, borderRadius:R.full, backgroundColor:C.elevated, borderWidth:1, borderColor:C.border},
  langActive: {backgroundColor:C.primaryBg, borderColor:C.primary},
  langTxt: {color:C.t2, fontSize:13, fontWeight:'600'},
  langActiveTxt: {color:C.primaryLight},
  inner: {flex:1, paddingHorizontal:S.lg, justifyContent:'center', gap:28},
  logoWrap: {alignItems:'center', gap:S.sm},
  logoCircle: {width:100, height:100, borderRadius:50, overflow:'hidden'},
  logoGrad: {width:100, height:100, alignItems:'center', justifyContent:'center'},
  logoP: {fontSize:52, fontWeight:'900', color:'#FFB347'},
  titleRow: {flexDirection:'row', gap:5},
  titleOson: {fontSize:32, fontWeight:'900', color:'#FFF'},
  titlePay: {fontSize:32, fontWeight:'900', color:C.orange},
  tagline: {fontSize:13, color:C.t3, letterSpacing:0.5},
  form: {gap:14},
  h1: {fontSize:22, fontWeight:'800', color:C.t1},
  sub: {fontSize:14, color:C.t2, lineHeight:20},
  phoneBox: {flexDirection:'row', alignItems:'center', gap:10, backgroundColor:C.elevated, borderRadius:R.lg, borderWidth:1.5, borderColor:C.border, paddingHorizontal:S.md, height:58},
  phoneField: {flex:1, fontSize:18, fontWeight:'600', color:C.t1, letterSpacing:0.5},
  btnWrap: {borderRadius:R.xl, overflow:'hidden'},
  btn: {height:58, alignItems:'center', justifyContent:'center'},
  btnTxt: {fontSize:17, fontWeight:'800', color:'#FFF'},
  otpRow: {flexDirection:'row', gap:8},
  otpBox: {flex:1, height:62, borderRadius:R.md, backgroundColor:C.elevated, borderWidth:1.5, borderColor:C.border, fontSize:28, fontWeight:'900', color:C.t1},
  otpActive: {borderColor:C.primary, backgroundColor:C.primaryBg},
  otpFoot: {flexDirection:'row', justifyContent:'space-between', alignItems:'center'},
  nameInput: {backgroundColor:C.elevated, borderRadius:R.lg, borderWidth:1.5, borderColor:C.border, paddingHorizontal:S.md, height:58, fontSize:18, color:C.t1},
});
