
import { Language } from "../localization";
import { TranslationKeys } from "../localization/en";
import { EyeAnalysisResult, HealthData } from "../types";

// The API Key is expected to be injected by the build environment.
const API_KEY = process.env.API_KEY;

const timeoutPromise = <T>(promise: Promise<T>, ms: number, timeoutErrorKey: keyof TranslationKeys): Promise<T> => {
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
};

const executeGeminiFetch = async (model: string, contents: any, timeout: number = 20000) => {
  // Although the key isn't used in the URL directly, the proxy needs it to be present in the environment.
  if (!API_KEY) {
    console.error("API Key is not configured.");
    throw new Error('error_generic_api_key_missing');
  }

  // CRITICAL CHANGE: Target the local proxy directly. This bypasses the service worker's
  // interception logic for 'generativelanguage.googleapis.com' and prevents it from
  // rebuilding the request as a ReadableStream which fails on the backend.
  const url = `/api-proxy/v1beta/models/${model}:generateContent`;
  
  const body = { contents };

  // CRITICAL CHANGE: Use a simple JSON string body. This is the most universally
  // compatible method and avoids creating a streamable body that the AI Studio
  // proxy cannot handle. This request will use Content-Length instead of
  // Transfer-Encoding: chunked.
  const fetchPromise = fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  const response = await timeoutPromise(fetchPromise, timeout, 'error_generic_api_timeout');

  if (!response.ok) {
    let errorText = 'An unknown API error occurred.';
    try {
        // First, try to parse the error as JSON, which is the expected format.
        const errorBody = await response.json();
        errorText = errorBody.error?.message || JSON.stringify(errorBody);
    } catch (e) {
        // If parsing as JSON fails (e.g., the proxy returned a plain "502 Bad Gateway" string),
        // fall back to reading the raw text of the response.
        errorText = await response.text();
    }
    console.error(`Gemini API Error (${model}): Status ${response.status}. Body:`, errorText);
    throw new Error(`API returned status ${response.status}. Response: ${errorText}`);
  }

  const result = await response.json();

  if (result.candidates?.[0]?.finishReason === 'SAFETY') {
    console.warn(`Gemini analysis blocked for ${model} due to safety reasons:`, result.candidates[0].safetyRatings);
    throw new Error('error_analysis_blocked');
  }

  const text = result.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text || text.trim() === '') {
     console.warn(`AI response text for ${model} is empty. This could be due to safety filters.`);
     return "";
  }
  
  return text;
};

export const getGeneralEyeHealthTips = async (language: Language): Promise<string> => {
  try {
    const localizedPrompt = language === 'es'
      ? "Proporciona 5 consejos concisos y prácticos sobre salud ocular general para adultos. Cada consejo en una nueva línea, comenzando con una viñeta o guion."
      : "Provide 5 concise, actionable general eye health tips for adults. Each tip on a new line, starting with a bullet or dash.";
    
    const text = await executeGeminiFetch("gemini-2.5-flash", {parts: [{text: localizedPrompt}]});

    if (!text) {
      throw new Error('error_generic_no_tips_received');
    }
    return text;

  } catch (error) {
    console.error("Error in getGeneralEyeHealthTips:", error);
    if (error instanceof Error) throw error;
    throw new Error('error_generic_unexpected_api');
  }
};

