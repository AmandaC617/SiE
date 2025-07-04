import React, { useState, useCallback, useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Loader2, Search, AlertTriangle, Lightbulb } from 'lucide-react';

// --- Helper Functions & Constants ---
const API_KEY = process.env.REACT_APP_GEMINI_API_KEY || ""; // Gemini API Key from environment
const BAR_COLORS = ['#4f46e5', '#818cf8', '#a5b4fc']; // Colors for Brand vs Competitors

// This is the question classification rule database from the user's uploaded file.
const QUESTION_CLASSIFIER_RULES = {
    "使用教學/售後服務型": { keywords: ["如何設定", "怎麼用", "使用教學", "操作", "安裝", "配對", "啟用", "註冊", "功能介紹", "說明書", "手冊", "驅動程式", "韌體", "更新", "下載", "故障", "沒反應", "無法開機", "當機", "黑畫面", "閃退", "連不上", "沒聲音", "顯示錯誤", "錯誤代碼", "維修", "送修", "維修中心", "修理", "保固", "保固多久", "保固條款", "客服", "客服電話", "聯絡方式", "退貨", "換貨", "RMA"], priority: 10 },
    "比較型": { keywords: ["比較", "vs", "對比", "哪個好", "差異", "優缺點", "評比", "和", "怎麼選", "選擇", "差別", "A還是B", "A跟B", "分析", "替代方案", "對手"], priority: 9 },
    "價格型": { keywords: ["多少錢", "價格", "售價", "報價", "預算", "費用", "定價", "CP值", "C/P值", "性價比", "划算", "便宜", "優惠", "折扣", "折價券", "優惠碼", "活動價", "特價", "折扣碼", "週年慶", "母親節", "父親節", "雙11", "雙十二", "黑色星期五", "黑五", "學生價", "教育價", "教職員", "哪裡買", "通路"], priority: 8 },
    "評價/口碑型": { keywords: ["評價", "心得", "評論", "好用嗎", "值得買", "推薦文", "開箱", "體驗", "使用經驗", "用戶回饋", "大家覺得", "網友說", "災情", "缺點", "雷", "反推", "不要買", "問題", "毛病", "通病", "PTT", "Dcard", "Mobile01", "01", "YT", "臉書社團", "媽咪拜"], priority: 7 },
    "問題解決型/需求導向型": { keywords: ["如何解決", "怎麼辦", "太耗電", "過熱", "延遲", "模糊", "空間不足", "很慢", "很卡", "收不到", "不夠用", "很吵", "加速", "最佳化", "優化", "省電", "更清晰", "擴充", "改善", "提升", "有什麼方法", "怎麼讓"], priority: 6 },
    "推薦型": { keywords: ["推薦", "建議", "求", "找一款", "適合", "幫我找", "有沒有推薦", "請益", "求推薦", "求建議", "送禮", "新手用", "長輩用", "辦公用", "遊戲用", "文書機"], priority: 5 },
    "功能/規格型": { keywords: ["規格", "功能", "效能", "性能", "材質", "版本", "型號", "尺寸", "重量", "顏色", "電池", "續航力", "處理器", "CPU", "GPU", "顯卡", "記憶體", "RAM", "硬碟", "SSD", "容量", "螢幕", "解析度", "更新率", "ppi", "面板", "亮度", "Nits", "藍牙", "Wi-Fi", "NFC", "連接埠", "接口", "HDMI", "Type-C", "Thunderbolt", "相機", "畫素", "鏡頭", "光圈", "感光元件", "防水", "防塵", "IP等級", "支援", "具備"], priority: 4 },
    "品牌導向型": { keywords: ["官網", "官方網站", "是哪一國", "歷史", "創辦人", "執行長", "CEO", "公司", "集團", "旗下品牌", "理念", "願景", "環保", "CSR", "企業責任", "永續", "ESG", "門市", "分店", "專櫃", "地址", "電話", "聯絡", "據點"], priority: 3 },
    "資訊型": { keywords: ["什麼是", "為什麼", "如何運作", "誰", "何時", "何地", "原理", "定義", "介紹", "解說", "懶人包", "白話文", "意思是", "由來", "有哪些", "知識"], priority: 2 }
};

