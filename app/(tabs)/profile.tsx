import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, SafeAreaView, Alert, Switch } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import * as LocalAuthentication from 'expo-local-authentication';
import { C, S, R } from '../../constants/theme';
import { useAuth } from '../../hooks/useAuth';
import { useLang } from '../../hooks/useLang';
import { api } from '../../services/api';

export default function Profile() {
  const { user, logout } = useAuth();
  const { t, lang, changeLang } = useLang();
  const [notif, setNotif] = useState(true);
  const [bio, setBio] = useState(false);

  async function toggleBio(v: boolean) {
    if (v) {
      const r = await LocalAuthentication.authenticateAsync({ promptMessage: 'Biometrikani yoqish' });
      if (r.success) setBio(true);
    } else setBio(false);
  }

  function handleLangChange(l: 'uz'|'ru') {
    changeLang(l);
    api.setLanguage(l).catch(()=>{});
  }

  function handleLogout() {
    Alert.alert(t('logout'), t('logoutConfirm'), [
      { text: t('cancel'), style: 'cancel' },
      { text: t('logout'), style: 'destructive', onPress: async () => { await logout(); router.replace('/(auth)/login'); } }
    ]);
  }

  return (
    <SafeAreaView style={s.root}>
      <ScrollView contentContainerStyle={{paddingBottom:100}} showsVerticalScrollIndicator={false}>
        <View style={s.header}><Text style={s.title}>{t('profile')}</Text></View>

        {/* Profile card */}
        <LinearGradient colors={C.gCard1} start={{x:0,y:0}} end={{x:1,y:1}} style={s.profileCard}>
          <View style={s.avatarWrap}>
            <View style={s.avatar}>
              <Text style={s.avatarTxt}>{user?.fullName?.charAt(0)?.toUpperCase()||'U'}</Text>
            </View>
          </View>
          <Text style={s.pName}>{user?.fullName||'Foydalanuvchi'}</Text>
          <Text style={s.pPhone}>{user?.phone}</Text>
          <View style={s.verifiedRow}><Text style={s.verifiedTxt}>✅ Tasdiqlangan hisob</Text></View>
          <View style={[s.deco,{width:200,height:200,top:-60,right:-50}]}/>
        </LinearGradient>

        {/* Language */}
        <Section title={t('language')}>
          <View style={s.langRow}>
            <TouchableOpacity style={[s.langBtn, lang==='uz'&&s.langActive]} onPress={()=>handleLangChange('uz')}>
              <Text style={[s.langTxt, lang==='uz'&&s.langActiveTxt]}>🇺🇿 O'zbek</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[s.langBtn, lang==='ru'&&s.langActive]} onPress={()=>handleLangChange('ru')}>
              <Text style={[s.langTxt, lang==='ru'&&s.langActiveTxt]}>🇷🇺 Русский</Text>
            </TouchableOpacity>
          </View>
        </Section>

        {/* Security */}
        <Section title={t('security')}>
          <MenuItem icon="🔢" label={t('pinCode')} onPress={()=>router.push('/(auth)/create-pin')}/>
          <MenuToggle icon="👆" label={t('biometric')} value={bio} onChange={toggleBio}/>
        </Section>

        {/* KYC */}
        <Section title={t('passport')}>
          <MenuItem icon="🪪" label={t('passport')} onPress={()=>router.push('/modals/kyc')}/>
        </Section>

        {/* Settings */}
        <Section title="Sozlamalar">
          <MenuToggle icon="🔔" label={t('notifications')} value={notif} onChange={setNotif}/>
          <MenuItem icon="ℹ️" label="Versiya" value="2.0.0" showArrow={false} onPress={()=>{}}/>
        </Section>

        {/* Logout */}
        <View style={s.section}>
          <TouchableOpacity style={s.logoutBtn} onPress={handleLogout}>
            <Text style={s.logoutTxt}>🚪 {t('logout')}</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function Section({title,children}:{title:string;children:React.ReactNode}) {
  return (
    <View style={s.section}>
      <Text style={s.sectionTitle}>{title}</Text>
      <View style={s.menuGroup}>{children}</View>
    </View>
  );
}

function MenuItem({icon,label,value,onPress,showArrow=true}:any) {
  return (
    <TouchableOpacity style={s.menuItem} onPress={onPress} activeOpacity={0.7}>
      <View style={s.menuIcon}><Text style={{fontSize:18}}>{icon}</Text></View>
      <Text style={s.menuLabel}>{label}</Text>
      <View style={{flexDirection:'row',alignItems:'center',gap:4}}>
        {value&&<Text style={{fontSize:13,color:C.t2}}>{value}</Text>}
        {showArrow&&<Text style={{fontSize:22,color:C.t4,lineHeight:24}}>›</Text>}
      </View>
    </TouchableOpacity>
  );
}

function MenuToggle({icon,label,value,onChange}:any) {
  return (
    <View style={s.menuItem}>
      <View style={s.menuIcon}><Text style={{fontSize:18}}>{icon}</Text></View>
      <Text style={s.menuLabel}>{label}</Text>
      <Switch value={value} onValueChange={onChange} trackColor={{false:C.border,true:C.primary}} thumbColor="#FFF"/>
    </View>
  );
}

const s = StyleSheet.create({
  root:{flex:1,backgroundColor:C.bg},
  header:{paddingHorizontal:S.lg,paddingTop:S.sm,paddingBottom:S.md},
  title:{fontSize:22,fontWeight:'800',color:C.t1},
  profileCard:{marginHorizontal:S.lg,borderRadius:R.xxl,padding:S.xl,alignItems:'center',overflow:'hidden',marginBottom:S.sm},
  avatarWrap:{marginBottom:S.md},
  avatar:{width:80,height:80,borderRadius:40,backgroundColor:'rgba(255,255,255,0.25)',alignItems:'center',justifyContent:'center',borderWidth:3,borderColor:'rgba(255,255,255,0.4)'},
  avatarTxt:{fontSize:34,fontWeight:'900',color:'#FFF'},
  pName:{fontSize:22,fontWeight:'800',color:'#FFF',marginBottom:4},
  pPhone:{fontSize:14,color:'rgba(255,255,255,0.7)',marginBottom:S.md},
  verifiedRow:{backgroundColor:'rgba(255,255,255,0.18)',paddingHorizontal:16,paddingVertical:6,borderRadius:R.full},
  verifiedTxt:{fontSize:12,color:'#FFF',fontWeight:'600'},
  deco:{position:'absolute',borderRadius:9999,backgroundColor:'rgba(255,255,255,0.06)'},
  section:{paddingHorizontal:S.lg,marginTop:S.lg},
  sectionTitle:{fontSize:11,color:C.t3,fontWeight:'600',letterSpacing:1,textTransform:'uppercase',marginBottom:S.sm},
  menuGroup:{backgroundColor:C.elevated,borderRadius:R.lg,borderWidth:1,borderColor:C.border,overflow:'hidden'},
  menuItem:{flexDirection:'row',alignItems:'center',paddingHorizontal:S.md,paddingVertical:14,borderBottomWidth:0.5,borderBottomColor:C.border},
  menuIcon:{width:36,height:36,backgroundColor:C.card,borderRadius:R.sm,alignItems:'center',justifyContent:'center',marginRight:S.md},
  menuLabel:{flex:1,fontSize:15,color:C.t1},
  langRow:{flexDirection:'row',gap:S.sm,backgroundColor:C.elevated,borderRadius:R.lg,borderWidth:1,borderColor:C.border,padding:S.sm},
  langBtn:{flex:1,paddingVertical:12,borderRadius:R.md,alignItems:'center',backgroundColor:'transparent'},
  langActive:{backgroundColor:C.primaryBg,borderWidth:1,borderColor:C.primary},
  langTxt:{fontSize:14,color:C.t2,fontWeight:'600'},
  langActiveTxt:{color:C.primaryLight},
  logoutBtn:{backgroundColor:C.dangerBg,borderRadius:R.lg,padding:S.md,alignItems:'center',borderWidth:1,borderColor:C.dangerBorder},
  logoutTxt:{color:C.danger,fontWeight:'700',fontSize:15},
});
