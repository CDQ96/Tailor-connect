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
    // Maps grounding requires a Gemini 2.5 series model.
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
    
    // Use gemini-3-flash-preview for multimodal input and structured JSON output.
    // gemini-2.5-flash-image is for generating images and does not support responseMimeType.
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
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
      model: 'gemini-3-flash-preview',
      contents: `Based on a ${stats.gender} with Height: ${stats.height}cm and Weight: ${stats.weight}kg, 
                 provide general sizing advice and estimated size range (S/M/L/XL) and typical suit/dress size.
                 Keep it brief and encouraging.`
    });
    return response.text;
  } catch (e) {
    return "Could not generate advice at this time.";
  }
};

export const generateStylePreview = async (imageFile: File, garmentDescription: string, materialName: string, materialColor: string): Promise<string | null> => {
  try {
    const base64Data = await fileToGenerativePart(imageFile);
    
    // Use gemini-2.5-flash-image for image generation tasks
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
            text: `Generate a photorealistic image of this person wearing a ${garmentDescription} made of ${materialName} (${materialColor}). 
                   Keep the pose, body shape, and face consistent with the original image. 
                   The background should remain similar or neutral. High fashion photography style.`
          }
        ]
      },
      config: {
        // No responseMimeType for image generation in this model
      }
    });

    // Extract image from response parts
    if (response.candidates?.[0]?.content?.parts) {
      for (const part of response.candidates[0].content.parts) {
        if (part.inlineData && part.inlineData.data) {
           return `data:image/png;base64,${part.inlineData.data}`;
        }
      }
    }
    return null;
  } catch (error) {
    console.error("Gemini Style Gen Error:", error);
    throw error;
  }
};

export const generateRunwayVideo = async (imageBase64: string): Promise<string | null> => {
  try {
    // We need to re-instantiate with the specific key potentially if managed externally, 
    // but assuming process.env.API_KEY works for now.
    // IMPORTANT: For Veo, the user must often select a key via the window.aistudio interface if not hardcoded.
    // The component calling this should handle the auth check.
    
    // Clean base64 string if it has the data prefix
    const cleanBase64 = imageBase64.replace(/^data:image\/(png|jpeg|jpg);base64,/, "");

    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

    let operation = await ai.models.generateVideos({
      model: 'veo-3.1-fast-generate-preview',
      prompt: 'Cinematic fashion runway shot. The model walks confidently towards the camera. Professional fashion lighting, 4k resolution, slow motion.',
      image: {
        imageBytes: cleanBase64,
        mimeType: 'image/png', // Assuming PNG from previous step
      },
      config: {
        numberOfVideos: 1,
        resolution: '720p',
        aspectRatio: '9:16'
      }
    });

    // Poll for completion
    while (!operation.done) {
      await new Promise(resolve => setTimeout(resolve, 5000)); // Wait 5s
      operation = await ai.operations.getVideosOperation({ operation: operation });
    }

    const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;
    
    if (downloadLink) {
        // Proxy through fetch to get blob or return link with key? 
        // The instructions say: "You must append an API key when fetching from the download link."
        // We will return the link and let the component handle the authenticated fetch or signed URL logic if needed.
        // For simple display, we might need to fetch the blob.
        
        const videoRes = await fetch(`${downloadLink}&key=${process.env.API_KEY}`);
        const blob = await videoRes.blob();
        return URL.createObjectURL(blob);
    }
    return null;

  } catch (error) {
    console.error("Veo Video Gen Error:", error);
    throw error;
  }
};

export const getChatSuggestions = async (lastMessage: string, userRole: string): Promise<string[]> => {
  try {
    const roleDesc = userRole === 'TAILOR' ? 'professional tailor' : 'customer';
    
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `You are assisting a ${roleDesc} in a chat application. 
                 The other person said: "${lastMessage}".
                 Provide 3 short, polite, and relevant quick replies (max 10 words each) for the ${roleDesc} to send back.
                 Return ONLY a JSON array of strings.`,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
            type: Type.ARRAY,
            items: { type: Type.STRING }
        }
      }
    });
    
    return JSON.parse(response.text || '[]');
  } catch (error) {
    console.error("Gemini Chat Suggestion Error:", error);
    return [];
  }
};

export const analyzeFabric = async (file: File): Promise<any> => {
  try {
    const base64Data = await fileToGenerativePart(file);
    
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: {
        parts: [
          { inlineData: { mimeType: file.type, data: base64Data } },
          { text: `Analyze this fabric swatch. Identify the material type (e.g. Silk, Wool), 
                   pattern (e.g. Houndstooth, Floral), weave (e.g. Twill, Satin), and primary colors.
                   Suggest 3 garment styles that would look best with this fabric.
                   Provide brief care instructions.
                   Return JSON.` }
        ]
      },
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            material: { type: Type.STRING },
            pattern: { type: Type.STRING },
            weave: { type: Type.STRING },
            colors: { type: Type.ARRAY, items: { type: Type.STRING } },
            careInstructions: { type: Type.STRING },
            recommendedStyles: { 
              type: Type.ARRAY, 
              items: { 
                type: Type.OBJECT,
                properties: {
                  name: { type: Type.STRING },
                  description: { type: Type.STRING }
                }
              } 
            }
          }
        }
      }
    });
    
    return JSON.parse(response.text || '{}');
  } catch (error) {
    console.error("Fabric Analysis Error", error);
    throw error;
  }
};