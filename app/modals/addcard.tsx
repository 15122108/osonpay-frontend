import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, SafeAreaView, ScrollView, Alert, ActivityIndicator, KeyboardAvoidingView, Platform } from 'react-native';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { C, S, R } from '../../constants/theme';
import { api } from '../../services/api';
import { useLang } from '../../hooks/useLang';

const TYPES = [
  {id:'uzcard',label:'UzCard',grad:['#7B2FBE','#FF6B00'] as [string,string]},
  {id:'humo',label:'Humo',grad:['#00C896','#0099AA'] as [string,string]},
  {id:'visa',label:'Visa',grad:['#1A1A2E','#4040CC'] as [string,string]},
  {id:'mastercard',label:'MC',grad:['#FF3B5C','#FF8C00'] as [string,string]},
];

export default function AddCard() {
  const { t } = useLang();
  const [num, setNum] = useState('');
  const [holder, setHolder] = useState('');
  const [expiry, setExpiry] = useState('');
  const [type, setType] = useState('uzcard');
  const [loading, setLoading] = useState(false);

  function fmtNum(v:string) { const d=v.replace(/\D/g,'').slice(0,16); return d.replace(/(.{4})/g,'$1 ').trim(); }
  function fmtExp(v:string) { const d=v.replace(/\D/g,'').slice(0,4); return d.length>=3?d.slice(0,2)+'/'+d.slice(2):d; }

  const sel = TYPES.find(t=>t.id===type)!;

  async function add() {
    const rn=num.replace(/\s/g,'');
    if(rn.length!==16){Alert.alert(t('error'),'16 ta raqam');return;}
    if(!holder.trim()){Alert.alert(t('error'),'Ism kiriting');return;}
    if(expiry.length<5){Alert.alert(t('error'),'Muddatni kiriting');return;}
    const [m,y]=expiry.split('/');
    setLoading(true);
    try {
      await api.addCard({cardNumber:rn,cardHolder:holder.toUpperCase(),expiryMonth:m,expiryYear:'20'+y,cardType:type});
      Alert.alert('✅','Karta qo\'shildi!',[{text:t('ok'),onPress:()=>router.back()}]);
    } catch(e:any){Alert.alert(t('error'),e.message);}
    finally{setLoading(false);}
  }

  return (
    <SafeAreaView style={s.root}>
      <KeyboardAvoidingView behavior={Platform.OS==='ios'?'padding':'height'} style={{flex:1}}>
        <View style={s.header}>
          <TouchableOpacity onPress={()=>router.back()}><Text style={s.close}>✕</Text></TouchableOpacity>
          <Text style={s.title}>{t('addCard')}</Text>
          <View style={{width:36}}/>
        </View>
        <ScrollView contentContainerStyle={s.content} keyboardShouldPersistTaps="handled">
          <LinearGradient colors={sel.grad} start={{x:0,y:0}} end={{x:1,y:1}} style={s.preview}>
            <View style={{flexDirection:'row',justifyContent:'space-between'}}>
              <View/>
              <Text style={s.previewType}>{sel.label.toUpperCase()}</Text>
            </View>
            <Text style={s.previewNum}>{num||'•••• •••• •••• ••••'}</Text>
            <View style={{flexDirection:'row',justifyContent:'space-between'}}>
              <Text style={s.previewHolder}>{holder||'ISM FAMILIYA'}</Text>
              <Text style={s.previewExp}>{expiry||'MM/YY'}</Text>
            </View>
            <View style={[s.deco,{width:180,height:180,top:-60,right:-40}]}/>
          </LinearGradient>
          <Text style={s.label}>Karta turi</Text>
          <View style={s.typeRow}>
            {TYPES.map(tp=>(
              <TouchableOpacity key={tp.id} style={[s.typeBtn,type===tp.id&&s.typeBtnActive]} onPress={()=>setType(tp.id)}>
                <LinearGradient colors={tp.grad} style={s.typeDot}/>
                <Text style={[s.typeTxt,type===tp.id&&{color:C.t1}]}>{tp.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
          {[
            {label:'Karta raqami',val:fmtNum(num),set:(v:string)=>setNum(v.replace(/\D/g,'')),ph:'0000 0000 0000 0000',kbt:'numeric' as any,max:19},
            {label:'Karta egasi',val:holder,set:setHolder,ph:'ISM FAMILIYA',caps:'characters' as any},
            {label:'Muddat',val:expiry,set:(v:string)=>setExpiry(fmtExp(v)),ph:'MM/YY',kbt:'numeric' as any,max:5},
          ].map((f,i)=>(
            <View key={i}>
              <Text style={s.label}>{f.label}</Text>
              <TextInput style={s.input} value={f.val} onChangeText={f.set} placeholder={f.ph} placeholderTextColor={C.t3} keyboardType={f.kbt||'default'} autoCapitalize={f.caps||'none'} maxLength={f.max}/>
            </View>
          ))}
          <TouchableOpacity onPress={add} disabled={loading} style={[s.btnWrap,loading&&{opacity:0.6}]}>
            <LinearGradient colors={C.gBrand} start={{x:0,y:0}} end={{x:1,y:0}} style={s.btn}>
              {loading?<ActivityIndicator color="#FFF"/>:<Text style={s.btnTxt}>{t('addCard')}</Text>}
            </LinearGradient>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  root:{flex:1,backgroundColor:C.bg},
  header:{flexDirection:'row',justifyContent:'space-between',alignItems:'center',paddingHorizontal:S.lg,paddingVertical:S.md,borderBottomWidth:0.5,borderBottomColor:C.border},
  close:{fontSize:20,color:C.t2,width:36,textAlign:'center'},
  title:{fontSize:17,fontWeight:'700',color:C.t1},
  content:{padding:S.lg,gap:S.md,paddingBottom:40},
  preview:{borderRadius:R.xxl,padding:S.lg,height:180,justifyContent:'space-between',overflow:'hidden'},
  previewType:{color:'rgba(255,255,255,0.8)',fontWeight:'800',fontSize:12,letterSpacing:2},
  previewNum:{color:'#FFF',fontSize:18,fontWeight:'700',letterSpacing:2},
  previewHolder:{color:'rgba(255,255,255,0.7)',fontSize:12,letterSpacing:1},
  previewExp:{color:'rgba(255,255,255,0.7)',fontSize:12},
  deco:{position:'absolute',borderRadius:9999,backgroundColor:'rgba(255,255,255,0.06)'},
  label:{fontSize:12,color:C.t3,fontWeight:'600',letterSpacing:0.8,textTransform:'uppercase'},
  typeRow:{flexDirection:'row',gap:S.sm},
  typeBtn:{flex:1,flexDirection:'row',alignItems:'center',gap:6,backgroundColor:C.elevated,borderRadius:R.md,padding:S.sm,borderWidth:1,borderColor:C.border,justifyContent:'center'},
  typeBtnActive:{borderColor:C.primary,backgroundColor:C.primaryBg},
  typeDot:{width:14,height:14,borderRadius:7},
  typeTxt:{fontSize:12,color:C.t3,fontWeight:'600'},
  input:{backgroundColor:C.elevated,borderRadius:R.lg,borderWidth:1.5,borderColor:C.border,paddingHorizontal:S.md,height:54,fontSize:16,color:C.t1,letterSpacing:0.5},
  btnWrap:{borderRadius:R.xl,overflow:'hidden',marginTop:S.sm},
  btn:{height:58,alignItems:'center',justifyContent:'center'},
  btnTxt:{fontSize:17,fontWeight:'800',color:'#FFF'},
});