// Function to classify a question based on keywords
const classifyQuestion = (questionText) => {
    for (const [category, { keywords }] of Object.entries(QUESTION_CLASSIFIER_RULES)) {
        if (keywords.some(keyword => questionText.toLowerCase().includes(keyword.toLowerCase()))) {
            return category;
        }
    }
    return "資訊型"; // Default category
};

// --- UI Components ---

const Card = ({ children, className = '' }) => (
  <div className={`bg-white border border-gray-200 rounded-lg shadow-sm p-6 flex flex-col ${className}`}>
    {children}
  </div>
);

const CardTitle = ({ children, warning }) => (
  <div className="flex items-start justify-between">
      <h3 className="text-lg font-semibold text-gray-800 mb-4">{children}</h3>
      {warning && (
          <div className="flex items-center text-xs text-amber-600 bg-amber-100 px-2 py-1 rounded-full -mt-1">
              <AlertTriangle className="h-4 w-4 mr-1.5" />
              <span>{warning}</span>
          </div>
      )}
  </div>
);

const Button = ({ children, onClick, disabled = false, className = '' }) => (
  <button
    onClick={onClick}
    disabled={disabled}
    className={`inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors ${className}`}
  >
    {children}
  </button>
);

const Input = ({ value, onChange, placeholder, className = '' }) => (
  <input
    type="text"
    value={value}
    onChange={onChange}
    placeholder={placeholder}
    className={`block w-full px-4 py-3 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm ${className}`}
  />
);

const Textarea = ({ value, onChange, placeholder, rows = 4, className = '' }) => (
    <textarea
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        rows={rows}
        className={`block w-full px-4 py-3 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm ${className}`}
    />
);

const Spinner = () => (
  <div className="flex justify-center items-center py-10">
    <Loader2 className="h-12 w-12 text-indigo-600 animate-spin" />
  </div>
);

const ErrorMessage = ({ message }) => (
    <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded-md" role="alert">
        <p className="font-bold">發生錯誤</p>
        <p>{message}</p>
    </div>
);

