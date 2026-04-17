// modals/kyc.tsx
import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, SafeAreaView, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { C, S, R } from '../../constants/theme';
import { api } from '../../services/api';
import { useLang } from '../../hooks/useLang';

export default function KYC() {
  const { t } = useLang();
  const [series, setSeries] = useState('');
  const [number, setNumber] = useState('');
  const [birth, setBirth] = useState('');
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    api.getKYC().then(r => {
      if (r.kyc) {
        setSeries(r.kyc.passport_series||'');
        setNumber(r.kyc.passport_number||'');
        setBirth(r.kyc.birth_date||'');
        setFullName(r.kyc.full_name||'');
      }
    }).catch(()=>{});
  }, []);

  async function save() {
    if (!series||!number||!birth||!fullName) { Alert.alert(t('error'), "Barcha maydonlarni to'ldiring"); return; }
    setLoading(true);
    try {
      await api.submitKYC({ passportSeries: series, passportNumber: number, birthDate: birth, fullName });
      Alert.alert('✅', t('success'), [{text:t('ok'),onPress:()=>router.back()}]);
    } catch(e:any) { Alert.alert(t('error'),e.message); }
    finally { setLoading(false); }
  }

  return (
    <SafeAreaView style={s.root}>
      <View style={s.header}>
        <TouchableOpacity onPress={()=>router.back()}><Text style={s.close}>✕</Text></TouchableOpacity>
        <Text style={s.title}>{t('passport')}</Text>
        <View style={{width:36}}/>
      </View>
      <ScrollView contentContainerStyle={s.content}>
        <View style={s.infoBox}>
          <Text style={s.infoTxt}>🪪 Ma'lumotlaringiz xavfsiz saqlanadi</Text>
        </View>
        {[
          {label:t('passportSeries'),val:series,set:setSeries,ph:'AA',caps:true},
          {label:t('passportNumber'),val:number,set:setNumber,ph:'1234567',kbt:'numeric' as any},
          {label:t('birthDate'),val:birth,set:setBirth,ph:'DD.MM.YYYY'},
          {label:t('fullName'),val:fullName,set:setFullName,ph:t('namePlaceholder'),caps:true},
        ].map((f,i)=>(
          <View key={i}>
            <Text style={s.label}>{f.label}</Text>
            <TextInput style={s.input} value={f.val} onChangeText={f.set} placeholder={f.ph} placeholderTextColor={C.t3} keyboardType={f.kbt||'default'} autoCapitalize={f.caps?'characters':'none'}/>
          </View>
        ))}
        <TouchableOpacity onPress={save} disabled={loading} style={s.btnWrap}>
          <LinearGradient colors={C.gBrand} start={{x:0,y:0}} end={{x:1,y:0}} style={s.btn}>
            {loading?<ActivityIndicator color="#FFF"/>:<Text style={s.btnTxt}>{t('save')}</Text>}
          </LinearGradient>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  root:{flex:1,backgroundColor:C.bg},
  header:{flexDirection:'row',justifyContent:'space-between',alignItems:'center',paddingHorizontal:S.lg,paddingVertical:S.md,borderBottomWidth:0.5,borderBottomColor:C.border},
  close:{fontSize:20,color:C.t2,width:36,textAlign:'center'},
  title:{fontSize:17,fontWeight:'700',color:C.t1},
  content:{padding:S.lg,gap:S.md,paddingBottom:40},
  infoBox:{backgroundColor:C.successBg,borderRadius:R.lg,padding:S.md,borderWidth:1,borderColor:C.successBorder},
  infoTxt:{fontSize:13,color:C.success},
  label:{fontSize:12,color:C.t3,fontWeight:'600',letterSpacing:0.8,textTransform:'uppercase',marginBottom:6},
  input:{backgroundColor:C.elevated,borderRadius:R.lg,borderWidth:1.5,borderColor:C.border,paddingHorizontal:S.md,height:54,fontSize:16,color:C.t1},
  btnWrap:{borderRadius:R.xl,overflow:'hidden',marginTop:S.sm},
  btn:{height:58,alignItems:'center',justifyContent:'center'},
  btnTxt:{fontSize:17,fontWeight:'800',color:'#FFF'},
});
