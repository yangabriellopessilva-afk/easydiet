import React, { useEffect, useMemo, useState } from 'react';
import {
  SafeAreaView, View, Text, TouchableOpacity, TextInput, ScrollView,
  StyleSheet, StatusBar, Alert, KeyboardAvoidingView, Platform
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const GREEN = '#B9F36B';
const BG = '#101713';
const CARD = '#1A241E';
const MUTED = '#9AA79D';
const WHITE = '#F4F7F4';
const todayKey = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
};
const initial = {
  profile: { name: '', weight: '60', goalWeight: '65', height: '175', age: '18', calories: '3200', protein: '130' },
  logs: {},
  weights: []
};
const presets = [
  { name: 'Arroz cozido (100 g)', calories: 130, protein: 2.7, carbs: 28, fat: 0.3 },
  { name: 'Peito de frango (100 g)', calories: 165, protein: 31, carbs: 0, fat: 3.6 },
  { name: 'Ovo cozido (1 un.)', calories: 78, protein: 6.3, carbs: 0.6, fat: 5.3 },
  { name: 'Pão francês (1 un.)', calories: 140, protein: 4.5, carbs: 28, fat: 1.5 },
  { name: 'Banana média (1 un.)', calories: 105, protein: 1.3, carbs: 27, fat: 0.4 },
  { name: 'Leite integral (200 ml)', calories: 122, protein: 6.4, carbs: 9.6, fat: 6.6 },
  { name: 'Aveia (30 g)', calories: 117, protein: 5.1, carbs: 19.9, fat: 2.1 },
  { name: 'Macarrão cozido (100 g)', calories: 157, protein: 5.8, carbs: 30.9, fat: 0.9 }
];

function num(v) { const n = Number(String(v).replace(',', '.')); return Number.isFinite(n) ? n : 0; }
function round(v) { return Math.round(v); }

