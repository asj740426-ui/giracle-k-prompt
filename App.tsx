import React, { useState, useEffect, useCallback, useMemo } from 'react';
// Fix: Import `Type` for response schema
import { GoogleGenAI, Modality, Type } from '@google/genai';
import { t, Language } from './localization/i18n';
import type { Preset, PromptState, AnalyzedData, PersonState, VisionFeature, UploadedImageState, ImagePart } from './types';
import { PRESETS_DATA, LEGWEAR_OPTIONS, SHOES, FIXED_PROMPTS, STYLE_PROMPT_MAP, CHARACTER_OPTIONS, HAIR_STYLE_OPTIONS, HAIR_COLOR_OPTIONS, BACKGROUND_OPTIONS, TIME_OF_DAY_OPTIONS, WEATHER_OPTIONS, RANDOM_POSES, AGE_OPTIONS, WEAPON_OPTIONS, ASSAULT_RIFLE_MODELS, REVOLVER_MODELS, PISTOL_MODELS, SNIPER_RIFLE_MODELS, VEHICLE_OPTIONS, PET_OPTIONS, PLURAL_WEAPONS, ASPECT_RATIOS, CAMERA_BODIES, LENSES, CAMERA_COMPOSITION_OPTIONS, ERA_OPTIONS } from './constants';
import { any, suggestShoes, createDefaultPerson, analyzeSceneFromTitle, analyzeOutfitFromCharacter, getStyleDescriptionFromSearch, segmentObjectFromScribble, analyzeRealifiedImageForPrompt } from './utils';

import Header from './components/Header';
import ControlPanel from './components/ControlPanel';
import PromptDisplay from './components/PromptDisplay';
import ImagePreview from './components/ImagePreview';
import Manual from './components/Manual';
import StyleTransferPreview from './components/StyleTransferPreview';
import ImageModal from './components/ImageModal';
import ImageEditModal from './components/ImageEditModal';

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const PHOTO_STYLES = new Set([
  'figure',
  '3d',
  'miniature',
  'bust_shot',
  'fashion',
  'movie_poster',
  'gigantic',
  'big_head',
  'snapshot',
  'selfie',
]);

const pluralizeWeapon = (weaponName: string): string => {
    const words = weaponName.split(' ');
    const lastWord = words.pop() as string;
    if (lastWord.endsWith('s')) {
        words.push(lastWord);
    } else {
        words.push(lastWord + 's');
    }
    return words.join(' ');
}

