import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, SafeAreaView, RefreshControl, TextInput, ActivityIndicator } from 'react-native';
import { router } from 'expo-router';
import { C, S, R, formatMoney } from '../../constants/theme';
import { api } from '../../services/api';
import { useAuth } from '../../hooks/useAuth';
import { useLang } from '../../hooks/useLang';

export default function History() {
  const { user } = useAuth();
  const { t } = useLang();
  const [txs, setTxs] = useState<any[]>([]);
  const [filter, setFilter] = useState<string|undefined>(undefined);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const FILTERS = [
    {label:t('all'),value:undefined},
    {label:t('send'),value:'send'},
    {label:t('receive'),value:'receive'},
    {label:t('topup'),value:'topup'},
  ];

  async function load(f=filter) {
    try { const r = await api.getHistory(1,f); setTxs(r.transactions||[]); } catch {} finally { setLoading(false); setRefreshing(false); }
  }

  useEffect(()=>{ setLoading(true); load(filter); },[filter]);

  const displayed = txs.filter(tx=>!search||(tx.sender_name||tx.receiver_name||'').toLowerCase().includes(search.toLowerCase()));

  const typeIcon:any={send:'↑',receive:'↓',payment:'⊙',topup:'+',withdraw:'↧'};
  const typeColor:any={send:C.primary,receive:C.success,payment:C.danger,topup:C.warning,withdraw:C.orange};
  const statusColor:any={completed:C.success,pending:C.warning,failed:C.danger};

  return (
    <SafeAreaView style={s.root}>
      <View style={s.header}><Text style={s.title}>{t('history')}</Text></View>
      <View style={s.searchBox}>
        <Text style={{fontSize:16}}>🔍</Text>
        <TextInput style={s.searchInput} placeholder={t('search')} placeholderTextColor={C.t3} value={search} onChangeText={setSearch}/>
        {search?<TouchableOpacity onPress={()=>setSearch('')}><Text style={{color:C.t3}}>✕</Text></TouchableOpacity>:null}
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.filters}>
        {FILTERS.map(f=>(
          <TouchableOpacity key={f.label} style={[s.chip,filter===f.value&&s.chipActive]} onPress={()=>setFilter(f.value)}>
            <Text style={[s.chipTxt,filter===f.value&&s.chipActiveTxt]}>{f.label}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
      <ScrollView refreshControl={<RefreshControl refreshing={refreshing} onRefresh={()=>{setRefreshing(true);load();}} tintColor={C.primary}/>} contentContainerStyle={{paddingHorizontal:S.lg,paddingBottom:100}} showsVerticalScrollIndicator={false}>
        {loading?<ActivityIndicator color={C.primary} style={{marginTop:40}}/>
          : displayed.length===0?<View style={s.empty}><Text style={{fontSize:40,marginBottom:12}}>📭</Text><Text style={{color:C.t3,fontSize:14}}>{t('noTx')}</Text></View>
          : displayed.map(tx=>{
            const isCredit=tx.receiver_id===user?.id;
            const amt=parseFloat(tx.amount);
            const name=isCredit?(tx.sender_name||'Tizim'):(tx.receiver_name||'Tizim');
            const color=typeColor[tx.type]||C.primary;
            return (
              <TouchableOpacity key={tx.id} style={s.txCard} onPress={()=>router.push({pathname:'/modals/transaction',params:{id:tx.id}})} activeOpacity={0.7}>
                <View style={[s.txIcon,{backgroundColor:color+'18'}]}>
                  <Text style={[s.txIconTxt,{color}]}>{typeIcon[tx.type]||'·'}</Text>
                </View>
                <View style={s.txMid}>
                  <Text style={s.txName}>{name}</Text>
                  <Text style={s.txDate}>{new Date(tx.created_at).toLocaleDateString('uz-UZ',{day:'numeric',month:'short',hour:'2-digit',minute:'2-digit'})}</Text>
                </View>
                <View style={s.txRight}>
                  <Text style={[s.txAmt,{color:isCredit?C.success:C.t1}]}>{isCredit?'+':'-'}{formatMoney(amt)}</Text>
                  <View style={[s.statusBadge,{backgroundColor:(statusColor[tx.status]||C.success)+'20'}]}>
                    <Text style={[s.statusTxt,{color:statusColor[tx.status]||C.success}]}>{tx.status==='completed'?'✓':tx.status==='pending'?'⏳':'✕'}</Text>
                  </View>
                </View>
              </TouchableOpacity>
            );
          })
        }
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  root:{flex:1,backgroundColor:C.bg},
  header:{paddingHorizontal:S.lg,paddingTop:S.sm,paddingBottom:S.sm},
  title:{fontSize:22,fontWeight:'800',color:C.t1},
  searchBox:{flexDirection:'row',alignItems:'center',gap:S.sm,marginHorizontal:S.lg,marginBottom:S.sm,backgroundColor:C.elevated,borderRadius:R.lg,paddingHorizontal:S.md,height:46,borderWidth:1,borderColor:C.border},
  searchInput:{flex:1,color:C.t1,fontSize:14},
  filters:{paddingHorizontal:S.lg,gap:S.sm,paddingBottom:S.sm},
  chip:{paddingHorizontal:16,paddingVertical:8,borderRadius:R.full,backgroundColor:C.elevated,borderWidth:1,borderColor:C.border},
  chipActive:{backgroundColor:C.primaryBg,borderColor:C.primary},
  chipTxt:{fontSize:13,color:C.t2,fontWeight:'500'},
  chipActiveTxt:{color:C.primaryLight,fontWeight:'700'},
  txCard:{flexDirection:'row',alignItems:'center',backgroundColor:C.elevated,borderRadius:R.lg,padding:S.md,marginBottom:8,borderWidth:1,borderColor:C.border},
  txIcon:{width:46,height:46,borderRadius:23,alignItems:'center',justifyContent:'center',marginRight:S.md},
  txIconTxt:{fontSize:20,fontWeight:'800'},
  txMid:{flex:1},
  txName:{fontSize:14,fontWeight:'600',color:C.t1,marginBottom:3},
  txDate:{fontSize:11,color:C.t3},
  txRight:{alignItems:'flex-end',gap:4},
  txAmt:{fontSize:14,fontWeight:'800'},
  statusBadge:{paddingHorizontal:8,paddingVertical:2,borderRadius:R.full},
  statusTxt:{fontSize:11,fontWeight:'700'},
  empty:{alignItems:'center',paddingTop:60},
});