export default function App() {
  const [data, setData] = useState(initial);
  const [loaded, setLoaded] = useState(false);
  const [tab, setTab] = useState('Hoje');
  const [foodName, setFoodName] = useState('');
  const [foodCalories, setFoodCalories] = useState('');
  const [foodProtein, setFoodProtein] = useState('');
  const [foodCarbs, setFoodCarbs] = useState('');
  const [foodFat, setFoodFat] = useState('');
  const [weightInput, setWeightInput] = useState('');
  const [profileDraft, setProfileDraft] = useState(initial.profile);
  const day = todayKey();
  const todayLog = data.logs[day] || [];

  useEffect(() => {
    (async () => {
      try {
        const saved = await AsyncStorage.getItem('easydiet-v1');
        if (saved) {
          const parsed = JSON.parse(saved);
          setData({ ...initial, ...parsed, profile: { ...initial.profile, ...(parsed.profile || {}) } });
          setProfileDraft({ ...initial.profile, ...(parsed.profile || {}) });
        }
      } catch (e) {}
      setLoaded(true);
    })();
  }, []);

  useEffect(() => {
    if (loaded) AsyncStorage.setItem('easydiet-v1', JSON.stringify(data)).catch(() => {});
  }, [data, loaded]);

  const totals = useMemo(() => todayLog.reduce((a, f) => ({
    calories: a.calories + num(f.calories),
    protein: a.protein + num(f.protein),
    carbs: a.carbs + num(f.carbs),
    fat: a.fat + num(f.fat)
  }), { calories: 0, protein: 0, carbs: 0, fat: 0 }), [todayLog]);
  const target = Math.max(1, num(data.profile.calories) || 3200);
  const proteinTarget = Math.max(1, num(data.profile.protein) || 130);
  const remaining = Math.max(0, target - totals.calories);
  const progress = Math.min(1, totals.calories / target);

  function updateProfile(key, value) {
    const next = { ...profileDraft, [key]: value };
    setProfileDraft(next);
  }
  function saveProfile() {
    setData(d => ({ ...d, profile: profileDraft }));
    Alert.alert('Perfil salvo', 'Suas metas foram atualizadas.');
  }
  function addFood(food) {
    const entry = { ...food, id: `${Date.now()}-${Math.random()}`, createdAt: new Date().toISOString() };
    setData(d => ({ ...d, logs: { ...d.logs, [day]: [...(d.logs[day] || []), entry] } }));
  }
  function addCustomFood() {
    if (!foodName.trim() || foodCalories.trim() === '') {
      Alert.alert('Faltam dados', 'Informe o nome do alimento e as calorias.');
      return;
    }
    addFood({ name: foodName.trim(), calories: num(foodCalories), protein: num(foodProtein), carbs: num(foodCarbs), fat: num(foodFat) });
    setFoodName(''); setFoodCalories(''); setFoodProtein(''); setFoodCarbs(''); setFoodFat('');
    Alert.alert('Adicionado', 'Alimento registrado no diário de hoje.');
  }
  function removeFood(id) {
    setData(d => ({ ...d, logs: { ...d.logs, [day]: (d.logs[day] || []).filter(f => f.id !== id) } }));
  }
  function addWeight() {
    const w = num(weightInput);
    if (w < 20 || w > 350) {
      Alert.alert('Confira o peso', 'Digite um peso válido em kg.');
      return;
    }
    setData(d => ({ ...d, weights: [...(d.weights || []), { id: `${Date.now()}`, date: day, weight: w }], profile: { ...d.profile, weight: String(w) } }));
    setProfileDraft(p => ({ ...p, weight: String(w) }));
    setWeightInput('');
    Alert.alert('Peso registrado', `${w.toLocaleString('pt-BR')} kg salvo.`);
  }
  function clearToday() {
    Alert.alert('Limpar diário?', 'Isso remove os alimentos registrados hoje.', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Limpar', style: 'destructive', onPress: () => setData(d => ({ ...d, logs: { ...d.logs, [day]: [] } })) }
    ]);
  }

  const Header = () => <View style={styles.header}>
    <View><Text style={styles.eyebrow}>NUTRIÇÃO • SUA ROTINA</Text><Text style={styles.brand}>easy<Text style={{color: GREEN}}>diet</Text></Text></View>
    <View style={styles.avatar}><Text style={styles.avatarText}>{(data.profile.name || 'E').trim().charAt(0).toUpperCase()}</Text></View>
  </View>;

  const TabBar = () => <View style={styles.tabbar}>
    {['Hoje', 'Alimentos', 'Evolução', 'Perfil'].map(t => <TouchableOpacity key={t} onPress={() => setTab(t)} style={[styles.tab, tab === t && styles.tabActive]}>
      <Text style={[styles.tabText, tab === t && styles.tabTextActive]}>{t}</Text>
    </TouchableOpacity>)}
  </View>;

  const Metric = ({ label, value, unit, sub }) => <View style={styles.metric}>
    <Text style={styles.metricLabel}>{label}</Text><Text style={styles.metricValue}>{value}<Text style={styles.metricUnit}> {unit}</Text></Text>{sub ? <Text style={styles.metricSub}>{sub}</Text> : null}
  </View>;

  const Today = () => <ScrollView contentContainerStyle={styles.page} showsVerticalScrollIndicator={false}>
    <Text style={styles.greeting}>Seu progresso de hoje</Text>
    <Text style={styles.subGreeting}>Um passo de cada vez. Consistência é o que conta.</Text>
    <View style={styles.calorieCard}>
      <View style={styles.cardTop}><Text style={styles.cardKicker}>CONSUMO DE CALORIAS</Text><Text style={styles.targetText}>Meta {round(target).toLocaleString('pt-BR')} kcal</Text></View>
      <View style={styles.calorieRow}><Text style={styles.calorieNumber}>{round(totals.calories).toLocaleString('pt-BR')}</Text><Text style={styles.calorieUnit}>kcal</Text></View>
      <View style={styles.progressTrack}><View style={[styles.progressFill, { width: `${progress * 100}%` }]} /></View>
      <View style={styles.between}><Text style={styles.mutedSmall}>{Math.round(progress * 100)}% da meta</Text><Text style={styles.remaining}>{remaining.toLocaleString('pt-BR')} kcal restantes</Text></View>
    </View>
    <View style={styles.metricsRow}>
      <Metric label="PROTEÍNA" value={round(totals.protein)} unit="g" sub={`Meta ${round(proteinTarget)} g`} />
      <Metric label="CARBOIDRATOS" value={round(totals.carbs)} unit="g" />
      <Metric label="GORDURAS" value={round(totals.fat)} unit="g" />
    </View>
    <View style={styles.sectionHeading}><Text style={styles.sectionTitle}>Diário alimentar</Text><TouchableOpacity onPress={() => setTab('Alimentos')}><Text style={styles.link}>+ Adicionar</Text></TouchableOpacity></View>
    {todayLog.length === 0 ? <View style={styles.empty}><Text style={styles.emptyIcon}>＋</Text><Text style={styles.emptyTitle}>Comece pelo que você comeu</Text><Text style={styles.emptyText}>Adicione alimentos para acompanhar calorias e macros ao longo do dia.</Text><TouchableOpacity style={styles.primaryButton} onPress={() => setTab('Alimentos')}><Text style={styles.primaryButtonText}>Registrar alimento</Text></TouchableOpacity></View> :
      todayLog.map(f => <View key={f.id} style={styles.foodRow}><View style={styles.foodIcon}><Text>◉</Text></View><View style={{flex:1}}><Text style={styles.foodName}>{f.name}</Text><Text style={styles.foodMacros}>{round(num(f.protein))} g proteína · {round(num(f.carbs))} g carbo</Text></View><View style={styles.foodRight}><Text style={styles.foodCalories}>{round(num(f.calories))} kcal</Text><TouchableOpacity onPress={() => removeFood(f.id)}><Text style={styles.removeText}>Remover</Text></TouchableOpacity></View></View>)}
    {todayLog.length > 0 ? <TouchableOpacity style={styles.textButton} onPress={clearToday}><Text style={styles.mutedSmall}>Limpar alimentos de hoje</Text></TouchableOpacity> : null}
    <View style={styles.tip}><Text style={styles.tipTitle}>✦ Dica EasyDiet</Text><Text style={styles.tipText}>Para ganhar massa, acompanhe a tendência do peso ao longo de semanas e mantenha refeições regulares. Os valores dos alimentos são estimativas.</Text></View>
  </ScrollView>;

  const Foods = () => <ScrollView contentContainerStyle={styles.page} keyboardShouldPersistTaps="handled">
    <Text style={styles.greeting}>Adicionar alimento</Text><Text style={styles.subGreeting}>Registre uma refeição ou escolha um alimento comum.</Text>
    <View style={styles.panel}>
      <Text style={styles.panelTitle}>Alimento personalizado</Text>
      <TextInput value={foodName} onChangeText={setFoodName} placeholder="Nome do alimento / porção" placeholderTextColor="#748078" style={styles.input}/>
      <View style={styles.inputGrid}>
        <View style={styles.inputCell}><Text style={styles.inputLabel}>Calorias (kcal)*</Text><TextInput keyboardType="decimal-pad" value={foodCalories} onChangeText={setFoodCalories} placeholder="Ex. 250" placeholderTextColor="#748078" style={styles.input}/></View>
        <View style={styles.inputCell}><Text style={styles.inputLabel}>Proteína (g)</Text><TextInput keyboardType="decimal-pad" value={foodProtein} onChangeText={setFoodProtein} placeholder="0" placeholderTextColor="#748078" style={styles.input}/></View>
        <View style={styles.inputCell}><Text style={styles.inputLabel}>Carboidratos (g)</Text><TextInput keyboardType="decimal-pad" value={foodCarbs} onChangeText={setFoodCarbs} placeholder="0" placeholderTextColor="#748078" style={styles.input}/></View>
        <View style={styles.inputCell}><Text style={styles.inputLabel}>Gorduras (g)</Text><TextInput keyboardType="decimal-pad" value={foodFat} onChangeText={setFoodFat} placeholder="0" placeholderTextColor="#748078" style={styles.input}/></View>
      </View>
      <TouchableOpacity style={styles.primaryButton} onPress={addCustomFood}><Text style={styles.primaryButtonText}>+ Registrar no diário</Text></TouchableOpacity>
    </View>
    <View style={styles.sectionHeading}><Text style={styles.sectionTitle}>Alimentos comuns</Text><Text style={styles.mutedSmall}>porção indicada</Text></View>
    {presets.map((f, i) => <View key={f.name} style={styles.presetRow}><View style={styles.foodIcon}><Text>{['◌','▰','◉','▱','◒','◍','▤','▰'][i]}</Text></View><View style={{flex:1}}><Text style={styles.foodName}>{f.name}</Text><Text style={styles.foodMacros}>{f.protein} g proteína · {f.carbs} g carbo</Text></View><View style={styles.foodRight}><Text style={styles.foodCalories}>{f.calories} kcal</Text><TouchableOpacity onPress={() => { addFood(f); setTab('Hoje'); }}><Text style={styles.link}>+ Adicionar</Text></TouchableOpacity></View></View>)}
    <Text style={styles.footnote}>Estimativas genéricas. Marca, preparo, peso e tamanho da porção alteram os valores. Para alimentos embalados, prefira os dados do rótulo.</Text>
  </ScrollView>;

  const Evolution = () => {
    const weights = [...(data.weights || [])].reverse();
    const first = data.weights?.[0]?.weight;
    const latest = data.weights?.[data.weights.length - 1]?.weight;
    return <ScrollView contentContainerStyle={styles.page} keyboardShouldPersistTaps="handled">
      <Text style={styles.greeting}>Sua evolução</Text><Text style={styles.subGreeting}>O que importa é a tendência, não uma pesagem isolada.</Text>
      <View style={styles.metricsRow}><Metric label="PESO ATUAL" value={data.profile.weight || '—'} unit="kg"/><Metric label="META" value={data.profile.goalWeight || '—'} unit="kg"/></View>
      <View style={styles.panel}><Text style={styles.panelTitle}>Registrar pesagem</Text><Text style={styles.inputLabel}>Peso em kg</Text><View style={styles.weightInputRow}><TextInput keyboardType="decimal-pad" value={weightInput} onChangeText={setWeightInput} placeholder="Ex. 60,5" placeholderTextColor="#748078" style={[styles.input,{flex:1,marginBottom:0}]}/><TouchableOpacity style={styles.primaryButton} onPress={addWeight}><Text style={styles.primaryButtonText}>Salvar</Text></TouchableOpacity></View></View>
      <View style={styles.panel}><Text style={styles.panelTitle}>Histórico de peso</Text>
        {weights.length === 0 ? <Text style={styles.emptyText}>Nenhuma pesagem registrada ainda. Registre a primeira acima para começar seu histórico.</Text> : <>
          <View style={styles.weightSummary}><View><Text style={styles.metricLabel}>PRIMEIRA PESAGEM</Text><Text style={styles.summaryNumber}>{first} kg</Text></View><View><Text style={styles.metricLabel}>ÚLTIMA PESAGEM</Text><Text style={styles.summaryNumber}>{latest} kg</Text></View><View><Text style={styles.metricLabel}>VARIAÇÃO</Text><Text style={[styles.summaryNumber,{color: (latest-first)>=0 ? GREEN : '#FFB18C'}]}>{(latest-first)>0?'+':''}{(latest-first).toFixed(1)} kg</Text></View></View>
          {weights.map(w => <View key={w.id} style={styles.historyRow}><Text style={styles.historyDate}>{w.date}</Text><Text style={styles.historyWeight}>{String(w.weight).replace('.',',')} kg</Text></View>)}
        </>}
      </View>
      <View style={styles.tip}><Text style={styles.tipTitle}>✦ Como acompanhar</Text><Text style={styles.tipText}>Pese-se em condições parecidas e observe a média de algumas semanas. Oscilações diárias são normais.</Text></View>
    </ScrollView>;
  };

  const Profile = () => <ScrollView contentContainerStyle={styles.page} keyboardShouldPersistTaps="handled">
    <Text style={styles.greeting}>Seu perfil</Text><Text style={styles.subGreeting}>Personalize suas informações e metas diárias.</Text>
    <View style={styles.panel}>
      <Text style={styles.panelTitle}>Informações básicas</Text>
      <Text style={styles.inputLabel}>Nome (opcional)</Text><TextInput value={profileDraft.name} onChangeText={v=>updateProfile('name',v)} placeholder="Como podemos te chamar?" placeholderTextColor="#748078" style={styles.input}/>
      <View style={styles.inputGrid}>
        <View style={styles.inputCell}><Text style={styles.inputLabel}>Peso atual (kg)</Text><TextInput keyboardType="decimal-pad" value={profileDraft.weight} onChangeText={v=>updateProfile('weight',v)} style={styles.input}/></View>
        <View style={styles.inputCell}><Text style={styles.inputLabel}>Meta de peso (kg)</Text><TextInput keyboardType="decimal-pad" value={profileDraft.goalWeight} onChangeText={v=>updateProfile('goalWeight',v)} style={styles.input}/></View>
        <View style={styles.inputCell}><Text style={styles.inputLabel}>Altura (cm)</Text><TextInput keyboardType="number-pad" value={profileDraft.height} onChangeText={v=>updateProfile('height',v)} style={styles.input}/></View>
        <View style={styles.inputCell}><Text style={styles.inputLabel}>Idade</Text><TextInput keyboardType="number-pad" value={profileDraft.age} onChangeText={v=>updateProfile('age',v)} style={styles.input}/></View>
      </View>
      <Text style={styles.panelTitle}>Metas diárias</Text>
      <View style={styles.inputGrid}>
        <View style={styles.inputCell}><Text style={styles.inputLabel}>Calorias (kcal)</Text><TextInput keyboardType="number-pad" value={profileDraft.calories} onChangeText={v=>updateProfile('calories',v)} style={styles.input}/></View>
        <View style={styles.inputCell}><Text style={styles.inputLabel}>Proteína (g)</Text><TextInput keyboardType="number-pad" value={profileDraft.protein} onChangeText={v=>updateProfile('protein',v)} style={styles.input}/></View>
      </View>
      <TouchableOpacity style={styles.primaryButton} onPress={saveProfile}><Text style={styles.primaryButtonText}>Salvar perfil e metas</Text></TouchableOpacity>
    </View>
    <View style={styles.tip}><Text style={styles.tipTitle}>Sobre as metas</Text><Text style={styles.tipText}>As metas iniciais são apenas exemplos editáveis, não uma prescrição médica. Necessidades energéticas variam conforme rotina, saúde e treino. Procure nutricionista para uma meta individualizada.</Text></View>
    <TouchableOpacity style={styles.secondaryButton} onPress={() => Alert.alert('EasyDiet', 'Versão inicial 1.0\\nSeus dados ficam salvos localmente neste aparelho.') }><Text style={styles.secondaryButtonText}>Sobre o EasyDiet · versão 1.0</Text></TouchableOpacity>
  </ScrollView>;

  return <SafeAreaView style={styles.safe}>
    <StatusBar barStyle="light-content" backgroundColor={BG}/>
    <Header />
    {!loaded ? <View style={styles.loading}><Text style={styles.mutedSmall}>Carregando seus dados...</Text></View> :
      <View style={{flex:1}}>{tab === 'Hoje' ? <Today/> : tab === 'Alimentos' ? <Foods/> : tab === 'Evolução' ? <Evolution/> : <Profile/>}<TabBar/></View>}
  </SafeAreaView>;
}