const App: React.FC = () => {
    const [presets, setPresets] = useState<Preset[]>(PRESETS_DATA);
    const [promptState, setPromptState] = useState<PromptState>(() => {
        const defaultPerson = createDefaultPerson(1);
        return {
            aspect: '9:16',
            customAR: '',
            cameraBody: 'Sony A7R V',
            lensSelect: '85mm f/1.2',
            exposure: 'ISO 100, 1/125s',
            wb: '',
            cameraComposition: '',
            timeOfDay: '__random__',
            weather: '__random__',
            background: '__random__',
            atmosphere: '',
            removeBackground: false,
            numberOfPeople: '1',
            people: [defaultPerson],
            customSubject: '',
            pose: '__random__',
            vehicle: '',
            pet: '',
            eraSelect: '',
            activeStyle: '',
            fixedPrompts: ['quality', 'details', 'photo'],
        }
    });

    const [logs, setLogs] = useState<string[]>(['Welcome to Giracle-K Prompt Builder!']);
    const [isGenerating, setIsGenerating] = useState(false);
    const [generatedImages, setGeneratedImages] = useState<ImagePart[]>([]);
    const [analyzedData, setAnalyzedData] = useState<AnalyzedData | null>(null);
    const [editPrompt, setEditPrompt] = useState('');
    const [isEditPromptDirty, setIsEditPromptDirty] = useState(false);
    const [lastEditedImage, setLastEditedImage] = useState<ImagePart | null>(null);
    const [directBackgroundImage, setDirectBackgroundImage] = useState<ImagePart | null>(null);
    const [isAnalyzingScene, setIsAnalyzingScene] = useState(false);
    const [activePersonIndex, setActivePersonIndex] = useState(0);
    const [isAnalyzingOutfit, setIsAnalyzingOutfit] = useState(false);
    const [isGeneratingVideo, setIsGeneratingVideo] = useState(false);
    const [showManual, setShowManual] = useState(false);
    const [language, setLanguage] = useState<Language>('ko');
    
    const [styleTransferResult, setStyleTransferResult] = useState<{ original: ImagePart; styled: ImagePart; styleKey: string; } | null>(null);
    const [isStyling, setIsStyling] = useState(false);
    const [isColorizing, setIsColorizing] = useState(false);
    const [selectedImage, setSelectedImage] = useState<ImagePart | null>(null);
    const [editingImage, setEditingImage] = useState<ImagePart | null>(null);
    const [realifiedPrompt, setRealifiedPrompt] = useState<string | null>(null);
    const [isAnalyzingRealifiedPrompt, setIsAnalyzingRealifiedPrompt] = useState(false);
    const [promptVerbosity, setPromptVerbosity] = useState<'detailed' | 'concise'>('detailed');
    const [analyzedPromptVerbosity, setAnalyzedPromptVerbosity] = useState<'detailed' | 'concise'>('detailed');
    const [regenerationCount, setRegenerationCount] = useState(0);

    const [activeVisionFeature, setActiveVisionFeature] = useState<VisionFeature>('analyze');
    const [uploadedImageData1, setUploadedImageData1] = useState<UploadedImageState | null>(null);
    const [uploadedImageDataRealify, setUploadedImageDataRealify] = useState<UploadedImageState | null>(null);

    
    // This effect synchronizes the `people` array with the `numberOfPeople` setting.
    useEffect(() => {
        setPromptState(prevState => {
            // Resolve the target number of people, handling the "random" case.
            const numPeopleStr = prevState.numberOfPeople === '__random__' 
                ? String(Math.floor(Math.random() * 5) + 1) 
                : prevState.numberOfPeople;
            const numPeople = parseInt(numPeopleStr, 10) || 1;

            // If the array length already matches, do nothing.
            if (numPeople === prevState.people.length) {
                return prevState;
            }

            const currentPeople = prevState.people;
            const newPeople = [...currentPeople];
            
            // Add new default people if the count has increased.
            if (numPeople > currentPeople.length) {
                for (let i = currentPeople.length; i < numPeople; i++) {
                    newPeople.push(createDefaultPerson(i + 1));
                }
            } else { // Truncate the array if the count has decreased.
                newPeople.length = numPeople;
            }
            
            return { ...prevState, people: newPeople };
        });
    }, [promptState.numberOfPeople]); // Only depends on the user's selection.

    // This effect ensures the active person index is always valid, especially after the number of people changes.
    useEffect(() => {
        const numPeople = promptState.people.length;
        if (activePersonIndex >= numPeople) {
            setActivePersonIndex(Math.max(0, numPeople - 1));
        }
    }, [promptState.people.length, activePersonIndex]);

    const addLog = useCallback((message: string) => {
        setLogs(prevLogs => [`[${new Date().toLocaleTimeString()}] ${message}`, ...prevLogs].slice(0, 100));
    }, []);
    
    const getActiveImageForStyling = useCallback((): ImagePart | null => {
        // Priority:
        // 1. Result of a previous style transfer, if available.
        if (styleTransferResult?.styled) return styleTransferResult.styled;
        // 2. Result of a direct image edit.
        if (lastEditedImage) return lastEditedImage;
        // 3. Result of an image generation.
        if (generatedImages.length > 0) return generatedImages[0];
        // 4. Image uploaded in the currently active vision tab.
        if (activeVisionFeature === 'realify' && uploadedImageDataRealify) return uploadedImageDataRealify;
        if ((activeVisionFeature === 'analyze' || activeVisionFeature === 'edit') && uploadedImageData1) return uploadedImageData1;
        // 5. Fallback to any uploaded image if the active tab doesn't have one.
        if (uploadedImageData1) return uploadedImageData1;
        if (uploadedImageDataRealify) return uploadedImageDataRealify;
        
        return null;
    }, [styleTransferResult, lastEditedImage, generatedImages, activeVisionFeature, uploadedImageData1, uploadedImageDataRealify]);

    const promptParts = useMemo(() => {
        const state = promptState;
        
        const resolveRandom = (value: string, options: { v: string }[]): string => {
            if (value === '__random__') {
                const validOptions = options.filter(o => o.v && o.v !== '__random__');
                return any(validOptions).v;
            }
            return value;
        };
        
        const resolvedTimeOfDay = resolveRandom(state.timeOfDay, TIME_OF_DAY_OPTIONS);
        const resolvedWeather = resolveRandom(state.weather, WEATHER_OPTIONS);
        let resolvedBackground = resolveRandom(state.background, BACKGROUND_OPTIONS);
        const resolvedPose = state.pose === '__random__' ? any(RANDOM_POSES) : state.pose;
        const resolvedVehicle = resolveRandom(state.vehicle, VEHICLE_OPTIONS);
        const resolvedPet = resolveRandom(state.pet, PET_OPTIONS);

        let mainParts: string[] = [];
        
        if (state.customSubject) {
            mainParts.push(state.customSubject);
        } else {
            const numPeople = state.people.length || 1;
            const peopleDescriptions: string[] = [];
            const subjectTerms = [];
            
            if (numPeople === 1) subjectTerms.push('1girl');
            if (numPeople > 1) subjectTerms.push(`${numPeople}girls`);

            for (let i = 0; i < numPeople; i++) {
                const person = state.people[i];
                if (!person) continue;
                
                let personDescParts: string[] = [];
                
                let resolvedAge = resolveRandom(person.ageSelect, AGE_OPTIONS);

                const bodyShapePrefixes: string[] = [];
                if (person.hasRippedBody) {
                    bodyShapePrefixes.push('ripped');
                }
                if (person.hasHourglassWaist) {
                    bodyShapePrefixes.push('hourglass-shaped');
                }

                if (bodyShapePrefixes.length > 0 && resolvedAge) {
                    resolvedAge = `a ${bodyShapePrefixes.join(', ')} ${resolvedAge}`;
                }

                const resolvedChar1 = resolveRandom(person.characterSelect, CHARACTER_OPTIONS);
                const resolvedChar2 = person.characterSelect2;

                let charDesc = '';
                if (resolvedChar1 && resolvedChar2 && resolvedChar1 !== resolvedChar2) {
                    charDesc = `half-${resolvedChar1}, half-${resolvedChar2}`;
                } else {
                    charDesc = resolvedChar1 || resolvedChar2;
                }
                
                if (resolvedAge) personDescParts.push(resolvedAge);
                if (charDesc) personDescParts.push(charDesc);
                
                if (person.hasCurvyFigure) {
                    personDescParts.push(t('controlPanel.buttons.curvyBody', 'en'));
                }
                
                const resolvedHairStyle = resolveRandom(person.hairStyle, HAIR_STYLE_OPTIONS.map(h => ({v: h.v})));
                const resolvedHairColor = resolveRandom(person.hairColor, HAIR_COLOR_OPTIONS);
                
                let hairDesc = [resolvedHairColor, person.hairLength, resolvedHairStyle].filter(Boolean).join(' ');
                if (person.hairWind) {
                    hairDesc += `, hair blowing in ${person.hairWind} wind`;
                }
                if (hairDesc) personDescParts.push(hairDesc);
                
                if (person.customOutfit) {
                    let outfitDesc = person.customOutfit;
                    if (person.metallicOutfit) {
                        outfitDesc = `metallic ${outfitDesc}`;
                    }
                    personDescParts.push(outfitDesc);
                }
                
                const legwearItems = [person.pantyhose, person.stockings, person.leggings].filter(Boolean);
                let legwearDesc = legwearItems.join(', ');
                if (person.socks) {
                    if (legwearDesc) {
                        legwearDesc = `${legwearDesc}, wearing ${person.socks} over them`;
                    } else {
                        legwearDesc = `wearing ${person.socks}`;
                    }
                }
                if (legwearDesc) personDescParts.push(legwearDesc);
                
                let shoeDesc = person.shoe;
                if (!shoeDesc) {
                    if (person.shoeQuick === 'auto') {
                        shoeDesc = suggestShoes(person.customOutfit, legwearDesc);
                    } else if (person.shoeQuick && person.shoeQuick !== 'random' && person.shoeQuick !== 'auto') {
                        shoeDesc = SHOES.find(s => s.t === `options.shoeQuick.${person.shoeQuick}`)?.v || person.shoeQuick;
                    } else if (person.shoeQuick === 'random') {
                        shoeDesc = any(SHOES.filter(s => s.v !== 'auto' && s.v !== 'random').map(s=>s.v));
                    }
                }
                if (shoeDesc) personDescParts.push(`wearing ${shoeDesc}`);
                
                [person.hat, person.glasses, person.earrings, person.necklace].forEach(item => {
                    if(item) personDescParts.push(`wearing ${item}`);
                });
                if (person.bag) personDescParts.push(`carrying a ${person.bag}`);
                
                let resolvedWeapon = resolveRandom(person.weapon, WEAPON_OPTIONS);
                if (resolvedWeapon) {
                    if (resolvedWeapon === 'assault rifle') resolvedWeapon = any(ASSAULT_RIFLE_MODELS);
                    else if (resolvedWeapon === 'revolver') resolvedWeapon = any(REVOLVER_MODELS);
                    else if (resolvedWeapon === 'automatic pistol') resolvedWeapon = any(PISTOL_MODELS);
                    else if (resolvedWeapon === 'sniper rifle') resolvedWeapon = any(SNIPER_RIFLE_MODELS);
                    
                    let weaponText = '';
                    const quantity = person.weaponQuantity;
                    const isPlural = PLURAL_WEAPONS.has(resolvedWeapon);

                    if (isPlural) {
                        weaponText = `holding ${resolvedWeapon}`;
                    } else if (quantity === '2') {
                        weaponText = `dual-wielding ${pluralizeWeapon(resolvedWeapon)}`;
                    } else if (quantity === 'multiple') {
                        weaponText = `holding multiple ${pluralizeWeapon(resolvedWeapon)}`;
                    } else {
                        weaponText = `holding a ${resolvedWeapon}`;
                    }
                    personDescParts.push(weaponText);
                }
                
                peopleDescriptions.push(personDescParts.join(', '));
            }
            
            if (numPeople === 1) {
                mainParts.push([subjectTerms.join(', '), ...peopleDescriptions].filter(Boolean).join(', '));
            } else {
                mainParts.push(subjectTerms.join(', '));
                peopleDescriptions.forEach((desc, index) => {
                    mainParts.push(`(Person ${index + 1}: ${desc})`);
                });
            }
        }
        
        if (resolvedPose) mainParts.push(resolvedPose);

        if (state.removeBackground) {
            mainParts.push("on a plain white background, simple background, studio background");
        } else {
             if (resolvedBackground) mainParts.push(`in ${resolvedBackground}`);
        }
       
        if (resolvedVehicle) mainParts.push(`with a ${resolvedVehicle}`);
        if (resolvedPet) mainParts.push(`with a ${resolvedPet}`);
        
        let styleParts: string[] = [];
        const isPhotoStyle = state.fixedPrompts.includes('photo') || PHOTO_STYLES.has(state.activeStyle);

        // Add base style: anime by default, unless photo is selected.
        if (!isPhotoStyle) {
            styleParts.push('semi-realistic, illustration, 2.5d, detailed, painterly, beautiful detailed face');
        }

        // Add fixed prompts
        state.fixedPrompts.forEach(key => {
            // Special handling for sd_style if photo is OFF to ensure anime style
            if (key === 'sd_style' && !isPhotoStyle) {
                styleParts.push('cute chibi figure, anime style, super deformed (SD) style, 2 heads tall, large expressive eyes');
            } else {
                const prompt = FIXED_PROMPTS.find(p => p.key === key)?.prompt;
                if (prompt) styleParts.push(prompt);
            }
        });

        // Add camera/photo details only if photo style is enabled
        if (isPhotoStyle) {
            if(state.cameraBody) styleParts.push(state.cameraBody);
            if(state.lensSelect) styleParts.push(state.lensSelect);
            if(state.exposure) styleParts.push(`shot on ${state.exposure}`);
            if(state.wb) styleParts.push(`white balance ${state.wb}`);
        }

        if(state.cameraComposition) styleParts.push(state.cameraComposition);
        if(state.eraSelect) styleParts.push(state.eraSelect);
        
        if(state.activeStyle && STYLE_PROMPT_MAP[state.activeStyle]) {
            styleParts.push(STYLE_PROMPT_MAP[state.activeStyle]);
        }
        
        const paramsParts: string[] = [];
        const aspectRatio = state.aspect === '' ? state.customAR : state.aspect;
        if (aspectRatio) paramsParts.push(`--ar ${aspectRatio}`);
        
        return {
            main: mainParts.join(', '),
            placeholder: '',
            style: styleParts.join(', '),
            params: paramsParts.join(' ')
        };
    }, [promptState, t, regenerationCount]);

    const clearPrompt = useCallback(() => {
        const defaultPerson = createDefaultPerson(1);
        setPromptState({
            aspect: '9:16',
            customAR: '',
            cameraBody: 'Sony A7R V',
            lensSelect: '85mm f/1.2',
            exposure: 'ISO 100, 1/125s',
            wb: '',
            cameraComposition: '',
            timeOfDay: '__random__',
            weather: '__random__',
            background: '__random__',
            atmosphere: '',
            removeBackground: false,
            numberOfPeople: '1',
            people: [defaultPerson],
            customSubject: '',
            pose: '__random__',
            vehicle: '',
            pet: '',
            eraSelect: '',
            activeStyle: '',
            fixedPrompts: ['quality', 'details', 'photo'],
        });
        setGeneratedImages([]);
        setAnalyzedData(null);
        setEditPrompt('');
        setIsEditPromptDirty(false);
        setLastEditedImage(null);
        setDirectBackgroundImage(null);
        setStyleTransferResult(null);
        setRealifiedPrompt(null);
        addLog('Prompt cleared and reset to default.');
    }, [addLog]);

    const onRegenerate = useCallback(() => {
        setRegenerationCount(c => c + 1);
        addLog('Random values regenerated.');
    }, [addLog]);

    const statusBarText = useMemo(() => {
        const { main, style, params } = promptParts;
        const fullPrompt = [main, style, params].filter(Boolean).join(' ');
        const charCount = fullPrompt.length;
        const wordCount = fullPrompt.split(/\s+/).filter(Boolean).length;
        return `Chars: ${charCount} | Words: ${wordCount}`;
    }, [promptParts]);

    const onGenerateImage = useCallback(async () => {
        setIsGenerating(true);
        addLog(t('app.logs.generating', language));
        setGeneratedImages([]);
        setLastEditedImage(null);
        setStyleTransferResult(null);
    
        try {
            const fullPrompt = [promptParts.main, promptParts.style].filter(Boolean).join(', ');
    
            const parts: ( { text: string } | { inlineData: { data: string; mimeType: string; } } )[] = [{ text: fullPrompt }];
    
            if (directBackgroundImage) {
                parts.unshift({
                    inlineData: {
                        data: directBackgroundImage.base64,
                        mimeType: directBackgroundImage.mimeType,
                    }
                });
            }
            
            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash-image',
                contents: { parts },
                config: {
                    responseModalities: [Modality.IMAGE],
                },
            });
            
            const imagePart = response.candidates?.[0]?.content?.parts?.find(p => p.inlineData);
    
            if (!imagePart?.inlineData) {
                const finishReason = response.candidates?.[0]?.finishReason;
                const safetyRatings = response.candidates?.[0]?.safetyRatings;
                if (finishReason === 'SAFETY') {
                    const categories = safetyRatings?.map(s => s.category).join(', ') || 'N/A';
                    throw new Error(t('app.logs.editFailedSafety', language, categories));
                }
                throw new Error(t('app.logs.generationFailedNoImage', language));
            }
            
            const newImage: ImagePart = {
                base64: imagePart.inlineData.data,
                mimeType: imagePart.inlineData.mimeType,
                prompt: fullPrompt,
            };
            
            setGeneratedImages([newImage]);
            addLog(t('app.logs.generationComplete', language));
    
        } catch (e) {
            const error = e as Error;
            addLog(t('app.logs.generationError', language, error.message));
        } finally {
            setIsGenerating(false);
        }
    }, [addLog, language, promptParts, directBackgroundImage]);

    const onAnalyzeImage = useCallback(async (base64Data: string, mimeType: string) => {
        setIsGenerating(true);
        addLog('Analyzing image with Gemini...');
        try {
            // Fix: Update model from deprecated 'gemini-1.5-flash' to 'gemini-2.5-flash'
            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: {
                    parts: [
                        { text: t('geminiPrompts.analyzeOutfit', language) },
                        { inlineData: { data: base64Data, mimeType: mimeType } }
                    ]
                },
                config: {
                    responseMimeType: 'application/json',
                    // Fix: Update responseSchema to use Type enum
                    responseSchema: {
                        type: Type.OBJECT,
                        properties: {
                            outfit: {
                                type: Type.STRING,
                                description: 'A detailed description of the outfit worn by the person in the image.'
                            }
                        }
                    }
                }
            });
            const jsonStr = response.text.trim();
            const parsed = JSON.parse(jsonStr);
            setAnalyzedData(parsed);
            
            if (promptState.people[activePersonIndex]) {
                setPromptState(p => {
                    const newPeople = [...p.people];
                    newPeople[activePersonIndex] = { ...newPeople[activePersonIndex], customOutfit: parsed.outfit };
                    return { ...p, people: newPeople };
                });
            }
            addLog('Image analysis complete. Outfit applied.');

        } catch (e) {
            const error = e as Error;
            addLog(`Image analysis failed: ${error.message}`);
        } finally {
            setIsGenerating(false);
        }
    }, [addLog, language, activePersonIndex, promptState.people]);

    const executeImageEdit = useCallback(async (images: ImagePart[], editPrompt: string): Promise<ImagePart> => {
        addLog(`Editing image with prompt: ${editPrompt}`);
        const parts: ({ inlineData: { data: string; mimeType: string; } } | { text: string; })[] = images.map(img => ({ inlineData: { data: img.base64, mimeType: img.mimeType } }));
        parts.push({ text: editPrompt });

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash-image',
            contents: { parts },
            config: {
                responseModalities: [Modality.IMAGE],
            },
        });

        const imagePart = response.candidates?.[0]?.content?.parts?.find(p => p.inlineData);

        if (!imagePart?.inlineData) {
            const finishReason = response.candidates?.[0]?.finishReason;
            const safetyRatings = response.candidates?.[0]?.safetyRatings;
            if (finishReason === 'SAFETY') {
                const categories = safetyRatings?.map(s => s.category).join(', ') || 'N/A';
                throw new Error(t('app.logs.editFailedSafety', language, categories));
            }
            throw new Error(t('app.logs.editNoImage', language));
        }

        const newImage: ImagePart = {
            base64: imagePart.inlineData.data,
            mimeType: imagePart.inlineData.mimeType,
            prompt: editPrompt,
        };
        
        addLog('Image edit complete.');
        return newImage;
    }, [addLog, language]);

    const onEditImage = useCallback(async (images: ImagePart[], editPrompt: string) => {
        setIsGenerating(true);
        try {
            const newImage = await executeImageEdit(images, editPrompt);
            setLastEditedImage(newImage);
            setGeneratedImages([newImage]);
        } catch (e) {
            const error = e as Error;
            addLog(t('app.logs.editError', language, error.message));
        } finally {
            setIsGenerating(false);
        }
    }, [executeImageEdit, addLog, language]);

    const onProofShot = useCallback(async (image: ImagePart, texts: { overlayText: string, paperText: string }) => {
        let proofPromptParts: string[] = [];
        if (texts.overlayText) {
            proofPromptParts.push(`Add a subtle, semi-transparent EXIF data overlay in a corner of the image, similar to a digital camera date stamp. The overlay should contain the text: "${texts.overlayText}". The text should be in a simple, pixelated font.`);
        }
        if (texts.paperText) {
            proofPromptParts.push(`Subtly edit the image so the main subject is holding a small piece of paper. The paper should have the following text written on it: "${texts.paperText}". The edit should be seamless and photorealistic, matching the lighting and style of the original image.`);
        }
    
        if (proofPromptParts.length === 0) {
            addLog("No text provided for proof shot. Aborting.");
            return;
        }
    
        const fullProofPrompt = proofPromptParts.join(' ');
        
        setIsGenerating(true);
        try {
            const newImage = await executeImageEdit([image], fullProofPrompt);
            setLastEditedImage(newImage);
            setGeneratedImages([newImage]);
        } catch (e) {
            const error = e as Error;
            addLog(t('app.logs.editError', language, error.message));
        } finally {
            setIsGenerating(false);
        }
    }, [executeImageEdit, addLog, language]);
    
    const onProofShotForStyledImage = useCallback(async (image: ImagePart, texts: { overlayText: string, paperText: string }) => {
        let proofPromptParts: string[] = [];
        if (texts.overlayText) {
            proofPromptParts.push(`Add a subtle, semi-transparent EXIF data overlay in a corner of the image, similar to a digital camera date stamp. The overlay should contain the text: "${texts.overlayText}". The text should be in a simple, pixelated font.`);
        }
        if (texts.paperText) {
            proofPromptParts.push(`Subtly edit the image so the main subject is holding a small piece of paper. The paper should have the following text written on it: "${texts.paperText}". The edit should be seamless and photorealistic, matching the lighting and style of the original image.`);
        }
    
        if (proofPromptParts.length === 0) {
            addLog("No text provided for proof shot. Aborting.");
            return;
        }
    
        const fullProofPrompt = proofPromptParts.join(' ');
        
        setIsStyling(true);
        try {
            const newImage = await executeImageEdit([image], fullProofPrompt);
            setStyleTransferResult(prev => {
                if (!prev) return null;
                return {
                    ...prev,
                    styled: newImage,
                    styleKey: 'copyright_cert',
                };
            });
        } catch (e) {
            const error = e as Error;
            addLog(t('app.logs.editError', language, error.message));
        } finally {
            setIsStyling(false);
        }
    }, [executeImageEdit, addLog, language]);


    const onAnalyzeScene = useCallback(async (title: string) => {
        setIsAnalyzingScene(true);
        addLog(`Analyzing scene from title: ${title}`);
        try {
            const sceneData = await analyzeSceneFromTitle(title, language);
            setPromptState(p => ({ ...p, ...sceneData }));
            addLog('Scene analysis complete and applied.');
        } catch (e) {
            const error = e as Error;
            addLog(`Scene analysis failed: ${error.message}`);
        } finally {
            setIsAnalyzingScene(false);
        }
    }, [addLog, language]);

    const onAnalyzeCharacterOutfit = useCallback(async (title: string, character: string) => {
        setIsAnalyzingOutfit(true);
        addLog(`Analyzing outfit for ${character} from ${title}...`);
        try {
            const { outfit } = await analyzeOutfitFromCharacter(title, character, language);
            setPromptState(p => {
                const newPeople = [...p.people];
                if (newPeople[activePersonIndex]) {
                    newPeople[activePersonIndex].customOutfit = outfit;
                }
                return { ...p, people: newPeople };
            });
            addLog(`Outfit for ${character} applied.`);
        } catch (e) {
            const error = e as Error;
            addLog(`Outfit analysis failed: ${error.message}`);
        } finally {
            setIsAnalyzingOutfit(false);
        }
    }, [addLog, language, activePersonIndex]);

    const onGenerateVideoFromPrompt = useCallback(async (prompt: string, image?: ImagePart) => {
        setIsGeneratingVideo(true);
        addLog(`Generating video with prompt: ${prompt}`);
        try {
            let operation = await ai.models.generateVideos({
              model: 'veo-3.1-fast-generate-preview',
              prompt: prompt,
              image: image ? { imageBytes: image.base64, mimeType: image.mimeType } : undefined,
              config: {
                numberOfVideos: 1,
                resolution: '720p',
                aspectRatio: promptState.aspect === '9:16' || promptState.aspect === '3:4' ? '9:16' : '16:9'
              }
            });
            while (!operation.done) {
              await new Promise(resolve => setTimeout(resolve, 10000));
              operation = await ai.operations.getVideosOperation({operation: operation});
              addLog('Video generation in progress...');
            }
            
            const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;
            if (downloadLink) {
                const fullLink = `${downloadLink}&key=${process.env.API_KEY}`;
                addLog(`Video generated. Download link (valid for a short time): ${fullLink}`);
                window.open(fullLink, '_blank');
            } else {
                throw new Error('Video generation finished but no video URI was returned.');
            }

        } catch (e) {
            const error = e as Error;
            addLog(`Video generation failed: ${error.message}`);
        } finally {
            setIsGeneratingVideo(false);
        }
    }, [addLog, promptState.aspect]);
    
    const applyStyleTransfer = async (originalImage: ImagePart, stylePrompt: string, styleKey: string) => {
        setIsStyling(true);
        addLog(`Applying style: ${styleKey}`);
        try {
            // Fix: Update model from deprecated 'gemini-1.5-pro-latest' to 'gemini-2.5-flash-image'
            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash-image',
                contents: { parts: [{ inlineData: { data: originalImage.base64, mimeType: originalImage.mimeType } }, { text: stylePrompt }] },
                config: { responseModalities: [Modality.IMAGE] },
            });
            
            const imagePart = response.candidates?.[0]?.content?.parts?.find(p => p.inlineData);
            if (!imagePart?.inlineData) {
                const finishReason = response.candidates?.[0]?.finishReason;
                const safetyRatings = response.candidates?.[0]?.safetyRatings;
                if (finishReason === 'SAFETY') {
                    const categories = safetyRatings?.map(s => s.category).join(', ') || 'N/A';
                    throw new Error(t('app.logs.styleTransferFailedSafety', language, categories));
                }
                throw new Error(t('app.logs.styleTransferNoImage', language));
            }

            const newImage: ImagePart = {
                base64: imagePart.inlineData.data,
                mimeType: imagePart.inlineData.mimeType,
                prompt: stylePrompt,
            };
            setStyleTransferResult({ original: originalImage, styled: newImage, styleKey });
            addLog('Style transfer complete.');

        } catch (e) {
            const error = e as Error;
            addLog(`Style transfer failed: ${error.message}`);
        } finally {
            setIsStyling(false);
        }
    };
    
    const handleStyleButtonClick = (styleKey: string) => {
        const imageToStyle = getActiveImageForStyling();
        if (!imageToStyle) {
            addLog('Please generate or upload an image first before applying a style.');
            return;
        }
        const stylePrompt = t(`geminiPrompts.styleRegeneration.${styleKey}`, language);
        applyStyleTransfer(imageToStyle, stylePrompt, styleKey);
    };

    const onSora2StyleTransfer = () => {
        const imageToStyle = getActiveImageForStyling();
        if (!imageToStyle) {
            addLog('Please generate or upload an image first before applying a style.');
            return;
        }
        const stylePrompt = t('geminiPrompts.styleRegeneration.sora2', language);
        applyStyleTransfer(imageToStyle, stylePrompt, 'sora2');
    };

    const onCustomStyleTransfer = (stylePrompt: string) => {
        if (!stylePrompt.trim()) return;
        const imageToStyle = getActiveImageForStyling();
        if (!imageToStyle) {
            addLog('Please generate or upload an image first before applying a style.');
            return;
        }
        const fullPrompt = t('geminiPrompts.customStyleRegeneration', language, stylePrompt);
        applyStyleTransfer(imageToStyle, fullPrompt, `custom:${stylePrompt}`);
    };

    const onColorizeImage = (color: string) => {
        const imageToStyle = getActiveImageForStyling();
        if (!imageToStyle) {
            addLog('Please generate or upload an image first before applying a color change.');
            return;
        }
        const prompt = t('geminiPrompts.colorizeImage', language, color);
        applyStyleTransfer(imageToStyle, prompt, `color:${color}`);
    };
    
    const onRealifyImage = async (sourceImage: ImagePart) => {
        setIsStyling(true);
        addLog(t('app.logs.realifying', language));
        try {
            const prompt = t('geminiPrompts.realifyImage', language);
            
            // Fix: Update model from deprecated 'gemini-1.5-pro-latest' to 'gemini-2.5-flash-image'
            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash-image',
                contents: { parts: [{ inlineData: { data: sourceImage.base64, mimeType: sourceImage.mimeType } }, { text: prompt }] },
                config: { responseModalities: [Modality.IMAGE] },
            });

            const imagePart = response.candidates?.[0]?.content?.parts?.find(p => p.inlineData);
            if (!imagePart?.inlineData) {
                const finishReason = response.candidates?.[0]?.finishReason;
                const safetyRatings = response.candidates?.[0]?.safetyRatings;
                if (finishReason === 'SAFETY') {
                    const categories = safetyRatings?.map(s => s.category).join(', ') || 'N/A';
                    throw new Error(t('app.logs.realifyFailedSafety', language, categories));
                }
                throw new Error(t('app.logs.realifyNoImage', language));
            }

            const newImage: ImagePart = {
                base64: imagePart.inlineData.data,
                mimeType: imagePart.inlineData.mimeType,
                prompt: prompt,
            };
            setStyleTransferResult({ original: sourceImage, styled: newImage, styleKey: 'realify' });
            addLog(t('app.logs.realifyComplete', language));

        } catch (e) {
            const error = e as Error;
            addLog(t('app.logs.realifyError', language, error.message));
        } finally {
            setIsStyling(false);
        }
    };
    
    const handleAcceptStyledImage = (image: ImagePart, combinedPrompt: string, styleKey: string) => {
        const updatedImage = { ...image, prompt: combinedPrompt };
        setGeneratedImages([updatedImage]);
        setLastEditedImage(updatedImage);
        setStyleTransferResult(null);
        if (styleKey !== 'realify' && !styleKey.startsWith('color:') && styleKey !== 'copyright_cert') {
            setPromptState(p => ({...p, activeStyle: styleKey}));
        }
        addLog('Accepted styled image. It is now the primary image.');
    };
    
    const handleAnalyzeRealifiedImage = async (image: ImagePart) => {
        setIsAnalyzingRealifiedPrompt(true);
        setRealifiedPrompt(null);
        addLog(t('app.logs.analyzingRealifiedPrompt', language));
        try {
            const prompt = await analyzeRealifiedImageForPrompt(image.base64, image.mimeType, language, analyzedPromptVerbosity);
            setRealifiedPrompt(prompt);
            addLog(t('app.logs.analyzingRealifiedPromptComplete', language));
        } catch (e) {
            const error = e as Error;
            addLog(t('app.logs.analyzingRealifiedPromptError', language, error.message));
        } finally {
            setIsAnalyzingRealifiedPrompt(false);
        }
    };

    const toggleLanguage = () => {
        setLanguage(l => l === 'ko' ? 'en' : 'ko');
    };

    const isAnyItemBeingEdited = isGenerating || isStyling || isColorizing;
    
    const defaultProofShotText = useMemo(() => {
        const camera = promptState.cameraBody || "NIKON Z 9";
        const lens = promptState.lensSelect || "85mm F1.2";
        const date = new Date();
        const formattedDate = `${date.getFullYear()}:${(date.getMonth() + 1).toString().padStart(2, '0')}:${date.getDate().toString().padStart(2, '0')}`;
        return `${camera} ${lens} ${formattedDate}`;
    }, [promptState.cameraBody, promptState.lensSelect]);

    const handleSurpriseMe = useCallback(() => {
        addLog(t('app.logs.surprise', language));

        const randomOption = (options: { v: string }[]) => any(options.filter(o => o.v && o.v !== '__random__')).v;

        setPromptState(prevState => {
            const numPeople = Math.floor(Math.random() * 2) + 1; // 1 or 2 people
            const newPeople: PersonState[] = [];

            for (let i = 0; i < numPeople; i++) {
                const randomPreset = any(PRESETS_DATA.filter(p => !p.outfit.startsWith('__random')));
                newPeople.push({
                    ...createDefaultPerson(i + 1),
                    ageSelect: randomOption(AGE_OPTIONS),
                    characterSelect: randomOption(CHARACTER_OPTIONS),
                    hairStyle: randomOption(HAIR_STYLE_OPTIONS),
                    hairColor: randomOption(HAIR_COLOR_OPTIONS),
                    customOutfit: randomPreset.outfit,
                });
            }

            return {
                ...prevState,
                aspect: randomOption(ASPECT_RATIOS),
                customAR: '',
                cameraBody: any(CAMERA_BODIES).v,
                lensSelect: any(LENSES).v,
                exposure: 'ISO 100, 1/125s',
                wb: '',
                cameraComposition: randomOption(CAMERA_COMPOSITION_OPTIONS),
                timeOfDay: any(TIME_OF_DAY_OPTIONS).v,
                weather: any(WEATHER_OPTIONS).v,
                background: any(BACKGROUND_OPTIONS).v,
                atmosphere: '',
                removeBackground: false,
                numberOfPeople: String(numPeople),
                people: newPeople,
                customSubject: '',
                pose: any(RANDOM_POSES),
                vehicle: Math.random() < 0.2 ? randomOption(VEHICLE_OPTIONS) : '',
                pet: Math.random() < 0.15 ? randomOption(PET_OPTIONS) : '',
                eraSelect: Math.random() < 0.3 ? randomOption(ERA_OPTIONS) : '',
                activeStyle: '',
                fixedPrompts: ['quality', 'details', 'photo'],
            };
        });
    }, [addLog, language]);
    
    return (
        <div className="bg-[#11101d] min-h-screen text-slate-200 font-sans">
            <Header 
                presetCount={presets.length}
                legwearCount={LEGWEAR_OPTIONS.length}
                shoeCount={SHOES.length}
                onShowManual={() => setShowManual(true)}
                language={language}
                toggleLanguage={toggleLanguage}
            />
            <main className="p-4 grid grid-cols-1 xl:grid-cols-2 gap-4 items-start">
                <ControlPanel
                    presets={presets}
                    setPresets={setPresets}
                    promptState={promptState}
                    setPromptState={setPromptState}
                    addLog={addLog}
                    isGenerating={isGenerating}
                    analyzedData={analyzedData}
                    setAnalyzedData={setAnalyzedData}
                    onAnalyzeImage={onAnalyzeImage}
                    onEditImage={onEditImage}
                    editPrompt={editPrompt}
                    setEditPrompt={setEditPrompt}
                    isEditPromptDirty={isEditPromptDirty}
                    setIsEditPromptDirty={setIsEditPromptDirty}
                    setLastEditedImage={setLastEditedImage}
                    directBackgroundImage={directBackgroundImage as any}
                    setDirectBackgroundImage={setDirectBackgroundImage as any}
                    isAnalyzingScene={isAnalyzingScene}
                    onAnalyzeScene={onAnalyzeScene}
                    activePersonIndex={activePersonIndex}
                    setActivePersonIndex={setActivePersonIndex}
                    isAnalyzingOutfit={isAnalyzingOutfit}
                    onAnalyzeCharacterOutfit={onAnalyzeCharacterOutfit}
                    isGeneratingVideo={isGeneratingVideo}
                    onGenerateVideoFromPrompt={onGenerateVideoFromPrompt}
                    onStyleButtonClick={handleStyleButtonClick}
                    onSora2StyleTransfer={onSora2StyleTransfer}
                    onCustomStyleTransfer={onCustomStyleTransfer}
                    onColorizeImage={onColorizeImage}
                    isColorizing={isColorizing}
                    setIsColorizing={setIsColorizing}
                    language={language}
                    activeVisionFeature={activeVisionFeature}
                    setActiveVisionFeature={setActiveVisionFeature}
                    uploadedImageData1={uploadedImageData1}
                    setUploadedImageData1={setUploadedImageData1}
                    onRealifyImage={onRealifyImage}
                    uploadedImageDataRealify={uploadedImageDataRealify}
                    setUploadedImageDataRealify={setUploadedImageDataRealify}
                />
                <div className="flex flex-col gap-4">
                    <PromptDisplay
                        promptParts={promptParts}
                        statusBarText={statusBarText}
                        logs={logs}
                        clearPrompt={clearPrompt}
                        addLog={addLog}
                        onRegenerate={onRegenerate}
                        language={language}
                        promptVerbosity={promptVerbosity}
                        setPromptVerbosity={setPromptVerbosity}
                    />
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <ImagePreview
                            generatedImages={generatedImages}
                            isGenerating={isGenerating}
                            onProofShot={onProofShot}
                            onCreateVideo={onGenerateVideoFromPrompt}
                            onEditColor={(image) => setEditingImage(image)}
                            isAnyItemBeingEdited={isAnyItemBeingEdited}
                            isProcessing={isGenerating}
                            isGeneratingVideo={isGeneratingVideo}
                            language={language}
                            addLog={addLog}
                            defaultProofShotText={defaultProofShotText}
                            onImageClick={(image) => setSelectedImage(image)}
                        />
                        <StyleTransferPreview
                            result={styleTransferResult}
                            isStyling={isStyling}
                            onAccept={handleAcceptStyledImage}
                            onClear={() => { setStyleTransferResult(null); setRealifiedPrompt(null); }}
                            language={language}
                            addLog={addLog}
                            onImageClick={(image) => setSelectedImage(image)}
                            onEditColor={(image) => setEditingImage(image)}
                            isAnyItemBeingEdited={isAnyItemBeingEdited}
                            isProcessing={isStyling || isAnalyzingRealifiedPrompt}
                            realifiedPrompt={realifiedPrompt}
                            isAnalyzingRealifiedPrompt={isAnalyzingRealifiedPrompt}
                            onAnalyzeRealifiedImage={handleAnalyzeRealifiedImage}
                            analyzedPromptVerbosity={analyzedPromptVerbosity}
                            setAnalyzedPromptVerbosity={setAnalyzedPromptVerbosity}
                            onProofShot={onProofShotForStyledImage}
                            defaultProofShotText={defaultProofShotText}
                        />
                    </div>
                </div>
            </main>

            <div className="fixed top-1/2 right-6 -translate-y-1/2 z-30 flex flex-col items-center gap-4">
                <button
                    onClick={onGenerateImage}
                    disabled={isGenerating}
                    className="w-24 h-24 rounded-full bg-gradient-to-r from-fuchsia-500 to-purple-600 text-white font-semibold flex items-center justify-center text-center text-sm p-2 transition-all shadow-[0_0_15px_rgba(240,47,194,0.4)] hover:shadow-[0_0_25px_rgba(147,51,234,0.8)] active:opacity-80 disabled:from-slate-600 disabled:to-slate-700 disabled:shadow-none disabled:cursor-not-allowed transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-[#11101d] focus:ring-fuchsia-500"
                    title={t('imagePreview.generateButton', language)}
                >
                    {isGenerating ? (
                        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-white"></div>
                    ) : (
                        t('imagePreview.generateButton', language)
                    )}
                </button>

                <button
                    onClick={handleSurpriseMe}
                    disabled={isAnyItemBeingEdited}
                    className="w-24 h-24 rounded-full bg-gradient-to-r from-cyan-400 to-lime-400 text-slate-800 flex flex-col items-center justify-center text-center text-sm p-2 font-semibold transition-all shadow-lg hover:shadow-xl active:opacity-80 disabled:from-slate-600 disabled:to-slate-700 disabled:text-white disabled:shadow-none disabled:cursor-not-allowed transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-[#11101d] focus:ring-cyan-500"
                    title={t('app.buttons.surpriseTitle', language)}
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M21.58,10.05L20.12,8.59L18.23,10.47L13.5,5.74L15.38,3.85L13.93,2.39L12,4.32L10.07,2.39L8.62,3.85L10.5,5.74L5.77,10.47L3.88,8.59L2.42,10.05L4.31,12L2.42,13.95L3.88,15.41L5.77,13.53L10.5,18.26L8.62,20.15L10.07,21.61L12,19.68L13.93,21.61L15.38,20.15L13.5,18.26L18.23,13.53L20.12,15.41L21.58,13.95L19.69,12L21.58,10.05M12,13.24L10.76,12L12,10.76L13.24,12L12,13.24Z" />
                    </svg>
                    <span className="mt-1">{t('app.buttons.surprise', language)}</span>
                </button>

                <button
                    onClick={clearPrompt}
                    disabled={isGenerating}
                    className="w-24 h-24 rounded-full bg-slate-700 hover:bg-slate-600 text-white flex flex-col items-center justify-center text-center text-sm p-2 transition-all shadow-lg hover:shadow-xl active:opacity-80 disabled:bg-slate-500 disabled:shadow-none disabled:cursor-not-allowed transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-[#11101d] focus:ring-slate-500"
                    title={t('app.buttons.resetTitle', language)}
                >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" className="w-8 h-8">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0011.667 0l3.181-3.183m-4.991-2.693-3.182-3.182a4.5 4.5 0 00-6.364 0l-3.182 3.182" />
                    </svg>
                    <span className="mt-1">{t('app.buttons.reset', language)}</span>
                </button>
            </div>

            {showManual && <Manual onClose={() => setShowManual(false)} language={language} />}
            {selectedImage && <ImageModal image={selectedImage} onClose={() => setSelectedImage(null)} language={language} />}
            {editingImage && <ImageEditModal 
                image={editingImage} 
                onClose={() => setEditingImage(null)} 
                language={language} 
                isProcessing={isColorizing}
                addLog={addLog}
                onApply={async (source, mask, color) => {
                    setEditingImage(null);
                    setIsColorizing(true);
                    try {
                        const prompt = t('geminiPrompts.maskedEditPrompt', language, color);
                        const newImage = await executeImageEdit([source, mask], prompt);
                        setLastEditedImage(newImage);
                        setGeneratedImages([newImage]);
                    } catch(e) {
                        const error = e as Error;
                        addLog(`Color edit failed: ${error.message}`);
                    } finally {
                        setIsColorizing(false);
                    }
                }}
            />}
        </div>
    );
};

// Fix: Add default export to resolve module import error.
export default App;