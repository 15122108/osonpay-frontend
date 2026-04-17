import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, SafeAreaView, RefreshControl, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { C, S, R, formatMoney } from '../../constants/theme';
import { api } from '../../services/api';
import { useAuth } from '../../hooks/useAuth';
import { useLang } from '../../hooks/useLang';

export default function Home() {
  const { user, refresh } = useAuth();
  const { t } = useLang();
  const [txs, setTxs] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  async function load() {
    try {
      const [th, ts] = await Promise.all([api.getHistory(1), api.getStats()]);
      setTxs(th.transactions?.slice(0,5)||[]);
      setStats(ts.stats);
    } catch {} finally { setLoading(false); }
  }

  useEffect(() => { load(); }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([refresh(), load()]);
    setRefreshing(false);
  }, []);

  const ACTIONS = [
    { label: t('send'), icon: '↑', grad: C.gBrand, route: '/modals/send' },
    { label: t('receive'), icon: '↓', grad: C.gSuccess, route: '/modals/receive' },
    { label: t('topup'), icon: '+', grad: C.gOrange, route: '/modals/topup' },
    { label: t('payment'), icon: '⊙', grad: C.gPrimary, route: '/modals/send' },
  ];

  return (
    <SafeAreaView style={s.root}>
      <ScrollView refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={C.primary}/>} contentContainerStyle={{paddingBottom:100}} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={s.header}>
          <View>
            <Text style={s.greet}>👋 Xush kelibsiz</Text>
            <Text style={s.name}>{user?.fullName||'Foydalanuvchi'}</Text>
          </View>
          <TouchableOpacity style={s.notif}><Text style={{fontSize:20}}>🔔</Text></TouchableOpacity>
        </View>

        {/* Balance card */}
        <View style={s.cardWrap}>
          <LinearGradient colors={C.gCard1} start={{x:0,y:0}} end={{x:1,y:1}} style={s.balCard}>
            <View>
              <Text style={s.balLabel}>{t('mainBalance')}</Text>
              <Text style={s.balAmount}>{formatMoney(user?.balance||0)}</Text>
              <Text style={s.balCur}>UZS</Text>
            </View>
            <View style={s.badge}><Text style={s.badgeTxt}>OSON PAY</Text></View>
            <Text style={s.phone}>{user?.phone}</Text>
            <View style={[s.deco,{width:200,height:200,top:-60,right:-50,opacity:0.12}]}/>
            <View style={[s.deco,{width:140,height:140,bottom:-40,left:30,opacity:0.08}]}/>
          </LinearGradient>
        </View>

        {/* Stats */}
        {stats && (
          <View style={s.statsRow}>
            {[
              {icon:'📥',val:'+'+formatMoney(stats.total_in),label:'Keldi',color:C.success},
              {icon:'📤',val:'-'+formatMoney(stats.total_out),label:'Ketdi',color:C.danger},
              {icon:'🔄',val:String(stats.total_count),label:'Jami',color:C.primary},
            ].map((st,i)=>(
              <View key={i} style={s.statCard}>
                <Text style={{fontSize:18}}>{st.icon}</Text>
                <Text style={[s.statVal,{color:st.color}]}>{st.val}</Text>
                <Text style={s.statLbl}>{st.label}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Actions */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>Tezkor amallar</Text>
          <View style={s.actionsRow}>
            {ACTIONS.map(a=>(
              <TouchableOpacity key={a.label} onPress={()=>router.push(a.route as any)} activeOpacity={0.8}>
                <LinearGradient colors={a.grad} style={s.actionBtn} start={{x:0,y:0}} end={{x:1,y:1}}>
                  <Text style={s.actionIcon}>{a.icon}</Text>
                </LinearGradient>
                <Text style={s.actionLbl}>{a.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Transactions */}
        <View style={s.section}>
          <View style={s.sectionHead}>
            <Text style={s.sectionTitle}>{t('recentTx')}</Text>
            <TouchableOpacity onPress={()=>router.push('/(tabs)/history' as any)}>
              <Text style={{color:C.orange,fontSize:13,fontWeight:'600'}}>{t('seeAll')}</Text>
            </TouchableOpacity>
          </View>
          {loading ? <ActivityIndicator color={C.primary} style={{marginTop:20}}/>
            : txs.length===0 ? <View style={s.empty}><Text style={{fontSize:36}}>📭</Text><Text style={s.emptyTxt}>Tranzaksiyalar yo'q</Text></View>
            : txs.map(tx=>{
              const isCredit = tx.receiver_id === user?.id;
              const amt = parseFloat(tx.amount);
              const name = isCredit ? (tx.sender_name||'Tizim') : (tx.receiver_name||'Tizim');
              const typeIcon:any = {send:'↑',receive:'↓',payment:'⊙',topup:'+'};
              const typeColor:any = {send:C.primary,receive:C.success,payment:C.danger,topup:C.warning};
              return (
                <TouchableOpacity key={tx.id} style={s.txRow} onPress={()=>router.push({pathname:'/modals/transaction',params:{id:tx.id}})} activeOpacity={0.7}>
                  <View style={[s.txIcon,{backgroundColor:(typeColor[tx.type]||C.primary)+'20'}]}>
                    <Text style={[s.txIconTxt,{color:typeColor[tx.type]||C.primary}]}>{typeIcon[tx.type]||'·'}</Text>
                  </View>
                  <View style={s.txInfo}>
                    <Text style={s.txName}>{name}</Text>
                    <Text style={s.txTime}>{new Date(tx.created_at).toLocaleDateString('uz-UZ')}</Text>
                  </View>
                  <Text style={[s.txAmt,{color:isCredit?C.success:C.t1}]}>{isCredit?'+':'-'}{formatMoney(amt)}</Text>
                </TouchableOpacity>
              );
            })
          }
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  root:{flex:1,backgroundColor:C.bg},
  header:{flexDirection:'row',justifyContent:'space-between',alignItems:'center',paddingHorizontal:S.lg,paddingTop:S.sm,paddingBottom:S.md},
  greet:{fontSize:13,color:C.t3,marginBottom:2},
  name:{fontSize:20,fontWeight:'800',color:C.t1},
  notif:{width:44,height:44,borderRadius:R.md,backgroundColor:C.elevated,alignItems:'center',justifyContent:'center',borderWidth:1,borderColor:C.border},
  cardWrap:{paddingHorizontal:S.lg,marginBottom:S.md},
  balCard:{borderRadius:R.xxl,padding:S.lg,minHeight:160,justifyContent:'space-between',overflow:'hidden',flexDirection:'row',alignItems:'flex-start'},
  balLabel:{fontSize:11,color:'rgba(255,255,255,0.65)',letterSpacing:1,marginBottom:6},
  balAmount:{fontSize:36,fontWeight:'900',color:'#FFF',letterSpacing:-1},
  balCur:{fontSize:14,color:'rgba(255,255,255,0.6)',marginTop:2},
  badge:{backgroundColor:'rgba(255,255,255,0.18)',paddingHorizontal:12,paddingVertical:6,borderRadius:R.full,height:32,justifyContent:'center'},
  badgeTxt:{color:'#FFF',fontSize:10,fontWeight:'800',letterSpacing:1.5},
  phone:{position:'absolute',bottom:S.lg,left:S.lg,color:'rgba(255,255,255,0.55)',fontSize:13},
  deco:{position:'absolute',borderRadius:9999,backgroundColor:'#FFF'},
  statsRow:{flexDirection:'row',paddingHorizontal:S.lg,gap:S.sm,marginBottom:S.sm},
  statCard:{flex:1,backgroundColor:C.elevated,borderRadius:R.lg,padding:S.sm+4,alignItems:'center',gap:4,borderWidth:1,borderColor:C.border},
  statVal:{fontSize:13,fontWeight:'800'},
  statLbl:{fontSize:10,color:C.t3},
  section:{paddingHorizontal:S.lg,marginTop:S.lg},
  sectionHead:{flexDirection:'row',justifyContent:'space-between',alignItems:'center',marginBottom:S.md},
  sectionTitle:{fontSize:16,fontWeight:'700',color:C.t1,marginBottom:S.md},
  actionsRow:{flexDirection:'row',justifyContent:'space-between'},
  actionBtn:{width:64,height:64,borderRadius:R.xl,alignItems:'center',justifyContent:'center',marginBottom:6},
  actionIcon:{fontSize:26,color:'#FFF',fontWeight:'800'},
  actionLbl:{fontSize:11,color:C.t2,textAlign:'center',fontWeight:'500'},
  txRow:{flexDirection:'row',alignItems:'center',backgroundColor:C.elevated,borderRadius:R.lg,padding:S.md,marginBottom:8,borderWidth:1,borderColor:C.border},
  txIcon:{width:44,height:44,borderRadius:22,alignItems:'center',justifyContent:'center',marginRight:S.md},
  txIconTxt:{fontSize:20,fontWeight:'800'},
  txInfo:{flex:1},
  txName:{fontSize:14,fontWeight:'600',color:C.t1,marginBottom:3},
  txTime:{fontSize:11,color:C.t3},
  txAmt:{fontSize:14,fontWeight:'800'},
  empty:{alignItems:'center',paddingVertical:40,gap:12},
  emptyTxt:{color:C.t3,fontSize:14},
});