// --- Main Application ---
export default function App() {
  // --- State Management ---
  const [industry, setIndustry] = useState('智慧型手機');
  const [brand, setBrand] = useState('Apple iPhone 15 Pro');
  const [competitors, setCompetitors] = useState('Samsung Galaxy S24 Ultra, Google Pixel 8 Pro');
  const [officialDescription, setOfficialDescription] = useState('iPhone 15 Pro 擁有航太等級鈦金屬設計，配備 A17 Pro 晶片，提供歷來最強的繪圖處理效能。相機系統更強大，具備 4800 萬像素主相機，以及 5 倍望遠相機。');
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // Data for charts and lists
  const [topQuestions, setTopQuestions] = useState([]);
  const [mentionData, setMentionData] = useState([]);
  const [accuracyData, setAccuracyData] = useState([]); // Changed to array
  const [overallMentionData, setOverallMentionData] = useState([]);

  // Warnings
  const [accuracyWarning, setAccuracyWarning] = useState(null);
  const [mentionWarning, setMentionWarning] = useState(null);

  // --- Logic for Suggesting Competitors (Simulated) ---
  const suggestCompetitors = () => {
      if (industry.includes('手機')) {
          setCompetitors('Samsung Galaxy S24 Ultra, Google Pixel 8 Pro, Sony Xperia 1 VI');
      } else if (industry.includes('咖啡')) {
          setCompetitors('Starbucks, Louisa Coffee, Cama Café');
      } else {
          setCompetitors('');
      }
  };

  // --- API Call Logic ---
  const callGeminiAPI = useCallback(async (prompt, responseSchema) => {
    const payload = {
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      generationConfig: { responseMimeType: "application/json", responseSchema: responseSchema, temperature: 0.2, }
    };
    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${API_KEY}`;
    
    try {
      const response = await fetch(apiUrl, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      if (!response.ok) {
        const errorBody = await response.json();
        throw new Error(`API 請求失敗: ${response.status}. ${errorBody?.error?.message || ''}`);
      }
      const result = await response.json();
      if (result.candidates?.[0]?.content?.parts?.[0]?.text) {
        return JSON.parse(result.candidates[0].content.parts[0].text);
      } else { throw new Error("從 API 收到的回應格式不正確或為空。"); }
    } catch (err) {
      console.error("Gemini API Call Error:", err);
      throw err;
    }
  }, []);
  
  // --- Data Fetching and Analysis Logic ---
  const handleAnalysis = async () => {
    setIsLoading(true);
    setError(null);
    setTopQuestions([]);
    setMentionData([]);
    setAccuracyData([]);
    setOverallMentionData([]);
    setAccuracyWarning(null);
    setMentionWarning(null);

    try {
      // Step 1: Get top 5 questions with importance
      const questionPrompt = `針對 "${industry}" 這個行業，根據 SEO 原則與使用者搜尋意圖，列出 5 個最重要且最常被詢問的問題。請為每個問題提供一個 1 到 10 的重要性分數 (10為最重要)。`;
      const questionSchema = { type: "OBJECT", properties: { questions: { type: "ARRAY", items: { type: "OBJECT", properties: { text: { type: "STRING" }, importance: { type: "NUMBER" } }, required: ["text", "importance"] } } }, required: ["questions"] };
      const questionResult = await callGeminiAPI(questionPrompt, questionSchema);
      const fetchedQuestions = questionResult.questions
        .sort((a, b) => b.importance - a.importance)
        .slice(0, 5)
        .map((q, i) => ({ ...q, id: i + 1, tag: classifyQuestion(q.text) }));
      setTopQuestions(fetchedQuestions);
      
      if (fetchedQuestions.length === 0) throw new Error("未能獲取任何熱門問題。");
      const topQuestionText = fetchedQuestions[0].text;

      // Step 2: Analyze mention count for the top question
      const competitorList = competitors.split(',').map(c => c.trim()).filter(c => c);
      const allBrands = [brand.trim(), ...competitorList];
      const mentionPrompt = `假設在網路搜尋「${topQuestionText}」的答案，品牌 "${brand}" 及競品 "${competitorList.join(', ')}" 的預估提及次數是多少？`;
      const mentionSchema = { type: "ARRAY", items: { type: "OBJECT", properties: { name: { type: "STRING" }, mentions: { type: "NUMBER" } }, required: ["name", "mentions"] } };
      const mentionResult = await callGeminiAPI(mentionPrompt, mentionSchema);
      const mentionMap = new Map(mentionResult.map(item => [item.name, item.mentions]));
      const fullMentionData = allBrands.map(b => ({ name: b, mentions: mentionMap.get(b) || 0 }));
      setMentionData(fullMentionData);

      const myBrandMentions = mentionMap.get(brand.trim()) || 0;
      const topCompetitorMentions = Math.max(0, ...competitorList.map(c => mentionMap.get(c) || 0));
      if (competitorList.length > 0 && myBrandMentions < topCompetitorMentions) {
          setMentionWarning("提及量落後主要對手");
      }

      // Step 3: NEW - Analyze Information Accuracy for ALL top 5 questions
      const accuracyPrompt = `這是品牌 "${brand}" 的官方標準描述：「${officialDescription}」。\n請針對以下 5 個問題，分別生成一個包含品牌 "${brand}" 的回應，然後比對該回應與官方描述，評估其核心資訊點的覆蓋率。\n\n問題列表:\n${fetchedQuestions.map(q => `Q${q.id}: ${q.text}`).join('\n')}`;
      const accuracySchema = {
          type: "ARRAY",
          items: {
              type: "OBJECT",
              properties: {
                  question_id: { type: "STRING", description: "問題編號, 例如 'Q1'" },
                  coverage_rate: { type: "NUMBER", description: "一個0到1之間的小數，代表核心資訊點的覆蓋率" }
              },
              required: ["question_id", "coverage_rate"]
          }
      };
      const accuracyResult = await callGeminiAPI(accuracyPrompt, accuracySchema);
      setAccuracyData(accuracyResult.map(r => ({...r, coverage_rate: Math.round(r.coverage_rate * 100)}))); // Convert to percentage
      
      const avgAccuracy = accuracyResult.reduce((sum, r) => sum + r.coverage_rate, 0) / accuracyResult.length;
      if (avgAccuracy < 0.6) {
          setAccuracyWarning("平均資訊覆蓋率偏低");
      }

      // Step 4: Analyze overall mention comparison for all top 5 questions
      const overallMentionPrompt = `針對以下 5 個問題，請分別估算品牌 "${brand}" 以及競品 "${competitorList.join(', ')}" 在相關網路討論中的提及次數。`;
      const overallMentionSchema = {
          type: "ARRAY", items: { type: "OBJECT", properties: { question_id: { type: "STRING" }, mentions: { type: "ARRAY", items: { type: "OBJECT", properties: { name: { type: "STRING" }, count: { type: "NUMBER" } }, required: ["name", "count"] } } }, required: ["question_id", "mentions"] }
      };
      const detailedOverallPrompt = `${overallMentionPrompt}\n\n問題列表：\n${fetchedQuestions.map(q => `Q${q.id}: ${q.text}`).join('\n')}`;
      const overallResult = await callGeminiAPI(detailedOverallPrompt, overallMentionSchema);
      const formattedOverallData = fetchedQuestions.map((q) => {
        const resultForQ = overallResult.find(r => r.question_id === `Q${q.id}` || r.question_id === String(q.id));
        const dataPoint = { name: `Q${q.id}` };
        allBrands.forEach(b => {
          const mention = resultForQ?.mentions.find(m => m.name === b);
          dataPoint[b] = mention?.count || 0;
        });
        return dataPoint;
      });
      setOverallMentionData(formattedOverallData);

    } catch (err) {
      setError(err.message || '分析過程中發生未知錯誤。');
    } finally {
      setIsLoading(false);
    }
  };
  
  const competitorNames = useMemo(() => competitors.split(',').map(c => c.trim()).filter(c => c), [competitors]);

  return (
    <div className="min-h-screen bg-gray-50 font-sans text-gray-900">
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto py-4 px-4 sm:px-6 lg:px-8">
          <h1 className="text-2xl font-bold leading-tight text-gray-900">
            SIE平台 - 品牌AI能見度洞察 (進階分析版)
          </h1>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        {/* --- Input Section --- */}
        <Card className="mb-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div>
              <label htmlFor="industry" className="block text-sm font-medium text-gray-700 mb-1">行業類別</label>
              <Input id="industry" value={industry} onChange={(e) => setIndustry(e.target.value)} placeholder="例如：智慧型手機、美妝保養" />
            </div>
            <div>
              <label htmlFor="brand" className="block text-sm font-medium text-gray-700 mb-1">您的品牌</label>
              <Input id="brand" value={brand} onChange={(e) => setBrand(e.target.value)} placeholder="例如：品牌A" />
            </div>
            <div className="relative">
              <label htmlFor="competitors" className="block text-sm font-medium text-gray-700 mb-1">競爭對手 (以逗號分隔)</label>
              <Input id="competitors" value={competitors} onChange={(e) => setCompetitors(e.target.value)} placeholder="例如：品牌B, 品牌C" />
               <button onClick={suggestCompetitors} className="absolute right-1 top-7 text-xs text-indigo-600 hover:text-indigo-800 flex items-center bg-indigo-100 px-2 py-1 rounded-full">
                  <Lightbulb className="h-4 w-4 mr-1"/> 建議對手
              </button>
            </div>
            <div className="md:col-span-2 lg:col-span-3">
               <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">品牌官方標準描述 (用於正確度分析)</label>
               <Textarea id="description" value={officialDescription} onChange={(e) => setOfficialDescription(e.target.value)} />
            </div>
          </div>
          <div className="mt-6 text-center">
            <Button onClick={handleAnalysis} disabled={isLoading || !officialDescription}>
              {isLoading ? <><Loader2 className="mr-2 h-5 w-5 animate-spin" /> 分析中...</> : <><Search className="mr-2 h-5 w-5" /> 開始分析</>}
            </Button>
          </div>
        </Card>

        {/* --- Output Section --- */}
        {isLoading && <Spinner />}
        {error && <ErrorMessage message={error} />}
        {!isLoading && !error && topQuestions.length > 0 && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <Card className="lg:col-span-1">
                <CardTitle>AI助理最常被問的五大問題</CardTitle>
                <ul className="space-y-3">
                  {topQuestions.map((q) => (
                    <li key={q.id} className="flex items-start text-sm">
                      <span className={`flex-shrink-0 text-xs font-semibold mr-3 px-2 py-1 rounded-full ${q.tag === '價格型' || q.tag === '比較型' ? 'bg-red-100 text-red-800' : 'bg-blue-100 text-blue-800'}`}>{q.tag}</span>
                      <span className="text-gray-700">{q.text}</span>
                    </li>
                  ))}
                </ul>
              </Card>

              <Card className="lg:col-span-1">
                <CardTitle warning={mentionWarning}>最熱門問題中，品牌與競品提及次數</CardTitle>
                <p className="text-xs text-gray-500 mb-4 -mt-2">針對問題: "{topQuestions[0]?.text}"</p>
                <div className="flex-grow">
                  <ResponsiveContainer width="100%" height={200}>
                    <BarChart data={mentionData} layout="vertical" margin={{ top: 5, right: 20, left: 20, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis type="number" allowDecimals={false} />
                      <YAxis type="category" dataKey="name" width={100} />
                      <Tooltip cursor={{fill: 'rgba(239, 246, 255, 0.5)'}} />
                      <Bar dataKey="mentions" name="提及次數" fill="#4f46e5" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </Card>
              
              <Card className="lg:col-span-1">
                <CardTitle warning={accuracyWarning}>各問題資訊正確度分析 (%)</CardTitle>
                 <p className="text-xs text-gray-500 mb-4 -mt-2">比對AI回應與官方描述的覆蓋率</p>
                <div className="flex-grow">
                    <ResponsiveContainer width="100%" height={200}>
                        <BarChart data={accuracyData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="question_id" />
                            <YAxis domain={[0, 100]} />
                            <Tooltip formatter={(value) => `${value}%`} />
                            <Bar dataKey="coverage_rate" name="覆蓋率" fill="#4f46e5" />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
              </Card>
            </div>

            <Card className="lg:col-span-3">
               <CardTitle>品牌與競品在各熱門問題的曝光提及率</CardTitle>
               <ResponsiveContainer width="100%" height={400}>
                <BarChart data={overallMentionData} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis allowDecimals={false} />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey={brand.trim()} name={brand.trim()} fill={BAR_COLORS[0]} />
                    {competitorNames.map((name, index) => (
                        <Bar key={name} dataKey={name} name={name} fill={BAR_COLORS[(index + 1) % BAR_COLORS.length]} />
                    ))}
                </BarChart>
               </ResponsiveContainer>
            </Card>
          </div>
        )}
      </main>
    </div>
  );
} 