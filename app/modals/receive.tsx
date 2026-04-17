import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView, Share, Alert } from 'react-native';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { C, S, R, formatPhone } from '../../constants/theme';
import { useAuth } from '../../hooks/useAuth';
import { useLang } from '../../hooks/useLang';

export default function Receive() {
  const { user } = useAuth();
  const { t } = useLang();

  return (
    <SafeAreaView style={s.root}>
      <View style={s.header}>
        <TouchableOpacity onPress={()=>router.back()}><Text style={s.close}>✕</Text></TouchableOpacity>
        <Text style={s.title}>{t('receive')}</Text>
        <TouchableOpacity onPress={()=>Share.share({message:`Oson Pay: ${user?.phone}`})}><Text style={{color:C.orange,fontWeight:'700',fontSize:14}}>Ulashish</Text></TouchableOpacity>
      </View>
      <View style={s.content}>
        <LinearGradient colors={C.gCard1} start={{x:0,y:0}} end={{x:1,y:1}} style={s.card}>
          <View style={s.avatar}><Text style={s.avatarTxt}>{user?.fullName?.charAt(0)||'U'}</Text></View>
          <Text style={s.name}>{user?.fullName}</Text>
          <Text style={s.phone}>{user?.phone?formatPhone(user.phone):''}</Text>
          <View style={s.qrBox}>
            <View style={s.qrGrid}>
              {Array.from({length:49}).map((_,i)=>(
                <View key={i} style={[s.qrCell,((i*7+Math.floor(i/7)*3+i)%4===0)&&s.qrFilled]}/>
              ))}
            </View>
          </View>
          <Text style={s.qrHint}>QR kodni skanerlang</Text>
        </LinearGradient>
        <View style={s.infoBox}>
          <View style={s.infoRow}>
            <View>
              <Text style={s.infoLabel}>Telefon raqami</Text>
              <Text style={s.infoVal}>{user?.phone?formatPhone(user.phone):''}</Text>
            </View>
            <TouchableOpacity style={s.copyBtn} onPress={()=>Alert.alert('Nusxalandi',user?.phone||'')}>
              <Text style={s.copyTxt}>Nusxa</Text>
            </TouchableOpacity>
          </View>
        </View>
        <TouchableOpacity style={s.shareBtn} onPress={()=>Share.share({message:`Oson Pay orqali menga pul yuboring!\nTelefon: ${user?.phone}`})}>
          <LinearGradient colors={C.gBrand} start={{x:0,y:0}} end={{x:1,y:0}} style={s.shareBtnGrad}>
            <Text style={s.shareBtnTxt}>📤 Ulashish</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  root:{flex:1,backgroundColor:C.bg},
  header:{flexDirection:'row',justifyContent:'space-between',alignItems:'center',paddingHorizontal:S.lg,paddingVertical:S.md,borderBottomWidth:0.5,borderBottomColor:C.border},
  close:{fontSize:20,color:C.t2,width:36,textAlign:'center'},
  title:{fontSize:17,fontWeight:'700',color:C.t1},
  content:{flex:1,padding:S.lg,gap:S.md},
  card:{borderRadius:R.xxl,padding:S.xl,alignItems:'center',gap:S.md},
  avatar:{width:70,height:70,borderRadius:35,backgroundColor:'rgba(255,255,255,0.25)',alignItems:'center',justifyContent:'center'},
  avatarTxt:{fontSize:30,fontWeight:'900',color:'#FFF'},
  name:{fontSize:20,fontWeight:'800',color:'#FFF'},
  phone:{fontSize:14,color:'rgba(255,255,255,0.7)'},
  qrBox:{backgroundColor:'#FFF',borderRadius:R.lg,padding:16},
  qrGrid:{width:168,height:168,flexDirection:'row',flexWrap:'wrap',gap:2},
  qrCell:{width:22,height:22,borderRadius:2,backgroundColor:'#EEE'},
  qrFilled:{backgroundColor:'#111'},
  qrHint:{fontSize:12,color:'rgba(255,255,255,0.6)'},
  infoBox:{backgroundColor:C.elevated,borderRadius:R.lg,borderWidth:1,borderColor:C.border},
  infoRow:{flexDirection:'row',justifyContent:'space-between',alignItems:'center',padding:S.md},
  infoLabel:{fontSize:11,color:C.t3,marginBottom:3},
  infoVal:{fontSize:15,fontWeight:'600',color:C.t1},
  copyBtn:{backgroundColor:C.primaryBg,paddingHorizontal:14,paddingVertical:6,borderRadius:R.full,borderWidth:1,borderColor:C.primaryBorder},
  copyTxt:{color:C.primaryLight,fontSize:12,fontWeight:'700'},
  shareBtn:{borderRadius:R.xl,overflow:'hidden'},
  shareBtnGrad:{height:58,alignItems:'center',justifyContent:'center'},
  shareBtnTxt:{color:'#FFF',fontWeight:'800',fontSize:16},
});
