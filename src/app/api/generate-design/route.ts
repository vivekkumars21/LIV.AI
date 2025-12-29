import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

// Initialize Gemini API
const genAI = new GoogleGenerativeAI(process.env.NEXT_PUBLIC_GEMINI_API_KEY || '');

export async function POST(req: NextRequest) {
    try {
        const formData = await req.formData();
        const image = formData.get('image') as File;

        // Construct User Preferences object from formData
        const userPreferences = {
            roomType: formData.get('roomType') as string || "Living Room",
            style: formData.get('style') as string || "Modern",
            budget: formData.get('budget') as string || "Medium",
            colorTone: formData.get('colorTone') as string || "Warm",
            country: "India"
        };

        // Execute the main workflow
        const result = await generateDesignedRoom(image, userPreferences);

        return NextResponse.json(result);

    } catch (error) {
        console.error("Generate error:", error);
        return NextResponse.json(
            { error: 'Failed to generate design' },
            { status: 500 }
        );
    }
}

// 1️⃣ MAIN WORKFLOW FUNCTION
async function generateDesignedRoom(userImage: File, userPreferences: any) {
    // Step 1: Validate input
    if (!userImage) {
        throw new Error("Room image is required");
    }

    // Step 2: Store original image (Simulated)
    // In a real app: const imageURL = await uploadToCloud(userImage);
    const imageURL = "uploaded_image_processed";

    // Step 3: Build AI prompt
    const prompt = buildDesignPrompt(imageURL, userPreferences);

    // Step 4: Call AI image generation
    const generatedImage = await callImageGenerationModel(
        imageURL,
        prompt
    );

    // Step 5: Save generated image (Simulated - logic is inside callImageGenerationModel for now)
    const resultURL = generatedImage;

    // Step 6: Return response
    return {
        originalImage: imageURL,
        designedImage: resultURL,
        style: userPreferences.style,
        roomType: userPreferences.roomType,
        generatedPrompt: prompt
    };
}

// 2️⃣ BUILD DESIGN PROMPT FUNCTION (Most Important)
function buildDesignPrompt(imageURL: string, preferences: any) {
    let prompt = "Redesign the room in the image into a ";

    prompt += preferences.style + " ";
    prompt += preferences.roomType + ". ";

    prompt += "Keep the same room layout, walls, windows, and camera angle. ";

    if (preferences.budget === "Low") {
        prompt += "Use budget-friendly furniture and simple materials. ";
    }

    if (preferences.budget === "High") {
        prompt += "Use premium furniture and luxury materials. ";
    }

    if (preferences.colorTone) {
        prompt += "Use " + preferences.colorTone + " color tones. ";
    }

    prompt += "Design suitable for Indian homes. ";
    prompt += "Use realistic lighting and photorealistic style.";

    return prompt;
}

// 3️⃣ IMAGE GENERATION FUNCTION (AI Call)
async function callImageGenerationModel(baseImage: string, prompt: string) {
    const parameters = {
        image: baseImage,
        prompt: prompt,
        strength: 0.4,
        guidanceScale: 8,
        steps: 35
    };

    console.log("Calling AI Model with parameters:", parameters);

    // SIMULATION OF AI GENERATION
    // Since we don't have a live Stable Diffusion API key, we simulate the output.
    await new Promise(resolve => setTimeout(resolve, 3000));

    // Return a high-quality context-aware image
    const mockImages = [
        "/images/living-room.png",
        "/images/bedroom.png",
        "/images/dining-room.png",
        "/images/hero.png"
    ];

    let resultImage = "/images/living-room.png"; // Default

    if (prompt.toLowerCase().includes('bed')) resultImage = "/images/bedroom.png";
    else if (prompt.toLowerCase().includes('dining')) resultImage = "/images/dining-room.png";
    else if (prompt.toLowerCase().includes('living')) resultImage = "/images/living-room.png";

    return resultImage;
}