export const analyzeEyeImage = async (base64Image: string, mimeType: string): Promise<EyeAnalysisResult[]> => {
  const prompt = `You are an AI assistant specialized in analyzing eye images for potential health indicators. Analyze the following image and identify potential signs of common conditions like cataracts, corneal abrasions, or glaucoma indicators.

    **Response Rules:**
    1.  Your response MUST be a valid JSON array of objects.
    2.  Each object must have a "condition" key (one of "cornealAbrasion", "cataract", "glaucoma") and a "riskLevel" key (one of "Low", "Medium", "High", "Undetermined").
    3.  Do NOT include any text, explanation, or markdown formatting (like \`\`\`json) outside of the JSON array.
    4.  If you detect nothing of significance, you MUST return an empty array: [].
    
    Analyze the image and provide only the JSON array.`;

  const contents = [{
    parts:[
      { text: prompt },
      {
        inlineData: {
          mimeType: mimeType,
          data: base64Image,
        },
      },
    ],
  }];

  try {
    const text = await executeGeminiFetch("gemini-2.5-flash", contents, 30000);
    
    if (!text) {
      console.warn("AI response for image analysis was empty. Returning empty array.");
      return [];
    }
    
    let rawJsonString = text.trim();
    if (rawJsonString.startsWith("```json")) {
        rawJsonString = rawJsonString.substring(7);
        if (rawJsonString.endsWith("```")) {
            rawJsonString = rawJsonString.slice(0, -3);
        }
    }
    rawJsonString = rawJsonString.trim();

    let rawResults;
    try {
        rawResults = JSON.parse(rawJsonString);
    } catch (parseError) {
        console.error("Failed to parse AI response as JSON. Content:", rawJsonString);
        throw new Error(`AI returned a non-JSON response. Content: ${rawJsonString}`);
    }

    if (!Array.isArray(rawResults)) {
      console.error("AI response is not a valid array:", rawResults);
      throw new Error('AI returned an invalid format.');
    }
    
    const validConditions = ["cornealAbrasion", "cataract", "glaucoma"];

    return rawResults.map((item: any) => {
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

  } catch (error) {
    console.error("Error in analyzeEyeImage:", error);
    if (error instanceof Error) throw error;
    throw new Error('error_generic_unexpected_api');
  }
};

export const getOphthalmologistSummary = async (
  healthData: HealthData,
  analysisResults: EyeAnalysisResult[],
  language: Language
): Promise<string> => {
  const responseLanguageInstruction = language === 'es'
    ? "Provide the final summary in Spanish."
    : "Provide the final summary in English.";

  const prompt = `
    You are a helpful ophthalmologist's AI assistant. Your role is to provide a comprehensive, easy-to-understand summary for a patient based on their self-reported questionnaire and the results of an AI image analysis.

    **Instructions:**
    1. Start by addressing the patient warmly (e.g., "Hello,").
    2. Review the patient's questionnaire data provided below. This is a JSON object where a value of 'true' indicates a selected option.
    3. For groups like 'symptoms', a value of 'none: true' means the user explicitly selected 'None of the above'.
    4. Review the AI's image analysis findings provided below.
    5. Synthesize all information into a cohesive summary.
    6. If the image analysis found specific conditions (e.g., "High" risk for "cataract"), highlight this finding and explain what it means in simple terms. Correlate it with any relevant questionnaire answers (e.g., "Given your age and reported blurry vision...").
    7. If the image analysis returned no significant findings (the findings list is empty), state this clearly and positively (e.g., "The initial image analysis did not detect any immediate signs of major conditions...").
    8. Even if the image analysis is clear, you MUST highlight 1-2 key risk factors or symptoms from their questionnaire (e.g., family history of glaucoma, reported symptoms) that they should still discuss with a doctor.
    9. Conclude with a clear and strong recommendation to consult a qualified ophthalmologist for a complete examination. Do NOT provide a diagnosis.

    **Patient Questionnaire Data:**
    ${JSON.stringify(healthData, null, 2)}

    **AI Image Analysis Findings (NOTE: conditionKey and detailsKey are translation keys, use the English meaning for your analysis):**
    ${JSON.stringify(analysisResults, null, 2)}

    **Final instruction:** ${responseLanguageInstruction}
  `;

  try {
    const text = await executeGeminiFetch("gemini-2.5-flash", {parts: [{text: prompt}]}, 30000);
    if (!text) {
      throw new Error("Could not generate a summary at this time.");
    }
    return text;
  } catch (error) {
    console.error("Error in getOphthalmologistSummary:", error);
    if (error instanceof Error) throw error;
    throw new Error('error_generic_unexpected_api');
  }
};
