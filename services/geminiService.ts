
import { GoogleGenAI, GenerateContentResponse, Type } from "@google/genai";
import { Language } from "../localization";
import { TranslationKeys } from "../localization/en";
import { EyeAnalysisResult, HealthData } from "../types";

let aiInstance: GoogleGenAI | null = null;
let initError: string | null = null;

function getAiInstance(): GoogleGenAI {
  if (initError) {
    throw new Error(initError);
  }
  if (aiInstance) {
    return aiInstance;
  }

  try {
    const apiKey = (typeof process !== 'undefined' && process.env && process.env.API_KEY)
      ? process.env.API_KEY
      : null;

    if (!apiKey) {
      console.error("API_KEY for Gemini is not set. Please set the environment variable.");
      initError = 'error_generic_api_key_missing';
      throw new Error(initError);
    }
    
    aiInstance = new GoogleGenAI({ apiKey });
    return aiInstance;

  } catch (error) {
    console.error("Failed to initialize Gemini AI Service:", error);
    if (error instanceof Error && error.message.startsWith('error_')) {
        initError = error.message;
    } else {
        initError = 'error_generic_unexpected_api';
    }
    throw new Error(initError);
  }
}

function timeoutPromise<T>(promise: Promise<T>, ms: number, timeoutErrorKey: keyof TranslationKeys): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error(timeoutErrorKey));
    }, ms);

    promise
      .then(value => {
        clearTimeout(timer);
        resolve(value);
      })
      .catch(reason => {
        clearTimeout(timer);
        reject(reason);
      });
  });
}

const getLocalizedPrompt = (language: Language): string => {
  if (language === 'es') {
    return "Proporciona 5 consejos concisos y prácticos sobre salud ocular general para adultos. Cada consejo en una nueva línea, comenzando con una viñeta o guion.";
  }
  return "Provide 5 concise, actionable general eye health tips for adults. Each tip on a new line, starting with a bullet or dash.";
};

export const getGeneralEyeHealthTips = async (language: Language): Promise<string> => {
  try {
    const ai = getAiInstance();
    const localizedPrompt = getLocalizedPrompt(language);

    const responsePromise = ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: localizedPrompt,
      config: {
        temperature: 0.7,
        topK: 40,
        topP: 0.95,
      }
    });

    const response = await timeoutPromise(responsePromise, 20000, 'error_generic_api_timeout');
    
    const text = response.text;
    
    if (!text) {
      throw new Error('error_generic_no_tips_received');
    }
    return text;

  } catch (error) {
    console.error("Error fetching eye health tips from Gemini:", error);
    if (error instanceof Error) {
       if (error.message.startsWith('error_generic_')) {
          throw error;
       }
       if (error.message.includes("API key not valid")) {
         throw new Error('error_generic_api_key_invalid' as keyof TranslationKeys);
      }
    }
    throw new Error('error_generic_unexpected_api' as keyof TranslationKeys);
  }
};

/**
 * Analyzes an eye image using the Gemini API.
 * @param base64Image - The eye image encoded in base64 format without the data URL prefix.
 * @returns A promise that resolves to an array of EyeAnalysisResult objects.
 */