const styles = StyleSheet.create({
  safe:{flex:1,backgroundColor:BG}, header:{paddingHorizontal:22,paddingTop:12,paddingBottom:16,flexDirection:'row',justifyContent:'space-between',alignItems:'center'},
  eyebrow:{color:MUTED,fontSize:9,fontWeight:'800',letterSpacing:2},brand:{color:WHITE,fontSize:28,fontWeight:'900',letterSpacing:-1},avatar:{width:40,height:40,borderRadius:14,backgroundColor:CARD,borderWidth:1,borderColor:'#34443A',alignItems:'center',justifyContent:'center'},avatarText:{color:GREEN,fontWeight:'900',fontSize:16},
  page:{paddingHorizontal:20,paddingBottom:26},greeting:{color:WHITE,fontSize:24,fontWeight:'800',letterSpacing:-.5,marginTop:5},subGreeting:{color:MUTED,fontSize:12,lineHeight:18,marginTop:5,marginBottom:20},
  calorieCard:{backgroundColor:CARD,borderRadius:22,padding:20,borderWidth:1,borderColor:'#2A382E'},cardTop:{flexDirection:'row',justifyContent:'space-between',alignItems:'center'},cardKicker:{fontSize:10,color:MUTED,fontWeight:'800',letterSpacing:1},targetText:{fontSize:10,color:GREEN,fontWeight:'700'},calorieRow:{flexDirection:'row',alignItems:'baseline',marginTop:12,marginBottom:14},calorieNumber:{fontSize:46,color:WHITE,fontWeight:'900',letterSpacing:-1.5},calorieUnit:{fontSize:13,color:MUTED,marginLeft:7},progressTrack:{height:8,backgroundColor:'#344139',borderRadius:10,overflow:'hidden'},progressFill:{height:8,backgroundColor:GREEN,borderRadius:10},between:{flexDirection:'row',justifyContent:'space-between',marginTop:10},mutedSmall:{fontSize:10,color:MUTED},remaining:{fontSize:10,color:WHITE,fontWeight:'700'},
  metricsRow:{flexDirection:'row',gap:9,marginTop:12},metric:{flex:1,backgroundColor:CARD,borderRadius:16,padding:13,borderWidth:1,borderColor:'#26342A',minWidth:0},metricLabel:{color:MUTED,fontSize:8,fontWeight:'800',letterSpacing:.5},metricValue:{color:WHITE,fontSize:23,fontWeight:'800',marginTop:8},metricUnit:{fontSize:10,color:MUTED,fontWeight:'600'},metricSub:{fontSize:9,color:GREEN,marginTop:4},
  sectionHeading:{flexDirection:'row',justifyContent:'space-between',alignItems:'center',marginTop:25,marginBottom:12},sectionTitle:{color:WHITE,fontSize:16,fontWeight:'800'},link:{color:GREEN,fontSize:11,fontWeight:'800'},
  empty:{alignItems:'center',paddingVertical:25,paddingHorizontal:20,backgroundColor:CARD,borderRadius:18,borderWidth:1,borderColor:'#26342A'},emptyIcon:{color:GREEN,fontSize:30,fontWeight:'300',marginBottom:6},emptyTitle:{color:WHITE,fontSize:14,fontWeight:'800'},emptyText:{color:MUTED,fontSize:11,lineHeight:17,textAlign:'center',marginTop:7,marginBottom:15},primaryButton:{backgroundColor:GREEN,paddingVertical:13,paddingHorizontal:17,borderRadius:12,alignItems:'center',justifyContent:'center'},primaryButtonText:{color:'#172015',fontSize:12,fontWeight:'900'},foodRow:{flexDirection:'row',alignItems:'center',backgroundColor:CARD,padding:12,borderRadius:15,marginBottom:8,borderWidth:1,borderColor:'#26342A'},foodIcon:{width:38,height:38,borderRadius:12,backgroundColor:'#29372C',alignItems:'center',justifyContent:'center',marginRight:11},foodIconText:{color:GREEN},foodName:{color:WHITE,fontSize:12,fontWeight:'700'},foodMacros:{color:MUTED,fontSize:9,marginTop:5},foodRight:{alignItems:'flex-end',marginLeft:8},foodCalories:{color:WHITE,fontSize:11,fontWeight:'800'},removeText:{color:'#F2A48A',fontSize:9,marginTop:5},textButton:{alignItems:'center',padding:12},
  tip:{backgroundColor:'#1B2B20',borderRadius:16,padding:15,marginTop:20,borderWidth:1,borderColor:'#2C4832'},tipTitle:{color:GREEN,fontSize:12,fontWeight:'800',marginBottom:6},tipText:{color:'#C2CEC4',fontSize:11,lineHeight:17},
  tabbar:{flexDirection:'row',paddingHorizontal:12,paddingTop:10,paddingBottom:Platform.OS==='android'?10:6,backgroundColor:'#141D17',borderTopWidth:1,borderTopColor:'#27342B'},tab:{flex:1,alignItems:'center',paddingVertical:10,borderRadius:12},tabActive:{backgroundColor:'#29372C'},tabText:{fontSize:10,color:MUTED,fontWeight:'700'},tabTextActive:{color:GREEN,fontWeight:'900'},
  panel:{backgroundColor:CARD,borderRadius:19,padding:16,borderWidth:1,borderColor:'#2A382E',marginBottom:14},panelTitle:{color:WHITE,fontSize:14,fontWeight:'800',marginBottom:14,marginTop:2},input:{backgroundColor:'#111A14',borderWidth:1,borderColor:'#334237',borderRadius:11,paddingHorizontal:12,paddingVertical:12,color:WHITE,fontSize:12,marginBottom:12},inputLabel:{fontSize:10,color:MUTED,fontWeight:'700',marginBottom:7},inputGrid:{flexDirection:'row',flexWrap:'wrap',gap:10},inputCell:{width:'47%',flexGrow:1},presetRow:{flexDirection:'row',alignItems:'center',backgroundColor:CARD,padding:11,borderRadius:14,marginBottom:7,borderWidth:1,borderColor:'#26342A'},footnote:{color:MUTED,fontSize:10,lineHeight:15,marginTop:12},weightInputRow:{flexDirection:'row',alignItems:'center',gap:9},weightSummary:{flexDirection:'row',justifyContent:'space-between',marginBottom:14},summaryNumber:{color:WHITE,fontSize:17,fontWeight:'900',marginTop:7},historyRow:{flexDirection:'row',justifyContent:'space-between',paddingVertical:12,borderTopWidth:1,borderTopColor:'#2A382E'},historyDate:{color:MUTED,fontSize:11},historyWeight:{color:WHITE,fontSize:12,fontWeight:'800'},secondaryButton:{padding:14,alignItems:'center'},secondaryButtonText:{color:MUTED,fontSize:11,fontWeight:'700'},loading:{flex:1,alignItems:'center',justifyContent:'center'}
});
