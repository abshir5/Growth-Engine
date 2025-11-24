import { GoogleGenAI, Type } from "@google/genai";
import { Lead, AffiliateProduct, GeneratedContent } from "../types";

// Initialize Gemini Client
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

/**
 * Simulates finding leads by asking the AI to generate realistic personas 
 * based on a specific niche and social media context, considering keywords and negative keywords.
 */
export const findPotentialLeads = async (
  niche: string, 
  keywords: string = "", 
  negativeKeywords: string = "", 
  count: number = 5
): Promise<Lead[]> => {
  try {
    const model = "gemini-2.5-flash";
    
    let filterInstructions = "";
    if (keywords) {
      filterInstructions += `\n      - Focus SPECIFICALLY on people mentioning or interested in: "${keywords}".`;
    }
    if (negativeKeywords) {
      filterInstructions += `\n      - EXCLUDE anyone mentioning or looking for: "${negativeKeywords}".`;
    }

    const prompt = `
      Act as a social media listening tool. 
      Generate ${count} realistic user personas found in Facebook Groups related to the niche: "${niche}".
      ${filterInstructions}
      
      For each person:
      1. Invent a recent comment or post they made that indicates a struggle or need.
      2. Assign a "buying intent score" from 0 to 100 based on how urgent their problem seems.
      3. Generate a realistic dummy URL linking to their specific Facebook post or comment (e.g., https://facebook.com/groups/.../posts/...).
      
      Return a JSON array of objects.
    `;

    const response = await ai.models.generateContent({
      model,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              name: { type: Type.STRING, description: "Full name of the user" },
              sourceGroup: { type: Type.STRING, description: "Name of the Facebook Group they were found in" },
              sourceLink: { type: Type.STRING, description: "A realistic URL to the specific facebook post or comment" },
              painPoint: { type: Type.STRING, description: "The specific problem or struggle they mentioned" },
              intentScore: { type: Type.NUMBER, description: "Score 0-100 indicating likelihood to buy" },
              relevantProductFeature: { type: Type.STRING, description: "What feature of a product would solve their issue" }
            },
            required: ["name", "sourceGroup", "painPoint", "intentScore", "sourceLink"]
          }
        }
      }
    });

    const rawLeads = JSON.parse(response.text || "[]");
    
    // Add client-side IDs and default status
    return rawLeads.map((lead: any, index: number) => ({
      ...lead,
      id: `lead-${Date.now()}-${index}`,
      status: 'new'
    }));

  } catch (error) {
    console.error("Error finding leads:", error);
    return [];
  }
};

/**
 * Generates a high-converting Facebook post tailored to a specific lead's pain point.
 */
export const generatePersuasivePost = async (
  product: AffiliateProduct, 
  lead: Lead
): Promise<Partial<GeneratedContent>> => {
  try {
    const model = "gemini-2.5-flash";
    const prompt = `
      Write a persuasive Facebook post targeting someone struggling with: "${lead.painPoint}".
      The solution is: "${product.name}" (${product.description}).
      
      Requirements:
      1. Use the AIDA (Attention, Interest, Desire, Action) framework.
      2. Be empathetic but authoritative.
      3. Seamlessly embed the affiliate link ("${product.link}") naturally into the text 1 or 2 times.
      4. Keep it under 200 words.
      5. Include a catchy headline.
      
      Return JSON.
    `;

    const response = await ai.models.generateContent({
      model,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            headline: { type: Type.STRING },
            body: { type: Type.STRING }
          }
        }
      }
    });

    const data = JSON.parse(response.text || "{}");
    return {
      headline: data.headline,
      body: data.body,
      affiliateLink: product.link,
      type: 'post',
      targetLeadId: lead.id
    };

  } catch (error) {
    console.error("Error generating post:", error);
    return { headline: "Error", body: "Could not generate content." };
  }
};

/**
 * Generates a visual for the post using Gemini Image model.
 */
export const generatePostImage = async (topic: string): Promise<string | undefined> => {
  try {
    const model = "gemini-2.5-flash-image";
    const prompt = `A professional, high-converting social media image representing: ${topic}. Bright, clean, eye-catching, no text.`;
    
    const response = await ai.models.generateContent({
      model,
      contents: prompt,
    });

    // Extract image from response parts
    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) {
        return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
      }
    }
    return undefined;
  } catch (error) {
    console.error("Error generating image:", error);
    return undefined; // Fallback will be handled in UI
  }
};