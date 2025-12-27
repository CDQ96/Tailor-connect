import { GoogleGenAI, Type } from "@google/genai";
import { Tailor, GroundingChunk } from '../types';

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

// Helper to convert file to Base64
export const fileToGenerativePart = async (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result as string;
      const base64Data = base64String.split(',')[1];
      resolve(base64Data);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

export interface TailorSearchResult {
  tailors: Tailor[]; // Enhanced or found tailors
  grounding?: GroundingChunk[];
}

export const searchTailorsNearby = async (query: string, lat: number, lng: number): Promise<TailorSearchResult> => {
  try {
    // We use gemini-2.5-flash for maps grounding
    const model = 'gemini-2.5-flash';
    
    const response = await ai.models.generateContent({
      model: model,
      contents: `Find tailors or alteration services near this location (Lat: ${lat}, Lng: ${lng}) matching query: "${query}". 
                 Return a list of places. If you find real places, list them.`,
      config: {
        tools: [{ googleMaps: {} }],
        toolConfig: {
          retrievalConfig: {
            latLng: {
              latitude: lat,
              longitude: lng
            }
          }
        }
      }
    });

    const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
    
    // In a real app, we would parse response.text or use the grounding chunks to build Tailor objects.
    // Here we will return the chunks to be displayed as "verified Google Maps results"
    // alongside our mock data.
    
    return {
      tailors: [], // We rely on mock data for the robust app flow, but UI will show these specific map results
      grounding: groundingChunks as GroundingChunk[]
    };

  } catch (error) {
    console.error("Gemini Search Error:", error);
    return { tailors: [] };
  }
};

export const analyzeBodyMeasurement = async (imageFile: File, height: string, weight: string): Promise<any> => {
  try {
    const base64Data = await fileToGenerativePart(imageFile);
    
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: imageFile.type,
              data: base64Data
            }
          },
          {
            text: `Analyze this full body image. The person is ${height}cm tall and weighs ${weight}kg. 
                   Estimate the following measurements in cm: Neck, Chest, Waist, Hips, Inseam, Sleeve, Shoulder.
                   Return ONLY a valid JSON object with these keys and numeric values. Do not include markdown formatting.`
          }
        ]
      },
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            neck: { type: Type.NUMBER },
            chest: { type: Type.NUMBER },
            waist: { type: Type.NUMBER },
            hips: { type: Type.NUMBER },
            inseam: { type: Type.NUMBER },
            sleeve: { type: Type.NUMBER },
            shoulder: { type: Type.NUMBER },
            bodyType: { type: Type.STRING, description: "Short description of body type e.g. Athletic, Curvy" }
          }
        }
      }
    });

    return JSON.parse(response.text || '{}');
  } catch (error) {
    console.error("Gemini Vision Error:", error);
    throw error;
  }
};

export const getSmartSizingAdvice = async (stats: { height: number, weight: number, gender: string }) => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `Based on a ${stats.gender} with Height: ${stats.height}cm and Weight: ${stats.weight}kg, 
                 provide general sizing advice and estimated size range (S/M/L/XL) and typical suit/dress size.
                 Keep it brief and encouraging.`
    });
    return response.text;
  } catch (e) {
    return "Could not generate advice at this time.";
  }
};