export const analyzeEyeImage = async (base64Image: string): Promise<EyeAnalysisResult[]> => {
  try {
    const ai = getAiInstance();
    
    const prompt = `You are an AI assistant specialized in analyzing eye images for potential health indicators. Analyze the following image and identify potential signs of common conditions like cataracts, corneal abrasions, or glaucoma indicators. For each potential finding, provide a condition name and a risk level.
    Respond ONLY with a valid JSON array of objects based on the provided schema. If you detect nothing of significance, return an empty array [].`;

    const imagePart = {
      inlineData: {
        mimeType: 'image/jpeg',
        data: base64Image,
      },
    };

    const textPart = { text: prompt };

    const responsePromise = ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: [{ parts: [textPart, imagePart] }],
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              condition: {
                type: Type.STRING,
                description: 'A machine-readable key for the condition.',
                enum: ["cornealAbrasion", "cataract", "glaucoma"],
              },
              riskLevel: {
                type: Type.STRING,
                enum: ['Low', 'Medium', 'High', 'Undetermined'],
                description: 'The assessed risk level.',
              },
            },
            required: ['condition', 'riskLevel'],
          },
        },
      },
    });
    
    const response = await timeoutPromise(responsePromise, 30000, 'error_generic_api_timeout');
    const rawJsonString = response.text.trim();

    if (!rawJsonString) {
        return [];
    }

    const rawResults = JSON.parse(rawJsonString);
    if (!Array.isArray(rawResults)) {
      console.error("AI response is not an array:", rawResults);
      return [];
    }
    
    const validConditions = ["cornealAbrasion", "cataract", "glaucoma"];

    const results: EyeAnalysisResult[] = rawResults.map((item: any) => {
      if (typeof item !== 'object' || !item.condition || !validConditions.includes(item.condition) || !item.riskLevel) {
        console.warn("Invalid item from AI, skipping:", item);
        return null;
      }
      return {
        conditionKey: `results_condition_${item.condition}`,
        riskLevel: item.riskLevel,
        detailsKey: `results_details_${item.condition}`,
      };
    }).filter((item): item is EyeAnalysisResult => item !== null);

    return results;

  } catch (error) {
    console.error("Error analyzing eye image with Gemini:", error);
    if (error instanceof Error) {
      if (error.message.startsWith('error_')) {
          throw error;
      }
      if (error.message.includes("API key not valid")) {
        throw new Error('error_generic_api_key_invalid');
      }
       if (error.message.includes("prompt was blocked")) {
        throw new Error('error_analysis_blocked');
      }
    }
    throw new Error('error_generic_unexpected_api');
  }
};


/**
 * Generates an AI ophthalmologist's summary based on health data and image analysis results.
 * @param healthData - The user's questionnaire answers.
 * @param analysisResults - The results from the image analysis (can be an empty array).
 * @param language - The language for the response.
 * @returns A promise that resolves with a text string containing the summary.
 */
export const getOphthalmologistSummary = async (
  healthData: HealthData,
  analysisResults: EyeAnalysisResult[],
  language: Language
): Promise<string> => {
  try {
    const ai = getAiInstance();

    const responseLanguageInstruction = language === 'es'
      ? "Provide the final summary in Spanish."
      : "Provide the final summary in English.";

    const prompt = `
      You are a helpful ophthalmologist's AI assistant. Your role is to provide a comprehensive, easy-to-understand summary for a patient based on their self-reported questionnaire and the results of an AI image analysis.

      **Instructions:**
      1. Start by addressing the patient warmly (e.g., "Hello,").
      2. Review the patient's questionnaire data provided below. Note that for illnesses, family history, symptoms, and occupational hazards, an empty array [] or an array containing just "none" means the patient reports none of those.
      3. Review the AI's image analysis findings provided below.
      4. Synthesize all information into a cohesive summary.
      5. If the image analysis found specific conditions (e.g., "High" risk for "cataract"), highlight this finding and explain what it means in simple terms. Correlate it with any relevant questionnaire answers (e.g., "Given your age and reported blurry vision...").
      6. If the image analysis returned no significant findings (the findings list is empty), state this clearly and positively (e.g., "The initial image analysis did not detect any immediate signs of major conditions...").
      7. **Crucially, pay special attention to 'screenTime' and 'occupationalHazards'.** If the user reports long screen time (e.g., '4-8 hours', '>8 hours'), connect it to symptoms like 'Tired or fatigued eyes'. If they report occupational hazards, mention the potential risks (e.g., chemical exposure, foreign bodies) and the importance of protective eyewear.
      8. Even if the image analysis is clear, you MUST highlight 1-2 key risk factors or symptoms from their questionnaire (e.g., family history of glaucoma, reported symptoms, high-risk job) that they should still discuss with a doctor.
      9. Conclude with a clear and strong recommendation to consult a qualified ophthalmologist for a complete examination. Do NOT provide a diagnosis.

      **Patient Questionnaire Data:**
      ${JSON.stringify(healthData)}

      **AI Image Analysis Findings (NOTE: conditionKey and detailsKey are translation keys, use the English meaning for your analysis):**
      ${JSON.stringify(analysisResults)}

      **Final instruction:** ${responseLanguageInstruction}
    `;
    
    const responsePromise = ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        temperature: 0.5,
      }
    });

    const response = await timeoutPromise(responsePromise, 30000, 'error_generic_api_timeout');

    const text = response.text;
    if (!text) {
      throw new Error("Could not generate a summary at this time.");
    }
    return text;

  } catch (error) {
    console.error("Error fetching summary:", error);
    if (error instanceof Error && error.message.startsWith('error_')) {
      throw error;
    }
    throw new Error('error_generic_unexpected_api');
  }
};