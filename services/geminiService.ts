
import { GoogleGenAI } from "@google/genai";
import { FinancialState } from "../types";

// Always use named parameter for apiKey and obtain exclusively from process.env.API_KEY
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const analyzePortfolio = async (data: FinancialState): Promise<string> => {
  try {
    // Summarize data for the prompt to save tokens and provide clarity
    const summary = {
      totalLiquidity: data.accounts.reduce((sum, item) => sum + item.value, 0),
      pensionTotal: data.pensions.reduce((sum, item) => sum + item.value, 0),
      investmentsTotal: data.investments.reduce((sum, item) => sum + item.value, 0),
      realEstateEquity: data.realEstate.reduce((sum, item) => sum + (item.value - item.mortgageBalance), 0),
      details: data
    };

    const prompt = `
      פעל כיועץ פיננסי בכיר מומחה לשוק הישראלי.
      נתח את התיק הפיננסי הבא (הנתונים בשקלים):
      ${JSON.stringify(summary, null, 2)}

      אנא ספק 3 תובנות/המלצות קונקרטיות וקצרות בעברית לגבי:
      1. פיזור סיכונים והקצאת נכסים.
      2. יעילות קרן הביטחון והנזילות.
      3. הצעה לשיפור מבנה התיק (למשל: הגדלת הפקדות לפנסיה, צמצום משכנתא וכו').
      
      שמור על טון מקצועי, מעודד ותמציתי. אל תיתן ייעוץ משפטי מחייב, אלא הכוונה כללית.
      עצב את התשובה כרשימה ממוספרת או בולטים ברורים.
    `;

    // Must use ai.models.generateContent to query GenAI with both the model name and prompt.
    // 'gemini-3-flash-preview' is the correct model for Basic Text Tasks.
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        temperature: 0.7,
      }
    });

    // Access the extracted string output using the .text property (not a method).
    return response.text || "לא ניתן היה לייצר ניתוח כרגע. אנא נסה שוב מאוחר יותר.";
  } catch (error) {
    console.error("Error analyzing portfolio:", error);
    return "אירעה שגיאה בעת ניתוח התיק. אנא בדוק את חיבור האינטרנט שלך ונסה שוב.";
  }
};
